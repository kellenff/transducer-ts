# API reference

All exports are also available from the package root. Each concept additionally has a **subpath** export (see [Package layout](./package-layout.md)).

## Types

### `Reducer<A, B>`

```typescript
type Reducer<A, B> = (acc: A, input: B) => A;
```

Standard reducer used with `transduce` when you do not need to return `Reduced`.

### `StepFn<R, A>`

```typescript
type StepFn<R, A> = (acc: R, input: A) => R | Reduced<R>;
```

Step function used internally by transducers; `transduce` accepts `StepFn` when early termination from the **reducing** side is needed.

### `Transducer<A, B>`

```typescript
type Transducer<A, B> = <R>(rf: StepFn<R, B>) => StepFn<R, A>;
```

Transforms a step that consumes `B` into a step that consumes `A`.

### `PreservingTransducer`

Branded transducer for operations that keep the same element type (`take`, `drop`). It is:

- **callable as a transducer:** `<R, A>(rf: StepFn<R, A>) => StepFn<R, A>`
- **callable on an iterable:** `<T>(coll: Iterable<T>) => readonly T[]`

See [Concepts](./concepts.md).

### `Reduced<T>`

```typescript
interface Reduced<T> {
  readonly value: T;
  readonly __reduced: true;
}
```

Sentinel for early termination. Construct with `reduced`, test with `isReduced`.

### `reduced(value)`

Wraps `value` in `Reduced<T>`.

### `isReduced(x)`

Type guard: true if `x` is a `Reduced` value.

---

## Transducers

### `map<A, B>(f: (a: A) => B): Transducer<A, B>`

Applies `f` to each element that reaches this step.

```typescript
sequence(map((x: number) => x * 2), [1, 2, 3]);
// => [2, 4, 6]
```

### `filter<A>(pred: (a: A) => boolean): Transducer<A, A>`

Keeps elements for which `pred` returns true. **Does not narrow** the type parameter: output type remains `A`. Use `filterGuard` when you need a type guard.

```typescript
sequence(filter((x: number) => x % 2 === 0), [1, 2, 3, 4]);
// => [2, 4]
```

### `filterGuard<A, B extends A>(pred: (a: A) => a is B): Transducer<A, B>`

Like `filter`, but the predicate is a **type guard**, so the element type narrows to `B`.

```typescript
const isString = (x: string | number): x is string => typeof x === "string";
sequence(filterGuard(isString), [1, "a", 2, "b"]);
// => ["a", "b"]
```

### `take<A>(n: number): PreservingTransducer`

Emits at most the first `n` elements after this point in the pipeline, then signals completion via `Reduced`. Negative `n` is treated as **0** (Clojure semantics): result is empty.

Standalone on iterables:

```typescript
take(3)([1, 2, 3, 4, 5]);
// => [1, 2, 3] (readonly array)
```

### `drop<A>(n: number): PreservingTransducer`

Skips the first `n` elements. Negative `n` is treated as **0**: no elements skipped.

```typescript
drop(2)([1, 2, 3, 4, 5]);
// => [3, 4, 5]
```

---

## Composition

### `pipe(...transducers): Transducer<A, B>`

Composes transducers **left to right** with TypeScript inference through each step. There are explicit overloads for **up to 21** transducers; longer chains rely on a looser implementation signature (weaker typing). Order matters: `pipe(a, b)` applies `a` then `b` to each logical step of input.

```typescript
const xform = pipe(
  filter((x: number) => x > 2),
  map((x: number) => x * 10),
  take(3),
);
sequence(xform, [1, 2, 3, 4, 5, 6]);
// => [30, 40, 50]
```

Type mismatches at a join between transducers surface as **standard overload errors** from `pipe`.

---

## Execution

### `sequence<A, B>(xform: Transducer<A, B>, coll: Iterable<A>): B[]`

Eagerly runs `xform` over `coll`, collects outputs into a **new** array.

### `into<A, B>(to: B[], xform: Transducer<A, B>, from: Iterable<A>): B[]`

Appends transduced elements into **`to`** (mutating `to` via `push`) and returns the same reference.

### `transduce<A, B, R>(xform, rf, init, coll): R`

Runs `xform` with a custom reducer or step function:

- `rf: Reducer<R, B>` — cannot return `Reduced`; early exit comes from transducers only.
- `rf: StepFn<R, B>` — reducer may return `reduced(acc)` for custom early exit.

Additional overloads accept `PreservingTransducer` so `take` / `drop`-only pipelines participate in the same typing story as `Transducer`.

### `toFn(xform)`

Wraps a transducer as **data-last** `(coll: Iterable<A>) => B[]`, delegating to `sequence`. Handy when composing with other “pipe-first” utilities.

---

## Re-exports

The barrel `src/index.ts` re-exports everything above from `./types`, `./map`, `./filter`, `./filterGuard`, `./take`, `./drop`, `./pipe`, `./transduce`, `./into`, `./sequence`, `./toFn`.
