# #6: Add type-level tests to catch inference regressions in `pipe`

**State:** OPEN
**Author:** kellenff
**Created:** 2026-04-05T21:16:53Z
**URL:** https://github.com/kellenff/transducer-ts/issues/6

---

## Summary

The inference bug described in the sibling issue slipped past the existing test suite because the runtime behavior is correct — only TypeScript catches it. The library should have type-level tests that assert the inferred type of `pipe` output and callback parameters.

## Suggested approach

Add `tsd` or `expectTypeOf` (from vitest) tests that verify:

1. `filter` followed by `map` infers the map callback param as the filter's input type (not `unknown`).
2. `pipe`'s return type has the correct input type from the first transducer and output type from the last.
3. `BuildConstraint` rejects genuinely incompatible pipelines with the expected `PipeTypeError` branded type.

Example using `expectTypeOf`:

```ts
import { expectTypeOf } from "vitest";
import { pipe, filter, map } from "../src";
import type { Transducer } from "../src/types";

test("map after filter infers callback param", () => {
  const xf = pipe(
    filter((n: number) => n > 0),
    map((n) => n.toString()), // should infer n: number
  );
  expectTypeOf(xf).toMatchTypeOf<Transducer<number, string>>();
});
```

## Context

Feedback from dogfooding. Related to the `pipe` inference issue.
