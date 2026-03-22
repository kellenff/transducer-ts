# Technology Stack

**Analysis Date:** 2026-03-22

## Languages

**Primary:**

- TypeScript 5.9.3 - Core implementation language with strict mode enabled

**JavaScript:**

- ES2022 (target and module) - Compiled TypeScript output

## Runtime

**Environment:**

- Node.js (no specific version constraint in .nvmrc or package.json, supports modern ES2022)

**Package Manager:**

- Yarn 4.13.0 (Berry) with Plug'n'Play (PnP) — no `node_modules` directory
- Lockfile: Present at `yarn.lock`

## Frameworks

**Build/Bundling:**

- tsup 8.5.1 - ESM bundler with automatic .d.ts generation and sourcemaps
  - Config: `tsup.config.ts` defines 9 entry points (index, types, map, filter, take, drop, transduce, into, sequence)
  - Output format: ESM only

**Type System:**

- TypeScript 5.9.3 - Strict mode with enhanced type safety

**Code Quality:**

- oxlint 1.56.0 - Fast linter with correctness=error, suspicious/pedantic=warn
  - Config: `oxlintrc.json` enforces strict rules (no-unused-vars, prefer-const, eqeqeq, no-var)
- oxfmt 0.41.0 - Code formatter (Rust-based, aligned with eslint/prettier conventions)

**Development Tools:**

- husky 9.1.7 - Git hooks for pre-commit checks
- lint-staged 16.4.0 - Runs oxfmt and oxlint on staged .ts files

## Key Dependencies

**Runtime:**

- rambda 11.1.0 (peer dependency) - Functional utility library
  - Consumers must provide this; designed to work with rambda's `pipe`

**Development Only:**

- TypeScript 5.9.3 - Language and compiler
- tsup 8.5.1 - Bundler
- oxlint 1.56.0 - Linter
- oxfmt 0.41.0 - Formatter
- husky 9.1.7 - Git hooks
- lint-staged 16.4.0 - Pre-commit filtering

**No external APIs or database libraries** — This is a pure algorithmic library.

## Configuration

**TypeScript (Base):**

- Config file: `tsconfig.base.json`
- Key settings:
  - `strict: true` - All strict checks enabled
  - `target: ES2022`, `module: ES2022`
  - `moduleResolution: bundler` - For tsup
  - `allowImportingTsExtensions: true` + `verbatimModuleSyntax: true` - Allows `.ts` imports
  - `emitDeclarationOnly: true` - Only generate .d.ts (tsup handles JS generation)
  - `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true` - Enhanced type safety
  - `declarationMap: true`, `sourceMap: true` - Debugging support
  - `skipLibCheck: true` - Faster compilation

**TypeScript (Project):**

- Config file: `tsconfig.json` (at root)
- Extends base and adds project references for each module: types, map, filter, take, drop, transduce, into, sequence

**Module Configuration:**

- File: `package.json`
- `"type": "module"` - ESM-only package
- Conditional exports for each function/module (subpath exports in dist/)
- ESM with .ts extension imports (no CommonJS)

**Formatting:**

- `.editorconfig` - Enforces UTF-8, LF, 2-space indent, final newline

**Linting & Formatting (Pre-commit):**

- `.husky/pre-commit` - Runs lint-staged
- `lint-staged` config in package.json - Runs `oxfmt --write` then `oxlint` on staged .ts files

**Yarn Configuration:**

- `.yarnrc.yml` - Uses yarn release from `.yarn/releases/yarn-4.13.0.cjs`

## Build Process

**Command:** `yarn build` → `tsup`

**Output:**

- Location: `dist/`
- Formats: ESM only (.js)
- Type declarations: Automatic .d.ts generation with sourcemaps
- Cleaned on each build (tsup clean: true)

**Typecheck:** `yarn typecheck` → `tsc --build`

- Uses project references for incremental builds

## Scripts

```bash
yarn build          # Bundle with tsup (ESM + .d.ts)
yarn typecheck      # tsc --build (project references)
yarn lint           # oxlint
yarn fmt            # oxfmt --write src
yarn fmt:check      # oxfmt --check src
yarn check          # typecheck + lint + fmt:check
yarn prepare        # husky install (git hooks)
```

## Platform Requirements

**Development:**

- Node.js (modern ES2022 support recommended, no specific version enforced)
- Yarn 4.x (uses PnP, requires Yarn 4 specifically)
- Text editor with EditorConfig support (2-space, LF, UTF-8)

**Production:**

- ES2022-compatible JavaScript runtime (Node.js 17+, modern browsers)
- Consumer must have rambda 11.1.0 installed as dependency

## No External Integrations

This is a pure TypeScript library with zero runtime dependencies:

- No API clients
- No database drivers
- No authentication libraries
- No external services
- Designed as composable transducer functions for algorithmic transformations

---

_Stack analysis: 2026-03-22_
