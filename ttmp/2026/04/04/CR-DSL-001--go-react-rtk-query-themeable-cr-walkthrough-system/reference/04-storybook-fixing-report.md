# Storybook Fixing Report — CR-DSL-001 Phase 3

**Date:** 2026-04-04  
**Author:** AI (Manuel's coding agent)  
**Status:** Fixed and verified locally

---

## Summary

The Storybook problem described in `03-storybook-status-report.md` was no longer the active failure mode.

On `2026-04-04`, the running Storybook at `http://localhost:6008` did render, but the target story (`stories-annotationsection--annotation-warn`) was effectively unreadable because the CR Walkthrough theme tokens were not loaded for standalone renderer stories.

While fixing that, two additional Storybook/runtime issues were found:

1. `AnnotationSection.stories.tsx` still used CommonJS `require(...)` inside story render functions, which breaks under Storybook Vite/ESM with `ReferenceError: require is not defined`.
2. `walkthroughsApi.getFileContent` forced all requests into one RTK Query cache key, which caused multi-pane components such as `CompareRenderer` to render incorrect duplicated content.

---

## Actual Root Causes

### 1. Theme CSS and token root were missing in Storybook preview

Many renderer stories depend on CSS custom properties such as `--cr-color-text` and `--cr-color-severity-warn`.

Those variables are defined in:

- `frontend/packages/cr-walkthrough/src/tokens.css`
- `frontend/packages/cr-walkthrough/src/theme-dark.css`
- `frontend/packages/cr-walkthrough/src/theme-light.css`

But Storybook preview did not import those styles or wrap stories in a `data-widget="cr-walkthrough"` theme root. As a result, standalone stories rendered with unresolved CSS variables and nearly invisible text on the dark preview canvas.

### 2. Story file used `require(...)` in an ESM runtime

`frontend/packages/cr-walkthrough/src/stories/AnnotationSection.stories.tsx` loaded `SourceRenderer` via `require(...)` inside story render functions.

That works in CommonJS but fails in Storybook Vite, which runs stories as ESM modules in the browser.

### 3. RTK Query cache override was incorrect

`frontend/packages/cr-walkthrough/src/api/walkthroughsApi.ts` used:

```ts
serializeQueryArgs: ({ endpointName }) => endpointName
```

for `getFileContent`.

That collapsed all file-content requests into one cache entry regardless of `ref`, `path`, or line range. In practice:

- `CompareRenderer` asked for two different files/refs
- both panes reused the same cached payload
- the "after" pane could show the "before" content

This was a real data bug, not just a Storybook-only problem.

---

## Fixes Applied

### 1. Reworked Storybook preview setup

Updated `frontend/.storybook/preview.tsx` to:

- import `tokens.css`, `theme-dark.css`, and `theme-light.css`
- wrap all stories in a `data-widget="cr-walkthrough"` / `data-theme="dark"` container
- provide a Redux store with `walkthroughsApi.reducer` and middleware
- install lightweight Storybook-only fetch mocks for:
  - `/api/files/content`
  - `/api/files/diff`
  - `/api/repos/refs`

This makes standalone RTK Query-backed stories render correctly without requiring the Go backend.

### 2. Removed CommonJS story imports

Updated `frontend/packages/cr-walkthrough/src/stories/AnnotationSection.stories.tsx` to:

- import `SourceRenderer` at module scope
- remove all `require(...)` calls
- keep the source-renderer stories as normal JSX render functions

### 3. Removed the broken `getFileContent` cache override

Updated `frontend/packages/cr-walkthrough/src/api/walkthroughsApi.ts` to remove:

- `serializeQueryArgs`
- `merge`
- `forceRefetch`

from `getFileContent`.

This restores RTK Query's normal per-argument cache behavior so concurrent file queries do not overwrite each other.

---

## Validation

### TypeScript

Verified with:

```bash
cd frontend && npx tsc --noEmit
```

Result: no errors.

### Storybook production build

Verified with:

```bash
cd frontend && npm run build-storybook
```

Result: build completed successfully.

### Runtime verification with Playwright

Verified the following pages after restarting Storybook on port `6008`:

1. `http://localhost:6008/?path=/story/stories-annotationsection--annotation-warn`
2. `http://localhost:6008/?path=/story/stories-annotationsection--source-renderer-story`
3. `http://localhost:6008/iframe.html?id=stories-compare--default`

Observed results:

- `Annotation Warn` renders with readable themed colors
- `SourceRenderer (from fixture)` renders without `require is not defined`
- `CompareRenderer` renders different left/right pane content as intended
- no Storybook console errors remained during the final validation pass beyond the favicon 404 noise

---

## Files Changed

- `frontend/.storybook/preview.tsx`
- `frontend/packages/cr-walkthrough/src/stories/AnnotationSection.stories.tsx`
- `frontend/packages/cr-walkthrough/src/api/walkthroughsApi.ts`

---

## Conclusion

The current Storybook issue is fixed.

The older report correctly captured that Storybook was unhealthy at one point, but its primary diagnosis no longer matched the live system on `2026-04-04`. The active failures were:

- missing CR walkthrough theme setup in Storybook preview
- ESM-incompatible `require(...)` usage in stories
- an incorrect RTK Query cache override affecting file-content rendering

All three were addressed and verified locally.
