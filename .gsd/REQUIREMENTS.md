# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R010 — A `toFn` function that wraps a `Transducer<A, B>` into `(coll: Iterable<A>) => B[]`
- Class: core-capability
- Status: active
- Description: A `toFn` function that wraps a `Transducer<A, B>` into `(coll: Iterable<A>) => B[]` — a data-first curried API for use with any left-to-right function composition utility
- Why it matters: Enables using transducer-ts transducers as data-last pipeline stages in data-first pipe utilities
- Source: user
- Primary owning slice: M003/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred to M003; depends on M002 completing the pipe refactor. Previously described as "rambda-compatible" but rambda is no longer a dependency or concern — the signature `(coll: Iterable<A>) => B[]` is a general data-first adapter.

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
| R010 | core-capability | active | M003/S01 | none | unmapped |

## Coverage Summary

- Active requirements: 1
- Mapped to slices: 1
- Validated: 9 (R001, R002, R003, R004, R005, R006, R007, R008, R009)
- Unmapped active requirements: 0
