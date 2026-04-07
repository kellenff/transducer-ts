import type { PreservingTransducer, Transducer } from "../types/index.js";
import { sequence } from "../sequence/index.js";

/**
 * Wrap a transducer into a data-last function `(coll: Iterable<A>) => B[]`.
 * Useful as a pipeline stage in any left-to-right function composition utility.
 *
 * @param xform - The transducer to wrap.
 * @returns A function that accepts an iterable and returns a new array of transduced elements.
 *
 * @example
 * const doubles = toFn(map((x: number) => x * 2));
 * doubles([1, 2, 3]);
 * // => [2, 4, 6]
 *
 * @example
 * const processNumbers = toFn(pipe(
 *   filter((x: number) => x % 2 === 0),
 *   map((x: number) => x * 10),
 *   take(2),
 * ));
 * processNumbers([1, 2, 3, 4, 5, 6]);
 * // => [20, 40]
 */
export function toFn(xform: PreservingTransducer): (coll: Iterable<unknown>) => unknown[];
export function toFn<A, B>(xform: Transducer<A, B>): (coll: Iterable<A>) => B[];
export function toFn(xform: Transducer<any, any>): (coll: Iterable<any>) => any[] {
  return (coll: Iterable<any>): any[] => sequence(xform, coll);
}
