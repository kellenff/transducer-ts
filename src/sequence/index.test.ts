import { describe, expect, it } from "vitest";
import { sequence } from "./index.js";
import { map } from "../map/index.js";
import { filter } from "../filter/index.js";
import { take } from "../take/index.js";
import { drop } from "../drop/index.js";

describe("sequence", () => {
  it("applies transducer and returns new array", () => {
    expect(
      sequence(
        map((x: number) => x * 2),
        [1, 2, 3],
      ),
    ).toEqual([2, 4, 6]);
  });

  it("handles empty input", () => {
    expect(
      sequence(
        map((x: number) => x * 2),
        [],
      ),
    ).toEqual([]);
  });

  it("does not mutate original collection", () => {
    const original = [1, 2, 3];
    const result = sequence(
      map((x: number) => x * 2),
      original,
    );
    expect(original).toEqual([1, 2, 3]);
    expect(result).toEqual([2, 4, 6]);
    expect(result).not.toBe(original);
  });

  it("works with filter", () => {
    expect(
      sequence(
        filter((x: number) => x % 2 === 0),
        [1, 2, 3, 4, 5],
      ),
    ).toEqual([2, 4]);
  });

  it("works with take", () => {
    expect(sequence(take(3), [1, 2, 3, 4, 5])).toEqual([1, 2, 3]);
  });

  it("works with drop", () => {
    expect(sequence(drop(2), [1, 2, 3, 4])).toEqual([3, 4]);
  });

  it("works over a Set (arbitrary Iterable)", () => {
    const s = new Set([1, 2, 3, 2, 1]); // deduped by Set: [1,2,3]
    expect(
      sequence(
        map((x: number) => x * 10),
        s,
      ),
    ).toEqual([10, 20, 30]);
  });
});
