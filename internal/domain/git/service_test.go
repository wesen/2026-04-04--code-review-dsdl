package git

import (
	"bytes"
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	gitpkg "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
)

// setupTestRepo creates a real git repo in a temp dir using git subprocesses.
// All git commands use -C tmp so they work regardless of cwd.
func setupTestRepo(t *testing.T) string {
	t.Helper()
	tmp, err := os.MkdirTemp("", "cr-git-test-*")
	if err != nil {
		t.Fatalf("MkdirTemp: %v", err)
	}
	t.Cleanup(func() { os.RemoveAll(tmp) })

	runGit := func(args ...string) error {
		cmd := exec.Command("git", append([]string{"-C", tmp}, args...)...)
		return cmd.Run()
	}

	// git init + user config.
	if err := runGit("init", "--quiet"); err != nil {
		t.Fatalf("git init: %v", err)
	}
	for _, cfg := range []struct{ k, v string }{
		{"user.email", "test@example.com"},
		{"user.name", "Test User"},
	} {
		if err := runGit("config", cfg.k, cfg.v); err != nil {
			t.Fatalf("git config %s: %v", cfg.k, err)
		}
	}

	// Write file and initial commit on main.
	f1 := filepath.Join(tmp, "file.txt")
	if err := os.WriteFile(f1, []byte("line1\nline2\nline3\n"), 0644); err != nil {
		t.Fatalf("write file: %v", err)
	}
	if err := runGit("add", "."); err != nil {
		t.Fatalf("git add: %v", err)
	}
	if err := runGit("commit", "-m", "initial"); err != nil {
		t.Fatalf("git commit: %v", err)
	}

	// Switch to feat/test branch and add a file.
	if err := runGit("checkout", "-b", "feat/test"); err != nil {
		t.Fatalf("git checkout -b feat/test: %v", err)
	}
	if err := os.WriteFile(filepath.Join(tmp, "newfile.txt"), []byte("added on feat\n"), 0644); err != nil {
		t.Fatalf("write newfile.txt: %v", err)
	}
	if err := runGit("add", "."); err != nil {
		t.Fatalf("git add: %v", err)
	}
	if err := runGit("commit", "-m", "feat: add newfile"); err != nil {
		t.Fatalf("git commit feat: %v", err)
	}

	// Tag main.
	if err := runGit("tag", "v1.0.0", "main"); err != nil {
		t.Fatalf("git tag: %v", err)
	}

	// Back to main for a clean HEAD.
	runGit("checkout", "main")

	// Verify branches exist via go-git.
	r, err := gitpkg.PlainOpen(tmp)
	if err != nil {
		t.Fatalf("PlainOpen: %v", err)
	}
	featHead, err := r.ResolveRevision(plumbing.Revision("feat/test"))
	if err != nil {
		t.Fatalf("ResolveRevision feat/test: %v", err)
	}
	featCommit, err := r.CommitObject(*featHead)
	if err != nil {
		t.Fatalf("CommitObject feat/test: %v", err)
	}
	featTree, _ := featCommit.Tree()
	if _, err := featTree.File("newfile.txt"); err != nil {
		t.Fatalf("feat/test should have newfile.txt: %v", err)
	}
	mainHead, _ := r.ResolveRevision(plumbing.Revision("main"))
	mainCommit, _ := r.CommitObject(*mainHead)
	mainTree, _ := mainCommit.Tree()
	if _, err := mainTree.File("newfile.txt"); err == nil {
		t.Fatal("main should NOT have newfile.txt")
	}
	t.Logf("repo at %s: main=%s feat/test=%s", tmp, mainHead.String(), featHead.String())
	_ = r
	return tmp
}

func contains(haystack, needle string) bool {
	return len(haystack) >= len(needle) &&
		bytes.Contains([]byte(haystack), []byte(needle))
}

func TestResolveRef(t *testing.T) {
	repo := setupTestRepo(t)
	svc := NewRepoService()
	ctx := context.Background()

	cases := []struct {
		name    string
		ref     string
		wantErr bool
	}{
		{"main branch", "main", false},
		{"feat branch", "feat/test", false},
		{"HEAD", "HEAD", false},
		{"HEAD~0", "HEAD~0", false},
		{"by tag", "v1.0.0", false},
		{"nonexistent ref", "nonexistent-xyz", true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			hash, err := svc.ResolveRef(ctx, repo, tc.ref)
			if tc.wantErr {
				if err == nil {
					t.Errorf("expected error for %q, got hash %s", tc.ref, hash)
				}
				return
			}
			if err != nil {
				t.Errorf("ResolveRef(%q): %v", tc.ref, err)
				return
			}
			if len(hash) != 40 {
				t.Errorf("expected 40-char SHA, got %q", hash)
			}
		})
	}
}

func TestReadFileLines(t *testing.T) {
	repo := setupTestRepo(t)
	svc := NewRepoService()
	ctx := context.Background()

	t.Run("read full file", func(t *testing.T) {
		lines, err := svc.ReadFileLines(ctx, repo, "main", "file.txt", 0, 0)
		if err != nil {
			t.Fatalf("ReadFileLines: %v", err)
		}
		if len(lines) != 3 {
			t.Errorf("expected 3 lines, got %d: %v", len(lines), lines)
		}
	})

	t.Run("read line range", func(t *testing.T) {
		lines, err := svc.ReadFileLines(ctx, repo, "main", "file.txt", 1, 2)
		if err != nil {
			t.Fatalf("ReadFileLines: %v", err)
		}
		if len(lines) != 2 || lines[0] != "line1" || lines[1] != "line2" {
			t.Errorf("unexpected content: %v", lines)
		}
	})

	t.Run("file not found", func(t *testing.T) {
		_, err := svc.ReadFileLines(ctx, repo, "main", "nonexistent.ts", 1, 10)
		if err == nil {
			t.Error("expected error for nonexistent file")
		}
	})

	t.Run("ref not found", func(t *testing.T) {
		_, err := svc.ReadFileLines(ctx, repo, "nonexistent", "file.txt", 1, 5)
		if err == nil {
			t.Error("expected error for nonexistent ref")
		}
	})

	t.Run("read from feat branch", func(t *testing.T) {
		lines, err := svc.ReadFileLines(ctx, repo, "feat/test", "newfile.txt", 1, 10)
		if err != nil {
			t.Fatalf("ReadFileLines feat/test: %v", err)
		}
		if len(lines) == 0 {
			t.Error("expected non-empty lines")
		}
	})

	t.Run("range start exceeds file", func(t *testing.T) {
		_, err := svc.ReadFileLines(ctx, repo, "main", "file.txt", 10, 20)
		if err == nil {
			t.Error("expected error for start > end")
		}
	})
}

func TestGetDiff(t *testing.T) {
	repo := setupTestRepo(t)
	svc := NewRepoService()
	ctx := context.Background()

	t.Run("diff between branches", func(t *testing.T) {
		out, err := svc.GetDiff(ctx, repo, "main", "feat/test", "")
		if err != nil {
			t.Fatalf("GetDiff: %v", err)
		}
		if !contains(out, "newfile.txt") {
			t.Errorf("expected diff to mention newfile.txt: %q", out)
		}
	})

	t.Run("diff specific file", func(t *testing.T) {
		out, err := svc.GetDiff(ctx, repo, "main", "feat/test", "newfile.txt")
		if err != nil {
			t.Fatalf("GetDiff: %v", err)
		}
		if !contains(out, "newfile.txt") {
			t.Errorf("expected diff for newfile.txt: %q", out)
		}
	})

	t.Run("diff nonexistent from ref", func(t *testing.T) {
		_, err := svc.GetDiff(ctx, repo, "nonexistent", "main", "")
		if err == nil {
			t.Error("expected error for nonexistent fromRef")
		}
	})

	t.Run("diff nonexistent to ref", func(t *testing.T) {
		_, err := svc.GetDiff(ctx, repo, "main", "nonexistent", "")
		if err == nil {
			t.Error("expected error for nonexistent toRef")
		}
	})
}

func TestListRefs(t *testing.T) {
	repo := setupTestRepo(t)
	svc := NewRepoService()
	ctx := context.Background()

	refs, err := svc.ListRefs(ctx, repo)
	if err != nil {
		t.Fatalf("ListRefs: %v", err)
	}

	branchCount, tagCount := 0, 0
	for _, r := range refs {
		if r.Name == "" || r.Hash == "" {
			t.Errorf("ref %+v has empty name or hash", r)
		}
		if r.Type == "branch" {
			branchCount++
		}
		if r.Type == "tag" {
			tagCount++
		}
	}
	if branchCount < 2 {
		t.Errorf("expected at least 2 branches (main + feat/test), got %d", branchCount)
	}
	if tagCount < 1 {
		t.Errorf("expected at least 1 tag, got %d", tagCount)
	}
}

func TestReadFileLines_NonexistentRepo(t *testing.T) {
	svc := NewRepoService()
	ctx := context.Background()
	_, err := svc.ReadFileLines(ctx, "/this/path/does/not/exist", "main", "file.ts", 1, 10)
	if err == nil {
		t.Error("expected error for nonexistent repo")
	}
}

func TestSplitLines(t *testing.T) {
	cases := []struct {
		input string
		want  []string
	}{
		{"hello\nworld\n", []string{"hello", "world"}},
		{"hello\r\nworld\r\n", []string{"hello", "world"}},
		{"hello\rworld\r", []string{"hello", "world"}},
		{"no newline", []string{"no newline"}},
		{"", nil},
		{"line1\nline2\nline3", []string{"line1", "line2", "line3"}},
		{"\n", nil},
		{"\n\n\n", nil},
		{"a\nb", []string{"a", "b"}},
		{"\n\nline\n", []string{"line"}},
	}
	for _, tc := range cases {
		got := splitLines([]byte(tc.input))
		if len(got) != len(tc.want) {
			t.Errorf("splitLines(%q): got %v (%d items), want %v (%d items)",
				tc.input, got, len(got), tc.want, len(tc.want))
			continue
		}
		for i := range got {
			if got[i] != tc.want[i] {
				t.Errorf("splitLines(%q)[%d]: got %q, want %q", tc.input, i, got[i], tc.want[i])
			}
		}
	}
}

// Verify RepoService interface is satisfied at compile time.
var _ RepoService = (*gitRepoService)(nil)
