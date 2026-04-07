import { describe, expect, it } from "vitest";
import { map } from "./map/index.js";
import { filter } from "./filter/index.js";
import { filterGuard } from "./filterGuard/index.js";
import { take } from "./take/index.js";
import { drop } from "./drop/index.js";
import { pipe } from "./pipe/index.js";
import { sequence } from "./sequence/index.js";
import { into } from "./into/index.js";
import { toFn } from "./toFn/index.js";

describe("pipe composition", () => {
  it("2-deep: map then filter", () => {
    const xf = pipe(
      map((x: number) => x * 2),
      filter((x: number) => x > 4),
    );
    expect(sequence(xf, [1, 2, 3, 4, 5])).toEqual([6, 8, 10]);
  });

  it("2-deep: filter then map", () => {
    const xf = pipe(
      filter((x: number) => x % 2 === 0),
      map((x: number) => x * 10),
    );
    expect(sequence(xf, [1, 2, 3, 4])).toEqual([20, 40]);
  });

  it("3-deep: filter + map + take", () => {
    const xf = pipe(
      filter((x: number) => x > 2),
      map((x: number) => x * 10),
      take(3),
    );
    expect(sequence(xf, [1, 2, 3, 4, 5, 6])).toEqual([30, 40, 50]);
  });

  it("3-deep: map + filter + take with early termination", () => {
    let callCount = 0;
    const counting = map((x: number) => {
      callCount++;
      return x;
    });
    const xf = pipe(
      counting,
      filter((x: number) => x % 2 === 0),
      take(2),
    );
    expect(sequence(xf, [1, 2, 3, 4, 5, 6, 7, 8])).toEqual([2, 4]);
    // Early termination: should stop before processing all 8 elements
    expect(callCount).toBeLessThan(8);
  });

  it("4-deep: map + filter + drop + take", () => {
    const xf = pipe(
      map((x: number) => x * 2), // [2,4,6,8,10]
      filter((x: number) => x > 3), // [4,6,8,10]
      drop(1), // [6,8,10]
      take(2), // [6,8]
    );
    expect(sequence(xf, [1, 2, 3, 4, 5])).toEqual([6, 8]);
  });

  it("1-deep: single transducer works with pipe", () => {
    const xf = pipe(map((x: number) => x + 1));
    expect(sequence(xf, [1, 2, 3])).toEqual([2, 3, 4]);
  });
});

describe("edge case matrix", () => {
  it("empty collection through composed pipeline", () => {
    const xf = pipe(
      map((x: number) => x * 2),
      filter((x: number) => x > 4),
    );
    expect(sequence(xf, [])).toEqual([]);
  });

  it("single element through composed pipeline — matches", () => {
    const xf = pipe(
      map((x: number) => x * 2),
      filter((x: number) => x > 4),
    );
    expect(sequence(xf, [3])).toEqual([6]);
  });

  it("single element through composed pipeline — filtered out", () => {
    const xf = pipe(
      map((x: number) => x * 2),
      filter((x: number) => x > 10),
    );
    expect(sequence(xf, [3])).toEqual([]);
  });

  it("negative n in take within composition returns empty", () => {
    const xf = pipe(
      map((x: number) => x * 2),
      take(-1),
    );
    expect(sequence(xf, [1, 2, 3])).toEqual([]);
  });

  it("negative n in drop within composition passes all through", () => {
    const xf = pipe(
      drop(-5),
      map((x: number) => x * 2),
    );
    expect(sequence(xf, [1, 2, 3])).toEqual([2, 4, 6]);
  });

  it("take(0) within composition returns empty", () => {
    const xf = pipe(
      map((x: number) => x * 2),
      take(0),
    );
    expect(sequence(xf, [1, 2, 3])).toEqual([]);
  });

  it("composed pipeline works with into", () => {
    const xf = pipe(
      filter((x: number) => x % 2 === 0),
      map((x: number) => x * 3),
    );
    expect(into([], xf, [1, 2, 3, 4, 5, 6])).toEqual([6, 12, 18]);
  });

  it("barrel-style data-last execution works via toFn", () => {
    const run = toFn(
      pipe(
        filter((x: number) => x % 2 === 0),
        map((x: number) => x + 1),
      ),
    );
    expect(run([1, 2, 3, 4])).toEqual([3, 5]);
  });

  it("barrel-style narrowing pipeline works via filterGuard", () => {
    const isString = (x: string | number): x is string => typeof x === "string";
    const xf = pipe(
      filterGuard(isString),
      map((s: string) => s.length),
    );
    expect(sequence(xf, [1, "aa", 2, "bbb"])).toEqual([2, 3]);
  });
});
