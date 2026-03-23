---
estimated_steps: 4
estimated_files: 1
skills_used:
  - test
---

# T01: Add high-arity inference and mismatch detection type-level tests

**Slice:** S02 — Extended type-level tests
**Milestone:** M002

## Description

Append new type-level tests to the existing `src/index.test-d.ts` file that exercise pipe's recursive types at higher arities (6, 10, 15) and verify mismatch detection at multiple chain positions (1, 3, 8+). This is the sole task for S02 — it closes requirements R005, R007, R008, and R009.

The existing file has 12 type-level tests in a `describe("type-level assertions")` block covering single transducers and pipe at 1–3 arity. The new tests extend coverage to prove the recursive `BuildConstraint` and `PipeResult` types work at depth.

## Steps

1. **Read `src/index.test-d.ts`** to confirm current structure (12 tests in one `describe` block). Read `src/pipe/index.ts` to confirm the `PrevIdx` tuple covers indices 0–19 (supports up to 20-element chains).

2. **Append a `describe("pipe high-arity inference")` block** with three tests:
   - **6-arity:** Build a chain like `map(number→string)`, `filter(string)`, `map(string→number)`, `filter(number)`, `map(number→boolean)`, `map(boolean→number)`. Assert `Transducer<number, number>`.
   - **10-arity:** Build a 10-element chain alternating type-transforming and type-preserving transducers. Track the input/output types carefully. Assert `Transducer<FirstInput, LastOutput>`.
   - **15-arity:** Build a 15-element chain similarly. Assert `Transducer<FirstInput, LastOutput>`.

   Use these building blocks (all imported from `./index.ts`):
   - `map((x: number) => String(x))` — `Transducer<number, string>`
   - `filter((s: string) => s.length > 0)` — `Transducer<string, string>`
   - `map((s: string) => s.length)` — `Transducer<string, number>`
   - `filter((x: number) => x > 0)` — `Transducer<number, number>`
   - `take<number>(5)` — `Transducer<number, number>`
   - `drop<string>(2)` — `Transducer<string, string>`
   - `map((x: number) => x > 0)` — `Transducer<number, boolean>`
   - `map((x: boolean) => (x ? 1 : 0))` — `Transducer<boolean, number>`

3. **Append a `describe("pipe mismatch detection")` block** with four tests using `@ts-expect-error`:
   - **Position 1 mismatch:** 2-element chain where output of 1st doesn't match input of 2nd. Add `// @ts-expect-error — string output doesn't match boolean input` above the pipe call.
   - **Position 3 mismatch:** 4-element chain where only position 3 is wrong.
   - **Position 8+ mismatch:** 10-element chain where only position 8 (or 9) has a type mismatch.
   - **Deep single mismatch in long chain:** 12+ element chain where every adjacent pair matches except one position (to prove long chains don't silently pass).

   Each test wraps the `pipe(...)` call inside an `it()` block. The `@ts-expect-error` comment goes on the line immediately before `pipe(`.

4. **Run verification commands:**
   - `yarn vitest --typecheck --run` — all tests pass
   - `yarn check` — 0 errors
   - `yarn test:coverage` — 100%
   - `yarn build && ! grep -q "export.*PipeTypeError\|export.*BuildConstraint" dist/pipe.d.ts` — DTS still clean

## Must-Haves

- [ ] 6-arity positive inference test passes
- [ ] 10-arity positive inference test passes
- [ ] 15-arity positive inference test passes
- [ ] Mismatch at position 1 detected (via `@ts-expect-error`)
- [ ] Mismatch at position 3 detected (via `@ts-expect-error`)
- [ ] Mismatch at position 8+ detected (via `@ts-expect-error`)
- [ ] Mismatch in 12+ chain with single wrong position detected
- [ ] All existing 12 type-level tests still pass
- [ ] `yarn check` passes
- [ ] `yarn test:coverage` at 100%

## Verification

- `yarn vitest --typecheck --run` — all type-level tests pass (existing 12 + new ~7)
- `yarn check` — 0 errors, 0 warnings
- `yarn test:coverage` — 100% stmt/branch/func/line on all metrics
- `yarn build && ! grep -q "export.*PipeTypeError\|export.*BuildConstraint" dist/pipe.d.ts` — DTS unchanged

## Inputs

- `src/index.test-d.ts` — existing test file with 12 type-level tests to append to
- `src/pipe/index.ts` — read-only reference for understanding the recursive types (BuildConstraint, PipeResult, PrevIdx covering 0–19)
- `src/types/index.ts` — read-only reference for the `Transducer<A, B>` type

## Expected Output

- `src/index.test-d.ts` — modified with ~7 new type-level tests in two new `describe` blocks
