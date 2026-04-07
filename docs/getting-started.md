# Getting started

## Install

```bash
npm install @fromo/transducer-ts
# or
yarn add @fromo/transducer-ts
```

Requirements:

- **Node.js** 20+ (see `engines` in `package.json`)
- **ESM** consumers (`"type": "module"` or a bundler that resolves ESM)

The package has **no runtime dependencies**.

## Your first pipeline

1. **Build a transducer** with `map`, `filter`, `take`, `drop`, and compose with `pipe`.
2. **Run it** with `sequence` (new array), `into` (append to an array), or `transduce` (custom accumulator).

```typescript
import { pipe, map, filter, take, sequence } from "@fromo/transducer-ts";

const xform = pipe(
  filter((n: number) => n > 0),
  map((n: number) => n * 2),
  take(5),
);

sequence(xform, [1, -2, 3, 4, 5, 6, 7]);
// => [2, 6, 8, 10, 12]
```

Nothing runs until you call an executor (`sequence`, `into`, or `transduce`). The `xform` value is reusable: apply it to many iterables without rebuilding the pipeline.

## Why transducers?

- **Single pass** — elements flow through the whole pipeline one at a time; no intermediate arrays from chained `map`/`filter` unless the executor materializes one.
- **Source-agnostic** — the same transducer works on arrays, `Set`, generators, or any `Iterable`.
- **Early termination** — `take` (and custom logic using `reduced`) can stop the driver without consuming the rest of a long or infinite iterable.
- **Type inference** — `pipe` chains inferred element types through a long series of transducers (see [Types and `pipe`](./types-and-pipe.md)).

## Next steps

- [Concepts](./concepts.md) for reducers, step functions, and how composition works
- [API reference](./api.md) for each function
- [Execution](./execution.md) for when to use `sequence` vs `into` vs `transduce`
