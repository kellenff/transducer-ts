# Testing Patterns

**Analysis Date:** 2026-03-22

## Test Framework

**Current Status:** No testing framework present

**Not Detected:**

- No test runner (Jest, Vitest, Mocha, etc.) is installed
- No test files exist in the codebase (`*.test.ts`, `*.spec.ts`)
- No test configuration files present (jest.config.js, vitest.config.ts, etc.)
- No testing dependencies in `package.json`

**Run Commands:**

```bash
yarn install       # Install dependencies
yarn build         # Bundle source (also validates types)
yarn typecheck     # Run TypeScript type checking
yarn lint          # Run oxlint for code correctness
yarn check         # Combined: typecheck + lint + format check
```

## Validation Strategy

**Primary Validation Method:** Static Type Checking

The library relies on TypeScript strict mode for correctness validation:

- Type safety prevents entire categories of bugs (null reference errors, type mismatches)
- Generic type signatures enforce correct composition
- `noUncheckedIndexedAccess` prevents array bounds errors at compile time
- Strict null checks ensure all paths are handled

**Example from `src/transduce/index.ts`:**

```typescript
export function transduce<A, B, R>(
  xform: Transducer<A, B>,
  rf: Reducer<R, B>,
  init: R,
  coll: Iterable<A>,
): R {
  const xrf = xform(rf);
  let acc = init;
  for (const item of coll) {
    acc = xrf(acc, item);
    if (isReduced(acc)) {
      return acc.value as R; // Type guard ensures acc is Reduced<R>
    }
  }
  return acc;
}
```

The type system guarantees:

- `xform` correctly transforms reducers
- `acc` is always a valid accumulator
- `isReduced()` correctly narrows the type

## Linting as Validation

**Linter:** oxlint (Rust-based linter, `oxlintrc.json` config)

**Rules Enforced:**

- `no-unused-vars` (error) - all defined symbols are used
- `eqeqeq` (error) - no loose equality, preventing type coercion bugs
- `no-var` (error) - prevents function-scoped variable issues
- `prefer-const` (error) - enforces immutability where possible
- `no-console` (warn) - library should not contain console statements

**CI Validation:**
Pre-commit hooks run oxlint via `lint-staged` on all staged `.ts` files, preventing commits with:

- Correctness issues (errors)
- Suspicious patterns (warnings)
- Pedantic violations (warnings)

## Test Coverage

**Test Coverage:** Not applicable (no tests)

**Risk Assessment:**
The codebase's small size and heavy reliance on type safety mitigates testing risk:

- All modules are under 30 lines (see `src/types/index.ts` at 26 lines)
- Functions follow single-responsibility principle
- No complex branching logic in most modules
- `take` and `drop` have closure-based state but correctness is enforced by types

**Fragile Areas Without Tests:**

- State management in `src/take/index.ts` and `src/drop/index.ts` (counters in closures)
- Early termination sentinel pattern in `src/transduce/index.ts` (reliant on `isReduced()` check)
- Accumulator behavior in `src/into/index.ts` (array mutation)

## Module Testing by Type

**Type Definitions Module** (`src/types/index.ts`):

- Defines core types: `Reducer<A, B>`, `Transducer<A, B>`, `Reduced<T>`
- Two utility functions: `reduced()` constructor and `isReduced()` type guard
- Validation via TypeScript strict mode (structural typing)

**Transducer Modules** (`src/map/`, `src/filter/`, `src/take/`, `src/drop/`):

- Each returns a `Transducer` - a higher-order function
- Shape: `(predicate/config) => (rf: Reducer) => Reducer`
- Composition correctness enforced by type system
- No runtime validation needed

**Application Modules** (`src/transduce/`, `src/into/`, `src/sequence/`):

- `transduce()` - applies xform and handles early termination
- `into()` - materializes results into a target array
- `sequence()` - convenience wrapper for new arrays
- All depend on `Transducer` type correctness (propagated from compose chain)

## Suggested Testing Approach

If tests are added, follow this pattern:

**Test File Structure:**

```
src/map/
  ├── index.ts
  ├── tsconfig.json
  └── map.test.ts  # Co-located with implementation
```

**Testing Pattern (pseudo-example for `map`):**

```typescript
import { describe, it, expect } from "vitest";
import { map } from "./index.ts";
import { sequence } from "../sequence/index.ts";

describe("map", () => {
  it("transforms each element", () => {
    const double = map((x: number) => x * 2);
    const result = sequence(double, [1, 2, 3]);
    expect(result).toEqual([2, 4, 6]);
  });

  it("preserves order", () => {
    const increment = map((x: number) => x + 1);
    const result = sequence(increment, [3, 1, 2]);
    expect(result).toEqual([4, 2, 3]);
  });
});
```

**Testing Pattern for `take` (stateful):**

```typescript
describe("take", () => {
  it("takes first n elements", () => {
    const first2 = take(2);
    const result = sequence(first2, [1, 2, 3, 4]);
    expect(result).toEqual([1, 2]);
  });

  it("handles n larger than collection", () => {
    const first10 = take(10);
    const result = sequence(first10, [1, 2]);
    expect(result).toEqual([1, 2]);
  });

  it("handles n = 0", () => {
    const first0 = take(0);
    const result = sequence(first0, [1, 2, 3]);
    expect(result).toEqual([]);
  });
});
```

**Recommended Test Runner:** Vitest

- Modern TypeScript support out of the box
- Compatible with existing tsup + TypeScript setup
- Faster than Jest for smaller libraries
- No separate configuration needed (reuses tsconfig)

## Type-Driven Development

The library exemplifies **type-driven development** where the type system IS the primary testing mechanism:

**Compile-Time Guarantees:**

```typescript
// This doesn't compile:
const x: Transducer<number, string> = map((n: number) => n); // Type error: need string return

// This compiles and is guaranteed correct:
const correct: Transducer<number, string> = map((n: number) => n.toString());
```

**Composition Safety:**

```typescript
// Type system prevents incorrect composition:
const xform = pipe(
  filter((x: number) => x > 0),
  map((x: number) => x * 2),
  take(5),
);
// All types flow correctly; no runtime errors possible
```

---

_Testing analysis: 2026-03-22_
