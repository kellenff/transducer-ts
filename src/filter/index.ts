import type { Reduced, StepFn, Transducer } from "../types/index.ts";

/**
 * Returns a transducer that keeps only elements satisfying `pred`.
 */
export function filter<A>(pred: (a: A) => boolean): Transducer<A, A> {
  return <R>(rf: StepFn<R, A>): StepFn<R, A> =>
    (acc: R, input: A): R | Reduced<R> =>
      pred(input) ? rf(acc, input) : acc;
}
