import type { PreservingTransducer, Reduced, StepFn } from "../types/index.js";
import { preservingTransducerKey } from "../types/index.js";

/**
 * Returns a transducer that skips the first `n` elements.
 * Negative values of `n` are treated as `0` (Clojure semantics).
 *
 * Dual-callable: use as a transducer in pipe/sequence, or call directly on an iterable.
 *
 * @param n - Number of elements to skip. Negative values are clamped to 0.
 * @returns A PreservingTransducer — use as a transducer or call directly on an iterable.
 *
 * @example
 * sequence(drop(2), [1, 2, 3, 4, 5]);
 * // => [3, 4, 5]
 *
 * @example
 * drop(2)([1, 2, 3, 4, 5]);
 * // => [3, 4, 5]
 */
export function drop(n: number): PreservingTransducer {
  const limit = Math.max(0, n);
  function impl(rfOrColl: unknown): unknown {
    if (typeof rfOrColl === "function") {
      const rf = rfOrColl as StepFn<unknown, unknown>;
      let dropped = 0;
      return (acc: unknown, input: unknown): unknown | Reduced<unknown> => {
        if (dropped < limit) {
          dropped++;
          return acc;
        }
        return rf(acc, input);
      };
    }
    const coll = rfOrColl as Iterable<unknown>;
    const result: unknown[] = [];
    let skipped = 0;
    for (const x of coll) {
      if (skipped < limit) {
        skipped++;
        continue;
      }
      result.push(x);
    }
    return result;
  }
  Object.assign(impl, { [preservingTransducerKey]: true as const });
  return impl as PreservingTransducer;
}
