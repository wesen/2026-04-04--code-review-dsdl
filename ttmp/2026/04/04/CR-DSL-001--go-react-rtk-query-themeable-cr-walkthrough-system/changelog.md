# Changelog

## 2026-04-04

### Phase 3: React frontend scaffold (Tasks 3.1–3.8)

Full frontend scaffold: 95 stories across 18 story files. TypeScript clean. Storybook builds.

- `packages/cr-walkthrough/`: local workspace package (`workspace:` in root package.json)
  - `types.ts`: all 12 step types + discriminated union + Walkthrough/FileContent/DiffContent
  - `parts.ts`: 50+ `data-part` constant names (PARTS.*) for stable theming selectors
  - `tokens.css`: CSS custom property surface — --cr-color-*, --cr-space-*, --cr-font-*, --cr-radius-*
  - `theme-dark.css` / `theme-light.css`: default token values
  - `api/walkthroughsApi.ts`: RTK Query slice (4 endpoints)
  - `components/`: FileBadge, CodeBlock, CodeLine, Note, CRWalkthrough + ThemeProvider
  - `renderers/`: 13 step renderers (Text, Source, Diff, Code, Compare, Link, Annotation, Checkpoint, Reveal, Shell, Section, Branch, StepCard, StepRendererRegistry)
  - `fixtures/authRefactor.ts`: complete walkthrough fixture
  - `stories/`: 18 story files — 95 stories total

Key design decisions:
- `data-part` attributes on every visual region for stable theming selectors
- `satisfies Meta<typeof Component>` pattern in stories
- `@crs-cradle/cr-walkthrough` workspace package with workspace:// alias
- RTK Query v2 API (no getDefaultState — use upsertQueryData)
- npm workspaces for the package

---

## 2026-04-04

### Phase 2: Git integration (Tasks 2.1–2.6)

Git service layer backed by `go-git/go-git/v5`:
- `internal/domain/git/service.go`: `RepoService` interface, `GitRepoService` implementation — `ResolveRef`, `ReadFileLines`, `GetDiff` (git subprocess), `ListRefs`
- `internal/domain/git/cache.go`: `RepoServiceWithCache` — in-memory TTL cache (5-min), background eviction goroutine, decorator pattern
- `internal/api/files.go`: wired `git.RepoService` into `GET /api/files/content`, added `GET /api/files/diff` (`from`/`to` params), `GET /api/repos/refs` (branches + tags)
- `internal/api/server.go`: `Config.RepoService` (optional, nil → default cached service), `handleReposRoutes`
- `internal/api/api_test.go`: updated `TestHandleFileContent` to use real git-backed service

All git tests (11): `ResolveRef`, `ReadFileLines`, `GetDiff`, `ListRefs`, `SplitLines`, and error cases — pass. API tests (5) pass. Full suite: 29 passing.

Key bugs fixed during implementation:
- `splitLines`: consecutive newlines and trailing newlines produced spurious empty strings → fixed with post-filtering
- `git diff A..B` with `cmd.Dir=tmp`: git parses right side as path → switched to `git diff A B` (explicit two-tree form)
- `git diff` exit code 128 (not 1) for missing refs → `errors.As` instead of string containment for error classification
- `git init` in Go test: `git -C tmp init --quiet` with `-C` flag works reliably

---

## 2026-04-04

### API server and handler tests (Tasks 1.4–1.9)

Full Go backend HTTP server scaffold:
- `internal/api/server.go`: Chi router, CORS/compression/logger middleware, `ListenAndRun()` with graceful shutdown, `writeJSON`/`writeError` helpers
- `internal/api/walkthroughs.go`: `GET /api/walkthroughs` (list with metadata + step count), `GET /api/walkthroughs/:id` (full walkthrough), `serializeSteps()` for discriminated union JSON output
- `internal/api/files.go`: `GET /api/files/content` with query params (`ref`, `path`, `start`, `end`), range validation (max 500 lines), proper 400/404/416 error responses, TODO comment for Phase 2 git integration
- `cmd/cr-server/main.go`: flag parsing (`-walkthroughs`, `-repo`, `-port`), wired to `api.ListenAndRun()`
- `Makefile`: `build`, `run`, `dev`, `test`, `test-verbose`, `lint`, `fmt`, `tidy`, `clean`, `sample-wt`
- Sample repo files: `src/middleware/auth.ts`, `src/utils/token.ts`
- Smoke test: all 3 endpoints return correct JSON (verified with curl + tmux)
- API handler tests (5 passing): health, list, get, file content, writeError

All 17 tests pass (12 parser + 5 API).

---

## 2026-04-04

### YAML parser round-trip bug fixed (Task 1.3)

Spent ~2 hours debugging a round-trip failure before correctly identifying the root cause: `yaml.Unmarshal` does not recursively decode nested YAML mappings into non-pointer struct fields. Only pointer fields trigger recursive decode.

Correct fix: `extractSharedFields()` pre-collects shared fields, `typedMappingForStep()` extracts the correct mapping node for each YAML style (typed-key-as-outer-key vs. `type:` sibling), and all 12 step types use `typedMappingForStep(...).Decode(&s)`.

All 12 parser tests pass including round-trip. See `reference/02-yaml-parser-bug-postmortem.md` for full details.

### Tasks expanded to 36 concrete sub-tasks

Broke each of the 8 phases into individual checklist items. Phase 1 now has 9 sub-tasks (1.1–1.9).

---

## 2026-04-04

### Design doc written

Wrote the full **Architecture Design and Implementation Guide** (`design-doc/01-architecture-design-and-implementation-guide.md`), ~53KB covering:

- Problem statement and system goals
- Deep analysis of the JSX prototype and DSL spec (reference material)
- ASCII architecture diagram and full repository file tree
- Go backend: domain model, YAML parser, git service, REST API endpoints, go:embed SPA
- React frontend: tech stack, RTK Query API layer, MSW setup, CSS theming with data-part contract, step renderer registry, navigation state
- 8 phased implementation tasks mapped to ticket tasks
- Testing strategy matrix
- Risks, alternatives, and 3 open questions

Also wrote the **Investigation Diary** (`reference/01-investigation-diary.md`) with 5 chronological steps recording what was done, learned, and what needs review.

---

## 2026-04-04

- Initial workspace created

