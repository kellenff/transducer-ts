# Technology Stack

**Project:** transducer-ts (test, polish, publish milestone)
**Researched:** 2026-03-22

## Existing Stack (Keep As-Is)

These are already in the project and correct. No changes needed.

| Technology     | Version | Purpose                       | Status |
| -------------- | ------- | ----------------------------- | ------ |
| TypeScript     | ^5.9.3  | Language                      | Keep   |
| tsup           | ^8.5.1  | Bundler (ESM + .d.ts)         | Keep   |
| Yarn 4 (Berry) | 4.13.0  | Package manager with PnP      | Keep   |
| oxlint         | ^1.56.0 | Linter                        | Keep   |
| oxfmt          | ^0.41.0 | Formatter                     | Keep   |
| husky          | ^9.1.7  | Git hooks                     | Keep   |
| lint-staged    | ^16.4.0 | Pre-commit staged file checks | Keep   |

## Recommended Additions

### Testing

| Technology          | Version | Purpose       | Why                                                                                                                                                                                                 | Confidence |
| ------------------- | ------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| vitest              | ^4.1.0  | Test runner   | Native ESM support, native TypeScript via esbuild (no ts-jest config), works with Yarn PnP out of the box, identical assertion API to Jest but faster. The standard choice for modern TS libraries. | HIGH       |
| @vitest/coverage-v8 | ^4.1.0  | Code coverage | V8-based coverage is fast and accurate for a pure-logic library like this. Istanbul is heavier with no benefit here. Ships as a vitest plugin -- zero extra config.                                 | HIGH       |

**Why not Jest:** Jest requires ts-jest or babel transforms, has poor native ESM support, needs explicit PnP configuration. Vitest handles all of these natively. Jest is legacy for new TypeScript libraries.

**Why not node:test:** The built-in Node test runner lacks coverage integration, watch mode ergonomics, and the rich assertion library Vitest provides. It is appropriate for simple Node scripts, not library test suites that need coverage gates.

### Publish Readiness Checks

| Technology            | Version | Purpose                         | Why                                                                                                                                                                                                                                                                                                    | Confidence |
| --------------------- | ------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| @arethetypeswrong/cli | ^0.18.2 | Type export validation          | Catches the most common TypeScript library publishing mistake: types that don't resolve correctly under different `moduleResolution` settings (node10, node16, bundler). This project has subpath exports (`./map`, `./filter`, etc.) which are especially prone to breakage. Run once before publish. | HIGH       |
| publint               | ^0.3.18 | Package.json exports validation | Validates that `exports`, `main`, `types`, `files` fields are correct and internally consistent. Catches "published but broken" before it happens. Complements attw (attw checks types, publint checks entry points).                                                                                  | HIGH       |

**Why not just manually check:** This project has 9 subpath exports. Manually verifying each one resolves correctly under node10, node16, and bundler moduleResolution is error-prone and tedious. These tools automate it.

### Package Metadata (No New Dependencies)

These are package.json field changes, not new packages.

| Field           | Value                                                                  | Why                                                                                             |
| --------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `"version"`     | `"0.1.0"`                                                              | First publishable release per PROJECT.md                                                        |
| `"private"`     | Remove this field                                                      | Currently `true` -- blocks `npm publish`                                                        |
| `"license"`     | `"MIT"`                                                                | Standard for TS utility libraries, maximizes adoption                                           |
| `"files"`       | `["dist", "LICENSE"]`                                                  | Ensures only built output ships. Prevents publishing src/, .planning/, etc.                     |
| `"sideEffects"` | `false`                                                                | Enables tree-shaking in consumer bundlers. This library is pure functions with no side effects. |
| `"engines"`     | `{"node": ">=18"}`                                                     | ES2022 target requires Node 18+. Documents this explicitly.                                     |
| `"keywords"`    | `["transducer", "transducers", "functional", "composition", "rambda"]` | npm discoverability                                                                             |
| `"repository"`  | GitHub URL                                                             | npm and IDEs link to source                                                                     |
| `"author"`      | Author name                                                            | Standard metadata                                                                               |

## Considered But Not Recommended

| Tool                    | Why Not                                                                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Jest                    | Poor ESM/PnP support, requires transform config. Vitest is strictly better for this project.                                                                               |
| node:test               | Insufficient coverage integration and assertion library for a library test suite.                                                                                          |
| c8                      | Vitest's @vitest/coverage-v8 wraps this already. No reason to use directly.                                                                                                |
| size-limit              | Overkill for a tiny utility library. The entire library is a few KB. If bundle size becomes a concern later, add it then.                                                  |
| knip                    | Useful for large projects with many dependencies. This project has 7 dev dependencies and no runtime deps. Manual review is sufficient.                                    |
| @changesets/cli         | Adds process overhead for a single-maintainer library at v0.1.0. Use manual versioning. Revisit if the project grows contributors or reaches v1.0.                         |
| pkg-pr-new              | Continuous preview releases -- not needed until there are downstream consumers testing pre-release builds.                                                                 |
| typedoc / api-extractor | API documentation generators. This library has ~7 exports with simple signatures. A hand-written README with examples is more useful and maintainable than generated docs. |
| Biome                   | Already using oxlint + oxfmt which serve the same role. No reason to switch.                                                                                               |

## Vitest Configuration Notes

Vitest requires minimal configuration for this project:

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts"], // barrel re-export, no logic
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
    },
  },
});
```

Key points:

- No `transform` or `globals` config needed (unlike Jest)
- Vitest natively understands `.ts` imports and ESM
- Works with Yarn PnP without plugins (Vitest uses esbuild internally)
- Coverage thresholds at 95% are appropriate: this is a pure-logic library where every branch matters

## Test File Conventions

| Convention | Value                                     | Why                                                |
| ---------- | ----------------------------------------- | -------------------------------------------------- |
| Location   | `src/<module>/__tests__/<module>.test.ts` | Co-located with source, standard vitest convention |
| Naming     | `*.test.ts`                               | Vitest default glob, no config needed              |
| Imports    | Direct source imports (not dist)          | Tests run against source for accurate coverage     |

## Scripts to Add

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "check": "yarn typecheck && yarn lint && yarn fmt:check && yarn test",
  "prepublishOnly": "yarn check && yarn build && attw --pack && publint"
}
```

Note: `check` script should be updated to include tests. The `prepublishOnly` script gates publishing behind all quality checks plus attw and publint validation.

## Installation

```bash
# Testing
yarn add -D vitest @vitest/coverage-v8

# Publish validation (run ad-hoc, not in CI -- optional as devDeps)
yarn add -D @arethetypeswrong/cli publint
```

Total new devDependencies: 4 packages. Minimal footprint.

## Sources

- npm registry (versions verified via `npm view <pkg> version` on 2026-03-22)
- Vitest: vitest.dev -- native ESM, esbuild-based TypeScript support, V8 coverage provider
- @arethetypeswrong/cli: github.com/arethetypeswrong/arethetypeswrong.github.io -- type export validation
- publint: publint.dev -- package.json exports linting
- Training data for ecosystem patterns and tool comparisons (MEDIUM confidence on relative assessments)
