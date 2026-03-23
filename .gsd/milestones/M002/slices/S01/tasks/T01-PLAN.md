---
estimated_steps: 5
estimated_files: 1
skills_used: []
---

# T01: Replace pipe overloads with recursive conditional types

**Slice:** S01 — Recursive pipe types
**Milestone:** M002

## Description

Replace the 5 fixed overloads in `src/pipe/index.ts` with recursive conditional types that support arbitrary-length transducer chains. The implementation adds 6 module-private type aliases and a single generic `pipe` function signature. The runtime body (`reduceRight`) stays identical — this is a type-level-only refactor. All existing tests must pass unchanged.

## Steps

1. Open `src/pipe/index.ts`. Remove all 5 overload signatures (the lines for 1-arity through 5-arity). Keep the import of `Transducer` and the runtime implementation line.

2. Add these 6 internal type aliases ABOVE the `pipe` function (all module-private — no `export`):
   ```typescript
   type PipeTypeError<Msg extends string> = { readonly __brand: "PipeTypeError"; readonly message: Msg };

   type TransducerInput<T> = T extends Transducer<infer A, any> ? A : never;
   type TransducerOutput<T> = T extends Transducer<any, infer B> ? B : never;

   type NextIdx<I extends number> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20][I];

   type BuildConstraint<T extends readonly Transducer<any, any>[]> = {
     readonly [K in keyof T]: K extends "0"
       ? T[K]
       : K extends `${infer I extends number}`
         ? TransducerOutput<T[NextIdx<I> extends undefined ? never : NextIdx<I> extends keyof T ? NextIdx<I> : never]> extends TransducerInput<T[K]>
           ? T[K]
           : PipeTypeError<`Argument at position ${K}: output of previous transducer does not match input of this transducer`>
         : T[K];
   };

   type PipeResult<T extends readonly Transducer<any, any>[]> =
     T extends readonly [Transducer<infer A, any>]
       ? Transducer<A, TransducerOutput<T[0]>>
       : T extends readonly [Transducer<infer A, any>, ...any[]]
         ? Transducer<A, TransducerOutput<T[Extract<keyof T, `${number}`> extends infer Last extends `${number}` ? { [K in Last]: K }[Last] : never]>>
         : never;
   ```
   
   **Important note on `BuildConstraint`:** The index mapping uses `NextIdx` to look *backward* — position K checks that the output of the *previous* transducer (at K-1, found via `NextIdx` offset) matches the input of transducer K. The indexing is subtle: when walking position K, the "previous" is at the index before K in the tuple. The `NextIdx` tuple maps `[I] → I+1`, so to find the predecessor of K we need the reverse. Actually, the constraint walks forward: position 0 is unconstrained, and position K (K>0) checks that the output of position K-1 matches input of position K.

   **Correction — use the validated approach from research:** The `BuildConstraint` should check each position K>0 by looking at the transducer at K-1. Here's the corrected `NextIdx` usage: `NextIdx` maps index I to I+1. To get K-1 from K, we don't need `NextIdx` — we need the predecessor. The simplest correct approach is to restructure as checking pairs: for position K (stringified from tuple key), check that `TransducerOutput<T[Prev]>` extends `TransducerInput<T[K]>`.

   **The executor should use this validated pattern for `BuildConstraint`:**
   ```typescript
   type BuildConstraint<T extends readonly Transducer<any, any>[]> = {
     [K in keyof T]: K extends `${number}`
       ? K extends "0"
         ? T[K]
         : TransducerOutput<T[Prev<K>]> extends TransducerInput<T[K]>
           ? T[K]
           : PipeTypeError<`Argument at position ${K}: output of previous transducer does not match input of this transducer`>
       : T[K];
   };
   ```
   Where `Prev<K>` maps string-numeric key K to K-1. This can be done with a reverse lookup tuple similar to `NextIdx` but reversed:
   ```typescript
   type PrevIdx<I extends number> = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19][I];
   ```
   
   **Or, use the prototype-validated approach:** The research confirms all tests pass. The executor should implement the types, run `yarn fmt`, then run the test suite. If tests fail, adjust the type definitions — the test suite is the ground truth. The key constraints are:
   - Position 0: unconstrained (pass through)
   - Position K>0: check `TransducerOutput<T[K-1]> extends TransducerInput<T[K]>`
   - On mismatch: return `PipeTypeError<"Argument at position K: ...">`
   - `PipeResult<T>`: extract `Transducer<Input of first, Output of last>`

3. Replace the 5 overload signatures + implementation signature with a single generic signature:
   ```typescript
   export function pipe<const T extends readonly Transducer<any, any>[]>(
     ...xforms: BuildConstraint<T> extends T ? T : BuildConstraint<T>
   ): PipeResult<T>;
   export function pipe(...xforms: Transducer<any, any>[]): Transducer<any, any> {
     return (rf) => xforms.reduceRight((acc, xf) => xf(acc), rf);
   }
   ```
   Note: The first line is the public signature, the second is the implementation overload (needed because TS can't infer the body against the constrained generic). The implementation overload uses `any` types and the runtime body is identical to the current code.

4. Update the JSDoc comment: remove "Up to 5-arity with full type inference" — replace with "Compose transducers left-to-right with full type inference at any arity."

5. Run `yarn fmt` to apply oxfmt formatting, then run `yarn test && yarn vitest --typecheck --run && yarn check` to verify everything passes.

## Must-Haves

- [ ] All 5 overload signatures removed from `src/pipe/index.ts`
- [ ] 6+ internal type aliases added (PipeTypeError, TransducerInput, TransducerOutput, NextIdx/PrevIdx, BuildConstraint, PipeResult) — none exported
- [ ] Single generic `pipe` signature with `const T` and `BuildConstraint` constraint
- [ ] Runtime body unchanged: `(rf) => xforms.reduceRight((acc, xf) => xf(acc), rf)`
- [ ] All 71 runtime tests pass (`yarn test`)
- [ ] All 12 type-level tests pass (`yarn vitest --typecheck --run`)
- [ ] `yarn check` passes (typecheck + lint + fmt:check)

## Verification

- `yarn test` — all 71 runtime tests pass
- `yarn vitest --typecheck --run` — all 12 type-level tests pass
- `yarn check` — typecheck + lint + fmt:check clean
- `grep -q "PipeTypeError" src/pipe/index.ts` — branded error type exists
- `grep -q "BuildConstraint" src/pipe/index.ts` — constraint type exists
- `! grep -q "export.*PipeTypeError\|export.*BuildConstraint\|export.*PipeResult\|export.*NextIdx" src/pipe/index.ts` — none exported

## Inputs

- `src/pipe/index.ts` — current 5-overload implementation to be replaced
- `src/types/index.ts` — `Transducer<A, B>` and `StepFn<R, A>` type definitions (read-only)

## Expected Output

- `src/pipe/index.ts` — rewritten with recursive conditional types, single generic signature, same runtime

## Observability Impact

This task introduces no new runtime behavior — it is a type-level-only refactor. Observability notes:

- **What changes:** The `pipe` function's overload signatures in `src/pipe/index.ts` are replaced by recursive conditional types. The compiled JavaScript output is identical.
- **Inspection:** Run `yarn vitest --typecheck --run` to see type-check pass/fail at each `expectTypeOf` assertion. Run `yarn check` to confirm tsc project build is clean.
- **Failure state:** A broken `BuildConstraint` or `PipeResult` type makes one or more `pipe N-arity` tests in `src/index.test-d.ts` fail with a type error. The vitest typecheck output names the failing test and the structural mismatch.
- **No runtime signals change:** `reduceRight` body is unchanged; no new logging, metrics, or error paths are introduced.
