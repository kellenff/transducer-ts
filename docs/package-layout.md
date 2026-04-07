# Package layout and imports

## Root import

```typescript
import { pipe, map, sequence } from "@fromo/transducer-ts";
```

## Subpath imports

Each module is exposed for tree-shaking and explicit dependencies:

| Subpath | Export |
|---------|--------|
| `@fromo/transducer-ts/types` | Types, `reduced`, `isReduced` |
| `@fromo/transducer-ts/map` | `map` |
| `@fromo/transducer-ts/filter` | `filter` |
| `@fromo/transducer-ts/filterGuard` | `filterGuard` |
| `@fromo/transducer-ts/take` | `take` |
| `@fromo/transducer-ts/drop` | `drop` |
| `@fromo/transducer-ts/pipe` | `pipe` |
| `@fromo/transducer-ts/transduce` | `transduce` |
| `@fromo/transducer-ts/into` | `into` |
| `@fromo/transducer-ts/sequence` | `sequence` |
| `@fromo/transducer-ts/toFn` | `toFn` |

Example:

```typescript
import { map } from "@fromo/transducer-ts/map";
```

## Published artifacts

- **`dist/`** — compiled ESM `.js`, `.d.ts`, `.d.ts.map`, `.js.map`
- **`llms.txt`** — short machine-oriented API summary
- **Source** in the repo lives under `src/` with **per-module** `tsconfig.json` project references

## Building from a git checkout

From the repository root (see [AGENTS.md](../AGENTS.md) for Yarn PnP):

```bash
yarn install
yarn build    # rimraf dist && tsc --build
yarn test
yarn check    # typecheck + lint + format check
```

Consumers typically install from npm and use `dist/` via the `exports` field in `package.json`.
