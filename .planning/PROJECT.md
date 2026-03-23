# transducer-ts

## What This Is

A TypeScript port of Clojure's transducers — composable, type-safe algorithmic transformations. Designed to work with rambda's `pipe` out of the box. Ships as ESM with full type declarations.

## Core Value

Type-safe transducer composition that feels natural in TypeScript and works correctly out of the box.

## Requirements

### Validated

- ✓ Core transducers implemented (map, filter, take, drop) — existing
- ✓ Execution functions implemented (transduce, into, sequence) — existing
- ✓ Composable with rambda's `pipe` — existing
- ✓ ESM build with tsup, sourcemaps, .d.ts — existing
- ✓ Strict TypeScript configuration — existing
- ✓ Linting (oxlint) and formatting (oxfmt) toolchain — existing
- ✓ Git hooks (husky + lint-staged) — existing
- ✓ Type-safe transducer internals with zero unsafe casts — Phase 1

### Active

- [ ] Comprehensive test suite covering all transducers and execution functions
- [ ] Edge case handling: negative n in take/drop matches Clojure behavior (treat as 0 for take, pass all for drop)
- [ ] Rewritten README with proper API docs and examples
- [ ] Package ready to publish as 0.1.0 (version, license, package.json metadata)

### Out of Scope

- Async transducers — adds significant complexity, defer to future version
- New transducers (takeWhile, dropWhile, mapIndexed, etc.) — ship core set first, add later
- Lazy evaluation / iterator protocol — transducers are eager by design (matches Clojure)
- Runtime input validation beyond what types enforce — library is for TypeScript consumers

## Context

- Port of Clojure's transducer protocol; Clojure semantics are the reference for behavior decisions
- `rambda` is a peer dependency — consumers provide it for `pipe`
- Yarn 4 (Berry) with PnP, no node_modules
- One module per exported function, each in its own directory under `src/` with dedicated `tsconfig.json` (project references)
- The `Reduced` sentinel pattern for early termination is the trickiest part — take uses unsafe casts that need redesigning

## Constraints

- **TypeScript strict mode**: All code must pass with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`
- **ESM only**: No CJS build, `"type": "module"` in package.json
- **No runtime dependencies**: Only `rambda` as peer dep
- **Clojure semantics**: When behavior is ambiguous, match Clojure's transducer behavior

## Key Decisions

| Decision                        | Rationale                                       | Outcome   |
| ------------------------------- | ----------------------------------------------- | --------- |
| Clojure behavior for negative n | Consistency with reference implementation       | — Pending |
| Fix unsafe casts in take        | Type safety is the core value prop              | — Pending |
| Vitest for testing              | Modern, fast, native TS support, minimal config | — Pending |
| Rewrite README                  | Current one needs proper API docs for 0.1.0     | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-03-23 after Phase 1 completion_
