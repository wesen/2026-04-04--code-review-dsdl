# Changelog

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

