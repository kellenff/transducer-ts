import { describe, expect, it } from "vitest";
import { range, izip, chunked, takewhile, enumerate, chain } from "itertools";
import { filter, map, pipe, sequence, transduce } from "../src/index.js";

// itertools integration with transducer-ts
//
// itertools provides lazy generator-based iterables — range, izip, chunked,
// cycle, takeWhile, enumerate, chain, and more. Every generator it returns
// implements Symbol.iterator, making it directly compatible with transducer-ts's
// sequence(), into(), and transduce() which accept any Iterable<T>.
//
// This is one of the cleanest integrations: itertools generates the data,
// transducer-ts transforms it — no adapters needed.

describe("range as an iterable source", () => {
  it("sequence over range(0, 5) with map", () => {
    expect(
      sequence(
        map((x: number) => x * 2),
        range(0, 5),
      ),
    ).toEqual([0, 2, 4, 6, 8]);
  });

  it("sequence over range with filter", () => {
    expect(
      sequence(
        filter((x: number) => x % 2 === 0),
        range(0, 10),
      ),
    ).toEqual([0, 2, 4, 6, 8]);
  });

  it("pipe over range: filter odd, double, take first 3", () => {
    const xform = pipe(
      filter((x: number) => x % 2 !== 0),
      map((x: number) => x * 2),
    );
    expect(sequence(xform, range(1, 10))).toEqual([2, 6, 10, 14, 18]);
  });

  it("transduce over range to sum even numbers", () => {
    const result = transduce(
      filter((x: number) => x % 2 === 0),
      (acc: number, x: number) => acc + x,
      0,
      range(1, 11),
    );
    // 2 + 4 + 6 + 8 + 10 = 30
    expect(result).toBe(30);
  });
});

describe("izip produces tuples as iterable source", () => {
  it("sequence over izip of two arrays", () => {
    const zipped = izip([1, 2, 3], ["a", "b", "c"]);
    expect(
      sequence(
        map(([n, s]: [number, string]) => `${n}:${s}`),
        zipped,
      ),
    ).toEqual(["1:a", "2:b", "3:c"]);
  });

  it("filter zipped pairs where number > 1", () => {
    const zipped = izip([1, 2, 3, 4], ["a", "b", "c", "d"]);
    const xform = pipe(
      filter(([n]: [number, string]) => n > 1),
      map(([n, s]: [number, string]) => `${n}${s}`),
    );
    expect(sequence(xform, zipped)).toEqual(["2b", "3c", "4d"]);
  });
});

describe("chunked produces arrays as iterable source", () => {
  it("sequence over chunked — each element is a sub-array", () => {
    const chunks = chunked([1, 2, 3, 4, 5, 6], 2);
    expect(
      sequence(
        map((c: number[]) => c.reduce((a, b) => a + b, 0)),
        chunks,
      ),
    ).toEqual([3, 7, 11]);
  });

  it("filter chunks by size then sum", () => {
    const chunks = chunked([1, 2, 3, 4, 5], 2);
    // Last chunk may be partial (length < 2)
    const xform = pipe(
      filter((c: number[]) => c.length === 2),
      map((c: number[]) => c[0]! + c[1]!),
    );
    expect(sequence(xform, chunks)).toEqual([3, 7]);
  });
});

describe("enumerate and takeWhile as iterable sources", () => {
  it("enumerate adds an index to each element", () => {
    const indexed = enumerate(["a", "b", "c"]);
    expect(
      sequence(
        map(([i, s]: [number, string]) => `${i}:${s}`),
        indexed,
      ),
    ).toEqual(["0:a", "1:b", "2:c"]);
  });

  it("takeWhile lazily terminates — transducer runs only over emitted values", () => {
    // takeWhile stops producing values when the predicate fails.
    // The transducer only processes values that takeWhile yields.
    const source = takewhile([1, 2, 3, 10, 4, 5], (x) => x < 5);
    expect(
      sequence(
        map((x: number) => x * 10),
        source,
      ),
    ).toEqual([10, 20, 30]);
  });
});

describe("chain combines multiple iterables into one", () => {
  it("chain two arrays and transform together", () => {
    const combined = chain([1, 2, 3], [4, 5, 6]);
    expect(
      sequence(
        map((x: number) => x * 2),
        combined,
      ),
    ).toEqual([2, 4, 6, 8, 10, 12]);
  });

  it("chain three ranges and filter", () => {
    const combined = chain(range(0, 3), range(10, 13), range(20, 23));
    expect(
      sequence(
        filter((x: number) => x % 2 === 0),
        combined,
      ),
    ).toEqual([0, 2, 10, 12, 20, 22]);
  });
});
