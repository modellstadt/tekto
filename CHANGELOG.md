# Changelog

All notable changes to tekto. Versions follow [semantic versioning](https://semver.org);
before 1.0, breaking changes bump the minor version. See
[CONTRIBUTING.md](CONTRIBUTING.md#releases-and-versions) for how releases are made.

## Unreleased

## 0.3.0 — 2026-09-23

- **Changed — scene ids are per scene and restart at `clear()`.** Rebuilding the
  same content gives the same ids, so a selection (highlight + transform gizmo)
  now survives the sketch re-run that a pick triggers; before, the gizmo was left
  stranded at the origin. The stability is positional: a run that adds, removes
  or reorders objects shifts the ids after it. Ids are no longer unique across
  scenes or across clears — don't store them beyond a scene's lifetime.
- New playground page **Pick & Gizmo**, covering picking + TransformControls.
- Browser tests (Playwright): every playground page must render a live canvas
  with no console errors. `npm run test:ui`; runs in CI as a second job.
- Docs: **Two scene models — rebuilt vs retained** (README + CLAUDE.md): which
  model gives objects a lasting identity, and how to choose before writing code.

## 0.2.2 — 2026-09-22

- Fix: the move / rotate / scale gizmo never appeared with three.js r169 or newer
  (`TransformControls` is no longer an `Object3D`; its visible part is `getHelper()`).

## 0.2.1 — 2026-09-22

- **✎ Markup:** every 3D `sketch()` has a Markup button. Draw on the view and
  each mark is resolved to the objects it touches (layer, label, source line)
  and world points, saved as a bundle an agent can read. New exports:
  `MarkupBundle`, `MarkupCaptureOptions`, `MarkupObjectRef`, `MarkKind`;
  `SketchConfig.markup`; dev-server plugin `tekto/markup-vite`.
- **`npm run snap`** (`tools/snap.mjs`): capture a running sketch in headless
  Chrome, so an agent can check its own change.
- Descriptions: tekto is an AI-first platform for online CAD experiments.
- CI: every PR runs lint, tests and a build on a clean install; PRs outside
  `release/*` may not change `dist/`.
- Team process: `CONTRIBUTING.md`, `CODEOWNERS`, PR template.
- `package-lock.json` synced with `package.json` (`polygon-clipping`,
  `poly-decomp` were missing, so `npm ci` failed).

## 0.2.0

First tagged release: the baseline apps can pin (`github:modellstadt/tekto#v0.2.0`).
