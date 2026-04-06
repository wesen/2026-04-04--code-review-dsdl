# CR-DSL-002 Tasks

## M1 — Step Anchors
*Add data-step-id to every StepCard so fragment links can scroll to any step.*

- [x] M1.1 Read `StepCard.tsx` and `StepRendererRegistry.tsx` — understand current rendering flow
- [x] M1.2 Add `data-step-id` attribute to `StepCard` root div using step's `id` field or fallback `step-N`
- [x] M1.3 Add a hidden `<a id="step-N" tabIndex={-1} aria-hidden />` inside `StepCard` for fragment targets
- [x] M1.4 Write Storybook stories: step with explicit `id`, step with auto-generated `id`
- [x] M1.5 Verify fragment navigation works: navigate to `/wt/auth-refactor#step-3`, page scrolls to step-3

## M2 — FileViewer Component + Query Param State
*New FileViewer component; state lives in URL query params.*

- [x] M2.1 Read `App.tsx`, `WalkthroughPage.tsx` — understand current routing
- [x] M2.2 Create `frontend/src/components/FileViewer.tsx` — modal overlay, reads query params via `useSearchParams`
- [x] M2.3 `FileViewer` state: `{ file, ref, startLine, endLine, highlightLine, compare, compareRef }`
- [x] M2.4 Write `buildFileViewerUrl(base, state)` utility — constructs query param URL
- [x] M2.5 Integrate `FileViewer` into `WalkthroughPage` — render when query params present, hide when absent
- [x] M2.6 `FileViewer` fetches content via RTK Query `getFileContent`; renders via `CodeBlock`
- [x] M2.7 On mount/highlight change: `highlightedLine.scrollIntoView()`
- [x] M2.8 Close button: `navigate(base)` (removes query params)
- [x] M2.9 Write Storybook stories: empty (no params), loading, loaded, with highlight, compare mode
- [x] M2.10 Browser back/forward: URL change drives FileViewer open/close correctly

## M3 — SourceRenderer File Badge → FileViewer
*The file badge in a source step opens the FileViewer.*

- [x] M3.1 Read `SourceRenderer.tsx`, `CRWalkthrough.tsx`, `StepRendererRegistry.tsx` — understand prop flow
- [x] M3.2 Add `openFile?: (state: FileViewerState) => void` prop to `SourceRenderer`
- [x] M3.3 Change `FileBadge` `<span>` to `<button>` — onClick calls `openFile({ file, ref, startLine, endLine })`
- [x] M3.4 Wire `openFile` prop through `StepRendererRegistry` → `StepCard` → `CRWalkthrough`
- [x] M3.5 `CRWalkthrough` calls `navigate(buildFileViewerUrl(base, state))` when `openFile` fires
- [x] M3.6 Make line numbers in `CodeLine` clickable — calls `openFile` with `highlightLine: N` for that line
- [x] M3.7 Storybook stories: SourceRenderer with openFile callback, line number clicked

## M4 — AnnotationRenderer → FileViewer
*The file+line badge in an annotation opens the FileViewer at that line.*

- [x] M4.1 Read `AnnotationRenderer.tsx` — understand current badge structure
- [x] M4.2 Add `openFile` prop to `AnnotationRenderer`
- [x] M4.3 Make severity badge non-interactive (severity is not a nav target)
- [x] M4.4 Make `FileLineBadge` (file:line text) a `<button>` — onClick: `openFile({ file, ref: walkthrough.head, lines:[N,N], highlightLine:N })`
- [x] M4.5 Wire `openFile` through the same prop chain as SourceRenderer
- [x] M4.6 Storybook stories: AnnotationRenderer with openFile callback, annotation at various severity levels

## M5 — DiffRenderer → FileViewer Compare Mode
*The from/to badges in a diff step open FileViewer in compare mode.*

- [x] M5.1 Read `DiffRenderer.tsx` — understand diff header structure
- [x] M5.2 Add `openFile` prop to `DiffRenderer`
- [x] M5.3 Make from-badge `<button>` — onClick: `openFile({ compare:true, from:step.from, to:step.to, compareRef:step.from })`
- [x] M5.4 Make to-badge `<button>` — onClick: `openFile({ compare:true, from:step.from, to:step.to, compareRef:step.to })`
- [x] M5.5 FileViewer compare mode: render two CodeBlocks side by side, each fetching from respective ref
- [x] M5.6 Wire `openFile` through prop chain
- [x] M5.7 Storybook stories: DiffRenderer with from/to badge clicks, FileViewer in compare mode

## M6 — CompareRenderer Pane Headers → FileViewer
*Each compare pane header links to its own FileViewer pane.*

- [x] M6.1 Read `CompareRenderer.tsx` — understand pane structure
- [x] M6.2 Add `openFile` prop to `CompareRenderer`
- [x] M6.3 Each pane already uses SourceRenderer — pass `openFile` through to SourceRenderer
- [x] M6.4 Storybook story: CompareRenderer with openFile, clicking pane header opens single-pane FileViewer

## M7 — Inline Mode + Stories + Docs
*Add inline toggle, update all stories, update DSL reference.*

- [x] M7.1 Add inline/modal toggle to FileViewer — "Open inline" button switches mode
- [x] M7.2 Inline mode: FileViewer renders above/below the triggering step, walkthrough continues below
- [x] M7.3 Update all renderer stories: remove openFile prop (set in CRWalkthrough integration stories instead)
- [x] M7.4 Write integration story: `CRWalkthrough` + FileViewer together — click annotation → FileViewer opens → close works
- [x] M7.5 Update DSL reference doc (`pkg/doc/topics/cr-dsl-walkthrough-reference.md`): document `id` field semantics for step anchors
- [x] M7.6 Update step types doc (`pkg/doc/topics/cr-dsl-step-types.md`): cross-linking section per step type
- [x] M7.7 Playwright E2E test: load walkthrough, click annotation badge, verify FileViewer at correct line, close, browser back works
