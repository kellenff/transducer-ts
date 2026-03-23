import type { Transducer } from "../types/index.ts";

type PipeTypeError<Msg extends string> = {
  readonly __brand: "PipeTypeError";
  readonly message: Msg;
};

type TransducerInput<T> = T extends Transducer<infer A, any> ? A : never;
type TransducerOutput<T> = T extends Transducer<any, infer B> ? B : never;

// Maps numeric index I to its predecessor I-1; PrevIdx<0> = never (no predecessor).
type PrevIdx<I extends number> = [
  never,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
][I];

// For each tuple position K > 0, checks that the previous transducer's output type
// matches the current transducer's input type. Returns a branded PipeTypeError on mismatch.
type BuildConstraint<T extends readonly Transducer<any, any>[]> = {
  [K in keyof T]: K extends `${infer I extends number}`
    ? K extends "0"
      ? T[K]
      : PrevIdx<I> extends keyof T
        ? TransducerOutput<T[PrevIdx<I>]> extends TransducerInput<T[K]>
          ? T[K]
          : PipeTypeError<`Argument at position ${K}: output of previous transducer does not match input of this transducer`>
        : T[K]
    : T[K];
};

type LastOf<T extends readonly any[]> = T extends readonly [...any[], infer L] ? L : never;

// Extracts Transducer<InputOfFirst, OutputOfLast> from a validated tuple.
type PipeResult<T extends readonly Transducer<any, any>[]> = T extends readonly [
  Transducer<infer A, any>,
  ...any[],
]
  ? Transducer<A, TransducerOutput<LastOf<T>>>
  : never;

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
export function pipe<const T extends readonly Transducer<any, any>[]>(
  ...xforms: BuildConstraint<T> extends T ? T : BuildConstraint<T>
): PipeResult<T>;
export function pipe(...xforms: Transducer<any, any>[]): Transducer<any, any> {
  return (rf) => xforms.reduceRight((acc, xf) => xf(acc), rf);
}
