---
Title: "Theming Guide — CSS Custom Properties"
Slug: cr-dsl-theming
SectionType: GeneralTopic
Topics:
  - cr-dsl
  - css
  - theming
  - design
  - tokens
IsTemplate: false
IsTopLevel: false
ShowPerDefault: true
Order: 12
---

The component library uses CSS custom properties (custom properties) for all visual decisions. This gives three things at once: dark and light theme switching, consumer-level token overrides, and stable theming selectors via `data-part` attributes.

## How the system works

There are three layers of CSS files, loaded in order:

```
1. tokens.css     ← all --cr-* custom properties, set to `initial`
2. theme-dark.css ← dark palette values
3. theme-light.css ← light palette values
```

The cascade resolves the variables at runtime based on the `data-theme` attribute on the root element. There is no JavaScript involved in theme switching — it is pure CSS.

```
<!-- Dark theme: data-theme="dark" activates the dark selectors -->
<div data-widget="cr-walkthrough" data-theme="dark">
  <!-- all --cr-* variables resolve to dark values here -->
</div>

<!-- Light theme -->
<div data-widget="cr-walkthrough" data-theme="light">
  <!-- all --cr-* variables resolve to light values here -->
</div>

<!-- Consumer override -->
<div data-widget="cr-walkthrough" data-theme="dark" style="--cr-color-accent: #ff6600">
  <!-- all --cr-* variables resolve to dark values except --cr-color-accent which is orange -->
</div>
```

## Layer 1 — tokens.css

This file declares every CSS custom property the library uses. All values are `initial` — meaning they inherit from the next cascade layer (the theme file) or fall back to the browser default.

```css
/* From frontend/packages/cr-walkthrough/src/tokens.css */

[data-widget="cr-walkthrough"] {
  /* Colors — surface */
  --cr-color-bg: initial;
  --cr-color-surface: initial;
  --cr-color-surface-raised: initial;
  --cr-color-border: initial;

  /* Colors — text */
  --cr-color-text: initial;
  --cr-color-text-muted: initial;
  --cr-color-text-subtle: initial;

  /* Colors — semantic */
  --cr-color-accent: initial;
  --cr-color-inverse: initial;

  /* Colors — severity */
  --cr-color-severity-info: initial;
  --cr-color-severity-warn: initial;
  --cr-color-severity-issue: initial;
  --cr-color-severity-praise: initial;

  /* Colors — diff */
  --cr-color-diff-add-bg: initial;
  --cr-color-diff-add-text: initial;
  --cr-color-diff-del-bg: initial;
  --cr-color-diff-del-text: initial;
  --cr-color-diff-hl-bg: initial;

  /* Typography */
  --cr-font-sans: initial;
  --cr-font-mono: initial;
  --cr-font-size-root: initial;
  --cr-font-size-xs: initial;
  --cr-font-size-sm: initial;
  --cr-font-size-base: initial;
  --cr-font-size-lg: initial;
  --cr-font-size-xl: initial;
  --cr-font-size-2xl: initial;
  --cr-font-size-code: initial;
  --cr-font-weight-normal: initial;
  --cr-font-weight-semibold: initial;
  --cr-font-weight-bold: initial;
  --cr-line-height-tight: initial;
  --cr-line-height-base: initial;

  /* Spacing */
  --cr-space-0: initial;
  --cr-space-1: initial; /* 4px */
  --cr-space-2: initial; /* 8px */
  --cr-space-3: initial; /* 12px */
  --cr-space-4: initial; /* 16px */
  --cr-space-5: initial; /* 20px */
  --cr-space-6: initial; /* 32px */
  --cr-space-8: initial; /* 48px */

  /* Radius */
  --cr-radius-sm: initial; /* 4px */
  --cr-radius-md: initial; /* 6px */
  --cr-radius-lg: initial; /* 9px */
  --cr-radius-xl: initial; /* 12px */
  --cr-radius-full: initial;

  /* Shadow */
  --cr-shadow-card: initial;
  --cr-shadow-raised: initial;

  /* Transition */
  --cr-transition-fast: initial;
  --cr-transition-base: initial;
}
```

## Layer 2 — theme-dark.css

The dark theme sets actual values for every token. The selector uses `data-theme="dark"` so the theme can be toggled by changing the attribute on the root element.

```css
/* From frontend/packages/cr-walkthrough/src/theme-dark.css */

[data-widget="cr-walkthrough"][data-theme="dark"],
[data-widget="cr-walkthrough"]:not([data-theme]) {
  /* Default to dark when no theme is set (browser default) */
  --cr-color-bg: #101114;
  --cr-color-surface: #141518;
  --cr-color-surface-raised: #1a1b20;
  --cr-color-border: #1e1f24;
  --cr-color-text: #c8cad0;
  --cr-color-text-muted: #6b7280;
  --cr-color-accent: #7c6af7;
  --cr-color-inverse: #ffffff;
  /* ... etc */
}
```

Note: `[data-widget="cr-walkthrough"]:not([data-theme])` makes dark the default when no theme is set yet (prevents flash of unstyled content).

## Layer 3 — theme-light.css

```css
[data-widget="cr-walkthrough"][data-theme="light"] {
  --cr-color-bg: #ffffff;
  --cr-color-surface: #f9fafb;
  --cr-color-surface-raised: #f3f4f6;
  --cr-color-border: #e5e7eb;
  --cr-color-text: #1f2937;
  --cr-color-text-muted: #6b7280;
  --cr-color-accent: #4f46e5;
  --cr-color-inverse: #ffffff;
  /* ... etc */
}
```

## Consumer overrides

At runtime, pass token overrides via the `tokens` prop on `CRWalkthrough`:

```tsx
<CRWalkthrough
  walkthroughId="auth-refactor"
  tokens={{
    '--cr-color-accent': '#ff6600',
    '--cr-font-sans': '"Inter", system-ui, sans-serif',
    '--cr-radius-md': '0',
  }}
/>
```

The `tokens` prop spreads onto the root element's inline `style`, which has the highest CSS specificity and overrides all cascade layers.

## data-part selectors

For targeting specific regions in CSS (without touching component internals), each visual region has a `data-part` attribute. The values are exported as constants from `parts.ts`:

```ts
// frontend/packages/cr-walkthrough/src/parts.ts
export const PARTS = {
  ROOT: 'root',
  HEADER: 'header',
  HEADER_TITLE: 'header-title',
  HEADER_META: 'header-meta',
  HEADER_AUTHORS: 'header-authors',
  STEPS_LIST: 'steps-list',
  // Step-specific:
  TEXT_BODY: 'text-body',
  SOURCE_FILE_BADGE: 'source-file-badge',
  SOURCE_CODE: 'source-code',
  SOURCE_LINE: 'source-line',
  DIFF_LINE: 'diff-line',
  DIFF_ADD: 'diff-add',
  DIFF_DEL: 'diff-del',
  CODE_BLOCK: 'code-block',
  CHECKPOINT_PROMPT: 'checkpoint-prompt',
  CHECKPOINT_CHOICE: 'checkpoint-choice',
  CHECKPOINT_EXPLANATION: 'checkpoint-explanation',
  REVEAL_TOGGLE: 'reveal-toggle',
  REVEAL_CONTENT: 'reveal-content',
  ANNOTATION_BODY: 'annotation-body',
  SHELL_CMD: 'shell-cmd',
  SHELL_OUTPUT: 'shell-output',
  SECTION_TITLE: 'section-title',
  BRANCH_PROMPT: 'branch-prompt',
  BRANCH_OPTION: 'branch-option',
  // ... 50+ total
} as const;
```

Use them in consumer CSS:

```css
[data-part="header-title"] {
  font-size: var(--cr-font-size-2xl);
  font-weight: var(--cr-font-weight-bold);
}

[data-part="checkpoint-choice"][aria-pressed="true"] {
  border-color: var(--cr-color-accent);
  box-shadow: 0 0 0 2px var(--cr-color-accent);
}
```

## Theme switching in the app

The app shell holds the theme state (`'dark' | 'light'`) in React state. The `ThemeProvider` from `@crs-cradle/cr-walkthrough` provides the context. Both the outer chrome and the `CRWalkthrough` widget are inside the same provider:

```tsx
// frontend/src/App.tsx
function AppShell() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  return (
    <ThemeProvider initialTheme={theme}>
      <Shell theme={theme} onThemeChange={setTheme} />
    </ThemeProvider>
  );
}

function Shell({ theme }) {
  return (
    <div data-widget="cr-walkthrough" data-theme={theme}>
      {/* The attribute change causes CSS to switch theme */}
      <CRWalkthrough walkthroughId="auth-refactor" />
    </div>
  );
}
```

When the user clicks the Dark/Light toggle, `setTheme` is called, the `data-theme` attribute changes from `"dark"` to `"light"`, and the CSS cascade re-resolves all `--cr-*` variables to the light values. No re-render of individual components is needed — CSS handles it.

## Complete token list

### Colors

| Token | Dark default | Light default |
|---|---|---|
| `--cr-color-bg` | `#101114` | `#ffffff` |
| `--cr-color-surface` | `#141518` | `#f9fafb` |
| `--cr-color-surface-raised` | `#1a1b20` | `#f3f4f6` |
| `--cr-color-border` | `#1e1f24` | `#e5e7eb` |
| `--cr-color-text` | `#c8cad0` | `#1f2937` |
| `--cr-color-text-muted` | `#6b7280` | `#6b7280` |
| `--cr-color-text-subtle` | `#3a3c44` | `#9ca3af` |
| `--cr-color-accent` | `#7c6af7` | `#4f46e5` |
| `--cr-color-inverse` | `#ffffff` | `#ffffff` |
| `--cr-color-severity-info` | `#5b9cf5` | `#2563eb` |
| `--cr-color-severity-warn` | `#dba14e` | `#d97706` |
| `--cr-color-severity-issue` | `#e06070` | `#dc2626` |
| `--cr-color-severity-praise` | `#3ebfa5` | `#059669` |

### Typography

| Token | Dark default | Light default |
|---|---|---|
| `--cr-font-sans` | `"Plus Jakarta Sans", system-ui, ...` | same |
| `--cr-font-mono` | `"DM Mono", "Menlo", ...` | same |
| `--cr-font-size-root` | `13px` | same |
| `--cr-font-size-2xl` | `20px` | same |

### Spacing (all themes)

| Token | Value |
|---|---|
| `--cr-space-1` | `4px` |
| `--cr-space-2` | `8px` |
| `--cr-space-3` | `12px` |
| `--cr-space-4` | `16px` |
| `--cr-space-5` | `20px` |
| `--cr-space-6` | `32px` |
| `--cr-space-8` | `48px` |

## Storybook

Each theme can be previewed in Storybook by selecting the `dark` or `light` background in the Storybook toolbar. All stories are wrapped in the same `data-widget="cr-walkthrough"` container with `data-theme="dark"` by the preview decorator.

## See Also

- [`cr-dsl-step-types`](cr-dsl-step-types) — what each step type looks like with the default tokens
- [`cr-dsl-react-library`](cr-dsl-react-library) — React component API reference
- [`cr-dsl-writing-a-walkthrough`](cr-dsl-writing-a-walkthrough) — authoring guide with theming examples
