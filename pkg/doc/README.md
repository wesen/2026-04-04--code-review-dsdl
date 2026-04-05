---
Title: "Code Review Walkthrough System"
Slug: cr-dsl
SectionType: Application
Topics:
  - cr-dsl
  - code-review
  - walkthrough
  - interactive
  - guide
  - dsl
IsTopLevel: true
ShowPerDefault: true
Order: 1
---

The Code Review Walkthrough System (CR-DSL) is a tool for authoring and delivering interactive, step-by-step code review guides. Authors write a YAML file that describes a sequence of annotated steps — prose, code snippets, diffs, quizzes, and more — and the system renders them as a navigable, themeable web page.

It is designed for teams that want structured code reviews: the guide enforces a reading order, highlights the most important lines, and checks understanding with quizzes. It works equally well for async review (readers follow the guide on their own) and synchronous review (reviewer and author walk through it together).

## What the system does

**Authors write YAML.** Each step is a typed block — text, source code, diff, annotation, quiz, and more. The YAML lives in the git repository alongside the code, so it stays in sync with the changeset.

**The Go backend serves two things:** the walkthrough YAML (parsed and served as JSON) and the git file reads and diffs. It reads from the git repository directly, so it always shows the exact state of any ref.

**The React frontend renders the guide.** It fetches the walkthrough from the API, renders each step, and handles the interactive ones (quizzes, collapsible sections, navigation). It is fully themeable via CSS custom properties — dark and light themes are built in, and consumers can override any token.

**The SPA is embedded in the Go binary.** A single `bin/cr-server` binary serves both the API and the web page. No separate frontend server needed in production.

## Architecture diagram

```
┌──────────────────────────────────────────────────────────────┐
│                       Browser                                  │
│                                                               │
│  ┌─────────────────┐     ┌─────────────────────────────┐    │
│  │  React SPA      │     │   Go API                   │    │
│  │  (Vite dev)     │────▶│   (chi router)            │    │
│  │  localhost:5173  │     │   localhost:8080           │    │
│  │                 │     │                             │    │
│  │  GET /wt/:id    │     │  GET /api/walkthroughs/:id│    │
│  │  GET /api/...   │     │  GET /api/files/content   │    │
│  └─────────────────┘     │  GET /api/files/diff        │    │
│                         │  GET /api/repos/refs         │    │
│                         └──────────────┬──────────────┘    │
└────────────────────────────────────────│─────────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │   Git Repository     │
                              │  (local disk path)    │
                              │                       │
                              │  walkthroughs/        │
                              │    auth-refactor.yaml │
                              │                       │
                              │  refs: main, feat/*   │
                              │  files at any ref     │
                              └──────────────────────┘
```

Production build (single binary):

```
┌──────────────────────────────────────────────────────────────┐
│                       Browser                                  │
│   localhost:8080 (or any port)                               │
│   ┌─────────────────────────┐  ┌──────────────────────────┐ │
│   │  SPA (embedded in binary)│  │  Go API (same binary)    │ │
│   │  /                      │  │  /api/walkthroughs      │ │
│   │  /wt/:id               │  │  /api/files/content       │ │
│   └─────────────────────────┘  └──────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Key design decisions

**YAML lives in the git repo.** The walkthrough file is versioned alongside the code it reviews. When a branch is merged, the guide moves with it. When the code changes, the guide can be updated in the same commit.

**Git refs are the source of truth.** `base` and `head` in the YAML are git refs. Source and diff steps read from the actual git repository. There is no separate copy of file content — if the branch is rebased, the guide updates automatically.

**CSS custom properties for theming.** Every visual decision is a `--cr-*` custom property. The three-layer cascade (tokens → theme → consumer override) means the component library is always themeable without forking the code.

**React component library is a workspace package.** `@crs-cradle/cr-walkthrough` is an npm workspace package inside the repository. The app imports it as a local workspace dependency. In production, the CSS and JS are bundled into the SPA by Vite.

**No external database.** The server reads YAML files from disk and git from a local filesystem. There is nothing to configure, provision, or migrate.

## What's in this documentation

These pages form a complete reference for the system:

**Tutorials:**

- [`cr-dsl-quickstart`](cr-dsl-quickstart) — Run the system in five minutes
- [`cr-dsl-writing-a-walkthrough`](cr-dsl-writing-a-walkthrough) — Write your first walkthrough

**Topics:**

- [`cr-dsl-walkthrough-reference`](cr-dsl-walkthrough-reference) — Complete YAML format reference for every field
- [`cr-dsl-step-types`](cr-dsl-step-types) — Visual reference and behaviour for all 13 step types
- [`cr-dsl-api-reference`](cr-dsl-api-reference) — REST API endpoint reference
- [`cr-dsl-theming`](cr-dsl-theming) — CSS custom property theming guide
- [`cr-dsl-react-library`](cr-dsl-react-library) — React component and hook API reference

## System overview

```
YAML walkthrough file
  ↓ (read by Go server)
JSON REST API (GET /api/walkthroughs/:id)
  ↓ (fetched by React)
RTK Query cache
  ↓
React component tree
  ↓
CSS custom properties (--cr-color-*, --cr-font-*, etc.)
  ↓
Browser render
```

Step type → React renderer mapping:

```
text        → TextRenderer       (no API call)
source      → SourceRenderer    (GET /api/files/content)
diff        → DiffRenderer      (GET /api/files/diff)
code        → CodeRenderer      (static)
compare     → CompareRenderer   (two × source)
link        → LinkRenderer      (static)
annotation  → AnnotationRenderer (static)
checkpoint  → CheckpointRenderer (local state)
reveal      → RevealRenderer   (local state)
shell       → ShellRenderer    (static)
section     → SectionRenderer  (recursive)
branch      → BranchRenderer  (onGoto callback)
```

## Technology choices

| Layer | Technology | Why |
|---|---|---|
| API server | Go + Chi | Single binary, fast startup, no runtime dependency |
| Git reads | go-git v5 | Pure Go, no git CLI dependency |
| YAML parsing | gopkg.in/yaml.v3 | Stable, well-tested |
| SPA bundler | Vite 5 | Fast HMR, excellent TypeScript support |
| UI framework | React 18 | Hooks, JSX, broad ecosystem |
| State management | Redux Toolkit 2 | RTK Query for API caching |
| API mocking | MSW 2 | Service worker mocks in the browser |
| UI documentation | Storybook 8 | Component explorer with CSF format |
| CSS | CSS Custom Properties | Zero-JS theming, no runtime cost |

## Source locations

```
Go backend:
  cmd/cr-server/main.go           — entry point
  internal/api/server.go           — router + SPA fallback
  internal/api/embed.go          — //go:embed for SPA
  internal/api/routes/            — per-resource route handlers
  internal/domain/git/service.go  — RepoService interface
  internal/domain/git/cache.go    — TTL cache decorator
  internal/domain/walkthrough.go  — Go domain types
  internal/domain/yaml/parser.go — YAML → domain types

React frontend:
  frontend/src/App.tsx             — app shell
  frontend/src/store/              — Redux store
  frontend/src/mocks/              — MSW browser setup
  frontend/packages/cr-walkthrough/
    src/types.ts                   — TypeScript discriminated union
    src/parts.ts                  — data-part constants
    src/tokens.css                — CSS custom properties
    src/theme-dark.css            — dark theme values
    src/theme-light.css           — light theme values
    src/api/walkthroughsApi.ts    — RTK Query slice
    src/components/                — shared UI primitives
    src/renderers/                — 13 step renderers
    src/stories/                  — 95 Storybook stories
```

## See Also

- [`cr-dsl-quickstart`](cr-dsl-quickstart) — Get up and running in 5 minutes
- [`cr-dsl-walkthrough-reference`](cr-dsl-walkthrough-reference) — The YAML format
- [`cr-dsl-step-types`](cr-dsl-step-types) — All 13 step types
