# #7: Docs: add recipe for `transduce` with non-array accumulator (running stats)

**State:** OPEN
**Author:** kellenff
**Created:** 2026-04-05T21:16:58Z
**URL:** https://github.com/kellenff/transducer-ts/issues/7

---

## Summary

The README / JSDoc examples for `transduce` all use numeric or string accumulators. The biggest practical win over `sequence` is folding into a structured accumulator (e.g. running statistics, grouped results) in a single pass. Adding a recipe would highlight this.

## Suggested recipe

```ts
import { pipe, filter, map, transduce } from "@fromo/transducer-ts";

// Single-pass running stats over a numeric stream
interface Stats {
  count: number;
  sum: number;
  sumSq: number;
  min: number;
  max: number;
}

const EMPTY: Stats = {
  count: 0,
  sum: 0,
  sumSq: 0,
  min: Infinity,
  max: -Infinity,
};

function step(acc: Stats, value: number): Stats {
  return {
    count: acc.count + 1,
    sum: acc.sum + value,
    sumSq: acc.sumSq + value * value,
    min: Math.min(acc.min, value),
    max: Math.max(acc.max, value),
  };
}

const stats = transduce(
  pipe(
    filter((x: number) => x > 0),
    map((x: number) => x),
  ),
  step,
  EMPTY,
  [1.2, 3.4, -0.1, 5.6, 2.3],
);

const avg = stats.sum / stats.count;
const variance = stats.sumSq / stats.count - avg * avg;
const stdDev = Math.sqrt(variance);
```

This replaces what would otherwise be four separate passes (mean, stddev, min, max) with one fold.

## Context

Pattern used during dogfooding. The `analyzeFuel` function in a real TypeScript project is now built this way.
