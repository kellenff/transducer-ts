---
estimated_steps: 4
estimated_files: 2
skills_used: []
---

# T02: Build and verify DTS output quality

**Slice:** S01 — Recursive pipe types
**Milestone:** M002

## Description

Build the project and verify that `dist/pipe.d.ts` is consumer-friendly. The helper types (`PipeTypeError`, `BuildConstraint`, `PipeResult`, `NextIdx`, etc.) must be present in the DTS as module-scoped types but NOT exported — only `pipe` should appear in the export block. This retires the key DTS quality risk identified in the roadmap. Also confirms coverage stays at 100%.

## Steps

1. Run `yarn build` — ensure it completes without errors.

2. Read `dist/pipe.d.ts` and verify:
   - Helper types (`PipeTypeError`, `BuildConstraint`, `PipeResult`, `NextIdx`, `TransducerInput`, `TransducerOutput`) appear as `type` declarations in the file
   - ONLY `pipe` appears in the `export { pipe }` line (or equivalent export statement)
   - No helper type appears in any `export` statement
   - The `pipe` function signature references `BuildConstraint<T>` and `PipeResult<T>` (these resolve at call sites — confirmed by existing type-level tests passing)

3. If the DTS has issues (e.g., helper types leaked into exports, or types not emitted at all), adjust the type definitions in `src/pipe/index.ts` to fix the emission, rebuild, and re-verify. Common fixes: ensure types are not re-exported, ensure `verbatimModuleSyntax` is not causing issues with type-only constructs.

4. Run `yarn test:coverage` and confirm coverage is at 100%.

## Must-Haves

- [ ] `yarn build` succeeds
- [ ] `dist/pipe.d.ts` contains helper types as non-exported module-scoped declarations
- [ ] `dist/pipe.d.ts` exports ONLY `pipe` — no `PipeTypeError`, `BuildConstraint`, `PipeResult`, or `NextIdx` in export block
- [ ] `yarn test:coverage` reports 100% coverage

## Verification

- `yarn build` — completes without errors
- `grep -c "PipeTypeError\|BuildConstraint\|PipeResult\|NextIdx" dist/pipe.d.ts` returns > 0 (types present)
- `! grep -q "export.*PipeTypeError\|export.*BuildConstraint\|export.*PipeResult\|export.*NextIdx" dist/pipe.d.ts` — not exported
- `yarn test:coverage` — 100% coverage

## Inputs

- `src/pipe/index.ts` — recursive pipe types from T01

## Expected Output

- `dist/pipe.d.ts` — verified consumer-friendly declaration file with only `pipe` exported

## Observability Impact

This task is a build-and-verify step — no runtime behavior changes.

- **Build signals:** `yarn build` stdout shows ESM and DTS build success/failure explicitly; DTS size for `dist/pipe.d.ts` is ~1.6 KB (reflects all helper type definitions).
- **DTS inspection surface:** `dist/pipe.d.ts` is human-readable. A future agent can `cat dist/pipe.d.ts` to confirm helper types are present but not exported.
- **Failure visibility:** If helper types leak into exports, `grep "export.*PipeTypeError"` will match. If types are missing, `grep -c "PipeTypeError\|BuildConstraint"` returns 0. If coverage drops, `yarn test:coverage` table shows `< 100` in any column.
- **No secrets, no logging, no side effects.** Pure build artifact verification.
