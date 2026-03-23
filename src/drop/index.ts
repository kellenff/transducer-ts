import type { Reduced, StepFn, Transducer } from "../types/index.ts";

/**
 * Returns a transducer that skips the first `n` elements.
 * Negative values of `n` are treated as `0` (Clojure semantics).
 *
 * @param n - Number of elements to skip. Negative values are clamped to 0.
 * @returns A transducer that passes all elements after the first `n`.
 *
 * @example
 * sequence(drop(2), [1, 2, 3, 4, 5]);
 * // => [3, 4, 5]
 *
 * @example
 * sequence(drop(0), [1, 2, 3]);
 * // => [1, 2, 3]
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
