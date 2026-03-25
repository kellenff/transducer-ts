import { describe, expect, it } from "vitest";
import _ from "lodash";
import { filter, into, map, pipe, sequence, transduce } from "../src/index.js";

// lodash integration with transducer-ts
//
// lodash functions are plain JavaScript functions — they integrate directly as
// callbacks inside map() and filter(). No adapter or wrapper needed.
//
// The integration point is always a plain function:
//   map(lodashFn)        — lodashFn must be (a: A) => B
//   filter(lodashPred)   — lodashPred must be (a: A) => boolean
//   transduce(..., reducer, init, coll) — reducer can call lodash helpers internally

describe("lodash predicates as filter callbacks", () => {
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

  it("_.isBoolean keeps only booleans", () => {
    const mixed: Array<string | number | boolean> = [1, true, "x", false, 0];
    expect(sequence(filter(_.isBoolean), mixed)).toEqual([true, false]);
  });

  it("custom lodash predicate via _.conforms", () => {
    const isPositiveNumber = _.conforms({ value: (v: number) => v > 0 });
    const items = [{ value: -1 }, { value: 5 }, { value: 0 }, { value: 3 }];
    expect(sequence(filter(isPositiveNumber), items)).toEqual([{ value: 5 }, { value: 3 }]);
  });
});

describe("lodash transforms as map callbacks", () => {
  it("_.toUpper converts strings to uppercase", () => {
    expect(sequence(map(_.toUpper), ["hello", "world"])).toEqual(["HELLO", "WORLD"]);
  });

  it("_.toLower converts strings to lowercase", () => {
    expect(sequence(map(_.toLower), ["Hello", "WORLD"])).toEqual(["hello", "world"]);
  });

  it("_.toString converts values to strings", () => {
    expect(sequence(map(_.toString), [1, 2, 3])).toEqual(["1", "2", "3"]);
  });

  it("_.toNumber converts strings to numbers", () => {
    expect(sequence(map(_.toNumber), ["1", "2.5", "3"])).toEqual([1, 2.5, 3]);
  });

  it("_.clamp wrapped as a unary map callback", () => {
    // _.clamp(value, lower, upper) is ternary — wrap it for use with map
    const clampTo100 = (x: number) => _.clamp(x, 0, 100);
    expect(sequence(map(clampTo100), [-10, 0, 50, 100, 150])).toEqual([0, 0, 50, 100, 100]);
  });

  it("_.negate flips a predicate for use as a map-to-boolean", () => {
    const isOdd = (x: number) => x % 2 !== 0;
    const isEven = _.negate(isOdd);
    expect(sequence(map(isEven), [1, 2, 3, 4])).toEqual([false, true, false, true]);
  });
});

describe("transduce with a non-array accumulator", () => {
  it("group numbers into even/odd buckets using transduce", () => {
    type Buckets = { even: number[]; odd: number[] };
    const result = transduce(
      filter((x: number) => x > 0),
      (acc: Buckets, x: number) => {
        if (x % 2 === 0) {
          acc.even.push(x);
        } else {
          acc.odd.push(x);
        }
        return acc;
      },
      { even: [], odd: [] } as Buckets,
      [0, 1, 2, 3, 4, 5, 6],
    );
    expect(result).toEqual({ even: [2, 4, 6], odd: [1, 3, 5] });
  });

  it("count occurrences with transduce + _.countBy logic", () => {
    const words = ["apple", "banana", "apricot", "blueberry", "avocado"];
    const result = transduce(
      filter((s: string) => s.startsWith("a")),
      (acc: Record<string, number>, s: string) => {
        const key = s[0] ?? s;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
      words,
    );
    expect(result).toEqual({ a: 3 });
  });

  it("build a frequency map using transduce", () => {
    const items = ["x", "y", "x", "z", "x", "y"];
    const freq = transduce(
      map((s: string) => s),
      (acc: Map<string, number>, s: string) => {
        acc.set(s, (acc.get(s) ?? 0) + 1);
        return acc;
      },
      new Map<string, number>(),
      items,
    );
    expect(freq.get("x")).toBe(3);
    expect(freq.get("y")).toBe(2);
    expect(freq.get("z")).toBe(1);
  });
});

describe("pipe composition with lodash callbacks", () => {
  it("filter with _.isString then toUpper: use sequence twice for mixed-type narrowing", () => {
    // Note: filter() preserves the input element type — it cannot narrow within pipe().
    // For mixed-type narrowing, collect the filtered result first, then transform.
    const mixed: Array<string | number> = [1, "hello", 2, "world", 3, "foo"];
    const strings = sequence(
      filter((x: string | number) => _.isString(x)),
      mixed,
    ) as string[];
    const result = sequence(
      map((s: string) => _.toUpper(s)),
      strings,
    );
    expect(result).toEqual(["HELLO", "WORLD", "FOO"]);
  });

  it("filter numbers, clamp, then collect into an existing array", () => {
    const clampTo10 = (x: number) => _.clamp(x, 0, 10);
    const xform = pipe(filter(_.isNumber), map(clampTo10));
    const mixed: Array<string | number> = ["a", 15, "b", -5, 8, "c", 3];
    expect(into([], xform, mixed)).toEqual([10, 0, 8, 3]);
  });

  it("multi-stage pipeline: filter, transform, filter again", () => {
    const xform = pipe(
      filter(_.isFinite),
      map((x: number) => _.clamp(x, 1, 5)),
      filter((x: number) => x > 2),
    );
    const nums = [NaN, 1, 2, 3, Infinity, 4, 5, -1];
    expect(sequence(xform, nums)).toEqual([3, 4, 5]);
  });
});
