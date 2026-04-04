package api

import (
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/go-chi/chi/v5"
)

// handleFilesRoutes mounts the /api/files routes.
func handleFilesRoutes(r chi.Router, repoPath string) {
	r.Get("/content", handleFileContent(repoPath))
}

// handleFileContent handles GET /api/files/content?ref=&path=&start=&end=.
// For Phase 1, this reads directly from the local repo path (no git integration yet).
// The ref parameter is accepted but ignored until Phase 2 git integration.
func handleFileContent(repoPath string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()

		// Required params
		ref := query.Get("ref")   // git ref — accepted, used in Phase 2
		path := query.Get("path") // repo-relative path, e.g. "src/utils/token.ts"
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

		// Read the file.
		// TODO: In Phase 2, replace this with git-based reading using go-git so that
		// we can respect the ref parameter (read file at specific branch/commit).
		absPath := filepath.Join(repoPath, path)
		data, err := os.ReadFile(absPath)
		if err != nil {
			if os.IsNotExist(err) {
				writeError(w, http.StatusNotFound, "file not found: %s", path)
			} else {
				writeError(w, http.StatusInternalServerError, "read file: %v", err)
			}
			return
		}

		// Split into lines.
		lines := splitLines(string(data))
		if start > len(lines) {
			writeError(w, http.StatusRequestedRangeNotSatisfiable,
				"start line %d exceeds file length %d", start, len(lines))
			return
		}
		if end > len(lines) {
			end = len(lines)
		}

		// Convert to 0-indexed, slice.
		slice := lines[start-1 : end]
		result := make([]string, len(slice))
		copy(result, slice)

		_ = ref // accepted but unused in Phase 1

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"ref":   ref,
			"path":  path,
			"start": start,
			"end":   end,
			"lines": result,
		})
	}
}

// splitLines splits a string into lines, removing trailing \n and \r.
func splitLines(s string) []string {
	var lines []string
	for i := 0; i < len(s); {
		eol := i
		for eol < len(s) && s[eol] != '\n' && s[eol] != '\r' {
			eol++
		}
		line := s[i:eol]
		if eol < len(s) && s[eol] == '\r' && eol+1 < len(s) && s[eol+1] == '\n' {
			line = line[:len(line)-1] // remove trailing \r
		}
		lines = append(lines, line)
		i = eol + 1
		if eol < len(s) && s[eol] == '\r' {
			i++ // skip lone \r
		}
	}
	return lines
}
