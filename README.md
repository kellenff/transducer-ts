# transducer-ts

Type-safe [Clojure-style transducers](https://clojure.org/reference/transducers) for TypeScript. Composable algorithmic transformations that work with [rambda's](https://selfrefactor.github.io/rambda/#/) `pipe` out of the box.

## What are transducers?

Transducers are composable transformations that are decoupled from their input and output sources. Unlike chaining `.map().filter().reduce()`, transducers:

- **Don't create intermediate collections** — each element is fully processed through the pipeline before the next
- **Are reusable** — the same transducer works with arrays, streams, channels, or any reducible source
- **Compose with function composition** — use `pipe` or `comp` to build pipelines

## Install

```bash
yarn add transducer-ts
```

`rambda` is a peer dependency:

```bash
yarn add rambda
```

## Quick example

```typescript
import { map, filter, transduce, into } from "transducer-ts";
import { pipe } from "rambda";

// Compose transducers — no intermediate arrays created
const xform = pipe(
  filter((x: number) => x % 2 === 0),
  map((x: number) => x * 3),
);

// Apply to data
into([], xform, [1, 2, 3, 4, 5]);
// => [6, 12]
```

## API

| Function                                | Description                               |
| --------------------------------------- | ----------------------------------------- |
| `map(f)`                                | Transform each element                    |
| `filter(pred)`                          | Keep elements matching predicate          |
| `take(n)`                               | Take first n elements (early termination) |
| `drop(n)`                               | Skip first n elements                     |
| `transduce(xform, reducer, init, coll)` | Apply transducer with a reducing function |
| `into(to, xform, from)`                 | Transduce `from` into collection `to`     |
| `sequence(xform, coll)`                 | Eagerly apply transducer, return array    |

## Development

```bash
yarn install        # install dependencies
yarn build          # compile TypeScript
yarn test           # run tests
```

## License

MIT
