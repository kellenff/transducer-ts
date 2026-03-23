import type { Reduced, StepFn, Transducer } from "../types/index.ts";

/**
 * Returns a transducer that applies `f` to each element.
 */
export function map<A, B>(f: (a: A) => B): Transducer<A, B> {
  return <R>(rf: StepFn<R, B>): StepFn<R, A> =>
    (acc: R, input: A): R | Reduced<R> =>
      rf(acc, f(input));
}
