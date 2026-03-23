import type { Reducer, StepFn, Transducer } from "../types/index.ts";
import { isReduced } from "../types/index.ts";

/**
 * Apply a transducer to a collection with a reducing function and initial value.
 */
export function transduce<A, B, R>(
  xform: Transducer<A, B>,
  rf: Reducer<R, B>,
  init: R,
  coll: Iterable<A>,
): R {
  const xrf = xform(rf as StepFn<R, B>);
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
