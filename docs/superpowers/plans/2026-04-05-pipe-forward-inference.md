# Pipe Forward Type Inference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix pipe's forward type inference so subsequent transducer callbacks infer parameter types from preceding outputs (issue #5).

**Architecture:** Replace pipe's variadic `BuildConstraint` type machinery with 21 explicit overload signatures that chain generic parameters A–V. Add `PreservingTransducer` interface for element-preserving transducers (take, drop) that is dual-callable on iterables. Add consumer overloads on sequence/into/transduce/toFn for PreservingTransducer.

**Tech Stack:** TypeScript 5.9.3, vitest (runtime + type-level tests via `--typecheck`)

---

## File Map

| File                     | Action  | Responsibility                                                            |
| ------------------------ | ------- | ------------------------------------------------------------------------- |
| `src/types/index.ts`     | Modify  | Add `PreservingTransducer` interface, export it                           |
| `src/pipe/index.ts`      | Rewrite | Delete BuildConstraint machinery, add 21 overloads + variadic fallback    |
| `src/take/index.ts`      | Modify  | Return `PreservingTransducer`, add standalone callable path               |
| `src/drop/index.ts`      | Modify  | Return `PreservingTransducer`, add standalone callable path               |
| `src/sequence/index.ts`  | Modify  | Add `PreservingTransducer` overload                                       |
| `src/into/index.ts`      | Modify  | Add `PreservingTransducer` overload                                       |
| `src/transduce/index.ts` | Modify  | Add `PreservingTransducer` overloads                                      |
| `src/toFn/index.ts`      | Modify  | Add `PreservingTransducer` overload                                       |
| `src/index.ts`           | Modify  | Export `PreservingTransducer` type                                        |
| `src/index.test-d.ts`    | Rewrite | Type-level contract tests for inference, PreservingTransducer, mismatches |
| `src/take/index.test.ts` | Modify  | Add standalone callable unit tests                                        |
| `src/drop/index.test.ts` | Modify  | Add standalone callable unit tests                                        |

---

### Task 1: Add `PreservingTransducer` to types

**Files:**

- Modify: `src/types/index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Add `PreservingTransducer` interface to types**

In `src/types/index.ts`, add after the `Transducer` type (before the `Reduced` interface):

```ts
/**
 * A transducer that preserves the element type — works with any element type.
 * Dual-callable: use as a transducer (pass a StepFn) or standalone (pass an Iterable).
 * Used by take, drop, and other transducers that don't transform elements.
 */
export interface PreservingTransducer {
  /** Standalone: directly callable on iterables. */
  <T>(coll: Iterable<T>): readonly T[];
  /** Transducer: transforms a reducing function. Must be last for inference. */
  <R, A>(rf: StepFn<R, A>): StepFn<R, A>;
}
```

- [ ] **Step 2: Export `PreservingTransducer` from barrel**

In `src/index.ts`, update the type export line:

```ts
export type {
  Reducer,
  StepFn,
  Transducer,
  Reduced,
  PreservingTransducer,
} from "./types/index.js";
```

- [ ] **Step 3: Run typecheck to verify**

Run: `yarn typecheck`
Expected: PASS (new type is additive, nothing references it yet)

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/index.ts
git commit -m "feat(types): add PreservingTransducer interface"
```

---

### Task 2: Rewrite `pipe` with 21 overloads

**Files:**

- Rewrite: `src/pipe/index.ts`

- [ ] **Step 1: Write the type-level test for forward inference**

In `src/index.test-d.ts`, replace the entire file contents with this. This is the contract test — it must fail before the implementation and pass after:

```ts
import { describe, expectTypeOf, it } from "vitest";
import {
  drop,
  filter,
  filterGuard,
  into,
  map,
  pipe,
  reduced,
  sequence,
  take,
  toFn,
  transduce,
} from "./index.js";
import type { PreservingTransducer, StepFn, Transducer } from "./index.js";

describe("forward inference through pipe", () => {
  it("2-arity: filter then map infers callback param from filter output", () => {
    const xf = pipe(
      filter((x: number) => x > 0),
      map((x) => x * 2),
    );
    expectTypeOf(xf).toEqualTypeOf<Transducer<number, number>>();
  });

  it("2-arity: map then filter infers callback param from map output", () => {
    const xf = pipe(
      map((x: number) => String(x)),
      filter((s) => s.length > 0),
    );
    expectTypeOf(xf).toEqualTypeOf<Transducer<number, string>>();
  });

  it("3-arity: filter + map + take infers through chain", () => {
    const xf = pipe(
      filter((x: number) => x > 0),
      map((x) => String(x)),
      take(5),
    );
    expectTypeOf(xf).toEqualTypeOf<Transducer<number, string>>();
  });

  it("6-arity: long chain infers through all positions", () => {
    const xf = pipe(
      map((x: number) => String(x)),
      filter((s) => s.length > 0),
      map((s) => s.length),
      filter((n) => n > 0),
      map((n) => n > 0),
      map((b: boolean): number => (b ? 1 : 0)),
    );
    expectTypeOf(xf).toEqualTypeOf<Transducer<number, number>>();
  });

  it("issue #5 reproduction: filter(Lap) then map infers Lap", () => {
    interface Lap {
      excluded: boolean;
      fuelUsedLiters: number;
    }
    const xf = pipe(
      filter((l: Lap) => !l.excluded),
      map((l) => l.fuelUsedLiters),
    );
    expectTypeOf(xf).toEqualTypeOf<Transducer<Lap, number>>();
  });
});

describe("PreservingTransducer contracts", () => {
  it("take returns PreservingTransducer", () => {
    expectTypeOf(take(3)).toEqualTypeOf<PreservingTransducer>();
  });

  it("drop returns PreservingTransducer", () => {
    expectTypeOf(drop(2)).toEqualTypeOf<PreservingTransducer>();
  });

  it("take standalone callable infers element type from array", () => {
    expectTypeOf(take(3)([1, 2, 3, 4])).toEqualTypeOf<readonly number[]>();
  });

  it("drop standalone callable infers element type from array", () => {
    expectTypeOf(drop(1)(["a", "b", "c"])).toEqualTypeOf<readonly string[]>();
  });

  it("take standalone callable infers element type from Set", () => {
    expectTypeOf(take(2)(new Set([1, 2, 3]))).toEqualTypeOf<
      readonly number[]
    >();
  });
});

describe("consumer overloads with PreservingTransducer", () => {
  it("sequence with take infers element type from collection", () => {
    expectTypeOf(sequence(take(3), [1, 2, 3, 4])).toEqualTypeOf<number[]>();
  });

  it("sequence with drop infers element type from collection", () => {
    expectTypeOf(sequence(drop(1), ["a", "b"])).toEqualTypeOf<string[]>();
  });

  it("into with take infers element type", () => {
    expectTypeOf(into([] as number[], take(3), [1, 2, 3, 4])).toEqualTypeOf<
      number[]
    >();
  });

  it("transduce with take infers element type", () => {
    expectTypeOf(
      transduce(take(2), (acc: number, x: number) => acc + x, 0, [1, 2, 3]),
    ).toEqualTypeOf<number>();
  });

  it("toFn with PreservingTransducer returns polymorphic function", () => {
    const fn = toFn(take(3));
    expectTypeOf(fn).toEqualTypeOf<(coll: Iterable<unknown>) => unknown[]>();
  });
});

describe("pipe result types", () => {
  it("pipe 1-arity preserves transducer type", () => {
    const xf = pipe(map((x: number) => String(x)));
    expectTypeOf(xf).toEqualTypeOf<Transducer<number, string>>();
  });

  it("pipe 2-arity infers correct input/output types", () => {
    const xf = pipe(
      map((x: number) => String(x)),
      filter((s) => s.length > 0),
    );
    expectTypeOf(xf).toEqualTypeOf<Transducer<number, string>>();
  });

  it("pipe 3-arity with take infers correct types", () => {
    const xf = pipe(
      filter((x: number) => x > 0),
      map((x) => String(x)),
      take(5),
    );
    expectTypeOf(xf).toEqualTypeOf<Transducer<number, string>>();
  });

  it("pipe 3-arity sequence infers output type", () => {
    const xf = pipe(
      filter((x: number) => x > 0),
      map((x) => x * 2),
      take(5),
    );
    expectTypeOf(sequence(xf, [1, 2, 3])).toEqualTypeOf<number[]>();
  });

  it("pipe with filterGuard narrows then map infers narrowed type", () => {
    const isString = (x: string | number): x is string => typeof x === "string";
    const xf = pipe(
      filterGuard(isString),
      map((s) => s.length),
    );
    expectTypeOf(xf).toEqualTypeOf<Transducer<string | number, number>>();
  });

  it("pipe 10-arity infers Transducer<number, number>", () => {
    const xf = pipe(
      map((x: number) => String(x)),
      filter((s) => s.length > 0),
      map((s) => s.length),
      filter((n) => n > 0),
      map((n) => n > 0),
      map((b: boolean) => (b ? 1 : 0)),
      filter((n) => n > 0),
      map((n) => String(n)),
      drop(1),
      map((s) => s.length),
    );
    expectTypeOf(xf).toEqualTypeOf<Transducer<number, number>>();
  });

  it("pipe 15-arity infers Transducer<number, number>", () => {
    const xf = pipe(
      map((x: number) => String(x)),
      filter((s) => s.length > 0),
      map((s) => s.length),
      filter((n) => n > 0),
      map((n) => n > 0),
      map((b: boolean) => (b ? 1 : 0)),
      filter((n) => n > 0),
      map((n) => String(n)),
      drop(1),
      map((s) => s.length),
      take(10),
      map((n) => n > 0),
      map((b: boolean) => (b ? "yes" : "no")),
      filter((s) => s.length > 0),
      map((s) => s.length),
    );
    expectTypeOf(xf).toEqualTypeOf<Transducer<number, number>>();
  });

  it("pipe 21-arity infers Transducer<number, number>", () => {
    const xf = pipe(
      map((x: number) => String(x)),
      filter((s) => s.length > 0),
      map((s) => s.length),
      filter((n) => n > 0),
      map((n) => n > 0),
      map((b: boolean) => (b ? 1 : 0)),
      filter((n) => n > 0),
      map((n) => String(n)),
      drop(1),
      map((s) => s.length),
      take(10),
      map((n) => n > 0),
      map((b: boolean) => (b ? "yes" : "no")),
      filter((s) => s.length > 0),
      map((s) => s.length),
      map((n) => String(n)),
      filter((s) => s.length > 0),
      map((s) => s.length),
      map((n) => n > 0),
      map((b: boolean) => (b ? 1 : 0)),
      map((n) => n),
    );
    expectTypeOf(xf).toEqualTypeOf<Transducer<number, number>>();
  });
});

describe("pipe mismatch detection", () => {
  it("pipe rejects mismatch at position 1", () => {
    // @ts-expect-error — string output doesn't match boolean input
    pipe(
      map((x: number) => String(x)),
      filter((x: boolean) => x),
    );
  });

  it("pipe rejects mismatch at position 3", () => {
    pipe(
      map((x: number) => String(x)),
      filter((s: string) => s.length > 0),
      map((s: string) => s.length),
      // @ts-expect-error — number output doesn't match string input at position 3
      filter((s: string) => s.length > 0),
    );
  });

  it("pipe rejects mismatch at position 9 in a 10-element chain", () => {
    pipe(
      map((x: number) => String(x)),
      filter((s: string) => s.length > 0),
      map((s: string) => s.length),
      filter((x: number) => x > 0),
      map((x: number) => x > 0),
      map((x: boolean): number => (x ? 1 : 0)),
      filter((x: number) => x > 0),
      map((x: number) => String(x)),
      drop(1),
      // @ts-expect-error — string output doesn't match boolean input at position 9
      filter((x: boolean) => x),
    );
  });
});

describe("transduce accepts StepFn reducers", () => {
  it("StepFn with reduced early termination", () => {
    const step: StepFn<number, number> = (acc, input) =>
      input > 2 ? reduced(acc) : acc + input;
    expectTypeOf(
      transduce(
        map((x: number) => x),
        step,
        0,
        [1, 2, 3],
      ),
    ).toEqualTypeOf<number>();
  });
});

describe("toFn type inference", () => {
  it("toFn infers data-last function type", () => {
    const run = toFn(map((x: number) => String(x)));
    expectTypeOf(run).toEqualTypeOf<(coll: Iterable<number>) => string[]>();
  });
});
```

- [ ] **Step 2: Run type tests to verify they fail**

Run: `yarn vitest run --typecheck src/index.test-d.ts`
Expected: Multiple failures on forward inference tests (the `map((x) => ...)` callbacks will be `unknown` with current pipe), and failures on `PreservingTransducer` tests (type doesn't exist yet in barrel).

- [ ] **Step 3: Rewrite `src/pipe/index.ts` with 21 overloads**

Replace the entire file:

```ts
import type { Transducer } from "../types/index.js";

// 21 overloads: each chains generic parameters so TypeScript infers forward.
// Type params A through V represent the 22 type positions for up to 21 transducers.

export function pipe<A, B>(t1: Transducer<A, B>): Transducer<A, B>;
export function pipe<A, B, C>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
): Transducer<A, C>;
export function pipe<A, B, C, D>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
): Transducer<A, D>;
export function pipe<A, B, C, D, E>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
): Transducer<A, E>;
export function pipe<A, B, C, D, E, F>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
): Transducer<A, F>;
export function pipe<A, B, C, D, E, F, G>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
): Transducer<A, G>;
export function pipe<A, B, C, D, E, F, G, H>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
): Transducer<A, H>;
export function pipe<A, B, C, D, E, F, G, H, I>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
): Transducer<A, I>;
export function pipe<A, B, C, D, E, F, G, H, I, J>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
): Transducer<A, J>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
): Transducer<A, K>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
): Transducer<A, L>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
): Transducer<A, M>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
  t13: Transducer<M, N>,
): Transducer<A, N>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
  t13: Transducer<M, N>,
  t14: Transducer<N, O>,
): Transducer<A, O>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
  t13: Transducer<M, N>,
  t14: Transducer<N, O>,
  t15: Transducer<O, P>,
): Transducer<A, P>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
  t13: Transducer<M, N>,
  t14: Transducer<N, O>,
  t15: Transducer<O, P>,
  t16: Transducer<P, Q>,
): Transducer<A, Q>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, S>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
  t13: Transducer<M, N>,
  t14: Transducer<N, O>,
  t15: Transducer<O, P>,
  t16: Transducer<P, Q>,
  t17: Transducer<Q, S>,
): Transducer<A, S>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, S, T>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
  t13: Transducer<M, N>,
  t14: Transducer<N, O>,
  t15: Transducer<O, P>,
  t16: Transducer<P, Q>,
  t17: Transducer<Q, S>,
  t18: Transducer<S, T>,
): Transducer<A, T>;
export function pipe<
  A,
  B,
  C,
  D,
  E,
  F,
  G,
  H,
  I,
  J,
  K,
  L,
  M,
  N,
  O,
  P,
  Q,
  S,
  T,
  U,
>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
  t13: Transducer<M, N>,
  t14: Transducer<N, O>,
  t15: Transducer<O, P>,
  t16: Transducer<P, Q>,
  t17: Transducer<Q, S>,
  t18: Transducer<S, T>,
  t19: Transducer<T, U>,
): Transducer<A, U>;
export function pipe<
  A,
  B,
  C,
  D,
  E,
  F,
  G,
  H,
  I,
  J,
  K,
  L,
  M,
  N,
  O,
  P,
  Q,
  S,
  T,
  U,
  V,
>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
  t13: Transducer<M, N>,
  t14: Transducer<N, O>,
  t15: Transducer<O, P>,
  t16: Transducer<P, Q>,
  t17: Transducer<Q, S>,
  t18: Transducer<S, T>,
  t19: Transducer<T, U>,
  t20: Transducer<U, V>,
): Transducer<A, V>;
export function pipe<
  A,
  B,
  C,
  D,
  E,
  F,
  G,
  H,
  I,
  J,
  K,
  L,
  M,
  N,
  O,
  P,
  Q,
  S,
  T,
  U,
  V,
  W,
>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
  t13: Transducer<M, N>,
  t14: Transducer<N, O>,
  t15: Transducer<O, P>,
  t16: Transducer<P, Q>,
  t17: Transducer<Q, S>,
  t18: Transducer<S, T>,
  t19: Transducer<T, U>,
  t20: Transducer<U, V>,
  t21: Transducer<V, W>,
): Transducer<A, W>;
// Variadic fallback for 22+ transducers (loses forward inference)
export function pipe(...xforms: Transducer<any, any>[]): Transducer<any, any>;
export function pipe(...xforms: Transducer<any, any>[]): Transducer<any, any> {
  return (rf) => xforms.reduceRight((acc, xf) => xf(acc), rf);
}
```

- [ ] **Step 4: Run typecheck**

Run: `yarn typecheck`
Expected: PASS for pipe overloads. Type tests will still fail on PreservingTransducer (take/drop not updated yet).

- [ ] **Step 5: Run runtime tests to verify no regressions**

Run: `yarn test`
Expected: All existing runtime tests pass (runtime unchanged).

- [ ] **Step 6: Commit**

```bash
git add src/pipe/index.ts
git commit -m "feat(pipe): replace BuildConstraint with 21 overloads for forward inference"
```

---

### Task 3: Make `take` dual-callable with `PreservingTransducer`

**Files:**

- Modify: `src/take/index.ts`
- Modify: `src/take/index.test.ts`

- [ ] **Step 1: Write failing standalone unit tests**

Append to `src/take/index.test.ts` inside the `describe("take", ...)` block, after the last `it(...)`:

```ts
describe("standalone callable", () => {
  it("takes first n from array", () => {
    expect(take(3)([1, 2, 3, 4, 5])).toEqual([1, 2, 3]);
  });

  it("takes from Set (any Iterable)", () => {
    const result = take(2)(new Set([10, 20, 30]));
    expect(result).toEqual([10, 20]);
  });

  it("takes from generator", () => {
    function* nums(): Generator<number> {
      yield 1;
      yield 2;
      yield 3;
      yield 4;
    }
    expect(take(2)(nums())).toEqual([1, 2]);
  });

  it("n > length returns all elements", () => {
    expect(take(10)([1, 2])).toEqual([1, 2]);
  });

  it("n = 0 returns empty", () => {
    expect(take(0)([1, 2, 3])).toEqual([]);
  });

  it("negative n returns empty", () => {
    expect(take(-5)([1, 2, 3])).toEqual([]);
  });

  it("empty collection returns empty", () => {
    expect(take(3)([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify standalone tests fail**

Run: `yarn vitest run src/take/index.test.ts`
Expected: New standalone tests FAIL (take(3) returns a function, not an array)

- [ ] **Step 3: Implement dual-callable `take`**

Replace `src/take/index.ts`:

```ts
import type { PreservingTransducer } from "../types/index.js";
import type { Reduced, StepFn } from "../types/index.js";
import { isReduced, reduced } from "../types/index.js";

/**
 * Returns a transducer that takes the first `n` elements, then terminates early.
 * Negative values of `n` are treated as `0` (Clojure semantics).
 *
 * Dual-callable: use as a transducer in pipe/sequence, or call directly on an iterable.
 *
 * @param n - Number of elements to take. Negative values are clamped to 0.
 * @returns A PreservingTransducer — use as a transducer or call directly on an iterable.
 *
 * @example
 * sequence(take(3), [1, 2, 3, 4, 5]);
 * // => [1, 2, 3]
 *
 * @example
 * take(3)([1, 2, 3, 4, 5]);
 * // => [1, 2, 3]
 */
export function take(n: number): PreservingTransducer {
  const limit = Math.max(0, n);
  function impl(rfOrColl: unknown): unknown {
    if (typeof rfOrColl === "function") {
      const rf = rfOrColl as StepFn<unknown, unknown>;
      let taken = 0;
      return (acc: unknown, input: unknown): unknown | Reduced<unknown> => {
        if (taken < limit) {
          taken++;
          const result = rf(acc, input);
          if (taken >= limit) {
            return isReduced(result) ? result : reduced(result);
          }
          return result;
        }
        return reduced(acc);
      };
    }
    const coll = rfOrColl as Iterable<unknown>;
    const result: unknown[] = [];
    for (const x of coll) {
      if (result.length >= limit) break;
      result.push(x);
    }
    return result;
  }
  return impl as PreservingTransducer;
}
```

- [ ] **Step 4: Fix the existing test that uses `take<number>`**

In `src/take/index.test.ts`, find the two lines using explicit type parameters and remove them:

Change `take<number>(2)` on line 55 to `take(2)`.
Change `pipe(take<number>(2), take<number>(2))` on line 81 to `pipe(take(2), take(2))`.

- [ ] **Step 5: Run all take tests**

Run: `yarn vitest run src/take/index.test.ts`
Expected: All tests PASS (existing transducer tests + new standalone tests).

- [ ] **Step 6: Commit**

```bash
git add src/take/index.ts src/take/index.test.ts
git commit -m "feat(take): dual-callable PreservingTransducer with standalone iterable support"
```

---

### Task 4: Make `drop` dual-callable with `PreservingTransducer`

**Files:**

- Modify: `src/drop/index.ts`
- Modify: `src/drop/index.test.ts`

- [ ] **Step 1: Write failing standalone unit tests**

Append to `src/drop/index.test.ts` inside the `describe("drop", ...)` block, after the last `it(...)`:

```ts
describe("standalone callable", () => {
  it("drops first n from array", () => {
    expect(drop(2)([1, 2, 3, 4, 5])).toEqual([3, 4, 5]);
  });

  it("drops from Set (any Iterable)", () => {
    const result = drop(1)(new Set([10, 20, 30]));
    expect(result).toEqual([20, 30]);
  });

  it("drops from generator", () => {
    function* nums(): Generator<number> {
      yield 1;
      yield 2;
      yield 3;
      yield 4;
    }
    expect(drop(2)(nums())).toEqual([3, 4]);
  });

  it("n > length returns empty", () => {
    expect(drop(10)([1, 2])).toEqual([]);
  });

  it("n = 0 returns all elements", () => {
    expect(drop(0)([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("negative n returns all elements", () => {
    expect(drop(-5)([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("empty collection returns empty", () => {
    expect(drop(3)([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify standalone tests fail**

Run: `yarn vitest run src/drop/index.test.ts`
Expected: New standalone tests FAIL.

- [ ] **Step 3: Implement dual-callable `drop`**

Replace `src/drop/index.ts`:

```ts
import type { PreservingTransducer } from "../types/index.js";
import type { Reduced, StepFn } from "../types/index.js";

/**
 * Returns a transducer that skips the first `n` elements.
 * Negative values of `n` are treated as `0` (Clojure semantics).
 *
 * Dual-callable: use as a transducer in pipe/sequence, or call directly on an iterable.
 *
 * @param n - Number of elements to skip. Negative values are clamped to 0.
 * @returns A PreservingTransducer — use as a transducer or call directly on an iterable.
 *
 * @example
 * sequence(drop(2), [1, 2, 3, 4, 5]);
 * // => [3, 4, 5]
 *
 * @example
 * drop(2)([1, 2, 3, 4, 5]);
 * // => [3, 4, 5]
 */
export function drop(n: number): PreservingTransducer {
  const limit = Math.max(0, n);
  function impl(rfOrColl: unknown): unknown {
    if (typeof rfOrColl === "function") {
      const rf = rfOrColl as StepFn<unknown, unknown>;
      let dropped = 0;
      return (acc: unknown, input: unknown): unknown | Reduced<unknown> => {
        if (dropped < limit) {
          dropped++;
          return acc;
        }
        return rf(acc, input);
      };
    }
    const coll = rfOrColl as Iterable<unknown>;
    const result: unknown[] = [];
    let skipped = 0;
    for (const x of coll) {
      if (skipped < limit) {
        skipped++;
        continue;
      }
      result.push(x);
    }
    return result;
  }
  return impl as PreservingTransducer;
}
```

- [ ] **Step 4: Fix the existing test that uses `drop<number>`**

In `src/drop/index.test.ts` — check for any `drop<number>` or `drop<string>` usages and remove type params. Currently there are none in this file.

- [ ] **Step 5: Run all drop tests**

Run: `yarn vitest run src/drop/index.test.ts`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/drop/index.ts src/drop/index.test.ts
git commit -m "feat(drop): dual-callable PreservingTransducer with standalone iterable support"
```

---

### Task 5: Add `PreservingTransducer` overloads to consumers

**Files:**

- Modify: `src/sequence/index.ts`
- Modify: `src/into/index.ts`
- Modify: `src/transduce/index.ts`
- Modify: `src/toFn/index.ts`

- [ ] **Step 1: Add overload to `sequence`**

Replace `src/sequence/index.ts`:

```ts
import type { PreservingTransducer, Transducer } from "../types/index.js";
import { into } from "../into/index.js";

/**
 * Eagerly apply a transducer to a collection and return a new array.
 * The most common way to execute a transducer.
 */
export function sequence<A>(
  xform: PreservingTransducer,
  coll: Iterable<A>,
): A[];
export function sequence<A, B>(xform: Transducer<A, B>, coll: Iterable<A>): B[];
export function sequence(
  xform: Transducer<any, any>,
  coll: Iterable<any>,
): any[] {
  return into([], xform, coll);
}
```

- [ ] **Step 2: Add overload to `into`**

Replace `src/into/index.ts`:

```ts
import type { PreservingTransducer, Transducer } from "../types/index.js";
import { transduce } from "../transduce/index.js";

/**
 * Transduce `from` into a target array.
 * Returns the same array reference with elements appended.
 */
export function into<A>(
  to: A[],
  xform: PreservingTransducer,
  from: Iterable<A>,
): A[];
export function into<A, B>(
  to: B[],
  xform: Transducer<A, B>,
  from: Iterable<A>,
): B[];
export function into(
  to: any[],
  xform: Transducer<any, any>,
  from: Iterable<any>,
): any[] {
  return transduce(
    xform,
    (acc: any[], x: any) => {
      acc.push(x);
      return acc;
    },
    to,
    from,
  );
}
```

- [ ] **Step 3: Add overloads to `transduce`**

In `src/transduce/index.ts`, add PreservingTransducer overloads before the existing ones. Replace the file:

```ts
import type {
  PreservingTransducer,
  Reducer,
  StepFn,
  Transducer,
} from "../types/index.js";
import { isReduced } from "../types/index.js";

/**
 * Apply a transducer to a collection with a reducing function and initial value.
 * Use this when the result type is not an array.
 */
export function transduce<A, R>(
  xform: PreservingTransducer,
  rf: Reducer<R, A>,
  init: R,
  coll: Iterable<A>,
): R;
export function transduce<A, R>(
  xform: PreservingTransducer,
  rf: StepFn<R, A>,
  init: R,
  coll: Iterable<A>,
): R;
export function transduce<A, B, R>(
  xform: Transducer<A, B>,
  rf: Reducer<R, B>,
  init: R,
  coll: Iterable<A>,
): R;
export function transduce<A, B, R>(
  xform: Transducer<A, B>,
  rf: StepFn<R, B>,
  init: R,
  coll: Iterable<A>,
): R;
export function transduce(
  xform: Transducer<any, any>,
  rf: Reducer<any, any> | StepFn<any, any>,
  init: any,
  coll: Iterable<any>,
): any {
  return transduceStep(xform, rf, init, coll);
}

function transduceStep<A, B, R>(
  xform: Transducer<A, B>,
  rf: Reducer<R, B> | StepFn<R, B>,
  init: R,
  coll: Iterable<A>,
): R {
  const stepRf: StepFn<R, B> = (acc: R, input: B) => rf(acc, input);
  const xrf = xform(stepRf);
  let acc: R = init;
  for (const item of coll) {
    const stepResult = xrf(acc, item);
    if (isReduced(stepResult)) {
      return stepResult.value;
    }
    acc = stepResult;
  }
  return acc;
}
```

- [ ] **Step 4: Add overload to `toFn`**

Replace `src/toFn/index.ts`:

```ts
import type { PreservingTransducer, Transducer } from "../types/index.js";
import { sequence } from "../sequence/index.js";

/**
 * Wrap a transducer into a data-last function.
 * Useful as a pipeline stage in any left-to-right function composition utility.
 */
export function toFn(
  xform: PreservingTransducer,
): (coll: Iterable<unknown>) => unknown[];
export function toFn<A, B>(xform: Transducer<A, B>): (coll: Iterable<A>) => B[];
export function toFn(
  xform: Transducer<any, any>,
): (coll: Iterable<any>) => any[] {
  return (coll: Iterable<any>): any[] => sequence(xform, coll);
}
```

- [ ] **Step 5: Run typecheck**

Run: `yarn typecheck`
Expected: PASS

- [ ] **Step 6: Run all tests**

Run: `yarn test`
Expected: All runtime tests pass. Some type-level tests may still fail if take/drop tests reference old patterns.

- [ ] **Step 7: Commit**

```bash
git add src/sequence/index.ts src/into/index.ts src/transduce/index.ts src/toFn/index.ts
git commit -m "feat: add PreservingTransducer overloads to sequence, into, transduce, toFn"
```

---

### Task 6: Update remaining tests and fix references

**Files:**

- Modify: `src/index.test.ts` (fix `take<number>` / `drop<string>` references)
- Modify: `src/toFn/index.test.ts` (fix `take<number>` / `drop<number>` references)
- Already written: `src/index.test-d.ts` (from Task 2 Step 1)

- [ ] **Step 1: Fix explicit type params in `src/index.test.ts`**

In `src/index.test.ts`, make these changes:

Line 105: Change `drop<number>(-5)` to `drop(-5)`.

No other `take<T>` or `drop<T>` usages exist in this file.

- [ ] **Step 2: Fix explicit type params in `src/toFn/index.test.ts`**

In `src/toFn/index.test.ts`, make these changes:

Line 32: Change `toFn(take<number>(2))` to `toFn(take(2))`.
Line 42: Change `toFn(take<number>(0))` to `toFn(take(0))`.
Line 47: Change `toFn(drop<number>(2))` to `toFn(drop(2))`.

- [ ] **Step 3: Run all tests including type checks**

Run: `yarn test`
Expected: All runtime tests PASS.

Run: `yarn vitest run --typecheck src/index.test-d.ts`
Expected: All type-level tests PASS.

- [ ] **Step 4: Run full check suite**

Run: `yarn check`
Expected: typecheck + lint + format all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/index.test.ts src/toFn/index.test.ts src/index.test-d.ts
git commit -m "test: rewrite type-level tests for forward inference and update type param references"
```

---

### Task 7: Final verification

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `yarn test`
Expected: All tests PASS.

- [ ] **Step 2: Run full check suite**

Run: `yarn check`
Expected: typecheck + lint + fmt:check all PASS.

- [ ] **Step 3: Verify the issue #5 reproduction case compiles**

Create a temporary file and typecheck it (do not commit):

```ts
// /tmp/issue5-repro.ts
import { pipe, filter, map, transduce } from "./src/index.js";

interface Lap {
  excluded: boolean;
  fuelUsedLiters: number;
}

const laps: readonly Lap[] = [
  { excluded: false, fuelUsedLiters: 2.0 },
  { excluded: true, fuelUsedLiters: 5.0 },
];

const sum = transduce(
  pipe(
    filter((l: Lap) => !l.excluded),
    map((l) => l.fuelUsedLiters), // Should compile without annotation
  ),
  (acc: number, x: number) => acc + x,
  0,
  laps,
);
```

Run: `yarn tsc --noEmit /tmp/issue5-repro.ts` (or verify via the type-level test that covers this exact case)
Expected: No errors.

- [ ] **Step 4: Clean up**

Remove any temporary files. Verify `git status` is clean.
