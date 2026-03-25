import type { Reduced, StepFn, Transducer } from "../types/index.js";

/**
 * Returns a transducer that keeps only elements satisfying `pred`.
 *
 * @param pred - Predicate function; elements for which it returns true are kept.
 * @returns A transducer that filters elements of type A.
 *
 * @example
 * sequence(filter((x: number) => x % 2 === 0), [1, 2, 3, 4, 5]);
 * // => [2, 4]
 *
 * @example
 * sequence(filter((s: string) => s.length > 3), ["hi", "hello", "hey"]);
 * // => ["hello"]
 */
export function filter<A>(pred: (a: A) => boolean): Transducer<A, A> {
  return <R>(rf: StepFn<R, A>): StepFn<R, A> =>
    (acc: R, input: A): R | Reduced<R> =>
      pred(input) ? rf(acc, input) : acc;
}
