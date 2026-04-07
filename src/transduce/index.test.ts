import { describe, expect, it } from "vitest";
import { transduce } from "./index.js";
import { map } from "../map/index.js";
import { filter } from "../filter/index.js";
import { take } from "../take/index.js";
import type { Reducer } from "../types/index.js";

const pushReducer: Reducer<number[], number> = (acc, x) => {
  acc.push(x);
  return acc;
};

describe("transduce", () => {
  it("applies transducer and reducing function over a collection", () => {
    const result = transduce(
      map((x: number) => x * 2),
      pushReducer,
      [] as number[],
      [1, 2, 3],
    );
    expect(result).toEqual([2, 4, 6]);
  });

  it("uses the provided initial value", () => {
    const sum = transduce(
      map((x: number) => x),
      (acc: number, x: number) => acc + x,
      100,
      [1, 2, 3],
    );
    expect(sum).toBe(106);
  });

  it("handles empty collection", () => {
    const result = transduce(
      map((x: number) => x * 2),
      pushReducer,
      [] as number[],
      [],
    );
    expect(result).toEqual([]);
  });

  it("terminates early via Reduced — take stops iteration", () => {
    let callCount = 0;
    const result = transduce(
      take(2),
      (acc: number[], x: number) => {
        callCount++;
        acc.push(x);
        return acc;
      },
      [] as number[],
      [1, 2, 3, 4, 5],
    );
    expect(result).toEqual([1, 2]);
    expect(callCount).toBe(2);
  });

  it("unwraps Reduced value correctly at loop end", () => {
    // take(n) exactly at collection boundary: last element triggers Reduced
    const result = transduce(take(3), pushReducer, [] as number[], [10, 20, 30]);
    expect(result).toEqual([10, 20, 30]);
  });

  it("works with filter transducer", () => {
    const result = transduce(
      filter((x: number) => x % 2 === 0),
      pushReducer,
      [] as number[],
      [1, 2, 3, 4, 5],
    );
    expect(result).toEqual([2, 4]);
  });

  it("transduce with custom accumulator type (string concatenation)", () => {
    const result = transduce(
      map((x: number) => String(x)),
      (acc: string, x: string) => acc + x,
      "",
      [1, 2, 3],
    );
    expect(result).toBe("123");
  });

  it("propagates mapper errors", () => {
    expect(() =>
      transduce(
        map((x: number) => {
          if (x === 2) {
            throw new Error("boom");
          }
          return x;
        }),
        pushReducer,
        [] as number[],
        [1, 2, 3],
      ),
    ).toThrow("boom");
  });

  it("propagates reducer errors", () => {
    expect(() =>
      transduce(
        map((x: number) => x),
        (_acc: number[], x: number) => {
          if (x === 2) {
            throw new Error("reducer-fail");
          }
          return [];
        },
        [] as number[],
        [1, 2, 3],
      ),
    ).toThrow("reducer-fail");
  });

  it("closes iterators on early termination", () => {
    let finalized = false;
    function* source(): Generator<number> {
      try {
        yield 1;
        yield 2;
        yield 3;
      } finally {
        finalized = true;
      }
    }

    const result = transduce(take(2), pushReducer, [] as number[], source());
    expect(result).toEqual([1, 2]);
    expect(finalized).toBe(true);
  });
});
