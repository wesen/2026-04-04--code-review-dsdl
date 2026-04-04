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
