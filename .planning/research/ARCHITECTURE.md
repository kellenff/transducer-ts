# Architecture Patterns

**Domain:** TypeScript functional library (transducers)
**Researched:** 2026-03-22

## Current Architecture

The library follows a clean one-module-per-function pattern with TypeScript project references. This is already well-structured. The architecture research focuses on two areas the project needs for 0.1.0: (1) test architecture, and (2) the Reduced type safety problem.

### Component Boundaries

| Component   | Responsibility                                                                                     | Communicates With          |
| ----------- | -------------------------------------------------------------------------------------------------- | -------------------------- |
| `types`     | Core type definitions: `Reducer<A,B>`, `Transducer<A,B>`, `Reduced<T>`, `reduced()`, `isReduced()` | None (leaf dependency)     |
| `map`       | Stateless transducer: transform each element                                                       | `types`                    |
| `filter`    | Stateless transducer: keep elements matching predicate                                             | `types`                    |
| `take`      | Stateful transducer: first N elements, early termination via `Reduced`                             | `types`                    |
| `drop`      | Stateful transducer: skip first N elements                                                         | `types`                    |
| `transduce` | Execution: apply transducer with reducing function over iterable                                   | `types` (uses `isReduced`) |
| `into`      | Execution: transduce into target array                                                             | `transduce`                |
| `sequence`  | Execution: convenience wrapper, `into([], xform, coll)`                                            | `into`                     |

### Data Flow

```
Input Iterable
       |
       v
  transduce(xform, rf, init, coll)
       |
       +-- xform(rf) --> composed reducer (xrf)
       |
       +-- for each item in coll:
       |       acc = xrf(acc, item)
       |       if isReduced(acc) --> unwrap, return early
       |
       v
  Final accumulator (R)
```

The transducer composition model: transducers are functions `Reducer<R,B> -> Reducer<R,A>`. They compose left-to-right (unlike normal function composition) because each transducer wraps the next reducer. When used with rambda's `pipe`, this gives natural reading order: `pipe(map(f), filter(p), take(5))` processes map first, then filter, then take.

**Early termination flow (the tricky part):**

```
take(n) reducer
    |-- when limit reached, wraps result in Reduced<R>
    |-- BUT the Reducer type signature says it returns R, not R | Reduced<R>
    |
    v
transduce loop
    |-- checks isReduced(acc) after each step
    |-- unwraps .value if reduced
```

### Dependency Graph (Build Order)

```
Layer 0: types           (no deps)
Layer 1: map, filter, take, drop   (depend on types)
Layer 2: transduce       (depends on types)
Layer 3: into            (depends on transduce)
Layer 4: sequence        (depends on into)
```

Build order matches dependency layers. Tests should follow the same order.

## Recommended Test Architecture

### Use Vitest

Vitest is the correct choice. It has native TypeScript support (esbuild/swc transforms), ESM-first design, and works with Yarn PnP. Minimal config needed.

**Confidence:** HIGH (well-established tool, directly relevant to this project's constraints)

### Test File Organization: Co-located with Source

Place test files next to the modules they test:

```
src/
  types/
    index.ts
    index.test.ts       # Unit tests for reduced(), isReduced()
  map/
    index.ts
    index.test.ts       # Unit tests for map transducer
  filter/
    index.ts
    index.test.ts
  take/
    index.ts
    index.test.ts       # Critical: early termination tests
  drop/
    index.ts
    index.test.ts
  transduce/
    index.ts
    index.test.ts       # Integration: transducer + reducing function
  into/
    index.ts
    index.test.ts
  sequence/
    index.ts
    index.test.ts
  index.test.ts          # Integration: composition tests, pipe() tests
  index.test-d.ts        # Type-level tests (compile-time assertions)
```

**Rationale:** Co-location keeps tests discoverable. Each module is small (single function), so one test file per module is sufficient. The barrel `src/index.test.ts` handles composition/integration tests. A separate `index.test-d.ts` handles type-level assertions.

**Confidence:** HIGH (standard pattern for small functional libraries)

### Test Categories

#### 1. Unit Tests (per module)

Each transducer and execution function gets behavioral tests:

```typescript
// src/map/index.test.ts
import { describe, it, expect } from "vitest";
import { map } from "./index.ts";
import { sequence } from "../sequence/index.ts";

describe("map", () => {
  it("transforms each element", () => {
    expect(
      sequence(
        map((x: number) => x * 2),
        [1, 2, 3],
      ),
    ).toEqual([2, 4, 6]);
  });

  it("handles empty collection", () => {
    expect(
      sequence(
        map((x: number) => x * 2),
        [],
      ),
    ).toEqual([]);
  });
});
```

Note: transducer unit tests naturally need an execution function (`sequence` or `transduce`) to drive them. This is expected -- transducers are not directly callable. Use `sequence` for simple cases, `transduce` when testing specific reducer behavior.

#### 2. Early Termination Tests (critical path)

The `take` transducer and `transduce` loop form the most complex interaction. Test thoroughly:

- `take(0)` returns empty
- `take(n)` where n > collection length returns full collection
- `take(n)` with negative n (Clojure treats as 0)
- `take` composed after `map` -- ensures Reduced propagates through composition
- `take` composed before `filter` -- take limits output count, not input count
- Multiple `take` in a pipeline -- inner take should win

#### 3. Composition Tests (integration)

Test transducers composed via rambda's `pipe`:

```typescript
import { pipe } from "rambda";

describe("composition", () => {
  it("map then filter", () => {
    const xf = pipe(
      map((x: number) => x * 2),
      filter((x: number) => x > 4),
    );
    expect(sequence(xf, [1, 2, 3, 4])).toEqual([6, 8]);
  });

  it("filter then take terminates early", () => {
    let callCount = 0;
    const counting = map((x: number) => {
      callCount++;
      return x;
    });
    const xf = pipe(
      counting,
      filter((x: number) => x % 2 === 0),
      take(2),
    );
    // With [1,2,3,4,5,6,7,8], should stop processing after finding 2 even numbers
    expect(sequence(xf, [1, 2, 3, 4, 5, 6, 7, 8])).toEqual([2, 4]);
    expect(callCount).toBeLessThan(8); // Proves early termination
  });
});
```

#### 4. Type-Level Tests

Use Vitest's `expectTypeOf` (built-in, powered by expect-type) for compile-time type assertions:

```typescript
// src/index.test-d.ts
import { expectTypeOf, describe, it } from "vitest";
import { map, filter, take, sequence, transduce } from "./index.ts";
import type { Transducer, Reducer } from "./index.ts";

describe("type-level", () => {
  it("map infers Transducer<A, B>", () => {
    expectTypeOf(map((x: number) => String(x))).toEqualTypeOf<
      Transducer<number, string>
    >();
  });

  it("filter preserves element type", () => {
    expectTypeOf(filter((x: number) => x > 0)).toEqualTypeOf<
      Transducer<number, number>
    >();
  });

  it("sequence infers output type from transducer", () => {
    const xf = map((x: number) => String(x));
    expectTypeOf(sequence(xf, [1, 2, 3])).toEqualTypeOf<string[]>();
  });
});
```

**Confidence:** HIGH (Vitest's `expectTypeOf` is the standard approach; it ships with Vitest, no extra dependency needed)

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    typecheck: {
      include: ["src/**/*.test-d.ts"],
      tsconfig: "./tsconfig.json",
    },
  },
});
```

Add to `package.json` scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:types": "vitest typecheck --run"
}
```

## The Reduced Type Safety Problem

This is the core architectural issue to solve for 0.1.0.

### Current Problem

In `take`, the reducer returns `Reduced<R>` but the type signature says `Reducer<R, A>` which returns `R`:

```typescript
// take/index.ts -- the unsafe casts
return reduced(result) as unknown as R; // Reduced<R> forced to R
return reduced(acc) as unknown as R; // Same
```

In `transduce`, the loop checks `isReduced(acc)` on a value typed as `R`:

```typescript
acc = xrf(acc, item); // acc: R
if (isReduced(acc)) {
  // checking R for Reduced -- works at runtime, lies to the type system
  return acc.value as R; // another unsafe cast
}
```

The `as unknown as R` casts are the exact kind of unsafety this library should eliminate.

### Recommended Solution: Union Return Type in Reducer

Change the internal reducer type to honestly represent that reducers can return either `R` or `Reduced<R>`:

```typescript
// Option A: Separate internal type
type StepResult<R> = R | Reduced<R>;
type InternalReducer<A, B> = (acc: A, input: B) => StepResult<A>;
```

But this creates a problem: the public `Transducer` type would need to know about `Reduced`, leaking implementation details to consumers who compose transducers.

### Better Approach: Branded Phantom Type

Use a branded type so `Reduced<R>` is structurally a subtype of a wrapper, and the transduce loop is the only place that unwraps:

```typescript
// The key insight: Reduced<R> should be opaque at the type level
// The reducer signature stays Reducer<R, A> returning R
// But R itself could *be* Reduced<something> at runtime

// transduce is the boundary where we "know" about Reduced
// All other code just passes R through
```

Actually, the cleanest solution is simpler than either of these:

### Recommended: `ReducerResult<R>` type alias with overloaded `transduce`

```typescript
/** What a step function actually returns */
export type ReducerResult<R> = R | Reduced<R>;

/** A reducing function that may signal early termination */
export type StepFn<R, A> = (acc: R, input: A) => ReducerResult<R>;

/** A transducer transforms one step function into another */
export type Transducer<A, B> = <R>(rf: StepFn<R, B>) => StepFn<R, A>;
```

This is the honest approach. The `Reducer<A, B>` type (which is the _user-facing_ reducing function -- e.g., the array push function passed to `transduce`) stays as `(acc: A, input: B) => A`. But internally, `Transducer` works with `StepFn` which acknowledges the `Reduced` possibility.

The `transduce` function accepts a user `Reducer` but internally wraps it as a `StepFn`:

```typescript
export function transduce<A, B, R>(
  xform: Transducer<A, B>,
  rf: Reducer<R, B>, // User provides a plain reducer
  init: R,
  coll: Iterable<A>,
): R {
  const xrf = xform(rf); // Transducer accepts StepFn, Reducer is compatible (R is a subtype of R | Reduced<R>)
  let acc: ReducerResult<R> = init;
  for (const item of coll) {
    acc = xrf(isReduced(acc) ? acc.value : acc, item); // won't happen in practice, but type-safe
    if (isReduced(acc)) {
      return acc.value;
    }
  }
  return isReduced(acc) ? acc.value : acc;
}
```

And `take` becomes:

```typescript
export function take<A>(n: number): Transducer<A, A> {
  return <R>(rf: StepFn<R, A>): StepFn<R, A> => {
    let taken = 0;
    return (acc: R, input: A): ReducerResult<R> => {
      if (taken < n) {
        taken++;
        const result = rf(acc, input);
        if (taken >= n) {
          return isReduced(result) ? result : reduced(result);
        }
        return result;
      }
      return reduced(acc); // No cast needed!
    };
  };
}
```

**Key benefit:** Zero `as unknown as` casts. The type system honestly represents what happens at runtime.

**Confidence:** HIGH (this mirrors how Clojure's transducers actually work -- step functions return either a value or a Reduced value. The current code does the same thing but lies to TypeScript about it.)

### Impact on Public API

The public-facing types stay clean:

- `Reducer<A, B>` -- user-facing, no `Reduced` knowledge needed
- `Transducer<A, B>` -- uses `StepFn` internally, but the generic `R` is opaque to users
- `transduce(xform, rf, init, coll)` -- accepts plain `Reducer`, returns plain `R`
- `into`, `sequence` -- unchanged signatures

Users who import `Transducer` and compose with `pipe` see no change. The `StepFn` / `ReducerResult` types are exported for advanced users who write custom transducers.

## Patterns to Follow

### Pattern 1: Pure Functions with Closure State

Stateful transducers (`take`, `drop`) use closure variables. This is correct and idiomatic. The state is created fresh each time the transducer is applied to a reducer.

```typescript
export function take<A>(n: number): Transducer<A, A> {
  return <R>(rf: StepFn<R, A>): StepFn<R, A> => {
    let taken = 0; // Fresh state per application
    return (acc, input) => {
      /* ... */
    };
  };
}
```

**Test implication:** Verify that reusing a transducer value resets state:

```typescript
const t = take(2);
expect(sequence(t, [1, 2, 3])).toEqual([1, 2]);
expect(sequence(t, [4, 5, 6])).toEqual([4, 5]); // Must work -- fresh closure
```

### Pattern 2: Transducer as the Composition Unit

Transducers compose by function composition. With `pipe(map(f), filter(p))`, `map(f)` receives the reducer produced by `filter(p)`. The leftmost transducer in `pipe` is the outermost wrapper -- it sees input first.

**Test implication:** Order matters and should be tested explicitly.

### Pattern 3: Property-Based Testing for Transducers

Transducers have algebraic properties that are excellent candidates for property-based tests (using fast-check):

1. **Identity:** `sequence(map(x => x), coll)` equals `[...coll]`
2. **Composition equivalence:** `sequence(pipe(map(f), map(g)), coll)` equals `sequence(map(x => g(f(x))), coll)`
3. **Filter idempotence:** `sequence(pipe(filter(p), filter(p)), coll)` equals `sequence(filter(p), coll)`
4. **Take/drop partition:** `[...sequence(take(n), coll), ...sequence(drop(n), coll)]` equals `[...coll]`

**Confidence:** MEDIUM (property-based testing is valuable but may be overkill for 0.1.0 -- suggest as optional enhancement)

## Anti-Patterns to Avoid

### Anti-Pattern 1: Testing Implementation Details

**What:** Testing internal state of closures (e.g., checking `taken` counter value).
**Why bad:** Couples tests to implementation, breaks on refactor.
**Instead:** Test observable behavior only -- input/output pairs and side effects (like early termination proving fewer iterations).

### Anti-Pattern 2: Over-mocking the Reducer

**What:** Using mocks/spies for the reducing function in every test.
**Why bad:** Transducers are pure data transformations. Using `sequence` to test them is simpler and more readable than mock-based tests.
**Instead:** Use `sequence` or `into` for most tests. Use `transduce` with a custom reducer only when testing specific accumulation behavior.

### Anti-Pattern 3: Ignoring Statefulness Between Calls

**What:** Assuming transducers are stateless after first use.
**Why bad:** `take` and `drop` have mutable closure state. If someone accidentally reuses the _inner_ reducer (the result of `take(2)(rf)`) across two collections, state carries over.
**Instead:** Document that transducer _application_ (calling `xform(rf)`) creates a fresh stateful reducer. Test that `sequence` calls the transducer freshly each time.

## Test Build Order (Phase Implications)

Tests should be built in dependency order to catch issues early:

1. **types** -- `reduced()`, `isReduced()`. Foundation. Test first.
2. **Stateless transducers** -- `map`, `filter`. Simple, no early termination.
3. **Stateful transducers** -- `take`, `drop`. State management, early termination.
4. **transduce** -- Integration of transducer + reducer + Reduced unwrapping.
5. **into, sequence** -- Thin wrappers, mostly verify delegation.
6. **Composition** -- `pipe` integration, multi-transducer pipelines.
7. **Type-level tests** -- Verify type inference works correctly.

This matches the dependency graph and puts the most complex interaction (take + transduce Reduced handling) at step 3-4, after the foundations are solid.

## Scalability Considerations

Not relevant for this library -- it processes finite iterables eagerly. The library is feature-complete for its scope. The architecture concern is correctness and type safety, not scale.

## Sources

- Clojure transducer reference: https://clojure.org/reference/transducers (authoritative for behavioral semantics)
- Vitest documentation: https://vitest.dev/ (test runner choice)
- Vitest `expectTypeOf`: https://vitest.dev/guide/testing-types.html (type-level testing)
- Analysis of existing codebase (primary source for architecture assessment)

**Note:** Web search was unavailable during research. Stack recommendations for Vitest are based on training data (HIGH confidence -- Vitest is well-established and widely used for TypeScript ESM projects). The `ReducerResult` type redesign is based on direct analysis of the codebase and Clojure's transducer protocol semantics.
