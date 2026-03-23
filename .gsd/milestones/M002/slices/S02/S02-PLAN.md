# S02: Extended type-level tests

**Goal:** Prove pipe's recursive types work at high arity (6, 10, 15) and catch mismatches at multiple chain positions (1, 3, 8+), closing the type-safety contract for unbounded pipe composition.
**Demo:** `yarn vitest --typecheck --run` passes with new type-level tests covering 6/10/15 arity inference and mismatch detection at positions 1, 3, and 8+. `yarn check` and `yarn test:coverage` pass.

## Must-Haves

- Type-level tests for pipe at 6, 10, and 15 arity — each asserts correct `Transducer<First, Last>` inference
- Mismatch detection tests using `@ts-expect-error` at positions 1, 3, and 8+ in the chain
- At least one mismatch test in a 10+ chain where only one position is wrong
- All existing 12 type-level tests and 71 runtime tests continue to pass unchanged
- `yarn check` passes (R008)
- `yarn test:coverage` reports 100% (R009)
- `yarn build` still produces clean `dist/pipe.d.ts` with helper types unexported (R005)

## Verification

- `yarn vitest --typecheck --run` — all type tests pass (existing + new)
- `yarn check` — 0 errors, 0 warnings
- `yarn test:coverage` — 100% stmt/branch/func/line
- `yarn build && ! grep -q "export.*PipeTypeError\|export.*BuildConstraint" dist/pipe.d.ts` — DTS still clean

## Tasks

- [x] **T01: Add high-arity inference and mismatch detection type-level tests** `est:25m`
  - Why: Closes R007 (type-level tests at 6+ arity, mismatch at multiple positions) and verifies R005/R008/R009 still hold
  - Files: `src/index.test-d.ts`
  - Do: Append two new `describe` blocks to the existing test file: (1) high-arity positive inference tests for 6, 10, and 15 transducer chains using alternating `map`/`filter`/`take`/`drop` combinations, each asserting `toEqualTypeOf<Transducer<First, Last>>()`; (2) mismatch detection tests using `@ts-expect-error` at positions 1, 3, and 8+ in chains, including one 10+ chain with a single wrong position. Follow existing code patterns exactly.
  - Verify: `yarn vitest --typecheck --run && yarn check && yarn test:coverage`
  - Done when: All type tests pass, `yarn check` clean, coverage at 100%, `dist/pipe.d.ts` unchanged

## Files Likely Touched

- `src/index.test-d.ts`
