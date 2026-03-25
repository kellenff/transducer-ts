import { describe, expect, it } from "vitest";
import * as R from "ramda";
import { filter, into, map, pipe, sequence } from "../src/index.js";

// ─── IMPORTANT: Protocol Incompatibility ────────────────────────────────────
//
// Ramda ships its own transducer protocol based on transformer objects:
//   { '@@transducer/step': fn, '@@transducer/init': fn, '@@transducer/result': fn }
//
// transducer-ts uses plain functions as step functions (StepFn<R, A>).
// These two protocols are NOT compatible — you cannot mix them directly.
//
// WRONG — R.map(f) returns a transformer object, not a StepFn:
//   pipe(R.map(R.add(1)), filter(...))          // ❌ type error at runtime
//   sequence(R.map(R.add(1)), [1, 2, 3])        // ❌ wrong shape
//
// CORRECT — use ramda functions as CALLBACKS inside transducer-ts transducers:
//   map(R.add(1))                               // ✓ R.add(1) is (x: number) => number
//   filter(R.is(Number))                        // ✓ R.is(Number) is a plain predicate
//
// The rule: any ramda function that has been fully applied (not waiting for
// more arguments) is a plain function and works as a callback.
// ────────────────────────────────────────────────────────────────────────────

describe("ramda arithmetic as map callbacks", () => {
  it("R.add(1) increments each element", () => {
    expect(sequence(map(R.add(1)), [1, 2, 3])).toEqual([2, 3, 4]);
  });

  it("R.multiply(2) doubles each element", () => {
    expect(sequence(map(R.multiply(2)), [1, 2, 3])).toEqual([2, 4, 6]);
  });

  it("R.negate flips the sign of each element", () => {
    expect(sequence(map(R.negate), [1, -2, 3])).toEqual([-1, 2, -3]);
  });

  it("R.inc and R.dec as step transforms", () => {
    expect(sequence(map(R.inc), [0, 1, 2])).toEqual([1, 2, 3]);
    expect(sequence(map(R.dec), [1, 2, 3])).toEqual([0, 1, 2]);
  });

  it("R.clamp(0)(10) as a map callback", () => {
    expect(sequence(map(R.clamp(0, 10)), [-5, 0, 5, 10, 15])).toEqual([0, 0, 5, 10, 10]);
  });
});

describe("ramda predicates as filter callbacks", () => {
  it("R.is(Number) keeps only numbers", () => {
    const mixed: Array<string | number | boolean> = [1, "a", true, 2, "b", 3];
    expect(sequence(filter(R.is(Number)), mixed)).toEqual([1, 2, 3]);
  });

  it("R.is(String) keeps only strings", () => {
    const mixed: Array<string | number> = [1, "hello", 2, "world"];
    expect(sequence(filter(R.is(String)), mixed)).toEqual(["hello", "world"]);
  });

  it("R.gt(R.__, 3) keeps elements greater than 3", () => {
    // R.gt(R.__, 3) means: (x) => R.gt(x, 3) — i.e. x > 3
    expect(sequence(filter(R.gt(R.__, 3)), [1, 2, 3, 4, 5])).toEqual([4, 5]);
  });

  it("R.lt(R.__, 4) keeps elements less than 4", () => {
    expect(sequence(filter(R.lt(R.__, 4)), [1, 2, 3, 4, 5])).toEqual([1, 2, 3]);
  });

  it("R.propEq as a filter predicate on objects", () => {
    const users = [
      { name: "Alice", role: "admin" },
      { name: "Bob", role: "user" },
      { name: "Carol", role: "admin" },
    ];
    // R.propEq(value, prop) — checks obj[prop] === value
    expect(sequence(filter(R.propEq("admin", "role")), users)).toEqual([
      { name: "Alice", role: "admin" },
      { name: "Carol", role: "admin" },
    ]);
  });
});

describe("pipe composition with ramda callbacks", () => {
  it("filter with R.is(Number) then multiply", () => {
    const mixed: Array<string | number> = [1, "a", 2, "b", 3];
    const xform = pipe(filter(R.is(Number)), map(R.multiply(10)));
    expect(sequence(xform, mixed)).toEqual([10, 20, 30]);
  });

  it("map then filter: double then keep > 4", () => {
    const xform = pipe(map(R.multiply(2)), filter(R.gt(R.__, 4)));
    expect(sequence(xform, [1, 2, 3, 4, 5])).toEqual([6, 8, 10]);
  });

  it("multi-stage pipeline with ramda helpers", () => {
    const xform = pipe(
      filter(R.is(Number)),
      map(R.add(1)),
      filter(R.gt(R.__, 3)),
      map(R.multiply(10)),
    );
    const mixed: Array<string | number> = ["x", 1, 2, "y", 3, 4, 5];
    expect(into([], xform, mixed)).toEqual([40, 50, 60]);
  });
});

describe("R.pipe vs transducer-ts pipe", () => {
  it("R.pipe transforms data eagerly; transducer-ts pipe builds a lazy transducer", () => {
    const numbers = [1, 2, 3, 4, 5];

    // R.pipe: composes plain functions, applied to data immediately
    const ramdaResult = R.pipe(
      R.filter((x: number) => x > 2),
      R.map(R.multiply(10)),
    )(numbers);
    expect(ramdaResult).toEqual([30, 40, 50]);

    // transducer-ts pipe: builds a reusable lazy transducer, no data yet
    const xform = pipe(
      filter((x: number) => x > 2),
      map(R.multiply(10)),
    );
    expect(sequence(xform, numbers)).toEqual([30, 40, 50]);
    // Same transducer reused on a different source
    expect(sequence(xform, new Set([1, 3, 5]))).toEqual([30, 50]);
  });
});
