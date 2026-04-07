# #5: `pipe`: type inference does not propagate forward into subsequent transducer callbacks

**State:** OPEN
**Author:** kellenff
**Created:** 2026-04-05T21:16:41Z
**URL:** https://github.com/kellenff/transducer-ts/issues/5

---

## Summary

When composing `filter` + `map` (or any two-step pipe) where the first transducer fixes the element type, the callback parameter of the second transducer is inferred as `unknown` instead of the output type of the first transducer. This forces users to annotate every callback explicitly, undercutting the "full type inference" promise in the package description.

## Reproduction

```ts
import { pipe, filter, map, transduce } from "@fromo/transducer-ts";

interface Lap {
  excluded: boolean;
  fuelUsedLiters: number;
}

const laps: readonly Lap[] = [
  { excluded: false, fuelUsedLiters: 2.0 },
  { excluded: true, fuelUsedLiters: 5.0 },
];

const sum = transduce(
  pipe(
    filter((l: Lap) => !l.excluded),
    map((l) => l.fuelUsedLiters), // ← error TS18046: 'l' is of type 'unknown'
  ),
  (acc: number, x: number) => acc + x,
  0,
  laps,
);
```

## Expected

The `map` callback's `l` should be inferred as `Lap` because the preceding `filter` produces `Transducer<Lap, Lap>`.

## Actual

```
error TS18046: 'l' is of type 'unknown'.
```

## Workaround

Explicitly annotate the `map` callback:

```ts
map((l: Lap) => l.fuelUsedLiters);
```

For a 2-step pipe this is tolerable. For a 5+ step pipeline it becomes noisy and fragile — every annotation must match what comes before, and TypeScript provides no help when the types diverge.

## Root cause (my read)

`map(f: (a: A) => B): Transducer<A, B>` has no constraint linking `A` to the previous transducer's output. TypeScript resolves `A` independently (defaulting to `unknown`) before `pipe`'s `BuildConstraint` runs its compatibility check. `BuildConstraint` then reports success (because `unknown` is assignable from anything), but by then the inference on the callback has already been lost.

## Possible fix directions

1. **Pipe takes callbacks, not transducers.** Reshape `pipe` to accept the operation descriptors directly (e.g. `pipe(laps, filter(l => !l.excluded), map(l => l.fuelUsedLiters))`) and wire types through the pipe generic chain. This is what `fp-ts` / `effect` do.
2. **Make `map`/`filter` into dual-form callables** that participate in the pipe chain via a shared context type. Harder but preserves the existing transducer semantics.
3. **Document the limitation** prominently and provide a codemod or ESLint rule that auto-annotates.

Happy to prototype option 1 if you'd like.

## Context

Surfaced while dogfooding `@fromo/transducer-ts` in a real TypeScript project (single-pass stats fold over an array of classified laps).
