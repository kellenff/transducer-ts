import { describe, expect, it } from "vitest";
import * as O from "fp-ts/lib/Option.js";
import * as E from "fp-ts/lib/Either.js";
import { filter, into, map, pipe, sequence, transduce } from "../src/index.js";

// fp-ts integration with transducer-ts
//
// fp-ts provides algebraic data types — Option<A> (presence/absence) and
// Either<E, A> (success/failure). These integrate with transducer-ts in two ways:
//
// 1. As FILTER predicates: O.isSome, O.isNone, E.isRight, E.isLeft
//    These are type guards — they narrow the element type in the output array.
//
// 2. As MAP callbacks: O.getOrElse, E.getOrElse
//    These unwrap the value or substitute a fallback.
//
// Common pattern: filter to keep Some/Right values, then map to unwrap.
// This is the equivalent of fp-ts's compact() / rights() on arrays.

describe("Option: filter and unwrap patterns", () => {
  it("O.isSome keeps only present values", () => {
    const opts: Array<O.Option<number>> = [O.some(1), O.none, O.some(3), O.none, O.some(5)];
    // isSome is a type guard: (fa: Option<A>) => fa is Some<A>
    const somes = sequence(filter(O.isSome), opts);
    expect(somes).toHaveLength(3);
    expect(somes.every(O.isSome)).toBe(true);
  });

  it("O.isNone keeps only absent values", () => {
    const opts: Array<O.Option<number>> = [O.some(1), O.none, O.some(3), O.none];
    const nones = sequence(filter(O.isNone), opts);
    expect(nones).toHaveLength(2);
  });

  it("O.getOrElse unwraps each Option with a fallback", () => {
    const opts: Array<O.Option<number>> = [O.some(1), O.none, O.some(3), O.none, O.some(5)];
    // O.getOrElse(() => fallback) returns a function (fa: Option<A>) => A
    const result = sequence(map(O.getOrElse(() => 0)), opts);
    expect(result).toEqual([1, 0, 3, 0, 5]);
  });

  it("filter Some then unwrap: the fp-ts compact() pattern", () => {
    const opts: Array<O.Option<number>> = [O.some(1), O.none, O.some(3), O.none, O.some(5)];
    // Use getOrElse to safely extract — avoids casting through Option subtypes
    const somes = sequence(filter(O.isSome), opts);
    const values = sequence(map(O.getOrElse(() => -1)), somes);
    expect(values).toEqual([1, 3, 5]);
  });

  it("filter Some then unwrap in a single sequence via into", () => {
    const opts: Array<O.Option<string>> = [
      O.some("alpha"),
      O.none,
      O.some("beta"),
      O.none,
      O.some("gamma"),
    ];
    // getOrElse on all elements (None becomes empty string) then filter out empties
    const xform = pipe(
      map(O.getOrElse((): string => "")),
      filter((s: string) => s.length > 0),
    );
    expect(into([], xform, opts)).toEqual(["alpha", "beta", "gamma"]);
  });

  it("O.fromNullable turns nullable values into Options, then filter and unwrap", () => {
    const raw: Array<number | null | undefined> = [1, null, 3, undefined, 5];
    const opts = sequence(map(O.fromNullable), raw);
    const values = sequence(map(O.getOrElse(() => -1)), opts);
    expect(values).toEqual([1, -1, 3, -1, 5]);
  });
});

describe("Either: filter and unwrap patterns", () => {
  it("E.isRight keeps only successful results", () => {
    const results: Array<E.Either<string, number>> = [
      E.right(1),
      E.left("err"),
      E.right(3),
      E.left("fail"),
      E.right(5),
    ];
    const rights = sequence(filter(E.isRight), results);
    expect(rights).toHaveLength(3);
    expect(rights.every(E.isRight)).toBe(true);
  });

  it("E.isLeft keeps only failures", () => {
    const results: Array<E.Either<string, number>> = [
      E.right(1),
      E.left("err"),
      E.right(3),
      E.left("fail"),
    ];
    const lefts = sequence(filter(E.isLeft), results);
    expect(lefts).toHaveLength(2);
  });

  it("E.getOrElse extracts the right value or falls back", () => {
    const results: Array<E.Either<string, number>> = [E.right(1), E.left("error"), E.right(3)];
    const values = sequence(map(E.getOrElse((_e: string) => -1)), results);
    expect(values).toEqual([1, -1, 3]);
  });

  it("filter Right then extract values: the fp-ts rights() pattern", () => {
    const results: Array<E.Either<string, number>> = [
      E.right(10),
      E.left("network error"),
      E.right(20),
      E.left("timeout"),
      E.right(30),
    ];
    // Filter to Rights, then extract values via getOrElse (avoids unsafe cast)
    const rights = sequence(filter(E.isRight), results);
    const values = sequence(map(E.getOrElse((_e: string) => -1)), rights);
    expect(values).toEqual([10, 20, 30]);
  });
});

describe("transduce with fp-ts types as accumulator", () => {
  it("count Some vs None using transduce", () => {
    const opts: Array<O.Option<number>> = [O.some(1), O.none, O.some(3), O.none, O.some(5), O.none];
    type Counts = { somes: number; nones: number };
    const result = transduce(
      map((x: O.Option<number>) => x),
      (acc: Counts, x: O.Option<number>) => ({
        somes: acc.somes + (O.isSome(x) ? 1 : 0),
        nones: acc.nones + (O.isNone(x) ? 1 : 0),
      }),
      { somes: 0, nones: 0 } as Counts,
      opts,
    );
    expect(result).toEqual({ somes: 3, nones: 3 });
  });
});
