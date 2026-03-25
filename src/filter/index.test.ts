import { describe, expect, it } from "vitest";
import { filter } from "./index.js";
import { sequence } from "../sequence/index.js";
import { into } from "../into/index.js";
import { transduce } from "../transduce/index.js";

describe("filter", () => {
  it("keeps elements matching predicate", () => {
    expect(
      sequence(
        filter((x: number) => x % 2 === 0),
        [1, 2, 3, 4, 5],
      ),
    ).toEqual([2, 4]);
  });

  it("always-true predicate returns all elements", () => {
    expect(
      sequence(
        filter((_: number) => true),
        [1, 2, 3],
      ),
    ).toEqual([1, 2, 3]);
  });

  it("always-false predicate returns empty", () => {
    expect(
      sequence(
        filter((_: number) => false),
        [1, 2, 3],
      ),
    ).toEqual([]);
  });

  it("handles empty collection", () => {
    expect(
      sequence(
        filter((x: number) => x > 0),
        [],
      ),
    ).toEqual([]);
  });

  it("keeps all elements when all match", () => {
    expect(
      sequence(
        filter((x: number) => x > 0),
        [1, 2, 3],
      ),
    ).toEqual([1, 2, 3]);
  });

  it("keeps no elements when none match", () => {
    expect(
      sequence(
        filter((x: number) => x > 10),
        [1, 2, 3],
      ),
    ).toEqual([]);
  });

  it("works with into", () => {
    expect(
      into(
        [],
        filter((x: number) => x % 2 === 0),
        [1, 2, 3, 4],
      ),
    ).toEqual([2, 4]);
  });

  it("works with transduce", () => {
    const count = transduce(
      filter((x: number) => x % 2 === 0),
      (acc: number, _: number) => acc + 1,
      0,
      [1, 2, 3, 4, 5, 6],
    );
    expect(count).toBe(3);
  });
});
