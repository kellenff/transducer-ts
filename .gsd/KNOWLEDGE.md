# Knowledge Base

<!-- Append-only. Non-obvious lessons, gotchas, and patterns discovered during execution.
     Only add entries that save future agents from repeating investigation or hitting the same issues. -->

## TypeScript: Mapped tuple type vs recursive conditional for arity-checking

**Context:** M002/S01 — implementing BuildConstraint for pipe's type parameter.

`BuildConstraint` uses a **mapped type** over the tuple keys (`{ [K in keyof T]: ... }`), not a recursive conditional type (`T extends [infer H, ...infer Rest]`). This is the correct pattern for checking adjacent-pair compatibility in a tuple:

- A mapped type iterates each key in O(1) per position; no recursion depth ceiling.
- `K extends \`${infer I extends number}\`` extracts the numeric index from the string key.
- `PrevIdx<I>` (a lookup tuple) gives the predecessor index in O(1).

**The recursion depth concern in the milestone plan is a non-issue** for this approach — it only applies to recursive conditional types that peel the tuple head repeatedly. Use mapped types for positional constraint checking.

---

## TypeScript: PrevIdx lookup tuple pattern for predecessor index access

**Context:** M002/S01 — BuildConstraint needs "what was the index before K?"

```typescript
type PrevIdx<I extends number> = [never, 0, 1, 2, 3, 4, 5, ...][I];
```

- Index 0 maps to `never` (no predecessor).
- Index N maps to N-1.
- Extend the tuple to support higher arities (currently covers 0–20).
- This is O(1) and type-checks at compile time with no recursion.

If you need the *next* index instead, reverse the pattern: `[1, 2, 3, 4, ...]` where index N maps to N+1.

---

## TypeScript: Rest-element inference for last tuple element

**Context:** M002/S01 — PipeResult needs the output type of the last transducer.

```typescript
type LastOf<T extends readonly any[]> = T extends readonly [...any[], infer L] ? L : never;
```

This is idiomatic TypeScript 4.2+ and simpler than `Extract<keyof T, \`${number}\`>` index gymnastics. Use `[...any[], infer L]` whenever you need the last element of a tuple type.

---

## tsc DTS: Module-private types stay unexported

**Context:** M002/S01 — verified that tsc preserves module-private type aliases.

tsc (and tsup, previously used) faithfully maps source `export` presence to DTS export presence:
- `type Foo = …` (no `export`) → emitted as `type Foo = …` in `.d.ts`, NOT in the `export { … }` block.
- `export type Foo = …` → emitted in both the body and the export block.

**No compiler configuration is needed** to keep helper types unexported. Just don't write `export` on them in the source. This pattern is reliable and can be used in any tsc-built module to expose internal type aliases for human inspection (via `.d.ts` readability) without making them part of the public API.

---

## TypeScript: `const T` inference requires inline transducer literals

**Context:** M002/S01 — the single generic `pipe` signature uses `const T` to infer a readonly tuple.

`const T` inference captures the transducers as a literal tuple type, enabling `BuildConstraint` to check each pair. This breaks if callers spread a pre-declared typed array:

```typescript
// ✅ works — tuple inferred
const xform = pipe(map(f), filter(pred));

// ❌ may not check constraints — T inferred as Transducer<any, any>[]
const steps: Transducer<any, any>[] = [map(f), filter(pred)];
const xform = pipe(...steps);
```

This is a known TypeScript limitation with variadic tuples and `const` inference. Document it in consumer-facing JSDoc if the API is likely to be called with spread arrays.

---

## TypeScript: `const T` captures ternary literals as unions, not base types

**Context:** M002/S02 — type-level tests for pipe's high-arity inference.

When `pipe` uses `const T` inference, arrow functions with ternary returns get their output type captured as a literal union:

```typescript
// ❌ const T infers output as 0 | 1, not number
map((x: boolean) => (x ? 1 : 0))

// ✅ Explicit return annotation forces number
map((x: boolean): number => (x ? 1 : 0))
```

This matters in test code where `toEqualTypeOf<Transducer<A, number>>()` fails because the actual inferred type is `Transducer<A, 0 | 1>`. Always use explicit return type annotations on map callbacks in type-level tests when the return value is a literal expression.

---

## TypeScript: BuildConstraint capacity scales with PrevIdx tuple length

**Context:** M002/S02 — verifying that 15-arity pipe chains work.

`PrevIdx` is a fixed-length lookup tuple. The current implementation covers indices 0–20 (21 entries), meaning `BuildConstraint` enforces type constraints for chains of up to 21 transducers. For longer chains, TypeScript falls back to unconstrained behavior rather than erroring — it silently stops checking after position 20.

To extend capacity, simply add more entries to `PrevIdx` in `src/pipe/index.ts`. Each entry costs zero runtime overhead.

The 15-arity test (max index 14) is well within bounds. If a future test needs 25-arity, extend `PrevIdx` to 25 entries first.

---

## Vitest: `@ts-expect-error` only suppresses the immediately following line

**Context:** M002/S02 — mismatch detection tests for pipe.

In multi-line function calls, `@ts-expect-error` must go on the line immediately before the specific argument that has the type error — not before the function call:

```typescript
// ❌ Unused directive — error is on filter() line, not pipe() line
// @ts-expect-error
pipe(
  map((x: number) => String(x)),
  filter((x: boolean) => x),  // actual error is here
);

// ✅ Directive on the line before the mismatched argument
pipe(
  map((x: number) => String(x)),
  // @ts-expect-error — string output doesn't match boolean input
  filter((x: boolean) => x),
);
```

---

## transducer-ts: `filter()` preserves input element type — cannot narrow unions within `pipe()`

**Context:** M003/S01 — lodash/remeda/ramda example files.

`filter(pred)` in transducer-ts preserves the input element type `A` — it does not narrow to a subtype even when `pred` is a type guard. This means you cannot write:

```typescript
// ❌ type is still string[] | number[], not string[]
const xform = pipe(filter((x: string | number): x is string => typeof x === "string"));
```

**Workaround:** Use a two-step `sequence()` call and cast at the call site if narrowing is needed. The example files avoid mixed-union inputs rather than documenting a complex workaround. This is a known TypeScript limitation with higher-order function type inference.

---

## fp-ts: Subtype casts fail under `exactOptionalPropertyTypes` — use `getOrElse()`

**Context:** M003/S02 — fp-ts example file.

Under `exactOptionalPropertyTypes: true`, attempting to narrow `Option<A>` to `Some<A>` via `as Some<A>` fails because `Some.value` is required but the general `Option` type has `value` as an optional property. The pattern `(opt as O.Some<A>).value` causes a type error.

**Correct pattern:**
```typescript
// ✅ safe extraction — works under exactOptionalPropertyTypes
O.getOrElse(() => defaultValue)(option)
```

This applies to any fp-ts type where `fold`/`match` or `getOrElse` is the idiomatic accessor.

---

## itertools: lowercase `takewhile` (not `takeWhile`)

**Context:** M003/S02 — itertools example file.

The itertools npm package exports `takewhile` in all lowercase, not `takeWhile`. This differs from the camelCase convention used by most JS utility libraries. Always check actual exports when using itertools — `izip`, `chunked`, `chain`, `takewhile`, `islice` are all lowercase or abbreviated.

---

## Ramda/Rambda: `@@transducer/` protocol is incompatible with transducer-ts

**Context:** M003/S01 — ramda and rambda example files.

Ramda and Rambda implement their own transducer protocol using transformer objects (`{ '@@transducer/step': fn, '@@transducer/init': fn, '@@transducer/result': fn }`). This is **not compatible** with transducer-ts, which uses plain `StepFn<R, A>` functions.

**The correct integration pattern** is to use fully-applied ramda/rambda functions as **callbacks** inside transducer-ts transducers, never as transducers directly:

```typescript
// ✅ R.add(1) is a fully-applied (x: number) => number
sequence(map(R.add(1)), [1, 2, 3])

// ❌ R.map(f) returns a transformer object, not a StepFn
sequence(R.map(R.add(1)), [1, 2, 3])  // wrong shape at runtime
```

Any ramda/rambda function that has been fully applied (not waiting for more arguments) is a plain function and works as a map/filter callback.

---

## Rambda 11.x API diverges significantly from Ramda

**Context:** M003/S01 — rambda example file.

Rambda 11.x has moved away from being a ramda subset and now focuses on collection/object utilities. It **does not include** `R.add`, `R.multiply`, `R.negate`, `R.inc`, `R.dec`, or other arithmetic helpers that ramda exports. Test against actual Rambda exports rather than assuming parity with ramda.

---

## npm pack fails under Yarn PnP — use yarn pack

**Context:** M004/S02 — verifying llms.txt appears in npm tarball.

`npm pack --dry-run` triggers the `prepare` lifecycle script, which runs `husky`. Under Yarn PnP, `husky` isn't on the system PATH (it's managed by PnP), so npm fails with `sh: husky: command not found`.

**Use `yarn pack --dry-run` instead.** It lists included files without triggering lifecycle scripts and works correctly under PnP.
