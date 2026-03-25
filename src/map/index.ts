import type { Reduced, StepFn, Transducer } from "../types/index.js";

/**
 * Returns a transducer that applies `f` to each element.
 *
 * @param f - The mapping function to apply to each input element.
 * @returns A transducer that transforms elements from type A to type B.
 *
 * @example
 * sequence(map((x: number) => x * 2), [1, 2, 3]);
 * // => [2, 4, 6]
 *
 * @example
 * sequence(map((x: number) => String(x)), [1, 2, 3]);
 * // => ["1", "2", "3"]
 */
export function map<A, B>(f: (a: A) => B): Transducer<A, B> {
  return <R>(rf: StepFn<R, B>): StepFn<R, A> =>
    (acc: R, input: A): R | Reduced<R> =>
      rf(acc, f(input));
}
