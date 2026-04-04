package api

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"

	"github.com/crs-cradle/cr-walkthrough/internal/domain"
	"github.com/crs-cradle/cr-walkthrough/internal/domain/yaml"
)

// handleWalkthroughsRoutes mounts the walkthroughs routes on a chi.Router.
func handleWalkthroughsRoutes(r chi.Router, walkthroughsDir string) {
	r.Get("/", handleListWalkthroughs(walkthroughsDir))
	r.Get("/{id}", handleGetWalkthrough(walkthroughsDir))
}

// handleListWalkthroughs handles GET /api/walkthroughs.
func handleListWalkthroughs(walkthroughsDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		paths, err := listWalkthroughPaths(walkthroughsDir)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to list walkthroughs: %v", err)
			return
		}

		type Summary struct {
			ID        string   `json:"id"`
			Path      string   `json:"path"`
			Title     string   `json:"title"`
			Repo      string   `json:"repo"`
			Base      string   `json:"base"`
			Head      string   `json:"head"`
			Authors   []string `json:"authors"`
			StepCount int      `json:"stepCount"`
		}
		summaries := make([]Summary, 0, len(paths))
		for _, path := range paths {
			wt, err := yaml.Parse(path)
			if err != nil {
				continue // skip unparseable walkthroughs
			}
			summaries = append(summaries, Summary{
				ID:        yaml.IDFromPath(path),
				Path:      path,
				Title:     wt.Title,
				Repo:      wt.Repo,
				Base:      wt.Base,
				Head:      wt.Head,
				Authors:   wt.Authors,
				StepCount: countSteps(wt.Steps),
			})
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"walkthroughs": summaries})
	}
}

// handleGetWalkthrough handles GET /api/walkthroughs/:id.
func handleGetWalkthrough(walkthroughsDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		if id == "" {
			writeError(w, http.StatusBadRequest, "missing walkthrough id")
			return
		}

		path, err := findWalkthroughByID(walkthroughsDir, id)
		if err != nil {
			writeError(w, http.StatusNotFound, "walkthrough %q not found", id)
			return
		}

		wt, err := yaml.Parse(path)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to parse walkthrough %q: %v", id, err)
			return
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"id":      id,
			"title":   wt.Title,
			"repo":    wt.Repo,
			"base":    wt.Base,
			"head":    wt.Head,
			"authors": wt.Authors,
			"steps":   serializeSteps(wt.Steps),
		})
	}
}

// listWalkthroughPaths returns all .yaml file paths under dir.
func listWalkthroughPaths(dir string) ([]string, error) {
	var paths []string
	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && filepath.Ext(path) == ".yaml" {
			paths = append(paths, path)
		}
		return nil
	})
	return paths, err
}

// findWalkthroughByID looks for a walkthrough file with the given id.
func findWalkthroughByID(dir, id string) (string, error) {
	// Try exact path: dir/id.yaml
	candidate := filepath.Join(dir, id+".yaml")
	if _, err := os.Stat(candidate); err == nil {
		return candidate, nil
	}
	// Search all yaml files.
	paths, err := listWalkthroughPaths(dir)
	if err != nil {
		return "", err
	}
	for _, p := range paths {
		if yaml.IDFromPath(p) == id {
			return p, nil
		}
	}
	return "", fmt.Errorf("walkthrough %q not found", id)
}

// countSteps recursively counts steps including nested section steps.
func countSteps(steps []domain.Step) int {
	n := len(steps)
	for _, s := range steps {
		if s.Section != nil {
			n += countSteps(s.Section.Steps)
		}
	}
	return n
}

// serializeSteps converts domain steps to JSON-compatible representation.
func serializeSteps(steps []domain.Step) []map[string]interface{} {
	out := make([]map[string]interface{}, len(steps))
	for i, s := range steps {
		out[i] = serializeStep(s)
	}
	return out
}

func serializeStep(s domain.Step) map[string]interface{} {
	m := map[string]interface{}{}
	if s.ID != "" {
		m["id"] = s.ID
	}
	if s.Note != "" {
		m["note"] = s.Note
	}

	switch {
	case s.Text != nil:
		m["type"] = "text"
		m["body"] = s.Text.Body

	case s.Source != nil:
		m["type"] = "source"
		m["file"] = s.Source.File
		m["lines"] = [2]int{s.Source.Lines[0], s.Source.Lines[1]}
		if s.Source.Highlight[0] != 0 || s.Source.Highlight[1] != 0 {
			m["highlight"] = [2]int{s.Source.Highlight[0], s.Source.Highlight[1]}
		}
		if s.Source.Ref != "" {
			m["ref"] = s.Source.Ref
		}

	case s.Diff != nil:
		m["type"] = "diff"
		m["file"] = s.Diff.File
		if len(s.Diff.Hunks) > 0 {
			m["hunks"] = s.Diff.Hunks
		}
		m["collapse"] = s.Diff.Collapse
		if s.Diff.Ref != "" {
			m["ref"] = s.Diff.Ref
		}

	case s.Code != nil:
		m["type"] = "code"
		m["lang"] = s.Code.Lang
		m["body"] = s.Code.Body

	case s.Compare != nil:
		m["type"] = "compare"
		m["left"] = map[string]interface{}{
			"file":  s.Compare.Left.File,
			"ref":   s.Compare.Left.Ref,
			"lines": [2]int{s.Compare.Left.Lines[0], s.Compare.Left.Lines[1]},
		}
		m["right"] = map[string]interface{}{
			"file":  s.Compare.Right.File,
			"ref":   s.Compare.Right.Ref,
			"lines": [2]int{s.Compare.Right.Lines[0], s.Compare.Right.Lines[1]},
		}

	case s.Link != nil:
		m["type"] = "link"
		m["url"] = s.Link.URL
		if s.Link.Label != "" {
			m["label"] = s.Link.Label
		}

	case s.Annotation != nil:
		m["type"] = "annotation"
		m["file"] = s.Annotation.File
		m["line"] = s.Annotation.Line
		m["severity"] = s.Annotation.Severity
		m["body"] = s.Annotation.Body
		if s.Annotation.Ref != "" {
			m["ref"] = s.Annotation.Ref
		}

	case s.Checkpoint != nil:
		m["type"] = "checkpoint"
		m["prompt"] = s.Checkpoint.Prompt
		choices := make([]map[string]interface{}, len(s.Checkpoint.Choices))
		for i, c := range s.Checkpoint.Choices {
			choices[i] = map[string]interface{}{
				"text":    c.Text,
				"correct": c.Correct,
				"explain": c.Explain,
			}
		}
		m["choices"] = choices

	case s.Reveal != nil:
		m["type"] = "reveal"
		m["label"] = s.Reveal.Label
		m["body"] = s.Reveal.Body

	case s.Shell != nil:
		m["type"] = "shell"
		m["cmd"] = s.Shell.Cmd
		if s.Shell.Output != "" {
			m["output"] = s.Shell.Output
		}
		if s.Shell.ExpectExit != 0 {
			m["expect_exit"] = s.Shell.ExpectExit
		}
		if s.Shell.Note != "" {
			m["note"] = s.Shell.Note
		}

	case s.Section != nil:
		m["type"] = "section"
		m["title"] = s.Section.Title
		if s.Section.ID != "" {
			m["id"] = s.Section.ID
		}
		m["steps"] = serializeSteps(s.Section.Steps)

	case s.Branch != nil:
		m["type"] = "branch"
		m["prompt"] = s.Branch.Prompt
		options := make([]map[string]interface{}, len(s.Branch.Options))
		for i, o := range s.Branch.Options {
			options[i] = map[string]interface{}{"label": o.Label, "goto": o.Goto}
		}
		m["options"] = options
	}

	return m
}
