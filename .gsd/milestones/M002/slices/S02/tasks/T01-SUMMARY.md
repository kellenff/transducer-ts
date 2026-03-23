# T01: Add high-arity inference and mismatch detection type-level tests

**Status:** complete
**Duration:** ~5m

## What Happened

Appended 7 new type-level tests to `src/index.test-d.ts` in two new `describe` blocks:

**`pipe high-arity inference` (3 tests):**
- 6-arity chain: `number → string → string → number → number → boolean → number` — asserts `Transducer<number, number>`
- 10-arity chain: extends the 6-arity with 4 more stages through `string` and back — asserts `Transducer<number, number>`
- 15-arity chain: extends the 10-arity with 5 more stages through `boolean` and `string` — asserts `Transducer<number, number>`

**`pipe mismatch detection` (4 tests):**
- Position 1: 2-element chain, `string` output fed to `boolean` input
- Position 3: 4-element chain, `number` output fed to `string` input
- Position 9: 10-element chain, `string` output fed to `boolean` input at position 9
- Position 5 in 12-element chain: single mismatch in a long chain proving constraints propagate deeply

## Issues Found and Fixed

1. **`const T` literal inference** — `map((x: boolean) => (x ? 1 : 0))` inferred output as `0 | 1` (literal union), not `number`, causing `toEqualTypeOf<Transducer<number, number>>()` to fail. Fixed with explicit return annotation: `(x: boolean): number => (x ? 1 : 0)`.

2. **`@ts-expect-error` placement** — The directive suppresses errors only on the immediately following line. Placing it before `pipe(` didn't suppress the error on the mismatched argument several lines below. Fixed by moving each `@ts-expect-error` to the line immediately before the mismatched transducer argument.

## Verification

| Check | Result |
|-------|--------|
| `yarn vitest --typecheck --run` | 90/90 pass (71 runtime + 19 type-level) |
| `yarn check` | 0 errors, 0 warnings |
| `yarn test:coverage` | 100% stmt/branch/func/line |
| `yarn build` + DTS grep | No leaked exports |

## Files Modified

- `src/index.test-d.ts` — added 105 lines (7 new type-level tests in 2 describe blocks)
