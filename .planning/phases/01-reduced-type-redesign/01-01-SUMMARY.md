---
phase: 01-reduced-type-redesign
plan: 01
subsystem: types
tags: [typescript, transducers, type-safety, generics]

# Dependency graph
requires: []
provides:
  - "StepFn<R, A> type alias for step functions returning R | Reduced<R>"
  - "Widened Transducer type using StepFn instead of Reducer"
  - "Cast-free take and transduce implementations"
affects: [02-test-foundation, 03-edge-cases, 07-rambda-pipe]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "StepFn union return type for honest early-termination modeling"
    - "ensure-reduced pattern: isReduced(result) ? result : reduced(result)"
    - "separate-variable pattern in transduce loop to avoid narrowing issues"

key-files:
  created: []
  modified:
    - src/types/index.ts
    - src/map/index.ts
    - src/filter/index.ts
    - src/take/index.ts
    - src/drop/index.ts
    - src/transduce/index.ts
    - src/index.ts

key-decisions:
  - "StepFn as union return type (R | Reduced<R>) instead of branded Reducer"
  - "One safe widening cast (rf as StepFn) in transduce to bridge Reducer/StepFn boundary"
  - "Added Reduced to type imports in transducer closures for explicit return annotations"

patterns-established:
  - "StepFn union return: transducer closures return R | Reduced<R> explicitly"
  - "ensure-reduced: guard against double-wrapping with isReduced check"
  - "separate-variable: use const stepResult in loops to let TS narrow correctly"

requirements-completed: [TYPE-01, TYPE-02]

# Metrics
duration: 1min
completed: 2026-03-23
---

# Phase 01 Plan 01: Reduced Type Redesign Summary

**Introduced StepFn<R, A> union return type eliminating all 3 unsafe `as unknown as R` casts from take and transduce**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-23T00:22:33Z
- **Completed:** 2026-03-23T00:24:01Z
- **Tasks:** 1
- **Files modified:** 7

## Accomplishments

- Added `StepFn<R, A> = (acc: R, input: A) => R | Reduced<R>` type that honestly models early termination
- Widened `Transducer` type to use `StepFn` instead of `Reducer` in both parameter and return positions
- Eliminated all 3 `as unknown as R` casts (2 in take, 1 in transduce) with zero remaining unsafe casts in src/
- Preserved `Reducer` type unchanged and `into`/`sequence` signatures unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Add StepFn type and update types, transducers, and barrel export** - `90a2167` (feat)

**Plan metadata:** [pending final commit] (docs: complete plan)

## Files Created/Modified

- `src/types/index.ts` - Added StepFn type alias, widened Transducer to use StepFn
- `src/map/index.ts` - Updated to use StepFn in closure, added Reduced to imports
- `src/filter/index.ts` - Updated to use StepFn in closure, added Reduced to imports
- `src/take/index.ts` - Replaced unsafe casts with ensure-reduced pattern, uses StepFn
- `src/drop/index.ts` - Updated to use StepFn in closure, added Reduced to imports
- `src/transduce/index.ts` - Uses safe widening cast (rf as StepFn) and separate-variable pattern
- `src/index.ts` - Added StepFn to public type re-exports

## Decisions Made

- Used `StepFn` as a union return type (`R | Reduced<R>`) rather than a branded or wrapper approach -- this lets TypeScript's control flow analysis handle narrowing naturally
- Kept one safe widening cast (`rf as StepFn<R, B>`) in transduce where `Reducer` is widened to `StepFn` -- this is safe because every `Reducer` is a valid `StepFn` (the union just adds `Reduced<R>` as a possible return)
- Added `Reduced` to type imports in map, filter, take, drop closures -- the plan omitted these imports but they are required for the explicit `R | Reduced<R>` return type annotations (auto-fixed)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing Reduced type import to transducer closures**

- **Found during:** Task 1 (Step 9 - format and verify)
- **Issue:** Plan code for map, filter, take, drop used `R | Reduced<R>` in return type annotations but only imported `StepFn` and `Transducer` -- TypeScript error TS2304: Cannot find name 'Reduced'
- **Fix:** Added `Reduced` to the `import type` statement in all 4 files
- **Files modified:** src/map/index.ts, src/filter/index.ts, src/take/index.ts, src/drop/index.ts
- **Verification:** `yarn check` passes with zero errors
- **Committed in:** 90a2167 (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Missing import was a plan oversight. Fix is minimal and necessary for compilation. No scope creep.

## Issues Encountered

None beyond the missing import deviation above.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all code is fully implemented.

## Next Phase Readiness

- Type foundation is complete and sound -- all transducers use StepFn with honest return types
- Ready for Phase 02 (test foundation) -- types are stable and correct
- `into` and `sequence` need no changes, confirming backward compatibility

---

_Phase: 01-reduced-type-redesign_
_Completed: 2026-03-23_
