## What and why

<!-- One concrete change. Unrelated cleanups go in their own PR. -->

## Checklist

- [ ] `npm run lint` and `npm test` pass (CI checks this too)
- [ ] No changes to `dist/` (only release PRs rebuild it)
- [ ] Public API touched? Then `src/index.ts`, the README's "What's available" list and `CHANGELOG.md` (Unreleased) are updated, and breaking changes are marked **Breaking**
- [ ] Visual change? A before/after screenshot or `npm run snap` bundle is attached
