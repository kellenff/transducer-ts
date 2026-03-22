# Coding Conventions

**Analysis Date:** 2026-03-22

## Naming Patterns

**Files:**

- All source files are named `index.ts` and live in module directories (e.g., `src/map/index.ts`, `src/filter/index.ts`)
- Module directories use lowercase names matching the function they export (e.g., `src/map/`, `src/types/`, `src/transduce/`)
- Each module has its own `tsconfig.json` alongside the `index.ts`

**Functions:**

- Use camelCase for function names (e.g., `map`, `filter`, `take`, `drop`, `transduce`, `into`, `sequence`)
- Generic function signatures use single-letter uppercase type parameters (e.g., `<A, B>`, `<R>`)
- Predicate/reducer function parameters use descriptive names: `pred` for predicates, `rf` for reducing functions, `xform` for transducers
- Accumulator variables typically named `acc` in reducer functions

**Variables:**

- Use camelCase for all variables (e.g., `dropped`, `taken`, `init`, `coll`, `xrf`)
- Counter variables use descriptive names reflecting their purpose (e.g., `taken`, `dropped`)
- Loop variables use single letters when clear from context (e.g., `x` in lambda parameters, `item` in iteration)

**Types:**

- Exported types use PascalCase (e.g., `Reducer`, `Transducer`, `Reduced`)
- Type parameters use single uppercase letters (e.g., `A`, `B`, `R`, `T`)
- Generic type syntax separates type parameters clearly: `<A, B>` not `<A,B>`

## Code Style

**Formatting:**

- 2-space indentation (enforced by `.editorconfig`)
- LF line endings (enforced by `.editorconfig`)
- UTF-8 encoding (enforced by `.editorconfig`)
- Final newline at end of file (enforced by `.editorconfig`)
- Formatter: `oxfmt` (Rust-based formatter for TypeScript)

**Linting:**

- Linter: `oxlint` with specific rule configuration in `oxlintrc.json`
- Category settings:
  - `correctness`: error (enforces code correctness)
  - `suspicious`: warn (flags potentially problematic patterns)
  - `pedantic`: warn (nitpicky style issues)
  - `style`: off (style enforced by oxfmt)
  - `nursery`: off
  - `restriction`: off
- Custom rules:
  - `no-unused-vars`: error
  - `no-console`: warn (console usage discouraged but allowed)
  - `eqeqeq`: error (strict equality only, no `==`)
  - `no-var`: error (use `const`/`let` only)
  - `prefer-const`: error (prefer `const` over `let` when variable isn't reassigned)

**Git Hooks:**

- Husky pre-commit hook runs `lint-staged` (see `package.json` lint-staged config)
- Staged `.ts` files are automatically formatted with `oxfmt --write` and linted with `oxlint`
- Failures prevent commit until issues are resolved

## Import Organization

**Order:**

1. Type imports from relative paths
2. Value imports from relative paths
3. No external package imports (library depends on `rambda` only as peer dependency)

**Example Pattern:**

```typescript
import type { Reducer, Transducer } from "../types/index.ts";
import { reduced } from "../types/index.ts";
```

**Path Aliases:**

- No path aliases are used
- All imports use relative paths with explicit `.ts` extensions
- `.ts` extensions are required (enforced by TypeScript config `allowImportingTsExtensions`)

**Import Splitting:**

- Type imports and value imports from the same module are on separate lines
- Type imports use `import type` syntax (TypeScript 3.8+)
- Explicitly declared imports improve tree-shaking

## Error Handling

**Patterns:**

- No explicit error throwing in library code
- Library uses `Reduced<T>` sentinel pattern for early termination (not exceptions)
- `isReduced()` type guard checks for termination condition
- Errors are prevented through strong typing (no null checks needed - TypeScript enforces completeness)

**Sentinel Pattern (Early Termination):**

- `reduced(value)` wraps a result to signal termination
- Example from `src/take/index.ts`:
  ```typescript
  if (taken >= n) {
    return reduced(result) as unknown as R;
  }
  ```
- Consuming code (`transduce`) checks with `isReduced()` and unwraps with `.value`

## Logging

**Framework:** Not used - library code contains no logging

## Comments

**When to Comment:**

- JSDoc comments on public exported functions describing purpose and behavior
- Comments are concise (one-line per feature)
- Comments appear above the function signature

**JSDoc Pattern:**

```typescript
/**
 * Returns a transducer that applies `f` to each element.
 */
export function map<A, B>(f: (a: A) => B): Transducer<A, B> {
  // ...
}
```

- Single-line JSDoc comments describe the high-level purpose
- No parameter descriptions (parameters are self-documenting through type signatures)
- No return type descriptions (return type is explicit in signature)

## Function Design

**Size:** Functions are typically 1-10 lines

- Library consists of small, composable functions
- Most transducers are higher-order functions returning closures
- Complexity is managed through functional composition, not large functions

**Parameters:**

- Transducers follow a consistent pattern: `(predicate/transform) => (rf: Reducer) => Reducer`
- Reducing functions use 2 parameters: `(acc: A, input: B) => A`
- No default parameters used (library targets composition patterns where all arguments are explicit)

**Return Values:**

- Transducers return a function (higher-order pattern)
- Reducing functions return the accumulator
- Terminal functions (`transduce`, `into`, `sequence`) return computed values
- No implicit undefined returns (all code paths explicitly return values)

## Module Design

**Exports:**

- Each module exports a single primary function as the default-like export
- Module barrel file (`src/index.ts`) re-exports all public functions and types
- Type exports use `export type` syntax, value exports use `export`
- Consistent pattern: one module = one concept

**Barrel Files:**

- `src/index.ts` is the main barrel file
- It re-exports all public API (all transducers, types, and utilities)
- Module-level barrel files not used (each module has single `index.ts`)
- Consumers can import specific modules: `import { map } from "transducer-ts/map"` or all from main: `import { map } from "transducer-ts"`

## Type Strictness

**Configuration** (from `tsconfig.base.json`):

- `strict: true` - all strict flags enabled
- `noUncheckedIndexedAccess: true` - no implicit array indexing
- `noPropertyAccessFromIndexSignature: true` - strict property access
- `exactOptionalPropertyTypes: true` - optional properties cannot be undefined
- `noFallthroughCasesInSwitch: true` - all switch cases must be handled
- `forceConsistentCasingInFileNames: true` - case-sensitive file names
- `verbatimModuleSyntax: true` - emit imports exactly as written

**Generic Constraints:**

- Generics are used extensively but without constraints (trust type inference)
- Type parameters flow through function signatures without explicit bounds
- This allows maximum composition flexibility

---

_Convention analysis: 2026-03-22_
