# AGENTS.md

Non-inferable context for AI coding agents working in this repository.

## Setup

**Yarn 4 PnP** — this project uses Yarn Berry with Plug'n'Play. There is no `node_modules` directory. Run `yarn install` (not `npm install`). IDE support may require `yarn dlx @yarnpkg/sdks vscode` for TypeScript resolution.

## Build System

**TypeScript project references** — each module under `src/` has its own `tsconfig.json` extending `tsconfig.base.json`. Build with `tsc --build` (via `yarn build`), not `tsc` directly. The root `tsconfig.json` lists all 11 modules as project references.

**ESM only** — `"type": "module"` in `package.json`. All imports use `.js` extensions in source files (e.g., `from "../types/index.js"`). TypeScript resolves these to `.ts` sources via `allowImportingTsExtensions`. Do not use `.ts` extensions in imports.

## Architecture

**One module = one function.** Each exported function lives in `src/<name>/index.ts` with a co-located `tsconfig.json`. The barrel file `src/index.ts` re-exports everything. Do not add new exports without adding a module directory, tsconfig, and project reference.

**Module dependency graph:**

```
types ← map, filter, filterGuard, take, drop, pipe
types ← transduce
types, transduce ← into
types, into ← sequence
types, sequence ← toFn
```

## Type System

**`pipe` uses `BuildConstraint`** — a mapped tuple type that validates adjacent transducer compatibility at compile time. It lives in `src/pipe/index.ts` as a non-exported type. If modifying `pipe`'s types, understand `BuildConstraint`, `PipeResult`, `PipeTypeError`, and the `PrevIdx` lookup tuple pattern (documented in `.gsd/KNOWLEDGE.md`).

**Strict mode flags that affect code style:**

- `noUncheckedIndexedAccess` — array indexing returns `T | undefined`
- `exactOptionalPropertyTypes` — optional properties cannot be assigned `undefined` explicitly
- `verbatimModuleSyntax` — `import type` is required for type-only imports
- `isolatedDeclarations` — all exports must have explicit return type annotations

## Testing

**Runtime + type-level tests.** `yarn test` runs vitest for runtime tests. `yarn vitest --typecheck --run` additionally runs type-level tests using `expectTypeOf` and `@ts-expect-error` directives. Both are in `src/<name>/index.test.ts`.

**Examples are tests.** `examples/*.test.ts` files contain integration tests with third-party libraries (lodash, ramda, rambda, remeda, fp-ts, itertools, underscore). They run as part of `yarn test`.

## Gotchas

- `filter()` does not narrow types — it preserves the input element type `A` even with a type guard predicate. Use `filterGuard()` for narrowing pipelines.
- `pipe`'s `const T` inference requires inline transducer literals. Spreading a pre-typed array loses constraint checking.
- Ramda/Rambda's `@@transducer/` protocol is incompatible with this library's function-based `StepFn`. Use their fully-applied functions as callbacks to `map`/`filter`, not as transducers.
- `pipe` enforces strict compatibility checks up to 21 transducers. Longer chains emit a compile-time `PipeTypeError`.

## Commands

```bash
yarn check         # typecheck + lint + fmt:check (CI gate)
yarn build         # rimraf dist && tsc --build
yarn test          # vitest run (162 tests)
yarn test:coverage # vitest run --coverage (100% required)
```
