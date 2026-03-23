/**
 * A reducing function: takes an accumulator and an input, returns a new accumulator.
 *
 * @example
 * const sum: Reducer<number, number> = (acc, x) => acc + x;
 */
export type Reducer<A, B> = (acc: A, input: B) => A;

/**
 * A step function: like a Reducer but may signal early termination via Reduced.
 * Used internally by transducers to propagate the Reduced sentinel.
 *
 * @example
 * const step: StepFn<number, number> = (acc, x) => x === 0 ? reduced(acc) : acc + x;
 */
export type StepFn<R, A> = (acc: R, input: A) => R | Reduced<R>;

/**
 * A transducer transforms one step function into another.
 * Transducers compose left-to-right and are agnostic to the data source.
 *
 * @example
 * const doubler: Transducer<number, number> = map(x => x * 2);
 */
export type Transducer<A, B> = <R>(rf: StepFn<R, B>) => StepFn<R, A>;

/**
 * Sentinel value wrapping a result to signal early termination.
 * Created by `reduced()`, checked by `isReduced()`.
 */
export interface Reduced<T> {
  readonly value: T;
  readonly __reduced: true;
}

/**
 * Wrap a value in a Reduced sentinel to signal early termination.
 *
 * @param value - The final accumulator value to return.
 * @returns A Reduced sentinel wrapping the value.
 *
 * @example
 * return reduced(acc); // stop processing, return acc as final result
 */
export function reduced<T>(value: T): Reduced<T> {
  return { value, __reduced: true };
}

/**
 * Type guard: returns true if x is a Reduced sentinel value.
 *
 * @param x - The value to test.
 * @returns True if x was created by `reduced()`.
 *
 * @example
 * if (isReduced(stepResult)) {
 *   return stepResult.value; // unwrap and return early
 * }
 */
export function isReduced<T>(x: T | Reduced<T>): x is Reduced<T> {
  return x !== null && typeof x === "object" && "__reduced" in x && x.__reduced === true;
}
