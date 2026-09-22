# Changelog

All notable changes to tekto. Versions follow [semantic versioning](https://semver.org);
before 1.0, breaking changes bump the minor version. See
[CONTRIBUTING.md](CONTRIBUTING.md#releases-and-versions) for how releases are made.

## Unreleased

- CI: every PR runs lint, tests and a build on a clean install; PRs outside
  `release/*` may not change `dist/`.
- Team process: `CONTRIBUTING.md`, `CODEOWNERS`, PR template.
- `package-lock.json` synced with `package.json` (`polygon-clipping`,
  `poly-decomp` were missing, so `npm ci` failed).

## 0.2.0

First tagged release: the baseline apps can pin (`github:modellstadt/tekto#v0.2.0`).
