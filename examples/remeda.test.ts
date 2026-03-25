import { describe, expect, it } from "vitest";
import * as R from "remeda";
import { filter, into, map, pipe, sequence, transduce } from "../src/index.js";

// remeda integration with transducer-ts
//
// Remeda is a TypeScript-first utility library with data-last curried functions.
// Its functions integrate naturally as callbacks in map() and filter() because
// the curried form R.fn(arg) returns a plain unary function (data: T) => U.
//
// Remeda also ships its own `pipe` for data pipelines. The two pipe functions
// serve different purposes:
//   - remeda pipe(data, fn1, fn2): eagerly transforms data through plain functions
//   - transducer-ts pipe(xf1, xf2): composes lazy transducers (no data yet)
//
// Use transducer-ts pipe when you want lazy evaluation and a reusable transducer.
// Use remeda pipe when you want a simple, eager, point-free data pipeline.

describe("remeda predicates as filter callbacks", () => {
  it("R.isString keeps only strings from a mixed array", () => {
    const mixed: Array<string | number | boolean> = [1, "hello", true, "world", 42];
    expect(sequence(filter(R.isString), mixed)).toEqual(["hello", "world"]);
  });

  it("R.isNumber keeps only numbers", () => {
    const mixed: Array<string | number | null | undefined> = ["a", 1, null, 2, undefined, 3];
    expect(sequence(filter(R.isNumber), mixed)).toEqual([1, 2, 3]);
  });

  it("R.isNonNullish filters out null and undefined", () => {
    const sparse: Array<string | null | undefined> = ["a", null, "b", undefined, "c"];
    expect(sequence(filter(R.isNonNullish), sparse)).toEqual(["a", "b", "c"]);
  });

  it("R.isArray filters arrays from a mixed collection", () => {
    const mixed: Array<number | number[]> = [1, [2, 3], 4, [5], 6];
    expect(sequence(filter(R.isArray), mixed)).toEqual([[2, 3], [5]]);
  });
});

describe("remeda transforms as map callbacks", () => {
  it("R.constant produces a fixed value for each element", () => {
    // R.constant(v) returns a function that always returns v — useful for replacing values
    expect(sequence(map(R.constant(0)), [1, 2, 3])).toEqual([0, 0, 0]);
  });

  it("custom remeda-style function: negate numbers", () => {
    // R.negate is not in remeda — use a lambda; remeda's value is in predicates/data manipulation
    const negate = (x: number) => -x;
    expect(sequence(map(negate), [1, 2, 3])).toEqual([-1, -2, -3]);
  });

  it("R.prop extracts a property from each object", () => {
    const people = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];
    expect(sequence(map(R.prop("name")), people)).toEqual(["Alice", "Bob"]);
  });

  it("R.pick extracts a subset of properties", () => {
    const records = [
      { id: 1, name: "Alice", role: "admin" },
      { id: 2, name: "Bob", role: "user" },
    ];
    expect(sequence(map(R.pick(["id", "name"])), records)).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
  });
});

describe("pipe composition with remeda callbacks", () => {
  it("filter non-nullish then extract property", () => {
    // filter() in transducer-ts preserves the element type — it does not narrow.
    // Cast to the narrowed type explicitly when the next stage needs a precise type.
    const items: Array<{ name: string } | null> = [
      { name: "alpha" },
      null,
      { name: "beta" },
      null,
      { name: "gamma" },
    ];
    const xform = pipe(
      filter(R.isNonNullish<{ name: string } | null>),
      map((item: { name: string } | null) => (item as { name: string }).name),
    );
    expect(sequence(xform, items)).toEqual(["alpha", "beta", "gamma"]);
  });

  it("filter strings then transform", () => {
    // Note: filter() in transducer-ts preserves the input element type — it does not narrow.
    // When you need to narrow, apply the filter and collect first, then transform separately.
    const mixed = ["hello", 1, "world", 2, "foo", 3] as const;
    const strings: string[] = [];
    for (const x of mixed) {
      if (R.isString(x)) strings.push(x);
    }
    const result = sequence(
      map((s: string) => s.toUpperCase()),
      strings,
    );
    expect(result).toEqual(["HELLO", "WORLD", "FOO"]);
  });

  it("multi-stage: filter, pick, into existing array", () => {
    type User = { id: number; name: string; active: boolean };
    const users: User[] = [
      { id: 1, name: "Alice", active: true },
      { id: 2, name: "Bob", active: false },
      { id: 3, name: "Carol", active: true },
    ];
    const xform = pipe(
      filter((u: User) => u.active),
      map(({ id, name }: User) => ({ id, name })),
    );
    expect(into([], xform, users)).toEqual([
      { id: 1, name: "Alice" },
      { id: 3, name: "Carol" },
    ]);
  });
});

describe("remeda pipe vs transducer-ts pipe", () => {
  it("remeda pipe transforms data eagerly; transducer-ts pipe builds a lazy transducer", () => {
    const numbers = [1, 2, 3, 4, 5];

    // remeda pipe: data-first, eager, returns a result immediately
    const remedaResult = R.pipe(
      numbers,
      R.filter((x) => x > 2),
      R.map((x) => x * 10),
    );
    expect(remedaResult).toEqual([30, 40, 50]);

    // transducer-ts pipe: builds a reusable lazy transducer — no data yet
    const xform = pipe(
      filter((x: number) => x > 2),
      map((x: number) => x * 10),
    );
    // Apply to any iterable
    expect(sequence(xform, numbers)).toEqual([30, 40, 50]);
    expect(sequence(xform, new Set([1, 3, 5]))).toEqual([30, 50]);
  });

  it("transduce with a custom reducer and remeda helpers", () => {
    type Item = { label: string; value: number };
    const items: Item[] = [
      { label: "a", value: 1 },
      { label: "b", value: -2 },
      { label: "c", value: 3 },
      { label: "d", value: -4 },
    ];
    const result = transduce(
      filter((item: Item) => item.value > 0),
      (acc: string[], item: Item) => {
        acc.push(item.label);
        return acc;
      },
      [] as string[],
      items,
    );
    expect(result).toEqual(["a", "c"]);
  });
});
