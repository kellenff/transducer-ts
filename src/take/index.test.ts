import { describe, expect, it } from "vitest";
import { take } from "./index.ts";
import { sequence } from "../sequence/index.ts";
import { transduce } from "../transduce/index.ts";
import { into } from "../into/index.ts";

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

  it("handles empty collection", () => {
    expect(sequence(take(3), [])).toEqual([]);
  });

  it("terminates early — does not process elements beyond n", () => {
    let callCount = 0;
    const counting = take<number>(2);
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

  it("works with into", () => {
    expect(into([], take(3), [10, 20, 30, 40, 50])).toEqual([10, 20, 30]);
  });
});
