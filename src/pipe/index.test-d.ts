import { describe, it } from "vitest";
import { expectTypeOf } from "vitest";
import { filter } from "../filter/index.js";
import { map } from "../map/index.js";
import { pipe } from "./index.js";
import type { Transducer } from "../types/index.js";

/** expectTypeOf does not reliably compare generic function types (Transducer). */
function assertTransducer<A, B>(xf: Transducer<A, B>): void {
  void xf;
}

describe("pipe type-level inference", () => {
  it("filter followed by map infers map callback param as filter input type", () => {
    const xf = pipe(
      filter((n: number) => n > 0),
      map((n) => n.toString()),
    );

    assertTransducer<number, string>(xf);
  });

  it("pipe return type uses first transducer input and last transducer output", () => {
    const xf = pipe(
      map((n: number) => n.toString()),
      map((s) => s.length > 2),
      map((b) => (b ? 1 : 0)),
    );

    assertTransducer<number, number>(xf);
    expectTypeOf(xf).toBeFunction();
  });
});

describe("pipe mismatch detection", () => {
  it("rejects incompatible adjacent transducers", () => {
    pipe(
      map((n: number) => n.toString()),
      // @ts-expect-error string output does not match boolean input
      map((b: boolean) => (b ? 1 : 0)),
    );
  });
});
