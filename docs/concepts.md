# Concepts

This library implements transducers as **plain functions** that transform **step functions** (reducers that may short-circuit). That model matches Clojure’s semantics closely, without adopting the Ramda `@@transducer/` object protocol.

## Reducer

A **reducer** combines an accumulator with one input element:

```typescript
type Reducer<A, B> = (acc: A, input: B) => A;
```

Example: sum numbers.

```typescript
const sum: Reducer<number, number> = (acc, x) => acc + x;
```

## Step function

A **step function** is like a reducer, but may return a **`Reduced`** sentinel to stop processing early:

```typescript
type StepFn<R, A> = (acc: R, input: A) => R | Reduced<R>;
```

Transducers wrap step functions so that early termination propagates outward (for example when `take` has seen enough elements). User code usually interacts with `Reducer` via `transduce`; `StepFn` is the internal glue.

## Transducer

A **transducer** transforms a step function for **output type** `B` into a step function for **input type** `A`:

```typescript
type Transducer<A, B> = <R>(rf: StepFn<R, B>) => StepFn<R, A>;
```

- **Data flow:** for each input `a : A`, the transducer may call the inner step zero or more times with values of type `B`, forwarding the accumulator through the chain.
- **Polymorphic in `R`:** the accumulator type is fixed by the **outer** reducer you pass to `transduce` / `sequence` / `into`; transducers cannot assume a particular `R`.

## `Reduced` and early termination

```typescript
interface Reduced<T> {
  readonly value: T;
  readonly __reduced: true;
}
```

- `reduced(acc)` wraps a value to mean “stop now; this is the final accumulator.”
- `isReduced(x)` is the type guard used by the driver loop.

`take` uses this mechanism so the source iterable is not consumed past the `n`th accepted element (when composed in a pipeline, upstream work can short-circuit too).

## Composition order (`pipe`)

`pipe(t1, t2, t3)` means: **input enters `t1`, then `t2`, then `t3`**. That is left-to-right **processing** order, which matches reading the pipeline as a data flow diagram.

```typescript
pipe(
  filter(pred), // first: filter raw input
  map(f),       // then: map surviving values
  take(n),      // then: stop after n outputs
);
```

## Preserving transducers (`take`, `drop`)

`take` and `drop` are typed as **`PreservingTransducer`**: they keep the same element type `A` but are **branded** so overloads (for example on `transduce`) can distinguish them from a plain `filter` transducer that also has type `Transducer<A, A>`. They are also **callable on iterables** directly for convenience:

```typescript
take(3)([1, 2, 3, 4, 5]); // => [1, 2, 3] (readonly)
```

See [Types and `pipe`](./types-and-pipe.md) for why the brand exists.

## Clojure alignment

Where behavior could differ, this library follows **Clojure transducer semantics** (for example negative `take` / `drop` counts treated as `0`). When in doubt, compare with Clojure’s reference behavior.
