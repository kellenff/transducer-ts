# Domain Pitfalls

**Domain:** TypeScript transducer library -- testing, type safety fixes, npm publish preparation
**Researched:** 2026-03-22
**Confidence:** HIGH (training data; well-established TypeScript/npm patterns)

## Critical Pitfalls

Mistakes that cause rewrites, broken consumers, or unsound types.

### Pitfall 1: Reduced Sentinel Leaks Through the Type System

**What goes wrong:** The `take` transducer wraps results in `Reduced<R>` but the `Reducer<R, A>` return type is just `R`. The current code uses `as unknown as R` to force `Reduced<R>` into `R`, which means `isReduced()` checks in `transduce` work at runtime but the type system has no knowledge that a reducer _might_ return `Reduced<R>`. If someone refactors `transduce` or writes a custom reduction loop trusting the `R` return type, they will silently miss early termination signals.

**Why it happens:** Clojure's transducer protocol embeds early termination in the return channel -- `reduced` wraps the accumulator and the reduction loop unwraps it. In TypeScript, this means the reducer's return type is actually `R | Reduced<R>`, but expressing that cleanly while keeping composition ergonomic is hard.

**Consequences:**

- Type unsoundness -- `acc` after calling `xrf(acc, item)` is typed as `R` but may actually be `Reduced<R>`. Any operation on `acc` before the `isReduced` check could fail at runtime.
- The `into` function mutates the accumulator (`acc.push(x)`) -- if `take` returned a `Reduced<R>` and something downstream tried to push to it, it would crash. Currently safe only because `transduce` checks immediately, but fragile.

**Prevention:**

- Make the return type of the inner (stateful) reducing function `R | Reduced<R>` and propagate that through `transduce`. The `Transducer` type becomes: `<R>(rf: Reducer<R, B>) => (acc: R, input: A) => R | Reduced<R>`.
- Alternatively, keep the current `Reducer<R, A>` signature but introduce a separate `SteppingFn<R, A> = (acc: R, input: A) => R | Reduced<R>` type that `transduce` expects internally. This avoids breaking the simple `Reducer` type for consumers who compose with `pipe`.
- The key design question: does the `Reduced` union live in the `Transducer` type signature (visible to consumers) or only inside the transducer-to-transduce contract (hidden)? Clojure hides it. Recommend hiding it -- introduce `SteppingFn` for internal use, keep `Reducer` clean for external API.

**Detection:** Any `as unknown as` cast in the codebase is a warning sign. Grep for `as unknown` -- there are currently two in `take/index.ts` and one in `transduce/index.ts`.

**Phase:** Fix during the type safety phase, before writing tests. Tests written against the unsound types will need rewriting if signatures change.

---

### Pitfall 2: Stateful Transducer Tests Pass Individually but Fail When Composed

**What goes wrong:** `take` and `drop` use mutable closure state (`let taken = 0`, `let dropped = 0`). Each call to the transducer factory (`take(3)`) creates a fresh closure, but the _reducer_ it returns captures that state. If a test reuses the same reducer instance across multiple collections, state carries over and tests produce wrong results. Worse, tests pass when run in isolation but fail when run together if there is accidental sharing.

**Why it happens:** Transducers are meant to be single-use after `xform(rf)` is called -- the resulting reducer is stateful and should be used for exactly one reduction. This is a Clojure convention that is not enforced by the type system.

**Consequences:**

- Tests that appear to verify `take(2)` correctly may actually be testing against stale state from a previous invocation.
- Composition tests (e.g., `pipe(filter(...), take(2))`) that reuse a composed transducer across multiple `transduce` calls will silently produce wrong results.

**Prevention:**

- In tests, always create fresh transducers for each assertion. Never store `const xf = take(3)(rf)` and reuse it across multiple `transduce` calls.
- Add an explicit test that verifies a transducer can be used multiple times by calling the _factory_ (`take(3)`) multiple times, not reusing the _reducer_.
- Consider adding a "double-use" test as a negative test case -- call `transduce` twice with the same `xform(rf)` result and assert the second call produces incorrect results (documenting the expected behavior).

**Detection:** Tests that work when run individually (`vitest run src/take`) but fail when run together (`vitest run`). Also, tests with `beforeEach` that create the reducer once.

**Phase:** Testing phase. Establish this as a test convention from the start.

---

### Pitfall 3: package.json Missing Fields Breaks npm Publish Silently

**What goes wrong:** The current `package.json` has `"private": true` which blocks `npm publish` entirely. Beyond removing that, several fields are required for a well-formed package but npm will not warn about their absence: `version`, `description`, `license`, `files`, `main`, `types`, `repository`, `keywords`. Missing `files` is the worst -- without it, npm publishes the entire project directory (including `.yarn/`, `.pnp.cjs`, source files, etc.), bloating the package and potentially leaking development artifacts.

**Why it happens:** During development, `"private": true` is correct -- it prevents accidental publish. But when transitioning to publish-ready, the checklist of fields to add/change is long and none of them cause build errors.

**Consequences:**

- Missing `files`: Package is 10-100x larger than necessary. Consumers download source, PnP files, config files.
- Missing `main`/`types` at top level: Some tools (older bundlers, certain IDE integrations) ignore `exports` and fall back to `main`/`types`. Without them, the package appears to have no entry point.
- Missing `license`: npm shows "UNLICENSED" which scares away users. Some corporate policies block unlicensed packages.
- Missing `engines`: Consumers on old Node versions get cryptic ESM errors instead of a clear compatibility message.

**Prevention:**

- Use a publish-readiness checklist (below).
- Run `npm pack --dry-run` and inspect the file list before publishing. This shows exactly what will be in the tarball.
- Add `"files": ["dist"]` to restrict the package to only built output.
- Add `"main": "./dist/index.js"` and `"types": "./dist/index.d.ts"` alongside `exports` for backward compatibility.
- Set `"version": "0.1.0"`, add `"license": "MIT"` (or chosen license), add `"description"`, `"repository"`, `"keywords"`.
- Remove `"private": true`.

**Publish-readiness checklist:**

```
[ ] "private" removed
[ ] "version" set to "0.1.0"
[ ] "license" set
[ ] "description" set
[ ] "files": ["dist"] added
[ ] "main" and "types" top-level fields added
[ ] "repository" set
[ ] "keywords" added
[ ] "engines": { "node": ">=18" } added (ESM requires modern Node)
[ ] npm pack --dry-run shows only dist/ files
[ ] Built .d.ts files checked -- no internal types leaking
```

**Detection:** `npm pack --dry-run` is the single most valuable pre-publish check. If the tarball is over 50KB for a library this size, something is wrong.

**Phase:** Publish preparation phase, after all code changes are complete.

---

### Pitfall 4: tsup dts Generation Emits Different Types Than tsc

**What goes wrong:** tsup uses a separate DTS generation pipeline (rollup-plugin-dts or its own bundled approach) that may resolve types differently than `tsc --build`. The project uses TypeScript project references with per-module `tsconfig.json` files and `.ts` import extensions with `allowImportingTsExtensions`. tsup's DTS bundling can: (a) fail to resolve `.ts` extensions in import paths within declaration files, (b) inline types differently than tsc's incremental build, or (c) silently drop generic constraints during declaration bundling.

**Why it happens:** The project has an unusual TypeScript setup: project references + `allowImportingTsExtensions` + `emitDeclarationOnly`. tsup's `dts: true` runs a parallel declaration emit that may not respect all project reference boundaries.

**Consequences:**

- Published `.d.ts` files have wrong or `any` types where generics should be.
- Consumers get no type errors when misusing the API because the declaration files are too permissive.
- The `Transducer` type's higher-kinded generic (`<R>(rf: Reducer<R, B>) => Reducer<R, A>`) is particularly prone to being flattened during DTS bundling.

**Prevention:**

- After building, inspect the generated `dist/*.d.ts` files manually. Verify that `Transducer`, `Reducer`, and `Reduced` types appear correctly with their generic parameters.
- Add a "type smoke test": create a separate `test-types.ts` file that imports from the built `dist/` and attempts incorrect usage -- it should fail to compile. Run `tsc --noEmit` on it as part of CI.
- Compare `yarn typecheck` output with `yarn build` DTS output for discrepancies.

**Detection:** Consumer reports "everything is typed as `any`" or "I can pass wrong types with no error." Also: inspect `dist/index.d.ts` -- if `Transducer` is defined without its `<A, B>` parameters, DTS generation is broken.

**Phase:** Build/publish preparation phase. Verify after any type signature changes.

---

## Moderate Pitfalls

### Pitfall 5: ESM-Only Package Breaks CommonJS Consumers

**What goes wrong:** The package ships ESM only (`"type": "module"`, `format: ["esm"]` in tsup). Consumers using CommonJS (still common in Node.js CLI tools, older projects, Jest default config) cannot `require()` the package and get `ERR_REQUIRE_ESM`.

**Prevention:**

- This is a deliberate choice and acceptable for a 0.1.0 library targeting modern TypeScript consumers. Document it in the README: "This package is ESM-only. Requires Node.js >= 18."
- Do NOT add a CJS build "just in case" -- dual-package hazard (two copies of stateful transducers) is worse than CJS incompatibility.
- Add `"engines": { "node": ">=18" }` to package.json so npm warns consumers.

**Detection:** GitHub issues from CJS users. Consider adding a note in the README.

**Phase:** Documentation/publish phase.

---

### Pitfall 6: Testing Composition With rambda pipe Requires Careful Type Assertions

**What goes wrong:** `rambda.pipe` has fixed-arity overloads. Composing transducers through `pipe` works at runtime but TypeScript may not infer the composed transducer type correctly, especially with 3+ transducers. Tests that use `pipe(map(f), filter(p), take(n))` may need explicit type annotations or the type checker rejects valid code.

**Why it happens:** `pipe` infers types left-to-right through overloads. Transducers are contravariant in their input (`Transducer<A, B>` consumes `A` and produces `B`), which means pipe's left-to-right inference works naturally for the outer function signature but may struggle with the inner generic `R` parameter.

**Consequences:**

- Tests fail to compile even though the runtime behavior is correct.
- Developers add `as any` casts to make tests pass, hiding real type errors.

**Prevention:**

- Test `pipe` composition explicitly and early. If types do not flow through `pipe` for 2-arity, 3-arity, and 4-arity compositions, this is a library design issue that needs addressing before 0.1.0.
- If `pipe` inference breaks at high arities, document the limit and recommend explicit typing for complex compositions.
- Consider testing with both `pipe(a, b)` and manual composition `(rf) => a(b(rf))` to separate pipe-related type issues from transducer-related ones.

**Detection:** TypeScript errors in test files when composing 3+ transducers with `pipe`. Error messages about `R` not being assignable.

**Phase:** Testing phase. Test pipe composition before writing all other tests.

---

### Pitfall 7: `into` Mutates the Target Array -- Tests Must Account for Aliasing

**What goes wrong:** `into` pushes directly into the `to` array parameter. If tests pass the same array reference to multiple `into` calls or assert on the array before `into` completes (not an issue with synchronous code, but a logical trap), results are surprising. More subtly, `into(existingArray, xform, source)` modifies `existingArray` in place AND returns it -- tests that compare with `toEqual` pass but tests that check reference identity may reveal unexpected mutation semantics.

**Prevention:**

- Always test `into` with a fresh empty array: `into([], xform, source)`.
- Add a test that verifies `into` returns the same reference as the input array (documenting the mutation contract).
- Add a test that starts with a non-empty target array to verify elements are appended, not replaced.

**Detection:** Tests that pass `into(sharedArray, ...)` in a `describe` block where `sharedArray` is not reset between tests.

**Phase:** Testing phase.

---

### Pitfall 8: Forgetting to Reset Transducer State Discussion in README

**What goes wrong:** Users compose a transducer, use it once, then reuse it expecting fresh state. Since `take` and `drop` capture mutable state in the closure returned by `xform(rf)`, reuse produces wrong results. If the README shows examples without explaining this, users file bugs.

**Prevention:**

- Document clearly that transducers (the factories like `take(3)`) are reusable, but the result of applying them to a reducer (`take(3)(rf)`) is single-use.
- Show examples using `sequence` and `into` which handle this correctly (they call `xform(rf)` internally each time).
- Avoid README examples that store `const stepper = take(3)(myReducer)` and call it manually.

**Detection:** User issues about "take only works the first time."

**Phase:** Documentation phase.

---

## Minor Pitfalls

### Pitfall 9: Vitest With Yarn PnP Requires Explicit Configuration

**What goes wrong:** Vitest needs to resolve dependencies through Yarn PnP's virtual filesystem. Without configuration, Vitest may fail to find the project's TypeScript files or dependencies with errors like `Cannot find module`.

**Prevention:**

- Install `@vitest/runner` and ensure `vitest.config.ts` does not set a custom resolver that conflicts with PnP.
- Yarn PnP + Vitest generally works out of the box as of Vitest 1.x+ since it respects Node's module resolution. But if issues arise, `yarn dlx vitest` ensures PnP context is active.
- Make sure vitest is added to devDependencies through `yarn add -D vitest`, not globally installed.

**Detection:** `Module not found` errors when running `yarn vitest`. Resolve by checking `.pnp.cjs` is loading.

**Phase:** Testing setup (first task).

---

### Pitfall 10: Negative `n` Edge Cases Are Underspecified

**What goes wrong:** `take(-1)` currently enters the `taken >= n` branch immediately (since `0 < -1` is false, it goes to the else branch and returns `reduced(acc)`), effectively taking 0 elements. `drop(-1)` enters the `dropped < n` branch never (since `0 < -1` is false), effectively dropping 0 elements (passing all through). This happens to match Clojure semantics, but it is accidental -- the code does not explicitly handle negative values.

**Prevention:**

- Add explicit tests for `take(0)`, `take(-1)`, `drop(0)`, `drop(-1)` that assert the Clojure-compatible behavior.
- Decide whether to add explicit guards (`if (n <= 0)`) for clarity/performance or rely on the current implicit behavior. Recommend: add the guards for readability and a minor performance win (avoid creating closures that will never be used meaningfully), but the tests are the priority since the current behavior is already correct.

**Detection:** No tests covering n <= 0 means accidental breakage during refactoring goes unnoticed.

**Phase:** Testing phase.

---

### Pitfall 11: `npm pack` Includes Unexpected Files Due to Missing `.npmignore` or `files` Field

**What goes wrong:** Without a `"files"` field in package.json, npm falls back to `.npmignore` (if it exists) or `.gitignore`. Since `.gitignore` is designed for git (not npm), it may exclude things npm needs (unlikely) or include things npm should not have (likely -- `.planning/`, `CLAUDE.md`, test files, config files).

**Prevention:**

- Use `"files": ["dist"]` in package.json. This is a whitelist approach -- only `dist/` is published. The `package.json`, `README.md`, and `LICENSE` are always included automatically by npm regardless of the `files` field.
- Do NOT use `.npmignore` -- the `files` whitelist is safer and easier to reason about.

**Detection:** `npm pack --dry-run` showing files outside `dist/`.

**Phase:** Publish preparation phase.

---

## Phase-Specific Warnings

| Phase Topic                  | Likely Pitfall                                  | Mitigation                                               |
| ---------------------------- | ----------------------------------------------- | -------------------------------------------------------- |
| Testing setup                | Vitest + Yarn PnP resolution (Pitfall 9)        | Install via `yarn add -D vitest`, test basic run first   |
| Testing stateful transducers | State leaks between test cases (Pitfall 2)      | Fresh transducer per assertion, add reuse negative tests |
| Testing composition          | rambda pipe type inference (Pitfall 6)          | Test pipe composition early, before writing full suite   |
| Testing into/sequence        | Array mutation aliasing (Pitfall 7)             | Fresh arrays per test, test mutation contract explicitly |
| Testing edge cases           | Negative n underspecified (Pitfall 10)          | Add explicit n<=0 tests matching Clojure semantics       |
| Type safety fixes            | Reduced sentinel type unsoundness (Pitfall 1)   | Introduce SteppingFn type, fix before writing tests      |
| Build verification           | tsup DTS divergence from tsc (Pitfall 4)        | Inspect dist/\*.d.ts, add type smoke test                |
| Publish preparation          | Missing package.json fields (Pitfall 3)         | Run npm pack --dry-run, use checklist                    |
| Publish preparation          | Unexpected files in tarball (Pitfall 11)        | Add "files": ["dist"] field                              |
| Documentation                | Stateful transducer reuse confusion (Pitfall 8) | Document factory vs reducer lifecycle                    |
| Documentation                | ESM-only compatibility (Pitfall 5)              | Document Node >= 18 requirement                          |

## Sources

- Direct code analysis of the transducer-ts codebase (HIGH confidence -- based on actual code inspection)
- TypeScript/npm packaging best practices (HIGH confidence -- well-established patterns, though sourced from training data rather than live verification)
- Clojure transducer semantics for behavioral correctness (HIGH confidence -- stable protocol since Clojure 1.7)
