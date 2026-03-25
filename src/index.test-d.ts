import { describe, expectTypeOf, it } from "vitest";
import { drop, filter, into, map, pipe, sequence, take } from "./index.js";
import type { Transducer } from "./index.js";

describe("type-level assertions", () => {
  it("map infers Transducer<A, B>", () => {
    expectTypeOf(map((x: number) => String(x))).toEqualTypeOf<Transducer<number, string>>();
  });

  it("map identity preserves type", () => {
    expectTypeOf(map((x: number) => x)).toEqualTypeOf<Transducer<number, number>>();
  });

  it("filter preserves element type", () => {
    expectTypeOf(filter((x: number) => x > 0)).toEqualTypeOf<Transducer<number, number>>();
  });

  it("take preserves element type", () => {
    expectTypeOf(take<number>(3)).toEqualTypeOf<Transducer<number, number>>();
  });

  it("drop preserves element type", () => {
    expectTypeOf(drop<number>(2)).toEqualTypeOf<Transducer<number, number>>();
  });

  it("sequence infers output type from transducer", () => {
    const xf = map((x: number) => String(x));
    expectTypeOf(sequence(xf, [1, 2, 3])).toEqualTypeOf<string[]>();
  });

  it("sequence with filter returns same element type array", () => {
    const xf = filter((x: number) => x > 0);
    expectTypeOf(sequence(xf, [1, 2, 3])).toEqualTypeOf<number[]>();
  });

  it("into infers output type from transducer", () => {
    const xf = map((x: number) => String(x));
    expectTypeOf(into([] as string[], xf, [1, 2, 3])).toEqualTypeOf<string[]>();
  });

  it("pipe 1-arity preserves transducer type", () => {
    const xf = pipe(map((x: number) => String(x)));
    expectTypeOf(xf).toEqualTypeOf<Transducer<number, string>>();
  });

  it("pipe 2-arity infers correct input/output types", () => {
    const xf = pipe(
      map((x: number) => String(x)),
      filter((s: string) => s.length > 0),
    );
    expectTypeOf(xf).toEqualTypeOf<Transducer<number, string>>();
  });

  it("pipe 3-arity infers correct through-types", () => {
    const xf = pipe(
      filter((x: number) => x > 0),
      map((x: number) => String(x)),
      take<string>(5),
    );
    expectTypeOf(xf).toEqualTypeOf<Transducer<number, string>>();
  });

  it("pipe 3-arity sequence infers output type", () => {
    const xf = pipe(
      filter((x: number) => x > 0),
      map((x: number) => x * 2),
      take<number>(5),
    );
    expectTypeOf(sequence(xf, [1, 2, 3])).toEqualTypeOf<number[]>();
  });
});

describe("pipe high-arity inference", () => {
  it("pipe 6-arity infers Transducer<number, number>", () => {
    const xf = pipe(
      map((x: number) => String(x)),
      filter((s: string) => s.length > 0),
      map((s: string) => s.length),
      filter((x: number) => x > 0),
      map((x: number) => x > 0),
      map((x: boolean): number => (x ? 1 : 0)),
    );
    expectTypeOf(xf).toEqualTypeOf<Transducer<number, number>>();
  });

  it("pipe 10-arity infers Transducer<number, number>", () => {
    const xf = pipe(
      map((x: number) => String(x)),
      filter((s: string) => s.length > 0),
      map((s: string) => s.length),
      filter((x: number) => x > 0),
      map((x: number) => x > 0),
      map((x: boolean) => (x ? 1 : 0)),
      filter((x: number) => x > 0),
      map((x: number) => String(x)),
      drop<string>(1),
      map((s: string) => s.length),
    );
    expectTypeOf(xf).toEqualTypeOf<Transducer<number, number>>();
  });

  it("pipe 15-arity infers Transducer<number, number>", () => {
    const xf = pipe(
      map((x: number) => String(x)),
      filter((s: string) => s.length > 0),
      map((s: string) => s.length),
      filter((x: number) => x > 0),
      map((x: number) => x > 0),
      map((x: boolean) => (x ? 1 : 0)),
      filter((x: number) => x > 0),
      map((x: number) => String(x)),
      drop<string>(1),
      map((s: string) => s.length),
      take<number>(10),
      map((x: number) => x > 0),
      map((x: boolean) => (x ? "yes" : "no")),
      filter((s: string) => s.length > 0),
      map((s: string) => s.length),
    );
    expectTypeOf(xf).toEqualTypeOf<Transducer<number, number>>();
  });
});

describe("pipe mismatch detection", () => {
  it("pipe rejects mismatch at position 1", () => {
    pipe(
      map((x: number) => String(x)),
      // @ts-expect-error — string output doesn't match boolean input
      filter((x: boolean) => x),
    );
  });

  it("pipe rejects mismatch at position 3", () => {
    pipe(
      map((x: number) => String(x)),
      filter((s: string) => s.length > 0),
      map((s: string) => s.length),
      // @ts-expect-error — number output doesn't match string input at position 3
      filter((s: string) => s.length > 0),
    );
  });

  it("pipe rejects mismatch at position 9 in a 10-element chain", () => {
    pipe(
      map((x: number) => String(x)),
      filter((s: string) => s.length > 0),
      map((s: string) => s.length),
      filter((x: number) => x > 0),
      map((x: number) => x > 0),
      map((x: boolean): number => (x ? 1 : 0)),
      filter((x: number) => x > 0),
      map((x: number) => String(x)),
      drop<string>(1),
      // @ts-expect-error — string output doesn't match boolean input at position 9
      filter((x: boolean) => x),
    );
  });

  it("pipe rejects single mismatch in 12-element chain", () => {
    pipe(
      map((x: number) => String(x)),
      filter((s: string) => s.length > 0),
      map((s: string) => s.length),
      filter((x: number) => x > 0),
      map((x: number) => x > 0),
      // @ts-expect-error — boolean output doesn't match string input at position 5
      filter((s: string) => s.length > 0),
      map((s: string) => s.length),
      filter((x: number) => x > 0),
      map((x: number) => String(x)),
      drop<string>(1),
      filter((s: string) => s.length > 0),
      map((s: string) => s.length),
    );
  });
});
