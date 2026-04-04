package yaml

import (
	"os"
	"path/filepath"
	"testing"
)

func TestParse(t *testing.T) {
	path := filepath.Join("testdata", "auth-refactor.yaml")
	w, err := Parse(path)
	if err != nil {
		t.Fatalf("Parse(%q) returned error: %v", path, err)
	}

	if w.Title != "PR #482: Refactor auth middleware" {
		t.Errorf("expected title %q, got %q", "PR #482: Refactor auth middleware", w.Title)
	}
	if w.Repo != "github/acme/backend" {
		t.Errorf("expected repo %q, got %q", "github/acme/backend", w.Repo)
	}
	if w.Base != "main" {
		t.Errorf("expected base %q, got %q", "main", w.Base)
	}
	if w.Head != "feat/auth-refactor" {
		t.Errorf("expected head %q, got %q", "feat/auth-refactor", w.Head)
	}
	if len(w.Authors) != 2 || w.Authors[0] != "alice" || w.Authors[1] != "bob" {
		t.Errorf("expected authors [alice bob], got %v", w.Authors)
	}
	if len(w.Steps) != 8 {
		t.Errorf("expected 8 steps, got %d", len(w.Steps))
	}
}

func TestParse_StepTypes(t *testing.T) {
	path := filepath.Join("testdata", "auth-refactor.yaml")
	w, err := Parse(path)
	if err != nil {
		t.Fatalf("Parse(%q) returned error: %v", path, err)
	}

	expectedTypes := []string{
		"text", "source", "diff", "code", "annotation",
		"checkpoint", "reveal", "link",
	}
	for i, want := range expectedTypes {
		if got := w.Steps[i].StepType(); got != want {
			t.Errorf("step[%d] type: expected %q, got %q", i, want, got)
		}
	}
}

func TestParse_SourceStep(t *testing.T) {
	path := filepath.Join("testdata", "auth-refactor.yaml")
	w, err := Parse(path)
	if err != nil {
		t.Fatalf("Parse(%q) returned error: %v", path, err)
	}

	src := w.Steps[1].Source
	if src == nil {
		t.Fatal("step 2 should be a source step")
	}
	if src.File != "src/utils/token.ts" {
		t.Errorf("expected file %q, got %q", "src/utils/token.ts", src.File)
	}
	if src.Lines[0] != 12 || src.Lines[1] != 48 {
		t.Errorf("expected lines [12, 48], got %v", src.Lines)
	}
	if src.Highlight[0] != 30 || src.Highlight[1] != 35 {
		t.Errorf("expected highlight [30, 35], got %v", src.Highlight)
	}
}

func TestParse_Checkpoint(t *testing.T) {
	path := filepath.Join("testdata", "auth-refactor.yaml")
	w, err := Parse(path)
	if err != nil {
		t.Fatalf("Parse(%q) returned error: %v", path, err)
	}

	cp := w.Steps[5].Checkpoint
	if cp == nil {
		t.Fatal("step 6 should be a checkpoint")
	}
	if cp.Prompt != "What happens if the token is expired?" {
		t.Errorf("unexpected prompt: %q", cp.Prompt)
	}
	if len(cp.Choices) != 3 {
		t.Errorf("expected 3 choices, got %d", len(cp.Choices))
	}
	hasCorrect := false
	for _, c := range cp.Choices {
		if c.Correct {
			hasCorrect = true
			if c.Explain == "" {
				t.Error("correct choice must have an explain")
			}
		}
	}
	if !hasCorrect {
		t.Error("checkpoint must have at least one correct choice")
	}
}

func TestParse_MissingRootKey(t *testing.T) {
	_, err := ParseBytes([]byte("title: foo\nsteps: []"), "test.yaml")
	if err == nil {
		t.Error("expected error for missing 'walkthrough:' root key")
	}
}

func TestParse_StepWithNoType(t *testing.T) {
	yaml := `walkthrough:
  title: Test
  steps:
    - id: no-type
      note: "has no type field"
`
	_, err := ParseBytes([]byte(yaml), "test.yaml")
	if err == nil {
		t.Error("expected error for step with no type field")
	}
}

func TestParse_SourceMissingFile(t *testing.T) {
	yaml := `walkthrough:
  title: Test
  steps:
    - type: source
      lines: [1, 10]
`
	_, err := ParseBytes([]byte(yaml), "test.yaml")
	if err == nil {
		t.Error("expected error for source step missing file")
	}
}

func TestParse_LineRangeInvalid(t *testing.T) {
	yaml := `walkthrough:
  title: Test
  steps:
    - type: source
      file: foo.ts
      lines: [10, 5]
`
	_, err := ParseBytes([]byte(yaml), "test.yaml")
	if err == nil {
		t.Error("expected error for invalid line range (end < start)")
	}
}

func TestParse_SectionRecursive(t *testing.T) {
	yaml := `walkthrough:
  title: Test
  steps:
    - type: section
      title: Outer
      id: outer
      steps:
        - type: text
          body: Nested text
        - type: section
          title: Inner
          id: inner
          steps:
            - type: text
              body: Deeply nested
`
	w, err := ParseBytes([]byte(yaml), "test.yaml")
	if err != nil {
		t.Fatalf("ParseBytes returned error: %v", err)
	}
	if len(w.Steps) != 1 {
		t.Fatalf("expected 1 step, got %d", len(w.Steps))
	}
	section := w.Steps[0].Section
	if section == nil {
		t.Fatal("step 0 should be a section")
	}
	if section.Title != "Outer" {
		t.Errorf("expected outer title %q, got %q", "Outer", section.Title)
	}
	if len(section.Steps) != 2 {
		t.Errorf("expected 2 nested steps, got %d", len(section.Steps))
	}
	inner := section.Steps[1].Section
	if inner == nil {
		t.Fatal("step 1 of outer section should be a nested section")
	}
	if inner.Title != "Inner" {
		t.Errorf("expected inner title %q, got %q", "Inner", inner.Title)
	}
	if len(inner.Steps) != 1 {
		t.Errorf("expected 1 deeply nested step, got %d", len(inner.Steps))
	}
}

func TestSerialize_RoundTrip(t *testing.T) {
	path := filepath.Join("testdata", "auth-refactor.yaml")
	orig, err := Parse(path)
	if err != nil {
		t.Fatalf("Parse(%q) returned error: %v", path, err)
	}

	data, err := Serialize(orig)
	if err != nil {
		t.Fatalf("Serialize returned error: %v", err)
	}

	// Write to temp file and re-parse.
	tmp, err := os.CreateTemp("", "roundtrip-*.yaml")
	if err != nil {
		t.Fatalf("CreateTemp: %v", err)
	}
	defer os.Remove(tmp.Name())
	if _, err := tmp.Write(data); err != nil {
		t.Fatalf("Write temp file: %v", err)
	}
	tmp.Close()

	reparsed, err := Parse(tmp.Name())
	if err != nil {
		t.Fatalf("Parse round-trip failed: %v\nYAML:\n%s", err, data)
	}

	if reparsed.Title != orig.Title {
		t.Errorf("round-trip title mismatch: got %q, want %q", reparsed.Title, orig.Title)
	}
	if len(reparsed.Steps) != len(orig.Steps) {
		t.Errorf("round-trip step count mismatch: got %d, want %d", len(reparsed.Steps), len(orig.Steps))
	}
}

func TestListWalkthroughs(t *testing.T) {
	paths, err := ListWalkthroughs("testdata")
	if err != nil {
		t.Fatalf("ListWalkthroughs returned error: %v", err)
	}
	if len(paths) == 0 {
		t.Error("expected at least one walkthrough in testdata")
	}
	for _, p := range paths {
		if filepath.Ext(p) != ".yaml" {
			t.Errorf("ListWalkthroughs returned non-yaml file: %s", p)
		}
	}
}

func TestIDFromPath(t *testing.T) {
	cases := []struct {
		path, want string
	}{
		{"walkthroughs/auth-refactor.yaml", "auth-refactor"},
		{"walkthroughs/nested/deep.yaml", "deep"},
		{"auth-refactor.YAML", "auth-refactor"},
		{"foo.bar.baz.yaml", "foo.bar.baz"},
	}
	for _, c := range cases {
		got := IDFromPath(c.path)
		if got != c.want {
			t.Errorf("IDFromPath(%q): got %q, want %q", c.path, got, c.want)
		}
	}
}
