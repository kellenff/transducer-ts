import { describe, expect, it } from "vitest";
import { drop } from "./index.js";
import { sequence } from "../sequence/index.js";
import { into } from "../into/index.js";

describe("drop", () => {
  it("drops the first n elements", () => {
    expect(sequence(drop(2), [1, 2, 3, 4, 5])).toEqual([3, 4, 5]);
  });

  it("returns empty when n >= collection length", () => {
    expect(sequence(drop(10), [1, 2, 3])).toEqual([]);
  });

  it("drop(0) passes all elements through", () => {
    expect(sequence(drop(0), [1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("drop(0) on empty collection returns empty", () => {
    expect(sequence(drop(0), [])).toEqual([]);
  });

  it("drop(1) drops only first element", () => {
    expect(sequence(drop(1), [10, 20, 30])).toEqual([20, 30]);
  });

  it("drop(-1) treats negative n as 0 — passes all through (Clojure semantics)", () => {
    expect(sequence(drop(-1), [1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("drop(-5) treats negative n as 0 — passes all through", () => {
    expect(sequence(drop(-5), [1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("drop(NaN) passes all elements through", () => {
    expect(sequence(drop(Number.NaN), [1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("drop(Infinity) drops all elements", () => {
    expect(sequence(drop(Number.POSITIVE_INFINITY), [1, 2, 3])).toEqual([]);
  });

  it("drop with fractional n effectively rounds up by step count", () => {
    expect(sequence(drop(2.1), [1, 2, 3, 4, 5])).toEqual([4, 5]);
  });

  it("handles empty collection", () => {
    expect(sequence(drop(3), [])).toEqual([]);
  });

  it("drops exactly n elements", () => {
    expect(sequence(drop(3), [1, 2, 3, 4, 5])).toEqual([4, 5]);
  });

  it("reuse: applying same transducer value twice creates fresh state", () => {
    const d = drop(2);
    expect(sequence(d, [1, 2, 3])).toEqual([3]);
    expect(sequence(d, [4, 5, 6])).toEqual([6]);
  });

  it("works with into", () => {
    expect(into([], drop(2), [10, 20, 30, 40])).toEqual([30, 40]);
  });

  describe("standalone callable", () => {
    it("drops first n from array", () => {
      expect(drop(2)([1, 2, 3, 4, 5])).toEqual([3, 4, 5]);
    });

    it("drops from Set (any Iterable)", () => {
      const result = drop(1)(new Set([10, 20, 30]));
      expect(result).toEqual([20, 30]);
    });

    it("drops from generator", () => {
      function* nums(): Generator<number> {
        yield 1;
        yield 2;
        yield 3;
        yield 4;
      }
      expect(drop(2)(nums())).toEqual([3, 4]);
    });

    it("n > length returns empty", () => {
      expect(drop(10)([1, 2])).toEqual([]);
    });

    it("n = 0 returns all elements", () => {
      expect(drop(0)([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it("negative n returns all elements", () => {
      expect(drop(-5)([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it("empty collection returns empty", () => {
      expect(drop(3)([])).toEqual([]);
    });
  });
});
