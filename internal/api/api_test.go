package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/go-chi/chi/v5"
)

func TestHealth(t *testing.T) {
	r := chi.NewRouter()
	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}
	var resp map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp["status"] != "ok" {
		t.Errorf("expected status ok, got %q", resp["status"])
	}
}

func TestHandleListWalkthroughs(t *testing.T) {
	// Use the testdata fixture directory as the walkthroughs dir.
	walkthroughsDir := filepath.Join("..", "domain", "yaml", "testdata")
	// Routes are mounted at /api/walkthroughs in the server.
	r := chi.NewRouter()
	r.Route("/api/walkthroughs", func(api chi.Router) {
		handleWalkthroughsRoutes(api, walkthroughsDir)
	})

	req := httptest.NewRequest(http.MethodGet, "/api/walkthroughs", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp struct {
		Walkthroughs []struct {
			ID        string `json:"id"`
			Path      string `json:"path"`
			Title     string `json:"title"`
			Repo      string `json:"repo"`
			StepCount int    `json:"stepCount"`
		} `json:"walkthroughs"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if len(resp.Walkthroughs) == 0 {
		t.Fatal("expected at least one walkthrough")
	}
	wt := resp.Walkthroughs[0]
	if wt.Title == "" {
		t.Error("expected non-empty title")
	}
	if wt.StepCount == 0 {
		t.Error("expected non-zero step count")
	}
}

func TestHandleGetWalkthrough(t *testing.T) {
	walkthroughsDir := filepath.Join("..", "domain", "yaml", "testdata")
	r := chi.NewRouter()
	r.Route("/api/walkthroughs", func(api chi.Router) {
		handleWalkthroughsRoutes(api, walkthroughsDir)
	})

	// Valid id
	req := httptest.NewRequest(http.MethodGet, "/api/walkthroughs/auth-refactor", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp struct {
		ID      string `json:"id"`
		Title   string `json:"title"`
		Authors []string `json:"authors"`
		Steps   []interface{} `json:"steps"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.ID != "auth-refactor" {
		t.Errorf("expected id auth-refactor, got %q", resp.ID)
	}
	if len(resp.Steps) == 0 {
		t.Error("expected steps")
	}

	// Invalid id
	req2 := httptest.NewRequest(http.MethodGet, "/api/walkthroughs/nonexistent", nil)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusNotFound {
		t.Errorf("expected status 404 for nonexistent, got %d", w2.Code)
	}
}

func TestHandleFileContent(t *testing.T) {
	// Create a temp file to serve.
	tmpDir := t.TempDir()
	tmpFile := filepath.Join(tmpDir, "src", "token.ts")
	if err := os.MkdirAll(filepath.Dir(tmpFile), 0755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}
	content := "export function verify() {}\nexport function decode() {}"
	if err := os.WriteFile(tmpFile, []byte(content), 0644); err != nil {
		t.Fatalf("write file: %v", err)
	}

	r := chi.NewRouter()
	r.Route("/api/files", func(api chi.Router) {
		handleFilesRoutes(api, tmpDir)
	})

	// Valid file range
	req := httptest.NewRequest(http.MethodGet, "/api/files/content?ref=HEAD&path=src/token.ts&start=1&end=2", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp struct {
		Path  string   `json:"path"`
		Start int      `json:"start"`
		End   int      `json:"end"`
		Lines []string `json:"lines"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if len(resp.Lines) != 2 {
		t.Errorf("expected 2 lines, got %d", len(resp.Lines))
	}

	// Missing path
	req2 := httptest.NewRequest(http.MethodGet, "/api/files/content?start=1&end=10", nil)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing path, got %d", w2.Code)
	}

	// File not found
	req3 := httptest.NewRequest(http.MethodGet, "/api/files/content?path=nonexistent.ts&start=1&end=10", nil)
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	if w3.Code != http.StatusNotFound {
		t.Errorf("expected 404 for nonexistent file, got %d", w3.Code)
	}

	// Range out of bounds
	req4 := httptest.NewRequest(http.MethodGet, "/api/files/content?path=src/token.ts&start=1&end=100", nil)
	w4 := httptest.NewRecorder()
	r.ServeHTTP(w4, req4)
	// Should succeed with partial content (end capped to file length)
	if w4.Code != http.StatusOK {
		t.Errorf("expected 200 for over-range end, got %d: %s", w4.Code, w4.Body.String())
	}
}

func TestWriteError(t *testing.T) {
	w := httptest.NewRecorder()
	writeError(w, http.StatusNotFound, "not found: %s", "foo")
	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["error"] != "not found: foo" {
		t.Errorf("unexpected error message: %q", resp["error"])
	}
}
