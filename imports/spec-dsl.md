# Code Review Walkthrough DSL

## Schema Overview

A walkthrough is a sequence of **steps**, each with a `type`. Steps flow linearly but can branch via interactive sections.

## YAML Examples

```yaml
walkthrough:
  title: "PR #482: Refactor auth middleware"
  repo: github/acme/backend
  base: main
  head: feat/auth-refactor
  authors: [alice, bob]

  steps:
    # --- Narration ---
    - type: text
      body: |
        This PR replaces the legacy session-based auth with JWT.
        We'll walk through the changes bottom-up, starting at the
        token utility layer.

    # --- Point at a file/line range ---
    - type: source
      file: src/utils/token.ts
      lines: [12, 48]
      highlight: [30, 35]
      note: "New `verifyToken` helper — note the fallback on L34."

    # --- Show a diff hunk ---
    - type: diff
      file: src/middleware/auth.ts
      hunks: [2, 3]          # which hunks to show (1-indexed)
      collapse: false
      note: "Session lookup replaced with `verifyToken` call."

    # --- Inline code snippet (not from repo) ---
    - type: code
      lang: typescript
      body: |
        // Before (conceptual)
        const user = await Session.find(req.cookie.sid);
        // After
        const user = decodeJWT(req.headers.authorization);

    # --- Side-by-side compare ---
    - type: compare
      left:
        file: src/middleware/auth.ts
        ref: main
        lines: [10, 30]
      right:
        file: src/middleware/auth.ts
        ref: feat/auth-refactor
        lines: [10, 35]
      note: "Old vs new auth flow."

    # --- Link out ---
    - type: link
      url: https://jwt.io/introduction
      label: "JWT primer (external)"

    # --- Interactive: quiz / checkpoint ---
    - type: checkpoint
      prompt: "What happens if the token is expired?"
      choices:
        - text: "Returns 401 Unauthorized"
          correct: true
          explain: "See L34 — the catch block returns early."
        - text: "Falls back to session auth"
          correct: false
          explain: "Session fallback was removed in this PR."

    # --- Interactive: reveal / toggle ---
    - type: reveal
      label: "Show edge-case discussion"
      body: |
        If the clock is skewed >30s, `exp` validation
        can reject valid tokens. We may want `clockTolerance`.

    # --- Callout / annotation on a diff ---
    - type: annotation
      file: src/middleware/auth.ts
      line: 42
      severity: warn          # info | warn | issue | praise
      body: "Race condition if token refresh fires mid-request."

    # --- Run a command / show output ---
    - type: shell
      cmd: "npm test -- --grep 'auth'"
      expect_exit: 0
      note: "All 14 auth tests should pass."

    # --- Group steps into a named section ---
    - type: section
      title: "Migration path"
      steps:
        - type: text
          body: "Existing sessions expire naturally (TTL 24h)."
        - type: diff
          file: scripts/migrate_sessions.sql
          hunks: all

    # --- Decision point / branching ---
    - type: branch
      prompt: "Which area do you want to explore next?"
      options:
        - label: "Error handling"
          goto: error-handling      # step id
        - label: "Performance"
          goto: perf-section

    # --- Referenceable step ---
    - type: section
      id: error-handling
      title: "Error handling deep-dive"
      steps:
        - type: source
          file: src/errors/AuthError.ts
          lines: [1, 22]

    - type: section
      id: perf-section
      title: "Performance considerations"
      steps:
        - type: text
          body: "JWT verification is ~0.3ms vs ~4ms for DB session lookup."
```

## Type Reference

| Type | Purpose | Key fields |
|---|---|---|
| `text` | Prose narration | `body` |
| `source` | Link to file + lines | `file`, `lines`, `highlight`, `ref` |
| `diff` | Show diff hunks | `file`, `hunks`, `collapse` |
| `code` | Inline snippet | `lang`, `body` |
| `compare` | Side-by-side | `left`, `right` |
| `link` | External URL | `url`, `label` |
| `annotation` | Comment on a line | `file`, `line`, `severity`, `body` |
| `checkpoint` | Quiz / knowledge check | `prompt`, `choices[]` |
| `reveal` | Expandable content | `label`, `body` |
| `shell` | Command + expected output | `cmd`, `expect_exit` |
| `section` | Group steps, give an `id` | `title`, `id`, `steps[]` |
| `branch` | Navigate non-linearly | `prompt`, `options[].goto` |

Every step accepts an optional `note` (short annotation) and `id` (for `goto` targets). `ref` defaults to `head` but can be any git ref. `file` paths are repo-relative.
