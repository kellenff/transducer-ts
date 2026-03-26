# transducer-ts

Type-safe [Clojure-style transducers](https://clojure.org/reference/transducers) for TypeScript. Composable algorithmic transformations with full type inference.

## What are transducers?

Transducers are composable, reusable transformations decoupled from their data source. Unlike chaining `.map().filter()`:

- **No intermediate collections** — each element flows through the entire pipeline before the next
- **Reusable across sources** — the same transducer works with arrays, Sets, generators, or any `Iterable`
- **Compose via function composition** — build pipelines with `pipe`, apply them to any collection

```typescript
import { map, filter, take, pipe, sequence } from "@fromo/transducer-ts";

// Build a pipeline — no data processed yet
const xform = pipe(
  filter((x: number) => x % 2 === 0),
  map((x: number) => x * 3),
  take(5),
);

// Apply to any iterable
sequence(xform, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
// => [6, 12, 18, 24, 30]

// Same transducer, different source
sequence(xform, new Set([1, 2, 3, 4, 5, 6]));
// => [6, 12, 18]
```

## Install

```bash
npm install @fromo/transducer-ts
# or
yarn add @fromo/transducer-ts
```

No runtime dependencies.

## API

### Transducers

#### `map<A, B>(f: (a: A) => B): Transducer<A, B>`

Returns a transducer that applies `f` to each element.

```typescript
import { map, sequence } from "@fromo/transducer-ts";

sequence(
  map((x: number) => x * 2),
  [1, 2, 3],
);
// => [2, 4, 6]

sequence(
  map((x: number) => String(x)),
  [1, 2, 3],
);
// => ["1", "2", "3"]
```

#### `filter<A>(pred: (a: A) => boolean): Transducer<A, A>`

Returns a transducer that keeps only elements satisfying `pred`.
`filter` intentionally **does not** narrow types; it preserves `A`.

```typescript
import { filter, sequence } from "@fromo/transducer-ts";

sequence(
  filter((x: number) => x % 2 === 0),
  [1, 2, 3, 4, 5],
);
// => [2, 4]
```

#### `filterGuard<A, B extends A>(pred: (a: A) => a is B): Transducer<A, B>`

Returns a narrowing transducer for type-guard predicates.

```typescript
import { filterGuard, sequence } from "@fromo/transducer-ts";

const isString = (x: string | number): x is string => typeof x === "string";
sequence(filterGuard(isString), [1, "a", 2, "b"]);
// => ["a", "b"]
```

#### `take<A>(n: number): Transducer<A, A>`

Returns a transducer that takes the first `n` elements, then terminates early. Negative values of `n` are treated as `0` (Clojure semantics — returns empty).

```typescript
import { take, sequence } from "@fromo/transducer-ts";

sequence(take(3), [1, 2, 3, 4, 5]);
// => [1, 2, 3]

sequence(take(0), [1, 2, 3]);
// => []
```

**Early termination**: `take` signals the driver loop to stop processing after `n` elements. When used in a `pipe` pipeline, upstream transducers are also short-circuited — no unnecessary work is done.

```typescript
import { map, take, pipe, sequence } from "@fromo/transducer-ts";

// Only the first 2 elements are ever processed by map
const xf = pipe(
  map((x: number) => x * 100),
  take(2),
);
sequence(xf, [1, 2, 3, 4, 5]);
// => [100, 200]  (elements 3, 4, 5 never touch map)
```

#### `drop<A>(n: number): Transducer<A, A>`

Returns a transducer that skips the first `n` elements. Negative values of `n` are treated as `0` (Clojure semantics — passes all elements through).

```typescript
import { drop, sequence } from "@fromo/transducer-ts";

sequence(drop(2), [1, 2, 3, 4, 5]);
// => [3, 4, 5]

sequence(drop(0), [1, 2, 3]);
// => [1, 2, 3]
```

### Composition

#### `pipe<A, B>(...xforms: Transducer[]): Transducer<A, B>`

Compose transducers left-to-right. Input is processed by the first transducer, then the second, and so on.

```typescript
import { map, filter, take, pipe, sequence } from "@fromo/transducer-ts";

const xform = pipe(
  filter((x: number) => x > 2), // keep elements > 2
  map((x: number) => x * 10), // multiply by 10
  take(3), // take first 3 results
);

sequence(xform, [1, 2, 3, 4, 5, 6]);
// => [30, 40, 50]
```

Supports up to 21 transducers with strict compatibility checks and full type inference. TypeScript tracks input/output types at each step and reports positional mismatch errors when adjacent transducers are incompatible.

### Execution

#### `sequence<A, B>(xform: Transducer<A, B>, coll: Iterable<A>): B[]`

Eagerly apply a transducer to a collection and return a new array. The most common way to run a transducer.

```typescript
import { map, sequence } from "@fromo/transducer-ts";

sequence(
  map((x: number) => x * 2),
  [1, 2, 3],
);
// => [2, 4, 6]
```

#### `into<A, B>(to: B[], xform: Transducer<A, B>, from: Iterable<A>): B[]`

Transduce `from` into an existing target array. Returns the same array reference.

```typescript
import { filter, into } from "@fromo/transducer-ts";

const result: number[] = [];
into(
  result,
  filter((x: number) => x > 2),
  [1, 2, 3, 4],
);
// result === [3, 4]
```

#### `transduce<A, B, R>(xform: Transducer<A, B>, rf: Reducer<R, B>, init: R, coll: Iterable<A>): R`

Apply a transducer with a custom reducing function and initial accumulator. Use this when you need a result type other than an array.

```typescript
import { filter, transduce } from "@fromo/transducer-ts";

// Sum even numbers
transduce(
  filter((x: number) => x % 2 === 0),
  (acc: number, x: number) => acc + x,
  0,
  [1, 2, 3, 4, 5, 6],
);
// => 12
```

Also accepts `StepFn<R, B>` reducers that may return `Reduced<R>`.

#### `toFn<A, B>(xform: Transducer<A, B>): (coll: Iterable<A>) => B[]`

Wrap a transducer into a reusable data-last function. Useful as a stage in any left-to-right function composition utility.

```typescript
import { filter, map, pipe, toFn } from "@fromo/transducer-ts";

const process = toFn(
  pipe(
    filter((x: number) => x % 2 === 0),
    map((x: number) => x * 10),
  ),
);

process([1, 2, 3, 4, 5, 6]);
// => [20, 40, 60]
```

### Types

```typescript
import type {
  Reducer,
  StepFn,
  Transducer,
  Reduced,
} from "@fromo/transducer-ts";
import { reduced, isReduced } from "@fromo/transducer-ts";
```

| Type / Value       | Description                                                         |
| ------------------ | ------------------------------------------------------------------- |
| `Reducer<A, B>`    | `(acc: A, input: B) => A` — consumer-facing reducing function       |
| `StepFn<R, A>`     | `(acc: R, input: A) => R \| Reduced<R>` — internal step function    |
| `Transducer<A, B>` | `<R>(rf: StepFn<R, B>) => StepFn<R, A>` — composable transformation |
| `Reduced<T>`       | Sentinel interface signaling early termination                      |
| `reduced(value)`   | Wrap a value to signal early termination                            |
| `isReduced(x)`     | Type guard: `true` if `x` is a `Reduced<T>`                         |

## Design Notes

### Clojure semantics

This library follows [Clojure's transducer protocol](https://clojure.org/reference/transducers) for behavioral decisions. Specifically:

- `take(n)` where `n ≤ 0` returns an empty result (same as `take(0)`)
- `drop(n)` where `n ≤ 0` passes all elements through (same as `drop(0)`)
- Early termination via the `Reduced` sentinel is the correct mechanism — not exceptions

### ESM only

This package ships as ESM only (`"type": "module"`). CJS is not supported.

### Writing custom transducers

Transducers follow this pattern:

```typescript
import type { Reduced, StepFn, Transducer } from "@fromo/transducer-ts";

function myTransducer<A>(/* config */): Transducer<A, A> {
  return <R>(rf: StepFn<R, A>): StepFn<R, A> =>
    (acc: R, input: A): R | Reduced<R> => {
      // transform logic here
      return rf(acc, input);
    };
}
```

## Development

```bash
yarn install         # install dependencies (Yarn 4 PnP)
yarn build           # compile to dist/
yarn typecheck       # type-check src + tests
yarn test            # run test suite
yarn test:coverage   # run tests with V8 coverage
yarn check           # typecheck + lint + fmt:check
```

Maintainer docs:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [RELEASING.md](RELEASING.md)

## License

This is free and unencumbered software released into the public domain. See [UNLICENSE](UNLICENSE).
