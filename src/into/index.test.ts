import { describe, expect, it } from "vitest";
import { into } from "./index.ts";
import { map } from "../map/index.ts";
import { filter } from "../filter/index.ts";
import { take } from "../take/index.ts";

describe("into", () => {
  it("transduce into a target array", () => {
    expect(
      into(
        [],
        map((x: number) => x * 2),
        [1, 2, 3],
      ),
    ).toEqual([2, 4, 6]);
  });

  it("handles empty input", () => {
    expect(
      into(
        [],
        map((x: number) => x * 2),
        [],
      ),
    ).toEqual([]);
  });

  it("with filter transducer", () => {
    expect(
      into(
        [],
        filter((x: number) => x > 2),
        [1, 2, 3, 4],
      ),
    ).toEqual([3, 4]);
  });

  it("with take transducer", () => {
    expect(into([], take(2), [1, 2, 3, 4, 5])).toEqual([1, 2]);
  });

  it("appends to an existing array", () => {
    const target = [0];
    const result = into(
      target,
      map((x: number) => x),
      [1, 2, 3],
    );
    expect(result).toEqual([0, 1, 2, 3]);
    expect(result).toBe(target); // same reference
  });

  it("identity transducer copies elements", () => {
    expect(
      into(
        [],
        map((x: number) => x),
        [1, 2, 3],
      ),
    ).toEqual([1, 2, 3]);
  });
});
