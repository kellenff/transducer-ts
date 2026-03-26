# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

None — all requirements validated or deferred.

## Deferred

None — all requirements validated.

## Validated

### R001 — `pipe` must correctly infer `Transducer<FirstInput, LastOutput>` for chains of 1, 2, 3, 5, 10, and 15+ transducers
- Class: core-capability
- Status: validated
- Description: `pipe` must correctly infer `Transducer<FirstInput, LastOutput>` for chains of 1, 2, 3, 5, 10, and 15+ transducers
- Why it matters: The fixed 5-arity cap is a hard limit on composition depth — real pipelines can be longer
- Source: user
- Primary owning slice: M002/S01
- Supporting slices: M002/S02
- Validation: M002 — Type-level tests prove inference at 1, 2, 3, 5, 6, 10, and 15 arity; yarn vitest --typecheck 90/90 pass
- Notes: Recursive conditional types proven viable in prototype (BuildConstraint + PipeResult)

### R002 — When a transducer at position N has an input type that doesn't match the previous output, the compiler error must include a `PipeTypeError<"Argument at position N: ...">` branded message
- Class: differentiator
- Status: validated
- Description: When a transducer at position N has an input type that doesn't match the previous output, the compiler error must include a `PipeTypeError<"Argument at position N: ...">` branded message
- Why it matters: Standard TS errors for recursive types are cryptic — branded messages tell you exactly where the chain breaks
- Source: user
- Primary owning slice: M002/S01
- Supporting slices: M002/S02
- Validation: M002 — @ts-expect-error tests at positions 1, 3, 5, 9 prove BuildConstraint rejects mismatches; dist/pipe.d.ts confirms PipeTypeError branded message format
- Notes: Prototype shows `PipeTypeError` brand surfaces in tsc output alongside standard type assignability error

### R003 — The pipe function's runtime implementation must remain `reduceRight` over variadic args — no change to how transducers compose at runtime
- Class: constraint
- Status: validated
- Description: The pipe function's runtime implementation must remain `reduceRight` over variadic args — no change to how transducers compose at runtime
- Why it matters: This is a type-level-only refactor; runtime behavior must not regress
- Source: inferred
- Primary owning slice: M002/S01
- Supporting slices: none
- Validation: M002/S01 — yarn test 71/71 pass; src/pipe/index.ts runtime body is identical reduceRight
- Notes: Existing 71 tests are the regression gate

### R004 — All 71 existing runtime tests and 12 type-level tests must pass without changes to test files
- Class: constraint
- Status: validated
- Description: All 71 existing runtime tests and 12 type-level tests must pass without changes to test files
- Why it matters: Backward compatibility — the new types must be a drop-in replacement
- Source: inferred
- Primary owning slice: M002/S01
- Supporting slices: none
- Validation: M002/S01 — yarn test 71/71 pass; yarn vitest --typecheck --run 83/83 pass; no test files modified
- Notes: Tests exercise pipe at 1, 2, 3, and 4 arity

### R005 — The emitted `dist/pipe.d.ts` must be readable by consumers on hover — not raw recursive type aliases
- Class: quality-attribute
- Status: validated
- Description: The emitted `dist/pipe.d.ts` must be readable by consumers on hover — not raw recursive type aliases
- Why it matters: Poor DTS output makes the library feel broken even when inference works
- Source: user
- Primary owning slice: M002/S02
- Supporting slices: none
- Validation: M002 — dist/pipe.d.ts emits helper types as unexported declarations; only pipe in export block; readable on hover
- Notes: Current DTS shows clean resolved overloads; recursive types may change this. Must verify after build.

### R006 — BuildConstraint, PipeResult, PipeTypeError, and NextIdx must not be exported from src/types or src/index.ts
- Class: constraint
- Status: validated
- Description: BuildConstraint, PipeResult, PipeTypeError, and NextIdx must not be exported from src/types or src/index.ts
- Why it matters: Avoids committing to type-level API surface that would be hard to change later
- Source: user
- Primary owning slice: M002/S01
- Supporting slices: none
- Validation: M002/S01 — grep confirms no export keyword on helpers in src/pipe/index.ts; dist/pipe.d.ts export block contains only `pipe`
- Notes: Types live in src/pipe/index.ts only

### R007 — New type-level tests must verify inference at 6+ arity (beyond old cap), mismatch detection at multiple positions (1, 3, deep), and that the branded error message includes the position number
- Class: core-capability
- Status: validated
- Description: New type-level tests must verify inference at 6+ arity (beyond old cap), mismatch detection at multiple positions (1, 3, deep), and that the branded error message includes the position number
- Why it matters: The old tests only cover 1-3 arity — new tests must prove the recursive types work at depth
- Source: inferred
- Primary owning slice: M002/S02
- Supporting slices: none
- Validation: M002/S02 — 7 new type-level tests: 3 positive (6, 10, 15 arity) and 4 mismatch (positions 1, 3, 5, 9) all pass
- Notes: Use expectTypeOf for positive assertions, @ts-expect-error for mismatch detection

### R008 — `yarn check` (typecheck + lint + fmt:check) must pass after all changes
- Class: quality-attribute
- Status: validated
- Description: `yarn check` (typecheck + lint + fmt:check) must pass after all changes
- Why it matters: CI gate — the project must stay clean
- Source: inferred
- Primary owning slice: M002/S02
- Supporting slices: none
- Validation: M002 — yarn check exits 0: typecheck clean, oxlint 0 warnings 0 errors, oxfmt all files correct
- Notes: none

### R009 — `yarn test:coverage` must report 100% on all metrics after changes
- Class: quality-attribute
- Status: validated
- Description: `yarn test:coverage` must report 100% on all metrics after changes
- Why it matters: No coverage regression from a type-only refactor
- Source: inferred
- Primary owning slice: M002/S02
- Supporting slices: none
- Validation: M002 — yarn test:coverage reports 100% stmt/branch/func/line across all 9 source files
- Notes: The runtime implementation doesn't change, so this should hold trivially

### R010 — A `toFn` function that wraps a `Transducer<A, B>` into `(coll: Iterable<A>) => B[]`
- Class: core-capability
- Status: validated
- Description: A `toFn` function that wraps a `Transducer<A, B>` into `(coll: Iterable<A>) => B[]` — a data-first curried API for use with any left-to-right function composition utility
- Why it matters: Enables using transducer-ts transducers as data-last pipeline stages in data-first pipe utilities
- Source: user
- Primary owning slice: M005/S01
- Supporting slices: none
- Validation: M005 — toFn exported, 12 tests pass (9 runtime + 3 type-level), 100% coverage, type inference verified
- Notes: Implementation delegates to sequence; one-liner.

### R011 — Examples directory with per-library test files, all passing vitest
- Class: primary-user-loop
- Status: validated
- Description: An `examples/` directory containing one `.test.ts` file per library (lodash, ramda, rambda, remeda, fp-ts, itertools, underscore), each runnable by vitest with real `expect(...)` assertions
- Why it matters: Users evaluating the library need concrete, runnable proof of how it integrates with their existing stack
- Source: user
- Primary owning slice: M003/S01
- Supporting slices: M003/S02
- Validation: M003 — 7 example files present; yarn test 162/162 pass including all 91 example assertions
- Notes: The test files are the documentation — no separate markdown needed

### R012 — Runtime assertions in every example file
- Class: quality-attribute
- Status: validated
- Description: Every example file must contain `expect(...)` assertions that actually run and pass — no commented-out snippets, no console.log stubs
- Why it matters: Without running assertions the examples can silently drift from reality
- Source: inferred
- Primary owning slice: M003/S01
- Supporting slices: M003/S02
- Validation: M003 — yarn test 162/162 pass; all 7 example files contain substantive expect() assertions
- Notes: Verified by `yarn test` passing

### R013 — Strict TypeScript — no errors in examples
- Class: quality-attribute
- Status: validated
- Description: All example files must typecheck clean under the project's strict tsconfig (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, verbatimModuleSyntax)
- Why it matters: Type errors in examples undermine confidence in the library's type safety story
- Source: inferred
- Primary owning slice: M003/S01
- Supporting slices: M003/S02
- Validation: M003 — yarn typecheck exits 0 with tsconfig.test.json covering examples/**/*.ts; no errors under strict+exactOptionalPropertyTypes
- Notes: Verified by `yarn typecheck` passing

### R014 — Ramda/rambda protocol incompatibility documented inline
- Class: differentiator
- Status: validated
- Description: The `examples/ramda.test.ts` and `examples/rambda.test.ts` files must include inline comments explaining that ramda/rambda use the `@@transducer/` object protocol (incompatible with transducer-ts's function-based StepFn) and show the correct usage pattern (ramda functions as callbacks, not transducers)
- Why it matters: The most likely user mistake is trying to compose R.map as a transducer — a clear inline explanation prevents that confusion
- Source: inferred
- Primary owning slice: M003/S01
- Supporting slices: none
- Validation: M003 — both ramda.test.ts and rambda.test.ts open with 18-line @@transducer/ protocol incompatibility comment blocks with correct/incorrect usage examples
- Notes: none

### R015 — vitest and tsconfig wired to cover examples/
- Class: launchability
- Status: validated
- Description: `vitest.config.ts` include pattern and `tsconfig.test.json` must cover `examples/**/*.test.ts` so examples run with `yarn test` and typecheck with `yarn typecheck`
- Why it matters: Examples that aren't wired in are invisible — they won't run in CI and won't catch regressions
- Source: inferred
- Primary owning slice: M003/S01
- Supporting slices: none
- Validation: M003 — vitest.config.ts include: ["src/**/*.test.ts", "examples/**/*.test.ts"]; tsconfig.test.json include: ["src/**/*.ts", "examples/**/*.ts"]; coverage.include still src/**/*.ts only; yarn test runs 7 example files
- Notes: Coverage thresholds remain on `src/**` only — examples are not production code

### R016 — All seven libraries covered
- Class: core-capability
- Status: validated
- Description: lodash, ramda, rambda, remeda, fp-ts, itertools, and underscore each have a dedicated example file
- Why it matters: The milestone's user-visible promise is breadth — one file per library, not a combined omnibus
- Source: user
- Primary owning slice: M003/S01
- Supporting slices: M003/S02
- Validation: M003 — all 7 files present: lodash (17 tests), ramda (14), rambda (10), remeda (13), fp-ts (11), itertools (12), underscore (14); yarn test 162/162 pass
- Notes: lodash/ramda/rambda/remeda in S01; fp-ts/itertools/underscore in S02

### R017 — `isolatedDeclarations: true` enabled in tsconfig
- Class: quality-attribute
- Status: validated
- Description: `isolatedDeclarations: true` set in `tsconfig.base.json`, inherited by all module tsconfigs, with zero typecheck violations
- Why it matters: Enables faster DTS emit by alternative toolchains (Oxc, SWC, esbuild) and signals modern TS rigor to consumers
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: M004 — `isolatedDeclarations: true` in tsconfig.base.json; `yarn typecheck` exits 0; DTS output byte-identical
- Notes: All exports have explicit return types.

### R018 — `llms.txt` at repo root, included in npm package
- Class: primary-user-loop
- Status: validated
- Description: An `llms.txt` file at the repo root following the llmstxt.org spec, covering the full API surface, types, key patterns, and integration gotchas. Included in the npm package via the `files` array.
- Why it matters: AI coding assistants actively use llms.txt when encountering a new library — a clean, curated index beats parsing raw source
- Source: user
- Primary owning slice: M004/S02
- Supporting slices: none
- Validation: M004 — llms.txt at repo root; `yarn pack --dry-run` lists it in tarball
- Notes: File lives at root and ships in the npm tarball

### R019 — `AGENTS.md` — concise, non-inferable codebase context
- Class: primary-user-loop
- Status: validated
- Description: An `AGENTS.md` at repo root providing AI coding agents with non-inferable project context: Yarn 4 PnP setup, project references architecture, `pipe`'s `BuildConstraint` type system, `.js` extension import convention, and key gotchas
- Why it matters: Agents supported by the Agentic AI Foundation standard (Claude Code, Cursor, Copilot, Gemini CLI, Codex, etc.) read this file automatically
- Source: user
- Primary owning slice: M004/S02
- Supporting slices: none
- Validation: M004 — AGENTS.md at repo root with non-inferable context covering setup, build, architecture, type system, testing, gotchas
- Notes: Concise, focused on non-inferable details only

### R020 — `CLAUDE.md` updated with library-consumer section
- Class: quality-attribute
- Status: validated
- Description: `CLAUDE.md` updated to include a library-usage section (consumer angle) and pointer to `AGENTS.md` for shared contributor context
- Why it matters: Claude Code reads this file at session start — the library-usage section helps agents consuming transducer-ts as a dependency
- Source: inferred
- Primary owning slice: M004/S02
- Supporting slices: none
- Validation: M004 — CLAUDE.md has consumer section with import example, key points, llms.txt pointer, and contributing section pointing to AGENTS.md
- Notes: GSD-injected sections preserved; library section added above them

### R021 — `yarn check` and `yarn build` pass after all changes
- Class: quality-attribute
- Status: validated
- Description: `yarn check` (typecheck + lint + fmt:check) and `yarn build` both exit 0 after all M004 changes
- Why it matters: CI gate — the project must stay clean after any change
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: M004/S02
- Validation: M004 — yarn check and yarn build both exit 0 after both slices
- Notes: none

### R022 — No stale facts in any agent-facing file
- Class: quality-attribute
- Status: validated
- Description: No references to rambda as peer dependency, tsup as build tool, 5-arity pipe cap, or other superseded facts in `llms.txt`, `AGENTS.md`, or `CLAUDE.md`
- Why it matters: Stale context actively misleads agents — worse than no context
- Source: inferred
- Primary owning slice: M004/S02
- Supporting slices: none
- Validation: M004 — grep for tsup, rambda peer dep, 5-arity finds nothing in any agent-facing file
- Notes: Key facts that changed: rambda removed as dep (built-in pipe), tsup replaced by tsc project references, pipe now supports N-arity

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | validated | M002/S01 | M002/S02 | M002 — Type-level tests prove inference at 1, 2, 3, 5, 6, 10, and 15 arity; yarn vitest --typecheck 90/90 pass |
| R002 | differentiator | validated | M002/S01 | M002/S02 | M002 — @ts-expect-error tests at positions 1, 3, 5, 9 prove BuildConstraint rejects mismatches; dist/pipe.d.ts confirms PipeTypeError branded message format |
| R003 | constraint | validated | M002/S01 | none | M002/S01 — yarn test 71/71 pass; src/pipe/index.ts runtime body is identical reduceRight |
| R004 | constraint | validated | M002/S01 | none | M002/S01 — yarn test 71/71 pass; yarn vitest --typecheck --run 83/83 pass; no test files modified |
| R005 | quality-attribute | validated | M002/S02 | none | M002 — dist/pipe.d.ts emits helper types as unexported declarations; only pipe in export block; readable on hover |
| R006 | constraint | validated | M002/S01 | none | M002/S01 — grep confirms no export keyword on helpers in src/pipe/index.ts; dist/pipe.d.ts export block contains only `pipe` |
| R007 | core-capability | validated | M002/S02 | none | M002/S02 — 7 new type-level tests: 3 positive (6, 10, 15 arity) and 4 mismatch (positions 1, 3, 5, 9) all pass |
| R008 | quality-attribute | validated | M002/S02 | none | M002 — yarn check exits 0: typecheck clean, oxlint 0 warnings 0 errors, oxfmt all files correct |
| R009 | quality-attribute | validated | M002/S02 | none | M002 — yarn test:coverage reports 100% stmt/branch/func/line across all 9 source files |
| R010 | core-capability | validated | M005/S01 | none | M005 — toFn exported, 12 tests pass, type inference verified, 100% coverage |
| R011 | primary-user-loop | validated | M003/S01 | M003/S02 | M003 — 7 example files; yarn test 162/162 pass including all 91 example assertions |
| R012 | quality-attribute | validated | M003/S01 | M003/S02 | M003 — yarn test 162/162 pass; all 7 example files contain substantive expect() assertions |
| R013 | quality-attribute | validated | M003/S01 | M003/S02 | M003 — yarn typecheck exits 0 with examples/ covered under strict+exactOptionalPropertyTypes |
| R014 | differentiator | validated | M003/S01 | none | M003 — ramda.test.ts and rambda.test.ts each have 18-line @@transducer/ protocol incompatibility comment blocks |
| R015 | launchability | validated | M003/S01 | none | M003 — vitest.config.ts and tsconfig.test.json both extended; yarn test runs 7 example files; coverage scope unchanged |
| R016 | core-capability | validated | M003/S01 | M003/S02 | M003 — all 7 files present with dedicated tests; yarn test 162/162 pass |
| R017 | quality-attribute | validated | M004/S01 | none | M004 — `isolatedDeclarations: true` in tsconfig.base.json; `yarn typecheck` exits 0; DTS output byte-identical |
| R018 | primary-user-loop | validated | M004/S02 | none | M004 — llms.txt at repo root; `yarn pack --dry-run` lists it in tarball |
| R019 | primary-user-loop | validated | M004/S02 | none | M004 — AGENTS.md at repo root with non-inferable context |
| R020 | quality-attribute | validated | M004/S02 | none | M004 — CLAUDE.md has consumer section + AGENTS.md pointer |
| R021 | quality-attribute | validated | M004/S01 | M004/S02 | M004 — yarn check and yarn build both exit 0 |
| R022 | quality-attribute | validated | M004/S02 | none | M004 — grep for stale facts finds nothing |

## Coverage Summary

- Active requirements: 0
- Mapped to slices: 0
- Validated: 22 (R001–R022)
- Deferred: 0
- Unmapped active requirements: 0
