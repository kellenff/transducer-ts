import type { Transducer } from "../types/index.js";

/**
 * Compose transducers left-to-right with full type inference at any arity.
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

// 21 overloads: each chains generic parameters so TypeScript infers forward.
// Type params A through W represent the 22 type positions for up to 21 transducers.

export function pipe<A, B>(t1: Transducer<A, B>): Transducer<A, B>;
export function pipe<A, B, C>(t1: Transducer<A, B>, t2: Transducer<B, C>): Transducer<A, C>;
export function pipe<A, B, C, D>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
): Transducer<A, D>;
export function pipe<A, B, C, D, E>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
): Transducer<A, E>;
export function pipe<A, B, C, D, E, F>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
): Transducer<A, F>;
export function pipe<A, B, C, D, E, F, G>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
): Transducer<A, G>;
export function pipe<A, B, C, D, E, F, G, H>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
): Transducer<A, H>;
export function pipe<A, B, C, D, E, F, G, H, I>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
): Transducer<A, I>;
export function pipe<A, B, C, D, E, F, G, H, I, J>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
): Transducer<A, J>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
): Transducer<A, K>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
): Transducer<A, L>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
): Transducer<A, M>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
  t13: Transducer<M, N>,
): Transducer<A, N>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
  t13: Transducer<M, N>,
  t14: Transducer<N, O>,
): Transducer<A, O>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
  t13: Transducer<M, N>,
  t14: Transducer<N, O>,
  t15: Transducer<O, P>,
): Transducer<A, P>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
  t13: Transducer<M, N>,
  t14: Transducer<N, O>,
  t15: Transducer<O, P>,
  t16: Transducer<P, Q>,
): Transducer<A, Q>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, S>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
  t13: Transducer<M, N>,
  t14: Transducer<N, O>,
  t15: Transducer<O, P>,
  t16: Transducer<P, Q>,
  t17: Transducer<Q, S>,
): Transducer<A, S>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, S, T>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
  t13: Transducer<M, N>,
  t14: Transducer<N, O>,
  t15: Transducer<O, P>,
  t16: Transducer<P, Q>,
  t17: Transducer<Q, S>,
  t18: Transducer<S, T>,
): Transducer<A, T>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, S, T, U>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
  t13: Transducer<M, N>,
  t14: Transducer<N, O>,
  t15: Transducer<O, P>,
  t16: Transducer<P, Q>,
  t17: Transducer<Q, S>,
  t18: Transducer<S, T>,
  t19: Transducer<T, U>,
): Transducer<A, U>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, S, T, U, V>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
  t13: Transducer<M, N>,
  t14: Transducer<N, O>,
  t15: Transducer<O, P>,
  t16: Transducer<P, Q>,
  t17: Transducer<Q, S>,
  t18: Transducer<S, T>,
  t19: Transducer<T, U>,
  t20: Transducer<U, V>,
): Transducer<A, V>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, S, T, U, V, W>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>,
  t3: Transducer<C, D>,
  t4: Transducer<D, E>,
  t5: Transducer<E, F>,
  t6: Transducer<F, G>,
  t7: Transducer<G, H>,
  t8: Transducer<H, I>,
  t9: Transducer<I, J>,
  t10: Transducer<J, K>,
  t11: Transducer<K, L>,
  t12: Transducer<L, M>,
  t13: Transducer<M, N>,
  t14: Transducer<N, O>,
  t15: Transducer<O, P>,
  t16: Transducer<P, Q>,
  t17: Transducer<Q, S>,
  t18: Transducer<S, T>,
  t19: Transducer<T, U>,
  t20: Transducer<U, V>,
  t21: Transducer<V, W>,
): Transducer<A, W>;
export function pipe(...xforms: Transducer<any, any>[]): Transducer<any, any> {
  return (rf) => xforms.reduceRight((acc, xf) => xf(acc), rf);
}
