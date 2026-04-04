# Tasks

## Phase 1: Go backend — YAML parser + data model + REST API

- [x] 1.1  Set up Go module (`go mod init`, `go get chi/yaml.v3`), directory layout (`cmd/cr-server`, `internal/domain`, `internal/api`, `internal/domain/yaml`, `internal/api/routes`)
- [x] 1.2  Define domain types in `internal/domain/walkthrough.go` (Walkthrough, Step discriminated union, all typed step structs)
- [x] 1.3  Implement YAML parser in `internal/domain/yaml/parser.go` + round-trip tests in `testdata/`
- [x] 1.4  Set up Chi router in `internal/api/server.go` with CORS, logger, compression middleware; add `GET /api/health`
- [x] 1.5  Implement `GET /api/walkthroughs` (list with metadata) in `internal/api/`
- [x] 1.6  Implement `GET /api/walkthroughs/:id` (full walkthrough) in `internal/api/`
- [x] 1.7  Implement `GET /api/files/content` (file at ref+lines) in `internal/api/files.go` — reads from local disk path, no git yet
- [x] 1.8  Write `Makefile` (`make build`, `make dev`, `make run`) and `cmd/cr-server/main.go` entrypoint
- [x] 1.9  Write unit tests: parser tests, API handler tests with `httptest`

## Phase 2: Go backend — Git integration (go-git, diff, refs)

- [ ] 2.1  Integrate `go-git/go-git/v5`, implement `internal/domain/git/repo.go` (Open, ResolveRef, ReadFileLines)
- [ ] 2.2  Wire git service into `GET /api/files/content` (replace raw disk read with git read at ref)
- [ ] 2.3  Implement `GET /api/files/diff` using `git diff` subprocess (placeholder for Phase 3 pure-Go replacement)
- [ ] 2.4  Implement `GET /api/repos/:repo/refs` (list branches/tags)
- [ ] 2.5  Error handling: 404 for missing file/ref, 416 for out-of-bounds line range, 400 for missing params
- [ ] 2.6  Add in-memory LRU cache for file reads with 5-minute TTL

## Phase 3: React frontend — Component scaffold + theming foundation

- [ ] 3.1  Initialize Vite + React 18 + TypeScript project under `frontend/`
- [ ] 3.2  Set up `packages/cr-walkthrough/` as local workspace package (`workspace:` in package.json)
- [ ] 3.3  Define `parts.ts` — full `data-part` name constants (PARTS.*)
- [ ] 3.4  Write `tokens.css` — all CSS custom properties (colors, typography, spacing, radius, shadow, layout)
- [ ] 3.5  Write `theme-dark.css` and `theme-light.css` — default token values for each theme
- [ ] 3.6  Write `CRWalkthrough.tsx` root component with `ThemeProvider` context + `data-widget` / `data-theme` attributes
- [ ] 3.7  Set up `frontend/storybook/` with `@storybook/react-vite`, preview with both themes
- [ ] 3.8  Write Storybook Introduction page + `CRWalkthrough.stories.tsx` (default, dark, light, custom tokens)

## Phase 4: React frontend — RTK Query API layer + MSW mocks

- [ ] 4.1  Set up Redux store + `walkthroughsApi` in `frontend/src/api/` (4 endpoints: listWalkthroughs, getWalkthrough, getFileContent, getFileDiff)
- [ ] 4.2  Configure RTK Query cache: file content cached independently, 5-minute TTL, no background refetch on window focus
- [ ] 4.3  Set up MSW browser worker in `frontend/src/mocks/browser.ts`
- [ ] 4.4  Write `frontend/src/mocks/handlers.ts` — handlers for all 4 API endpoints
- [ ] 4.5  Create `frontend/src/mocks/fixtures/` — JSON fixtures for auth-refactor walkthrough + file content
- [ ] 4.6  Write `frontend/src/App.tsx` — route `/` renders `CRWalkthrough`, route `/wt/:id` renders specific walkthrough
- [ ] 4.7  Write integration test: walkthrough loads from MSW, steps render, RTK Query cache hit on re-render

## Phase 5: React frontend — Step renderer components

- [ ] 5.1  Implement `FileBadge` + `CodeBlock` + `CodeLine` primitives with `data-part` attributes and CSS Modules
- [ ] 5.2  Implement `TextRenderer` (prose paragraph)
- [ ] 5.3  Implement `SourceRenderer` (file badge + code block, uses `useGetFileContentQuery`)
- [ ] 5.4  Implement `DiffRenderer` (unified diff with color-coded Addition/Deletion/Context lines)
- [ ] 5.5  Implement `CodeRenderer` (syntax-highlighted inline snippet via `<pre>`)
- [ ] 5.6  Implement `CompareRenderer` (two-pane side-by-side, each side uses `SourceRenderer`)
- [ ] 5.7  Implement `LinkRenderer` (external link, styled)
- [ ] 5.8  Implement `AnnotationRenderer` (severity-colored inline comment box)
- [ ] 5.9  Implement `CheckpointRenderer` (interactive quiz: multiple-choice, immediate feedback, correct/incorrect explanation)
- [ ] 5.10 Implement `RevealRenderer` (collapsible toggle with animated ▸ arrow, local state)
- [ ] 5.11 Implement `ShellRenderer` (command block + expected output display)
- [ ] 5.12 Implement `SectionRenderer` (grouped steps with title, recursive `StepCard` rendering, depth-based indentation)
- [ ] 5.13 Implement `BranchRenderer` (navigation prompt with goto-based branching, navigation state management)
- [ ] 5.14 Implement `StepCard` wrapper (type badge + index + step renderer dispatch)
- [ ] 5.15 Write `StepRendererRegistry.tsx` — maps `step.type` → renderer component, used by StepCard

## Phase 6: React frontend — Storybook stories + QA

- [ ] 6.1  Add Storybook stories for each renderer in isolation (default + loading state + error state)
- [ ] 6.2  Add Storybook stories for themed variants (dark, light, custom token overrides)
- [ ] 6.3  Add Storybook story for `CRWalkthrough` with full walkthrough fixture
- [ ] 6.4  Add Storybook story for unstyled mode (`unstyled={true}`)
- [ ] 6.5  Run `tsc --noEmit` in strict mode, fix all type errors
- [ ] 6.6  Accessibility: verify ARIA labels on interactive elements, keyboard navigation for Checkpoint and Reveal
- [ ] 6.7  Visual regression: run Storybook chromatic (or screenshot baseline), verify no regressions

## Phase 7: Integration — go:embed SPA into binary

- [ ] 7.1  Configure `frontend/package.json` `build` script outputs to `dist/`
- [ ] 7.2  Configure `//go:embed dist/*` in `internal/api/server.go`
- [ ] 7.3  SPA fallback handler: all non-`/api/*` paths serve `index.html` (enables React Router)
- [ ] 7.4  `Makefile`: `make build` runs `npm run build` then `go build`, produces single `bin/cr-server` binary
- [ ] 7.5  Write sample walkthrough YAML (`walkthroughs/auth-refactor.yaml`) and sample file tree (`sample-repo/`)
- [ ] 7.6  Smoke test: `make build && ./bin/cr-server -repo ./sample-repo -walkthroughs ./walkthroughs -port 8080` → visit http://localhost:8080, API returns JSON, SPA renders
- [ ] 7.7  Playwright E2E test: load walkthrough, render all step types, interact with Checkpoint, navigate via Branch

## Phase 8: reMarkable upload

- [ ] 8.1  Run `docmgr doctor --ticket CR-DSL-001 --stale-after 30`, fix any warnings
- [ ] 8.2  `remarquee upload bundle --dry-run` for final bundle (design doc + diary + changelog)
- [ ] 8.3  Real `remarquee upload bundle` to `/ai/YYYY/MM/DD/CR-DSL-001`
- [ ] 8.4  `remarquee cloud ls /ai/... --long --non-interactive` to verify upload

---
Title: Go + React RTK-Query Themeable CR Walkthrough System
Ticket: CR-DSL-001
Status: active
Topics:
    - code-review
    - design-doc
    - go-backend
    - react-frontend
    - rtk-query
    - storybook
    - themable-css
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: imports/cr-walkthrough-dsl.jsx
      Note: React prototype — reference UI implementation
    - Path: imports/spec-dsl.md
      Note: DSL schema definition — the domain model to implement
ExternalSources: []
Summary: ""
LastUpdated: 2026-04-04T21:15:00-04:00
WhatFor: ""
WhenToUse: ""
