---
Title: "Writing a Walkthrough — Authoring Guide"
Slug: cr-dsl-writing-a-walkthrough
SectionType: Tutorial
Topics:
  - cr-dsl
  - authoring
  - writing
  - tutorial
  - yaml
  - walkthrough
IsTemplate: false
IsTopLevel: false
ShowPerDefault: true
Order: 2
---

This guide walks through the process of writing a complete walkthrough from scratch. By the end you'll understand how to structure a walkthrough, choose the right step types, and add it to your repository.

## What makes a good walkthrough

A walkthrough is not a code description — it is a guided reading of a changeset. The goal is to help a reviewer (or a reader learning the codebase) understand:

1. **What changed** — the diff and the files touched
2. **Why it changed** — the motivation and context
3. **What to look at** — the critical paths, the edge cases, the tradeoffs
4. **What to check** — quizzes that confirm the reader understood the key points

Think of it as a code tour with narration. The walkthrougher controls the pace and direction; you as the author provide signposts.

## Step 1 — Understand the changeset

Before writing any YAML, review the diff. Run:

```bash
git log --oneline main..feat/your-branch
git diff main..feat/your-branch --stat
```

Identify the logical groupings:

- Which files belong together conceptually?
- What's the entry point for the change?
- What are the most important lines to draw attention to?
- Where are the edge cases or gotchas?
- What would a reviewer most likely miss?

## Step 2 — Write the YAML file

Create a `.yaml` file in your walkthroughs directory. The filename (without `.yaml`) becomes the walkthrough ID.

### Structure

Every walkthrough has a header and a steps array:

```yaml
id: feat-my-feature
title: "My Feature — PR #123"
repo: github/acme/backend
base: main
head: feat/my-feature
authors:
  - yourname
steps: []
```

### Step order

A good reading order follows the code's logic, not the alphabetical file order:

1. **Context** — What is this PR doing at a high level? (text)
2. **Entry point** — What file/function is the entry? (source)
3. **Key changes** — The most important diff hunks. (diff, source)
4. **Annotations** — Inline notes on specific lines. (annotation)
5. **Conceptual explanation** — Before/after or code-only steps. (code)
6. **Quizzes** — Check understanding. (checkpoint)
7. **Navigation** — Let the reader choose what to explore next. (branch)

### Worked example

Here is a complete walkthrough for a fictional PR that adds cursor pagination:

```yaml
id: cursor-pagination
title: "PR #456: Add cursor-based pagination"
repo: github/acme/backend
base: main
head: feat/cursor-pagination
authors:
  - alice
steps:
  # ── 1. Context ──────────────────────────────────────────────────────
  - type: text
    body: |
      This PR replaces offset-based pagination (`LIMIT 20 OFFSET 40`) with
      cursor-based pagination. Offset pagination has a scalability problem:
      as the offset grows, the database must scan and discard N rows before
      returning the window. Cursor pagination uses an indexed key and is
      O(log n) regardless of page depth.

  # ── 2. The old approach ───────────────────────────────────────────────
  - type: source
    id: old-pagination
    file: lib/pagination.ts
    ref: main
    lines: [1, 25]
    note: "The old offset-based paginator. Note L18 — the OFFSET grows."

  # ── 3. The new approach ────────────────────────────────────────────────
  - type: source
    id: new-pagination
    file: lib/pagination.ts
    ref: feat/cursor-pagination
    lines: [1, 30]
    note: "The new cursor paginator. Uses an indexed key instead of offset."

  # ── 4. The diff ──────────────────────────────────────────────────────
  - type: diff
    from: main
    to: feat/cursor-pagination
    path: lib/pagination.ts
    note: "The key change: LIMIT + OFFSET replaced with LIMIT + cursor."

  # ── 5. Annotation ──────────────────────────────────────────────────────
  - type: annotation
    file: lib/pagination.ts
    line: 18
    severity: warn
    body: |
      The decodeCursor function assumes valid base64 input. If a client
      sends a malformed cursor, this throws an unhandled exception.

  # ── 6. Quiz ──────────────────────────────────────────────────────────
  - type: checkpoint
    id: quiz-cursor
    prompt: |
      What is the time complexity of cursor pagination as the offset grows?
    choices:
      - label: O(n) — same as offset pagination
        correct: false
        explanation: Offset pagination is O(n) for large offsets. Cursor pagination is better.
      - label: O(log n) — uses a B-tree index seek
        correct: true
        explanation: Cursor pagination seeks directly to the cursor position using an index, giving O(log n) regardless of page depth.
      - label: O(1) — constant time
        correct: false
        explanation: There is always at least an index seek, which is O(log n) for B-tree indexes."

  # ── 7. Optional deep-dive ─────────────────────────────────────────────
  - type: reveal
    title: Show the client-side cursor encoding
    body: |
      Cursors are base64-encoded JSON: `base64(json.stringify({ id: lastSeenId }))`.
      On the server, decodeCursor does the reverse. The cursor must encode
      a unique, ordered value — using the primary key `id` satisfies this.

  # ── 8. Navigation ─────────────────────────────────────────────────────
  - type: branch
    prompt: What would you like to explore next?
    options:
      - label: See the tests
        goto: tests
      - label: Read the API change
        goto: api-change
      - label: Jump to the summary
        goto: summary
```

## Step 3 — Choose the right step type

Here is a decision guide:

**Use `text`** for:
- Introductions and context
- Explanations that don't need code
- Transitions between major sections

**Use `source`** for:
- Reading a file at a specific git ref
- Showing the "before" or "after" state of a file
- Lines that need line numbers for reference

**Use `diff`** for:
- The actual changes between refs
- When the reader needs to see additions and deletions in context
- When the diff is small enough to fit on screen

**Use `code`** for:
- Short before/after comparisons
- Conceptual illustrations
- Pseudo-code or examples that don't live in a file

**Use `compare`** for:
- Side-by-side before/after
- Comparing two related files or two different refs of the same file

**Use `annotation`** for:
- Inline review notes: warnings, praise, issues, info
- Notes that point to a specific line in a file

**Use `checkpoint`** for:
- Quizzes that confirm understanding
- Checking that the reader followed a key point

**Use `reveal`** for:
- Optional deep-dive content
- Worked examples that not everyone needs

**Use `shell`** for:
- Showing expected command output
- CLI interface changes

**Use `section`** for:
- Grouping related steps under a heading
- Organizing long walkthroughs into chapters

**Use `branch`** for:
- Offering multiple paths through the walkthrough
- Letting readers skip to the sections most relevant to them

## Step 4 — Add IDs for navigation

Every step can have an `id`. Use them when:

- You want `branch.goto` to jump to a specific step
- You want to link to a step from another part of the walkthrough

If you don't provide an `id`, one is auto-generated as `step-1`, `step-2`, etc. Auto-generated IDs change if you reorder steps — always use explicit IDs when a step is a branch target.

## Step 5 — Test the walkthrough

1. Start the server: `make dev-api REPO=./your-repo WT=./your-repo/walkthroughs`
2. Start the SPA: `cd frontend && npm run dev`
3. Visit `http://localhost:5173/wt/your-walkthrough-id`
4. Walk through it manually — check each step renders correctly
5. Test the checkpoint interactions
6. Test the branch navigation
7. Toggle between dark and light themes

## Style guide

**Be concise.** Each step should cover one idea. If a step is doing two things, split it.

**Be specific.** Prefer `"src/auth/middleware.ts:42"` over `"the auth file"`. Line numbers in annotations give the reader a direct reference.

**Use checkpoints sparingly.** One or two per walkthrough is enough. Too many checkpoints feel like a test, not a walkthrough.

**Annotations are not reviews.** Annotation severity (`warn`, `issue`, `praise`) should reflect the nature of the observation, not your opinion of the code quality.

**Reveal steps are for depth, not prerequisite knowledge.** A reader who skips all reveals should still understand the walkthrough.

**Branch options should be genuinely different paths.** If all paths lead to the same content, don't use branch — just use a section.

## Deployment

Once the YAML file is in the walkthroughs directory and the server is running, the walkthrough appears automatically in the walkthrough list at `/`. No registry, no configuration — the server scans the directory on startup and on each `GET /api/walkthroughs` request.

For production: commit the YAML file to the git repository. The CI pipeline deploys the server with the repo mounted as `-repo`. Anyone reviewing the PR in the deployed system will see the walkthrough automatically.

## Troubleshooting

Problem | Fix
---|---
Walkthrough not in list | Check the YAML file is in the directory passed to `-walkthroughs`
YAML parse error | Run `yaml.parse` in Go or `python3 -c "import yaml; yaml.safe_load(open('path'))"` to find the error
Steps in wrong order | Reorder the `steps` array; IDs remain stable if you don't delete steps
Branch doesn't navigate | Ensure the `goto` value matches an existing `id` exactly (string equality)
Annotation on wrong line | Git line numbers are 1-indexed and count from the first line of the file

## See Also

- [`cr-dsl-walkthrough-reference`](cr-dsl-walkthrough-reference) — Complete YAML field reference for every step type
- [`cr-dsl-step-types`](cr-dsl-step-types) — Visual examples of each step type rendered in the browser
- [`cr-dsl-theming`](cr-dsl-theming) — How to style custom annotations or override token values
