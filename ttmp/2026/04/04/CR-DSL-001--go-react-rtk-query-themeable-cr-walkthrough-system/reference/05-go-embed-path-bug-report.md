# Bug Report: go:embed + `cp -r` creates nested directory

**Date:** 2026-04-05  
**Author:** AI (Manuel's coding agent)  
**Status:** Needs fix — embedded files not served

---

## Summary

The `make build` target (`build-frontend` → `copy-static`) copies `frontend/dist/` into `static/dist/`.  
This creates the path `static/dist/dist/index.html` inside the Go binary instead of `static/dist/index.html`.  
As a result, `static.Dist.Open("dist/index.html")` always returns `file does not exist` and the SPA returns 404 for all non-API routes.

---

## What was built

### static/embed.go

```go
package static

import "embed"

//go:embed dist
var Dist embed.FS
```

### Makefile

```make
build: build-frontend copy-static
	CGO_ENABLED=0 go build $(GO_LDFLAGS) -o $(BIN) ./cmd/cr-server

build-frontend:
	cd frontend && npm install && npm run build

copy-static:
	cp -r frontend/dist static/
```

### server.go (spaFallbackHandler)

```go
func spaFallbackHandler(w http.ResponseWriter, r *http.Request) {
    path := r.URL.Path

    // For non-root paths, try to serve the exact asset first.
    if path != "/" {
        f, err := static.Dist.Open("dist" + path)
        if err == nil {
            f.Close()
            http.FileServer(http.FS(static.Dist)).ServeHTTP(w, r)
            return
        }
    }

    // Fall back to /index.html for the SPA route.
    f, err := static.Dist.Open("dist/index.html")
    if err != nil {
        writeError(w, http.StatusInternalServerError, "SPA index.html not embedded (run 'make build' first)")
        return
    }
    ...
}
```

---

## What actually happens

```
static/
├── embed.go          # //go:embed dist
└── dist/             # created by make copy-static
    └── dist/          # ← NESTED because cp -r frontend/dist → static/dist/
        ├── index.html
        ├── favicon.svg
        ├── icons.svg
        ├── mockServiceWorker.js
        └── assets/
            ├── index-Bi1s6eQQ.js
            └── index-BKzlamRw.css
```

When `go build` runs, the embed reads `static/dist/` (as `dist` relative to `static/embed.go`), but the actual content is in `static/dist/dist/`. So inside the binary, the embedded path looks like `dist/dist/index.html`, not `dist/index.html`.

The Go compiler silently embeds whatever is in the directory — no error. But `static.Dist.Open("dist/index.html")` returns `file does not exist`.

---

## How to reproduce

```bash
make build
./bin/cr-server -repo ./sample-repo -walkthroughs ./sample-repo/walkthroughs -port 8087
# → GET / → 404
# → GET /api/health → 200 OK (API works)
```

---

## What's already confirmed working

- Go API server starts, listens on the port ✅
- `/api/health` returns `{"status":"ok"}` ✅
- TypeScript compiles clean (`cd frontend && npx tsc --noEmit`) ✅
- Vite dev build works ✅
- Storybook builds (`npm run build-storybook`) ✅
- SPA index.html exists at `frontend/dist/index.html` ✅

---

## Likely fix options

### Option A — Change the copy command (simplest)

```makefile
copy-static:
	cp -r frontend/dist static/dist
```

Then the embedded path becomes `static/dist/` → `dist/` inside the embed, matching the `//go:embed dist` directive.

### Option B — Change the embed directive to match the nested structure

```go
//go:embed dist/dist
var Dist embed.FS
```

Then update `server.go` paths to `dist/dist/index.html`, etc.  
Downside: ugly path names inside the embed.

### Option C — Remove the placeholder README.txt

The placeholder `static/dist/README.txt` gets copied into the embed too. Not a bug per se, but unnecessary.

---

## Recommendation

**Option A** — just fix the `cp -r` destination. The current command:

```makefile
copy-static:
	cp -r frontend/dist static/
```

should be:

```makefile
copy-static:
	cp -r frontend/dist static/dist
```

Then `server.go` stays as `static.Dist.Open("dist/index.html")` and everything lines up.

---

## Files involved

- `Makefile` — `copy-static` target
- `static/embed.go` — `//go:embed dist`
- `internal/api/server.go` — `spaFallbackHandler`
- `static/dist/` — build output directory (created by `make copy-static`)
