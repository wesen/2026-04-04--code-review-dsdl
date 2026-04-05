---
Title: "Step Types — Visual Reference and Behaviour"
Slug: cr-dsl-step-types
SectionType: GeneralTopic
Topics:
  - cr-dsl
  - steps
  - reference
  - renderer
  - ui
IsTemplate: false
IsTopLevel: false
ShowPerDefault: true
Order: 11
---

Each step type maps to a React renderer component. The renderer is chosen by `StepRendererRegistry` based on the `step.type` field. This page describes what each step looks like when rendered, what state it manages internally, and what accessibility properties it exposes.

## How step rendering works

The root component is `CRWalkthrough`. It fetches the walkthrough from the API, then maps over the steps:

```tsx
// Simplified — actual code in CRWalkthrough.tsx
wt.steps.map((step, i) => (
  <StepCard key={step.id ?? i} step={step} index={String(i + 1)} />
));
```

`StepCard` wraps every step in a card with a type badge and step number. Inside, `StepRendererRegistry` dispatches to the correct renderer:

```tsx
switch (step.type) {
  case 'text':      return <TextRenderer step={step} />;
  case 'source':    return <SourceRenderer step={step} />;
  case 'diff':      return <DiffRenderer step={step} />;
  // ... 10 more
}
```

All renderers receive a typed `step` prop. No renderer receives any other prop — all configuration comes from the YAML.

---

## text

**What it renders:** A prose paragraph in `data-part="text-body"`.

```
┌─────────────────────────────────────────────────┐
│ ¶ text                              #1          │
├─────────────────────────────────────────────────┤
│ This PR replaces the legacy session-based auth  │
│ with JWT tokens. We'll walk through the changes │
│ bottom-up, starting at the token utility layer. │
└─────────────────────────────────────────────────┘
```

**Rendering:** `<p data-part="text-body">{step.body}</p>`. No internal state.

**Accessibility:** The paragraph has no interactive elements. It is a landmark region via the enclosing `StepCard`.

---

## source

**What it renders:** A file badge above a code block. Lines are fetched from `GET /api/files/content` using the git service.

```
┌─────────────────────────────────────────────────┐
│ ◇ source                              #2         │
├─────────────────────────────────────────────────┤
│ src/utils/token.ts        L12–48  feat/auth     │
├─────────────────────────────────────────────────┤
│ 12  │ if (!verifySig(`${header}.${body}`, sig))│
│     │   throw new Error('invalid signature');    │
│ 13  │ return { id: payload.sub,                 │
│     │        email: payload.email };              │
│ ...                                           │
└─────────────────────────────────────────────────┘
│ Note: New verifyToken helper.                   │
```

**Rendering:** `SourceRenderer` calls `useGetFileContentQuery({ ref, path, start, end })`. While loading, it shows a skeleton or spinner. On error, it shows an error message. When the RTK Query cache has the result, it renders immediately without a network request.

**Internal state:** Tracks `isLoading`, `isError`, and `data` from the RTK Query hook.

**Accessibility:** The file path is in a `<data-part="source-file-badge">` element. Line numbers are in `<data-part="source-line">`.

---

## diff

**What it renders:** A unified diff with color-coded lines. Additions are green, deletions red, context lines neutral.

```
┌─────────────────────────────────────────────────┐
│ ± diff                               #3         │
├─────────────────────────────────────────────────┤
│ src/middleware/auth.ts         hunks 2, 3       │
├─────────────────────────────────────────────────┤
│  - const user = await Session.find(...);        │  ← deletion (red bg)
│  + const user = await verifyToken(...);          │  ← addition (green bg)
│    req.user = user;                              │  ← context (neutral)
└─────────────────────────────────────────────────┘
│ Note: Session lookup replaced with verifyToken. │
```

**Rendering:** `DiffRenderer` calls `useGetFileDiffQuery({ from, to, path })`. Parses the unified diff text and wraps each line in a `<span data-part="diff-line(diff-add|diff-del|diff-context)">`.

**Accessibility:** Diff lines have `role="list"` with each line as `role="listitem"`. Screen readers announce additions and deletions.

---

## code

**What it renders:** A syntax-highlighted code block with a language badge.

```
┌─────────────────────────────────────────────────┐
│ <> code                             #4         │
├─────────────────────────────────────────────────┤
│ typescript                                    │
├─────────────────────────────────────────────────┤
│ 1 │ // Before                                   │
│ 2 │ const user = await Session.find(...);        │
│ 3 │ // After                                    │
│ 4 │ const user = decodeJWT(...);                 │
└─────────────────────────────────────────────────┘
```

**Rendering:** Static content — no API call. The `lang` field is shown as a badge. Line numbers are auto-generated starting from 1.

---

## compare

**What it renders:** Two `SourceRenderer` panes side by side (or stacked on narrow viewports).

```
┌──────────────────────┬──────────────────────┐
│ ◇ source (left)      │ ◇ source (right)     │
├──────────────────────┼──────────────────────┤
│ main                 │ feat/cursor          │
│ L10–30              │ L10–38               │
│ ...                  │ ...                  │
└──────────────────────┴──────────────────────┘
```

**Rendering:** Each pane independently calls `useGetFileContentQuery`. This means two separate API requests fire in parallel, and each pane caches its result independently.

**Why the cache fix mattered:** Before fixing the RTK Query `serializeQueryArgs`, both panes shared one cache entry and the second request would overwrite the first. The bug caused the right pane to show the left pane's content. The fix (removing the custom `serializeQueryArgs`) gives each `{ ref, path, start, end }` tuple its own cache entry.

---

## link

**What it renders:** An external link with an arrow indicator.

```
┌─────────────────────────────────────────────────┐
│ ↗ link                              #8         │
├─────────────────────────────────────────────────┤
│ [JWT primer (external) ↗]                      │
└─────────────────────────────────────────────────┘
```

**Rendering:** `<a href={step.url} target="_blank" rel="noopener noreferrer">`. The `↗` is a visual indicator; the `rel` attribute prevents the opened page from accessing `window.opener`.

---

## annotation

**What it renders:** A colored inline comment box. Color is determined by `step.severity`.

```
┌─────────────────────────────────────────────────┐
│ ● annotation                         #5         │
├─────────────────────────────────────────────────┤
│ [warn] src/middleware/auth.ts:42               │
│ Race condition if token refresh fires mid-req.  │
└─────────────────────────────────────────────────┘
```

Severity → color mapping (dark theme):

| Severity | Color | CSS variable |
|---|---|---|
| `info` | Blue | `--cr-color-severity-info` |
| `warn` | Amber | `--cr-color-severity-warn` |
| `issue` | Red | `--cr-color-severity-issue` |
| `praise` | Teal | `--cr-color-severity-praise` |

---

## checkpoint

**What it renders:** A question with multiple choice buttons. State machine: `unanswered → answered`.

```
┌─────────────────────────────────────────────────┐
│ ? checkpoint                          #6         │
├─────────────────────────────────────────────────┤
│ What happens if the token is expired?          │
│                                                 │
│ [Returns 401 Unauthorized    ]                  │  ← user clicks this
│ [Falls back to session auth  ]                  │
│ [Silently ignores the error  ]                  │
└─────────────────────────────────────────────────┘
```

After clicking, the chosen button changes style and explanations appear for all options:

```
┌─────────────────────────────────────────────────┐
│ ? checkpoint                          #6         │
├─────────────────────────────────────────────────┤
│ What happens if the token is expired?          │
│                                                 │
│ [✓ Returns 401 Unauthorized    ] ✓             │  ← correct (green)
│   The handler checks the expiry before         │
│   proceeding.                                   │
│                                                 │
│ [✗ Falls back to session auth  ]               │  ← wrong (red)
│   Session auth was removed in this PR.          │
└─────────────────────────────────────────────────┘
```

**Internal state:** Local React state (`useState`) tracks `selectedIndex` and `submitted`. Once `submitted`, no further interaction is possible.

**Accessibility:** Choices are `<button>` elements. The question is in a `<p>` with `id` referenced by `aria-describedby` on the buttons. Correct/incorrect state is announced via `aria-live="polite"`.

---

## reveal

**What it renders:** A collapsible toggle with a disclosure triangle.

Closed:

```
┌─────────────────────────────────────────────────┐
│ ▸ reveal                              #7         │
│ [▸ Show edge-case discussion         ]         │
└─────────────────────────────────────────────────┘
```

Open:

```
┌─────────────────────────────────────────────────┐
│ ▾ reveal                              #7         │
│ [▾ Hide edge-case discussion         ]         │
├─────────────────────────────────────────────────┤
│ If the token is expired but the session store  │
│ is also unavailable, the handler returns 401.   │
└─────────────────────────────────────────────────┘
```

**Internal state:** Local `useState(false)` tracks `isOpen`. The disclosure triangle changes from `▸` to `▾`.

**Accessibility:** Uses the native HTML `<details>` / `<summary>` elements when possible, which provide built-in keyboard navigation and screen reader support.

---

## shell

**What it renders:** A terminal block with a command prompt and expected output.

```
┌─────────────────────────────────────────────────┐
│ $ shell                              #3         │
├─────────────────────────────────────────────────┤
│ $ npm test -- --coverage                           │
│                                                 │
│ PASS  src/auth.test.ts                           │
│ coverage: 87.3%                                 │
└─────────────────────────────────────────────────┘
│ Note: All auth tests pass.                      │
```

The `$` prefix is added by the renderer; it is not in the YAML `cmd` field.

---

## section

**What it renders:** A named group with a heading and indented child steps.

```
┌─────────────────────────────────────────────────┐
│ Migration notes (section)                        │
│ ▼ Section title                                │
│   ┌─────────────────────────────────────────┐  │
│   │ ¶ text                                 │  │
│   │ All clients must update to use cursor. │  │
│   │ ● annotation                            │  │
│   │ [info] src/routes/users.ts:15          │  │
│   └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Rendering:** Sections are recursive. `SectionRenderer` renders its own `steps` by calling `StepCard` for each child. The `depth` prop increments with each nesting level; the renderer uses it to add indentation.

**State:** No internal state. Sections are purely presentational containers.

---

## branch

**What it renders:** A navigation prompt with labeled buttons. Clicking a button scrolls to the target step.

```
┌─────────────────────────────────────────────────┐
│ ↪ branch                             #8         │
├─────────────────────────────────────────────────┤
│ What would you like to explore next?           │
│                                                 │
│ [Explore the tests         ]                     │
│ [Read the architecture doc ]                     │
│ [Jump to the summary       ]                     │
└─────────────────────────────────────────────────┘
```

**Internal state:** `selectedOption` tracked in local state. On selection, `onGoto(step.goto)` is called (a prop passed from `CRWalkthrough`).

**Navigation:** The goto target is any step with a matching `id`. Steps without explicit IDs get auto-generated sequential IDs (`step-1`, `step-2`, etc.).

---

## Troubleshooting

Problem | Cause | Fix
---|---|---
`SourceRenderer` shows error state | `GET /api/files/content` returned non-200 | Check the `file` path and `ref` in the YAML; verify the git repo has those values
`CompareRenderer` shows wrong content in one pane | RTK Query cache key collision (fixed in commit `c0186b5`) | Rebuild the frontend — the fix is in `walkthroughsApi.ts`
`DiffRenderer` shows "No differences" | Git refs are the same, or `file` path is wrong | Check `from` and `to` refs differ; check `file` matches a file changed between those refs
`BranchRenderer` does not scroll | `goto` target not found | Ensure the target step has an explicit `id` matching the goto value

## See Also

- [`cr-dsl-walkthrough-reference`](cr-dsl-walkthrough-reference) — YAML field reference for each step type
- [`cr-dsl-theming`](cr-dsl-theming) — CSS custom property tokens for colors, typography, and spacing
