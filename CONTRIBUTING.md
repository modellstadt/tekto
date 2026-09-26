# Contributing to tekto

tekto is shared by several people and by the coding agents they work with, and
apps in other repos depend on it. These rules keep that from turning into chaos.
Most of them are enforced by GitHub, so you find out early.

## The workflow

1. **Branch from `main`.** Name it after the change: `feat/markup-export`,
   `fix/nurbs-seam`, `docs/readme-intro`. Nobody pushes to `main` directly, the
   maintainer included (branch protection applies to admins too).
2. **One concrete change per PR.** Unrelated cleanups get their own PR. Small PRs
   get reviewed quickly and rarely conflict.
3. **Open a PR.** The template has a short checklist.
4. **CI must be green.** Every PR runs `npm run lint`, `npm test` and
   `npm run build` on a clean install (`npm ci`). Run the first two locally first.
   A second job runs the browser tests (`npm run test:ui`), which load every
   playground page in Chromium and fail on any console error.
5. **Review.** `.github/CODEOWNERS` requests the right reviewer automatically.
6. **Squash-merge**, then delete the branch.

Keep your branch current with `git pull --rebase origin main` rather than
merge commits.

## Never edit `dist/` in a normal PR

`dist/` is committed so apps can install tekto from GitHub without a build step.
It is rebuilt **only** in release PRs; otherwise every pair of open PRs would
conflict on generated files. CI fails a non-release PR that touches `dist/`.
If you ran `npm run build` by accident: `git checkout origin/main -- dist`.

## Two kinds of test

- **`npm test`** (vitest, `tests/*.test.ts`) — geometry and logic, in Node.
- **`npm run test:ui`** (Playwright, `tests/e2e/*.spec.ts`) — the library in a
  real browser: every playground page must mount a live canvas and log nothing.
  This is what catches renderer breakage that unit tests cannot see, such as a
  three.js API that moved under us. Add a slug to `PAGES` when you add a page.
  First run: `npx playwright install chromium`.

## The public API is a promise

Everything exported from `src/index.ts` (and `src/react.ts` for `tekto/react`) is
what apps rely on. Deep imports are not allowed.

- **Adding** an export: fine. Update the README's "What's available" list.
- **Renaming, removing or changing the behaviour** of an export is a
  **breaking change**. Mark it **Breaking** in `CHANGELOG.md` with how to migrate,
  and rename every caller in the same PR. No backward-compat aliases: one name
  per concept. Apps pin a version, so they upgrade deliberately and read the
  changelog then — an alias would only postpone that.

Every PR that users would notice adds a line under **Unreleased** in
`CHANGELOG.md`.

## Releases and versions

tekto follows [semantic versioning](https://semver.org). Before 1.0, a breaking
change bumps the **minor** version (0.2 → 0.3), anything else the **patch**.

To release (maintainer):

1. Branch `release/vX.Y.Z` from `main`.
2. Bump `version` in `package.json`, move the **Unreleased** notes in
   `CHANGELOG.md` under the new version, run `npm run build` and commit `dist/`.
3. PR, green CI, squash-merge.
4. Tag the merge commit and push the tag:
   `git tag -a vX.Y.Z -m "tekto vX.Y.Z" && git push origin vX.Y.Z`

## Apps pin a release

Apps in other repos must depend on a release, never on the moving `main`. Two
ways, same effect:

```json
"tekto": "github:modellstadt/tekto#v0.4.0"
```

or a **vendored copy** of a release — its `package.json` plus `dist/` checked
into the app under `vendor/tekto`:

```json
"tekto": "file:vendor/tekto"
```

Vendor when the app is installed where a git dependency is fragile: a `github:`
spec forces a build-from-source on install, needs git (and keys) on the machine,
and some npm versions choke on the `#tag` URL. That broke a partner's install of
buchholz-stair once, which is why it vendors and guards against git specs in
`prebuild`. Vercel-deployed apps and anything a partner installs should vendor;
your own dev machine can pin the tag.

Either way, upgrading is a deliberate change in the app: bump the tag or refresh
the vendored copy, read the changelog, run the app. Only the maintainer's local
workspace uses `"file:../tekto"` to develop tekto and an app side by side.

## Working with coding agents

[CLAUDE.md](CLAUDE.md) holds the rules agents follow in this repo. They follow
the same workflow as people: a branch, a PR, green CI and a human review. If an
agent makes the same mistake twice, add a rule to `CLAUDE.md` in its own PR.

## Adding someone to the team

The maintainer adds them as a collaborator (Settings → Collaborators) and, once
they own an area, adds a line for it to `.github/CODEOWNERS`.
