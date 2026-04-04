// Package domain contains the core domain types for the CR Walkthrough system.
// These types model the YAML DSL schema defined in imports/spec-dsl.md.
package domain

import "fmt"

// ── Root types ──────────────────────────────────────────────────────

// Walkthrough is the root domain object, representing one authored code-review walkthrough.
type Walkthrough struct {
	Title   string `yaml:"title"`
	Repo    string `yaml:"repo"`    // Human-readable repo identifier, e.g. "github/acme/backend"
	Base    string `yaml:"base"`    // Base git ref (branch, tag, or commit)
	Head    string `yaml:"head"`   // Head git ref (branch, tag, or commit)
	Authors []string `yaml:"authors"`
	Steps   []Step  `yaml:"steps"`
}

// Step represents one step in a walkthrough. Exactly one of the typed fields is non-nil,
// determined by the value of the YAML "type" field. This is the discriminated union.
type Step struct {
	ID   string `yaml:"id"` // Optional identifier; used as goto target by branch steps.

	// Typed step content (exactly one field is non-nil):
	Text       *TextStep       `yaml:"text,omitempty"`
	Source     *SourceStep     `yaml:"source,omitempty"`
	Diff       *DiffStep       `yaml:"diff,omitempty"`
	Code       *CodeStep       `yaml:"code,omitempty"`
	Compare    *CompareStep    `yaml:"compare,omitempty"`
	Link       *LinkStep       `yaml:"link,omitempty"`
	Annotation *AnnotationStep `yaml:"annotation,omitempty"`
	Checkpoint *CheckpointStep `yaml:"checkpoint,omitempty"`
	Reveal     *RevealStep     `yaml:"reveal,omitempty"`
	Shell      *ShellStep      `yaml:"shell,omitempty"`
	Section    *SectionStep    `yaml:"section,omitempty"`
	Branch     *BranchStep     `yaml:"branch,omitempty"`

	// Shared across all types:
	Note string `yaml:"note,omitempty"`
}

// StepType returns the name of the non-nil typed field, e.g. "source", "diff".
// It returns the empty string if zero or more than one typed field is set.
func (s Step) StepType() string {
	if s.Text != nil       { return "text" }
	if s.Source != nil     { return "source" }
	if s.Diff != nil       { return "diff" }
	if s.Code != nil       { return "code" }
	if s.Compare != nil    { return "compare" }
	if s.Link != nil       { return "link" }
	if s.Annotation != nil { return "annotation" }
	if s.Checkpoint != nil  { return "checkpoint" }
	if s.Reveal != nil      { return "reveal" }
	if s.Shell != nil       { return "shell" }
	if s.Section != nil     { return "section" }
	if s.Branch != nil      { return "branch" }
	return ""
}

// Validate returns an error if the Step has no typed content or has multiple typed fields.
func (s Step) Validate() error {
	count := 0
	if s.Text != nil       { count++ }
	if s.Source != nil     { count++ }
	if s.Diff != nil       { count++ }
	if s.Code != nil       { count++ }
	if s.Compare != nil    { count++ }
	if s.Link != nil       { count++ }
	if s.Annotation != nil { count++ }
	if s.Checkpoint != nil  { count++ }
	if s.Reveal != nil      { count++ }
	if s.Shell != nil       { count++ }
	if s.Section != nil     { count++ }
	if s.Branch != nil      { count++ }
	if count == 0 {
		return fmt.Errorf("step %q has no type field set", s.ID)
	}
	if count > 1 {
		return fmt.Errorf("step %q has more than one type field set", s.ID)
	}
	return nil
}

// ── LineRange ──────────────────────────────────────────────────────

// LineRange represents an inclusive 1-indexed line range: [Start, End].
// In YAML: [12, 48] maps to lines 12 through 48 inclusive.
type LineRange [2]int

// Validate returns an error if the range is invalid (start < 1, end < start).
func (lr LineRange) Validate() error {
	if lr[0] < 1 {
		return fmt.Errorf("line range start must be >= 1, got %d", lr[0])
	}
	if lr[1] < lr[0] {
		return fmt.Errorf("line range end (%d) must be >= start (%d)", lr[1], lr[0])
	}
	return nil
}

// ── Typed step structs ──────────────────────────────────────────────

// TextStep: prose narration.
type TextStep struct {
	Body string `yaml:"body"`
}

// SourceStep: show a file at a line range.
type SourceStep struct {
	File      string    `yaml:"file"`       // Repo-relative path, e.g. "src/utils/token.ts"
	Lines     LineRange `yaml:"lines"`       // Inclusive 1-indexed range
	Highlight LineRange `yaml:"highlight,omitempty"` // Sub-range to highlight
	Ref       string    `yaml:"ref,omitempty"`        // Git ref; defaults to walkthrough.Head
}

// DiffStep: show diff hunks for a file.
type DiffStep struct {
	File     string   `yaml:"file"`
	Hunks    []int    `yaml:"hunks,omitempty"` // 1-indexed hunk numbers; nil or empty = all hunks
	Collapse bool     `yaml:"collapse,omitempty"`
	Ref      string   `yaml:"ref,omitempty"`   // Git ref; defaults to walkthrough.Head
}

// CodeStep: inline code snippet (not from repo).
type CodeStep struct {
	Lang string `yaml:"lang"` // e.g. "typescript", "bash"
	Body string `yaml:"body"`
}

// RefSide is one side of a compare (side-by-side) step.
type RefSide struct {
	File  string    `yaml:"file"`  // Repo-relative path
	Ref   string    `yaml:"ref"`   // Git ref; defaults to walkthrough.Head (left) or walkthrough.Base (right)
	Lines LineRange `yaml:"lines"` // Inclusive 1-indexed range
}

// CompareStep: side-by-side comparison of two file versions.
type CompareStep struct {
	Left  RefSide `yaml:"left"`
	Right RefSide `yaml:"right"`
	Note  string  `yaml:"note,omitempty"`
}

// LinkStep: external URL.
type LinkStep struct {
	URL   string `yaml:"url"`
	Label string `yaml:"label,omitempty"` // Display text; defaults to URL
}

// AnnotationStep: comment on a specific line with severity.
type AnnotationStep struct {
	File     string `yaml:"file"`
	Line     int    `yaml:"line"`      // 1-indexed
	Severity string `yaml:"severity"`  // "info" | "warn" | "issue" | "praise"
	Body     string `yaml:"body"`
	Ref      string `yaml:"ref,omitempty"`
}

// Choice represents one option in a checkpoint (quiz) question.
type Choice struct {
	Text    string `yaml:"text"`     // The choice text shown to the user
	Correct bool   `yaml:"correct"`  // Whether this choice is correct
	Explain string `yaml:"explain"`  // Explanation shown after selection
}

// CheckpointStep: interactive quiz / knowledge check.
type CheckpointStep struct {
	Prompt  string   `yaml:"prompt"`
	Choices []Choice `yaml:"choices"`
}

// RevealStep: collapsible toggle with hidden content.
type RevealStep struct {
	Label string `yaml:"label"`
	Body  string `yaml:"body"`
}

// ShellStep: command with expected output.
type ShellStep struct {
	Cmd       string `yaml:"cmd"`
	Output    string `yaml:"output,omitempty"`
	ExpectExit int    `yaml:"expect_exit,omitempty"` // Expected exit code; 0 if not specified
	Note      string `yaml:"note,omitempty"`
}

// SectionStep: named group of steps (can be nested).
type SectionStep struct {
	Title string  `yaml:"title"`
	ID    string  `yaml:"id,omitempty"` // If set, can be a goto target
	Steps []Step  `yaml:"steps"`
}

// BranchOption represents one option in a branch (navigation) step.
type BranchOption struct {
	Label string `yaml:"label"` // Display text, e.g. "Error handling"
	Goto  string `yaml:"goto"`  // Target step ID to jump to
}

// BranchStep: navigation decision point with non-linear goto.
type BranchStep struct {
	Prompt  string         `yaml:"prompt"`
	Options []BranchOption `yaml:"options"`
}

// ── File content (returned by API) ─────────────────────────────────

// FileContent represents the result of reading a file at a git ref.
type FileContent struct {
	Ref   string   `json:"ref"`
	Path  string   `json:"path"`
	Start int      `json:"start"`
	End   int      `json:"end"`
	Lines []string `json:"lines"`
}

// ── Walkthrough summary (returned by list endpoint) ────────────────

// WalkthroughSummary is the metadata returned by the list endpoint.
type WalkthroughSummary struct {
	ID        string   `json:"id"`
	Path      string   `json:"path"`
	Title     string   `json:"title"`
	Repo      string   `json:"repo"`
	Base      string   `json:"base"`
	Head      string   `json:"head"`
	Authors   []string `json:"authors"`
	StepCount int      `json:"stepCount"`
}
