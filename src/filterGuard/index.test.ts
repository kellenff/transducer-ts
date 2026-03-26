import { describe, expect, expectTypeOf, it } from "vitest";
import { filterGuard } from "./index.js";
import { sequence } from "../sequence/index.js";
import { pipe } from "../pipe/index.js";
import { map } from "../map/index.js";

describe("filterGuard", () => {
  it("keeps only values matching the guard", () => {
    const isString = (x: string | number): x is string => typeof x === "string";
    expect(sequence(filterGuard(isString), [1, "a", 2, "b"])).toEqual(["a", "b"]);
  });

  it("works in pipe composition with narrowed type", () => {
    const isString = (x: string | number): x is string => typeof x === "string";
    const xf = pipe(
      filterGuard(isString),
      map((s: string) => s.toUpperCase()),
    );
    expect(sequence(xf, [1, "a", 2, "b"])).toEqual(["A", "B"]);
  });

  it("type-level: output is narrowed subtype", () => {
    const isString = (x: string | number): x is string => typeof x === "string";
    const xf = filterGuard(isString);
    expectTypeOf(xf).toEqualTypeOf<
      import("../types/index.js").Transducer<string | number, string>
    >();
  });
});
