import type { Reduced, StepFn, Transducer } from "../types/index.ts";
import { isReduced, reduced } from "../types/index.ts";

/**
 * Returns a transducer that takes the first `n` elements, then terminates early.
 */
export function take<A>(n: number): Transducer<A, A> {
  return <R>(rf: StepFn<R, A>): StepFn<R, A> => {
    let taken = 0;
    return (acc: R, input: A): R | Reduced<R> => {
      if (taken < n) {
        taken++;
        const result = rf(acc, input);
        if (taken >= n) {
          return isReduced(result) ? result : reduced(result);
        }
        return result;
      }
      return reduced(acc);
    };
  };
}
