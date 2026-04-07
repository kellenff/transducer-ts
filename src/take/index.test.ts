import { describe, expect, it } from "vitest";
import { take } from "./index.js";
import { pipe } from "../pipe/index.js";
import { sequence } from "../sequence/index.js";
import { transduce } from "../transduce/index.js";
import { into } from "../into/index.js";

describe("take", () => {
  it("takes the first n elements", () => {
    expect(sequence(take(2), [1, 2, 3, 4, 5])).toEqual([1, 2]);
  });

  it("returns all elements when n > collection length", () => {
    expect(sequence(take(10), [1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("take(0) returns empty", () => {
    expect(sequence(take(0), [1, 2, 3])).toEqual([]);
  });

  it("take(0) on empty collection returns empty", () => {
    expect(sequence(take(0), [])).toEqual([]);
  });

  it("take(1) returns only first element", () => {
    expect(sequence(take(1), [10, 20, 30])).toEqual([10]);
  });

  it("take(-1) treats negative n as 0 — returns empty (Clojure semantics)", () => {
    expect(sequence(take(-1), [1, 2, 3])).toEqual([]);
  });

  it("take(-5) treats negative n as 0 — returns empty", () => {
    expect(sequence(take(-5), [1, 2, 3])).toEqual([]);
  });

  it("take(NaN) returns empty", () => {
    expect(sequence(take(Number.NaN), [1, 2, 3])).toEqual([]);
  });

  it("take(Infinity) returns all elements", () => {
    expect(sequence(take(Number.POSITIVE_INFINITY), [1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("take with fractional n effectively rounds up by step count", () => {
    expect(sequence(take(2.1), [1, 2, 3, 4])).toEqual([1, 2, 3]);
  });

  it("handles empty collection", () => {
    expect(sequence(take(3), [])).toEqual([]);
  });

  it("terminates early — does not process elements beyond n", () => {
    let callCount = 0;
    const counting = take(2);
    // Wrap in transduce with a counting reducer to verify early exit
    const result = transduce(
      counting,
      (acc: number[], x: number) => {
        callCount++;
        acc.push(x);
        return acc;
      },
      [] as number[],
      [1, 2, 3, 4, 5],
    );
    expect(result).toEqual([1, 2]);
    expect(callCount).toBe(2); // only 2 elements processed, not 5
  });

  it("reuse: applying same transducer value twice creates fresh state", () => {
    const t = take(2);
    expect(sequence(t, [1, 2, 3])).toEqual([1, 2]);
    expect(sequence(t, [4, 5, 6])).toEqual([4, 5]);
  });

  it("double-take: inner take already Reduced when outer take limit reached", () => {
    // pipe(take(2), take(2)) — inner take(2) signals Reduced on 2nd element
    // outer take(2) also hits limit at 2nd element
    // This exercises the isReduced(result) ? result : reduced(result) branch
    const xf = pipe(take(2), take(2));
    expect(sequence(xf, [1, 2, 3, 4])).toEqual([1, 2]);
  });

  it("works with into", () => {
    expect(into([], take(3), [10, 20, 30, 40, 50])).toEqual([10, 20, 30]);
  });

  describe("standalone callable", () => {
    it("takes first n from array", () => {
      expect(take(3)([1, 2, 3, 4, 5])).toEqual([1, 2, 3]);
    });

    it("takes from Set (any Iterable)", () => {
      const result = take(2)(new Set([10, 20, 30]));
      expect(result).toEqual([10, 20]);
    });

    it("takes from generator", () => {
      function* nums(): Generator<number> {
        yield 1;
        yield 2;
        yield 3;
        yield 4;
      }
      expect(take(2)(nums())).toEqual([1, 2]);
    });

    it("n > length returns all elements", () => {
      expect(take(10)([1, 2])).toEqual([1, 2]);
    });

    it("n = 0 returns empty", () => {
      expect(take(0)([1, 2, 3])).toEqual([]);
    });

    it("negative n returns empty", () => {
      expect(take(-5)([1, 2, 3])).toEqual([]);
    });

    it("empty collection returns empty", () => {
      expect(take(3)([])).toEqual([]);
    });
  });
});
