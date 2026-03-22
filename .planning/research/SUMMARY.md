# Project Research Summary

**Project:** transducer-ts (test, polish, publish milestone)
**Domain:** TypeScript functional library — npm publish readiness
**Researched:** 2026-03-22
**Confidence:** HIGH

## Executive Summary

transducer-ts is a TypeScript port of Clojure's transducer protocol: composable, type-safe algorithmic transformations that compose left-to-right via `pipe` and execute eagerly over iterables. The core functional surface is complete — `map`, `filter`, `take`, `drop`, `transduce`, `into`, and `sequence` are all implemented. The gap between current state and a publishable 0.1.0 is entirely in correctness, type safety, test coverage, and package metadata — not missing features.

The recommended approach is to fix the one structural type unsoundness first (`take` uses `as unknown as R` to smuggle `Reduced<R>` through a `Reducer<R, A>` return type), then build a comprehensive test suite on the corrected foundation, then prepare the package for npm publication. Research strongly converges on this order: tests written against the unsound types would need rewriting if signatures change, so the type fix is a genuine prerequisite. The test suite itself validates the library's core value proposition — type-safe pipe composition — so it cannot be deferred.

The key risks are: (1) the `Reduced` type leak causing silent early-termination failures for anyone writing a custom reduction loop, (2) stateful transducer test state leaking between assertions if not carefully isolated, and (3) the package shipping without the metadata consumers need (`private: true` blocks publishing outright; missing `files` field would publish everything including `.planning/`, `.pnp.cjs`, and source). All three risks are well-understood and straightforwardly preventable.

## Key Findings

### Recommended Stack

The existing toolchain (TypeScript 5.9, tsup, Yarn 4 PnP, oxlint, oxfmt, husky + lint-staged) is correct and needs no changes. The only additions required are: **vitest** (^4.1.0) and **@vitest/coverage-v8** (^4.1.0) for testing, plus **@arethetypeswrong/cli** (^0.18.2) and **publint** (^0.3.18) for pre-publish validation. Vitest is the clear choice over Jest because it has native ESM support, native TypeScript via esbuild, and works with Yarn PnP without plugins. The two publish-validation tools are critical given the project has 9 subpath exports that must resolve correctly under three `moduleResolution` modes.

**Core technologies:**

- Vitest + @vitest/coverage-v8: test runner and coverage — native ESM/TS/PnP, 95% threshold appropriate for a pure-logic library
- @arethetypeswrong/cli: type export validation — catches misresolved subpath exports under node10/node16/bundler
- publint: package.json exports linting — validates `exports`/`main`/`types`/`files` fields are internally consistent

**Package.json changes required (no new dependencies):** remove `"private": true`, set `"version": "0.1.0"`, add `"license": "MIT"`, `"files": ["dist"]`, `"sideEffects": false`, `"engines": {"node": ">=18"}`, `"repository"`, `"keywords"`, `"description"`.

### Expected Features

The library's functional scope is complete. The deficits are in quality and publishability.

**Must have (table stakes):**

- Comprehensive test suite — no tests exist; untested = untrustworthy for adoption
- Type-safe `take` — `as unknown as R` in `take/index.ts` directly undermines the library's core value proposition
- LICENSE file — README says MIT but no file exists; companies will not adopt unlicensed packages
- Correct package.json metadata — `private: true` blocks `npm publish` entirely; several required fields absent
- Edge case handling — `take(0)`, `take(-1)`, `drop(0)`, `drop(-1)` need explicit tests confirming Clojure-compatible behavior
- README rewrite — current README is flagged in PROJECT.md as needing rewrite; must show pipe composition and early termination examples

**Should have (competitive differentiators — already implemented):**

- Full type inference through pipe chains — the primary competitive advantage over all existing JS transducer libs
- Tree-shakeable subpath exports — already configured in `exports` map and tsup
- Zero runtime dependencies — rambda as peer dep only

**Defer (v2+):**

- Async transducers — doubles API surface and type complexity; different semantics
- Additional transducers (takeWhile, dropWhile, dedupe, etc.) — add based on user feedback after 0.1.0
- TypeDoc/API reference generation — JSDoc + README examples are sufficient for 0.1.0

### Architecture Approach

The existing module architecture is sound and complete: one module per exported function, each with its own `tsconfig.json` using project references, in a clean `types → transducers → execution` dependency graph. The only architectural work required is a targeted type system fix: introduce `ReducerResult<R> = R | Reduced<R>` and `StepFn<R, A> = (acc: R, input: A) => ReducerResult<R>`, use `StepFn` internally within `Transducer` and `transduce`, keep the public-facing `Reducer<A, B>` clean. This eliminates all three `as unknown as` casts without changing the public API signature.

**Major components:**

1. `types` — core type definitions (`Reducer`, `Transducer`, `Reduced`, `reduced()`, `isReduced()`); needs `StepFn` and `ReducerResult` additions
2. `take` / `drop` — stateful transducers using closure state; `take` needs the type fix; both need thorough edge case tests
3. `transduce` — the reduction loop that unwraps `Reduced`; needs to accept `StepFn` internally to eliminate the cast at the unwrap site
4. `into` / `sequence` — thin execution wrappers; no changes needed, mostly delegation tests
5. Test suite — co-located `*.test.ts` per module, `index.test-d.ts` for type-level assertions with Vitest's `expectTypeOf`

### Critical Pitfalls

1. **Reduced sentinel type leak** — `take` returns `Reduced<R>` but is typed as returning `R`; fix by introducing `StepFn`/`ReducerResult` types before writing any tests, or tests will need rewriting when signatures change
2. **Stateful transducer test isolation** — `take` and `drop` capture mutable closure state; tests must create fresh transducers per assertion; never reuse the result of `xform(rf)` across multiple calls
3. **Missing package.json fields bloat or block publish** — `private: true` blocks publish; missing `"files"` publishes entire project directory including `.planning/`, `.pnp.cjs`; run `npm pack --dry-run` before publishing
4. **tsup DTS divergence from tsc** — the unusual TypeScript setup (project references + `allowImportingTsExtensions` + `emitDeclarationOnly`) can cause tsup's DTS bundling to flatten or drop generics; inspect `dist/*.d.ts` after every build, especially the `Transducer<A,B>` definition
5. **rambda pipe type inference at 3+ arities** — `pipe(map(f), filter(p), take(n))` may fail TypeScript inference due to transducer contravariance; test pipe composition explicitly and early before writing the full suite

## Implications for Roadmap

Research establishes a clear dependency-driven order. The type fix is the root dependency — tests and documentation both depend on the types being correct first.

### Phase 1: Type Safety Foundation

**Rationale:** The `as unknown as` casts in `take` are the single structural defect in an otherwise clean codebase. Fixing this first ensures every subsequent test and documentation example is written against the correct types. Tests written before this fix would require rewriting.

**Delivers:** Correct `ReducerResult<R>`, `StepFn<R, A>` types in `src/types/`; updated `take` and `transduce` with zero unsafe casts; `yarn typecheck` passes cleanly.

**Addresses:** Type-safe public API (table stakes), eliminates Pitfall 1 (Reduced sentinel leak), Pitfall 4 (DTS divergence risk reduced).

**Avoids:** Pitfall 1 (type unsoundness causing silent early termination failure for custom loops).

### Phase 2: Test Suite

**Rationale:** With correct types established, build the full test suite in dependency order: types → stateless transducers → stateful transducers → execution functions → composition → type-level assertions. Early termination (take + transduce interaction) is the highest-complexity path and must be tested thoroughly. rambda `pipe` composition must be verified early within this phase.

**Delivers:** Full vitest test suite with 95% coverage; `yarn test` passes; type-level assertions via `expectTypeOf` in `index.test-d.ts`; explicit tests for edge cases (`take(0)`, `take(-1)`, `drop(0)`, `drop(-1)`); proof that early termination works through composed pipelines.

**Uses:** Vitest + @vitest/coverage-v8; rambda pipe; `vitest.config.ts` with V8 coverage provider.

**Addresses:** Comprehensive test suite (table stakes), edge case handling (table stakes), Pitfall 2 (stateful test isolation), Pitfall 6 (pipe type inference), Pitfall 7 (into mutation aliasing), Pitfall 10 (negative n edge cases).

### Phase 3: Package Preparation and Polish

**Rationale:** With code correct and tested, prepare everything a consumer or npm needs: metadata, license, README, and publish validation. This phase is largely mechanical but the checklist is long and any omission blocks adoption.

**Delivers:** LICENSE file (MIT); cleaned package.json (`private` removed, `version`, `license`, `files`, `sideEffects`, `engines`, `description`, `repository`, `keywords` added); rewritten README with pipe composition examples and early termination demonstration; `attw` and `publint` both passing; `npm pack --dry-run` showing only `dist/` contents.

**Uses:** @arethetypeswrong/cli, publint; `prepublishOnly` script gating publish behind all checks.

**Addresses:** LICENSE file (table stakes), package.json metadata (table stakes), README rewrite (table stakes), Pitfall 3 (missing fields), Pitfall 5 (ESM documentation), Pitfall 8 (stateful reuse documentation), Pitfall 11 (unexpected npm tarball files).

### Phase 4: Publish

**Rationale:** Publish only after all checks pass end-to-end. The `prepublishOnly` script (`yarn check && yarn build && attw --pack && publint`) gates this automatically.

**Delivers:** Published `transducer-ts@0.1.0` on npm.

**Avoids:** Pitfall 3 (silent publish failures), Pitfall 4 (verify DTS is correct in final build).

### Phase Ordering Rationale

- Type fix before tests: tests written against unsound types require rewriting; the fix changes `take`'s internal return type
- Tests before README: README examples must be accurate; can only confirm accuracy with a passing test suite
- All code changes before package preparation: metadata and publish scripts are the final gate, not an intermediate step
- `prepublishOnly` script enforces the full chain: typecheck + lint + fmt + test + build + attw + publint

### Research Flags

Phases with standard patterns (no additional research needed):

- **Phase 1 (Type Safety):** Well-understood TypeScript pattern; `ReducerResult<R>` approach is direct and has full implementation spec in ARCHITECTURE.md
- **Phase 3 (Package Preparation):** npm packaging is well-documented; checklist in PITFALLS.md is complete
- **Phase 4 (Publish):** Standard `npm publish` with `prepublishOnly` gate

Phases that may surface surprises during execution:

- **Phase 2 (Test Suite):** rambda `pipe` type inference with transducers (Pitfall 6) is the unknown — if 3-arity pipe composition fails TypeScript inference, the library may need a design adjustment before tests can be written as intended. Recommend testing `pipe` composition in the first test session before committing to the full test plan.

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                                          |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | Existing stack is already in use; Vitest and publish tools are well-established; versions verified                                             |
| Features     | HIGH       | Scope analysis is based on direct codebase inspection; ecosystem context from training data (MEDIUM) but transducer space is stable since 2014 |
| Architecture | HIGH       | `ReducerResult`/`StepFn` redesign is based on direct code analysis + Clojure's own protocol semantics; Vitest patterns are well-established    |
| Pitfalls     | HIGH       | Critical pitfalls are based on direct code inspection; npm packaging pitfalls are well-established conventions                                 |

**Overall confidence:** HIGH

### Gaps to Address

- **rambda pipe inference at high arities:** Whether `pipe(map(f), filter(p), take(n))` type-checks for 3+ transducers is unverified. Test this in the first test session (Phase 2). If it fails, either document the arity limit or investigate if the `StepFn` type change resolves it.
- **Vitest + Yarn PnP compatibility:** Vitest is expected to work with PnP out of the box, but this has not been verified in this specific Yarn 4 + PnP setup. First task of Phase 2 should be a "smoke test" vitest run before writing substantive tests.
- **tsup DTS output quality:** The interaction of `allowImportingTsExtensions`, project references, and tsup's DTS bundling has not been verified. Inspect `dist/*.d.ts` after the first build in Phase 3 before proceeding to publish validation.

## Sources

### Primary (HIGH confidence)

- Direct codebase analysis (`src/`, `package.json`, `tsup.config.ts`, `tsconfig.json`) — architecture, pitfall detection, feature status
- Clojure transducers reference (clojure.org/reference/transducers) — behavioral semantics, Reduced protocol

### Secondary (MEDIUM confidence)

- Vitest documentation (vitest.dev) — test runner configuration, expectTypeOf API
- @arethetypeswrong/cli (github.com/arethetypeswrong) — type export validation approach
- publint (publint.dev) — package.json exports validation
- npm packaging conventions (training data, well-established) — package.json fields, files whitelist

### Tertiary (LOW confidence)

- cognitect-labs/transducers-js GitHub — ecosystem context; unmaintained, used only for behavioral reference
- Transducer ecosystem competitive landscape — training data; used to validate the "no maintained TypeScript-first transducer lib" claim

---

_Research completed: 2026-03-22_
_Ready for roadmap: yes_
