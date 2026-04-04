package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/crs-cradle/cr-walkthrough/internal/domain/git"
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
	// Use sample-repo which has a git history and the auth.ts file.
	repoPath := filepath.Join("..", "..", "sample-repo")
	repoSvc := git.NewCachedRepoService(git.NewRepoService(), 5*time.Minute)

	r := chi.NewRouter()
	r.Route("/api/files", func(api chi.Router) {
		handleFilesRoutes(api, repoPath, repoSvc)
	})

	// Valid file range.
	req := httptest.NewRequest(http.MethodGet,
		"/api/files/content?ref=main&path=src/middleware/auth.ts&start=1&end=5", nil)
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
	if len(resp.Lines) == 0 {
		t.Error("expected non-empty lines")
	}

	// Missing path
	req2 := httptest.NewRequest(http.MethodGet, "/api/files/content?start=1&end=10", nil)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing path, got %d", w2.Code)
	}

	// File not found
	req3 := httptest.NewRequest(http.MethodGet,
		"/api/files/content?ref=main&path=nonexistent.ts&start=1&end=10", nil)
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	if w3.Code != http.StatusNotFound {
		t.Errorf("expected 404 for nonexistent file, got %d", w3.Code)
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
