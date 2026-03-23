# S01: Recursive pipe types

**Goal:** Replace `pipe`'s 5 fixed overloads with recursive conditional types — unbounded arity, branded positional error messages, same runtime.
**Demo:** `pipe` with arbitrary-length transducer chains infers `Transducer<First, Last>` correctly. Type mismatches produce a `PipeTypeError` naming the position. All 71 runtime tests and 12 type-level tests pass unchanged. `dist/pipe.d.ts` emits cleanly with helper types not exported.

## Must-Haves

- Recursive types (`BuildConstraint`, `PipeResult`, `PipeTypeError`, `NextIdx`, `TransducerInput`, `TransducerOutput`) implemented in `src/pipe/index.ts` as module-private types
- Single generic `pipe` signature with `const T` type parameter replaces all 5 overloads
- Runtime implementation stays `reduceRight` — no behavioral change
- Branded `PipeTypeError<"Argument at position N: ...">` for type mismatches at any chain position
- All 71 existing runtime tests pass without changes to test files
- All 12 existing type-level tests pass without changes to test files
- `dist/pipe.d.ts` does not export `BuildConstraint`, `PipeResult`, `PipeTypeError`, or `NextIdx`
- `yarn check` passes (typecheck + lint + fmt:check)
- `yarn test:coverage` stays at 100%

## Proof Level

- This slice proves: contract + integration
- Real runtime required: yes (existing tests exercise runtime)
- Human/UAT required: no

## Verification

- `yarn test` — all 71 runtime tests pass (R003, R004)
- `yarn vitest --typecheck --run` — all 12 type-level tests pass (R001, R004)
- `yarn check` — typecheck + lint + fmt:check clean (R004)
- `yarn build` — DTS emits cleanly (R006)
- `grep -c "PipeTypeError\|BuildConstraint\|PipeResult\|NextIdx" dist/pipe.d.ts` returns > 0 (types exist in DTS)
- `! grep -q "export.*PipeTypeError\|export.*BuildConstraint\|export.*PipeResult\|export.*NextIdx" dist/pipe.d.ts` — helper types not in export block (R006)
- `yarn test:coverage` — 100% coverage maintained

## Observability / Diagnostics

This slice is a pure type-level refactor with no new runtime behavior. Observability surfaces:

- **Runtime signals:** None new. The `reduceRight` implementation body is unchanged; any exception thrown by a transducer or reducer bubbles up to the caller as before.
- **Type-error visibility:** Mismatched transducer chains produce a `PipeTypeError<"Argument at position K: …">` branded object type in the parameter position. TypeScript reports the structural mismatch at the call site, naming the offending argument index.
- **Inspection surface:** `src/pipe/index.ts` — all helper types are module-private, readable by inspecting the source. `dist/pipe.d.ts` — emitted declarations show helper types as unexported module-scoped aliases, confirming they don't leak into the consumer API.
- **Failure visibility:** If a type constraint is wrong, `yarn vitest --typecheck --run` fails with a type error at the specific `expectTypeOf` assertion. `yarn check` (tsc project build) independently catches structural errors.
- **Redaction:** No secrets or user data involved. No logging needed.

## Integration Closure

- Upstream surfaces consumed: `src/types/index.ts` — `Transducer<A, B>`, `StepFn<R, A>` (read-only, unchanged)
- New wiring introduced in this slice: none — `src/index.ts` barrel export of `pipe` unchanged
- What remains before the milestone is truly usable end-to-end: S02 adds extended type-level tests for 6+, 10, 15 arity and mismatch position detection

## Tasks

- [x] **T01: Replace pipe overloads with recursive conditional types** `est:45m`
  - Why: Core implementation — replaces the 5 fixed overloads with unbounded recursive types while keeping runtime identical. Covers R001, R002, R003, R004, R006.
  - Files: `src/pipe/index.ts`
  - Do: Add 6 internal type aliases (`PipeTypeError`, `TransducerInput`, `TransducerOutput`, `NextIdx`, `BuildConstraint`, `PipeResult`). Replace 5 overload signatures with single generic signature using `const T` type parameter and `BuildConstraint<T> extends T ? T : BuildConstraint<T>` conditional constraint. Keep `reduceRight` runtime body with `as any` cast. Update JSDoc to remove "Up to 5-arity" wording. Run `yarn fmt`. Verify with `yarn test`, `yarn vitest --typecheck --run`, `yarn check`.
  - Verify: `yarn test && yarn vitest --typecheck --run && yarn check`
  - Done when: All 71 runtime tests and 12 type-level tests pass, `yarn check` clean

- [x] **T02: Build and verify DTS output quality** `est:15m`
  - Why: Retires the key risk (DTS output quality). Verifies `dist/pipe.d.ts` is consumer-friendly — helper types present but not exported. Validates coverage. Covers R006.
  - Files: `src/pipe/index.ts`, `dist/pipe.d.ts`
  - Do: Run `yarn build`. Inspect `dist/pipe.d.ts` — verify helper types (`PipeTypeError`, `BuildConstraint`, `PipeResult`, `NextIdx`) are present as module-scoped types but NOT in the `export { ... }` block. Only `pipe` should be exported. If DTS has issues (raw recursive aliases, leaked types), adjust type definitions in `src/pipe/index.ts` and rebuild. Run `yarn test:coverage` to confirm 100%.
  - Verify: `yarn build && ! grep -q 'export.*PipeTypeError\|export.*BuildConstraint\|export.*PipeResult\|export.*NextIdx' dist/pipe.d.ts && yarn test:coverage`
  - Done when: `dist/pipe.d.ts` exports only `pipe`, helper types are module-private, coverage at 100%

## Files Likely Touched

- `src/pipe/index.ts`
- `dist/pipe.d.ts` (build output — verified, not manually edited)
