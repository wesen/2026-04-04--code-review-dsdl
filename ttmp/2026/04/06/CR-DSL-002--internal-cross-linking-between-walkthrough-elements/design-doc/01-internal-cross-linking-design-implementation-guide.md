---
Title: Internal Cross-Linking — Design & Implementation Guide
Ticket: CR-DSL-002
Status: draft
Topics:
    - cr-dsl
    - frontend
    - ux
    - navigation
DocType: design-doc
Intent: ""
Owners: []
RelatedFiles:
    - Path: frontend/packages/cr-walkthrough/src/api/walkthroughsApi.ts
      Note: RTK Query slice — FileViewer fetches via getFileContent; compare mode uses two parallel requests
    - Path: frontend/packages/cr-walkthrough/src/renderers/AnnotationRenderer.tsx
      Note: Target — file+line badge links to FileViewer at annotated line
    - Path: frontend/packages/cr-walkthrough/src/renderers/CompareRenderer.tsx
      Note: Target — pane headers link to FileViewer for that pane's ref
    - Path: frontend/packages/cr-walkthrough/src/renderers/DiffRenderer.tsx
      Note: Target — from/to badges open compare FileViewer mode
    - Path: frontend/packages/cr-walkthrough/src/renderers/SourceRenderer.tsx
      Note: Target renderer — file badge becomes a link to FileViewer
    - Path: frontend/packages/cr-walkthrough/src/renderers/StepCard.tsx
      Note: StepRendererRegistry dispatches steps; both need data-step-id anchors
    - Path: frontend/src/App.tsx
      Note: React Router setup — WalkthroughLayout wraps routes; query params drive FileViewer state
ExternalSources: []
Summary: ""
LastUpdated: 0001-01-01T00:00:00Z
WhatFor: ""
WhenToUse: ""
---


# CR-DSL-002 Design: Internal Cross-Linking Between Walkthrough Elements

---

## 1. Problem statement

Walkthroughs are read sequentially, but code review is not linear. A reader encountering an annotation on line 42 of `auth.ts` wants to see that line in context - the surrounding file, the diff that changed it, or the section it belongs to. Today, every step is independent: clicking the file badge tells you the file and line number but does nothing. The reader must manually find the `source` step that renders that file (if one exists) or open the file outside the walkthrough.

Cross-linking turns the walkthrough into a navigable graph instead of a flat list. A reader can follow any reference - file badge, annotation, diff header - and arrive at the relevant content. The navigation is entirely internal to the walkthrough system; nothing leaves the page.

---

## 2. Scope

This document covers **local, internal cross-linking** only. Specifically:

- Links that stay within the walkthrough SPA
- Links that navigate to content already loaded or loadable from the local API
- A file viewer that shows any file at any ref within the walkthrough's repository
- No external URLs (GitHub, GitLab, etc.)
- No offline/p2p sharing of linked content
- No annotation authoring (editing annotations in-place)

Out of scope for this ticket:

- Adding comment threads or replies to annotations
- Real-time collaborative editing
- Exporting linked walkthroughs as static HTML
- Mobile-optimized viewer

---

## 3. Current system - a walkthrough is a flat list

Today, `CRWalkthrough` renders steps in order:

```
GET /wt/auth-refactor
  → Walkthrough { steps: [TextStep, SourceStep, DiffStep, AnnotationStep, ...] }
  → steps.map(StepCard)
      → StepCard → StepRendererRegistry → Renderer per type
```

Each step is independent. `StepCard` has an auto-generated ID but nothing links to it. The `source` renderer calls the API to fetch file content and renders it - there is no way to navigate to it from elsewhere.

```
┌──────────────────────────────────────────────────────┐
│ Annotation (annotation step)                           │
│ [warn] src/middleware/auth.ts:42                    │
│ Race condition if token refresh fires.                │
│                                                      │
│ ┌──────────────────────────────────────────────┐    │
│ │ (no connection)                               │    │
│ └──────────────────────────────────────────────┘    │
│                                                      │
│ Source step (source step, somewhere below)          │
│ src/middleware/auth.ts  L30-60                      │
│ ...                                                 │
└──────────────────────────────────────────────────────┘
```

The annotation and the source step both describe the same file and overlapping lines. The reader must scroll to find the source step. There is no link.

---

## 4. Proposed system - a navigable graph

The walkthrough becomes a directed graph. Each step has a stable ID (user-provided or auto-generated). Every badge - file path, line range, severity badge - is a link that navigates to the relevant content.

```
┌──────────────────────────────────────────────────────────┐
│ Annotation (annotation step)                               │
│ [warn] src/middleware/auth.ts:42                        │
│ Race condition.                                          │
│                                                           │
│ Clicking "src/middleware/auth.ts:42" → opens FileViewer │
│ pointing to that file, ref, and line.                    │
│                                                           │
│ Alternatively: click "L42" → scrolls to SourceStep that   │
│ renders the same file, highlights line 42.                │
│                                                           │
│ Annotation → FileViewer at line 42                        │
│ File badge → FileViewer for the whole file range         │
│ Diff header → FileViewer for the "before" state          │
│ Compare pane → FileViewer for that pane's file+ref      │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Navigation targets

There are three types of navigation targets within the walkthrough.

### 5a. The File Viewer

A panel that shows any file at any git ref, at any line range. It is rendered as a side panel or overlay that slides in from the right (similar to GitHub's file viewer).

The File Viewer is stateful: it tracks `file`, `ref`, `startLine`, `endLine`, and optionally a `highlightLine`. When any of these change, the viewer updates - either by fetching new content from the API or by scrolling to the highlight within already-loaded content.

The File Viewer exists in two modes:

**Inline mode:** The File Viewer replaces or sits above the step that triggered it. The walkthrough continues to exist below it. Navigation between walkthrough steps is preserved.

**Modal mode:** The File Viewer is a modal overlay. The walkthrough is dimmed but visible behind it. Closing the viewer returns focus to the triggering element.

Default: modal mode. Inline mode is used for `source` steps (which are already file viewers - no nesting).

### 5b. Step anchors

Every rendered step has a `data-step-id` attribute. The attribute value is the step's `id` field from the YAML (or the auto-generated `step-N` fallback). Clicking a badge that links to a step scrolls to that step.

Step anchors are always local (`#step-3`). They work with standard browser anchor navigation - no JavaScript router involvement.

### 5c. Diff → before/after pane

When a diff header is clicked, the File Viewer opens showing the `from` state of the file (left pane) or the `to` state (right pane). The pane toggle in the viewer determines which side is shown.

---

## 6. URL scheme

The SPA currently uses React Router with a single route:

```
/                       → HomePrompt
/wt/:id                → WalkthroughPage(walkthroughId=id)
/wt/:id?file=&ref=&from=&to=   → WalkthroughPage + FileViewer overlay
```

The query parameters drive the FileViewer state. React Router v6 reads them via `useSearchParams`.

```
/wt/auth-refactor?file=src/middleware/auth.ts&ref=feat/auth-refactor&lines=30,60
```

When query params are present, `WalkthroughPage` renders both the walkthrough and the FileViewer. When they are absent, only the walkthrough renders.

### Anchor links (fragment navigation)

```
/wt/auth-refactor#step-3
/wt/auth-refactor#annotation-src-middleware-auth-ts-42
```

The fragment is parsed by the step renderer on mount. When a URL with a fragment is loaded, the page scrolls to that step and the FileViewer is not opened.

### Combined (anchor + query)

```
/wt/auth-refactor?file=src/middleware/auth.ts&ref=feat/auth-refactor&lines=30,60#step-2
```

Opens the FileViewer AND scrolls to step-2.

### FileViewer URL state

The FileViewer is controlled by query parameters on the walkthrough route:

| Query param | Example | Meaning |
|---|---|---|
| `file` | `src/middleware/auth.ts` | File path in the git repo |
| `ref` | `feat/auth-refactor` | Git ref to read the file from |
| `lines` | `30,60` | Line range to show |
| `highlight` | `42` | Line number to scroll to and highlight |
| `compare` | `true` | Open in compare mode (two-pane) |
| `compareRef` | `main` | The second ref for compare mode |
| `from` | `main` | Diff "from" ref |
| `to` | `feat/auth-refactor` | Diff "to" ref |

Navigation between FileViewer states updates the URL (pushing to history). Browser back/forward work correctly.

---

## 7. API changes

### 7a. Walkthrough response

No change to the existing API endpoints. The walkthrough JSON already contains all fields needed to construct links. The frontend builds URLs from the data it already has.

### 7b. File Viewer state

The FileViewer fetches its content from the existing `GET /api/files/content` endpoint. No new endpoints are needed.

For compare mode (diff → before/after pane), two parallel requests are made:
- `GET /api/files/content?ref={from}&path={file}&start={start}&end={end}`
- `GET /api/files/content?ref={to}&path={file}&start={start}&end={end}`

### 7c. Caching

The RTK Query cache already caches file content per `{ ref, path, start, end }`. The FileViewer benefits from this automatically - if a file was already loaded by a `source` step, the FileViewer renders from cache with no additional network request.

For compare mode, two cache entries are read in parallel.

---

## 8. Component changes

This section describes what each component would need to do. No implementation code - pseudocode and prose only.

### 8a. AppShell

The React Router setup in `App.tsx` would add a layout component that wraps all routes:

```
AppShell
  └── BrowserRouter
        └── Routes
              ├── / → HomePrompt
              └── /wt/:id → WalkthroughLayout(walkthroughId)
```

`WalkthroughLayout` reads `useSearchParams()`. If query params are present, it renders the FileViewer alongside the route's content. If absent, it renders only the route's content.

### 8b. FileViewer

A new component, rendered as a side panel or modal. It is not a step - it exists outside the step list.

```
FileViewer
  ├── file-header          (filename, ref, line range, pane toggle for compare mode)
  ├── CodeBlock            (content, syntax highlighted)
  │     └── CodeLine[]     (with highlight for the highlighted line)
  └── close-button
```

**State:**

```
FileViewerState {
  file: string
  ref: string
  startLine: number
  endLine: number
  highlightLine?: number   // line to scroll-to and highlight
  compare: boolean
  compareRef?: string
}
```

**Link construction:** Given `{ file, ref, lines, highlight }`, construct a URL:

```
buildFileViewerUrl(base, { file, ref, lines, highlight }):
  params = new URLSearchParams()
  params.set('file', file)
  params.set('ref', ref)
  params.set('lines', `${lines[0]},${lines[1]}`)
  if (highlight) params.set('highlight', String(highlight))
  return `${base}?${params.toString()}`
```

Where `base = /wt/${walkthroughId}`.

**Opening:** `navigate(buildFileViewerUrl(base, state))` - pushes to history.

**Closing:** `navigate(base)` - removes query params.

**Scrolling on mount:** When the FileViewer opens (or the highlight param changes), it scrolls the highlighted line into view using `element.scrollIntoView()`. This works whether the FileViewer is inline or modal.

### 8c. StepCard

The wrapper component around each step. It would gain a `data-step-id` attribute for anchor linking:

```
StepCard
  ├── header (type badge + step number + optional ID anchor)
  ├── content (the renderer for this step type)
  └── anchor-link (a hidden <a id={step.id}> for fragment navigation)
```

The anchor link is a standard HTML anchor: `<a id="step-3" tabIndex={-1} aria-hidden />`. Fragment navigation (`/#step-3`) scrolls to the step without JavaScript involvement.

### 8d. SourceRenderer

Currently renders the file badge as a `<span>`. It would change to a `<button>` or `<a>` that opens the FileViewer:

```
SourceRenderer
  ├── FileBadgeLink (was: FileBadge)  → onClick: open FileViewer for this file+ref+lines
  │     └── file path, L start-end, ref
  ├── CodeBlock
  │     └── CodeLine[]  → each line is a link: onClick: open FileViewer at this line
  └── Note (optional)
```

**FileBadgeLink click:** Calls `onOpenFile` prop with `{ file, ref, lines }`.

### 8e. AnnotationRenderer

The annotation severity badge and file+line reference would both be links:

```
AnnotationRenderer
  ├── SeverityBadge  → non-interactive (severity is not a navigation target)
  ├── FileLineLink   → onClick: open FileViewer at (file, walkthrough.head, line)
  │     └── [severity]  src/path/file.ts:42
  └── AnnotationBody  → non-interactive (the comment text itself)
```

### 8f. DiffRenderer

The diff header is the natural cross-link target:

```
DiffRenderer
  ├── DiffHeader  → onClick: open FileViewer in compare mode
  │     ├── from-badge  → onClick: open FileViewer at (file, from, lines) - single-pane, "before"
  │     ├── arrow (→)  → non-interactive
  │     └── to-badge    → onClick: open FileViewer at (file, to, lines) - single-pane, "after"
  ├── CodeBlock (diff lines)
  └── Note (optional)
```

The hunk headers within the diff block would also link to the relevant line in the FileViewer (but this is low priority - the diff block itself already shows the content).

### 8g. CompareRenderer

Each pane header is already a `SourceRenderer` (inside a layout). The FileViewer navigation follows naturally from the `SourceRenderer` change above.

```
CompareRenderer
  ├── SourceRenderer (left pane)  → same FileViewer link behavior as 8d
  ├── SourceRenderer (right pane) → same FileViewer link behavior as 8d
  └── Note (optional)
```

### 8h. CheckpointRenderer, RevealRenderer, ShellRenderer, BranchRenderer, SectionRenderer, LinkRenderer, TextRenderer

No changes needed. These steps render no file references and have no natural cross-link targets. `SectionRenderer` may contain child steps that are cross-link targets - but those are handled by the child step renderers, not by `SectionRenderer` itself.

---

## 9. File references and where they point

This section maps every badge that appears in the walkthrough to its FileViewer destination.

### File badge (in SourceRenderer)

**What it is:** The pill showing `src/utils/token.ts  L12-48  feat/auth-refactor`.

**What it links to:** The full file range. Opens the FileViewer at `{ file, ref, startLine: 12, endLine: 48 }`. No highlight line.

```
click → navigate(/wt/auth-refactor?file=src/utils/token.ts&ref=feat/auth-refactor&lines=12,48)
```

### Individual line number (in CodeLine)

**What it is:** The line number column in the code block.

**What it links to:** The same file at the same ref, but with that single line highlighted and scrolled into view. Opens the FileViewer at `{ file, ref, startLine: N, endLine: N, highlightLine: N }`.

```
click → navigate(/wt/auth-refactor?file=src/utils/token.ts&ref=feat/auth-refactor&lines=42,42&highlight=42)
```

This lets the reader drill from a diff addition/deletion directly to the file viewer showing that line in isolation.

### Annotation file+line badge

**What it is:** The badge `[warn] src/middleware/auth.ts:42`.

**What it links to:** The same as clicking the file badge, but with `highlightLine: 42`. Opens the FileViewer at the annotated line.

```
click → navigate(/wt/auth-refactor?file=src/middleware/auth.ts&ref=feat/auth-refactor&lines=42,42&highlight=42)
```

### Diff from/to badge

**What it is:** The header showing `main → feat/auth-refactor`.

**What it links to:** The FileViewer in compare mode. The `from` badge opens the "before" pane; the `to` badge opens the "after" pane.

```
click "main" → navigate(/wt/auth-refactor?file=&ref=&lines=&compare=true&from=main&to=feat/auth-refactor)
```

Note: `file` and `lines` are optional for the diff header. If the diff has a `file` field, the FileViewer is restricted to that file. If not, it shows the full diff in a read-only diff viewer.

### Diff hunk header

**What it is:** The `@@ -12,7 +12,9 @@` line in the unified diff block.

**What it links to:** The FileViewer opened at the hunk's start line in the "after" ref. Low priority.

### Step badge (type indicator)

**What it is:** The `¶ text`, `◇ source`, `± diff` badge in the StepCard header.

**What it links to:** The step's own anchor. Clicking it sets the URL fragment to `#step-N`, which scrolls to and highlights that step.

```
click → navigate(/wt/auth-refactor#step-3)
```

### Step number

**What it is:** The `#3` in the StepCard header.

**What it links to:** Same as the step badge - the step's own anchor.

---

## 10. Comparison to GitHub's file viewer

GitHub's file viewer is a separate page (`/blob/{ref}/{path}`). The walkthrough's FileViewer serves the same function - showing a file at a specific state - but:

| GitHub | Walkthrough FileViewer |
|---|---|
| Separate page load | SPA overlay or inline |
| Requires network for each file | Cached by RTK Query |
| Blame view available | Not in scope (future) |
| Can navigate history | Browser back/forward works |
| Search within file | Not in scope (future) |

The FileViewer does not replace the step-based rendering. It is an additional navigation affordance layered on top. A `source` step is still rendered as a step - the FileViewer is a supplemental way to open the same content with different navigation affordances.

---

## 11. Open questions

1. **Inline vs modal default:** Should clicking a badge open the FileViewer inline (replacing the current step) or as a modal (overlaying the walkthrough)? Recommendation: modal, with an "Open inline" button that converts it to inline mode.

2. **Should step anchors be user-visible?** The auto-generated `step-N` IDs are not meaningful to readers. Should explicit `id` fields in the YAML be required for steps that are natural navigation targets (e.g., steps targeted by annotations)?

3. **Diff hunk navigation:** Should clicking a hunk header in a `diff` step open the FileViewer showing that hunk's line range, or is the diff step itself sufficient? Recommendation: low priority, skip for v1.

4. **Annotation → source step matching:** If an annotation points to a line that is also rendered by a `source` step, should clicking the annotation badge scroll to the `source` step (with line highlight) rather than opening the FileViewer? Recommendation: implement both - scroll to source step as primary, open FileViewer as secondary via modifier key (Cmd/Ctrl+click).

5. **Should the FileViewer be a route?** Currently it is state-driven by query params. If the user refreshes, the FileViewer state is preserved. This is correct. No route change needed.

6. **Compare mode in the FileViewer:** The existing `compare` step type already does side-by-side comparison. Should the FileViewer support compare mode (two panes from two different refs) or should compare always use the `compare` step type? Recommendation: FileViewer compare mode is the same as the `compare` step - two panes, each fetching from the respective ref. The `compare` step type is still rendered as a step; FileViewer compare mode is the same display in the overlay.

---

## 12. Data flow summary

```
User clicks annotation badge
  → AnnotationRenderer.onFileBadgeClick({ file, ref, line })
      → navigate(buildFileViewerUrl(base, { file, ref, lines:[42,42], highlightLine:42 }))
          → URL updates to /wt/auth-refactor?file=...&highlight=42
              → WalkthroughLayout reads searchParams
                  → FileViewer is rendered (modal or inline)
                      → useGetFileContentQuery({ ref, path, start, end })
                          → RTK Query cache hit (if already loaded by source step)
                          → or: GET /api/files/content
                              → CodeBlock renders
                                  → CodeLine(42).scrollIntoView()
```

---

## 13. File locations affected

```
frontend/src/
  App.tsx                          ← WalkthroughLayout wrapper, FileViewer state
  components/
    FileViewer.tsx                  ← NEW: file viewer component
    CRWalkthrough.tsx               ← wrap steps in anchor links
  renderers/
    SourceRenderer.tsx              ← file badge → FileViewer link
    AnnotationRenderer.tsx           ← file+line badge → FileViewer link
    DiffRenderer.tsx                ← from/to badges → compare FileViewer
    CompareRenderer.tsx              ← pane headers → FileViewer link
    StepCard.tsx                    ← data-step-id attribute on all steps
    StepRendererRegistry.tsx        ← pass openFile callback to renderers
  stories/
    FileViewer.stories.tsx          ← NEW: stories for FileViewer
    SourceRenderer.stories.tsx      ← update with link variant stories
    AnnotationRenderer.stories.tsx   ← update with link variant stories
    DiffRenderer.stories.tsx        ← update with compare-link stories
  stories/Introduction.stories.mdx   ← update with cross-linking note
  index.ts                          ← export FileViewer (if needed externally)

internal/domain/walkthrough.go       ← no changes (URL construction is frontend-only)
internal/api/                      ← no changes
pkg/doc/                            ← update walkthrough reference (id field is now meaningful)
```

---

## 14. Testing approach

**Unit tests:**
- `buildFileViewerUrl` - verify URL construction for all combinations
- `parseSearchParams` - verify FileViewer state from URL
- Each renderer - verify onClick is called with correct args when badge is clicked

**Storybook:**
- FileViewer stories: empty, loading, loaded, compare mode, highlight line, close
- SourceRenderer stories: with and without FileViewer links
- AnnotationRenderer stories: with FileViewer links
- Full walkthrough story: click annotation → FileViewer opens → close → back navigation works

**Integration tests (Playwright):**
1. Load walkthrough
2. Click annotation file badge → FileViewer opens at correct line
3. Verify URL contains correct query params
4. Click close → URL restored, FileViewer gone
5. Browser back → FileViewer re-opens (URL state preserved)
6. Refresh page → FileViewer re-opens from URL
7. Click source badge → FileViewer updates with new file
8. Diff from badge → compare mode opens with correct ref

---

## 15. Milestones

**M1 - Step anchors:** Add `data-step-id` to StepCard, add fragment navigation support. No FileViewer yet.

**M2 - FileViewer component:** New component, modal mode, reads/writes query params. Source badge opens it.

**M3 - Annotation → FileViewer:** Annotation badge links to FileViewer at the annotated line.

**M4 - Diff → FileViewer:** Diff from/to badges open compare mode.

**M5 - Compare pane links:** Each compare pane header links to its own FileViewer pane.

**M6 - Inline mode:** Add inline toggle to FileViewer. Compare step type uses inline FileViewer.

**M7 - Stories and docs:** Update all renderer stories, update DSL reference to document `id` field semantics.

---

## See Also

- CR-DSL-001 index - `ttmp/2026/04/04/CR-DSL-001--go-react-rtk-query-themeable-cr-walkthrough-system/index.md`
- CR-DSL-001 DSL reference - `pkg/doc/topics/cr-dsl-walkthrough-reference.md`
- CR-DSL-001 step types - `pkg/doc/topics/cr-dsl-step-types.md`
- CR-DSL-001 React library API - `pkg/doc/topics/cr-dsl-react-library.md`
