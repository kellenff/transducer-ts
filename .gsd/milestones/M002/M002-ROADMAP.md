# M002: N-arity Pipe

**Vision:** Replace pipe's 5 fixed type overloads with recursive conditional types — unbounded arity, branded positional error messages, same runtime.

## Success Criteria

- `pipe` with 10+ transducers infers `Transducer<First, Last>` correctly
- Type mismatch at any chain position produces a branded `PipeTypeError` naming the position
- All 71 existing runtime tests and 12 type-level tests pass without modification
- `dist/pipe.d.ts` is consumer-readable after `yarn build`
- `yarn check` passes, coverage at 100%

## Key Risks / Unknowns

- **DTS output quality** — tsup may emit raw recursive aliases instead of resolved types. Must verify early.
- **TS recursion depth** — Prototype works at 15; unknown practical ceiling.

## Proof Strategy

- DTS risk → retire in S01 by building and inspecting `dist/pipe.d.ts` after the type refactor
- Recursion depth → retire in S02 by adding type-level tests at 10+ and 15 arity

## Verification Classes

- Contract verification: `yarn test`, `yarn check`, `yarn test:coverage`
- Integration verification: `yarn build` + inspect `dist/pipe.d.ts`
- Operational verification: none
- UAT / human verification: none

## Milestone Definition of Done

This milestone is complete only when all are true:

- pipe overloads replaced with recursive types
- branded PipeTypeError error messages work at any chain position
- all existing tests pass unchanged
- new type-level tests prove 6+ arity and mismatch detection
- DTS output is consumer-friendly
- yarn check and coverage pass

## Requirement Coverage

- Covers: R001, R002, R003, R004, R005, R006, R007, R008, R009
- Partially covers: none
- Leaves for later: R010 (M003)
- Orphan risks: none

## Slices

- [x] **S01: Recursive pipe types** `risk:high` `depends:[]`
  > After this: `pipe` accepts arbitrary-length transducer chains with correct type inference and branded positional error messages. All existing tests pass unchanged. `dist/pipe.d.ts` verified readable.

- [x] **S02: Extended type-level tests** `risk:medium` `depends:[S01]`
  > After this: New type-level tests prove 6, 10, and 15 arity inference, mismatch detection at positions 1, 3, and 8+, and branded error message content. `yarn check` and coverage pass.

## Boundary Map

### S01 → S02

Produces:
- `src/pipe/index.ts` → `pipe()` with recursive types (BuildConstraint, PipeResult, PipeTypeError, NextIdx — all internal)
- `dist/pipe.d.ts` → clean consumer-facing declaration

Consumes:
- nothing (first slice)

### S02 (terminal)

Produces:
- `src/index.test-d.ts` → extended type-level tests for 6+, 10, 15 arity and mismatch positions
- verified `yarn check`, `yarn test:coverage` passing

Consumes from S01:
- `src/pipe/index.ts` → the recursive pipe signature
