package api

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/crs-cradle/cr-walkthrough/internal/domain/git"
)

// handleFilesRoutes mounts the /api/files routes.
func handleFilesRoutes(r chi.Router, repoPath string, repoSvc git.RepoService) {
	r.Get("/content", handleFileContent(repoPath, repoSvc))
	r.Get("/diff", handleFileDiff(repoPath, repoSvc))
}

// handleFileContent handles GET /api/files/content.
// Query params: ref, path, start, end.
// The ref parameter selects which git ref (branch/commit) to read from.
func handleFileContent(repoPath string, repoSvc git.RepoService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()

		path := query.Get("path")
		ref := query.Get("ref")
		startStr := query.Get("start")
		endStr := query.Get("end")

		if path == "" {
			writeError(w, http.StatusBadRequest, "missing required parameter: path")
			return
		}
		if startStr == "" || endStr == "" {
			writeError(w, http.StatusBadRequest, "missing required parameters: start, end")
			return
		}

		start, err := strconv.Atoi(startStr)
		if err != nil {
			writeError(w, http.StatusBadRequest, "start must be an integer")
			return
		}
		end, err := strconv.Atoi(endStr)
		if err != nil {
			writeError(w, http.StatusBadRequest, "end must be an integer")
			return
		}

		if start < 1 {
			writeError(w, http.StatusBadRequest, "start must be >= 1")
			return
		}
		if end < start {
			writeError(w, http.StatusBadRequest, "end must be >= start")
			return
		}
		if end-start > 500 {
			writeError(w, http.StatusBadRequest, "range too large: max 500 lines per request")
			return
		}

		ctx := r.Context()
		lines, err := repoSvc.ReadFileLines(ctx, repoPath, ref, path, start, end)
		if err != nil {
			if isNotFound(err) {
				writeError(w, http.StatusNotFound, "file not found: %s at %s", path, ref)
			} else if isRefNotFound(err) {
				writeError(w, http.StatusNotFound, "ref not found: %s", ref)
			} else {
				writeError(w, http.StatusInternalServerError, "read file: %v", err)
			}
			return
		}

		// Clamp end to available lines if start is valid but end exceeds file.
		actualEnd := start
		if len(lines) > 0 {
			actualEnd = start + len(lines) - 1
		} else if start > 0 && start > end {
			writeError(w, http.StatusRequestedRangeNotSatisfiable,
				"start line %d exceeds available lines", start)
			return
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"ref":   ref,
			"path":  path,
			"start": actualEnd - len(lines) + 1,
			"end":   actualEnd,
			"lines": lines,
		})
	}
}

// handleFileDiff handles GET /api/files/diff.
// Query params: from, to, path (optional).
func handleFileDiff(repoPath string, repoSvc git.RepoService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()
		fromRef := query.Get("from")
		toRef := query.Get("to")
		path := query.Get("path")

		if fromRef == "" && toRef == "" {
			writeError(w, http.StatusBadRequest, "at least one of from or to is required")
			return
		}

		ctx := r.Context()
		diff, err := repoSvc.GetDiff(ctx, repoPath, fromRef, toRef, path)
		if err != nil {
			if isRefNotFound(err) {
				ref := fromRef
				if ref == "" {
					ref = toRef
				}
				writeError(w, http.StatusNotFound, "ref not found: %s", ref)
			} else {
				writeError(w, http.StatusInternalServerError, "git diff: %v", err)
			}
			return
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"from": fromRef,
			"to":   toRef,
			"path": path,
			"diff": diff,
		})
	}
}

// handleReposRoutes mounts the /api/repos routes.
func handleReposRoutes(r chi.Router, repoPath string, repoSvc git.RepoService) {
	r.Get("/refs", handleListRefs(repoPath, repoSvc))
}

// handleListRefs handles GET /api/repos/refs.
// Returns all local branches and tags for the configured repo.
func handleListRefs(repoPath string, repoSvc git.RepoService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		refs, err := repoSvc.ListRefs(r.Context(), repoPath)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "list refs: %v", err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"refs": refs})
	}
}

// isNotFound reports whether err indicates a file not found error.
func isNotFound(err error) bool {
	return err != nil && (
		err.Error() == git.ErrFileNotFound.Error() ||
		contains(err.Error(), "file not found at ref"))
}

// isRefNotFound reports whether err indicates a ref not found error.
func isRefNotFound(err error) bool {
	return err != nil && (
		contains(err.Error(), git.ErrRefNotFound.Error()) ||
		contains(err.Error(), "git ref not found"))
}

// contains reports whether s contains substr.
func contains(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
