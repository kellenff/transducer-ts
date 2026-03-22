# Roadmap: transducer-ts

## Overview

Ship transducer-ts 0.1.0: a type-safe, tested, documented TypeScript port of Clojure's transducers. The work moves from fixing the one structural type defect (unsafe casts in take/transduce), through edge case behavior, a comprehensive test suite built in dependency order, to package metadata and documentation that make the library publishable. Every phase delivers a verifiable capability; no phase depends on anything beyond its predecessors.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Reduced Type Redesign** - Eliminate unsafe casts by introducing ReducerResult/StepFn types
- [ ] **Phase 2: Edge Case Behavior** - Handle negative/zero n in take and drop to match Clojure semantics
- [ ] **Phase 3: Test Infrastructure** - Configure Vitest with Yarn PnP and coverage thresholds
- [ ] **Phase 4: Stateless Transducer Tests** - Unit tests for map and filter
- [ ] **Phase 5: Stateful Transducer Tests** - Unit tests for take and drop including edge cases
- [ ] **Phase 6: Execution Function Tests** - Unit tests for transduce, into, and sequence
- [ ] **Phase 7: Composition and Type-Level Tests** - Pipe composition tests, edge case matrix, type-level assertions
- [ ] **Phase 8: Package Metadata** - All package.json fields, license, publish validation tooling
- [ ] **Phase 9: Documentation** - README rewrite with API reference and JSDoc on all exports

## Phase Details

### Phase 1: Reduced Type Redesign

**Goal**: All transducer internals are type-sound with zero unsafe casts
**Depends on**: Nothing (first phase)
**Requirements**: TYPE-01, TYPE-02
**Plans:** 1 plan

Plans:

- [ ] 01-01-PLAN.md -- Add StepFn type, update all transducers and barrel export

**Success Criteria** (what must be TRUE):

1. `yarn typecheck` passes with no `as unknown as` casts in take or transduce
2. `ReducerResult<R>` and `StepFn<R, A>` types exist in src/types/ and are used by take and transduce internally
3. The public API surface (Transducer, Reducer, into, sequence signatures) is unchanged
4. `yarn build` produces .d.ts files that do not expose internal StepFn/ReducerResult types

### Phase 2: Edge Case Behavior

**Goal**: take and drop handle boundary inputs (negative n, zero n) matching Clojure semantics
**Depends on**: Phase 1
**Requirements**: TYPE-03, TYPE-04, TYPE-05, TYPE-06
**Success Criteria** (what must be TRUE):

1. `take(-1)` applied to any collection returns an empty result (same as take(0))
2. `drop(-1)` applied to any collection passes all elements through (same as drop(0))
3. `take(0)` returns an empty result
4. `drop(0)` passes all elements through unchanged
   **Plans**: TBD

### Phase 3: Test Infrastructure

**Goal**: Vitest runs and reports coverage in this Yarn PnP project
**Depends on**: Phase 1
**Requirements**: TEST-01, TEST-12
**Success Criteria** (what must be TRUE):

1. `yarn test` executes vitest and exits successfully (even with zero test files)
2. Coverage reporting is enabled with V8 provider and 95% threshold configured
3. vitest.config.ts exists and works with Yarn PnP (no node_modules resolution errors)
   **Plans**: TBD

### Phase 4: Stateless Transducer Tests

**Goal**: map and filter transducers are proven correct with unit tests
**Depends on**: Phase 3
**Requirements**: TEST-02, TEST-03
**Success Criteria** (what must be TRUE):

1. map tests verify basic transform, identity function, and type preservation
2. filter tests verify basic predicate, always-true predicate, and always-false predicate
3. All tests pass via `yarn test`
   **Plans**: TBD

### Phase 5: Stateful Transducer Tests

**Goal**: take and drop transducers are proven correct including all edge cases from Phase 2
**Depends on**: Phase 2, Phase 3
**Requirements**: TEST-04, TEST-05
**Success Criteria** (what must be TRUE):

1. take tests verify basic take, n > collection length, n = 0, and early termination proof
2. drop tests verify basic drop, n > collection length, and n = 0
3. Tests for negative n values confirm Clojure-compatible behavior
4. Each test creates a fresh transducer instance (no state leakage between assertions)
   **Plans**: TBD

### Phase 6: Execution Function Tests

**Goal**: transduce, into, and sequence are proven correct with unit tests
**Depends on**: Phase 4
**Requirements**: TEST-06, TEST-07, TEST-08
**Success Criteria** (what must be TRUE):

1. transduce tests verify basic reduction, early termination, and Reduced unwrapping
2. into tests verify array building, empty input, and transducer application
3. sequence tests verify basic usage, empty input, and composition
4. All tests pass via `yarn test`
   **Plans**: TBD

### Phase 7: Composition and Type-Level Tests

**Goal**: Pipe composition across multiple transducers is proven correct at runtime and type level
**Depends on**: Phase 5, Phase 6
**Requirements**: TEST-09, TEST-10, TEST-11
**Success Criteria** (what must be TRUE):

1. Composition tests pass for 2-deep, 3-deep, and filter+map+take pipelines via rambda pipe
2. Edge case matrix covers empty collections, single element, and negative n across composed pipelines
3. Type-level tests using expectTypeOf verify correct inference through pipe chains at 1, 2, and 3+ arity
4. `yarn test` passes with coverage at or above 95%
   **Plans**: TBD

### Phase 8: Package Metadata

**Goal**: Package is mechanically ready for npm publish
**Depends on**: Phase 7
**Requirements**: PKG-01, PKG-02, PKG-03, PKG-04, PKG-05, PKG-06, PKG-07, PKG-08, PKG-09, PKG-10, PKG-11
**Success Criteria** (what must be TRUE):

1. `npm pack --dry-run` shows only dist/ contents (no .planning/, .pnp.cjs, src/)
2. `npx @arethetypeswrong/cli --pack` reports no resolution errors for any subpath export
3. `npx publint` passes with no errors
4. `yarn prepublishOnly` runs the full gate (check + build + attw + publint) and passes
5. UNLICENSE file exists at repo root
   **Plans**: TBD

### Phase 9: Documentation

**Goal**: A developer discovering this library can understand what it does, how to use it, and how to compose transducers
**Depends on**: Phase 7
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06, DOC-07
**Success Criteria** (what must be TRUE):

1. README contains install instructions, API reference for all 7 exports, and pipe composition examples
2. README includes an early termination example demonstrating take
3. README documents the Clojure semantics design decision and ESM-only / rambda peer dep constraints
4. Every exported function has JSDoc with @param, @returns, and @example tags
5. README examples are consistent with the actual API (verified by existing test suite)
   **Plans**: TBD
   **UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9

| Phase                               | Plans Complete | Status      | Completed |
| ----------------------------------- | -------------- | ----------- | --------- |
| 1. Reduced Type Redesign            | 0/1            | Not started | -         |
| 2. Edge Case Behavior               | 0/TBD          | Not started | -         |
| 3. Test Infrastructure              | 0/TBD          | Not started | -         |
| 4. Stateless Transducer Tests       | 0/TBD          | Not started | -         |
| 5. Stateful Transducer Tests        | 0/TBD          | Not started | -         |
| 6. Execution Function Tests         | 0/TBD          | Not started | -         |
| 7. Composition and Type-Level Tests | 0/TBD          | Not started | -         |
| 8. Package Metadata                 | 0/TBD          | Not started | -         |
| 9. Documentation                    | 0/TBD          | Not started | -         |
