import type { Transducer } from "../types/index.ts";

/**
 * Compose transducers left-to-right. Input is processed by the first transducer,
 * then the second, and so on. Up to 5-arity with full type inference.
 *
 * @returns A new transducer representing the composition.
 *
 * @example
 * const xform = pipe(
 *   filter((x: number) => x > 2),
 *   map((x: number) => x * 10),
 *   take(3),
 * );
 * sequence(xform, [1, 2, 3, 4, 5, 6]);
 * // => [30, 40, 50]
 */
export function pipe<A, B>(a: Transducer<A, B>): Transducer<A, B>;
export function pipe<A, B, C>(a: Transducer<A, B>, b: Transducer<B, C>): Transducer<A, C>;
export function pipe<A, B, C, D>(
  a: Transducer<A, B>,
  b: Transducer<B, C>,
  c: Transducer<C, D>,
): Transducer<A, D>;
export function pipe<A, B, C, D, E>(
  a: Transducer<A, B>,
  b: Transducer<B, C>,
  c: Transducer<C, D>,
  d: Transducer<D, E>,
): Transducer<A, E>;
export function pipe<A, B, C, D, E, F>(
  a: Transducer<A, B>,
  b: Transducer<B, C>,
  c: Transducer<C, D>,
  d: Transducer<D, E>,
  e: Transducer<E, F>,
): Transducer<A, F>;
export function pipe(...xforms: Transducer<unknown, unknown>[]): Transducer<unknown, unknown> {
  return (rf) => xforms.reduceRight((acc, xf) => xf(acc), rf);
}
