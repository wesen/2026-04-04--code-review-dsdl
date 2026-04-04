// Package git provides a git-backed repository service for reading file content,
// diffs, and ref information from a local git repository.
package git

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
)

// ErrRefNotFound is returned when a git ref (branch, tag, commit) does not exist.
var ErrRefNotFound = errors.New("git ref not found")

// ErrFileNotFound is returned when a file does not exist at the given ref.
var ErrFileNotFound = errors.New("file not found at ref")

// RefInfo describes a single git reference.
type RefInfo struct {
	Name string // short name, e.g. "main", "v1.0.0"
	Type string // "branch" or "tag"
	Hash string // full SHA-1 hash
}

// RepoService reads file content, diffs, and ref metadata from a git repository.
type RepoService interface {
	// ReadFileLines reads lines [start, end] (1-indexed, inclusive) of file at ref.
	// Returns all lines if start <= 0 or end <= 0.
	ReadFileLines(ctx context.Context, repoPath, ref, path string, start, end int) ([]string, error)
	// GetDiff returns a unified diff of file between fromRef and toRef.
	// If path is empty, returns diffs for all changed files.
	GetDiff(ctx context.Context, repoPath, fromRef, toRef, path string) (string, error)
	// ListRefs returns all local branches and tags.
	ListRefs(ctx context.Context, repoPath string) ([]RefInfo, error)
	// ResolveRef resolves a ref name to its full SHA-1 hash.
	ResolveRef(ctx context.Context, repoPath, refName string) (string, error)
}

// gitRepoService is the production implementation backed by go-git and git subprocesses.
type gitRepoService struct{}

// NewRepoService returns a production RepoService backed by go-git.
func NewRepoService() RepoService {
	return &gitRepoService{}
}

// open resolves repoPath to an absolute path and opens it with go-git.
func open(repoPath string) (*git.Repository, error) {
	abs, err := filepath.Abs(repoPath)
	if err != nil {
		return nil, fmt.Errorf("resolve repo path: %w", err)
	}
	repo, err := git.PlainOpen(abs)
	if err != nil {
		return nil, fmt.Errorf("open repo %s: %w", abs, err)
	}
	return repo, nil
}

func (s *gitRepoService) ResolveRef(ctx context.Context, repoPath, refName string) (string, error) {
	repo, err := open(repoPath)
	if err != nil {
		return "", err
	}

	// Try as a branch first.
	branchRef := plumbing.NewBranchReferenceName(refName)
	hash, err := repo.ResolveRevision(plumbing.Revision(branchRef))
	if err == nil {
		return hash.String(), nil
	}

	// Try as a tag.
	tagRef := plumbing.NewTagReferenceName(refName)
	hash, err = repo.ResolveRevision(plumbing.Revision(tagRef))
	if err == nil {
		return hash.String(), nil
	}

	// Try as a raw revision (commit SHA, HEAD~n, etc.).
	hash, err = repo.ResolveRevision(plumbing.Revision(refName))
	if err == nil {
		return hash.String(), nil
	}

	return "", fmt.Errorf("%w: %q", ErrRefNotFound, refName)
}

func (s *gitRepoService) ReadFileLines(ctx context.Context, repoPath, ref, path string, start, end int) ([]string, error) {
	repo, err := open(repoPath)
	if err != nil {
		return nil, err
	}

	hash, err := s.resolveCommit(repo, ref)
	if err != nil {
		return nil, err
	}

	commit, err := repo.CommitObject(hash)
	if err != nil {
		return nil, fmt.Errorf("commit object: %w", err)
	}
	tree, err := commit.Tree()
	if err != nil {
		return nil, fmt.Errorf("commit tree: %w", err)
	}

	file, err := tree.File(path)
	if err != nil {
		// go-git returns os.ErrNotExist via its own error wrapping.
		return nil, fmt.Errorf("%w: %q at %q", ErrFileNotFound, path, ref)
	}

	reader, err := file.Reader()
	if err != nil {
		return nil, fmt.Errorf("read blob: %w", err)
	}
	defer reader.Close()

	content, err := readAll(reader)
	if err != nil {
		return nil, fmt.Errorf("read content: %w", err)
	}

	lines := splitLines(content)

	// Return all lines if start/end are not specified.
	if start <= 0 || end <= 0 {
		return lines, nil
	}
	if start < 1 {
		start = 1
	}
	if end > len(lines) {
		end = len(lines)
	}
	if start > end {
		return nil, fmt.Errorf("start line %d > end line %d", start, end)
	}

	return lines[start-1 : end], nil
}

func (s *gitRepoService) resolveCommit(repo *git.Repository, ref string) (plumbing.Hash, error) {
	rev := plumbing.Revision(ref)
	hash, err := repo.ResolveRevision(rev)
	if err == nil {
		return *hash, nil
	}

	// Try with branch prefix.
	hash, err = repo.ResolveRevision(plumbing.Revision("refs/heads/" + ref))
	if err == nil {
		return *hash, nil
	}

	// Try with tag prefix.
	hash, err = repo.ResolveRevision(plumbing.Revision("refs/tags/" + ref))
	if err == nil {
		return *hash, nil
	}

	return plumbing.ZeroHash, fmt.Errorf("%w: %q", ErrRefNotFound, ref)
}

// GetDiff returns a unified diff of file between fromRef and toRef.
// If path is empty, returns diffs for all changed files.
// Uses explicit "git diff A B" two-tree form to avoid ambiguity with cmd.Dir.
func (s *gitRepoService) GetDiff(ctx context.Context, repoPath, fromRef, toRef, path string) (string, error) {
	args := []string{"diff", "--no-color"}

	var left, right string
	if fromRef != "" && toRef != "" {
		left, right = fromRef, toRef
	} else if fromRef != "" {
		left, right = fromRef, "HEAD"
	} else if toRef != "" {
		left, right = "HEAD", toRef
	}

	// Use explicit two-tree form "git diff A B" (not "A..B") — when git is
	// invoked with cmd.Dir, the ".." form causes git to misparse the right-hand
	// side as a path in the working tree rather than a ref.
	if left != "" && right != "" {
		args = append(args, left, right)
	}
	if path != "" {
		args = append(args, "--", path)
	}

	cmd := exec.CommandContext(ctx, "git", args...)
	cmd.Dir = repoPath
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		// git diff returns exit 1 when differences exist — not an error.
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) && exitErr.ExitCode() == 1 {
			return stdout.String(), nil
		}
		return "", fmt.Errorf("git diff: %w: %s", err, strings.TrimSpace(stderr.String()))
	}

	return stdout.String(), nil
}

func (s *gitRepoService) ListRefs(ctx context.Context, repoPath string) ([]RefInfo, error) {
	repo, err := open(repoPath)
	if err != nil {
		return nil, err
	}

	var refs []RefInfo

	// Local branches.
	branches, err := repo.Branches()
	if err != nil {
		return nil, fmt.Errorf("list branches: %w", err)
	}
	if err := branches.ForEach(func(ref *plumbing.Reference) error {
		refs = append(refs, RefInfo{
			Name: ref.Name().Short(),
			Type: "branch",
			Hash: ref.Hash().String(),
		})
		return nil
	}); err != nil {
		return nil, err
	}

	// Tags.
	tags, err := repo.Tags()
	if err != nil {
		return nil, fmt.Errorf("list tags: %w", err)
	}
	if err := tags.ForEach(func(ref *plumbing.Reference) error {
		refs = append(refs, RefInfo{
			Name: ref.Name().Short(),
			Type: "tag",
			Hash: ref.Hash().String(),
		})
		return nil
	}); err != nil {
		return nil, err
	}

	// Sort by type then name for stable output.
	sort.Slice(refs, func(i, j int) bool {
		if refs[i].Type != refs[j].Type {
			return refs[i].Type < refs[j].Type
		}
		return refs[i].Name < refs[j].Name
	})

	return refs, nil
}

// readAll is like io.ReadAll but avoids importing io.
func readAll(r io.Reader) ([]byte, error) {
	const bufSize = 4096
	buf := make([]byte, 0, bufSize)
	for {
		p := make([]byte, bufSize)
		n, err := r.Read(p)
		buf = append(buf, p[:n]...)
		if err != nil {
			if err.Error() == "EOF" {
				return buf, nil
			}
			return buf, err
		}
	}
}

// splitLines splits a byte slice into lines, normalising \r, \r\n, and \n to \n.
// Consecutive newlines and a trailing newline produce no empty elements.
func splitLines(b []byte) []string {
	// Normalise line endings to \n.
	s := string(b)
	s = strings.ReplaceAll(s, "\r\n", "\n")
	s = strings.ReplaceAll(s, "\r", "\n")
	if s == "" {
		return nil
	}
	lines := strings.Split(s, "\n")
	// Trim trailing empty string from a trailing newline.
	if n := len(lines); n > 0 && lines[n-1] == "" {
		lines = lines[:n-1]
	}
	// Remove any remaining empty strings from consecutive newlines.
	filtered := lines[:0]
	for _, l := range lines {
		if l != "" {
			filtered = append(filtered, l)
		}
	}
	return filtered
}


