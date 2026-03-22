# Phase 1: Reduced Type Redesign - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate unsafe `as unknown as R` casts in `take` and `transduce` by introducing a `StepFn` type that models `R | Reduced<R>` returns. The public `Reducer` type stays unchanged for consumer-facing APIs. All transducer internals become type-sound.

</domain>

<decisions>
## Implementation Decisions

### Internal Type Strategy

- **D-01:** Introduce `StepFn<R, A> = (acc: R, input: A) => R | Reduced<R>` as a new type in `src/types/index.ts`
- **D-02:** `Transducer<A, B>` is widened to `<R>(rf: StepFn<R, B>) => StepFn<R, A>` — it now references `StepFn` instead of `Reducer`
- **D-03:** No `InternalTransducer` alias — each transducer function inlines `StepFn` in its closure signature
- **D-04:** `StepFn` is exported as a first-class public type alongside `Reducer`, `Transducer`, `Reduced`

### Reduced Propagation

- **D-05:** Pass-through pattern — `map` and `filter` return whatever the downstream `rf` returns without inspecting or re-wrapping `Reduced`. The `R | Reduced<R>` union propagates naturally through the type system. Matches Clojure semantics.
- **D-06:** Only `take` (and future early-termination transducers) call `reduced()` to produce `Reduced<R>` values
- **D-07:** Only `transduce` (the driver loop) checks `isReduced()` and unwraps — no intermediate transducer inspects `Reduced`

### Public API Boundary

- **D-08:** `transduce` keeps `Reducer<R, B>` in its parameter signature (consumer-friendly). Internally, it performs one safe widening cast: `rf as StepFn<R, B>`. This is safe because `R` (Reducer's return) is a member of `R | Reduced<R>` (StepFn's return).
- **D-09:** `Reducer<A, B> = (acc: A, input: B) => A` is unchanged — consumers writing reducers for `transduce`/`into` are unaffected
- **D-10:** `into` and `sequence` function signatures are unchanged — they delegate to `transduce` which handles the boundary

### Claude's Discretion

- Exact narrowing approach in the `transduce` loop — Claude should find the cleanest way to track `R | Reduced<R>` through the for-of loop and narrow to `R` at the return, minimizing casts
- Whether `drop` needs any changes (it doesn't use `Reduced` today, but its `rf` parameter type changes to `StepFn`)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

### Project Requirements

- `.planning/REQUIREMENTS.md` — TYPE-01 and TYPE-02 are the requirements for this phase
- `.planning/ROADMAP.md` §Phase 1 — Success criteria defining what must be TRUE

### Source Files (current state)

- `src/types/index.ts` — Current type definitions (`Reducer`, `Transducer`, `Reduced`, `reduced`, `isReduced`)
- `src/take/index.ts` — Two `as unknown as R` casts to eliminate
- `src/transduce/index.ts` — One `acc.value as R` cast to eliminate
- `src/map/index.ts` — Needs `StepFn` in closure signature (pass-through, no logic change)
- `src/filter/index.ts` — Needs `StepFn` in closure signature (pass-through, no logic change)
- `src/drop/index.ts` — May need `StepFn` in closure signature
- `src/into/index.ts` — Delegates to `transduce`, likely no changes
- `src/sequence/index.ts` — Delegates to `into`, likely no changes
- `src/index.ts` — Barrel re-export, add `StepFn` to type exports

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `reduced()` and `isReduced()` helpers already exist and are correctly implemented
- `Reduced<T>` interface with `__reduced` brand is sound — no changes needed

### Established Patterns

- One module per function, each in its own directory with dedicated `tsconfig.json`
- Type imports use `import type` syntax, value imports separate
- `.ts` extension imports throughout

### Integration Points

- All transducers import from `../types/index.ts` — single point of change for type definitions
- `transduce` is the only driver loop — single point for `Reduced` unwrapping
- `into` and `sequence` delegate to `transduce` — changes propagate automatically

</code_context>

<specifics>
## Specific Ideas

- The widening cast `rf as StepFn<R, B>` in `transduce` is explicitly acknowledged as safe — a function returning `R` is valid where `R | Reduced<R>` is expected
- The original unsafe casts (`as unknown as R`) were _narrowing_ — hiding `Reduced<R>` as `R`. The new approach has zero narrowing casts in transducer code.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 01-reduced-type-redesign_
_Context gathered: 2026-03-22_
