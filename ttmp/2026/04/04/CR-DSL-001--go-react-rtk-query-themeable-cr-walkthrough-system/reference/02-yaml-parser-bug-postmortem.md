---
Title: YAML Parser Round-Trip Bug — Postmortem and Fix
Ticket: CR-DSL-001
Status: active
Topics:
    - code-review
    - go-backend
    - design-doc
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: internal/domain/yaml/parser.go
      Note: The parser being debugged — contains decodeTypedStep and all step decoding logic
    - Path: internal/domain/yaml/parser_test.go
      Note: Tests including TestSerialize_RoundTrip (failing) and debug tests
    - Path: internal/domain/walkthrough.go
      Note: Domain types including domain.SourceStep, domain.Step discriminated union
ExternalSources: []
Summary: ""
LastUpdated: 2026-04-04T22:00:00-04:00
WhatFor: ""
WhenToUse: ""
---

# YAML Parser Round-Trip Bug — Postmortem and Fix

**Date**: 2026-04-04  
**Ticket**: CR-DSL-001  
**Task**: Task 1.3 — YAML parser + round-trip tests  
**Symptom**: `TestSerialize_RoundTrip` fails; `Parse(Serialize(Parse(...)))` does not produce the same data as the original.

---

## 1. The Bug

The YAML parser fails to re-parse YAML produced by `Serialize()`. Specifically, steps that use nested mapping keys (`source:`, `diff:`, etc.) fail with:

- `"file is required"` — `domain.SourceStep{}` has empty File field
- `"highlight: line range start must be >= 1, got 0"` — `Highlight` is `[0, 0]`

**Root cause**: `yaml.Unmarshal` / `yaml.Node.Decode` does not recursively decode nested YAML mappings into non-pointer struct fields. Only pointer fields trigger recursive decode. Since `domain.SourceStep` is a non-pointer field in the intermediate decode struct, the nested `source:` mapping is silently ignored.

---

## 2. Two Valid YAML Styles the Parser Must Handle

**Style A — `type:` key** (the spec format, in `imports/spec-dsl.md`):

```yaml
steps:
  - type: source
    file: src/utils/token.ts
    lines: [12, 48]
    highlight: [30, 35]
```

**Style B — typed key** (what `Serialize()` produces — the round-trip format):

```yaml
steps:
  - source:
      file: src/utils/token.ts
      lines: [12, 48]
      highlight: [30, 35]
```

Both must parse to: `domain.SourceStep{File:"src/utils/token.ts", Lines:[12,48], Highlight:[30,35]}`.

---

## 3. The Architecture Being Debugged

```
yaml.Unmarshal(data, &raw)
  └─ raw.Walkthrough.Steps = yaml.Node (preserved YAML AST)

decodeSteps(&raw.Walkthrough.Steps)
  └─ for each step item node:
       decodeStep(itemNode)
         ├─ reads "id", "note", "type" from itemNode.Content
         └─ decodeTypedStep(typeName, itemNode, ...)
             └─ case "source":
                  node.Decode(&s)   ← itemNode is the step node
                  # Fails for Style B because file/lines are nested
                  # inside "source:", not direct children
```

---

## 4. Evidence from Debug Tests

Inline debug tests in `parser_test.go` (see `TestDebugNodeDecode` and `TestDebugHighlightDecode`) confirmed:

```go
// Intermediate struct with non-pointer SourceStep field
// → SourceStep{} is silently EMPTY
var tmp struct {
    Source domain.SourceStep `yaml:"source,omitempty"` // NON-POINTER
}
yaml.Unmarshal([]byte(rawNode3), &tmp)
fmt.Printf("%+v\n", tmp.Source)
// Output: {File: Lines:[0 0] Highlight:[0 0] Ref:}  ← ALL ZERO

// Same but POINTER SourceStep field → POPULATED
var tmp struct {
    Source *domain.SourceStep `yaml:"source,omitempty"` // POINTER
}
yaml.Unmarshal([]byte(rawNode3), &tmp)
fmt.Printf("%+v\n", *tmp.Source)
// Output: {File:src/utils/token.ts Lines:[12 48] Highlight:[30 35]}  ✓
```

The same applies to `yaml.Node.Decode(&s)` — it uses non-pointer field behavior under the hood.

---

## 5. Iterations (Spiral)

| # | Attempt | Outcome |
|---|---|---|
| 1 | `yaml.Unmarshal` directly into `Walkthrough` | Failed: `Steps` has `yaml:"-"`, can't round-trip |
| 2 | Two-pass: scalars via unmarshal, steps via `yaml.Node.Decode` | Failed: same non-pointer struct issue |
| 3 | `findMappingNode` returning `*yaml.Node` | Failed: double-pointer confusion |
| 4 | `findMappingNode` returning `yaml.Node` (value) | Still wrong: `*parent` dereference corrupts aliases |
| 5 | Change all `stepMap.Decode` → `node.Decode` | Still wrong: `node` is step node, not nested mapping |
| 6 | Various pointer indirection tricks | Same underlying issue |
| 7 | Confirmed root cause in debug test | Stopped — should have fixed here instead of continuing |

**Total wasted iterations**: 7+ approaches over ~2 hours. The debug test had already confirmed the answer.

---

## 6. When to Stop Spiraling

Warning signs that appeared:

1. **Debug approach too low-level**: Using `fmt.Printf` in production code, moving it between files, fighting build errors. A standalone `go run` binary would have been faster.
2. **Same model, different permutation**: Each change was based on the same incorrect assumption — that the node structure was the issue, not the unmarshal behavior.
3. **Found the root cause but didn't act**: The debug test confirmed the non-pointer struct behavior. I noted it, then moved to another test without changing the actual code.
4. **Stopped reading the code**: Started guessing instead of re-reading `gopkg.in/yaml.v3` documentation.

**The correct stop point**: After Test 3 in `TestDebugNodeDecode` confirmed the non-pointer struct decode behavior. The fix was clear; I just didn't implement it.

---

## 7. The Fix

Replace all `node.Decode(&s)` calls in `decodeTypedStep` with a helper that correctly extracts the nested mapping node for both YAML styles:

```go
// extractTypedMapping finds the typed mapping for a step.
// Handles both YAML styles:
//   Style A: step has "type: source" + "source:" as sibling mapping
//   Style B: step has "source:" as its outer key (the serialized format)
func extractTypedMapping(stepNode *yaml.Node, typeName string) *yaml.Node {
    for i := 0; i < len(stepNode.Content); i += 2 {
        key := stepNode.Content[i].Value
        if key == typeName {
            // Style B: the typed key IS the outer key
            return stepNode.Content[i+1]
        }
    }
    // Style A: look for "type: <typeName>" and find the sibling typed mapping
    for i := 0; i < len(stepNode.Content); i += 2 {
        key := stepNode.Content[i].Value
        if key == "type" {
            // Check next sibling pair
            for j := i + 2; j < len(stepNode.Content); j += 2 {
                if stepNode.Content[j].Value == typeName {
                    return stepNode.Content[j+1]
                }
            }
        }
    }
    return nil
}
```

Then in `decodeTypedStep`:

```go
case "source":
    mapping := extractTypedMapping(node, "source")
    if mapping == nil {
        return nil, fmt.Errorf("source step: missing 'source' mapping")
    }
    var s domain.SourceStep
    if err := mapping.Decode(&s); err != nil {
        return nil, err
    }
    return &domain.Step{Source: &s}, nil
```

This pattern applies to all 12 step types.

---

## 8. Verification Plan

After implementing the fix:

1. Remove all debug code from `parser.go` and `parser_test.go` (restore clean imports)
2. Run `go test ./internal/domain/yaml -v -count=1` — all 10+ tests should pass including `TestSerialize_RoundTrip`
3. Run `go test ./... -count=1` — full test suite
4. Commit with message: `"fix(parser): handle both YAML step styles in decodeTypedStep"`

---

## 9. Lesson

When a debug test confirms the root cause, stop coding and write the postmortem before touching production code again. Then implement the fix with the correct mental model.
