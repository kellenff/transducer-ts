# transducer-ts documentation

Type-safe [Clojure-style transducers](https://clojure.org/reference/transducers) for TypeScript: composable transformations over any `Iterable`, with zero runtime dependencies.

## Contents

| Doc | What it covers |
|-----|----------------|
| [Getting started](./getting-started.md) | Install, first pipeline, mental model |
| [Concepts](./concepts.md) | Reducers, step functions, transducers, `Reduced`, execution order |
| [API reference](./api.md) | Every public export: signatures, behavior, examples |
| [Types, `pipe`, and inference](./types-and-pipe.md) | `Transducer` vs `PreservingTransducer`, `filter` vs `filterGuard`, long `pipe` chains |
| [Execution](./execution.md) | `sequence`, `into`, `transduce`, `toFn`, early termination |
| [Interoperability](./interop.md) | Ramda/Rambda, lodash, fp-ts, and other libraries |
| [Package layout](./package-layout.md) | Subpath imports, `dist/`, building from source |

## Quick reference

```typescript
import { pipe, map, filter, take, sequence } from "@fromo/transducer-ts";

const xform = pipe(
  filter((x: number) => x % 2 === 0),
  map((x: number) => x * 10),
  take(3),
);

sequence(xform, [1, 2, 3, 4, 5, 6, 7, 8]);
// => [20, 40, 60]
```

## See also

- [README.md](../README.md) at the repository root — concise overview and API snippets
- [llms.txt](../llms.txt) — compact API summary for tooling
- [AGENTS.md](../AGENTS.md) — contributor/setup notes (Yarn PnP, project references, type gotchas)
- [CLAUDE.md](../CLAUDE.md) — project commands and architecture summary
