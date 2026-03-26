# Releasing

This project publishes to npm from GitHub Actions using `NPM_TOKEN`.

## One-Time Setup

- Ensure the `npm-publish` environment exists in GitHub with required reviewers.
- Ensure `NPM_TOKEN` is configured as a repository secret.

## Release Checklist

1. Ensure `main` is green and up to date.
2. Run local verification:

```bash
yarn check
yarn test
yarn build
```

3. Bump version in `package.json`.
4. Commit the version bump to `main`.
5. Create and push a tag in the format `vX.Y.Z`:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

6. Confirm the `Publish` workflow succeeds.
7. Verify the package/version on npm.

## Manual Publish Trigger

`Publish` also supports `workflow_dispatch` for emergency/manual runs. Use it only when you need to re-run a failed publish for an already tagged release.
