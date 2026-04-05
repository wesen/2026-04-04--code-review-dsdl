---
Title: "React Library — @crs-cradle/cr-walkthrough API"
Slug: cr-dsl-react-library
SectionType: GeneralTopic
Topics:
  - cr-dsl
  - react
  - component
  - library
  - rtk-query
  - theming
  - reference
IsTemplate: false
IsTopLevel: false
ShowPerDefault: true
Order: 14
---

`@crs-cradle/cr-walkthrough` is the component library package. It lives in the `frontend/` workspace as `packages/cr-walkthrough/`. The package is consumed by the app shell in `frontend/src/` and by Storybook.

This page documents the public API: exported components, hooks, types, and CSS assets.

## Installation

The package is part of the monorepo workspace. No separate install step is needed. Import from the package:

```tsx
import { CRWalkthrough, ThemeProvider } from '@crs-cradle/cr-walkthrough';
import '@crs-cradle/cr-walkthrough/tokens';
import '@crs-cradle/cr-walkthrough/theme-dark';
import '@crs-cradle/cr-walkthrough/theme-light';
```

Or import individual CSS files:

```tsx
// Only dark theme (smaller bundle):
import '@crs-cradle/cr-walkthrough/tokens';
import '@crs-cradle/cr-walkthrough/theme-dark';
```

## Components

### CRWalkthrough

The root component. Fetches and renders a walkthrough.

```tsx
import { CRWalkthrough } from '@crs-cradle/cr-walkthrough';

<CRWalkthrough walkthroughId="auth-refactor" />
```

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `walkthroughId` | `string` | — | Fetch and render this walkthrough by ID. One of `walkthroughId` or `walkthrough` is required. |
| `walkthrough` | `Walkthrough` | — | Pass an inline walkthrough object. Skips the API fetch. |
| `className` | `string` | — | Additional CSS class on the root element. |
| `unstyled` | `boolean` | `false` | Remove base styles (keep only `data-part` markup). |
| `tokens` | `Record<string, string>` | — | CSS custom property overrides. |
| `onBranch` | `(gotoId: string) => void` | — | Called when a branch step option is selected. |
| `onThemeChange` | `(theme: 'dark' \| 'light') => void` | — | Called when the internal theme context changes. |

**Rendering behaviour:**

1. If `walkthrough` is provided, renders immediately with that data.
2. If `walkthroughId` is provided, calls `useGetWalkthroughQuery(walkthroughId)`.
3. If `walkthroughId` is undefined, renders nothing (blank).
4. While fetching, shows "Loading walkthrough…" text.
5. On error, shows a red error box with the error message.

**CSS attributes on root:** `data-widget="cr-walkthrough"` and `data-theme` (from the `ThemeProvider` context).

---

### ThemeProvider

Wraps the app to provide theme context. Must be an ancestor of `CRWalkthrough`.

```tsx
import { ThemeProvider } from '@crs-cradle/cr-walkthrough';

<ThemeProvider initialTheme="dark">
  <App />
</ThemeProvider>
```

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `initialTheme` | `'dark' \| 'light'` | `'dark'` | The starting theme. |
| `children` | `ReactNode` | — | The app content. |

**Context value:** `{ theme: 'dark' | 'light', setTheme: (t) => void }`

Use `useTheme()` to read and write the current theme.

---

### useTheme

Hook to read and write the theme from within the `ThemeProvider`.

```tsx
import { useTheme } from '@crs-cradle/cr-walkthrough';

function MyComponent() {
  const { theme, setTheme } = useTheme();
  return <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>Toggle</button>;
}
```

**Returns:** `{ theme: 'dark' | 'light', setTheme: (t: 'dark' | 'light') => void }`

**Throws:** If called outside a `ThemeProvider`.

---

### FileBadge

Displays a file path with a badge indicating the line range and optional git ref.

```tsx
import { FileBadge } from '@crs-cradle/cr-walkthrough';

<FileBadge
  file="src/utils/token.ts"
  lines={[12, 48]}
  ref="feat/auth-refactor"
/>
```

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `file` | `string` | — | File path. |
| `lines` | `[number, number]` | — | Line range `[start, end]`. |
| `ref` | `string` | — | Git ref shown in parentheses. |

**Renders:** `<span data-part="source-file-badge">{file} L{start}–{end} ({ref})</span>`

---

### CodeBlock

A code block with optional line numbers.

```tsx
import { CodeBlock } from '@crs-cradle/cr-walkthrough';

<CodeBlock lang="typescript">
  {'const x = 1;'}
</CodeBlock>
```

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `lang` | `string` | — | Language hint shown as a badge. |
| `children` | `ReactNode` | — | The code content. |
| `className` | `string` | — | Additional class. |

---

### CodeLine

A single line within a `CodeBlock`. Used by `SourceRenderer` internally.

```tsx
<CodeLine num={12} highlight={false}>
  {'const header = base64(...)'}
</CodeLine>
```

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `num` | `number` | — | Line number. |
| `highlight` | `boolean` | `false` | Whether this line is in a highlighted range. |
| `highlightColor` | `string` | — | CSS color for the highlight background. |
| `children` | `ReactNode` | — | The line content. |

---

### Note

A prose note rendered in a muted style below a code block or diff.

```tsx
<Note>New verifyToken helper — note the fallback on L34.</Note>
```

**Renders:** `<p data-part="step-note">{children}</p>` with muted color and smaller font.

---

## Step renderers

There are 13 step renderer components. They are not exported individually — they are selected by `StepRendererRegistry` internally. They are documented in [`cr-dsl-step-types`](cr-dsl-step-types) with visual examples and state details.

The renderers are:

```
TextRenderer       — prose paragraph
SourceRenderer     — file badge + code block (calls useGetFileContentQuery)
DiffRenderer       — unified diff (calls useGetFileDiffQuery)
CodeRenderer       — static code snippet
CompareRenderer    — two SourceRenderer panes side-by-side
LinkRenderer       — external link
AnnotationRenderer — severity-colored inline comment
CheckpointRenderer — interactive multiple-choice (local state)
RevealRenderer     — collapsible toggle (local state)
ShellRenderer      — command + output block
SectionRenderer   — named group of child steps (recursive)
BranchRenderer     — navigation prompt (calls onGoto)
StepCard           — card wrapper with type badge + step number
```

## RTK Query API hooks

The package exports the RTK Query slice and hooks. These are used by `SourceRenderer`, `DiffRenderer`, and `CompareRenderer` internally.

```tsx
import {
  useListWalkthroughsQuery,
  useGetWalkthroughQuery,
  useGetFileContentQuery,
  useGetFileDiffQuery,
  useListRefsQuery,
} from '@crs-cradle/cr-walkthrough';
```

### useGetWalkthroughQuery

```tsx
const { data, isLoading, isError, error } = useGetWalkthroughQuery('auth-refactor');
```

**Argument:** `string` — the walkthrough ID.

**Returns:** RTK Query result object with `{ data: Walkthrough, isLoading, isError, error, ... }`.

### useGetFileContentQuery

```tsx
const result = useGetFileContentQuery({
  ref: 'feat/auth-refactor',
  path: 'src/utils/token.ts',
  start: 12,
  end: 48,
});
```

**Argument:** `{ ref: string, path: string, start: number, end: number }`.

**Returns:** `{ data: FileContent, ... }` where `FileContent = { ref, path, start, end, lines: string[] }`.

**Cache behaviour:** Each unique `{ ref, path, start, end }` tuple has its own cache entry. The cache persists for 5 minutes by default. Multiple concurrent requests for the same file range share one cache entry.

### useGetFileDiffQuery

```tsx
const result = useGetFileDiffQuery({
  from: 'main',
  to: 'feat/auth-refactor',
  path: 'src/middleware/auth.ts',
});
```

**Argument:** `{ from: string, to: string, path?: string }`.

**Returns:** `{ data: DiffContent, ... }` where `DiffContent = { from, to, path, diff: string }`.

---

## CSS exports

The package exports CSS files as subpath modules. Import them in your app:

```tsx
// Load all theme tokens:
import '@crs-cradle/cr-walkthrough/tokens';         // all --cr-* variables, initial
import '@crs-cradle/cr-walkthrough/theme-dark';      // dark values
import '@crs-cradle/cr-walkthrough/theme-light';     // light values

// Load individual files:
import '@crs-cradle/cr-walkthrough/theme-dark';      // dark only (smaller)
```

These are resolved via the `exports` field in `packages/cr-walkthrough/package.json`:

```json
{
  "exports": {
    "./tokens": "./src/tokens.css",
    "./theme-dark": "./src/theme-dark.css",
    "./theme-light": "./src/theme-light.css"
  }
}
```

## Type exports

All TypeScript types are exported from the package root:

```tsx
import type {
  Walkthrough,
  WalkthroughSummary,
  Step,
  TextStep,
  SourceStep,
  DiffStep,
  CodeStep,
  CompareStep,
  LinkStep,
  AnnotationStep,
  CheckpointStep,
  RevealStep,
  ShellStep,
  SectionStep,
  BranchStep,
  FileContent,
  DiffContent,
  AnnotationSeverity,
  WalkthroughSummary,
} from '@crs-cradle/cr-walkthrough';
```

The discriminated union pattern is used throughout — always narrow the type using `step.type` before accessing type-specific fields:

```tsx
function renderStep(step: Step) {
  switch (step.type) {
    case 'source':
      // TypeScript knows step is SourceStep here
      return <SourceRenderer step={step} />;
    case 'annotation':
      // TypeScript knows step is AnnotationStep here
      return <AnnotationRenderer step={step} />;
  }
}
```

## Storybook

The package includes 95 stories across 18 story files. To browse them:

```bash
cd frontend
npm run storybook
# Opens http://localhost:6006
```

Stories are in `packages/cr-walkthrough/src/stories/`. Each component has its own file with stories covering: default state, all variants, loading state, error state, dark theme, light theme.

## See Also

- [`cr-dsl-theming`](cr-dsl-theming) — CSS custom property reference
- [`cr-dsl-step-types`](cr-dsl-step-types) — Renderer behaviour and state
- [`cr-dsl-api-reference`](cr-dsl-api-reference) — Backend API consumed by the RTK Query hooks
- [`cr-dsl-writing-a-walkthrough`](cr-dsl-writing-a-walkthrough) — Authoring walkthroughs
