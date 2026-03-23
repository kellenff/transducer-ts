---
id: S02
parent: M002
milestone: M002
provides:
  - src/index.test-d.ts with 7 new type-level tests proving high-arity inference and mismatch detection
requires:
  - src/pipe/index.ts (recursive types from S01)
affects: []
key_files:
  - src/index.test-d.ts
key_decisions:
  - Explicit return type annotations needed on map callbacks when const T inference captures literals (e.g. 0|1 instead of number)
  - "@ts-expect-error" must be placed on the line immediately before the mismatched argument, not before the pipe() call
patterns_established:
  - High-arity type-level test chains use alternating map/filter/take/drop with explicit type annotations to avoid literal inference issues
  - Mismatch tests place @ts-expect-error directly above the offending argument in the pipe() parameter list
observability_surfaces:
  - "yarn vitest --typecheck --run" — surfaces type constraint failures at named test positions
  - Individual test names include arity and position for precise failure identification
drill_down_paths:
  - .gsd/milestones/M002/slices/S02/tasks/T01-SUMMARY.md
duration: ~5m
verification_result: passed
completed_at: 2026-03-23
---

# S02: Extended type-level tests

**Added 7 type-level tests proving pipe's recursive types work at 6, 10, and 15 arity and catch mismatches at positions 1, 3, 5, and 9. All 90 tests pass, `yarn check` clean, 100% coverage, DTS unchanged.**

## What Happened

Single task (T01) appended two new `describe` blocks to `src/index.test-d.ts`:

**High-arity positive inference (3 tests):** Chains of 6, 10, and 15 transducers using alternating `map`/`filter`/`take`/`drop` combinations. Each asserts `toEqualTypeOf<Transducer<number, number>>()`. The 15-arity test exercises `PrevIdx` up to index 14, well within the tuple's 0–19 range.

**Mismatch detection (4 tests):** Uses `@ts-expect-error` to prove that `BuildConstraint` rejects type mismatches at positions 1, 3, 9 (in a 10-chain), and 5 (in a 12-chain). The 12-chain test confirms that constraints propagate through long chains — a single wrong position in 12 transducers is caught.

## Verification

| Check | Command | Result |
|-------|---------|--------|
| Type tests | `yarn vitest --typecheck --run` | 90/90 pass (71 runtime + 19 type-level) |
| Check suite | `yarn check` | 0 errors, 0 warnings |
| Coverage | `yarn test:coverage` | 100% stmt/branch/func/line |
| DTS clean | `yarn build` + grep | No leaked exports |

## Issues Discovered

1. **`const T` literal inference gotcha:** Arrow functions returning ternary expressions (e.g. `x ? 1 : 0`) get inferred as literal unions (`0 | 1`) under `const T`, not `number`. Explicit return type annotations are required in test code to avoid false assertion failures.

2. **`@ts-expect-error` scope:** The directive only suppresses the immediately following line. In multi-line `pipe()` calls, it must be placed directly above the specific argument with the type error, not above the `pipe(` call.

## Deviations

None. The plan called for one task with these exact test categories, and that's what was delivered.

## Known Limitations

- `@ts-expect-error` is binary — it proves an error exists but cannot assert on the branded `PipeTypeError` message content. Branded message content was already verified by S01's DTS inspection.
- `PrevIdx` caps at index 19. Tests stay within bounds (max index 14 in the 15-arity test).

## Files Modified

- `src/index.test-d.ts` — 105 lines added (7 new type-level tests)

## Forward Intelligence

### What future work should know

- The `@ts-expect-error` placement pattern is non-obvious — it must go on the line immediately before the mismatched argument, not before `pipe(`. This tripped the initial implementation.
- `const T` inference captures literal types from ternary expressions. Any new tests using `map` with ternary returns need explicit return type annotations.
- The test file now has 19 type-level tests total. If adding more, the existing `describe` blocks provide clear organizational structure to follow.

### Authoritative diagnostics

- `yarn vitest --typecheck --run` — named tests like "pipe 15-arity infers Transducer<number, number>" fail immediately with the exact test name if `BuildConstraint` or `PipeResult` regress.
- `yarn check` — catches any formatting or lint regressions in the test file.
