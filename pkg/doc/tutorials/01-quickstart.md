---
Title: "Quick Start — Run the Code Review Walkthrough System"
Slug: cr-dsl-quickstart
SectionType: Tutorial
Topics:
  - cr-dsl
  - quickstart
  - development
  - setup
IsTemplate: false
IsTopLevel: false
ShowPerDefault: true
Order: 1
---

This tutorial walks you through running the system for the first time and writing your first walkthrough. By the end you'll have a working dev environment with the Go API server and the React SPA running together, and you'll understand the basic shape of a walkthrough YAML file.

## What you are building

The Code Review Walkthrough System (CR-DSL) is a tool for writing interactive, step-by-step code review guides. Each guide is a YAML file that describes a sequence of "steps" — prose paragraphs, code snippets, diffs, annotations, quizzes, and more. The Go backend serves the walkthroughs and file content from a git repository. The React frontend renders them as a themed, navigable SPA.

The system has three moving parts:

1. **Go API server** — serves walkthrough YAML, file content, and git diffs over HTTP
2. **React SPA** — renders the walkthrough as an interactive page with dark/light theming
3. **YAML walkthrough file** — the authored content that lives in your git repo

You run the Go API server and the Vite dev server simultaneously during development. In production, `make build` compiles everything into a single binary.

## Prerequisites

- Go 1.25 or later
- Node.js 20 or later
- npm 10 or later
- git

Check your versions:

```bash
go version   # should be 1.25+
node --version  # should be 20+
npm --version   # should be 10+
```

## Step 1 — Clone and install dependencies

```bash
git clone <repo-url>
cd <repo-name>
```

Install Go dependencies and run the test suite to verify the setup is sound:

```bash
go mod download
make test
# → 29 passing
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

## Step 2 — Start the Go API server

The Go server listens on port 8080 by default. It needs two arguments:

- `-repo` — path to the git repository whose files you want to review
- `-walkthroughs` — path to the directory containing walkthrough YAML files

A sample repository is included:

```bash
cd ..
make dev-api REPO=./sample-repo WT=./sample-repo/walkthroughs PORT=8080
# → server: listening on :8080
```

The server is now running in this terminal. Open a second terminal for the next step.

## Step 3 — Start the React dev server

The Vite dev server listens on port 5173. It proxies all `/api` requests to the Go server on port 8080, so the browser only needs to connect to one URL:

```bash
cd frontend
npm run dev
# → VITE v8.0.3  ready in 149 ms
# → ➜  Local: http://localhost:5173/
```

Open [http://localhost:5173](http://localhost:5173) in your browser. You should see the home page with a "Start: PR #482" button. Click it to see the demo walkthrough.

## Step 4 — Verify the API is working

In your browser or with curl:

```bash
# Health check
curl http://localhost:8080/api/health
# → {"status":"ok"}

# List walkthroughs
curl http://localhost:8080/api/walkthroughs
# → {"walkthroughs":[{"id":"auth-refactor",...}]}

# Get one walkthrough
curl http://localhost:8080/api/walkthroughs/auth-refactor | jq '.steps | length'
# → 8
```

## Step 5 — Write your first walkthrough

Create a new YAML file in `sample-repo/walkthroughs/`:

```yaml
id: my-first-walkthrough
title: "My first code review"
repo: github/acme/my-app
base: main
head: feat/my-branch
authors:
  - alice
steps:
  - id: intro
    type: text
    body: |
      This walkthrough reviews the changes in `feat/my-branch`.

  - id: file-view
    type: source
    file: src/main.go
    lines: [1, 20]
    note: "The entry point for the application."

  - id: check-errors
    type: checkpoint
    prompt: What does the error handler return?
    choices:
      - label: "HTTP 500"
        correct: true
        explanation: "The handler returns 500 Internal Server Error for unhandled exceptions."
      - label: "HTTP 200"
        correct: false
        explanation: "200 would hide the error from the client."
```

Save the file, then refresh the browser. The walkthrough should appear in the home page list and load when clicked.

## Project layout

```
.
├── cmd/cr-server/          Go entry point
├── internal/
│   ├── api/               Chi router + handlers + SPA embed
│   │   ├── routes/        Per-resource route handlers
│   │   ├── server.go       Main router, middleware, SPA fallback
│   │   └── embed.go       //go:embed for the React build
│   └── domain/
│       ├── git/           Git service (go-git) + TTL cache
│       ├── walkthrough.go  Domain types (Step discriminated union)
│       └── yaml/           YAML parser
├── static/                Go package for SPA assets
├── frontend/              React workspace
│   ├── src/
│   │   ├── App.tsx       App shell (React Router, ThemeProvider)
│   │   ├── store/        Redux store
│   │   └── mocks/         MSW browser mocks
│   └── packages/cr-walkthrough/
│       └── src/
│           ├── types.ts    TypeScript domain types
│           ├── parts.ts    data-part attribute constants
│           ├── tokens.css CSS custom property surface
│           ├── theme-dark.css
│           ├── theme-light.css
│           ├── api/        RTK Query slice
│           ├── components/ FileBadge, CodeBlock, CodeLine, Note
│           ├── renderers/  13 step renderers
│           └── stories/    Storybook stories (95 total)
└── sample-repo/
    └── walkthroughs/       YAML walkthrough files
```

## Build for production

When you want a single binary:

```bash
make build
# → frontend build → copy assets → go build
# → bin/cr-server
```

Run it anywhere (no npm, no node required):

```bash
./bin/cr-server -repo ./sample-repo -walkthroughs ./sample-repo/walkthroughs -port 8080
```

All assets are embedded in the binary. Visit port 8080 to use the full SPA.

## Troubleshooting

Problem | Cause | Solution
---|---|---
`GET /` returns 404 | SPA not embedded | Run `make build` first
`GET /api/walkthroughs` returns `[]` | Walkthrough YAML file not found | Check `-walkthroughs` path is correct
TypeScript errors in frontend | Missing deps | `cd frontend && npm install`
Go build fails with `pattern dist: no matching files found` | SPA not built | Run `make build` not just `make build-go`

## See Also

- [`cr-dsl-walkthrough-reference`](cr-dsl-walkthrough-reference) — full YAML DSL reference
- [`cr-dsl-step-types`](cr-dsl-step-types) — all 13 step types with examples
- [`cr-dsl-theming`](cr-dsl-theming) — CSS custom property theming guide
- [`cr-dsl-writing-a-walkthrough`](cr-dsl-writing-a-walkthrough) — authoring walkthroughs end-to-end
