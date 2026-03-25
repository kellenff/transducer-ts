import type { Transducer } from "../types/index.js";
import { transduce } from "../transduce/index.js";

/**
 * Transduce `from` into a target array.
 * Returns the same array reference with elements appended.
 *
 * @param to - Target array to append results into.
 * @param xform - The transducer to apply.
 * @param from - The input iterable.
 * @returns The `to` array with transduced elements appended.
 *
 * @example
 * into([], map((x: number) => x * 2), [1, 2, 3]);
 * // => [2, 4, 6]
 *
 * @example
 * // Append to existing array
 * const result: number[] = [0];
 * into(result, filter((x: number) => x > 2), [1, 2, 3, 4]);
 * // result === [0, 3, 4]
 */
export function into<A, B>(to: B[], xform: Transducer<A, B>, from: Iterable<A>): B[] {
  return transduce(
    xform,
    (acc: B[], x: B) => {
      acc.push(x);
      return acc;
    },
    to,
    from,
  );
}
