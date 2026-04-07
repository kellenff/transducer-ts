import type { Transducer } from "../types/index.js";
import { transduce } from "../transduce/index.js";

/**
 * Eagerly apply a transducer to a collection and return a new array.
 * The most common way to execute a transducer.
 *
 * @param xform - The transducer to apply.
 * @param coll - The input iterable.
 * @returns A new array containing the transduced elements.
 *
 * @example
 * sequence(map((x: number) => x * 2), [1, 2, 3]);
 * // => [2, 4, 6]
 *
 * @example
 * const xform = pipe(
 *   filter((x: number) => x % 2 === 0),
 *   map((x: number) => x * 3),
 *   take(2),
 * );
 * sequence(xform, [1, 2, 3, 4, 5, 6]);
 * // => [6, 12]
 */
export function sequence<A, B>(xform: Transducer<A, B>, coll: Iterable<A>): B[];
export function sequence(xform: Transducer<any, any>, coll: Iterable<any>): any[] {
  const out: any[] = [];
  return transduce(
    xform,
    (acc: any[], x: any) => {
      acc.push(x);
      return acc;
    },
    out,
    coll,
  );
}
