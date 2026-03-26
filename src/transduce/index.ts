import type { Reducer, StepFn, Transducer } from "../types/index.js";
import { isReduced } from "../types/index.js";

/**
 * Apply a transducer to a collection with a reducing function and initial value.
 * Use this when the result type is not an array.
 *
 * @param xform - The transducer to apply.
 * @param rf - The reducing function that accumulates results.
 * @param init - The initial accumulator value.
 * @param coll - The input iterable.
 * @returns The final accumulated value after processing all elements (or early termination).
 *
 * @example
 * // Sum even numbers
 * transduce(
 *   filter((x: number) => x % 2 === 0),
 *   (acc: number, x: number) => acc + x,
 *   0,
 *   [1, 2, 3, 4, 5, 6],
 * );
 * // => 12
 */
export function transduce<A, B, R>(
  xform: Transducer<A, B>,
  rf: Reducer<R, B>,
  init: R,
  coll: Iterable<A>,
): R;

/**
 * Apply a transducer to a collection with a step function and initial value.
 * Use this overload when your reducing function may return a Reduced sentinel.
 */
export function transduce<A, B, R>(
  xform: Transducer<A, B>,
  rf: StepFn<R, B>,
  init: R,
  coll: Iterable<A>,
): R;
export function transduce<A, B, R>(
  xform: Transducer<A, B>,
  rf: Reducer<R, B> | StepFn<R, B>,
  init: R,
  coll: Iterable<A>,
): R {
  return transduceStep(xform, rf, init, coll);
}

function transduceStep<A, B, R>(
  xform: Transducer<A, B>,
  rf: Reducer<R, B> | StepFn<R, B>,
  init: R,
  coll: Iterable<A>,
): R {
  const stepRf: StepFn<R, B> = (acc: R, input: B) => rf(acc, input);
  const xrf = xform(stepRf);
  let acc: R = init;
  for (const item of coll) {
    const stepResult = xrf(acc, item);
    if (isReduced(stepResult)) {
      return stepResult.value;
    }
    acc = stepResult;
  }
  return acc;
}
