# Requirements: transducer-ts

**Defined:** 2026-03-22
**Core Value:** Type-safe transducer composition that feels natural in TypeScript and works correctly out of the box.

## v1 Requirements

Requirements for 0.1.0 release. Each maps to roadmap phases.

### Type Safety

- [ ] **TYPE-01**: Eliminate `as unknown as R` casts in take transducer by redesigning Reduced type handling
- [ ] **TYPE-02**: Eliminate `as unknown as R` cast in transduce function (same Reduced redesign)
- [ ] **TYPE-03**: `take(n)` where n < 0 treats n as 0 (matches Clojure behavior)
- [ ] **TYPE-04**: `drop(n)` where n < 0 passes all elements (matches Clojure behavior)
- [ ] **TYPE-05**: `take(0)` returns empty result
- [ ] **TYPE-06**: `drop(0)` passes all elements

### Testing

- [ ] **TEST-01**: Vitest configured and running with Yarn PnP
- [ ] **TEST-02**: Unit tests for map transducer (basic transform, identity, type preservation)
- [ ] **TEST-03**: Unit tests for filter transducer (basic predicate, always-true, always-false)
- [ ] **TEST-04**: Unit tests for take transducer (basic take, n > length, n = 0, early termination proof)
- [ ] **TEST-05**: Unit tests for drop transducer (basic drop, n > length, n = 0)
- [ ] **TEST-06**: Unit tests for transduce function (basic reduction, early termination, Reduced unwrapping)
- [ ] **TEST-07**: Unit tests for into function (array mutation, empty input, with transducer)
- [ ] **TEST-08**: Unit tests for sequence function (basic usage, empty input, composition)
- [ ] **TEST-09**: Composition tests — multiple transducers via pipe (2-deep, 3-deep, filter+map+take)
- [ ] **TEST-10**: Edge case tests — empty collections, single element, negative n values
- [ ] **TEST-11**: Type-level tests using expectTypeOf — verify inference through pipe chains at 1, 2, 3+ arity
- [ ] **TEST-12**: Coverage threshold configured at 95%+

### Package Metadata

- [ ] **PKG-01**: version set to 0.1.0
- [ ] **PKG-02**: UNLICENSE file in repo root
- [ ] **PKG-03**: license field set to "Unlicense" in package.json
- [ ] **PKG-04**: repository, description, keywords, author fields populated
- [ ] **PKG-05**: `private: true` removed from package.json
- [ ] **PKG-06**: `files` field set to `["dist"]`
- [ ] **PKG-07**: `engines` field specifying minimum Node version
- [ ] **PKG-08**: `sideEffects: false` for tree-shaking
- [ ] **PKG-09**: `@arethetypeswrong/cli` validates all subpath exports
- [ ] **PKG-10**: `publint` passes with no errors
- [ ] **PKG-11**: `prepublishOnly` script gates check + build + attw + publint

### Documentation

- [ ] **DOC-01**: README rewritten with install instructions
- [ ] **DOC-02**: README includes API reference for all exported functions
- [ ] **DOC-03**: README includes composition examples with pipe
- [ ] **DOC-04**: README includes early termination example (take)
- [ ] **DOC-05**: README documents Clojure semantics design decision
- [ ] **DOC-06**: README documents ESM-only, rambda peer dep
- [ ] **DOC-07**: JSDoc with @param, @returns, @example on all exported functions

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Additional Transducers

- **XDCR-01**: takeWhile transducer
- **XDCR-02**: dropWhile transducer
- **XDCR-03**: mapIndexed transducer (access element index)
- **XDCR-04**: dedupe transducer
- **XDCR-05**: partition transducers (partitionBy, partitionAll)

### Advanced Features

- **ADV-01**: Async transducer support (asyncTransduce)
- **ADV-02**: Property-based tests with fast-check
- **ADV-03**: Performance benchmarks
- **ADV-04**: TypeDoc generated API reference

## Out of Scope

| Feature                               | Reason                                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Async transducers                     | Doubles API surface and type complexity; different semantics (backpressure, error propagation) |
| CJS build                             | ESM is the standard; dual-publishing creates edge cases                                        |
| Custom pipe/compose                   | rambda (or any standards-compatible pipe) already provides this                                |
| Transducer protocol (@@transducer/\*) | Adds complexity for interop nobody needs in TS ecosystem                                       |
| Lazy evaluation / iterator protocol   | Clojure transducers are eager; laziness changes mental model                                   |
| Runtime input validation              | Library targets TypeScript consumers; types enforce contracts                                  |

## Traceability

| Requirement | Phase   | Status  |
| ----------- | ------- | ------- |
| TYPE-01     | Phase 1 | Pending |
| TYPE-02     | Phase 1 | Pending |
| TYPE-03     | Phase 2 | Pending |
| TYPE-04     | Phase 2 | Pending |
| TYPE-05     | Phase 2 | Pending |
| TYPE-06     | Phase 2 | Pending |
| TEST-01     | Phase 3 | Pending |
| TEST-02     | Phase 4 | Pending |
| TEST-03     | Phase 4 | Pending |
| TEST-04     | Phase 5 | Pending |
| TEST-05     | Phase 5 | Pending |
| TEST-06     | Phase 6 | Pending |
| TEST-07     | Phase 6 | Pending |
| TEST-08     | Phase 6 | Pending |
| TEST-09     | Phase 7 | Pending |
| TEST-10     | Phase 7 | Pending |
| TEST-11     | Phase 7 | Pending |
| TEST-12     | Phase 3 | Pending |
| PKG-01      | Phase 8 | Pending |
| PKG-02      | Phase 8 | Pending |
| PKG-03      | Phase 8 | Pending |
| PKG-04      | Phase 8 | Pending |
| PKG-05      | Phase 8 | Pending |
| PKG-06      | Phase 8 | Pending |
| PKG-07      | Phase 8 | Pending |
| PKG-08      | Phase 8 | Pending |
| PKG-09      | Phase 8 | Pending |
| PKG-10      | Phase 8 | Pending |
| PKG-11      | Phase 8 | Pending |
| DOC-01      | Phase 9 | Pending |
| DOC-02      | Phase 9 | Pending |
| DOC-03      | Phase 9 | Pending |
| DOC-04      | Phase 9 | Pending |
| DOC-05      | Phase 9 | Pending |
| DOC-06      | Phase 9 | Pending |
| DOC-07      | Phase 9 | Pending |

**Coverage:**

- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---

_Requirements defined: 2026-03-22_
_Last updated: 2026-03-22 after roadmap creation_
