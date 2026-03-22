# Phase 1: Reduced Type Redesign - Research

**Researched:** 2026-03-22
**Domain:** TypeScript type system -- discriminated unions, type narrowing, function subtyping
**Confidence:** HIGH

## Summary

Phase 1 eliminates three unsafe casts (`as unknown as R`) by introducing `StepFn<R, A> = (acc: R, input: A) => R | Reduced<R>` as the internal return type for transducer step functions. The current `Reducer<A, B>` type forces step functions to claim they return `R`, but `take` actually returns `Reduced<R>` for early termination. The fix makes the type system acknowledge the `Reduced<R>` possibility throughout the transducer pipeline.

The change is structurally simple (8 files touched, ~20 lines changed) but requires careful attention to TypeScript's function subtyping rules. The key insight: a `Reducer<R, B>` (returns `R`) is safely assignable to `StepFn<R, B>` (returns `R | Reduced<R>`) because `R` is a subtype of `R | Reduced<R>` -- this is covariant widening of the return type. The one cast needed (`rf as StepFn<R, B>` in `transduce`) is provably safe.

**Primary recommendation:** Implement the type changes in dependency order: types first, then transducers (map/filter/take/drop), then transduce, then verify into/sequence need no changes. Export `StepFn` publicly per D-04.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Introduce `StepFn<R, A> = (acc: R, input: A) => R | Reduced<R>` as a new type in `src/types/index.ts`
- **D-02:** `Transducer<A, B>` is widened to `<R>(rf: StepFn<R, B>) => StepFn<R, A>` -- it now references `StepFn` instead of `Reducer`
- **D-03:** No `InternalTransducer` alias -- each transducer function inlines `StepFn` in its closure signature
- **D-04:** `StepFn` is exported as a first-class public type alongside `Reducer`, `Transducer`, `Reduced`
- **D-05:** Pass-through pattern -- `map` and `filter` return whatever the downstream `rf` returns without inspecting or re-wrapping `Reduced`. The `R | Reduced<R>` union propagates naturally.
- **D-06:** Only `take` (and future early-termination transducers) call `reduced()` to produce `Reduced<R>` values
- **D-07:** Only `transduce` (the driver loop) checks `isReduced()` and unwraps -- no intermediate transducer inspects `Reduced`
- **D-08:** `transduce` keeps `Reducer<R, B>` in its parameter signature (consumer-friendly). Internally, performs one safe widening cast: `rf as StepFn<R, B>`.
- **D-09:** `Reducer<A, B> = (acc: A, input: B) => A` is unchanged
- **D-10:** `into` and `sequence` function signatures are unchanged

### Claude's Discretion

- Exact narrowing approach in the `transduce` loop -- find the cleanest way to track `R | Reduced<R>` through the for-of loop and narrow to `R` at the return
- Whether `drop` needs any changes (it doesn't use `Reduced` today, but its `rf` parameter type changes to `StepFn`)

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                               | Research Support                    |
| ------- | ----------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| TYPE-01 | Eliminate `as unknown as R` casts in take transducer by redesigning Reduced type handling | StepFn type lets take return `R     | Reduced<R>` honestly; two casts on lines 15 and 19 of take/index.ts are eliminated        |
| TYPE-02 | Eliminate `as unknown as R` cast in transduce function (same Reduced redesign)            | transduce loop variable typed as `R | Reduced<R>` with isReduced narrowing; cast on line 18 of transduce/index.ts is eliminated |

</phase_requirements>

## Architecture Patterns

### Type Change Cascade

The type changes flow through the dependency graph:

```
src/types/index.ts     -- Add StepFn, widen Transducer
    |
    +-- src/map/index.ts       -- Return type widens to R | Reduced<R> (pass-through)
    +-- src/filter/index.ts    -- Return type widens to R | Reduced<R> (pass-through)
    +-- src/take/index.ts      -- Return type widens to R | Reduced<R> (removes casts)
    +-- src/drop/index.ts      -- Return type widens to R | Reduced<R> (pass-through)
    +-- src/transduce/index.ts -- Internal loop typed with R | Reduced<R>, removes cast
    |       |
    |       +-- src/into/index.ts      -- No changes (delegates to transduce)
    |       +-- src/sequence/index.ts  -- No changes (delegates to into)
    |
    +-- src/index.ts           -- Add StepFn to type exports
```

### Pattern 1: StepFn Type Definition

**What:** New type alias that models the actual return of transducer step functions.
**When to use:** Internally in all transducer closures and the Transducer type itself.

```typescript
// src/types/index.ts -- NEW
export type StepFn<R, A> = (acc: R, input: A) => R | Reduced<R>;
```

### Pattern 2: Widened Transducer Type

**What:** Transducer now maps StepFn to StepFn instead of Reducer to Reducer.

```typescript
// src/types/index.ts -- CHANGED
export type Transducer<A, B> = <R>(rf: StepFn<R, B>) => StepFn<R, A>;
```

### Pattern 3: Pass-Through Return in map/filter

**What:** map and filter closures return `R | Reduced<R>` because their downstream `rf` (now a `StepFn`) may return `Reduced<R>`. No logic changes needed -- just the type annotations widen.

```typescript
// src/map/index.ts -- type annotations change, logic identical
export function map<A, B>(f: (a: A) => B): Transducer<A, B> {
  return <R>(rf: StepFn<R, B>): StepFn<R, A> =>
    (acc: R, input: A): R | Reduced<R> =>
      rf(acc, f(input));
}
```

The key: `rf(acc, f(input))` already returns `R | Reduced<R>` from the StepFn signature. The closure just passes it through. TypeScript infers this correctly.

### Pattern 4: Honest Returns in take

**What:** take returns `Reduced<R>` directly without casting, since its return type is now `R | Reduced<R>`.

```typescript
// src/take/index.ts -- casts removed
export function take<A>(n: number): Transducer<A, A> {
  return <R>(rf: StepFn<R, A>): StepFn<R, A> => {
    let taken = 0;
    return (acc: R, input: A): R | Reduced<R> => {
      if (taken < n) {
        taken++;
        const result = rf(acc, input);
        if (taken >= n) {
          // result is R | Reduced<R>; if already Reduced, wrapping again is fine
          // but we want to signal termination. Need to handle both cases.
          return isReduced(result) ? result : reduced(result);
        }
        return result;
      }
      return reduced(acc);
    };
  };
}
```

**Important subtlety:** When `taken >= n`, `result` is `R | Reduced<R>`. If the downstream `rf` already returned `Reduced<R>` (e.g., a nested take), we should not double-wrap. Use `isReduced(result) ? result : reduced(result)` to avoid double-wrapping. This matches Clojure's `ensure-reduced` pattern.

Alternatively, since `transduce` only checks the outermost layer, double-wrapping `reduced(reduced(x))` would produce `Reduced<Reduced<R>>` which does NOT satisfy `Reduced<R>` -- so preventing double-wrap is necessary for type correctness.

### Pattern 5: Safe Widening Cast in transduce

**What:** Consumer provides `Reducer<R, B>` (returns `R`). Internally cast to `StepFn<R, B>` (returns `R | Reduced<R>`). This is safe: a function returning `R` is a valid function returning `R | Reduced<R>` (covariant return).

```typescript
export function transduce<A, B, R>(
  xform: Transducer<A, B>,
  rf: Reducer<R, B>,
  init: R,
  coll: Iterable<A>,
): R {
  const xrf = xform(rf as StepFn<R, B>);
  let acc: R | Reduced<R> = init;
  for (const item of coll) {
    acc = xrf(acc as R, item); // acc entering each step is always R (unwrapped)
    if (isReduced(acc)) {
      return acc.value;
    }
  }
  return acc; // TypeScript knows: after loop, if not Reduced, it's R
}
```

**Discretion area -- narrowing in the loop:** The cleanest approach uses two observations:

1. At loop entry, `acc` is `R` (either from `init` or from the previous iteration where we confirmed it wasn't `Reduced`).
2. After `xrf(acc, item)`, `acc` is `R | Reduced<R>`.
3. The `isReduced` check narrows and returns early.
4. After the if-block, TypeScript narrows `acc` to `R` for the next iteration.

However, there's a nuance: `xrf` expects `acc: R` but our loop variable is typed `R | Reduced<R>`. We need to either: (a) use a separate variable for the "confirmed unwrapped" accumulator, or (b) cast `acc as R` when passing to `xrf` since we know it's `R` at that point (the `isReduced` check would have returned early otherwise).

**Recommended approach -- separate variables:**

```typescript
const xrf = xform(rf as StepFn<R, B>);
let acc: R = init;
for (const item of coll) {
  const stepResult = xrf(acc, item);
  if (isReduced(stepResult)) {
    return stepResult.value;
  }
  acc = stepResult;
}
return acc;
```

This uses zero casts beyond the one safe widening (`rf as StepFn<R, B>`). The `acc` variable stays typed as `R` throughout. The temporary `stepResult` is `R | Reduced<R>`, and TypeScript narrows it after the `isReduced` check. This is the cleanest pattern.

### Pattern 6: Drop -- No Logic Changes

**What:** `drop` does not use `Reduced` and only passes through `rf` results. Its type annotations change to use `StepFn` but no logic changes needed.

```typescript
export function drop<A>(n: number): Transducer<A, A> {
  return <R>(rf: StepFn<R, A>): StepFn<R, A> => {
    let dropped = 0;
    return (acc: R, input: A): R | Reduced<R> => {
      if (dropped < n) {
        dropped++;
        return acc; // R -- fine, member of R | Reduced<R>
      }
      return rf(acc, input); // R | Reduced<R> -- pass-through
    };
  };
}
```

### Anti-Patterns to Avoid

- **Double-wrapping Reduced:** Never call `reduced(x)` when `x` might already be `Reduced<R>`. Use `isReduced(x) ? x : reduced(x)` pattern (equivalent to Clojure's `ensure-reduced`).
- **Casting in the wrong direction:** `rf as StepFn` (widening return type) is safe. Never cast `StepFn as Reducer` (narrowing return type) -- that hides the Reduced possibility.
- **Exposing `R | Reduced<R>` in consumer APIs:** `transduce`, `into`, `sequence` signatures must use `Reducer<R, B>` for the consumer-facing `rf` parameter, not `StepFn`.

## Don't Hand-Roll

| Problem                 | Don't Build                       | Use Instead                              | Why                                                    |
| ----------------------- | --------------------------------- | ---------------------------------------- | ------------------------------------------------------ |
| ensure-reduced          | Custom logic to check-then-wrap   | `isReduced(x) ? x : reduced(x)` pattern  | Prevents double-wrapping, matches Clojure semantics    |
| Type narrowing in loops | Complex generic conditional types | Separate variable pattern (`stepResult`) | TypeScript's control flow analysis handles it natively |

## Common Pitfalls

### Pitfall 1: Double-Wrapping Reduced Values

**What goes wrong:** `take` calls `reduced(result)` where `result` is already `Reduced<R>` from a downstream `take`. This produces `Reduced<Reduced<R>>` which TypeScript rejects as not assignable to `R | Reduced<R>`.
**Why it happens:** With `Reducer` types, `rf` always returned `R`. With `StepFn`, `rf` returns `R | Reduced<R>`.
**How to avoid:** Check `isReduced(result)` before wrapping: `isReduced(result) ? result : reduced(result)`.
**Warning signs:** Type error `Reduced<Reduced<R>> is not assignable to R | Reduced<R>`.

### Pitfall 2: Loop Variable Narrowing

**What goes wrong:** Typing the loop accumulator as `R | Reduced<R>` and then passing it to `xrf(acc, item)` where `xrf` expects `acc: R`. TypeScript correctly rejects this.
**Why it happens:** The union type doesn't narrow between loop iterations without explicit control flow.
**How to avoid:** Use the separate-variable pattern: keep `acc` as `R`, use `stepResult` for `R | Reduced<R>`.
**Warning signs:** Type error `R | Reduced<R> is not assignable to R`.

### Pitfall 3: Forgetting to Export StepFn

**What goes wrong:** `StepFn` is used in the `Transducer` type definition. If `Transducer` is exported but `StepFn` is not, consumers can use `Transducer` but can't write custom transducers because they can't reference the `StepFn` type.
**Why it happens:** Treating `StepFn` as internal when it's part of the public type surface via `Transducer`.
**How to avoid:** Per D-04, export `StepFn` in `src/index.ts` barrel.

### Pitfall 4: acc Parameter in StepFn

**What goes wrong:** `StepFn<R, A> = (acc: R, input: A) => R | Reduced<R>` takes `acc: R` (not `R | Reduced<R>`). This is correct -- the accumulator entering a step is always unwrapped. But if someone tries to make the parameter `R | Reduced<R>`, all downstream step functions break.
**Why it happens:** Confusion between the return type (which includes Reduced) and the input parameter (which is always unwrapped).
**How to avoid:** The invariant is: `transduce` always unwraps before the next step. The accumulator entering a step is always `R`.

### Pitfall 5: tsup .d.ts Exposure

**What goes wrong:** Success criterion says `.d.ts` files must not expose internal `StepFn/ReducerResult` types. However, D-04 says `StepFn` IS a public type. The success criterion references `ReducerResult<R>` which is the requirement name, not necessarily the final type name.
**Why it happens:** Mismatch between requirements doc naming (`ReducerResult<R>`) and implementation naming (`StepFn<R, A>`).
**How to avoid:** The success criterion says "do not expose internal StepFn/ReducerResult types" but D-04 says StepFn is public. D-04 takes precedence as a locked decision. The success criterion likely means: don't leak types that consumers shouldn't use (e.g., helper types). Since StepFn is deliberately public, its presence in .d.ts is correct. Verify that only intentionally public types appear.

## Code Examples

### Complete types/index.ts After Changes

```typescript
// src/types/index.ts

/**
 * A reducing function: takes an accumulator and an input, returns a new accumulator.
 */
export type Reducer<A, B> = (acc: A, input: B) => A;

/**
 * A step function: like a Reducer but may signal early termination via Reduced.
 */
export type StepFn<R, A> = (acc: R, input: A) => R | Reduced<R>;

/**
 * A transducer transforms one step function into another.
 */
export type Transducer<A, B> = <R>(rf: StepFn<R, B>) => StepFn<R, A>;

/**
 * Sentinel value wrapping a result to signal early termination.
 */
export interface Reduced<T> {
  readonly value: T;
  readonly __reduced: true;
}

export function reduced<T>(value: T): Reduced<T> {
  return { value, __reduced: true };
}

export function isReduced<T>(x: T | Reduced<T>): x is Reduced<T> {
  return (
    x !== null &&
    typeof x === "object" &&
    "__reduced" in x &&
    x.__reduced === true
  );
}
```

### Complete transduce/index.ts After Changes (Recommended)

```typescript
import type { Reducer, StepFn, Transducer } from "../types/index.ts";
import { isReduced } from "../types/index.ts";

/**
 * Apply a transducer to a collection with a reducing function and initial value.
 */
export function transduce<A, B, R>(
  xform: Transducer<A, B>,
  rf: Reducer<R, B>,
  init: R,
  coll: Iterable<A>,
): R {
  const xrf = xform(rf as StepFn<R, B>);
  let acc: R = init;
  for (const item of coll) {
    const stepResult = xrf(acc, item);
    if (isReduced(stepResult)) {
      return stepResult.value;
    }
    acc = stepResult;
  }
  return acc;
}
```

### Complete take/index.ts After Changes

```typescript
import type { StepFn, Transducer } from "../types/index.ts";
import { isReduced, reduced } from "../types/index.ts";

/**
 * Returns a transducer that takes the first `n` elements, then terminates early.
 */
export function take<A>(n: number): Transducer<A, A> {
  return <R>(rf: StepFn<R, A>): StepFn<R, A> => {
    let taken = 0;
    return (acc: R, input: A): R | Reduced<R> => {
      if (taken < n) {
        taken++;
        const result = rf(acc, input);
        if (taken >= n) {
          return isReduced(result) ? result : reduced(result);
        }
        return result;
      }
      return reduced(acc);
    };
  };
}
```

## State of the Art

| Old Approach                      | Current Approach                                  | When Changed | Impact                               |
| --------------------------------- | ------------------------------------------------- | ------------ | ------------------------------------ |
| `Reducer` for all step functions  | `StepFn` for internal, `Reducer` for consumer API | This phase   | Eliminates all unsafe casts          |
| `as unknown as R` to hide Reduced | Union type `R \| Reduced<R>`                      | This phase   | Type system tracks early termination |

## Validation Architecture

### Test Framework

| Property           | Value                                            |
| ------------------ | ------------------------------------------------ |
| Framework          | None configured yet (Vitest planned for Phase 3) |
| Config file        | None                                             |
| Quick run command  | `yarn typecheck` (type-level verification)       |
| Full suite command | `yarn check` (typecheck + lint + fmt:check)      |

### Phase Requirements to Test Map

| Req ID  | Behavior                                | Test Type               | Automated Command                                            | File Exists?     |
| ------- | --------------------------------------- | ----------------------- | ------------------------------------------------------------ | ---------------- |
| TYPE-01 | No `as unknown as R` casts in take      | manual grep + typecheck | `yarn typecheck && ! grep -r 'as unknown as' src/take/`      | N/A (grep check) |
| TYPE-02 | No `as unknown as R` casts in transduce | manual grep + typecheck | `yarn typecheck && ! grep -r 'as unknown as' src/transduce/` | N/A (grep check) |

### Sampling Rate

- **Per task commit:** `yarn typecheck`
- **Per wave merge:** `yarn check`
- **Phase gate:** `yarn check` + `yarn build` + verify no `as unknown as` in src/ + verify .d.ts output

### Wave 0 Gaps

None -- no test framework exists yet (Phase 3). This phase relies on `yarn typecheck` and `yarn build` for verification, plus manual inspection of .d.ts output.

## Open Questions

1. **Double-wrapping in take**
   - What we know: When `result` from `rf(acc, input)` is `Reduced<R>`, we must not double-wrap.
   - What's unclear: Whether `isReduced(result) ? result : reduced(result)` is sufficient or if an `ensureReduced` helper should be introduced.
   - Recommendation: Use inline `isReduced` check for now. If more transducers need this pattern later (takeWhile, etc.), extract to a helper in types. Keep it simple for Phase 1.

2. **Success criteria vs. D-04 tension**
   - What we know: Success criteria says ".d.ts files do not expose internal StepFn/ReducerResult types." D-04 says StepFn is public.
   - What's unclear: Whether the success criteria needs updating or if it refers to other types.
   - Recommendation: Follow D-04 (locked decision). StepFn appears in .d.ts because it's public. The success criteria likely refers to avoiding leaking implementation-only types. `ReducerResult` was a requirements-doc placeholder name; the actual implementation type is `StepFn`.

## Project Constraints (from CLAUDE.md)

- TypeScript strict mode with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`
- ESM only (`"type": "module"`)
- Imports use `.ts` extensions
- Type imports use `import type` syntax
- One module per function in its own directory with dedicated `tsconfig.json`
- Formatter: oxfmt; Linter: oxlint
- `yarn check` must pass (typecheck + lint + fmt:check)

## Sources

### Primary (HIGH confidence)

- Source code inspection: `src/types/index.ts`, `src/take/index.ts`, `src/transduce/index.ts`, `src/map/index.ts`, `src/filter/index.ts`, `src/drop/index.ts`, `src/into/index.ts`, `src/sequence/index.ts`
- TypeScript handbook on discriminated unions and type narrowing (training data, verified against TS 5.x behavior)
- `tsconfig.base.json` and module tsconfigs for compiler settings

### Secondary (MEDIUM confidence)

- TypeScript function subtyping rules (covariant return types) -- well-established language feature

### Tertiary (LOW confidence)

- None

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- no new packages, pure type-level refactor
- Architecture: HIGH -- all source files read and analyzed, type flow traced through entire dependency graph
- Pitfalls: HIGH -- identified from direct analysis of the type algebra involved

**Research date:** 2026-03-22
**Valid until:** Indefinite (pure TypeScript type system analysis, no external dependencies)
