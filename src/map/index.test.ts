import { describe, expect, it } from "vitest";
import { map } from "./index.ts";
import { sequence } from "../sequence/index.ts";
import { into } from "../into/index.ts";
import { transduce } from "../transduce/index.ts";

describe("map", () => {
  it("transforms each element", () => {
    expect(
      sequence(
        map((x: number) => x * 2),
        [1, 2, 3],
      ),
    ).toEqual([2, 4, 6]);
  });

  it("identity function returns the same elements", () => {
    expect(
      sequence(
        map((x: number) => x),
        [1, 2, 3],
      ),
    ).toEqual([1, 2, 3]);
  });

  it("handles empty collection", () => {
    expect(
      sequence(
        map((x: number) => x * 2),
        [],
      ),
    ).toEqual([]);
  });

  it("maps to a different type", () => {
    expect(
      sequence(
        map((x: number) => String(x)),
        [1, 2, 3],
      ),
    ).toEqual(["1", "2", "3"]);
  });

  it("maps objects to derived values", () => {
    const people = [{ name: "Alice" }, { name: "Bob" }];
    expect(
      sequence(
        map((p: { name: string }) => p.name),
        people,
      ),
    ).toEqual(["Alice", "Bob"]);
  });

  it("works with into", () => {
    expect(
      into(
        [],
        map((x: number) => x + 1),
        [10, 20, 30],
      ),
    ).toEqual([11, 21, 31]);
  });

  it("works with transduce", () => {
    const sum = transduce(
      map((x: number) => x * 2),
      (acc: number, x: number) => acc + x,
      0,
      [1, 2, 3],
    );
    expect(sum).toBe(12);
  });
});
