# Contributing

Thanks for contributing to `@fromo/transducer-ts`.

## Prerequisites

- Node.js `>=20`
- Yarn 4 (Berry, PnP)

## Setup

```bash
yarn install
```

## Validation Commands

Run these before opening a PR:

```bash
yarn check
yarn test
yarn build
```

Use `yarn test:coverage` when changing runtime behavior.

## Development Notes

- The project is ESM-only (`"type": "module"`).
- Source imports use `.js` extensions in TypeScript files.
- Each module in `src/` has its own `tsconfig.json` and is wired through project references.

## Pull Requests

- Keep changes scoped and include tests for behavioral/type-level changes.
- Update docs (`README.md`, `llms.txt`, `AGENTS.md`) when API semantics change.
