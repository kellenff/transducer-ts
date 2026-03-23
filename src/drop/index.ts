import type { Reduced, StepFn, Transducer } from "../types/index.ts";

/**
 * Returns a transducer that skips the first `n` elements.
 */
export function drop<A>(n: number): Transducer<A, A> {
  return <R>(rf: StepFn<R, A>): StepFn<R, A> => {
    let dropped = 0;
    return (acc: R, input: A): R | Reduced<R> => {
      if (dropped < n) {
        dropped++;
        return acc;
      }
      return rf(acc, input);
    };
  };
}
