# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TypeScript port of [Clojure's transducers](https://clojure.org/reference/transducers) — composable, type-safe algorithmic transformations. Designed to work with [rambda's](https://selfrefactor.github.io/rambda/#/) `pipe` out of the box.

## Commands

```bash
yarn install       # install dependencies
yarn build         # bundle with tsup (ESM + .d.ts)
yarn typecheck     # tsc --build (project references)
yarn lint          # oxlint
yarn fmt           # oxfmt --write src
yarn fmt:check     # oxfmt --check src
yarn check         # typecheck + lint + fmt:check
```

## Architecture

One module per exported function, each in its own directory under `src/` with a dedicated `tsconfig.json` (project references). The dependency graph:

```
types ← map, filter, take, drop
types ← transduce
types, transduce ← into
types, into ← sequence
```

`src/index.ts` is the barrel re-export.

## Tooling

- **Package manager:** Yarn 4 (Berry) with PnP — no `node_modules`
- **Bundler:** tsup (ESM only, dts generation, sourcemaps)
- **TypeScript:** strict mode + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`. Uses `.ts` import extensions with `allowImportingTsExtensions` + `emitDeclarationOnly`
- **Linter:** oxlint — correctness=error, suspicious=warn, pedantic=warn
- **Formatter:** oxfmt
- **Git hooks:** husky + lint-staged runs oxfmt and oxlint on staged `.ts` files

## Conventions

- ESM (`"type": "module"`)
- 2-space indent, LF line endings, UTF-8 (`.editorconfig`)
- `rambda` is a peer dependency — consumers provide it
- Imports use `.ts` extensions (`from "../types/index.ts"`)

<!-- GSD:project-start source:PROJECT.md -->
## Project

**transducer-ts**

A TypeScript port of Clojure's transducers — composable, type-safe algorithmic transformations. Designed to work with rambda's `pipe` out of the box. Ships as ESM with full type declarations.

**Core Value:** Type-safe transducer composition that feels natural in TypeScript and works correctly out of the box.

### Constraints

- **TypeScript strict mode**: All code must pass with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`
- **ESM only**: No CJS build, `"type": "module"` in package.json
- **No runtime dependencies**: Only `rambda` as peer dep
- **Clojure semantics**: When behavior is ambiguous, match Clojure's transducer behavior
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.3 - Core implementation language with strict mode enabled
- ES2022 (target and module) - Compiled TypeScript output
## Runtime
- Node.js (no specific version constraint in .nvmrc or package.json, supports modern ES2022)
- Yarn 4.13.0 (Berry) with Plug'n'Play (PnP) — no `node_modules` directory
- Lockfile: Present at `yarn.lock`
## Frameworks
- tsup 8.5.1 - ESM bundler with automatic .d.ts generation and sourcemaps
- TypeScript 5.9.3 - Strict mode with enhanced type safety
- oxlint 1.56.0 - Fast linter with correctness=error, suspicious/pedantic=warn
- oxfmt 0.41.0 - Code formatter (Rust-based, aligned with eslint/prettier conventions)
- husky 9.1.7 - Git hooks for pre-commit checks
- lint-staged 16.4.0 - Runs oxfmt and oxlint on staged .ts files
## Key Dependencies
- rambda 11.1.0 (peer dependency) - Functional utility library
- TypeScript 5.9.3 - Language and compiler
- tsup 8.5.1 - Bundler
- oxlint 1.56.0 - Linter
- oxfmt 0.41.0 - Formatter
- husky 9.1.7 - Git hooks
- lint-staged 16.4.0 - Pre-commit filtering
## Configuration
- Config file: `tsconfig.base.json`
- Key settings:
- Config file: `tsconfig.json` (at root)
- Extends base and adds project references for each module: types, map, filter, take, drop, transduce, into, sequence
- File: `package.json`
- `"type": "module"` - ESM-only package
- Conditional exports for each function/module (subpath exports in dist/)
- ESM with .ts extension imports (no CommonJS)
- `.editorconfig` - Enforces UTF-8, LF, 2-space indent, final newline
- `.husky/pre-commit` - Runs lint-staged
- `lint-staged` config in package.json - Runs `oxfmt --write` then `oxlint` on staged .ts files
- `.yarnrc.yml` - Uses yarn release from `.yarn/releases/yarn-4.13.0.cjs`
## Build Process
- Location: `dist/`
- Formats: ESM only (.js)
- Type declarations: Automatic .d.ts generation with sourcemaps
- Cleaned on each build (tsup clean: true)
- Uses project references for incremental builds
## Scripts
## Platform Requirements
- Node.js (modern ES2022 support recommended, no specific version enforced)
- Yarn 4.x (uses PnP, requires Yarn 4 specifically)
- Text editor with EditorConfig support (2-space, LF, UTF-8)
- ES2022-compatible JavaScript runtime (Node.js 17+, modern browsers)
- Consumer must have rambda 11.1.0 installed as dependency
## No External Integrations
- No API clients
- No database drivers
- No authentication libraries
- No external services
- Designed as composable transducer functions for algorithmic transformations
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- All source files are named `index.ts` and live in module directories (e.g., `src/map/index.ts`, `src/filter/index.ts`)
- Module directories use lowercase names matching the function they export (e.g., `src/map/`, `src/types/`, `src/transduce/`)
- Each module has its own `tsconfig.json` alongside the `index.ts`
- Use camelCase for function names (e.g., `map`, `filter`, `take`, `drop`, `transduce`, `into`, `sequence`)
- Generic function signatures use single-letter uppercase type parameters (e.g., `<A, B>`, `<R>`)
- Predicate/reducer function parameters use descriptive names: `pred` for predicates, `rf` for reducing functions, `xform` for transducers
- Accumulator variables typically named `acc` in reducer functions
- Use camelCase for all variables (e.g., `dropped`, `taken`, `init`, `coll`, `xrf`)
- Counter variables use descriptive names reflecting their purpose (e.g., `taken`, `dropped`)
- Loop variables use single letters when clear from context (e.g., `x` in lambda parameters, `item` in iteration)
- Exported types use PascalCase (e.g., `Reducer`, `Transducer`, `Reduced`)
- Type parameters use single uppercase letters (e.g., `A`, `B`, `R`, `T`)
- Generic type syntax separates type parameters clearly: `<A, B>` not `<A,B>`
## Code Style
- 2-space indentation (enforced by `.editorconfig`)
- LF line endings (enforced by `.editorconfig`)
- UTF-8 encoding (enforced by `.editorconfig`)
- Final newline at end of file (enforced by `.editorconfig`)
- Formatter: `oxfmt` (Rust-based formatter for TypeScript)
- Linter: `oxlint` with specific rule configuration in `oxlintrc.json`
- Category settings:
- Custom rules:
- Husky pre-commit hook runs `lint-staged` (see `package.json` lint-staged config)
- Staged `.ts` files are automatically formatted with `oxfmt --write` and linted with `oxlint`
- Failures prevent commit until issues are resolved
## Import Organization
- No path aliases are used
- All imports use relative paths with explicit `.ts` extensions
- `.ts` extensions are required (enforced by TypeScript config `allowImportingTsExtensions`)
- Type imports and value imports from the same module are on separate lines
- Type imports use `import type` syntax (TypeScript 3.8+)
- Explicitly declared imports improve tree-shaking
## Error Handling
- No explicit error throwing in library code
- Library uses `Reduced<T>` sentinel pattern for early termination (not exceptions)
- `isReduced()` type guard checks for termination condition
- Errors are prevented through strong typing (no null checks needed - TypeScript enforces completeness)
- `reduced(value)` wraps a result to signal termination
- Example from `src/take/index.ts`:
- Consuming code (`transduce`) checks with `isReduced()` and unwraps with `.value`
## Logging
## Comments
- JSDoc comments on public exported functions describing purpose and behavior
- Comments are concise (one-line per feature)
- Comments appear above the function signature
- Single-line JSDoc comments describe the high-level purpose
- No parameter descriptions (parameters are self-documenting through type signatures)
- No return type descriptions (return type is explicit in signature)
## Function Design
- Library consists of small, composable functions
- Most transducers are higher-order functions returning closures
- Complexity is managed through functional composition, not large functions
- Transducers follow a consistent pattern: `(predicate/transform) => (rf: Reducer) => Reducer`
- Reducing functions use 2 parameters: `(acc: A, input: B) => A`
- No default parameters used (library targets composition patterns where all arguments are explicit)
- Transducers return a function (higher-order pattern)
- Reducing functions return the accumulator
- Terminal functions (`transduce`, `into`, `sequence`) return computed values
- No implicit undefined returns (all code paths explicitly return values)
## Module Design
- Each module exports a single primary function as the default-like export
- Module barrel file (`src/index.ts`) re-exports all public functions and types
- Type exports use `export type` syntax, value exports use `export`
- Consistent pattern: one module = one concept
- `src/index.ts` is the main barrel file
- It re-exports all public API (all transducers, types, and utilities)
- Module-level barrel files not used (each module has single `index.ts`)
- Consumers can import specific modules: `import { map } from "transducer-ts/map"` or all from main: `import { map } from "transducer-ts"`
## Type Strictness
- `strict: true` - all strict flags enabled
- `noUncheckedIndexedAccess: true` - no implicit array indexing
- `noPropertyAccessFromIndexSignature: true` - strict property access
- `exactOptionalPropertyTypes: true` - optional properties cannot be undefined
- `noFallthroughCasesInSwitch: true` - all switch cases must be handled
- `forceConsistentCasingInFileNames: true` - case-sensitive file names
- `verbatimModuleSyntax: true` - emit imports exactly as written
- Generics are used extensively but without constraints (trust type inference)
- Type parameters flow through function signatures without explicit bounds
- This allows maximum composition flexibility
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- **Function composition focus** — Each transformation (map, filter, take, drop) returns a composable transducer
- **Lazy evaluation** — Transducers describe transformations but don't execute until applied via `transduce`, `into`, or `sequence`
- **Early termination support** — The `Reduced` sentinel enables short-circuiting (used by `take`)
- **Pluggable reducers** — Transducers are agnostic to the reducing function, enabling reuse across arrays, streams, or custom collectors
## Layers
- Purpose: Define the core abstractions
- Location: `src/types/index.ts`
- Contains: `Reducer<A, B>` type, `Transducer<A, B>` type, `Reduced<T>` interface, and sentinel helpers
- Depends on: Nothing
- Used by: All other modules
- Purpose: Implement individual transformation operations
- Location: `src/map/index.ts`, `src/filter/index.ts`, `src/take/index.ts`, `src/drop/index.ts`
- Contains: Factory functions that return `Transducer` instances
- Depends on: `src/types/`
- Used by: Consumer code and higher-level abstractions
- Purpose: Execute a transducer pipeline against an iterable with a reducing function
- Location: `src/transduce/index.ts`
- Contains: `transduce()` function that iterates, applies transformations, and handles early termination
- Depends on: `src/types/`
- Used by: `src/into/`, `src/sequence/`
- Purpose: Provide ergonomic APIs for common use cases
- Location: `src/into/index.ts`, `src/sequence/index.ts`
- Contains: Higher-level functions that wrap `transduce` with pre-configured reducers
- Depends on: `src/types/`, `src/transduce/`
- Used by: Consumer code
- Purpose: Barrel re-export all public APIs
- Location: `src/index.ts`
- Exports: All types and functions for consumers
## Data Flow
- `into(array, xform, iterable)` — wraps execution with an array push reducer
- `sequence(xform, iterable)` — wraps execution with an empty array and into
- **Transducer state** — Captured in closure (e.g., `taken` counter in `take`, `dropped` counter in `drop`)
- **Accumulator state** — Passed immutably through the reduction chain
- **Early termination** — Signaled via `Reduced` wrapper, checked after each step
## Key Abstractions
- Purpose: Function that combines an accumulator with a new value
- Type: `Reducer<A, B> = (acc: A, input: B) => A`
- Examples: `(acc: number[], x: number) => { acc.push(x); return acc; }`
- Pattern: Pure function, returns new accumulator state
- Purpose: Function that transforms one reducing function into another
- Type: `Transducer<A, B> = <R>(rf: Reducer<R, B>) => Reducer<R, A>`
- Examples: `map()`, `filter()`, `take()`, `drop()`
- Pattern: Higher-order function enabling function composition
- Purpose: Sentinel value wrapping a result to signal early termination
- Type: `Reduced<T>` interface with `value` and `__reduced` flag
- Usage: Returned by transducers like `take` when limit is reached
- Pattern: Type-safe way to distinguish early termination from normal values
## Entry Points
- `transduce(xform, reducer, init, iterable)` — `src/transduce/index.ts`
- `into(array, xform, iterable)` — `src/into/index.ts`
- `sequence(xform, iterable)` — `src/sequence/index.ts`
- `map(f)` — `src/map/index.ts` — Apply function to each element
- `filter(pred)` — `src/filter/index.ts` — Keep elements matching predicate
- `take(n)` — `src/take/index.ts` — Take first n elements with early termination
- `drop(n)` — `src/drop/index.ts` — Skip first n elements
## Error Handling
- Synchronous errors in reducer functions bubble up to caller
- Synchronous errors in transducer functions (map, filter predicates) bubble up to caller
- Early termination via `Reduced` for control flow (not errors)
- Type system provides compile-time guarantees (strict TypeScript with `noUncheckedIndexedAccess`)
## Cross-Cutting Concerns
```typescript
```
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
