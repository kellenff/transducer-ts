import { describe, expect, it } from "vitest";
import _ from "underscore";
import { filter, into, map, pipe, sequence, transduce } from "../src/index.js";

// Underscore integration with transducer-ts
//
// Underscore is a classic JavaScript utility library. Its functions integrate
// directly as callbacks in map() and filter() because they are plain functions.
//
// Unlike lodash, underscore ships without TypeScript definitions bundled —
// @types/underscore provides them separately. A few underscore functions have
// complex generic signatures; use explicit type annotations where needed.

describe("underscore predicates as filter callbacks", () => {
  it("_.isString keeps only strings from a mixed array", () => {
    const mixed: Array<string | number | boolean> = [1, "hello", true, "world", 42];
    expect(sequence(filter(_.isString), mixed)).toEqual(["hello", "world"]);
  });

  it("_.isNumber keeps only numbers", () => {
    const mixed: Array<string | number | null> = ["a", 1, null, 2, "b", 3];
    expect(sequence(filter(_.isNumber), mixed)).toEqual([1, 2, 3]);
  });

  it("_.isFinite excludes Infinity and NaN", () => {
    const nums = [1, Infinity, 2, NaN, 3, -Infinity];
    expect(sequence(filter(_.isFinite), nums)).toEqual([1, 2, 3]);
  });

  it("_.isNull keeps only null values", () => {
    const mixed: Array<string | number | null> = ["a", null, 1, null, "b"];
    expect(sequence(filter(_.isNull), mixed)).toHaveLength(2);
  });

  it("_.isUndefined keeps only undefined values", () => {
    const mixed: Array<string | undefined> = ["a", undefined, "b", undefined, "c"];
    expect(sequence(filter(_.isUndefined), mixed)).toHaveLength(2);
  });

  it("_.isBoolean keeps only booleans", () => {
    const mixed: Array<string | number | boolean> = [1, true, "x", false, 0];
    expect(sequence(filter(_.isBoolean), mixed)).toEqual([true, false]);
  });
});

describe("underscore transforms as map callbacks", () => {
  it("_.identity passes values through unchanged", () => {
    // _.identity is a plain function in underscore — unlike remeda's version
    expect(sequence(map(_.identity), [1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("_.negate flips a predicate — used as a map-to-boolean", () => {
    const isEven = _.negate((x: number) => x % 2 !== 0);
    expect(sequence(map(isEven), [1, 2, 3, 4])).toEqual([false, true, false, true]);
  });

  it("_.toArray converts an iterable to an array within a map", () => {
    // Convert strings to character arrays
    expect(
      sequence(
        map((s: string) => _.toArray(s)),
        ["ab", "cd"],
      ),
    ).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });
});

describe("transduce with underscore helpers", () => {
  it("sum with filter using transduce", () => {
    const result = transduce(filter(_.isFinite), (acc: number, x: number) => acc + x, 0, [
      1,
      Infinity,
      2,
      NaN,
      3,
      4,
    ]);
    expect(result).toBe(10);
  });

  it("group strings by length using transduce", () => {
    const words = ["hi", "hello", "hey", "world", "ok"];
    const result = transduce(
      filter(_.isString),
      (acc: Record<number, string[]>, s: string) => {
        const len = s.length;
        if (acc[len] === undefined) acc[len] = [];
        acc[len]!.push(s);
        return acc;
      },
      {} as Record<number, string[]>,
      words,
    );
    expect(result[2]).toEqual(["hi", "ok"]);
    expect(result[5]).toEqual(["hello", "world"]);
  });
});

describe("pipe composition with underscore callbacks", () => {
  it("filter numbers, transform, collect", () => {
    const mixed: Array<string | number> = ["a", 1, "b", 2, "c", 3, "d", 4];
    const xform = pipe(
      filter(_.isNumber),
      map((x: number) => x * 10),
    );
    expect(into([], xform, mixed)).toEqual([10, 20, 30, 40]);
  });

  it("filter finite numbers then clamp", () => {
    const nums = [NaN, 1, Infinity, 8, -Infinity, 3, 15, 5];
    const xform = pipe(
      filter(_.isFinite),
      map((x: number) => Math.max(0, Math.min(10, x))),
    );
    expect(sequence(xform, nums)).toEqual([1, 8, 3, 10, 5]);
  });

  it("multi-stage: filter strings, check predicate, take result", () => {
    const mixed: Array<string | number> = [1, "alpha", 2, "beta", 3, "almond"];
    const xform = pipe(
      filter(_.isString),
      filter((s: string) => s.startsWith("a")),
    );
    expect(sequence(xform, mixed)).toEqual(["alpha", "almond"]);
  });
});
