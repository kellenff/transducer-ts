# Architecture

**Analysis Date:** 2026-03-22

## Pattern Overview

**Overall:** Transducer pattern with modular, composable transformations

**Key Characteristics:**

- **Function composition focus** — Each transformation (map, filter, take, drop) returns a composable transducer
- **Lazy evaluation** — Transducers describe transformations but don't execute until applied via `transduce`, `into`, or `sequence`
- **Early termination support** — The `Reduced` sentinel enables short-circuiting (used by `take`)
- **Pluggable reducers** — Transducers are agnostic to the reducing function, enabling reuse across arrays, streams, or custom collectors

## Layers

**Type System (`src/types/`):**

- Purpose: Define the core abstractions
- Location: `src/types/index.ts`
- Contains: `Reducer<A, B>` type, `Transducer<A, B>` type, `Reduced<T>` interface, and sentinel helpers
- Depends on: Nothing
- Used by: All other modules

**Transformation Transducers (`src/map/`, `src/filter/`, `src/take/`, `src/drop/`):**

- Purpose: Implement individual transformation operations
- Location: `src/map/index.ts`, `src/filter/index.ts`, `src/take/index.ts`, `src/drop/index.ts`
- Contains: Factory functions that return `Transducer` instances
- Depends on: `src/types/`
- Used by: Consumer code and higher-level abstractions

**Execution Layer (`src/transduce/`):**

- Purpose: Execute a transducer pipeline against an iterable with a reducing function
- Location: `src/transduce/index.ts`
- Contains: `transduce()` function that iterates, applies transformations, and handles early termination
- Depends on: `src/types/`
- Used by: `src/into/`, `src/sequence/`

**Convenience Abstractions (`src/into/`, `src/sequence/`):**

- Purpose: Provide ergonomic APIs for common use cases
- Location: `src/into/index.ts`, `src/sequence/index.ts`
- Contains: Higher-level functions that wrap `transduce` with pre-configured reducers
- Depends on: `src/types/`, `src/transduce/`
- Used by: Consumer code

**Entry Point (`src/index.ts`):**

- Purpose: Barrel re-export all public APIs
- Location: `src/index.ts`
- Exports: All types and functions for consumers

## Data Flow

**Composition Phase:**

1. Consumer calls `pipe(filter(...), map(...), ...)` using rambda's `pipe`
2. Each transducer factory returns a function that accepts a reducing function
3. Composition creates a nested function structure (not executed yet)

**Execution Phase (via `transduce`):**

1. `transduce(xform, reducer, init, iterable)` receives the composed transducer
2. Applies the transducer to the reducer: `xrf = xform(reducer)`
3. Iterates over the iterable, passing each item through `xrf`
4. For each item: `acc = xrf(acc, item)`
5. Checks if result is `Reduced` — if so, unwraps and returns early
6. Returns final accumulator

**Convenience Wrappers:**

- `into(array, xform, iterable)` — wraps execution with an array push reducer
- `sequence(xform, iterable)` — wraps execution with an empty array and into

**State Management:**

- **Transducer state** — Captured in closure (e.g., `taken` counter in `take`, `dropped` counter in `drop`)
- **Accumulator state** — Passed immutably through the reduction chain
- **Early termination** — Signaled via `Reduced` wrapper, checked after each step

## Key Abstractions

**Reducer:**

- Purpose: Function that combines an accumulator with a new value
- Type: `Reducer<A, B> = (acc: A, input: B) => A`
- Examples: `(acc: number[], x: number) => { acc.push(x); return acc; }`
- Pattern: Pure function, returns new accumulator state

**Transducer:**

- Purpose: Function that transforms one reducing function into another
- Type: `Transducer<A, B> = <R>(rf: Reducer<R, B>) => Reducer<R, A>`
- Examples: `map()`, `filter()`, `take()`, `drop()`
- Pattern: Higher-order function enabling function composition

**Reduced:**

- Purpose: Sentinel value wrapping a result to signal early termination
- Type: `Reduced<T>` interface with `value` and `__reduced` flag
- Usage: Returned by transducers like `take` when limit is reached
- Pattern: Type-safe way to distinguish early termination from normal values

## Entry Points

**For End Users:**

- `transduce(xform, reducer, init, iterable)` — `src/transduce/index.ts`
  - Triggers: Direct call to apply transducer with custom reducer
  - Responsibilities: Iterate, apply transformations, handle early termination

- `into(array, xform, iterable)` — `src/into/index.ts`
  - Triggers: Direct call to transduce into an array
  - Responsibilities: Wrap transduce with array push reducer

- `sequence(xform, iterable)` — `src/sequence/index.ts`
  - Triggers: Direct call to eagerly apply and return new array
  - Responsibilities: Wrap into with empty array initialization

**For Composition:**

- `map(f)` — `src/map/index.ts` — Apply function to each element
- `filter(pred)` — `src/filter/index.ts` — Keep elements matching predicate
- `take(n)` — `src/take/index.ts` — Take first n elements with early termination
- `drop(n)` — `src/drop/index.ts` — Skip first n elements

## Error Handling

**Strategy:** Errors propagate naturally through the reduction chain (no custom error wrapping)

**Patterns:**

- Synchronous errors in reducer functions bubble up to caller
- Synchronous errors in transducer functions (map, filter predicates) bubble up to caller
- Early termination via `Reduced` for control flow (not errors)
- Type system provides compile-time guarantees (strict TypeScript with `noUncheckedIndexedAccess`)

## Cross-Cutting Concerns

**Logging:** Not implemented — transducers are pure functions without side effects

**Validation:** Handled by TypeScript type system. Each transducer enforces input/output type contracts at compile time.

**Authentication:** Not applicable — library is pure algorithmic transformation

**Type Safety:** Transducer generic parameters enforce that input type of one transducer matches output type of previous:

```typescript
const xform = pipe(
  filter((x: number) => x > 0), // input: number, output: number
  map((x: number) => x * 2), // input: number, output: number
  map((x: number) => String(x)), // input: number, output: string
);
```

---

_Architecture analysis: 2026-03-22_
