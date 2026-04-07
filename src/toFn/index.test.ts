import { describe, expect, expectTypeOf, it } from "vitest";
import { toFn, map, filter, take, drop, pipe, sequence } from "../index.js";
import type { Transducer } from "../types/index.js";

describe("toFn", () => {
  it("wraps a transducer into a data-last function", () => {
    const doubles = toFn(map((x: number) => x * 2));
    expect(doubles([1, 2, 3])).toEqual([2, 4, 6]);
  });

  it("returns same result as sequence", () => {
    const xform = pipe(
      filter((x: number) => x % 2 === 0),
      map((x: number) => x * 10),
    );
    const input = [1, 2, 3, 4, 5, 6];
    expect(toFn(xform)(input)).toEqual(sequence(xform, input));
  });

  it("works with pipe composition", () => {
    const process = toFn(
      pipe(
        filter((x: number) => x > 2),
        map((x: number) => x * 10),
        take(3),
      ),
    );
    expect(process([1, 2, 3, 4, 5, 6, 7])).toEqual([30, 40, 50]);
  });

  it("handles early termination via take", () => {
    const firstTwo = toFn(take(2));
    expect(firstTwo([1, 2, 3, 4, 5])).toEqual([1, 2]);
  });

  it("handles empty input", () => {
    const doubles = toFn(map((x: number) => x * 2));
    expect(doubles([])).toEqual([]);
  });

  it("handles take(0)", () => {
    const none = toFn(take(0));
    expect(none([1, 2, 3])).toEqual([]);
  });

  it("works with drop", () => {
    const skipTwo = toFn(drop(2));
    expect(skipTwo([1, 2, 3, 4, 5])).toEqual([3, 4, 5]);
  });

  it("works with generators", () => {
    function* nums(): Generator<number> {
      yield 1;
      yield 2;
      yield 3;
    }
    const doubles = toFn(map((x: number) => x * 2));
    expect(doubles(nums())).toEqual([2, 4, 6]);
  });

  it("returns a reusable function", () => {
    const evens = toFn(filter((x: number) => x % 2 === 0));
    expect(evens([1, 2, 3, 4])).toEqual([2, 4]);
    expect(evens([5, 6, 7, 8])).toEqual([6, 8]);
  });

  it("type-level: infers correct function signature", () => {
    const fn = toFn(map((x: number) => String(x)));
    expectTypeOf(fn).toEqualTypeOf<(coll: Iterable<number>) => string[]>();
  });

  it("type-level: infers from pipe composition", () => {
    const fn = toFn(
      pipe(
        filter((x: number) => x > 0),
        map((x: number) => String(x)),
      ),
    );
    expectTypeOf(fn).toEqualTypeOf<(coll: Iterable<number>) => string[]>();
  });

  it("type-level: preserves generic parameter", () => {
    const identity = <A>(xform: Transducer<A, A>): ((coll: Iterable<A>) => A[]) => toFn(xform);
    expectTypeOf(identity).toBeFunction();
  });
});
