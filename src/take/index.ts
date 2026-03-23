import type { Reduced, StepFn, Transducer } from "../types/index.ts";
import { isReduced, reduced } from "../types/index.ts";

/**
 * Returns a transducer that takes the first `n` elements, then terminates early.
 * Negative values of `n` are treated as `0` (Clojure semantics).
 *
 * @param n - Number of elements to take. Negative values are clamped to 0.
 * @returns A transducer that takes at most `n` elements and signals early termination.
 *
 * @example
 * sequence(take(3), [1, 2, 3, 4, 5]);
 * // => [1, 2, 3]
 *
 * @example
 * // Early termination: upstream transducers stop after n elements
 * const xf = pipe(map((x: number) => x * 100), take(2));
 * sequence(xf, [1, 2, 3, 4, 5]);
 * // => [100, 200]  (elements 3, 4, 5 never touch map)
 */
export function take<A>(n: number): Transducer<A, A> {
  const limit = Math.max(0, n);
  return <R>(rf: StepFn<R, A>): StepFn<R, A> => {
    let taken = 0;
    return (acc: R, input: A): R | Reduced<R> => {
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
  };
}
