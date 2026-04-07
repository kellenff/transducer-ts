# Issue #5: Approach 1 selected (pipe forward inference)

**Date:** 2026-04-06  
**Issue:** [#5 — `pipe` forward callback inference](https://github.com/kellenff/transducer-ts/issues/5)

## Decision

Implement **Approach 1** from brainstorming: **thread element types through `pipe` at the call site** so TypeScript can contextually type second-and-later transducer callbacks from the previous step’s output type.

Concretely: use **explicit `pipe` overloads** (one per supported arity, up to the project’s existing max chain length) that chain `Transducer<A, B>`, `Transducer<B, C>`, … instead of relying on a single variadic `Transducer<any, any>[]` plus post-hoc `BuildConstraint` validation.

## Canonical technical spec

The full design (overload shape, `PreservingTransducer` for `take` / `drop`, consumer overloads, tests, breaking-change notes) lives in:

**[`2026-04-05-pipe-forward-inference-design.md`](./2026-04-05-pipe-forward-inference-design.md)**

That document is **authoritative** for implementation details. This file only records the **approach choice** after brainstorming.

## Explicitly out of scope for this decision

- **Approach 2:** New collection-first or callback-bundle composition API (fp-ts / Effect style).
- **Approach 3:** Documentation and tooling only without fixing inference.

## Implementation plan

Task-level steps are in:

**[`../plans/2026-04-05-pipe-forward-inference.md`](../plans/2026-04-05-pipe-forward-inference.md)**

## Self-review (placeholders / consistency)

- No TBD: decision and pointers are complete.
- Consistent with issue #5 expected behavior (e.g. `map` callback `l` inferred after `filter` on `Lap`).
- Scope: single feature (pipe inference + supporting types for preserving transducers per canonical spec).
