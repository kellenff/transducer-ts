# Interoperability

## Ramda and Rambda

These libraries implement transducers as **`@@transducer/`** protocol objects. **That protocol is not compatible** with this library’s function-based `StepFn` / `Transducer` model.

**Do:** use **fully applied** Ramda/Rambda functions as **callbacks** inside `map` / `filter`:

```typescript
import * as R from "ramda";
import { map, sequence } from "@fromo/transducer-ts";

sequence(map(R.add(1)), [1, 2, 3]);
// => [2, 3, 4]
```

**Don’t:** pass Ramda’s transducer-returning helpers as transducers to `sequence` / `pipe`:

```typescript
// Not valid: R.map returns a @@transducer/ object, not a Transducer
// sequence(R.map(R.add(1)), [1, 2, 3]);
```

## lodash, remeda, fp-ts, itertools, underscore

Ordinary functions (unary transforms, predicates) work **inside** `map` / `filter` / `filterGuard` without special handling. Use their **values** (e.g. `_.identity`), not transducer objects if the library provides them.

## Async iterables

This package operates on **`Iterable`**, not `AsyncIterable`. For async streams, either:

- buffer / collect to a synchronous iterable first, or
- use a different abstraction for async pipelines.

## Fantasy Land / static-land

Not targeted. Transducers here are plain TypeScript functions, not typeclass dictionaries.
