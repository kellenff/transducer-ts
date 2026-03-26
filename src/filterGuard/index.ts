import type { Reduced, StepFn, Transducer } from "../types/index.js";

/**
 * Returns a narrowing transducer that keeps only elements matching a type guard.
 *
 * @param pred - Type guard predicate; elements for which it returns true are kept and narrowed.
 * @returns A transducer from A to narrowed subtype B.
 *
 * @example
 * const isString = (x: string | number): x is string => typeof x === "string";
 * sequence(filterGuard(isString), [1, "a", 2, "b"]);
 * // => ["a", "b"]
 */
export function filterGuard<A, B extends A>(pred: (a: A) => a is B): Transducer<A, B> {
  return <R>(rf: StepFn<R, B>): StepFn<R, A> =>
    (acc: R, input: A): R | Reduced<R> =>
      pred(input) ? rf(acc, input) : acc;
}
