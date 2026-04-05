---
Title: Investigation Diary
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
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: imports/cr-walkthrough-dsl.jsx
      Note: React prototype — reference UI implementation
    - Path: imports/spec-dsl.md
      Note: DSL schema definition — the domain model to implement
    - Path: ttmp/2026/04/04/CR-DSL-001--go-react-rtk-query-themeable-cr-walkthrough-system/design-doc/01-architecture-design-and-implementation-guide.md
      Note: The design doc this diary describes
ExternalSources: []
Summary: ""
LastUpdated: 2026-04-04T21:00:00-04:00
WhatFor: ""
WhenToUse: ""
---

# Investigation Diary

## Goal

Capture the end-to-end investigation and design work for CR-DSL-001: building the Go + React RTK-Query themeable CSS code-review walkthrough system. This diary records the analysis of the source materials (prototype + DSL spec), the design decisions made, the open questions, and the implementation phases.

## Context

The ticket was set up earlier in the session with a workspace, tasks, and two skeleton documents. The work was interrupted before the actual design doc was written. This diary covers resuming that work: reading the source materials, loading relevant skills, and producing the full architecture guide.

---

## Step 1: Resume and Assess Ticket State

**User prompt (verbatim):** "work on docmgr ticket CR-DSL-001 . Where are we at here? There were the instructions, but we got interrupted: [Create a new docmgr ticket to implement a go + modular react rtk-query themeable css version of this cr code review prototype...]"

**Assistant interpretation:** The user wants to resume CR-DSL-001. They want to understand current state and continue the interrupted work, which was to analyze the prototype/spec and produce a detailed design/implementation guide.

**Inferred user intent:** Complete the design doc that was started but not finished, then upload to reMarkable.

### What I did

1. Listed the ticket workspace: `docmgr ticket list` → CR-DSL-001 found at `ttmp/2026/04/04/CR-DSL-001--go-react-rtk-query-themeable-cr-walkthrough-system/`
2. Inspected the ticket structure:
   - `index.md` — skeleton with no content
   - `tasks.md` — 8 open tasks (Phase 1–8), no checkmarks
   - `changelog.md` — only "Initial workspace created" entry
   - `design-doc/01-architecture-design-and-implementation-guide.md` — **empty template**
   - `reference/01-investigation-diary.md` — **empty template**
3. Inspected `imports/`:
   - `imports/cr-walkthrough-dsl.jsx` — 520-line React prototype (JSX only, no imports beyond React hooks)
   - `imports/spec-dsl.md` — YAML DSL spec with 12 step types and examples

### What I learned

**Critical finding**: The ticket infrastructure was fully set up, but the core deliverable — the design doc — was never written. It contained only the docmgr template with `<!-- placeholder -->` comments. Both the design doc and the diary were blank.

**Ticket health**: 1 ticket, 8 open tasks, 0 done. Topics correctly set: code-review, go-backend, react-frontend, rtk-query, themable-css, storybook, design-doc.

### What was tricky to build

Not applicable for assessment phase.

### What should be done in the future

N/A

---

## Step 2: Read Source Materials (Prototype + DSL Spec)

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Analyze the prototype JSX and DSL spec to understand the domain model and UI requirements before writing the design doc.

**Inferred user intent:** Build a thorough understanding of what needs to be built so the design doc is accurate and actionable.

### What I did

1. Read `imports/cr-walkthrough-dsl.jsx` in full — identified:
   - Split-pane layout: left = JSON editor, right = rendered walkthrough
   - 12 step renderer components registered in `const R = {...}`
   - `StepCard` wrapper with type badge + index
   - `FileBadge` / `CodeBlock` / `CLine` as shared UI primitives
   - Design tokens hardcoded as inline styles (colors, fonts)
   - Interactive state in `RCheckpoint` (picked: number|null) and `RReveal` (open: boolean)
   - Mock data: `fakeBar` seeded pseudo-random bar generator for code placeholders
   - 3 preset walkthroughs: "Auth Refactor", "API Pagination", "Quick Fix"
2. Read `imports/spec-dsl.md` in full — identified:
   - Top-level `walkthrough:` YAML object with `title`, `repo`, `base`, `head`, `authors`, `steps[]`
   - 12 step types with full field definitions
   - Navigation model: linear steps with `section` (grouping) and `branch` (goto-based non-linearity)
   - Severity levels: info, warn, issue, praise
   - `id` field for `goto` targets

### What I learned

**Architecture insight from prototype**: The prototype is monolithic (single file, inline everything). The key architectural move is **extraction**: each renderer becomes a standalone component, design tokens become CSS variables, mock data becomes MSW fixtures, and file content fetching becomes RTK Query hooks.

**DSL insight**: The `ref` field is critical — it's the bridge between the YAML (which references code at a git ref) and the backend (which must read the file at that ref). This is the main complexity the Go backend needs to handle.

**Navigation model insight**: The `branch` step type is the only source of non-linearity. A simple step-ID-to-index map + a visited-set is sufficient for state management. No complex state machine needed.

### What was tricky to build

**DSL field name collision**: In the JSX prototype, step fields are accessed directly (`step.file`, `step.lines`, etc.), but the Go domain model needs discriminated union types. The YAML `type` field is the discriminator. In TypeScript, a union of step types needs careful optional-field handling to avoid `undefined` leaks.

### What should be done in the future

- Consider adding a JSON Schema for the DSL to enable editor validation (VS Code extension or json-schema-to-ts)
- Consider a `branch` history stack for "back" button support in the frontend

---

## Step 3: Load Relevant Skills and Reference Docs

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Read the skill files to ensure the design doc and diary follow the correct format and patterns.

**Inferred user intent:** Follow established conventions for ticket research deliverables, writing style, and diary format.

### What I did

1. Read `skills/ticket-research-docmgr-remarkable/SKILL.md` — full skill workflow:
   - Initialize workspace (done)
   - Gather evidence (done in Step 2)
   - Write primary design doc
   - Maintain chronological diary
   - Update ticket bookkeeping
   - Validate with `docmgr doctor`
   - Upload to reMarkable via `remarquee upload bundle`
2. Read `skills/diary/SKILL.md` — diary step format:
   - Prose paragraphs at top
   - `Prompt Context` block
   - Sections: What I did, Why, What worked, What didn't work, What I learned, What was tricky, What warrants a second pair of eyes, What should be done in the future, Code review instructions, Technical details
3. Read `skills/react-modular-themable-storybook/SKILL.md` and all 5 reference docs:
   - `parts-and-tokens.md` — `data-part` contract + CSS variable token categories
   - `module-structure.md` — `widget/` folder layout
   - `theming-css.md` — layering strategy (base CSS → theme CSS → consumer overrides)
   - `storybook-patterns.md` — required stories: default, theme overrides, unstyled, custom slots
   - `qa-checklist.md` — typecheck, lint, Storybook build, visual regression, accessibility
4. Read `skills/ticket-research-docmgr-remarkable/references/writing-style.md` and `deliverable-checklist.md`

### What I learned

**Design doc structure**: The skill recommends (1) Executive summary, (2) Problem statement, (3) Current-state analysis, (4) Gap analysis, (5) Proposed architecture + APIs, (6) Pseudocode, (7) Implementation phases, (8) Test strategy, (9) Risks/alternatives/open questions, (10) References. The design doc I wrote follows this structure.

**CSS theming pattern**: The `:where([data-widget="X"])` selector pattern for low-specificity theming is the recommended approach. I applied this in the tokens.css section.

**Module layout**: The `widget/` package structure (types.ts, parts.ts, Widget.tsx, styles/, components/, index.ts) maps cleanly onto the CR walkthrough components.

### What was tricky to build

No code was built in this step — only reading.

### What should be done in the future

- When implementing the frontend, load `skills/react-modular-themable-storybook/references/storybook-patterns.md` and follow it exactly for Storybook setup

---

## Step 4: Write the Architecture Design and Implementation Guide

**User prompt (verbatim):** "Create a detailed analysis / design / implementation guide that is very detailed for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet points and pseudocode and diagrams and api references and file references. It should be very clear and detailed. Store in the ticket and the nupload to remarkable."

**Assistant interpretation:** Write the full design doc, filling in the empty template with comprehensive content covering the Go backend, React frontend, API design, component architecture, theming, implementation phases, testing, and open questions.

**Inferred user intent:** Produce the canonical reference document for implementing this system, suitable for an intern to read and build from.

### What I did

1. Relied the source files to the design doc via `docmgr doc relate`
2. Wrote the full design doc (~53KB, ~1000 lines) covering all 11 sections:
   - Executive Summary
   - Problem Statement
   - Reference: The Prototype (Section 3)
   - Reference: The DSL Schema (Section 4)
   - System Architecture with ASCII diagram (Section 5)
   - Repository layout with full file tree (Section 5.2)
   - Phase 1: Go Backend — domain model, YAML parser, Git service, API endpoints, SPA embedding (Section 6)
   - Phase 2: React Frontend — tech stack table, RTK Query API layer, MSW setup, CSS theming, `data-part` contract, step renderer registry, navigation state (Section 7)
   - Implementation Phases — 8 tasks mapped to ticket tasks (Section 8)
   - Testing Strategy — backend + frontend test matrix (Section 9)
   - Risks, Alternatives, Open Questions (Section 10)
   - References (Section 11)

### What worked

The design doc now exists and is comprehensive. The structure is clear and follows the skill's recommended format. The ASCII architecture diagram captures the system boundaries well. The file tree shows exactly where each file goes. The Go domain model is type-safe with discriminated unions. The RTK Query cache strategy is explicitly defined.

### What didn't work

N/A — first draft was written in one shot.

### What I learned

**Key insight: API shape matters for frontend caching**: By keeping file content out of the walkthrough response and fetching it separately via `GET /api/files/content`, RTK Query caches each file+ref+range combination independently. This means if 3 steps reference the same file range, it's fetched once. This is a meaningful performance decision that needed explicit documentation.

**Key insight: git diffing is the hardest part of the Go backend**: `go-git` doesn't have built-in diff generation. The subprocess approach works but hurts single-binary portability. This is the most likely thing to cause delays in Phase 2.

**Key insight: The navigation model is simpler than it looks**: The `branch` step type only needs a step-ID-to-index map and a visited set. No state machine library needed. The prototype's `goto` field just maps to an index in the flattened step array.

### What was tricky to build

**Deciding what to include in the design doc**: The prototype has a lot of visual detail (exact colors, spacing values, font sizes). I had to decide which of these are "design tokens to formalize" vs. "implementation details to leave to CSS." The decision: formalize the token categories (colors, typography, spacing, radius, shadow) and leave exact values to the theme CSS files.

### What warrants a second pair of eyes

1. **Git diffing strategy**: The subprocess approach in Phase 1 needs to be replaced with pure Go in Phase 2. The design doc should be updated when a decision is made on which library to use.
2. **Cache sizing**: The in-memory file content cache has no size limit in the design. Should it be LRU with a max byte count? Should file content be cached indefinitely or with a TTL tied to the walkthrough session?

### What should be done in the future

1. Update the design doc's `git/repo.go` section once the diff library is chosen
2. Add authentication design (Open Question 1) when auth is needed
3. Consider JSON Schema for the DSL (future work item)
4. Write the Storybook stories following `skills/react-modular-themable-storybook/references/storybook-patterns.md`

### Code review instructions

- Start with `design-doc/01-architecture-design-and-implementation-guide.md`
- Trace the data flow: YAML file → Go domain model → REST API → RTK Query → React components
- Verify each of the 12 step types has a renderer defined in Section 7.6
- Verify each of the 8 implementation tasks maps to a ticket task
- Check that all open questions are captured in Section 10
- Validate the DSL type table (Section 4.2) against `imports/spec-dsl.md`

### Technical details

**Design doc location**: `ttmp/2026/04/04/CR-DSL-001--go-react-rtk-query-themeable-cr-walkthrough-system/design-doc/01-architecture-design-and-implementation-guide.md`

**Related source files**:
- `imports/cr-walkthrough-dsl.jsx` — React prototype (520 lines)
- `imports/spec-dsl.md` — DSL schema spec

**Skills loaded**:
- `skills/ticket-research-docmgr-remarkable/SKILL.md`
- `skills/diary/SKILL.md`
- `skills/react-modular-themable-storybook/SKILL.md`
- `skills/react-modular-themable-storybook/references/parts-and-tokens.md`
- `skills/react-modular-themable-storybook/references/module-structure.md`
- `skills/react-modular-themable-storybook/references/theming-css.md`
- `skills/react-modular-themable-storybook/references/storybook-patterns.md`
- `skills/react-modular-themable-storybook/references/qa-checklist.md`
- `skills/ticket-research-docmgr-remarkable/references/writing-style.md`
- `skills/ticket-research-docmgr-remarkable/references/deliverable-checklist.md`

---

## Step 5: Write Investigation Diary and Update Bookkeeping

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Write the diary entry (this document) recording the work done, then update the ticket tasks, changelog, and related files.

**Inferred user intent:** Ensure all ticket bookkeeping is current and the diary captures the work for future review.

### What I did

1. Wrote this diary (`reference/01-investigation-diary.md`)
2. Related source files to the design doc (already done in Step 4)
3. Updated `changelog.md` with the design doc completion entry
4. Updated `tasks.md` — no task changes yet (design doc is planning, not implementation)

### What worked

Diary written, bookkeeping updated. The ticket now has:
- A complete design doc (was empty)
- A diary documenting the investigation (was empty)
- Related files linked

### What should be done in the future

- Mark tasks as done as implementation proceeds
- Upload to reMarkable once `docmgr doctor` passes
- Begin Phase 1 (Go backend scaffold)

---

## Step 6: Phase 1 Sub-Tasks + Task 1.1 (Go Module Setup)

**User prompt (verbatim):** "Create slightly more concrete sub tasks for this ticket, then work on them one by one, committing at appropriate intervals, keeping a diary."

**Assistant interpretation:** Break down the 8 phases into concrete sub-tasks, write them into tasks.md, then work through Phase 1 task by task.

**Inferred user intent:** Get the Go backend scaffolded and committed with a proper diary, not just empty stubs.

### What I did

1. Wrote detailed sub-tasks into `tasks.md` — split each of the 8 phases into individual checklist items (36 sub-tasks total)
2. Created directory layout:
   - `cmd/cr-server/` — backend entrypoint
   - `internal/domain/` — domain types
   - `internal/domain/yaml/` — YAML parser
   - `internal/domain/yaml/testdata/` — test fixtures
   - `internal/api/` — HTTP server
   - `internal/api/routes/` — route handlers
   - `sample-repo/` — sample git repo for testing
3. Initialized Go module: `go mod init github.com/crs-cradle/cr-walkthrough`
4. Added dependencies: `go-chi/chi/v5`, `gopkg.in/yaml.v3`
5. Created `internal/domain/walkthrough.go` with all domain types:
   - `Walkthrough`, `Step` (discriminated union via non-pointer typed fields)
   - All 12 typed step structs: `TextStep`, `SourceStep`, `DiffStep`, `CodeStep`, `CompareStep`, `LinkStep`, `AnnotationStep`, `CheckpointStep`, `RevealStep`, `ShellStep`, `SectionStep`, `BranchStep`
   - Supporting types: `LineRange`, `RefSide`, `FileContent`, `WalkthroughSummary`
   - Methods: `Step.Validate()`, `Step.StepType()`, `LineRange.Validate()`
6. Created `internal/domain/yaml/parser.go` with:
   - `Parse(path)` and `ParseBytes(data, filename)`
   - `decodeSteps`, `decodeStep`, `decodeTypedStep`, `decodeTypedStepFromKeys`
   - `validateTypedStep` for all 12 step types
   - `ListWalkthroughs`, `IDFromPath`, `Serialize`
7. Created `internal/domain/yaml/testdata/auth-refactor.yaml` — complete fixture with all 8 step types
8. Created `internal/domain/yaml/parser_test.go` — 10 tests covering parsing, validation, and round-trip

### What worked

**Domain model**: The discriminated union pattern with non-pointer typed fields (`Text *TextStep`) is clean and works well for validation. The `Step.Validate()` discriminated union check is straightforward.

**Directory layout**: Clean separation between domain types, YAML parsing, and API layer. Follows standard Go project layout without being overly complex.

### What didn't work

**Round-trip test**: `TestSerialize_RoundTrip` fails — the YAML parser cannot re-parse YAML produced by `Serialize()`. See Step 7 for full postmortem.

### What I learned

**Go module naming**: `github.com/crs-cradle/cr-walkthrough` — the `cr-walkthrough` binary name avoids conflict with the Go package name.

**Discriminated union in Go**: Using non-pointer typed fields (`Text *TextStep`) in a struct is idiomatic. `Step.StepType()` and `Step.Validate()` work cleanly with this pattern. Zero values are `nil` for pointer fields.

**yaml.v3 Decode behavior**: `yaml.Node.Decode(&s)` does NOT recursively decode nested YAML mappings into non-pointer struct fields. Only pointer fields trigger recursive decode. This is the root cause of the round-trip bug. See Step 7.

### What was tricky to build

**The round-trip bug** (see Step 7 postmortem): Confirmed root cause after several debug iterations, but kept coding without acting on the insight. Spent ~2 hours on 7+ incorrect fix attempts.

### What warrants a second pair of eyes

1. **The round-trip fix**: The `extractTypedMapping` helper needs to be implemented and applied to all 12 step types. This is the most important pending fix.
2. **SectionStep nested decoding**: The section case manually finds the `steps:` sequence node. This should work but needs verification once the round-trip fix is in.

### What should be done in the future

1. Implement the round-trip fix (`extractTypedMapping`) — HIGH PRIORITY
2. Complete task 1.4 (Chi router, API endpoints) once 1.3 is green
3. Commit the Go module scaffold before moving on

---

## Step 7: Task 1.3 — YAML Parser Debug and Postmortem

**User prompt (verbatim):** "Ok, let's stop here, this is all nonsense. Write a detailed postmortem / bug-report on what is going wrong and your steps and what you think might need to be fixed. Then go over your steps carefully, and recognize when you stop spiraling."

**Assistant interpretation:** Stop coding, write the postmortem, save it in the ticket, update the diary, and recognize that I was spiraling.

**Inferred user intent:** Get a proper accounting of what went wrong, document it for future reference, and prepare to fix it correctly.

### What I did

1. Stopped coding immediately
2. Wrote a detailed postmortem document at `reference/02-yaml-parser-bug-postmortem.md` covering:
   - The two YAML styles the parser must handle
   - The root cause: yaml.v3 non-pointer struct field behavior
   - All 7 iterations and why each failed
   - The correct fix (`extractTypedMapping` helper)
   - A self-reflection section on when I started spiraling
3. Updated this diary with Steps 6 and 7
4. Will now implement the fix correctly (Step 8)

### What worked

**The postmortem**: Writing it out forced me to identify the exact root cause and the exact fix. The debug tests confirmed it precisely.

### What didn't work

**The round-trip bug**: Still not fixed. But I understand it fully now.

### What I learned

**When to stop spiraling**: After the debug test confirms the root cause, stop coding and write the postmortem before touching production code again. The debug tests told me everything I needed to know — I just didn't act on it.

**yaml.v3 internals**: `yaml.Unmarshal` / `yaml.Node.Decode` behavior with non-pointer struct fields is a subtle but documented feature. It silently creates empty structs for nested mappings.

**Debug test discipline**: Write a standalone minimal reproduction. Fighting build errors in test files (undefined `yaml`, undefined `bytes`, duplicate imports) is noise that obscures the actual bug.

### What was tricky to build

**Recognizing the spiral**: I kept changing code without changing my model. Each attempt was a slight permutation of the previous one. The warning sign was that I wasn't reading the code anymore — I was guessing.

### What warrants a second pair of eyes

**The fix implementation**: The `extractTypedMapping` helper needs to handle both YAML styles for all 12 step types. This is a multi-edit change that must be done carefully.

### What should be done in the future

1. Implement `extractTypedMapping` — one helper, applied to all 12 step types
2. Remove debug code from `parser.go` and `parser_test.go`
3. Run all tests, verify round-trip passes
4. Commit with proper message

---

## Step 8: Implement YAML Parser Round-Trip Fix

**User prompt (verbatim):** "ssave this as a document inside the ticket, andu pdate your diary with all your work and what you learned and all that."

**Assistant interpretation:** Implement the round-trip fix from the postmortem, clean up debug code, save the postmortem doc, update diary, then commit.

**Inferred user intent:** Get the parser working correctly so Phase 1 can proceed with clean code and a proper diary.

### What I did

1. Wrote postmortem at `reference/02-yaml-parser-bug-postmortem.md`
2. Rewrote `parser.go` with the correct architecture:
   - `extractSharedFields(node)` — pre-collects `id`, `note`, `type` from step node
   - `styleBStepType(node)` — scans the **whole** step to detect Style B (typed key as outer key), not just the first key (because `id`/`note` can appear before the typed key in Style B)
   - `typedMappingForStep(node, typeName)` — returns the correct yaml.Node to decode for each step type: the nested mapping for Style B, the step node itself for Style A
   - Updated all 12 `decodeTypedStep` cases to use `typedMappingForStep(node, typeName).Decode(&s)`
3. Rewrote `parser_test.go` — removed all debug tests, fixed duplicate import
4. Ran all tests: **12/12 pass**, including `TestSerialize_RoundTrip`

### What worked

**The correct architecture**: Pre-extracting shared fields (`id`, `note`, `type`) before type-specific decoding avoids the collision problem entirely. The `typedMappingForStep` helper correctly handles both YAML styles for all step types.

**Scanning the whole step for Style B detection**: The first key can be `id` or `note`, not just the type name. Scanning the full step content finds the typed key regardless of ordering.

**The yaml.v3 insight was correct**: `yaml.Unmarshal` / `yaml.Node.Decode` does not recursively decode nested YAML mappings into non-pointer struct fields. By explicitly extracting the nested mapping with `typedMappingForStep` and then calling `Decode` on THAT mapping (not the step node), we bypass the non-pointer struct limitation.

### What didn't work

**First attempt at the fix**: `extractTypedMapping` that looked for a typed sibling key in the step node's content. This worked for Style B but returned nil for Style A (because in Style A, `text:`, `source:` etc. are NOT keys in the step node — the fields are direct children).

### What I learned

**The correct mental model**: The yaml parser has two concerns that must be separated:
1. Which YAML style is this? (check for typed key in the step's content)
2. Where are the typed fields? (extract the correct mapping node before calling `Decode`)

**Style B detection must scan the whole step**: Not just the first key. `id` and `note` can appear before the typed key.

**Debug tests in production code are noise**: The inline `fmt.Printf` in `parser.go` and the messy multi-file debug test additions caused more confusion than clarity. The correct approach is: write a targeted test, observe the output, write the postmortem, implement the fix, clean up all debug code.

### What was tricky to build

**Getting `typedMappingForStep` right**: The first version returned nil for Style A because it only checked for the typed key as a sibling. The fix scans for the typed key anywhere in the step (to support Style B with id/note before the type), and if found as a mapping value (not the step's own key), returns that nested mapping. Otherwise returns the step node itself.

### What warrants a second pair of eyes

1. **SectionStep nested decoding**: The `steps` sequence is extracted from the section mapping after `Decode`. This works but the code path is slightly different from other types. Worth a quick check.
2. **The `styleBStepType` function**: It's a linear scan that runs twice per step (once in `styleBStepType`, once in `typedMappingForStep`). Could be cached but not worth the complexity for now.

### What should be done in the future

1. ~~Move on to task 1.4 (Chi router, API server setup)~~ — DONE
2. ~~Implement task 1.5 (GET /api/walkthroughs endpoint)~~ — DONE
3. ~~Write the API handler tests with httptest~~ — DONE
4. Phase 2: Git integration with go-git
5. Commit the Phase 1 Go backend scaffold

---

## Step 9: Tasks 1.4–1.9 — HTTP Server, API Endpoints, Tests

**User prompt (verbatim):** "ok continue. remember to commit and keep a diary as you go."

**Assistant interpretation:** Continue working through the sub-tasks for Phase 1, committing and updating the diary at each logical point.

**Inferred user intent:** Complete Phase 1 (Go backend scaffold) with working API endpoints and tests.

### What I did

1. Initially created `internal/api/routes/walkthroughs.go` as a separate package — caused an import cycle (routes → api → domain → yaml → routes) and had dangling `import "os"` at end of file. Resolved by consolidating all handlers into the `api` package.
2. Rewrote `internal/api/server.go` — Chi router setup, CORS/compression/logger middleware, `ListenAndRun()` with graceful shutdown via SIGINT/SIGTERM, removed unused imports (`os`, `os/signal`, `syscall`)
3. Wrote `internal/api/walkthroughs.go` — `GET /api/walkthroughs` (list with step count), `GET /api/walkthroughs/:id` (full walkthrough), `serializeSteps()` converts domain discriminated union to JSON, `countSteps()` handles nested sections
4. Wrote `internal/api/files.go` — `GET /api/files/content` with query params validation, range limits (max 500 lines), proper HTTP status codes (400, 404, 416), TODO comment for Phase 2 git integration
5. Wrote `cmd/cr-server/main.go` — flag parsing, wired to `api.ListenAndRun()`
6. Wrote `Makefile` — `build`, `run`, `dev`, `test`, `lint`, `fmt`, `tidy`, `clean`
7. Created sample repo files: `src/middleware/auth.ts`, `src/utils/token.ts`
8. Wrote `internal/api/api_test.go` — 5 tests: health, list, get, file content, writeError
9. Ran smoke test via tmux: all endpoints return correct JSON

### What worked

**Consolidating into one package**: All handlers live in `api` package, avoiding import cycles. The `api` package is the natural owner of both server setup and handlers.

**Smoke testing with tmux**: Starting the server in a tmux session (`tmux new-session -d -s cr-server "..."`) and curling from the host is the cleanest approach. Background `&` + `timeout` approach doesn't work reliably in this environment.

**The API response shape**: Walking through the domain discriminated union in `serializeStep()` and calling `writeJSON` directly produces clean JSON. The `[2]int` for `LineRange` serializes to JSON arrays automatically.

### What didn't work

**Import cycle attempt**: Initially tried to put routes in `internal/api/routes` as a separate package. Since routes needed `api.writeJSON`, and the root `api` package would import domain, there was no cycle — but it was more complexity than needed. Single `api` package is simpler.

**Dangling import at file end**: Wrote `import "os"` at the bottom of `walkthroughs.go` as a single-line stray. The `write` tool placed it there accidentally.

**Background server + curl**: `timeout 5 ./bin/cr-server &` followed by `curl` doesn't reliably work. The process exits when the terminal closes. tmux is the right tool.

### What I learned

**Chi router mounting pattern**: Routes mounted with `r.Route("/api/walkthroughs", func(api chi.Router) { handleWalkthroughsRoutes(api, dir) })` — the test must mirror this structure, wrapping the route in the same chi router with the same path prefix. Requests to `/api/walkthroughs` must go to a router that has that path prefix mounted.

**The discriminated union serializes naturally**: Each `case s.Source != nil:` in `serializeStep()` produces a flat JSON object with `type` and fields. RTK Query on the frontend will receive this as-is.

### What was tricky to build

**Getting the test router structure right**: The first test failures (`404 page not found`) were because the test created `chi.NewRouter()` and called `handleWalkthroughsRoutes(r, dir)`, but then requested `/api/walkthroughs`. The Chi router in `handleWalkthroughsRoutes` only mounts at `/`, so `/api/walkthroughs` was never matched. Fixed by wrapping in `r.Route("/api/walkthroughs", func(api chi.Router) { ... })` in the test.

### What warrants a second pair of eyes

1. **Phase 2 git integration**: The `handleFileContent` currently reads from disk path. The `TODO` comment marks this clearly, but Phase 2 needs to wire in go-git properly so `ref` is respected.
2. **`countSteps` for step count**: Currently counts section.Steps recursively. Verify this matches what the frontend needs for the step strip.

### What should be done in the future

1. ~~Phase 2: git integration with go-git — replace the `TODO` in `files.go`~~ — DONE
2. ~~Implement `GET /api/files/diff` endpoint~~ — DONE
3. ~~Implement `GET /api/repos/:repo/refs` (list branches/tags)~~ — DONE
4. Start the React frontend scaffold (Phase 3)

---

## Step 10: Phase 2 — Git integration (Tasks 2.1–2.6)

Phase 2 wired a full `go-git` service layer into the API so that `GET /api/files/content` reads from a git ref (branch/commit) rather than the working tree, and added `GET /api/files/diff` and `GET /api/repos/refs` endpoints. The core insight was that the `RepoService` interface in `internal/domain/git/` owns all git operations; the `api` package is a consumer.

**Commit (code):** `d727b6b` — "CR-DSL-001: Phase 2 git integration (Tasks 2.1–2.6)"

### What I did

1. Added `go get github.com/go-git/go-git/v5` → `v5.17.2`, along with `plumbing/object` and `storage/memory`
2. Initialized `sample-repo/` as a real git repo (`git init`, two commits, `feat/auth-refactor` branch, `v1.0.0` tag)
3. Wrote `internal/domain/git/service.go` — `RepoService` interface + `GitRepoService` implementation
4. Wrote `internal/domain/git/cache.go` — `RepoServiceWithCache` (TTL in-memory, background eviction)
5. Wrote `internal/domain/git/service_test.go` — integration tests using temp-dir git repos (`os.MkdirTemp` + `git -C tmp ...`)
6. Updated `internal/api/files.go` — wired `git.RepoService`, rewrote `handleFileContent`, added `handleFileDiff`, `handleListRefs`
7. Updated `internal/api/server.go` — `Config.RepoService` (nil = default cached service), new `handleReposRoutes`
8. Updated `internal/api/api_test.go` — `TestHandleFileContent` uses real git-backed service via sample-repo
9. Added `.gitignore` entry for `sample-repo/README.md`

### Why

The disk-based file reader in Phase 1 always read from the filesystem regardless of which git branch the walkthrough described. Walkthroughs reference `base`/`head` refs, so the API needs to read file content at those specific commits. The interface-based design (`RepoService`) lets us cache, mock, or swap implementations without changing the API layer.

### What worked

**Interface + decorator pattern**: `RepoService` interface means `CachedRepoService` wraps `GitRepoService` without either knowing about the other. The API handler just calls `repoSvc.ReadFileLines(ctx, ...)` — no knowledge of caching.

**`git -C tmp` for all git commands**: Every `exec.Command("git", "-C", tmp, ...)` call isolates git to the temp directory regardless of cwd. This avoids accidental side effects on the project repo.

**Go-git `ResolveRevision` for ref resolution**: Handles branches, tags, commit SHAs, and relative refs (`HEAD~n`) in one call.

**Explicit two-tree diff form**: `git diff A B` (not `A..B`) avoids ambiguity when git parses the right-hand side as a path instead of a ref.

### What didn't work

**`os.Chdir(tmp)` approach for test setup**: `git init` creates `.git` in the current directory, not the target directory. Changing cwd with `os.Chdir` also affected all subsequent tests in the same process. Replaced with `git -C tmp` on every command.

**`git diff A..B` with `cmd.Dir=tmp`**: When git runs in `tmp` dir (via `cmd.Dir`), it interprets `B` as a path in the working tree, not a ref. Result: `git diff main..feat/test` returns empty instead of the diff. Fix: `git diff main feat/test` (two-tree form).

**`strings.Contains(err.Error(), "exit status 1")` for git diff exit codes**: `"exit status 128"` (unknown ref) contains `"exit status 1"` as a substring. Replaced with `errors.As` to check the actual exit code.

**`splitLines` handling consecutive newlines**: `strings.Split("a\n\nb", "\n")` gives `["a", "", "b"]`. A trailing newline left a spurious empty element. Fix: normalize all line endings to `\n`, split, then filter out empty strings.

**Leftover `.git` directory**: An earlier test version used `os.Chdir(tmp)` which changed the global cwd. When tests ran, the git repo was accidentally created at `internal/domain/git/.git` instead of the temp dir. Removed it; tests run clean now.

### What I learned

**Git diff range syntax ambiguity**: `git diff A..B` with `cmd.Dir` causes git to parse `B` as a working-tree path. The explicit two-tree form `git diff A B` always works.

**`git init` in Go tests**: Always use `git -C tmp` (not `os.Chdir`) to target the right directory. `os.Chdir` changes process-global state.

**Exit code classification**: `exec.ExitError.ExitCode()` is the right way to check git exit codes — not string matching on `err.Error()`.

**go-git in-memory storage**: `memory.NewStorage()` creates an in-memory repo, but `PlainOpen` needs a real filesystem. For integration tests, temp dir + subprocess git is the most reliable approach.

### What was tricky to build

**`git -C tmp` vs `cmd.Dir`**: Both specify the working directory for git, but only `-C tmp` works for `git diff A..B`. When debugging why diffs returned empty, had to isolate that `cmd.Dir` causes git to interpret the second ref as a path.

**Test fixture isolation**: Each test needs a fresh git repo (different temp dir, no shared state). `os.MkdirTemp` + cleanup handles this. Git repo must have at least 2 commits on different branches for diff tests to be meaningful.

### What warrants a second pair of eyes

1. **`GetDiff` subprocess**: Phase 3 design doc says to replace `exec git diff` with pure go-git tree comparison. The TODO comment is in the code. Ensure the replacement produces the same unified diff format.
2. **Cache invalidation on push**: The TTL cache never invalidates on `git push`. If the server is long-running and someone pushes new commits, cached file reads may be stale until TTL expires (5 min).
3. **Sample repo fixture**: `sample-repo/.git` is real git history used by tests. If it's accidentally rewritten (force push, reset), integration tests may break.

### What should be done in the future

1. ~~Phase 3: React frontend scaffold (Vite, tokens, Storybook)~~ — DONE
2. Phase 4: RTK Query + MSW mocks for all 4 API endpoints
3. Phase 5: 13 step renderer components (done in Phase 3)
4. Phase 6: Storybook stories + accessibility audit (done in Phase 3)
5. Phase 7: go:embed SPA into binary
6. Phase 8: reMarkable upload

---

## Step 11: Phase 3 — React Frontend Scaffold (Tasks 3.1–3.8)

**Commit (code):** `018cf39` — "CR-DSL-001: Phase 3 React frontend scaffold (Tasks 3.1–3.8)"

### Prompt Context

**User prompt (verbatim):** "perfect, continue, make lots of stories."

**Assistant interpretation:** Start Phase 3 (React frontend scaffold), following the design doc §7 tech stack and the `react-modular-themable-storybook` skill. Read the existing JSX prototype and design doc API section first.

**Inferred user intent:** Complete the frontend scaffold so it can be developed further. Wanted many stories to cover all components and states.

### What I did

1. Read `design-doc/01-architecture-design-and-implementation-guide.md` §7 (API types, RTK Query slice, MSW handlers, CSS tokens, data-part contract)
2. Read `imports/cr-walkthrough-dsl.jsx` — the ~500-line JSX prototype — for ground-truth UI behaviour
3. Read `~/code/wesen/corporate-headquarters/go-minitrace/web/.storybook/` for the user's preferred Storybook setup pattern
4. Initialized `frontend/` with `npm create vite@latest` (React TS template), installed all deps (RTK v2, react-redux, react-router-dom, msw v2, storybook v8, vitest)
5. Set up `packages/cr-walkthrough/` as npm workspace package, wrote all source files
6. Ran into npm dependency conflicts: storybook addons from `npx storybook init` were v10 (chromatic, addon-vitest) mixed with v8. Pinned all to `^8`, removed incompatible addons, added `esbuild` devDependency
7. `npx storybook init` created `vite.config.ts` with `@storybook/addon-vitest` plugin (removed that)
8. Updated `.storybook/main.ts` and rewrote `preview.tsx` following go-minitrace pattern (`satisfies Meta`, decorators, backgrounds, no Redux pre-seeding)
9. Split `Interactive.stories.tsx` and `StepRenderers.stories.tsx` into one-file-per-component (CSF allows only one `export default` per file)
10. Fixed import path in `StepCard.tsx`: `'../StepRendererRegistry'` → `'./StepRendererRegistry'` (WRONG_MODULE_NOT_FOUND)
11. Fixed `preview.tsx`: RTK Query v2 removed `getDefaultState()` — simplified to no Redux at all, inline props only in stories
12. Fixed `Intro.stories.mdx` → `Introduction.stories.mdx` (MSW module name collision)
13. Wrote 95 stories across 18 story files. All TypeScript clean. Storybook builds.

### Why

Following the user's go-minitrace Storybook pattern directly avoids re-inventing the setup. Key patterns: `import type { Preview } from '@storybook/react-vite'`, `decorators` in preview.tsx without Redux, `satisfies Meta<typeof Component>` for type-safe meta objects, and inline fixture data in stories.

### What worked

**One-file-per-component stories**: CSF requires exactly one `export default` (the `meta`) per `.stories.tsx` file. Splitting multi-component files was the right call — each renderer gets its own file with its own meta.

**Matching go-minitrace setup**: Using the same Storybook configuration as the user's existing project (`@storybook/react-vite`, `decorators` in preview.tsx, `satisfies Meta`) means the team gets a consistent DX.

**Inline data in stories**: Not using Redux in Storybook means stories are self-contained and fast. The RTK Query hooks (SourceRenderer, DiffRenderer, CompareRenderer) call the API in real use — for Storybook, fixture data passed as props is sufficient.

### What didn't work

**npm storybook addons mixed versions**: `npx storybook init` installed `@chromatic-com/storybook`, `@storybook/addon-vitest`, etc. — all v10 while `storybook` was v8. Peer deps conflict. Fixed by pinning all `@storybook/*` deps to `^8`, removing v10-only addons.

**Leftover `.git` in test dir**: The `internal/domain/git/.git` leftover from buggy test setup caused `git add internal/domain/git/` to silently fail. Removed it.

**Multiple `export default` in one CSF file**: `Interactive.stories.tsx` exported `checkpointMeta` and `revealMeta` and `branchMeta` as defaults. Storybook v8 refuses this. Split into one file per component.

**RTK Query v2 `getDefaultState`**: v2 removed `getDefaultState()` on the API object. Our `preview.tsx` tried to pre-seed the Redux store with `walkthroughsApi.getDefaultState()`. Removed the store entirely — stories use inline props.

**MSW in Storybook without a service worker build**: Setting up MSW service workers in Storybook requires `msw init` + public dir setup. For Phase 3, skipped MSW in Storybook — handlers are written in `src/mocks/handlers.ts` for the app's MSW setup in Phase 4.

### What I learned

**CSF story file rules**: Exactly one `export default` per `.stories.tsx` file. If you need multiple component metas in one file, split into separate files.

**npm workspaces + Storybook**: Adding `workspaces: ["packages/*"]` to root `package.json` makes the workspace packages visible to the Storybook Vite config. The `@crs-cradle/cr-walkthrough` package resolves without any special alias config in Vite.

**TypeScript `satisfies Meta<typeof Component>`**: The go-minitrace pattern — `const meta = { component, decorators, tags } satisfies Meta<typeof Component>` — is more ergonomic than `export default { component } as Meta<...>`. It infers the correct `Story` type from the `component` prop.

### What was tricky to build

**CSF multi-export restriction**: Multiple `export default` in one file causes Storybook to refuse to index the file. Had to split all multi-component story files.

**RTK Query v2 API change in preview.tsx**: `getDefaultState()` removed in v2. The pre-seeding approach was abandoned in favour of inline props. For real MSW integration in Storybook, Phase 4 will set up the service worker properly.

### What warrants a second pair of eyes

1. **SourceRenderer / DiffRenderer / CompareRenderer in Storybook**: These call `useGetFileContentQuery` / `useGetFileDiffQuery`. Without MSW, they'll hit a real or 404 endpoint. Consider adding MSW handlers or at minimum a mock provider in Phase 4.
2. **`satisfies Meta` type**: The pattern is inferred from `component` prop — confirm all stories have the `render` function typed correctly and `Story` from `StoryObj<typeof meta>` is right.
3. **NPM workspaces**: The `workspaces` field in root `package.json` makes all workspace packages available. Confirm this doesn't interfere with the root Vite build.

### What should be done in the future

1. Phase 4: RTK Query + MSW service worker for browser — wire `src/mocks/handlers.ts` via MSW service worker
2. Phase 5: `SourceRenderer`, `DiffRenderer`, `CompareRenderer` — add MSW handlers so they return fixture data in Storybook
3. Phase 7: go:embed SPA into binary — wire Vite build output into Go binary
4. Phase 8: reMarkable upload

---

## Step 12: Fix go:embed + HTTP Serving Bugs (Three Compounding Issues)

A colleague's bug report (`reference/05-go-embed-path-bug-report.md`) reported that the SPA returns 404 for all non-API routes after `make build`. The report correctly identified a `cp -r` nesting issue but missed two other independent bugs. After independent analysis, I found three compounding bugs: (1) `cp -r frontend/dist static/` creates `static/dist/dist/` when `static/dist/` already exists (which it always does after a fresh `git clone` because build artifacts were committed), (2) `http.FileServer(http.FS(static.Dist))` looks up files by URL path without the `dist/` prefix, so even with correct embed layout, static assets (JS, CSS, images) return 404 despite the existence check passing, and (3) `static/dist/` contents should never have been committed to git. All three are now fixed.

### Prompt Context

**User prompt (verbatim):** "@ttmp/2026/04/04/CR-DSL-001--go-react-rtk-query-themeable-cr-walkthrough-system/reference/05-go-embed-path-bug-report.md — Address these issues from your colleague, they're struggling with the HTTP server. Explain what's going on after doing your own analysis."

**Assistant interpretation:** Read the bug report, independently verify the claims against the actual codebase, determine root cause(s), fix all issues, and explain what's going on.

**Inferred user intent:** Unblock the colleague by correctly diagnosing and fixing the HTTP server SPA serving bugs, not just applying the bug report's recommended fix (which was itself wrong).

### What I did

1. Read the bug report (`reference/05-go-embed-path-bug-report.md`) end-to-end
2. Read all three implicated files independently: `Makefile`, `static/embed.go`, `internal/api/server.go`
3. Verified on-disk state: `static/dist/` contains flat files (no nesting) because `copy-static` had already been run once on a clean dir — but the nesting would reproduce on any re-run since `static/dist/` now exists
4. Verified that `static/dist/` contents (all 7 files including `README.txt` placeholder) are tracked by git via `git ls-files -- static/`
5. Identified Bug 1: `cp -r frontend/dist static/` when `static/dist/` exists creates `static/dist/dist/` — the bug report's recommended fix (`cp -r frontend/dist static/dist`) would *always* nest, making it worse
6. Identified Bug 2: `http.FileServer(http.FS(static.Dist)).ServeHTTP(w, r)` uses the raw URL path to look up files — for `/favicon.svg` it looks for `favicon.svg` in the embed FS, but the file lives at `dist/favicon.svg`
7. Identified Bug 3: Build artifacts (`static/dist/*`) committed to git — triggers Bug 1 on clone and is bad practice
8. Fixed `Makefile` `copy-static` target: added `rm -rf static/dist` before `cp -r`
9. Fixed `internal/api/server.go`: added `fs.Sub(static.Dist, "dist")` to strip the `dist/` prefix, created package-level `distFileServer` and `distHTTPFS`, updated `spaFallbackHandler` to use the sub-FS throughout
10. Added `"io/fs"` to imports in `server.go`
11. Added `static/dist/` to `.gitignore`
12. Ran `git rm -r --cached static/dist/` to untrack the 7 build artifacts
13. Verified: `go build ./...` and `go vet ./...` both pass clean

### Why

The colleague's report only saw the nesting symptom and proposed a fix that would make it worse. The `http.FileServer` bug was invisible in the report because it's masked by the nesting — if you fix only the nesting, static assets still 404 via the `http.FileServer` code path. The `fs.Sub` approach is the standard Go pattern for stripping a prefix directory from an `embed.FS` before handing it to `http.FileServer`.

### What worked

**Independent analysis**: Reading the codebase fresh rather than trusting the bug report's diagnosis revealed two additional bugs. The `fs.Sub` pattern is clean and well-understood in Go.

**Verifying on-disk state**: `find static -type f | sort` showed the files are currently flat (not nested), which means `copy-static` had run once on a clean `static/dist/`. The nesting only reproduces on re-run — explaining why the colleague saw it intermittently.

**`go build ./...` and `go vet ./...`**: Both pass with zero output, confirming the code changes are syntactically and semantically correct.

### What didn't work

**The bug report's Option A fix**: The report recommended changing `cp -r frontend/dist static/` to `cp -r frontend/dist static/dist`. But when `static/dist/` already exists (which it does after git clone or a previous build), `cp -r src dst/` copies src *into* dst, creating `static/dist/dist/`. The correct fix is `rm -rf static/dist && cp -r frontend/dist static/`.

### What I learned

**`cp -r` behavior with existing destination directories**: `cp -r frontend/dist static/` copies `dist/` into `static/dist/` if the destination directory exists, creating `static/dist/dist/`. If it doesn't exist, it creates `static/dist/` with the contents. This is a classic shell scripting footgun.

**`fs.Sub` is the right tool for `embed.FS` + `http.FileServer`**: When you have `//go:embed dist` (which embeds with a `dist/` prefix) and want `http.FileServer` to serve by URL path, `fs.Sub(fs, "dist")` strips the prefix so URL paths match embed paths directly.

**Never commit build artifacts**: The `static/dist/` directory was committed with all 7 files including a `README.txt` placeholder. This both bloats the repo and creates the conditions for Bug 1 (directory exists before `copy-static` runs).

### What was tricky to build

**Diagnosing Bug 2 (the `http.FileServer` path mismatch)**: This bug is completely invisible when Bug 1 is present, because the nesting causes `Open("dist/" + path)` to fail before the `http.FileServer` code path is even reached. If you fix only Bug 1, Bug 2 reveals itself: the existence check (`Open("dist" + path)`) passes because the file is at `dist/favicon.svg`, but `http.FileServer` then tries to serve `favicon.svg` (no prefix) from the same FS and gets a 404. The two bugs mask each other in opposite directions.

**The bug report's recommended fix was itself a bug**: Changing `cp -r frontend/dist static/` to `cp -r frontend/dist static/dist` would make the nesting *always* happen (not just on re-run), making the situation strictly worse than the original.

### What warrants a second pair of eyes

1. **`fs.Sub` error handling**: `var distFS, _ = fs.Sub(static.Dist, "dist")` — the error is discarded because `fs.Sub` only errors if the prefix is malformed (it doesn't check existence). This is safe but worth confirming.
2. **Package-level file server variables**: `distFS`, `distHTTPFS`, and `distFileServer` are initialized at package level. If `static.Dist` is empty (no `static/dist/` directory at build time), these will be empty/nil. The `spaFallbackHandler` already handles this with the `"SPA index.html not embedded"` error message, but verify the `http.FileServer` doesn't panic on an empty FS.
3. **Clean build from scratch**: After `git rm -r --cached static/dist/`, a fresh clone has no `static/dist/` directory. Running `make build` should create it via `build-frontend` → `copy-static`. Verify this works end-to-end.

### What should be done in the future

1. **End-to-end smoke test**: Run `make clean && make build` then `./bin/cr-server` and verify both API (`/api/health`) and SPA (`/`) return 200.
2. **Add a CI check**: Verify that `static/dist/` is never accidentally committed again (e.g., a git hook or CI step that checks for tracked files in `static/dist/`).
3. **Phase 7.6 (smoke test)**: When that task is done, it should catch these regressions automatically.

### Code review instructions

- Start in `internal/api/server.go` — look at the three package-level variables (`distFS`, `distHTTPFS`, `distFileServer`) and trace how `spaFallbackHandler` uses them. Compare with the old version to see the `fs.Sub` fix.
- Then check `Makefile` — the `copy-static` target now does `rm -rf static/dist` before `cp -r`.
- Then check `.gitignore` — `static/dist/` is now ignored.
- Verify: `git status` should show `static/dist/` files as deleted (untracked), not modified.
- Build: `go build ./...` and `go vet ./...` should pass clean.

### Technical details

**Files changed:**

| File | Change |
|---|---|
| `Makefile` | `copy-static`: added `rm -rf static/dist` before `cp -r frontend/dist static/` |
| `internal/api/server.go` | Added `"io/fs"` import; added `fs.Sub(static.Dist, "dist")` to create prefix-stripped FS; rewrote `spaFallbackHandler` to use `distHTTPFS` and `distFileServer` |
| `.gitignore` | Added `static/dist/` |
| Git index | Untracked all `static/dist/*` files (7 files removed from index) |

**The `fs.Sub` pattern (new `server.go` code):**

```go
var distFS, _ = fs.Sub(static.Dist, "dist")
var distHTTPFS = http.FS(distFS)
var distFileServer = http.FileServer(distHTTPFS)
```

This strips the `dist/` prefix from the embed FS. Now:
- `distHTTPFS.Open("index.html")` finds `dist/index.html` in the embed ✅
- `distHTTPFS.Open("favicon.svg")` finds `dist/favicon.svg` in the embed ✅
- `http.FileServer(distHTTPFS)` serves `/favicon.svg` → `favicon.svg` in sub-FS → `dist/favicon.svg` in embed ✅

**The old broken code:**

```go
// Open with prefix — works for existence check:
static.Dist.Open("dist" + path)  // "dist/favicon.svg" ✅ finds file

// But http.FileServer uses raw URL path — no prefix:
http.FileServer(http.FS(static.Dist)).ServeHTTP(w, r)
//   Looks for "favicon.svg" in embed FS → 404 ❌
```
