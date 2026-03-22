# Phase 1: Reduced Type Redesign - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 01-reduced-type-redesign
**Areas discussed:** Internal type strategy, Reduced propagation, Public API boundary

---

## Internal Type Strategy

### Q1: How should we model the internal reducer return type?

| Option                | Description                                       | Selected                                                                                       |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --- |
| New StepFn type       | Introduce `StepFn<R, A> = (acc: R, input: A) => R | Reduced<R>` as internal type. Transducer internals use StepFn; public Reducer stays unchanged. | ✓   |
| Widen Reducer itself  | Change `Reducer<A, B>` return to `A               | Reduced<A>`. Simpler but changes public API contract.                                          |     |
| ReducerResult wrapper | Named `ReducerResult<R> = R                       | Reduced<R>` alias used in a separate StepFn. Similar to option 1 with extra alias.             |     |

**User's choice:** New StepFn type (Recommended)
**Notes:** Clean separation between internal and public types.

### Q2: Should we introduce an InternalTransducer type?

| Option                           | Description                                                                                                             | Selected |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------- |
| Inline StepFn in each transducer | Each transducer manually types its closure. No new Transducer alias needed.                                             | ✓        |
| Named InternalTransducer type    | Add `InternalTransducer<A, B> = <R>(rf: StepFn<R, B>) => StepFn<R, A>`. Cleaner signatures but one more type to manage. |          |

**User's choice:** Inline StepFn in each transducer (Recommended)
**Notes:** None

### Q3: How should the public Transducer type relate to StepFn?

| Option                                      | Description                                                                                                                       | Selected |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Widen Transducer to use StepFn              | Change `Transducer<A, B> = <R>(rf: StepFn<R, B>) => StepFn<R, A>`. Truthfully reflects that transducers work with step functions. | ✓        |
| Keep Transducer unchanged, cast at boundary | Transducer keeps using Reducer. Each transducer casts incoming rf to StepFn internally.                                           |          |
| You decide                                  | Let Claude pick the cleanest approach.                                                                                            |          |

**User's choice:** Widen Transducer to use StepFn (Recommended)
**Notes:** Transducer type is technically a public API change, but consumers rarely write it directly — they use map(), filter(), etc.

---

## Reduced Propagation

### Q4: How should map and filter handle Reduced from downstream?

| Option                     | Description                                                                                                       | Selected |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------- |
| Pass-through               | map/filter return whatever rf returns unchanged. Reduced wrapper propagates naturally. Matches Clojure semantics. | ✓        |
| Explicit check and re-wrap | map/filter check isReduced on rf's return, handle accordingly. More defensive but unnecessary.                    |          |

**User's choice:** Pass-through (Recommended)
**Notes:** Matches Clojure's transducer protocol where only the driver loop inspects Reduced.

### Q5: How should transduce unwrap Reduced?

| Option                | Description                            | Selected                                                                             |
| --------------------- | -------------------------------------- | ------------------------------------------------------------------------------------ | --- |
| Narrow with isReduced | transduce types acc as R               | Reduced<R>, narrows with isReduced() type guard, accesses .value. Zero unsafe casts. | ✓   |
| You decide            | Let Claude find the cleanest approach. |                                                                                      |

**User's choice:** Narrow with isReduced (Recommended)
**Notes:** Discussion noted that the exact narrowing mechanics in the for-of loop are left to Claude's discretion — the key constraint is zero unsafe narrowing casts.

---

## Public API Boundary

### Q6: How should we handle StepFn's visibility?

| Option                         | Description                                                                                             | Selected |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- | -------- |
| Export StepFn as public type   | StepFn is a meaningful concept. Export alongside Reducer. Consumers writing custom transducers need it. | ✓        |
| Inline the union in Transducer | Don't create StepFn — inline the union directly in Transducer type. Avoids new named type but verbose.  |          |
| You decide                     | Let Claude pick.                                                                                        |          |

**User's choice:** Export StepFn as public type (Recommended)
**Notes:** The .d.ts constraint in success criteria was written before the decision to widen Transducer. StepFn is now a first-class concept.

### Q7: How should transduce accept the user's Reducer and bridge it to StepFn?

| Option                         | Description                                                                             | Selected                |
| ------------------------------ | --------------------------------------------------------------------------------------- | ----------------------- | --- |
| Accept Reducer, cast to StepFn | transduce keeps Reducer in its signature. One safe widening cast: `rf as StepFn<R, B>`. | ✓                       |
| Accept StepFn directly         | Change transduce to accept StepFn. Forces consumers to annotate with R                  | Reduced<R> return type. |     |
| Overloaded signatures          | Accept both via overloads. Most flexible but adds complexity.                           |                         |

**User's choice:** Accept Reducer, cast to StepFn (Recommended)
**Notes:** The widening cast is safe — a function returning R is valid where R | Reduced<R> is expected. This is the opposite of the original unsafe narrowing casts.

---

## Claude's Discretion

- Exact narrowing approach in the `transduce` driver loop
- Whether `drop` needs signature changes (it doesn't use Reduced but its rf parameter type changes to StepFn)

## Deferred Ideas

None — discussion stayed within phase scope
