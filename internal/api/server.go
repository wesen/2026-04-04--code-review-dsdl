// Package api provides the HTTP server and route handlers.
package api

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/crs-cradle/cr-walkthrough/internal/domain/git"
	"github.com/crs-cradle/cr-walkthrough/static"
)

// Config holds the server configuration.
type Config struct {
	WalkthroughsDir string        // directory containing .yaml walkthrough files
	RepoPath        string        // root path of the git repository to serve files from
	RepoService     git.RepoService // git service (nil = use default NewRepoService)
	Port            int
}

// Server is the HTTP server.
type Server struct {
	httpServer *http.Server
}

// NewServer creates and configures the Chi router.
func NewServer(cfg Config) *Server {
	r := chi.NewRouter()

	// Resolve or default the repo service.
	repoSvc := cfg.RepoService
	if repoSvc == nil {
		repoSvc = git.NewCachedRepoService(git.NewRepoService(), 5*time.Minute)
	}

	// Global middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Compress(5))
	r.Use(corsMiddleware())

	// Health check
	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	// API routes
	r.Route("/api/walkthroughs", func(r chi.Router) {
		handleWalkthroughsRoutes(r, cfg.WalkthroughsDir)
	})
	r.Route("/api/files", func(r chi.Router) {
		handleFilesRoutes(r, cfg.RepoPath, repoSvc)
	})
	r.Route("/api/repos", func(r chi.Router) {
		handleReposRoutes(r, cfg.RepoPath, repoSvc)
	})

	// SPA fallback: serve the embedded React app for any non-API route so
	// React Router can handle client-side routing.
	r.NotFound(spaFallbackHandler)

	return &Server{
		httpServer: &http.Server{
			Addr:         fmt.Sprintf(":%d", cfg.Port),
			Handler:      r,
			ReadTimeout:  15 * time.Second,
			WriteTimeout: 30 * time.Second,
			IdleTimeout:  120 * time.Second,
		},
	}
}

// Listen starts the server and blocks until ctx is cancelled.
func (s *Server) Listen(ctx context.Context) error {
	errCh := make(chan error, 1)
	go func() {
		log.Printf("server: listening on %s", s.httpServer.Addr)
		if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- fmt.Errorf("ListenAndServe: %w", err)
		}
		close(errCh)
	}()

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		return s.httpServer.Shutdown(shutdownCtx)
	}
}

// ListenAndRun starts the server and runs until SIGINT or SIGTERM.
func ListenAndRun(cfg Config) error {
	srv := NewServer(cfg)

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	errCh := make(chan error, 1)
	go func() {
		errCh <- srv.Listen(ctx)
	}()

	select {
	case err := <-errCh:
		return err
	case sig := <-sigCh:
		log.Printf("server: received %s, shutting down", sig)
		cancel()
		<-errCh
		return nil
	}
}

// ── Middleware ──────────────────────────────────────────────────────

func corsMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// ── Response helpers ─────────────────────────────────────────────────

// writeJSON writes a JSON response.
func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.WriteHeader(status)
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("writeJSON: encode error: %v", err)
	}
}

// writeError writes a JSON error response.
func writeError(w http.ResponseWriter, status int, format string, args ...interface{}) {
	writeJSON(w, status, map[string]string{"error": fmt.Sprintf(format, args...)})
}

// ── SPA fallback ─────────────────────────────────────────────────────

// spaFallbackHandler serves the embedded React SPA for any non-API route.
// It first tries to serve the exact file; if missing it falls back to index.html
// so React Router can handle client-side routing.
//
// The embed.FS has a top-level "dist/" directory. We use fs.Sub to strip that
// prefix so http.FileServer can serve files by URL path without knowing
// about the dist/ prefix.
var distFS, _ = fs.Sub(static.Dist, "dist")
var distHTTPFS = http.FS(distFS)
var distFileServer = http.FileServer(distHTTPFS)

func spaFallbackHandler(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	// For non-root paths, try to serve the exact asset first.
	if path != "/" {
		// Open via the sub-FS (no "dist/" prefix needed — fs.Sub stripped it).
		f, err := distHTTPFS.Open(path[1:]) // strip leading "/"
		if err == nil {
			f.Close()
			distFileServer.ServeHTTP(w, r)
			return
		}
	}

	// Fall back to /index.html for the SPA route.
	f, err := distHTTPFS.Open("index.html")
	if err != nil {
		writeError(w, http.StatusInternalServerError, "SPA index.html not embedded (run 'make build' first)")
		return
	}
	defer f.Close()
	data, err := io.ReadAll(f)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to read index.html")
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}
