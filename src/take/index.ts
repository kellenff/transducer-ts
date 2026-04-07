import type { PreservingTransducer, Reduced, StepFn } from "../types/index.js";
import { preservingTransducerKey } from "../types/index.js";
import { isReduced, reduced } from "../types/index.js";

/**
 * Returns a transducer that takes the first `n` elements, then terminates early.
 * Negative values of `n` are treated as `0` (Clojure semantics).
 *
 * Dual-callable: use as a transducer in pipe/sequence, or call directly on an iterable.
 *
 * @param n - Number of elements to take. Negative values are clamped to 0.
 * @returns A PreservingTransducer — use as a transducer or call directly on an iterable.
 *
 * @example
 * sequence(take(3), [1, 2, 3, 4, 5]);
 * // => [1, 2, 3]
 *
 * @example
 * take(3)([1, 2, 3, 4, 5]);
 * // => [1, 2, 3]
 */
export function take(n: number): PreservingTransducer {
  const limit = Math.max(0, n);
  function impl(rfOrColl: unknown): unknown {
    if (typeof rfOrColl === "function") {
      const rf = rfOrColl as StepFn<unknown, unknown>;
      let taken = 0;
      return (acc: unknown, input: unknown): unknown | Reduced<unknown> => {
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
    }
    const coll = rfOrColl as Iterable<unknown>;
    const result: unknown[] = [];
    for (const x of coll) {
      if (result.length >= limit) break;
      result.push(x);
    }
    return result;
  }
  Object.assign(impl, { [preservingTransducerKey]: true as const });
  return impl as PreservingTransducer;
}
