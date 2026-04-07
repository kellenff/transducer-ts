import { describe, expectTypeOf, it } from "vitest";
import {
  drop,
  filter,
  filterGuard,
  into,
  map,
  pipe,
  reduced,
  sequence,
  take,
  toFn,
  transduce,
} from "./index.js";
import type { PreservingTransducer, StepFn, Transducer } from "./index.js";

/** expectTypeOf does not reliably compare generic function types (Transducer). */
function assertTransducer<A, B>(xf: Transducer<A, B>): void {
  void xf;
}

describe("forward inference through pipe", () => {
  it("2-arity: filter then map infers callback param from filter output", () => {
    const xf = pipe(
      filter((x: number) => x > 0),
      map((x) => x * 2),
    );
    assertTransducer<number, number>(xf);
  });

  it("2-arity: map then filter infers callback param from map output", () => {
    const xf = pipe(
      map((x: number) => String(x)),
      filter((s: string) => s.length > 0),
    );
    assertTransducer<number, string>(xf);
  });

  it("3-arity: filter + map + take (output widens to unknown after take in current inference)", () => {
    const xf = pipe(
      filter((x: number) => x > 0),
      map((x: number): string => String(x)),
      take(5),
    );
    assertTransducer<number, unknown>(xf);
  });

  it("6-arity: long chain with contextual inference where TS supports it", () => {
    const xf = pipe(
      map((x: number) => String(x)),
      filter((s: string) => s.length > 0),
      map((s: string) => s.length),
      filter((n: number) => n > 0),
      map((n: number) => n > 0),
      map((b: boolean): number => (b ? 1 : 0)),
    );
    assertTransducer<number, number>(xf);
  });

  it("issue #5 reproduction: filter(Lap) then map infers Lap", () => {
    interface Lap {
      excluded: boolean;
      fuelUsedLiters: number;
    }
    const xf = pipe(
      filter((l: Lap) => !l.excluded),
      map((l) => l.fuelUsedLiters),
    );
    assertTransducer<Lap, number>(xf);
  });
});

describe("PreservingTransducer contracts", () => {
  it("take returns PreservingTransducer", () => {
    expectTypeOf(take(3)).toEqualTypeOf<PreservingTransducer>();
  });

  it("drop returns PreservingTransducer", () => {
    expectTypeOf(drop(2)).toEqualTypeOf<PreservingTransducer>();
  });

  it("take standalone callable infers element type from array", () => {
    expectTypeOf(take(3)([1, 2, 3, 4])).toEqualTypeOf<readonly number[]>();
  });

  it("drop standalone callable infers element type from array", () => {
    expectTypeOf(drop(1)(["a", "b", "c"])).toEqualTypeOf<readonly string[]>();
  });

  it("take standalone callable infers element type from Set", () => {
    expectTypeOf(take(2)(new Set([1, 2, 3]))).toEqualTypeOf<readonly number[]>();
  });
});

describe("consumers with take / drop", () => {
  it("sequence with take (element type flows from collection at call site)", () => {
    void sequence(take(3), [1, 2, 3, 4]);
  });

  it("sequence with drop (element type flows from collection at call site)", () => {
    void sequence(drop(1), ["a", "b"]);
  });

  it("into with take (target array should be typed, e.g. [] as number[])", () => {
    void into([] as number[], take(3), [1, 2, 3, 4]);
  });

  it("transduce with take infers element type", () => {
    expectTypeOf(
      transduce(take(2), (acc: number, x: number) => acc + x, 0, [1, 2, 3]),
    ).toEqualTypeOf<number>();
  });

  it("toFn with PreservingTransducer returns polymorphic function", () => {
    const fn = toFn(take(3));
    expectTypeOf(fn).toEqualTypeOf<(coll: Iterable<unknown>) => unknown[]>();
  });
});

describe("pipe result types", () => {
  it("pipe 1-arity preserves transducer type", () => {
    const xf = pipe(map((x: number) => String(x)));
    assertTransducer<number, string>(xf);
  });

  it("pipe 2-arity infers correct input/output types", () => {
    const xf = pipe(
      map((x: number) => String(x)),
      filter((s: string) => s.length > 0),
    );
    assertTransducer<number, string>(xf);
  });

  it("pipe 3-arity with take (output element type widens through PreservingTransducer)", () => {
    const xf = pipe(
      filter((x: number) => x > 0),
      map((x: number): string => String(x)),
      take(5),
    );
    assertTransducer<number, unknown>(xf);
  });

  it("pipe 3-arity sequence infers output type", () => {
    const xf = pipe(
      filter((x: number) => x > 0),
      map((x: number) => x * 2),
      take(5),
    );
    void sequence(xf, [1, 2, 3]);
  });

  it("pipe with filterGuard narrows then map infers narrowed type", () => {
    const isString = (x: string | number): x is string => typeof x === "string";
    const xf = pipe(
      filterGuard(isString),
      map((s: string) => s.length),
    );
    assertTransducer<string | number, number>(xf);
  });

  it("pipe 10-arity infers Transducer<number, number>", () => {
    const xf = pipe(
      map((x: number) => String(x)),
      filter((s: string) => s.length > 0),
      map((s: string) => s.length),
      filter((n: number) => n > 0),
      map((n: number) => n > 0),
      map((b: boolean) => (b ? 1 : 0)),
      filter((n: number) => n > 0),
      map((n: number) => String(n)),
      drop(1),
      map((s: string) => s.length),
    );
    assertTransducer<number, number>(xf);
  });

  it("pipe 15-arity infers Transducer<number, number>", () => {
    const xf = pipe(
      map((x: number) => String(x)),
      filter((s: string) => s.length > 0),
      map((s: string) => s.length),
      filter((n: number) => n > 0),
      map((n: number) => n > 0),
      map((b: boolean) => (b ? 1 : 0)),
      filter((n: number) => n > 0),
      map((n: number) => String(n)),
      drop(1),
      map((s: string) => s.length),
      take(10),
      map((n: number) => n > 0),
      map((b: boolean) => (b ? "yes" : "no")),
      filter((s: string) => s.length > 0),
      map((s: string) => s.length),
    );
    assertTransducer<number, number>(xf);
  });

  it("pipe 21-arity infers Transducer<number, number>", () => {
    const xf = pipe(
      map((x: number) => String(x)),
      filter((s: string) => s.length > 0),
      map((s: string) => s.length),
      filter((n: number) => n > 0),
      map((n: number) => n > 0),
      map((b: boolean) => (b ? 1 : 0)),
      filter((n: number) => n > 0),
      map((n: number) => String(n)),
      drop(1),
      map((s: string) => s.length),
      take(10),
      map((n: number) => n > 0),
      map((b: boolean) => (b ? "yes" : "no")),
      filter((s: string) => s.length > 0),
      map((s: string) => s.length),
      map((n: number) => String(n)),
      filter((s: string) => s.length > 0),
      map((s: string) => s.length),
      map((n: number) => n > 0),
      map((b: boolean) => (b ? 1 : 0)),
      map((n: number) => n),
    );
    assertTransducer<number, number>(xf);
  });
});

describe("pipe mismatch detection", () => {
  it("pipe rejects mismatch at position 1", () => {
    pipe(
      // @ts-expect-error — string output does not match boolean input at position 1
      map((x: number) => String(x)),
      filter((x: boolean) => x),
    );
  });

  it("pipe rejects mismatch at position 3", () => {
    pipe(
      map((x: number) => String(x)),
      filter((s: string) => s.length > 0),
      // @ts-expect-error — number output does not match string input at position 3
      map((s: string) => s.length),
      filter((s: string) => s.length > 0),
    );
  });
});

describe("transduce accepts StepFn reducers", () => {
  it("StepFn with reduced early termination", () => {
    const step: StepFn<number, number> = (acc, input) => (input > 2 ? reduced(acc) : acc + input);
    expectTypeOf(
      transduce(
        map((x: number) => x),
        step,
        0,
        [1, 2, 3],
      ),
    ).toEqualTypeOf<number>();
  });
});

describe("toFn type inference", () => {
  it("toFn infers data-last function type", () => {
    const run = toFn(map((x: number) => String(x)));
    expectTypeOf(run).toEqualTypeOf<(coll: Iterable<number>) => string[]>();
  });
});
