# Execution: `sequence`, `into`, `transduce`, `toFn`

Executors turn a transducer **description** into a **result**. All of them ultimately walk the iterable and run the composed step function.

## `sequence`

**Use when:** you want a **new array** of outputs.

- Implements reduction with `(acc, x) => { acc.push(x); return acc; }` starting from `[]`.
- Returns the array produced by `transduce`.

```typescript
sequence(xform, [1, 2, 3]);
```

## `into`

**Use when:** you want to **append** into an existing array (shared mutable buffer, seed values, batching).

- Same push reducer as `sequence`, but starts from your `to` array.
- **Mutates** `to` and returns it.

```typescript
const acc: number[] = [100];
into(acc, map((x: number) => x + 1), [1, 2, 3]);
// acc === [100, 2, 3, 4]
```

## `transduce`

**Use when:** the result is **not** an array, or you need a **custom** combining function.

Examples:

- Fold to a number, string, Map, immutable structure, etc.
- Accumulate statistics in one pass (see JSDoc example in `transduce`).

```typescript
transduce(
  filter((x: number) => x % 2 === 0),
  (acc: number, x: number) => acc + x,
  0,
  [1, 2, 3, 4, 5, 6],
);
// => 12
```

### `Reducer` vs `StepFn`

Pass **`Reducer<R, B>`** when every step returns a plain accumulator.

Pass **`StepFn<R, B>`** when the reducer itself may call `reduced(acc)`—for application-specific short-circuit logic in addition to transducer-driven early exit.

## Early termination

1. **Transducers** such as `take` complete the whole `transduce` once enough elements have been emitted.
2. The driver checks **`isReduced`** after each step; if set, it unwraps `.value` and returns immediately.

So with `pipe(map(f), take(2))`, **`f` is not applied** to inputs that never reach the output after the first two emissions—as soon as `take` completes, iteration stops.

## `toFn`

**Use when:** you want a function **`iterable => array`** to pass to another combinator (compose, promise chains, etc.).

```typescript
const run = toFn(pipe(map((x: number) => x * 2), take(3)));
run([1, 2, 3, 4, 5]);
// => [2, 4, 6]
```

## Laziness

Transducers are **lazy in spirit**: they do not read input until an executor runs. Once running, **`transduce` / `sequence` / `into` are eager** over the iterable until completion or early termination—they are not an iterator transform returning a lazy view. (You can still feed a **generator** as `coll`; pulling that generator happens during the single eager pass.)
