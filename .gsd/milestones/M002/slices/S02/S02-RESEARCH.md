# S02 — Research

**Date:** 2026-03-23
**Depth:** Light

## Summary

S02 adds type-level tests that exercise pipe's recursive types at higher arities (6, 10, 15) and verify mismatch detection at multiple chain positions (1, 3, 8+). The work is entirely additive — one file (`src/index.test-d.ts`) gets new test cases appended; no source changes.

The existing test file already demonstrates the patterns: `expectTypeOf(pipe(...)).toEqualTypeOf<Transducer<A, B>>()` for positive inference, using `map`, `filter`, `take`, and `drop` as building blocks. Mismatch detection tests use `@ts-expect-error` to assert that mismatched chains produce compile errors. Vitest's typecheck mode (`yarn vitest --typecheck --run`) runs these as part of `yarn test`.

The `PrevIdx` tuple in `src/pipe/index.ts` covers indices 0–19 (supports up to 20-element chains), so 15-arity tests are well within bounds.

## Recommendation

Single task: append new test cases to `src/index.test-d.ts`. Organize into two groups:

1. **High-arity inference tests** — chains of 6, 10, and 15 transducers using alternating `map`/`filter`/`take`/`drop` combinations. Each asserts `toEqualTypeOf<Transducer<FirstInput, LastOutput>>()`.

2. **Mismatch detection tests** — use `@ts-expect-error` to prove that placing a transducer whose input doesn't match the previous output produces a compile error. Test at positions 1, 3, and 8+ in the chain.

Vitest's typecheck mode does not support asserting on type error *message content* (only that an error occurs). The branded `PipeTypeError<"Argument at position N: ...">` message is already verified structurally by S01's DTS inspection. The `@ts-expect-error` tests prove the errors fire at the correct positions, which is the behavioral contract R007 requires.

Verify with `yarn check` and `yarn test:coverage` after adding tests.

## Implementation Landscape

### Key Files

- `src/index.test-d.ts` — **the only file to modify**. Currently has 12 type-level tests in a single `describe("type-level assertions")` block. Append new tests here following the same patterns.
- `src/pipe/index.ts` — **read-only reference**. Contains `BuildConstraint`, `PipeResult`, `PrevIdx`, `PipeTypeError` (all unexported). The `PrevIdx` tuple covers indices 0–19.
- `src/types/index.ts` — **read-only reference**. Provides the `Transducer<A, B>` type used in all tests.

### Existing Pattern to Follow

Every positive test follows this shape:
```typescript
it("pipe N-arity infers correct types", () => {
  const xf = pipe(
    map((x: number) => String(x)),
    filter((s: string) => s.length > 0),
    // ... more transducers
  );
  expectTypeOf(xf).toEqualTypeOf<Transducer<number, string>>();
});
```

For mismatch tests, use `@ts-expect-error`:
```typescript
it("pipe rejects mismatch at position 1", () => {
  // @ts-expect-error — string output doesn't match boolean input
  pipe(
    map((x: number) => String(x)),
    filter((x: boolean) => x),
  );
});
```

### Building Block Transducers for Chains

To build long chains, alternate type-transforming and type-preserving transducers:
- `map((x: number) => String(x))` — `Transducer<number, string>`
- `filter((s: string) => s.length > 0)` — `Transducer<string, string>`
- `map((s: string) => s.length)` — `Transducer<string, number>`
- `filter((x: number) => x > 0)` — `Transducer<number, number>`
- `take<number>(5)` — `Transducer<number, number>`
- `drop<string>(2)` — `Transducer<string, string>`
- `map((x: number) => x > 0)` — `Transducer<number, boolean>`
- `map((x: boolean) => (x ? 1 : 0))` — `Transducer<boolean, number>`

### Test Cases Needed

**High-arity positive inference:**
| Test | Arity | Expected Result |
|------|-------|-----------------|
| 6-arity | 6 | `Transducer<number, number>` (or similar based on chain) |
| 10-arity | 10 | `Transducer<FirstInput, LastOutput>` |
| 15-arity | 15 | `Transducer<FirstInput, LastOutput>` |

**Mismatch detection:**
| Test | Position | How to trigger |
|------|----------|----------------|
| Position 1 | 2nd transducer (index 1) | Output of 1st doesn't match input of 2nd |
| Position 3 | 4th transducer (index 3) | Output of 3rd doesn't match input of 4th |
| Position 8+ | 9th+ transducer (deep) | Output at position N-1 doesn't match input at position N |

**Mismatch in longer chain (important):** At least one mismatch test should be in a chain of 10+ transducers where only one position is wrong, confirming that long chains don't simply pass-through unchecked.

### Build Order

1. Write all new test cases in `src/index.test-d.ts`
2. Run `yarn vitest --typecheck --run` — all type tests must pass (existing 12 + new ones)
3. Run `yarn check` — must pass (R008)
4. Run `yarn test:coverage` — must stay at 100% (R009)

All in one task — there are no dependencies or sequencing concerns within this slice.

### Verification Approach

| Check | Command | Expected |
|-------|---------|----------|
| Type-level tests | `yarn vitest --typecheck --run` | All pass (existing + new) |
| Full check suite | `yarn check` | 0 errors, 0 warnings |
| Coverage | `yarn test:coverage` | 100% stmt/branch/func/line |

## Constraints

- `@ts-expect-error` is binary (error or no error) — cannot assert on error message text. Branded `PipeTypeError` message content is verified by DTS inspection (completed in S01), not by type tests.
- `PrevIdx` tuple maxes out at index 19 — do not test chains longer than 20 transducers.
- Type-level test file is `src/index.test-d.ts` — vitest config includes `src/**/*.test-d.ts` for typecheck. Do not create a separate test file.
- Add tests within the existing `describe("type-level assertions")` block or add a new `describe` block in the same file.
