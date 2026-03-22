# Feature Landscape

**Domain:** TypeScript transducer/functional transformation library (0.1.0 publish-readiness)
**Researched:** 2026-03-22
**Confidence:** MEDIUM (training data only -- web search unavailable, but transducer ecosystem is stable and well-understood since 2014)

## Table Stakes

Features users expect. Missing = library feels incomplete or unpublishable.

### For a 0.1.0 Library Release (Any npm Package)

| Feature                                   | Why Expected                                                                                                              | Complexity | Status  | Notes                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------- | ------- | -------------------------------------------------------------------------- |
| Comprehensive test suite                  | Users and contributors need confidence the library works; untested = untrustworthy                                        | Medium     | MISSING | No test runner installed, no tests exist                                   |
| Correct package.json metadata             | `name`, `version`, `description`, `license`, `repository`, `keywords`, `engines`, `author` -- npm listing depends on this | Low        | PARTIAL | Has exports but `private: true`, no version, no license field, no repo URL |
| LICENSE file                              | Legal requirement for adoption; companies will not use a library without one                                              | Low        | MISSING | README says MIT but no LICENSE file exists                                 |
| Clear README with API docs                | First thing users see; must answer "what is this, how do I install, how do I use it"                                      | Medium     | PARTIAL | Basic README exists but PROJECT.md flags it as needing rewrite             |
| Type-safe public API (no `as unknown as`) | The core value proposition is type safety; unsafe casts undermine trust                                                   | Medium     | BROKEN  | `take` uses `as unknown as R` -- the most prominent type safety violation  |
| Edge case handling                        | Negative/zero args to `take`/`drop` should not throw or behave unexpectedly                                               | Low        | MISSING | PROJECT.md flags this as pending                                           |
| Published to npm (not `private: true`)    | Cannot be installed if private                                                                                            | Low        | BLOCKED | `private: true` in package.json                                            |

### For a Transducer Library Specifically

| Feature                                        | Why Expected                                                             | Complexity | Status  | Notes                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------ | ---------- | ------- | -------------------------------------------------------------------------- |
| Core transducers: map, filter, take, drop      | Minimum viable set matching Clojure's most-used transducers              | Low        | DONE    | All four implemented                                                       |
| Execution functions: transduce, into, sequence | Users need ways to actually run transducers against data                 | Low        | DONE    | All three implemented                                                      |
| Early termination (Reduced protocol)           | `take` is meaningless without it; fundamental to the transducer contract | Medium     | DONE    | Implemented via `Reduced<T>` sentinel                                      |
| Composability with standard pipe/compose       | The whole point of transducers is composition                            | Low        | DONE    | Works with rambda's `pipe`                                                 |
| Works with Iterables                           | Transducers should work with any iterable, not just arrays               | Low        | DONE    | `transduce` accepts `Iterable<A>`                                          |
| JSDoc on all exported functions                | TypeScript users rely on hover docs in their editor                      | Low        | PARTIAL | Present but minimal; could be richer with `@param`, `@returns`, `@example` |

## Differentiators

Features that set the library apart. Not expected at 0.1.0, but create competitive advantage.

| Feature                                    | Value Proposition                                                                                                                                          | Complexity | Notes                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| Full type inference through pipe chains    | Most JS transducer libs (transducers-js, transducers.js) predate TypeScript or have weak types; strong inference is the main reason to choose this library | High       | Current types work with rambda's pipe -- this IS the differentiator, verify it works well in tests |
| Tree-shakeable subpath exports             | `import { map } from "transducer-ts/map"` -- already configured in package.json exports map                                                                | Low        | Already set up in tsup config and package.json                                                     |
| Zero runtime dependencies                  | Only rambda as peer dep; no bundle bloat                                                                                                                   | Low        | Already the case                                                                                   |
| ESM-only with proper exports field         | Modern, forward-looking; no CJS baggage                                                                                                                    | Low        | Already the case                                                                                   |
| Clojure-faithful semantics                 | Clear reference behavior -- when in doubt, match Clojure                                                                                                   | Low        | Stated as a design principle; needs tests to prove it                                              |
| Comprehensive usage examples in README     | Most transducer READMEs are sparse; good examples with pipe composition would stand out                                                                    | Medium     | Current README has one example; could show more patterns                                           |
| TypeDoc or similar generated API reference | Uncommon for small libs at 0.1.0 but impressive                                                                                                            | Medium     | Defer -- JSDoc in source + README examples are sufficient for 0.1.0                                |

## Anti-Features

Features to explicitly NOT build for 0.1.0. These are scoped out in PROJECT.md and the rationale is sound.

| Anti-Feature                                                                                   | Why Avoid                                                                                                                                                        | What to Do Instead                                                           |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Async transducers                                                                              | Doubles the API surface and type complexity; async iteration has different semantics (backpressure, error propagation); very few JS transducer libs do this well | Ship sync-only 0.1.0; add async in a future minor version if demand exists   |
| Additional transducers (takeWhile, dropWhile, mapIndexed, dedupe, partition, etc.)             | Scope creep; each one needs types, tests, docs; core four cover 80% of use cases                                                                                 | Ship with map/filter/take/drop; add more in 0.2.0+ based on user feedback    |
| Lazy evaluation / iterator protocol                                                            | Clojure transducers are eager; laziness adds complexity and changes the mental model; users expecting Clojure semantics would be confused                        | Keep eager semantics; document this clearly as a design decision             |
| Runtime input validation                                                                       | Library targets TypeScript consumers; types enforce contracts at compile time; runtime checks add bundle size and slow hot paths                                 | Trust the type system; document expected inputs in JSDoc                     |
| CJS build output                                                                               | ESM is the standard; dual-publishing creates footgun edge cases; CJS consumers can use dynamic import or bundlers                                                | ESM-only; document in README                                                 |
| Custom `pipe`/`compose` functions                                                              | Rambda (or ramda, lodash/fp, etc.) already provides these; re-implementing creates compatibility questions                                                       | Keep rambda as peer dep; document that any standards-compatible pipe works   |
| Transducer protocol (ITransformer / @@transducer/init, @@transducer/result, @@transducer/step) | The cognitect-labs/transducers-js protocol adds complexity for interop that almost no one needs in the TS ecosystem                                              | Use simple `Reducer<A, B>` function type; simpler, more TypeScript-idiomatic |

## Feature Dependencies

```
LICENSE file          (independent -- just create it)
package.json metadata (independent -- just fill fields)
Fix take type safety  (independent -- redesign Reduced handling)
Edge case handling    (depends on: fix take type safety)
Test suite            (depends on: fix take type safety, edge case handling)
README rewrite        (depends on: test suite passing, to show accurate examples)
Publish to npm        (depends on: all of the above)
```

## MVP Recommendation (0.1.0 Release)

The library's core functionality is already implemented. The gap is entirely in **quality, correctness, and publishability** -- not features.

**Priority order for 0.1.0:**

1. **Fix `take` type safety** -- eliminate `as unknown as R` casts; this is the most visible type safety violation and undermines the core value proposition
2. **Edge case handling** -- negative/zero n in take/drop should match Clojure behavior
3. **Add LICENSE file** -- MIT, takes 30 seconds, blocks adoption without it
4. **Fix package.json metadata** -- remove `private: true`, add version `0.1.0`, license, repo, description, keywords
5. **Comprehensive test suite** -- cover all transducers, execution functions, composition, early termination, edge cases; this proves the library works
6. **Rewrite README** -- proper API documentation with multiple examples showing pipe composition, early termination, real-world patterns
7. **Publish**

**Defer to post-0.1.0:**

- Additional transducers (takeWhile, dropWhile, etc.) -- add based on actual user requests
- Async transducers -- separate concern, significant complexity
- TypeDoc generation -- JSDoc + README is sufficient
- Benchmarks / performance comparison -- nice to have but not blocking

## Ecosystem Context

The JavaScript/TypeScript transducer space has a few notable libraries, all of which inform what users expect:

| Library                       | Notes                                                                                                         | Relevance                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| cognitect-labs/transducers-js | Official Clojure port by Cognitect; unmaintained since ~2015; no TypeScript types; uses @@transducer protocol | Reference for Clojure-faithful behavior; do NOT copy the protocol complexity |
| jlongster/transducers.js      | Community port; unmaintained; no TS types                                                                     | Shows demand existed but was never met with modern TS                        |
| ramda / rambda                | Have transducer support baked in (`R.into`, `R.transduce`) but limited transducer set and weak types          | Users already using rambda will find transducer-ts complementary             |

The gap this library fills: **a maintained, type-safe, TypeScript-first transducer library with Clojure semantics**. Nothing else currently occupies this niche. The differentiator is type safety and TypeScript-native design, not breadth of transducers.

## Sources

- Clojure transducers reference (clojure.org/reference/transducers) -- MEDIUM confidence (training data, stable reference since 2014)
- cognitect-labs/transducers-js GitHub -- MEDIUM confidence (training data, library is archived/stable)
- npm library publishing best practices -- MEDIUM confidence (training data, well-established conventions)
- Project source code analysis -- HIGH confidence (read directly from repository)
