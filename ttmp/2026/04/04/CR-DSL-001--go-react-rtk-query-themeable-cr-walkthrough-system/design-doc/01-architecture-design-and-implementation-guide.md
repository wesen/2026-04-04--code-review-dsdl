---
Title: Architecture Design and Implementation Guide
Ticket: CR-DSL-001
Status: active
Topics:
    - code-review
    - go-backend
    - react-frontend
    - rtk-query
    - themable-css
    - storybook
    - design-doc
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: imports/cr-walkthrough-dsl.jsx
      Note: React prototype — reference UI implementation
    - Path: imports/spec-dsl.md
      Note: DSL schema definition — the domain model to implement
ExternalSources: []
Summary: ""
LastUpdated: 2026-04-04T21:00:00-04:00
WhatFor: ""
WhenToUse: ""
---

# Architecture Design and Implementation Guide

**Ticket:** CR-DSL-001  
**Status:** Active  
**Last Updated:** 2026-04-04  
**Intent:** Long-term design & implementation reference

---

## 1. Executive Summary

This document is the canonical reference for building the **CR Walkthrough System**: a full-stack application that renders interactive code-review "walkthroughs" defined in a YAML DSL. The walkthrough DSL describes a sequence of typed steps — narration, file excerpts, diffs, quizzes, annotations, and more — that walk a reviewer through a pull request in a structured, interactive way.

The system has two major parts:

- **Go backend**: Serves YAML walkthrough files and, crucially, the raw source files they reference (from the local git repo on disk). It exposes a REST API for listing walkthroughs, fetching a walkthrough + its resolved source content, and serving raw file content at arbitrary line ranges.
- **React frontend**: A modular, themeable, Storybook-documented React application that fetches walkthrough data via RTK Query (with MSW mocks for offline development), renders each DSL step type with the appropriate component, and supports user interaction (checkpoints, reveals, branching navigation).

The design philosophy is: **start from the prototype, extract the domain model, then build each layer with the right tool**. The JSX prototype is the ground truth for UI behavior; everything else flows from it.

---

## 2. Problem Statement

Code reviews are one of the highest-leverage activities in software engineering, yet most review tooling is limited to:

- A raw diff view (side-by-side or unified)
- Inline comments (one-off, non-sequenced)
- A comment thread per file or per line

None of these tools guide a reviewer through a **structured narrative** of a change. A senior engineer reviewing PR #482 (auth middleware refactor) might want to say: "Start here at the token utility, then look at the middleware, then compare it to the old session flow, then answer this checkpoint question, then dig into the error-handling section." That's a walkthrough — and the current tooling can't express it.

**What we need:**

1. A **DSL** (YAML-based) that lets an author describe a multi-step, interactive code-review narrative.
2. A **backend** that resolves those YAML files and serves the underlying source files from a live git repo, so diffs and file excerpts are always accurate.
3. A **frontend** that renders the walkthrough with appropriate components for each step type, supports interactive elements (quizzes, reveals, branching), and is themeable for different team aesthetics.
4. **Development tooling**: the frontend must be developable offline (MSW mocks) and testable in isolation (Storybook), while the backend must be a single static binary (go:embed SPA).

---

## 3. Reference: The Prototype (imports/cr-walkthrough-dsl.jsx)

The file `imports/cr-walkthrough-dsl.jsx` is a **standalone React prototype** — a single-file, ~500-line JSX component that renders the full walkthrough UI. It is the **ground truth for UI behavior and visual design**. All implementation decisions for the React frontend should trace back to this file.

### 3.1 What the prototype does

The prototype implements a split-pane layout:

```
┌─────────────────────────────┬──────────────────────────────────────┐
│  LEFT PANE (44%)            │  RIGHT PANE (56%)                    │
│                             │                                      │
│  {" } Walkthrough DSL       │  [PR title, repo, base←head, authors]│
│  [preset buttons]           │  [step-type strip: icon strip]        │
│  [editable JSON textarea]   │  [StepCard × N]                       │
│                             │                                      │
│  Live validation + error    │  Scrollable step list                │
│  display                    │                                      │
└─────────────────────────────┴──────────────────────────────────────┘
```

The left pane lets the user switch between preset walkthroughs (Auth Refactor, API Pagination, Quick Fix) or edit the JSON directly. The right pane renders the parsed walkthrough.

### 3.2 Step rendering architecture

Every DSL step type has a dedicated renderer component. The prototype defines a registry:

```jsx
const R = {
  text:       RText,
  source:     RSource,
  diff:       RDiff,
  code:       RCode,
  compare:    RCompare,
  link:       RLink,
  annotation: RAnnotation,
  checkpoint: RCheckpoint,
  reveal:     RReveal,
  shell:      RShell,
  section:    RSection,
  branch:     RBranch,
};
```

Each renderer receives a `step` prop (the parsed YAML/JSON object) and optionally a `depth` prop for nested sections. The `StepCard` wrapper adds a type badge (icon + label) and a step index.

### 3.3 Key UI patterns in the prototype

**FileBadge** — a header bar above code blocks showing `filepath  L12–48`. Used by `RSource`, `RDiff`, `RCode`, `RCompare`. Every code-adjacent step has this pattern.

**CodeBlock / CLine** — a monospaced container with line numbers and optional highlight (left border + background tint). Highlights are driven by `step.highlight: [startLine, endLine]`.

**Interactive components**:
- `RCheckpoint`: multiple-choice quiz with immediate feedback (correct/incorrect explanation shown after click). State: `picked: number | null`.
- `RReveal`: collapsible toggle with animated `▸` arrow. State: `open: boolean`.

**Mock data**: The prototype uses seeded fake data (fakeBar) to render plausible-looking code when real source files aren't available. Real file content will come from the backend.

### 3.4 Design tokens in the prototype

The prototype defines a dark theme directly in inline styles. Key tokens:

| Token (conceptual) | Value | Used for |
|---|---|---|
| Background (root) | `#101114` | App background |
| Surface (panels) | `#141518`, `#0c0d10` | Cards, sidebars |
| Border | `#1e1f24`, `#1a1b20` | Dividers, card edges |
| Text primary | `#c8cad0`, `#e8e9ed` | Body, headings |
| Text muted | `#6b7280`, `#7c8da6` | Notes, labels |
| Accent blue | `#5b9cf5` | Links, source type |
| Accent gold | `#dba14e` | diff, checkpoint |
| Accent green | `#3ebfa5` | add lines, praise |
| Accent red | `#e06070` | del lines, issues |
| Accent purple | `#a87ee0` | code, section |
| Monospace font | `'DM Mono', 'Menlo', monospace` | All code |
| Sans font | `'Plus Jakarta Sans', system-ui, sans-serif` | UI chrome |

### 3.5 What to extract from the prototype

The frontend implementation will:

1. Replace the JSON textarea with RTK Query fetching from the Go backend.
2. Replace mock `fakeBar` code with real file content from the backend's file-serving endpoint.
3. Extract each renderer into a standalone component in a `packages/cr-walkthrough/` module.
4. Extract design tokens into CSS variables (`--cr-color-bg`, etc.).
5. Replace inline styles with `data-part` selectors following the React modular themable pattern.
6. Add MSW handlers that return realistic fixture data matching the backend API shape.

---

## 4. Reference: The DSL Schema (imports/spec-dsl.md)

The file `imports/spec-dsl.md` defines the YAML schema for walkthroughs. Every step is a YAML object with at least a `type` field. All other fields are type-specific.

### 4.1 Top-level structure

```yaml
walkthrough:
  title: "PR #482: Refactor auth middleware"
  repo: github/acme/backend          # human-readable repo name
  base: main                         # base branch / git ref
  head: feat/auth-refactor          # head branch / git ref
  authors: [alice, bob]             # list of author handles

  steps:
    - type: <step-type>
      # ... step-specific fields
```

### 4.2 Step type reference

| Type | Description | Required fields | Optional fields |
|---|---|---|---|
| `text` | Prose narration | `body` | `id`, `note` |
| `source` | File excerpt with line range | `file`, `lines: [start, end]` | `highlight: [a, b]`, `ref`, `note`, `id` |
| `diff` | Diff hunk display | `file`, `hunks: [n, m] or "all"` | `collapse`, `ref`, `note`, `id` |
| `code` | Inline code snippet | `lang`, `body` | `id`, `note` |
| `compare` | Side-by-side before/after | `left`, `right` (each: `file`, `ref`, `lines`) | `note`, `id` |
| `link` | External URL link | `url`, `label` | `id` |
| `annotation` | Line-level comment | `file`, `line`, `severity`, `body` | `ref`, `id` |
| `checkpoint` | Quiz with choices | `prompt`, `choices[]` | `id` |
| `reveal` | Expandable toggle | `label`, `body` | `id` |
| `shell` | Command + expected output | `cmd` | `output`, `expect_exit`, `note`, `id` |
| `section` | Named group of steps | `title`, `steps[]` | `id`, `note` |
| `branch` | Navigation decision | `prompt`, `options[]` (each: `label`, `goto`) | `id` |

### 4.3 Field semantics

- **`file`**: Always repo-relative (e.g., `src/middleware/auth.ts`). The backend resolves it against the repo root on disk.
- **`ref`**: Any git ref (branch name, tag, commit hash). Defaults to `head` (the walkthrough's `head` field). Used for `source`, `diff`, `annotation`, `compare`.
- **`lines`**: Always `[start, end]` inclusive, 1-indexed.
- **`highlight`**: Sub-range within `lines` to draw attention to (used in `source`).
- **`hunks`**: 1-indexed diff hunk numbers, or the string `"all"`.
- **`severity`**: One of `info`, `warn`, `issue`, `praise`. Maps to color tokens.
- **`id`**: A string identifier for `goto` targets (used by `branch` options and explicit `goto:` references).
- **`goto`**: A step `id` to jump to when a branch option is selected.

### 4.4 Navigation model

The walkthrough is **primarily linear** (steps are rendered in order), but two step types introduce non-linearity:

- **`section`**: Groups steps visually with a title. Sections can have an `id` and can contain nested `steps[]`. Nested steps are rendered inline, indented.
- **`branch`**: Shows a prompt with options; selecting an option jumps to a step by `id`. The navigation state is a stack of visited step IDs.

---

## 5. System Architecture

### 5.1 High-level diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Developer / CI                                                │
│                                                                 │
│  ┌─────────────┐    ┌──────────────────────────────────────┐   │
│  │  YAML files │    │  Go backend (single binary)          │   │
│  │  walkthrough│───▶│                                      │   │
│  │  *.yaml     │    │  REST API  :8080                     │   │
│  │             │    │                                      │   │
│  │  Git repo   │    │  ┌─ Walkthrough service             │   │
│  │  on disk    │◀───│  │  - list() → walkthrough index    │   │
│  └─────────────┘    │  │  - get(id) → walkthrough + content│   │
│                     │  │  - resolveFile(ref, path)         │   │
│                     │  └─ Git service                      │   │
│                     │     - readFile(ref, path, lines)      │   │
│                     │     - getDiff(ref, file, hunks)       │   │
│                     │     - getBranches()                   │   │
│                     │                                      │   │
│                     │  ┌─ Static file server               │   │
│                     │  │  GET /api/walkthroughs/*           │   │
│                     │  │  GET /api/files/*                 │   │
│                     │  └─                                  │   │
│                     │                                      │   │
│                     │  ┌─ SPA (embedded via go:embed)      │   │
│                     │  │  GET /  → index.html              │   │
│                     │  └─                                  │   │
│                     └──────────────────────────────────────┘   │
│                                    │                            │
│                                    ▼                            │
│                     ┌──────────────────────────────────────┐   │
│                     │  React SPA (RTK Query + MSW)         │   │
│                     │                                      │   │
│                     │  ┌─ RTK Query API slice              │   │
│                     │  │  - useListWalkthroughsQuery()      │   │
│                     │  │  - useGetWalkthroughQuery(id)      │   │
│                     │  │  - useGetFileContentQuery()       │   │
│                     │  └─                                  │   │
│                     │                                      │   │
│                     │  ┌─ MSW handlers (dev/test)         │   │
│                     │  │  - fixtures/ walkthrough-*.json   │   │
│                     │  │  - fixtures/ file-content-*.json   │   │
│                     │  └─                                  │   │
│                     │                                      │   │
│                     │  ┌─ Component modules               │   │
│                     │  │  packages/cr-walkthrough/src/      │   │
│                     │  │    ├── StepCard/                  │   │
│                     │  │    │   ├── StepCard.tsx            │   │
│                     │  │    │   ├── StepCard.css            │   │
│                     │  │    │   └── StepCard.stories.tsx   │   │
│                     │  │    ├── renderers/                 │   │
│                     │  │    │   ├── TextRenderer.tsx       │   │
│                     │  │    │   ├── SourceRenderer.tsx     │   │
│                     │  │    │   ├── DiffRenderer.tsx       │   │
│                     │  │    │   ├── ... (all 12 types)     │   │
│                     │  │    ├── ThemeProvider/             │   │
│                     │  │    │   ├── tokens.css             │   │
│                     │  │    │   ├── theme-dark.css         │   │
│                     │  │    │   ├── theme-light.css        │   │
│                     │  │    │   └── ThemeProvider.tsx       │   │
│                     │  │    └── index.ts (public API)      │   │
│                     │  └─                                  │   │
│                     └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Repository layout (after implementation)

```
cr-walkthrough/
├── Makefile
├── go.mod
├── go.sum
├── cmd/
│   └── cr-server/
│       └── main.go                 # Backend entrypoint
├── internal/
│   ├── api/
│   │   ├── server.go               # HTTP server setup (Chi router)
│   │   ├── routes/
│   │   │   ├── walkthroughs.go     # /api/walkthroughs routes
│   │   │   └── files.go            # /api/files routes
│   │   └── middleware/
│   │       ├── cors.go
│   │       └── logger.go
│   ├── domain/
│   │   ├── walkthrough.go          # Domain types (Step, Walkthrough)
│   │   ├── yaml/
│   │   │   ├── parser.go           # YAML → domain types
│   │   │   └── testdata/           # YAML fixtures
│   │   └── git/
│   │       ├── repo.go             # Git repo abstraction
│   │       ├── file_reader.go      # Read file at ref + line range
│   │       └── diff.go             # Generate diff hunks
│   └── embed/
│       └── spa.go                  # SPA handler (go:embed index.html)
├── frontend/                       # React app
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/
│   │   │   ├── store.ts            # Redux store + RTK setup
│   │   │   ├── walkthroughsApi.ts  # RTK Query endpoints
│   │   │   └── filesApi.ts
│   │   ├── mocks/
│   │   │   ├── browser.ts          # MSW browser worker setup
│   │   │   ├── handlers.ts         # All MSW request handlers
│   │   │   └── fixtures/           # JSON fixture files
│   │   │       ├── auth-refactor.json
│   │   │       ├── auth-refactor-token.ts
│   │   │       └── file-content-*.json
│   │   └── packages/
│   │       └── cr-walkthrough/     # Themable component library
│   │           ├── package.json
│   │           ├── src/
│   │           │   ├── index.ts
│   │           │   ├── types.ts
│   │           │   ├── parts.ts
│   │           │   ├── CRWalkthrough.tsx
│   │           │   ├── CRWalkthrough.css
│   │           │   ├── tokens.css
│   │           │   ├── theme-dark.css
│   │           │   ├── theme-light.css
│   │           │   ├── components/
│   │           │   │   ├── StepCard/
│   │           │   │   ├── StepCard.tsx
│   │           │   │   ├── StepCard.css
│   │           │   │   └── StepCard.stories.tsx
│   │           │   ├── FileBadge/
│   │           │   ├── CodeBlock/
│   │           │   └── ... (per-component)
│   │           │   └── renderers/
│   │           │       ├── StepRendererRegistry.tsx
│   │           │       ├── TextRenderer.tsx
│   │           │       ├── SourceRenderer.tsx
│   │           │       ├── DiffRenderer.tsx
│   │           │       ├── CodeRenderer.tsx
│   │           │       ├── CompareRenderer.tsx
│   │           │       ├── LinkRenderer.tsx
│   │           │       ├── AnnotationRenderer.tsx
│   │           │       ├── CheckpointRenderer.tsx
│   │           │       ├── RevealRenderer.tsx
│   │           │       ├── ShellRenderer.tsx
│   │           │       ├── SectionRenderer.tsx
│   │           │       └── BranchRenderer.tsx
│   │           └── README.md
│   └── storybook/
│       ├── .storybook/
│       │   ├── main.ts
│       │   └── preview.tsx
│       └── stories/
│           ├── Introduction.stories.mdx
│           ├── CRWalkthrough.stories.tsx
│           └── renderers/
│               ├── TextRenderer.stories.tsx
│               ├── SourceRenderer.stories.tsx
│               └── ... (all 12)
│
├── walkthroughs/                    # YAML walkthrough files (authored content)
│   └── auth-refactor.yaml
│
└── docs/                           # Architecture docs (docmgr ticket exports)
    └── ...
```

---

## 6. Phase 1: Go Backend

### 6.1 Module structure and dependencies

The Go backend lives under `./cmd/cr-server/` and `./internal/`. It has **no external HTTP framework** — it uses the standard library `net/http` with the lightweight [`go-chi/chi`](https://github.com/go-chi/chi) router. Chi is chosen because it has zero dependencies, matches Go's stdlib philosophy, and is the de facto standard for small-to-medium Go HTTP services.

Additional dependencies:

```go
// go.mod
require (
    github.com/go-chi/chi/v5  v5.1.0
    gopkg.in/yaml.v3          v3.0.1   // YAML parsing (stdlib-equivalent)
    github.com/go-git/go-git/v5  v5.13  // Pure Go git (no git binary required)
)
```

### 6.2 Domain model

```go
// internal/domain/walkthrough.go

package domain

// Walkthrough is the root domain object.
type Walkthrough struct {
    Title   string    `yaml:"title"`
    Repo    string    `yaml:"repo"`
    Base    string    `yaml:"base"`   // base branch (git ref)
    Head    string    `yaml:"head"`   // head branch (git ref)
    Authors []string  `yaml:"authors"`
    Steps   []Step    `yaml:"steps"`
}

// Step is a tagged union: exactly one of the typed fields is non-nil.
type Step struct {
    ID   string `yaml:"id"`

    // Text
    Text *TextStep `yaml:"text,omitempty"`

    // Source
    Source *SourceStep `yaml:"source,omitempty"`

    // Diff
    Diff *DiffStep `yaml:"diff,omitempty"`

    // Inline code
    Code *CodeStep `yaml:"code,omitempty"`

    // Side-by-side compare
    Compare *CompareStep `yaml:"compare,omitempty"`

    // Link
    Link *LinkStep `yaml:"link,omitempty"`

    // Annotation
    Annotation *AnnotationStep `yaml:"annotation,omitempty"`

    // Checkpoint (quiz)
    Checkpoint *CheckpointStep `yaml:"checkpoint,omitempty"`

    // Reveal (toggle)
    Reveal *RevealStep `yaml:"reveal,omitempty"`

    // Shell command
    Shell *ShellStep `yaml:"shell,omitempty"`

    // Section (group)
    Section *SectionStep `yaml:"section,omitempty"`

    // Branch (navigation)
    Branch *BranchStep `yaml:"branch,omitempty"`

    // Shared
    Note string `yaml:"note,omitempty"`
}

// LineRange represents [start, end] inclusive, 1-indexed.
type LineRange [2]int

// RefSide is one side of a compare step.
type RefSide struct {
    File  string    `yaml:"file"`   // repo-relative path
    Ref   string    `yaml:"ref"`    // git ref (defaults to head)
    Lines LineRange `yaml:"lines"`
}

// SourceStep: show a file at a line range.
type SourceStep struct {
    File      string    `yaml:"file"`
    Lines     LineRange `yaml:"lines"`
    Highlight LineRange `yaml:"highlight,omitempty"`
    Ref       string    `yaml:"ref,omitempty"` // defaults to Head
}

// DiffStep: show diff hunks.
type DiffStep struct {
    File    string   `yaml:"file"`
    Hunks   []int    `yaml:"hunks"`   // 1-indexed hunk numbers, or nil = all
    Collapse bool    `yaml:"collapse,omitempty"`
    Ref     string   `yaml:"ref,omitempty"`
}

// AnnotationStep: comment on a specific line.
type AnnotationStep struct {
    File     string `yaml:"file"`
    Line     int    `yaml:"line"`
    Severity string `yaml:"severity"` // info | warn | issue | praise
    Body     string `yaml:"body"`
    Ref      string `yaml:"ref,omitempty"`
}

// ... (other step types follow the same pattern, see spec-dsl.md)
```

### 6.3 YAML parser

```go
// internal/domain/yaml/parser.go

package yaml

import (
    "fmt"
    "os"
    "path/filepath"

    "gopkg.in/yaml.v3"

    "github.com/your-org/cr-walkthrough/internal/domain"
)

func Parse(path string) (*domain.Walkthrough, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("read walkthrough file: %w", err)
    }

    // We use a map[node] decode first to handle the `type` tag dispatch.
    var raw struct {
        Walkthrough domain.Walkthrough `yaml:"walkthrough"`
    }
    if err := yaml.Unmarshal(data, &raw); err != nil {
        return nil, fmt.Errorf("parse yaml: %w", err)
    }

    return &raw.Walkthrough, nil
}

// ListWalkthroughs returns all .yaml walkthrough files under root.
func ListWalkthroughs(root string) ([]string, error) {
    var paths []string
    err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
        if err != nil {
            return err
        }
        if !info.IsDir() && filepath.Ext(path) == ".yaml" {
            paths = append(paths, path)
        }
        return nil
    })
    return paths, err
}
```

### 6.4 Git service

The Git service reads files from a local git repository at arbitrary refs. We use [`go-git/go-git`](https://github.com/go-git/go-git), a pure Go implementation — no `git` binary required on the system.

```go
// internal/domain/git/repo.go

package git

import (
    "bytes"
    "fmt"
    "strings"

    "github.com/go-git/go-git/v5"
    "github.com/go-git/go-git/v5/plumbing"
)

// Repo wraps a go-git repository and provides file-reading operations.
type Repo struct {
    r *git.Repository
}

// Open opens a git repository at dir.
func Open(dir string) (*Repo, error) {
    r, err := git.PlainOpen(dir)
    if err != nil {
        return nil, fmt.Errorf("open git repo at %s: %w", dir, err)
    }
    return &Repo{r: r}, nil
}

// ResolveRef resolves a string ref (branch name, tag, "HEAD", commit hash)
// to a Plumbing hash.
func (r *Repo) ResolveRef(ref string) (plumbing.Hash, error) {
    // Try as-is first
    h, err := r.r.ResolveRevision(plumbing.Revision(ref))
    if err == nil {
        return h, nil
    }
    // Try prefixed
    h, err = r.r.ResolveRevision(plumbing.Revision("refs/heads/" + ref))
    if err == nil {
        return h, nil
    }
    return plumbing.ZeroHash, fmt.Errorf("resolve ref %q: %w", ref, err)
}

// ReadFileLines reads lines [start, end] (1-indexed, inclusive) of file at ref.
// Returns lines as []string (no trailing newline).
func (r *Repo) ReadFileLines(ref, file string, start, end int) ([]string, error) {
    hash, err := r.ResolveRef(ref)
    if err != nil {
        return nil, err
    }
    tree, err := r.r.TreeObject(hash)
    if err != nil {
        return nil, fmt.Errorf("get tree: %w", err)
    }
    blob, err := tree.File(file)
    if err != nil {
        return nil, fmt.Errorf("find file %s at %s: %w", file, ref, err)
    }
    reader, err := blob.Reader()
    if err != nil {
        return nil, err
    }
    defer reader.Close()

    // Read all lines
    var allLines []string
    for {
        line, err := readLine(reader)
        if err == EOF {
            break
        }
        if err != nil {
            return nil, err
        }
        allLines = append(allLines, line)
    }

    // Slice to requested range (1-indexed → 0-indexed)
    s := start - 1
    e := end
    if s < 0 {
        s = 0
    }
    if e > len(allLines) {
        e = len(allLines)
    }
    if s >= e {
        return nil, fmt.Errorf("invalid line range %d-%d for file with %d lines", start, end, len(allLines))
    }
    return allLines[s:e], nil
}

// GetDiff returns a unified diff of file between baseRef and headRef.
// It returns an array of DiffLine objects.
func (r *Repo) GetDiff(baseRef, headRef, file string) ([]DiffLine, error) {
    // go-git doesn't have a built-in diff engine; use go-git/go-git/v5/utils/diff
    // or shell out to `git diff baseRef..headRef -- file`.
    // For simplicity, we use a subprocess approach (git is assumed available in CI/prod).
    // TODO: replace with pure-Go diffing for single-binary deployment.
}

// DiffLine represents one line of a diff.
type DiffLine struct {
    Type    string // "context" | "Addition" | "Deletion"
    Content string
    OldLine int    // line number in base (0 if new)
    NewLine int    // line number in head (0 if deleted)
}
```

> **Note on diffing strategy:** `go-git` has limited built-in diff support. The recommended approach for Phase 1 is to shell out to the `git diff` command, which is available on all systems where this tool runs (CI, developer machines). For single-binary deployment, integrate a pure-Go diff library like `github.com/sergi/go-diff` or use `go-git/go-git/v5/utils/diff`. Document this as a Phase 2 concern.

### 6.5 API endpoints

The Go backend exposes a JSON REST API. All paths are prefixed with `/api`.

#### `GET /api/walkthroughs`

Returns a list of all available walkthroughs (metadata only, no full content).

```json
{
  "walkthroughs": [
    {
      "id": "auth-refactor",
      "path": "walkthroughs/auth-refactor.yaml",
      "title": "PR #482: Refactor auth middleware",
      "repo": "github/acme/backend",
      "base": "main",
      "head": "feat/auth-refactor",
      "authors": ["alice", "bob"],
      "stepCount": 8
    }
  ]
}
```

#### `GET /api/walkthroughs/:id`

Returns the full walkthrough with all steps. File content is **not** inlined — it is fetched separately via `/api/files/...`. This separation keeps the API cache-friendly.

```json
{
  "id": "auth-refactor",
  "title": "PR #482: Refactor auth middleware",
  "repo": "github/acme/backend",
  "base": "main",
  "head": "feat/auth-refactor",
  "authors": ["alice", "bob"],
  "steps": [
    {
      "id": "step-1",
      "type": "text",
      "body": "This PR replaces the legacy session-based auth...",
      "note": null
    },
    {
      "id": "step-2",
      "type": "source",
      "file": "src/utils/token.ts",
      "lines": [12, 48],
      "highlight": [30, 35],
      "ref": "feat/auth-refactor",
      "note": "New `verifyToken` helper — note the fallback on L34."
    }
  ]
}
```

#### `GET /api/files/content?ref=:ref&path=:path&start=:start&end=:end`

Returns the file content for a line range. The frontend calls this when rendering `source`, `diff`, and `compare` steps.

**Request:**
```
GET /api/files/content?ref=feat/auth-refactor&path=src/utils/token.ts&start=12&end=48
```

**Response:**
```json
{
  "ref": "feat/auth-refactor",
  "path": "src/utils/token.ts",
  "start": 12,
  "end": 48,
  "lines": [
    "export async function verifyToken(token: string): Promise<User> {",
    "  try {",
    "    const payload = jwt.decode(token);",
    "    if (!payload) throw new Error('invalid token');",
    "    if (payload.exp < Date.now() / 1000) throw new Error('expired');",
    "    return { id: payload.sub, email: payload.email };",
    "  } catch (err) {",
    "    // fallback: check session DB",
    "    return await Session.find(token);",
    "  }",
    "}"
  ]
}
```

**Error responses:**
- `400 Bad Request`: missing required parameters
- `404 Not Found`: file or ref does not exist
- `416 Range Not Satisfiable`: line range out of bounds

#### `GET /api/files/diff?base=:base&head=:head&path=:path`

Returns the unified diff for a file between two refs.

**Response:**
```json
{
  "base": "main",
  "head": "feat/auth-refactor",
  "path": "src/middleware/auth.ts",
  "hunks": [
    {
      "header": "@@ -10,7 +10,9 @@",
      "oldStart": 10,
      "oldLines": 7,
      "newStart": 10,
      "newLines": 9,
      "lines": [
        { "type": "Context", "content": "  const config = loadConfig();", "old": 10, "new": 10 },
        { "type": "Deletion", "content": "- const user = await Session.find(sid);", "old": 11, "new": 0 },
        { "type": "Addition", "content": "+ const token = req.headers.authorization;", "old": 0, "new": 11 },
        { "type": "Addition", "content": "+ const user = verifyToken(token);", "old": 0, "new": 12 },
        { "type": "Context", "content": "  req.user = user;", "old": 12, "new": 13 }
      ]
    }
  ]
}
```

#### `GET /api/repos/:repo/refs`

Returns a list of branches and tags for a repo (for UI navigation).

### 6.6 File serving and static assets

The Go binary serves three things:

1. **REST API** at `/api/*` (described above)
2. **Embedded SPA** at `/*` (all non-API paths → `index.html`, enabling client-side routing)
3. **YAML walkthrough files** at `/api/walkthroughs/*` (read directly from disk)

```go
// internal/api/server.go

package api

import (
    "embed"
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
)

// NewServer creates and configures the HTTP server.
func NewServer(repoPath string, walkthroughsPath string, staticFS embed.FS) *Server {
    r := chi.NewRouter()

    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(middleware.Compress(5))
    r.Use(corsMiddleware()) // allow SPA origins

    // API routes
    r.Route("/api", func(api chi.Router) {
        api.Route("/walkthroughs", handleWalkthroughs(walkthroughsPath))
        api.Route("/files", handleFiles(repoPath))
        api.Route("/repos", handleRepos(repoPath))
    })

    // SPA fallback (must be last)
    r.NotFound(spaHandler(staticFS))

    return &Server{Handler: r}
}

// spaHandler returns a handler that serves index.html for non-API paths,
// enabling client-side routing in the React SPA.
func spaHandler(fs embed.FS) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Serve index.html; Vite's built output handles routing
        index, err := fs.ReadFile("dist/index.html")
        if err != nil {
            http.Error(w, "index.html not embedded", 500)
            return
        }
        w.Header().Set("Content-Type", "text/html")
        w.Write(index)
    }
}
```

### 6.7 go:embed SPA integration

In production, the React frontend is built (`npm run build`) into a `dist/` directory, then embedded into the Go binary:

```go
//go:embed dist/index.html dist/assets/*
var staticAssets embed.FS
```

The Makefile ties this together:

```makefile
# Makefile

.PHONY: build frontend
build: frontend
	CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/cr-server ./cmd/cr-server

frontend:
	cd frontend && npm install && npm run build

# Development: run backend + frontend in parallel with Vite proxy
dev:
	cd frontend && npm run dev &
	go run ./cmd/cr-server -repo ./my-repo -walkthroughs ./walkthroughs -port 8080

# Run the final binary (serves both API and SPA)
run: build
	./bin/cr-server -repo ./my-repo -walkthroughs ./walkthroughs -port 8080
```

---

## 7. Phase 2: React Frontend

### 7.1 Tech stack

| Concern | Tool | Version | Rationale |
|---|---|---|---|
| Framework | React | 18.x | Industry standard |
| Build tool | Vite | 5.x | Fast HMR, ESM-native |
| Language | TypeScript | 5.x | Type safety for DSL model |
| Routing | React Router | 6.x | Client-side routing |
| Data fetching | RTK Query | 2.x | Caching, optimistic updates, auto-refetch |
| Mocking (dev/test) | MSW | 2.x | Intercept requests in browser/service worker |
| State (UI) | React state + Context | built-in | Theme state, navigation stack |
| Styling | CSS Modules + CSS Variables | built-in | Scoped styles, no runtime overhead |
| Testing | Vitest + React Testing Library | latest | Fast unit tests, component tests |
| Component stories | Storybook | 8.x | Visual regression + interactive docs |
| Package | `@crs cradle/cr-walkthrough` | local | The themable component library |

### 7.2 RTK Query API layer

```typescript
// frontend/src/api/walkthroughsApi.ts

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface WalkthroughSummary {
  id: string;
  path: string;
  title: string;
  repo: string;
  base: string;
  head: string;
  authors: string[];
  stepCount: number;
}

export interface Walkthrough {
  id: string;
  title: string;
  repo: string;
  base: string;
  head: string;
  authors: string[];
  steps: Step[];
}

export interface Step {
  id?: string;
  type: StepType;
  // ... all step type fields as optional (discriminated union)
  [key: string]: unknown;
}

export type StepType =
  | 'text' | 'source' | 'diff' | 'code' | 'compare'
  | 'link' | 'annotation' | 'checkpoint' | 'reveal'
  | 'shell' | 'section' | 'branch';

export interface FileContent {
  ref: string;
  path: string;
  start: number;
  end: number;
  lines: string[];
}

export interface DiffContent {
  base: string;
  head: string;
  path: string;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'Context' | 'Addition' | 'Deletion';
  content: string;
  old: number;
  new: number;
}

export const walkthroughsApi = createApi({
  reducerPath: 'walkthroughsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Walkthrough', 'WalkthroughList'],
  endpoints: (builder) => ({
    // List all walkthroughs
    listWalkthroughs: builder.query<{ walkthroughs: WalkthroughSummary[] }, void>({
      query: () => '/walkthroughs',
      providesTags: (result) =>
        result
          ? [...result.walkthroughs.map(({ id }) => ({ type: 'Walkthrough' as const, id })), 'WalkthroughList']
          : ['WalkthroughList'],
    }),

    // Get a single walkthrough (metadata + steps, no inlined file content)
    getWalkthrough: builder.query<Walkthrough, string>({
      query: (id) => `/walkthroughs/${id}`,
      providesTags: (result, error, id) => [{ type: 'Walkthrough', id }],
    }),

    // Get file content at line range
    getFileContent: builder.query<FileContent, { ref: string; path: string; start: number; end: number }>({
      query: ({ ref, path, start, end }) =>
        `/files/content?ref=${encodeURIComponent(ref)}&path=${encodeURIComponent(path)}&start=${start}&end=${end}`,
      // Keep this cache separate from walkthroughs
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (current, incoming) => incoming, // overwrite
      forceRefetch: ({ currentArg, previousArg }) => currentArg !== previousArg,
    }),

    // Get diff between two refs for a file
    getFileDiff: builder.query<DiffContent, { base: string; head: string; path: string }>({
      query: ({ base, head, path }) =>
        `/files/diff?base=${encodeURIComponent(base)}&head=${encodeURIComponent(head)}&path=${encodeURIComponent(path)}`,
    }),
  }),
});

export const {
  useListWalkthroughsQuery,
  useGetWalkthroughQuery,
  useGetFileContentQuery,
  useGetFileDiffQuery,
} = walkthroughsApi;
```

**Cache keying strategy**: File content is cached independently of walkthroughs using `getFileContent`. This means the same file+ref+range is fetched once and reused across multiple steps referencing the same file.

### 7.3 MSW mock setup

```typescript
// frontend/src/mocks/handlers.ts

import { http, HttpResponse } from 'msw';
import { authRefactorWalkthrough } from './fixtures/auth-refactor';
import { fileContentFixtures } from './fixtures/file-content';

export const handlers = [
  // List walkthroughs
  http.get('/api/walkthroughs', () => {
    return HttpResponse.json({
      walkthroughs: [
        {
          id: 'auth-refactor',
          path: 'walkthroughs/auth-refactor.yaml',
          title: 'PR #482: Refactor auth middleware',
          repo: 'github/acme/backend',
          base: 'main',
          head: 'feat/auth-refactor',
          authors: ['alice', 'bob'],
          stepCount: authRefactorWalkthrough.steps.length,
        },
      ],
    });
  }),

  // Get single walkthrough
  http.get('/api/walkthroughs/:id', ({ params }) => {
    if (params.id === 'auth-refactor') {
      return HttpResponse.json(authRefactorWalkthrough);
    }
    return HttpResponse.json({ error: 'Not found' }, { status: 404 });
  }),

  // File content (with query params — MSW parses them)
  http.get('/api/files/content', ({ request }) => {
    const url = new URL(request.url);
    const key = `${url.searchParams.get('ref')}:${url.searchParams.get('path')}:${url.searchParams.get('start')}-${url.searchParams.get('end')}`;
    const fixture = fileContentFixtures[key];
    if (fixture) {
      return HttpResponse.json(fixture);
    }
    // Fallback: return mock lines
    return HttpResponse.json({
      ref: url.searchParams.get('ref'),
      path: url.searchParams.get('path'),
      start: parseInt(url.searchParams.get('start') || '1'),
      end: parseInt(url.searchParams.get('end') || '10'),
      lines: Array.from({ length: 10 }, (_, i) => `// Mock line ${i + 1}`),
    });
  }),
];
```

### 7.4 Component library: theming with CSS variables and `data-part`

Following the React modular themable pattern from the skill, the component library exposes:

1. **`tokens.css`** — the full set of CSS custom properties (the "token surface")
2. **`theme-dark.css`** / **`theme-light.css`** — default token values for each theme
3. **`data-part`** attributes on all themeable elements
4. **`unstyled`** prop that removes the base stylesheet, keeping only `data-part` markup

```css
/* frontend/src/packages/cr-walkthrough/src/tokens.css */

:where([data-widget="cr-walkthrough"]) {
  /* Colors */
  --cr-color-bg: initial;
  --cr-color-surface: initial;
  --cr-color-surface-raised: initial;
  --cr-color-border: initial;
  --cr-color-text: initial;
  --cr-color-text-muted: initial;
  --cr-color-text-subtle: initial;

  /* Step type accents */
  --cr-color-text-step: initial;
  --cr-color-source-step: initial;
  --cr-color-diff-step: initial;
  --cr-color-code-step: initial;
  --cr-color-compare-step: initial;
  --cr-color-link-step: initial;
  --cr-color-annotation-step: initial;
  --cr-color-checkpoint-step: initial;
  --cr-color-reveal-step: initial;
  --cr-color-shell-step: initial;
  --cr-color-section-step: initial;
  --cr-color-branch-step: initial;

  /* Severity */
  --cr-color-severity-info: initial;
  --cr-color-severity-warn: initial;
  --cr-color-severity-issue: initial;
  --cr-color-severity-praise: initial;

  /* Diff lines */
  --cr-color-diff-add-bg: initial;
  --cr-color-diff-del-bg: initial;
  --cr-color-diff-add-text: initial;
  --cr-color-diff-del-text: initial;

  /* Typography */
  --cr-font-sans: system-ui, sans-serif;
  --cr-font-mono: 'DM Mono', 'Menlo', monospace;
  --cr-font-size-root: 13px;
  --cr-font-size-code: 11.5px;
  --cr-font-size-note: 11.5px;
  --cr-line-height: 1.65;

  /* Spacing */
  --cr-space-1: 4px;
  --cr-space-2: 8px;
  --cr-space-3: 12px;
  --cr-space-4: 16px;
  --cr-space-5: 20px;
  --cr-space-6: 32px;

  /* Radii */
  --cr-radius-sm: 5px;
  --cr-radius-md: 7px;
  --cr-radius-lg: 9px;

  /* Shadows */
  --cr-shadow-card: none;
}

/* Dark theme (default) */
[data-widget="cr-walkthrough"][data-theme="dark"],
[data-widget="cr-walkthrough"]:not([data-theme]) {
  --cr-color-bg: #101114;
  --cr-color-surface: #141518;
  --cr-color-surface-raised: #1a1b20;
  --cr-color-border: #1e1f24;
  --cr-color-text: #c8cad0;
  --cr-color-text-muted: #6b7280;
  --cr-color-text-subtle: #3a3c44;

  --cr-color-text-step: #7c8da6;
  --cr-color-source-step: #5b9cf5;
  --cr-color-diff-step: #dba14e;
  --cr-color-code-step: #a87ee0;
  --cr-color-compare-step: #3ebfa5;
  --cr-color-link-step: #5b9cf5;
  --cr-color-annotation-step: #e06070;
  --cr-color-checkpoint-step: #dba14e;
  --cr-color-reveal-step: #7c8da6;
  --cr-color-shell-step: #3ebfa5;
  --cr-color-section-step: #a87ee0;
  --cr-color-branch-step: #dba14e;

  --cr-color-severity-info: #5b9cf5;
  --cr-color-severity-warn: #dba14e;
  --cr-color-severity-issue: #e06070;
  --cr-color-severity-praise: #3ebfa5;

  --cr-color-diff-add-bg: rgba(62, 191, 165, 0.06);
  --cr-color-diff-del-bg: rgba(224, 96, 112, 0.06);
  --cr-color-diff-add-text: #3ebfa5;
  --cr-color-diff-del-text: #e06070;
}

/* Light theme */
[data-widget="cr-walkthrough"][data-theme="light"] {
  --cr-color-bg: #ffffff;
  --cr-color-surface: #f9fafb;
  --cr-color-surface-raised: #f3f4f6;
  --cr-color-border: #e5e7eb;
  --cr-color-text: #1f2937;
  --cr-color-text-muted: #6b7280;
  --cr-color-text-subtle: #9ca3af;

  --cr-color-source-step: #2563eb;
  --cr-color-diff-step: #d97706;
  /* ... etc */
}
```

### 7.5 Component `data-part` contract

Every component exposes a stable set of `data-part` names:

```typescript
// frontend/src/packages/cr-walkthrough/src/parts.ts

export const PARTS = {
  ROOT: 'root',
  HEADER: 'header',
  STEP_TYPE_STRIP: 'step-type-strip',
  STEP_TYPE_ICON: 'step-type-icon',
  STEPS_LIST: 'steps-list',
  STEP_CARD: 'step-card',
  STEP_BADGE: 'step-badge',
  FILE_BADGE: 'file-badge',
  FILE_BADGE_PATH: 'file-badge-path',
  FILE_BADGE_META: 'file-badge-meta',
  CODE_BLOCK: 'code-block',
  CODE_LINE: 'code-line',
  CODE_LINE_HIGHLIGHT: 'code-line-highlight',
  ANNOTATION: 'annotation',
  CHECKPOINT: 'checkpoint',
  CHECKPOINT_PROMPT: 'checkpoint-prompt',
  CHECKPOINT_CHOICE: 'checkpoint-choice',
  CHECKPOINT_FEEDBACK: 'checkpoint-feedback',
  REVEAL_TOGGLE: 'reveal-toggle',
  REVEAL_CONTENT: 'reveal-content',
  BRANCH_PROMPT: 'branch-prompt',
  BRANCH_OPTION: 'branch-option',
  DIFF_HUNK: 'diff-hunk',
  DIFF_LINE: 'diff-line',
  SIDE_BY_SIDE: 'side-by-side',
  SIDE_PANE: 'side-pane',
  NOTE: 'note',
} as const;

export type PartName = (typeof PARTS)[keyof typeof PARTS];
```

### 7.6 Step renderer registry

The registry pattern from the prototype is preserved, but now each renderer is a proper React component that uses RTK Query hooks:

```typescript
// frontend/src/packages/cr-walkthrough/src/renderers/SourceRenderer.tsx

import React from 'react';
import { useGetFileContentQuery } from '../../api/walkthroughsApi';
import { PARTS } from '../parts';
import { FileBadge } from '../components/FileBadge';
import { CodeBlock } from '../components/CodeBlock';
import { CodeLine } from '../components/CodeLine';
import type { SourceStep } from '../types';

interface Props {
  step: SourceStep;
  ref?: string; // override ref (default: walkthrough.head)
}

export const SourceRenderer: React.FC<Props> = ({ step, ref }) => {
  // Use the walkthrough context to get the default ref
  const { data, isLoading, isError } = useGetFileContentQuery({
    ref: ref || step.ref || 'HEAD',
    path: step.file,
    start: step.lines[0],
    end: step.lines[1],
  });

  if (isLoading) return <div data-part={PARTS.CODE_BLOCK}>Loading…</div>;
  if (isError || !data) return <div data-part={PARTS.CODE_BLOCK}>Failed to load file</div>;

  const { lines } = data;
  const [hlStart, hlEnd] = step.highlight || [];

  return (
    <div data-part={PARTS.FILE_BADGE}>
      <FileBadge
        file={step.file}
        meta={`L${step.lines[0]}–${step.lines[1]}`}
      />
      <CodeBlock>
        {lines.map((line, i) => {
          const lineNum = step.lines[0] + i;
          const isHighlighted =
            hlStart !== undefined &&
            hlEnd !== undefined &&
            lineNum >= hlStart &&
            lineNum <= hlEnd;
          return (
            <CodeLine
              key={i}
              lineNumber={lineNum}
              highlighted={isHighlighted}
              highlightColor="var(--cr-color-diff-step)"
              content={line}
            />
          );
        })}
      </CodeBlock>
    </div>
  );
};
```

### 7.7 Navigation state

The `branch` step type introduces non-linear navigation. The frontend manages this with a simple stack:

```typescript
// frontend/src/packages/cr-walkthrough/src/navigation.ts

export interface NavigationState {
  currentStepIndex: number;       // linear index in flat steps array
  visitedIds: Set<string>;        // all visited step IDs
  stepIndexById: Map<string, number>; // id → linear index
  gotoTarget: string | null;      // pending goto (set by branch selection)
}

export function buildFlatStepIndex(steps: Step[]): {
  flat: Step[];
  byId: Map<string, number>;
} {
  const flat: Step[] = [];
  const byId = new Map<string, number>();

  function walk(s: Step[]) {
    for (const step of s) {
      if (step.id) byId.set(step.id, flat.length);
      flat.push(step);
      if (step.Section?.steps) walk(step.Section.steps);
    }
  }
  walk(steps);
  return { flat, byId };
}
```

---

## 8. Implementation Phases

### Phase 1: Go Backend (Tasks 1–2)

**1.1 Project scaffold** (`cmd/cr-server`, `internal/`, `go.mod`)

- Set up Chi router with CORS and compression middleware
- Add `go-chi/chi/v5` and `gopkg.in/yaml.v3` dependencies
- Create a minimal `GET /api/health` endpoint
- Write a Makefile with `build`, `dev`, `run` targets
- Add `.gitignore`, `.golangci.yml`

**1.2 YAML parser and domain model**

- Define all domain types in `internal/domain/walkthrough.go`
- Implement `Parse(path) → *Walkthrough` in `internal/domain/yaml/parser.go`
- Add fixture YAML files in `internal/domain/yaml/testdata/`
- Write unit tests for parser (round-trip YAML → Go → YAML)

**1.3 Walkthrough API routes**

- `GET /api/walkthroughs` — list with metadata
- `GET /api/walkthroughs/:id` — full walkthrough
- Add slug-based lookup with proper 404 handling
- Add ETag caching headers

**1.4 Git service (Phase 1 lite)**

- Integrate `go-git/go-git/v5`
- Implement `ReadFileLines(ref, path, start, end) → []string`
- `GET /api/files/content` endpoint
- Use `git diff` subprocess for diffing (document for Phase 2 improvement)

**1.5 SPA embedding**

- Set up `//go:embed dist/*` in server.go
- SPA handler for non-API paths
- End-to-end test: `make build && ./bin/cr-server` → serve API + SPA

### Phase 2: Go Backend Git Integration (Task 3)

- `GET /api/files/diff` using pure-Go diffing (replace subprocess)
- `GET /api/repos/:repo/refs` — list branches/tags
- Error handling: file not found, ref not found, range out of bounds
- Benchmark file serving latency

### Phase 3: React Component Scaffold (Task 4)

- Initialize Vite + React + TypeScript project
- Set up `packages/cr-walkthrough/` as a local workspace package
- Create `tokens.css`, `theme-dark.css`, `theme-light.css`
- Define `parts.ts` with full `data-part` list
- Build `CRWalkthrough.tsx` root component with theme/context
- Add Storybook with Introduction page

### Phase 4: RTK Query + MSW (Task 5)

- Set up Redux store with `walkthroughsApi` (4 endpoints)
- Configure MSW with `src/mocks/handlers.ts`
- Add fixture JSON for auth-refactor walkthrough
- Verify RTK Query hooks work with MSW in Storybook and `npm run dev`
- Write integration tests with MSW: walkthrough loads, steps render

### Phase 5: Step Renderers (Task 6)

Implement all 12 step renderers as Storybook-documented components:

1. `TextRenderer` — prose paragraph
2. `SourceRenderer` — file badge + code block + RTK Query fetch
3. `DiffRenderer` — unified diff with color-coded lines
4. `CodeRenderer` — syntax-highlighted inline snippet
5. `CompareRenderer` — two-pane side-by-side
6. `LinkRenderer` — styled external link
7. `AnnotationRenderer` — severity-colored inline comment
8. `CheckpointRenderer` — interactive quiz with feedback
9. `RevealRenderer` — collapsible toggle
10. `ShellRenderer` — command + expected output
11. `SectionRenderer` — grouped steps with title (recursive)
12. `BranchRenderer` — navigation decision with goto

For each renderer: component, CSS Module, Storybook stories (default + edge cases).

### Phase 6: Storybook QA (Task 7)

- Add stories for: default walkthrough, empty steps, loading state, error state
- Add stories for: all 12 renderer types in isolation
- Add stories for: theme-dark, theme-light, custom tokens (theme overrides)
- Run visual regression (Chromatic or Storybook's built-in screenshot)
- TypeScript strict mode: `tsc --noEmit`
- Accessibility audit: keyboard navigation, ARIA labels, contrast

### Phase 7: Integration + go:embed (Task 8)

- `npm run build` in frontend → `dist/` output
- Configure Go `//go:embed dist/...` directives
- `make build` produces single `cr-server` binary
- Smoke test: run binary, visit `http://localhost:8080`, see SPA
- Smoke test: API endpoints return correct JSON

---

## 9. Testing Strategy

### Backend (Go)

| Test type | Tool | Coverage target |
|---|---|---|
| Unit tests | `go test ./...` | Domain model, YAML parser, Git service |
| Integration tests | `httptest` + temp git repo | API endpoints with real file reads |
| Binary smoke test | `make build && ./bin/cr-server` | Serves API + SPA |

### Frontend (React)

| Test type | Tool | Coverage target |
|---|---|---|
| Unit tests | Vitest | Parser, navigation logic, renderer logic |
| Component tests | Vitest + RTL | Each renderer in isolation |
| Storybook | `@storybook/react-vite` | Visual + interaction |
| API integration | MSW + RTK Query | All endpoint patterns |
| E2E | Playwright | Full walkthrough render + checkpoint interaction |

---

## 10. Risks, Alternatives, and Open Questions

### Risk: Git diffing in Go

**Risk**: `go-git` lacks a built-in diff engine. Using `git diff` subprocess works but defeats single-binary portability.

**Mitigation**: Use pure-Go diff library (`github.com/sergi/go-diff`) or `go-git/go-git/v5/utils/diff` in Phase 2. Document the current subprocess approach.

### Risk: File content caching

**Risk**: The `GET /api/files/content` endpoint can be called many times per walkthrough (once per `source`, `diff`, `compare` step). Without caching, this is slow.

**Mitigation**: RTK Query caches responses automatically by query arguments. On the backend, add an in-memory LRU cache for file reads with TTL.

### Risk: Large files

**Risk**: A `source` step requesting lines `[1, 100000]` would read the entire file into memory.

**Mitigation**: The API rejects line ranges > 500 lines per request. The frontend paginates large ranges.

### Alternative: Use a pre-existing CR tool

**Considered and rejected**: Tools like Vox Media's `reviewdog`, GitHub's pull request comments API, or `@code-reviewer` already exist. None support the walkthrough DSL or interactive checkpoints.

### Alternative: Python backend

**Considered and rejected**: Python would be simpler for YAML parsing and git interaction, but Go produces a single static binary (no runtime dependency), which is essential for CI/CD deployment and developer convenience.

### Alternative: GraphQL

**Considered and rejected**: The API surface is simple enough for REST. Adding GraphQL's complexity (schema, resolvers, codegen) is not justified. If the API grows significantly, revisit.

### Open Question 1: Authentication

Not specified in the requirements. Phase 1 has no auth. Future phases may add:
- Option A: Simple shared secret in `Authorization: Bearer <token>` header
- Option B: OAuth2 via GitHub (use repo's existing permissions)
- Decision: defer to Phase 2

### Open Question 2: Storage for authored walkthroughs

YAML files on disk is the Phase 1 approach. Future options:
- Option A: Git-backed (walkthroughs in a dedicated git repo)
- Option B: Database (Postgres JSONB column)
- Decision: defer; file-on-disk works for single-team use

### Open Question 3: Multi-repo support

Currently, the backend serves one repo path. Multiple repos would need a routing layer (e.g., `/api/repos/:name/files/...`). Defer to Phase 2.

---

## 11. References

- **Prototype UI**: `imports/cr-walkthrough-dsl.jsx` — ground truth for all UI behavior
- **DSL Schema**: `imports/spec-dsl.md` — complete type reference
- **Go-Chi router**: https://github.com/go-chi/chi
- **go-git**: https://github.com/go-git/go-git
- **RTK Query**: https://redux-toolkit.js.org/rtk-query
- **MSW**: https://mswjs.io
- **React modular themable pattern**: See `skills/react-modular-themable-storybook/`
- **Go web frontend embed pattern**: See `skills/go-web-frontend-embed/`
