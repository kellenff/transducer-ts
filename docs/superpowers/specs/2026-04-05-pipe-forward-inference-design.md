# Pipe Forward Type Inference

Addresses [issue #5](https://github.com/kellenff/transducer-ts/issues/5): `pipe` does not propagate type inference forward into subsequent transducer callbacks.

## Problem

When composing transducers via `pipe`, the callback parameter of the second (and subsequent) transducers is inferred as `unknown` instead of the output type of the preceding transducer:

```ts
pipe(
  filter((l: Lap) => !l.excluded),
  map((l) => l.fuelUsedLiters), // error TS18046: 'l' is of type 'unknown'
);
```

**Root cause:** The current `pipe` uses a variadic generic with `BuildConstraint` — a mapped type that validates adjacent transducer compatibility after TypeScript has already resolved each transducer's generic parameters independently. By the time `BuildConstraint` runs, `map`'s `A` has already been inferred as `unknown`.

## Approach

Replace the variadic `BuildConstraint` machinery with 21 explicit overload signatures that chain generic parameters, enabling TypeScript's left-to-right contextual inference. Add a `PreservingTransducer` type for element-preserving transducers (`take`, `drop`) that is dual-callable on iterables.

## Design

### 1. `PreservingTransducer` type

New exported interface in `src/types/index.ts`:

```ts
export interface PreservingTransducer {
  /** Standalone: directly callable on iterables */
  <T>(coll: Iterable<T>): readonly T[];
  /** Transducer: transforms a reducing function (must be last for inference) */
  <R, A>(rf: StepFn<R, A>): StepFn<R, A>;
}
```

The transducer call signature must be last in the interface — TypeScript uses the last call signature for type inference when a multi-overloaded value appears in a generic parameter position (e.g., inside a `pipe` overload).

Existing types (`Transducer<A, B>`, `Reducer`, `StepFn`, `Reduced`, `reduced`, `isReduced`) are unchanged.

### 2. `pipe` overloads

Delete `BuildConstraint`, `PipeResult`, `PrevIdx`, `EnforceMaxArity`, `PipeTypeError`, `TransducerInput`, `TransducerOutput`, `LastOf`, `MaxCheckedArity`, `SupportedPipeLengths`.

Replace with 21 explicit overload signatures chaining generic parameters A through V:

```ts
export function pipe<A, B>(t1: Transducer<A, B>): Transducer<A, B>;
export function pipe<A, B, C>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
): Transducer<A, C>;
export function pipe<A, B, C, D>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
): Transducer<A, D>;
// ... through 21 parameters (type params A through V)
```

Plus one variadic fallback for 22+ transducers (loses forward inference):

```ts
export function pipe(...xforms: Transducer<any, any>[]): Transducer<any, any>;
```

Runtime implementation unchanged:

```ts
export function pipe(...xforms: Transducer<any, any>[]): Transducer<any, any> {
  return (rf) => xforms.reduceRight((acc, xf) => xf(acc), rf);
}
```

**How inference flows:** Each overload parameter's type is constrained by the previous output generic. TypeScript resolves left-to-right: if `t1` resolves `B = Lap`, then `t2`'s `Transducer<B, C>` contextually types its callback with `B = Lap`.

**PreservingTransducer compatibility:** When `take(5)` appears as e.g. `t3` expecting `Transducer<C, D>`, TypeScript instantiates `PreservingTransducer`'s generic `A` to match `C`, yielding `D = C`.

**Mismatch errors:** Standard TypeScript "no overload matches this call" with the problematic argument highlighted.

### 3. `take` and `drop` — dual-callable

Both functions change return type from `Transducer<A, A>` to `PreservingTransducer`. The generic type parameter `<A>` is removed from their public signatures:

```ts
// Before
export function take<A>(n: number): Transducer<A, A>;

// After
export function take(n: number): PreservingTransducer;
```

Runtime detects argument type via `typeof arg === 'function'` — function means transducer mode, otherwise standalone mode. The standalone path is self-contained (trivial iteration loop, no imports needed, no circular dependencies):

- `take(n)` standalone: iterate up to `n` elements
- `drop(n)` standalone: skip `n`, collect the rest

### 4. Consumer overloads

`sequence`, `into`, `transduce`, and `toFn` each get a `PreservingTransducer` overload before their existing generic signature:

```ts
export function sequence<A>(
  xform: PreservingTransducer,
  coll: Iterable<A>,
): A[];
export function sequence<A, B>(xform: Transducer<A, B>, coll: Iterable<A>): B[];
```

This ensures correct inference even if TypeScript's multi-overload matching has edge cases when `PreservingTransducer` is matched against `Transducer<A, B>`.

## Testing

Guided by the principle that the type system is the contract layer. Type-level tests are the contract tests. Per-module tests are the unit tests. Integrated tests in `src/index.test.ts` exist as smoke tests for wiring — they don't verify inference or type propagation.

### Type-level contract tests (`src/index.test-d.ts`)

The primary verification layer:

- **Forward inference contracts (new):** Assert that callbacks after the first infer their parameter types from the preceding transducer's output. Multiple arities (2, 3, 6, 10+) where only the first callback is annotated. This is the test that would have caught issue #5.
- **PreservingTransducer contracts (new):** `take(3)` is `PreservingTransducer`. `take(3)([1,2,3])` is `readonly number[]`. `sequence(take(3), [1,2,3])` is `number[]`.
- **Consumer overload contracts (new):** `sequence`, `into`, `transduce`, `toFn` each correctly infer through `PreservingTransducer`.
- **Mismatch detection (rewritten):** `@ts-expect-error` for "no overload matches" at positions 1, 3, 9. Variadic fallback test for 22+.
- **Existing per-transducer contracts (updated):** Remove `take<number>` / `drop<string>` generic params.

### Per-module unit tests

New tests in `src/take/index.test.ts` and `src/drop/index.test.ts` for the standalone callable path:

- Takes/drops first n from array
- Works with any `Iterable` (Set, generator)
- `n` > length returns all / empty as appropriate
- `n = 0` edge case
- Negative `n` edge case

### Existing integrated tests (`src/index.test.ts`)

Left unchanged. Runtime didn't change; these continue passing as-is.

## Breaking changes

| Change                                                   | Impact                                 | Migration                                                |
| -------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------- |
| `take<T>(n)` / `drop<T>(n)` no longer accept type params | Compile error on explicit generic args | Delete the type parameter: `take<number>(3)` → `take(3)` |
| `PipeTypeError` branded type removed                     | Code referencing it breaks             | Remove references (unlikely outside this repo)           |
| Pipe mismatch errors change text                         | Different diagnostic messages          | No code change                                           |
| `take(n)` / `drop(n)` dual-callable                      | Additive                               | None                                                     |
| `PreservingTransducer` exported                          | Additive                               | None                                                     |
| Consumer overloads for `PreservingTransducer`            | Additive                               | None                                                     |

Runtime is fully backward compatible. Recommended version bump: **minor**.
