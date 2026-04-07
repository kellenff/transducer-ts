# Types, `pipe`, and inference

## How `pipe` infers types

`pipe` is implemented as a **series of overloads**, each adding one transducer to the chain. Type parameters line up so that the output of transducer *i* must match the input of transducer *i + 1*:

- `Transducer<A, B>` then `Transducer<B, C>` yields `Transducer<A, C>`.

When inference fails, TypeScript reports errors on the `pipe` call (argument incompatibility), not a custom library error type.

## Arity limit

Overloads cover **up to 21** transducers. Beyond that, you still can call `pipe` at runtime, but types fall back to the implementation signature and inference is **weaker**. Prefer extracting sub-pipelines:

```typescript
const part = pipe(map(f), filter(p));
const whole = pipe(part, take(3)); // if `pipe(...)` gets too long
```

## `const` tuple and spread caveat

For `pipe` to enforce compatibility, TypeScript benefits from **inline** transducer expressions or tuples typed as a **const** chain. Spreading a **pre-typed** array of transducers can lose positional constraints. If you need dynamic composition, you may need explicit annotations or smaller fixed `pipe` calls.

## `filter` vs `filterGuard`

| | `filter` | `filterGuard` |
|---|----------|----------------|
| Predicate | `(a: A) => boolean` | `(a: A) => a is B` |
| Result type | `Transducer<A, A>` | `Transducer<A, B>` |
| Type narrowing | No | Yes |

This mirrors common FP practice: **boolean** `filter` does not prove a type refinement to the compiler; **guards** do.

## Why `PreservingTransducer` exists

Both `filter` and `take` could be thought of as `Transducer<A, A>` at the type level: they do not change the element type. But **`take` and `drop`** need distinct overloads in `transduce` (and similar APIs) and support **direct callable** use on iterables. A runtime brand `__transducerTsPreserving` distinguishes `take`/`drop` from plain `filter`-style transducers so overload resolution stays precise.

## `toFn` overloads

`toFn` has a dedicated overload for `PreservingTransducer` because that type is not a plain `Transducer` to the type checker. Use `toFn(take(3))` or `toFn(pipe(...))` as needed; inference follows from the argument.

## `sequence` and array results

`sequence` always returns a **mutable** `B[]` (new array). `take(n)(coll)` / `drop(n)(coll)` return **`readonly T[]`** for the direct iterable call form—small inconsistency to be aware of if you rely on mutability.
