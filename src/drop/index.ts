import type { Reduced, StepFn, Transducer } from "../types/index.ts";

/**
 * Returns a transducer that skips the first `n` elements.
 * Negative values of `n` are treated as `0` (Clojure semantics).
 */
export function drop<A>(n: number): Transducer<A, A> {
  const limit = Math.max(0, n);
  return <R>(rf: StepFn<R, A>): StepFn<R, A> => {
    let dropped = 0;
    return (acc: R, input: A): R | Reduced<R> => {
      if (dropped < limit) {
        dropped++;
        return acc;
      }
      return rf(acc, input);
    };
  };
}
