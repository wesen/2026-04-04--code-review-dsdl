// Package yaml parses walkthrough YAML files into domain types.
// It handles two YAML formats for steps:
//
// Style A — "type:" key (the spec format in imports/spec-dsl.md):
//     - type: source
//       file: src/utils/token.ts
//       lines: [12, 48]
//   The fields are direct children of the step node.
//
// Style B — typed key as outer key (what Serialize() produces):
//     - source:
//         file: src/utils/token.ts
//         lines: [12, 48]
//   The step node IS the typed mapping; its first key IS the type name.
package yaml

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"

	"github.com/crs-cradle/cr-walkthrough/internal/domain"
)

// ── Parse ───────────────────────────────────────────────────────────

// Parse reads a walkthrough YAML file and returns the parsed domain object.
func Parse(path string) (*domain.Walkthrough, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read walkthrough file %q: %w", path, err)
	}
	return ParseBytes(data, path)
}

// ParseBytes parses YAML bytes into a Walkthrough.
// The filename is used only for error messages.
func ParseBytes(data []byte, filename string) (*domain.Walkthrough, error) {
	var raw struct {
		Walkthrough struct {
			Title   string    `yaml:"title"`
			Repo    string    `yaml:"repo"`
			Base    string    `yaml:"base"`
			Head    string    `yaml:"head"`
			Authors []string  `yaml:"authors"`
			Steps   yaml.Node `yaml:"steps"`
		} `yaml:"walkthrough"`
	}
	if err := yaml.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("parse YAML in %s: %w", filename, err)
	}

	if raw.Walkthrough.Title == "" && raw.Walkthrough.Repo == "" {
		return nil, fmt.Errorf("missing 'walkthrough:' root key in %s", filename)
	}

	steps, err := decodeSteps(&raw.Walkthrough.Steps, filename)
	if err != nil {
		return nil, err
	}

	return &domain.Walkthrough{
		Title:   raw.Walkthrough.Title,
		Repo:    raw.Walkthrough.Repo,
		Base:    raw.Walkthrough.Base,
		Head:    raw.Walkthrough.Head,
		Authors: raw.Walkthrough.Authors,
		Steps:   steps,
	}, nil
}

// ── Step decoding ───────────────────────────────────────────────────

// decodeSteps decodes a YAML sequence node into a []domain.Step.
func decodeSteps(node *yaml.Node, filename string) ([]domain.Step, error) {
	if node.Kind != yaml.SequenceNode {
		return nil, fmt.Errorf("steps must be a sequence, got %v in %s", node.Kind, filename)
	}
	var steps []domain.Step
	for i, item := range node.Content {
		step, err := decodeStep(item, filename, i)
		if err != nil {
			return nil, err
		}
		steps = append(steps, *step)
	}
	return steps, nil
}

// sharedFields holds fields that are direct children of the step node
// (shared between Style A and Style B), plus the explicit "type" value.
type sharedFields struct {
	ID   string // from "id" key
	Note string // from "note" key
	Type string // from "type" key
}

// extractSharedFields collects id, note, and type from the step node's content.
// This works identically for both YAML styles since these keys are always
// direct children of the step node in both formats.
func extractSharedFields(node *yaml.Node) sharedFields {
	var sf sharedFields
	for i := 0; i < len(node.Content); i += 2 {
		key := node.Content[i].Value
		val := node.Content[i+1]
		switch key {
		case "id":
			sf.ID = val.Value
		case "note":
			sf.Note = val.Value
		case "type":
			sf.Type = val.Value
		}
	}
	return sf
}

// styleBStepType returns the type name if the step uses Style B
// (typed key as outer key), otherwise "".
// It scans the entire step because Style B can have id/note before the typed key:
//   - id: step-1
//     text:
//       body: ...
func styleBStepType(node *yaml.Node) string {
	for i := 0; i < len(node.Content); i += 2 {
		key := node.Content[i].Value
		switch key {
		case "text", "source", "diff", "code", "compare",
			"link", "annotation", "checkpoint", "reveal", "shell",
			"section", "branch":
			return key
		}
	}
	return ""
}

// typedMappingForStep extracts the yaml.Node that contains the typed step fields.
// For Style A: the fields are direct children of stepNode → return stepNode itself.
// For Style B: the fields are in a nested mapping under the typed key →
//   return that nested mapping node.
// The returned node is always a MappingNode.
func typedMappingForStep(stepNode *yaml.Node, typeName string) *yaml.Node {
	for i := 0; i < len(stepNode.Content); i += 2 {
		key := stepNode.Content[i].Value
		if key == typeName {
			val := stepNode.Content[i+1]
			if val.Kind == yaml.MappingNode {
				return val
			}
			// Style A: the typed key IS the first key, and its value IS the fields
			return stepNode
		}
	}
	// Not found as a sibling; fall through to Style A assumption (stepNode itself)
	return stepNode
}

// decodeStep decodes a single YAML mapping node into a domain.Step.
func decodeStep(node *yaml.Node, filename string, index int) (*domain.Step, error) {
	if node.Kind != yaml.MappingNode {
		return nil, fmt.Errorf("step %d in %s: expected mapping node, got %v", index, filename, node.Kind)
	}

	// Collect shared fields.
	sf := extractSharedFields(node)

	// Determine the step type name and which YAML style is used.
	var typeName string
	if sf.Type != "" {
		// Style A: "type:" key is present
		typeName = sf.Type
	} else if bt := styleBStepType(node); bt != "" {
		// Style B: first key IS the type name
		typeName = bt
	} else {
		return nil, fmt.Errorf("step %d in %s: no 'type' field and no typed key found", index, filename)
	}

	// Decode the typed step.
	typed, err := decodeTypedStep(typeName, node, filename, index)
	if err != nil {
		return nil, err
	}
	if typed == nil {
		return nil, fmt.Errorf("step %d in %s: unknown type %q", index, filename, typeName)
	}

	step := typed
	step.ID = sf.ID
	step.Note = sf.Note

	if err := step.Validate(); err != nil {
		return nil, fmt.Errorf("step %d in %s: %w", index, filename, err)
	}
	if err := validateTypedStep(*step, filename); err != nil {
		return nil, err
	}
	return step, nil
}

// decodeTypedStep decodes the typed content of a step.
// For Style A: the fields are on the step node itself (direct children).
// For Style B: the fields are in a nested mapping (the step's first key-value pair).
// We handle this by decoding the step node directly; yaml.Unmarshal on the step's
// content handles both styles correctly when the fields are read from the right node.
func decodeTypedStep(typeName string, node *yaml.Node, filename string, index int) (*domain.Step, error) {
	switch typeName {
	case "text":
		var s domain.TextStep
		mapping := typedMappingForStep(node, "text")
		if err := mapping.Decode(&s); err != nil {
			return nil, err
		}
		return &domain.Step{Text: &s}, nil

	case "source":
		var s domain.SourceStep
		mapping := typedMappingForStep(node, "source")
		if err := mapping.Decode(&s); err != nil {
			return nil, err
		}
		return &domain.Step{Source: &s}, nil

	case "diff":
		var s domain.DiffStep
		mapping := typedMappingForStep(node, "diff")
		if err := mapping.Decode(&s); err != nil {
			return nil, err
		}
		return &domain.Step{Diff: &s}, nil

	case "code":
		var s domain.CodeStep
		mapping := typedMappingForStep(node, "code")
		if err := mapping.Decode(&s); err != nil {
			return nil, err
		}
		return &domain.Step{Code: &s}, nil

	case "compare":
		var s domain.CompareStep
		mapping := typedMappingForStep(node, "compare")
		if err := mapping.Decode(&s); err != nil {
			return nil, err
		}
		return &domain.Step{Compare: &s}, nil

	case "link":
		var s domain.LinkStep
		mapping := typedMappingForStep(node, "link")
		if err := mapping.Decode(&s); err != nil {
			return nil, err
		}
		return &domain.Step{Link: &s}, nil

	case "annotation":
		var s domain.AnnotationStep
		mapping := typedMappingForStep(node, "annotation")
		if err := mapping.Decode(&s); err != nil {
			return nil, err
		}
		return &domain.Step{Annotation: &s}, nil

	case "checkpoint":
		var s domain.CheckpointStep
		mapping := typedMappingForStep(node, "checkpoint")
		if err := mapping.Decode(&s); err != nil {
			return nil, err
		}
		return &domain.Step{Checkpoint: &s}, nil

	case "reveal":
		var s domain.RevealStep
		mapping := typedMappingForStep(node, "reveal")
		if err := mapping.Decode(&s); err != nil {
			return nil, err
		}
		return &domain.Step{Reveal: &s}, nil

	case "shell":
		var s domain.ShellStep
		mapping := typedMappingForStep(node, "shell")
		if err := mapping.Decode(&s); err != nil {
			return nil, err
		}
		return &domain.Step{Shell: &s}, nil

	case "section":
		var s domain.SectionStep
		mapping := typedMappingForStep(node, "section")
		if err := mapping.Decode(&s); err != nil {
			return nil, err
		}
		// SectionStep.Steps has yaml:"-" so Decode doesn't populate it.
		// Find the "steps" sequence in the section mapping.
		var stepsNode *yaml.Node
		for i := 0; i < len(mapping.Content); i += 2 {
			if mapping.Content[i].Value == "steps" {
				stepsNode = mapping.Content[i+1]
				break
			}
		}
		if stepsNode != nil {
			nested, err := decodeSteps(stepsNode, filename)
			if err != nil {
				return nil, err
			}
			s.Steps = nested
		}
		return &domain.Step{Section: &s}, nil

	case "branch":
		var s domain.BranchStep
		mapping := typedMappingForStep(node, "branch")
		if err := mapping.Decode(&s); err != nil {
			return nil, err
		}
		return &domain.Step{Branch: &s}, nil

	default:
		return nil, fmt.Errorf("step %d in %s: unknown type %q", index, filename, typeName)
	}
}

// ── Validate ────────────────────────────────────────────────────────

// validateTypedStep runs validation rules on typed step fields.
// Callers should also call step.Validate() for the discriminated union check.
func validateTypedStep(step domain.Step, filename string) error {
	switch {
	case step.Source != nil:
		s := step.Source
		if s.File == "" {
			return fmt.Errorf("source step %q: 'file' is required", step.ID)
		}
		if err := s.Lines.Validate(); err != nil {
			return fmt.Errorf("source step %q: %w", step.ID, err)
		}
		if err := s.Highlight.Validate(); err != nil {
			return fmt.Errorf("source step %q highlight: %w", step.ID, err)
		}

	case step.Diff != nil:
		if step.Diff.File == "" {
			return fmt.Errorf("diff step %q: 'file' is required", step.ID)
		}

	case step.Code != nil:
		if step.Code.Body == "" {
			return fmt.Errorf("code step %q: 'body' is required", step.ID)
		}

	case step.Compare != nil:
		c := step.Compare
		if c.Left.File == "" || c.Right.File == "" {
			return fmt.Errorf("compare step %q: 'left.file' and 'right.file' are required", step.ID)
		}
		if err := c.Left.Lines.Validate(); err != nil {
			return fmt.Errorf("compare step %q left.lines: %w", step.ID, err)
		}
		if err := c.Right.Lines.Validate(); err != nil {
			return fmt.Errorf("compare step %q right.lines: %w", step.ID, err)
		}

	case step.Annotation != nil:
		a := step.Annotation
		if a.File == "" {
			return fmt.Errorf("annotation step %q: 'file' is required", step.ID)
		}
		if a.Severity != "" && !isValidSeverity(a.Severity) {
			return fmt.Errorf("annotation step %q: invalid severity %q (expected: info|warn|issue|praise)", step.ID, a.Severity)
		}

	case step.Checkpoint != nil:
		ch := step.Checkpoint
		if ch.Prompt == "" {
			return fmt.Errorf("checkpoint step %q: 'prompt' is required", step.ID)
		}
		if len(ch.Choices) == 0 {
			return fmt.Errorf("checkpoint step %q: at least one choice is required", step.ID)
		}
		hasCorrect := false
		for i, c := range ch.Choices {
			if c.Text == "" {
				return fmt.Errorf("checkpoint step %q choice %d: 'text' is required", step.ID, i)
			}
			if c.Correct {
				hasCorrect = true
				if c.Explain == "" {
					return fmt.Errorf("checkpoint step %q correct choice: 'explain' is required", step.ID)
				}
			}
		}
		if !hasCorrect {
			return fmt.Errorf("checkpoint step %q: at least one choice must have correct:true", step.ID)
		}

	case step.Link != nil:
		if step.Link.URL == "" {
			return fmt.Errorf("link step %q: 'url' is required", step.ID)
		}

	case step.Reveal != nil:
		if step.Reveal.Label == "" {
			return fmt.Errorf("reveal step %q: 'label' is required", step.ID)
		}

	case step.Shell != nil:
		if step.Shell.Cmd == "" {
			return fmt.Errorf("shell step %q: 'cmd' is required", step.ID)
		}

	case step.Branch != nil:
		b := step.Branch
		if b.Prompt == "" {
			return fmt.Errorf("branch step %q: 'prompt' is required", step.ID)
		}
		if len(b.Options) == 0 {
			return fmt.Errorf("branch step %q: at least one option is required", step.ID)
		}
		for i, opt := range b.Options {
			if opt.Label == "" || opt.Goto == "" {
				return fmt.Errorf("branch step %q option %d: both 'label' and 'goto' are required", step.ID, i)
			}
		}
	}
	return nil
}

func isValidSeverity(s string) bool {
	switch s {
	case "info", "warn", "issue", "praise":
		return true
	default:
		return false
	}
}

// ── ListWalkthroughs ────────────────────────────────────────────────

// ListWalkthroughs returns all .yaml walkthrough files under root.
// It returns absolute paths.
func ListWalkthroughs(root string) ([]string, error) {
	var paths []string
	err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && strings.ToLower(filepath.Ext(path)) == ".yaml" {
			paths = append(paths, path)
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("list walkthroughs in %s: %w", root, err)
	}
	return paths, nil
}

// IDFromPath derives a walkthrough ID from its file path.
// E.g. "walkthroughs/auth-refactor.yaml" → "auth-refactor"
func IDFromPath(path string) string {
	base := filepath.Base(path)
	ext := filepath.Ext(base)
	return strings.TrimSuffix(base, ext)
}

// ── Serialise ───────────────────────────────────────────────────────

// Serialize converts a Walkthrough back to YAML bytes.
// It wraps in the top-level "walkthrough:" key to match the file format.
func Serialize(w *domain.Walkthrough) ([]byte, error) {
	type wrapper struct {
		Walkthrough *domain.Walkthrough `yaml:"walkthrough"`
	}
	return yaml.Marshal(&wrapper{Walkthrough: w})
}
