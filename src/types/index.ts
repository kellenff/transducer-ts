/**
 * A reducing function: takes an accumulator and an input, returns a new accumulator.
 */
export type Reducer<A, B> = (acc: A, input: B) => A;

/**
 * A step function: like a Reducer but may signal early termination via Reduced.
 */
export type StepFn<R, A> = (acc: R, input: A) => R | Reduced<R>;

/**
 * A transducer transforms one step function into another.
 */
export type Transducer<A, B> = <R>(rf: StepFn<R, B>) => StepFn<R, A>;

/**
 * Sentinel value wrapping a result to signal early termination.
 */
export interface Reduced<T> {
  readonly value: T;
  readonly __reduced: true;
}

export function reduced<T>(value: T): Reduced<T> {
  return { value, __reduced: true };
}

export function isReduced<T>(x: T | Reduced<T>): x is Reduced<T> {
  return x !== null && typeof x === "object" && "__reduced" in x && x.__reduced === true;
}
