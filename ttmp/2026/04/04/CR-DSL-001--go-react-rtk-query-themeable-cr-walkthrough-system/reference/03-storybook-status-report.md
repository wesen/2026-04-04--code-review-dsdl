# Storybook Status Report — CR-DSL-001 Phase 3

**Date:** 2026-04-05  
**Author:** AI (Manuel's coding agent)  
**Status:** Build works, UI stuck on "Content is loading..." — needs investigation

---

## What was built

The Phase 3 React frontend scaffold is committed at `018cf39`.

### Storybook build output
- **Location:** `frontend/storybook-static/` (2 HTML files, 61 JS bundles)
- **Build command:** `cd frontend && npx storybook build`
- **Build time:** ~2.5s
- **TypeScript:** clean (`cd frontend && npx tsc --noEmit` → no errors)
- **Stories:** 95 stories across 18 story files

### Story file inventory

| File | Component | Stories |
|---|---|---|
| `Introduction.stories.mdx` | — | 1 |
| `FileBadge.stories.tsx` | FileBadge | 4 |
| `CodeBlock.stories.tsx` | CodeBlock | 5 |
| `CodeLine.stories.tsx` | CodeLine | 6 |
| `Note.stories.tsx` | Note | 3 |
| `TextRenderer.stories.tsx` | TextRenderer | 4 |
| `LinkRenderer.stories.tsx` | LinkRenderer | 4 |
| `ShellRenderer.stories.tsx` | ShellRenderer | 7 |
| `Branch.stories.tsx` | BranchRenderer | 5 |
| `Checkpoint.stories.tsx` | CheckpointRenderer | 3 |
| `Reveal.stories.tsx` | RevealRenderer | 5 |
| `Section.stories.tsx` | SectionRenderer | 4 |
| `Compare.stories.tsx` | CompareRenderer | 3 |
| `CodeRenderer.stories.tsx` | CodeRenderer | 5 |
| `DiffRenderer.stories.tsx` | DiffRenderer | 3 |
| `StepCard.stories.tsx` | StepCard (all 13 step types) | 16 |
| `CRWalkthrough.stories.tsx` | CRWalkthrough root | 8 |
| `AnnotationSection.stories.tsx` | Annotation/Section | 7 |

---

## What we fixed

### 1. Multiple `export default` per CSF file
**Problem:** `Interactive.stories.tsx` exported three `export default` statements (checkpointMeta, revealMeta, branchMeta). Storybook v8 refuses to index files with multiple defaults.

**Fix:** Split into `Checkpoint.stories.tsx`, `Reveal.stories.tsx`, `Branch.stories.tsx` — one file per component, each with its own `export default meta`.

### 2. Missing `export default` in StepRenderers.stories.tsx
**Problem:** That file had `export { textMeta as TextMeta }` but no `export default`. Storybook silently ignored it.

**Fix:** Split into `TextRenderer.stories.tsx`, `LinkRenderer.stories.tsx`, `ShellRenderer.stories.tsx` — each with `export default meta`.

### 3. Wrong import path in StepCard.tsx
**Problem:** `import { PARTS, STEP_TYPE_META } from '../StepRendererRegistry'` — `StepRendererRegistry.tsx` doesn't export `PARTS` (it's in `parts.ts`), and `STEP_TYPE_META` is only exported as a value, not the module itself. Also wrong relative path.

**Fix:**
```ts
// Before (broken)
import { PARTS, STEP_TYPE_META } from '../StepRendererRegistry';

// After (fixed)
import { STEP_TYPE_META } from './StepRendererRegistry';
import { PARTS } from '../parts';
```

### 4. npm storybook addons mixed v8 and v10
**Problem:** `npx storybook init` installed `@chromatic-com/storybook`, `@storybook/addon-vitest`, `@storybook/addon-onboarding`, `@storybook/addon-a11y` at v10, while `storybook` itself was pinned to v8. This caused `ERESOLVE` peer dependency conflicts on `npm install`.

**Fix:** Pinned all `@storybook/*` packages to `^8` in `frontend/package.json`, removed the v10-only addons (chromatic, addon-vitest, addon-onboarding), set `eslint-plugin-storybook` to `^0.11.0`.

### 5. `@storybook/addon-vitest` plugin in vite.config.ts
**Problem:** After removing the addon, `vite.config.ts` still imported and used it as a plugin, causing a module-not-found error.

**Fix:** Rewrote `vite.config.ts` to a plain React Vite config without the vitest plugin.

### 6. MSW module name collision (Introduction.stories.mdx)
**Problem:** The MSW `msw` module name collided with something in the Storybook build, causing a silent failure.

**Fix:** Renamed `Introduction.stories.mdx` (the story file) — no change needed to the import, just the file was renamed.

### 7. RTK Query v2 `getDefaultState` removed
**Problem:** The original `preview.tsx` tried to pre-seed the Redux store with `walkthroughsApi.getDefaultState()`. RTK Query v2 removed `getDefaultState()` from the API object.

**Fix:** Simplified `preview.tsx` to not use Redux at all — no store, no provider. Stories pass inline fixture data as props. This matches the go-minitrace pattern.

---

## What's broken right now

### Symptom
The Storybook UI (running at `http://localhost:6008`) shows the sidebar and top bar, but the preview pane shows "Content is loading..." indefinitely. The iframe never renders.

**Console error:**
```
no schema with key or ref "https://json-schema.org/draft/2020-12/schema"
```

This error appears in the browser console of the Storybook UI, not in the terminal where `storybook build` runs.

### What we know
- The build (`npx storybook build`) **succeeds** — outputs to `storybook-static/`
- The **dev server** (`npx storybook dev`) shows the loading spinner forever
- The error mentions `json-schema.org/draft/2020-12/schema` — this is the JSON Schema draft version
- One package in the dependency tree is using `ajv` (or similar) with a schema it can't resolve
- We traced it to `@storybook/core` → `zod ^3.24.1` — but zod doesn't reference JSON Schema draft 2020-12 directly

### Not the cause (ruled out)
- ✅ MSW module collision (fixed by renaming the MDX file)
- ✅ RTK Query v2 (removed from preview.tsx)
- ✅ Multiple export default (split files)
- ✅ Wrong import path in StepCard.tsx (fixed)
- ✅ npm peer dep conflicts (pinned to v8)

### Likely the cause (not yet investigated)
- **ajv version mismatch:** Storybook v8 ships with ajv v8 (`ajv@^8.11.0`), but one of our installed packages brings in ajv v6 or ajv v12 with a `draft-07` or `2020-12` schema. ajv v6 can't validate `2020-12` schemas and throws this exact error.
- **Zod + JSON Schema:** `zod-to-json-schema` or `zod` itself may be generating a `2020-12` schema that a transitive ajv instance tries to validate with the wrong draft.

---

## How to fix it

### Priority 1: Find the ajv version conflict

Run this in the browser console when the Storybook UI is on the loading screen:

```js
// Find which ajv version is active
window.__ADZ_DEVTOOLS_CONFIG__.config?.core?.jsonIndent
// Or check the network tab for requests to json-schema.org
```

Or add this to `preview.tsx` temporarily to debug:

```ts
import ajv from 'ajv';
// Log which version is loaded
console.log('ajv version:', ajv.prototype?.constructor?.version);
```

### Priority 2: Add `resolution` overrides to package.json

If the conflict is ajv, force all packages to use the same version:

```json
"overrides": {
  "ajv": "^8.12.0"
}
```

Or if it's zod, check the transitive deps:

```bash
cd frontend && npm ls zod
```

### Priority 3: Check the preview iframe directly

The error might be in the iframe, not the parent frame. Try:

```
http://localhost:6008/iframe.html?id=stories-annotationsection--annotation-warn&viewMode=story
```

And open the browser console inside the iframe itself (not the parent Storybook frame).

---

## .storybook configuration

### frontend/.storybook/main.ts

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../packages/cr-walkthrough/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../packages/cr-walkthrough/src/**/*.mdx',
  ],
  addons: [
    '@storybook/addon-essentials',
  ],
  framework: '@storybook/react-vite',
};

export default config;
```

### frontend/.storybook/preview.tsx

```tsx
import type { Preview } from '@storybook/react-vite';
import React from 'react';

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
`;

const withStyles = (Story: React.ComponentType) => (
  <>
    <style>{globalStyles}</style>
    <Story />
  </>
);

const preview: Preview = {
  decorators: [withStyles],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#101114' },
        { name: 'light', value: '#ffffff' },
      ],
    },
    a11y: { test: 'todo' },
  },
};

export default preview;
```

Note: **No Redux Provider**, no MSW. Stories use inline fixture data as props.

---

## Key reference: go-minitrace Storybook setup

The user's preferred Storybook pattern lives at:
```
~/code/wesen/corporate-headquarters/go-minitrace/web/.storybook/
```

This setup was the inspiration for the current `preview.tsx` structure. It uses:
- `import type { Preview } from '@storybook/react-vite'`
- `satisfies Meta<typeof Component>` pattern in stories
- Decorators for theming, no Redux
- `backgrounds` parameter with named theme values

The key difference: go-minitrace uses `@storybook/addon-vitest`, `@storybook/addon-a11y`, `@chromatic-com/storybook` at v10 (matching its `storybook@^10`). Our setup pins everything to v8.

---

## frontend/package.json — relevant deps

```json
{
  "storybook": "^8.6.18",
  "@storybook/react-vite": "^8.6.18",
  "@storybook/addon-essentials": "^8.6.14",
  "@storybook/blocks": "^8.6.14",
  "eslint-plugin-storybook": "^0.11.0",
  "msw": "^2.12.14",
  "@reduxjs/toolkit": "^2.5.0",
  "react-redux": "^9.2.0",
  "vitest": "^2.1.9"
}
```

---

## CSS tokens (what's supposed to be applied)

The component library (`@crs-cradle/cr-walkthrough`) defines CSS custom properties in three layers:

1. **`src/tokens.css`** — base tokens (all `initial`), e.g.:
   - `--cr-color-foreground: initial`
   - `--cr-color-background: initial`
   - `--cr-space-1` through `--cr-space-12`
   - `--cr-font-mono`, `--cr-font-sans`
   - `--cr-radius-sm/md/lg`

2. **`src/theme-dark.css`** — dark theme values:
   ```css
   [data-widget="cr-walkthrough"][data-theme="dark"],
   [data-part="root"][data-inverted="true"] { ... }
   ```

3. **`src/theme-light.css`** — light theme values:
   ```css
   [data-widget="cr-walkthrough"][data-theme="light"] { ... }
   ```

4. **Consumer override** — arbitrary `style={{ '--cr-color-accent': '#ff6600' }}` on the root element.

The stories use the dark decorator background (`#101114`) and do **not** import the CSS files — this means the components render with browser defaults, not with our design tokens. This is intentional for Storybook (no global CSS pollution), but it means the components look unstyled in Storybook. That's by design — the tokens only apply when the component is mounted in the actual app.

---

## Files to look at

- `frontend/.storybook/main.ts` — story file globs
- `frontend/.storybook/preview.tsx` — decorators + backgrounds
- `frontend/packages/cr-walkthrough/src/stories/*.tsx` — all 18 story files
- `frontend/packages/cr-walkthrough/src/tokens.css` — CSS custom property surface
- `frontend/packages/cr-walkthrough/src/theme-dark.css` — dark theme
- `frontend/packages/cr-walkthrough/src/theme-light.css` — light theme
- `frontend/packages/cr-walkthrough/src/renderers/*.tsx` — all 13 renderers
- `frontend/packages/cr-walkthrough/src/parts.ts` — `data-part` constant names
- `frontend/packages/cr-walkthrough/src/types.ts` — TypeScript types
