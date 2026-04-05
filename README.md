# Code Review Walkthrough System

Interactive, step-by-step code review guides rendered from YAML walkthrough definitions.
A Go backend serves a REST API + embedded React SPA. The frontend is a themeable,
Storybook-documented component library.

## Quick start

**Two-process dev loop** (recommended for development):

```bash
# Terminal 1 — Go API server
make dev-api REPO=./sample-repo WT=./sample-repo/walkthroughs PORT=8080

# Terminal 2 — Vite dev server (proxies /api to :8080)
cd frontend && npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

**Single binary** (production):

```bash
make build
./bin/cr-server -repo ./sample-repo -walkthroughs ./sample-repo/walkthroughs -port 8080
```

## Project layout

```
.
├── cmd/cr-server/          Go entry point
├── internal/
│   ├── api/                Chi router, handlers, SPA fallback, embed
│   └── domain/
│       ├── git/            git repo service (go-git, TTL cache)
│       ├── walkthrough.go  Domain types
│       └── yaml/           Walkthrough YAML parser
├── static/                 Go package: //go:embed SPA artifacts
├── frontend/               React + Vite workspace
│   ├── src/
│   │   ├── App.tsx         App shell: React Router, ThemeProvider
│   │   ├── store/         Redux store (RTK Query slice)
│   │   ├── mocks/          MSW browser worker + handlers
│   │   └── main.tsx        MSW startup, Redux Provider
│   └── packages/cr-walkthrough/
│       └── src/
│           ├── types.ts         All domain types
│           ├── parts.ts         data-part attribute constants
│           ├── tokens.css       CSS custom properties (--cr-*)
│           ├── theme-dark.css   Dark theme token values
│           ├── theme-light.css  Light theme token values
│           ├── api/             RTK Query slice (4 endpoints)
│           ├── components/       FileBadge, CodeBlock, CodeLine, Note
│           ├── renderers/       13 step renderers + StepCard
│           ├── stories/         Storybook stories (95 stories)
│           ├── fixtures/        auth-refactor walkthrough fixture
│           └── mocks/           MSW request handlers
└── sample-repo/            Git repo with walkthroughs/
```

## Dev commands

| Command | What it does |
|---|---|
| `make dev-api` | Go API server on `:8080` |
| `make dev` | Vite dev server on `:5173` with `/api` proxy |
| `make test` | Go tests (29 passing) |
| `make lint` | `golangci-lint run` |
| `make clean` | Remove `bin/`, `frontend/dist/`, `static/dist/` |

## Build commands

| Command | What it does |
|---|---|
| `make build` | `build-frontend` → `copy-static` → `go build` → `bin/cr-server` |
| `make build-frontend` | `npm run build` inside `frontend/` |
| `make build-go` | Just the Go binary (requires `static/dist/` already) |

## Theming

CSS custom properties (all defined in `tokens.css`, overridden by theme files):

```css
--cr-color-bg            /* page background */
--cr-color-text          /* primary text */
--cr-color-accent        /* interactive elements */
--cr-color-severity-warn /* annotation warning */
--cr-space-4            /* spacing unit (8px) */
--cr-font-sans           /* body font */
--cr-font-mono          /* code font */
```

Override at runtime:

```tsx
<CRWalkthrough
  walkthroughId="auth-refactor"
  tokens={{ '--cr-color-accent': '#ff6600' }}
/>
```

Use the `data-part` attribute selectors from `parts.ts` to style specific regions.

## API

| Endpoint | Description |
|---|---|
| `GET /api/health` | Health check |
| `GET /api/walkthroughs` | List all walkthroughs |
| `GET /api/walkthroughs/:id` | Full walkthrough with steps |
| `GET /api/files/content?ref=&path=&start=&end=` | File content at git ref |
| `GET /api/files/diff?from=&to=&path=` | Unified diff between refs |
| `GET /api/repos/refs` | List branches and tags |

## Storybook

```bash
cd frontend && npm run build-storybook
# Output: frontend/storybook-static/
```

Or dev mode (rebuilds on change):

```bash
cd frontend && npm run storybook
# Opens http://localhost:6006
```

## Tests

```bash
make test              # all tests, short form
make test-verbose      # with output
make test-race         # race detector
```

Go tests live alongside source: `*_test.go` files in each package.
Frontend tests via vitest: `frontend/src/**/*.test.ts`.
