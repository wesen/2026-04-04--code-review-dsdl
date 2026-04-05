.PHONY: build test lint clean run dev

# Binary name and output directory
BIN := bin/cr-server
GO_LDFLAGS := -ldflags="-s -w"

# ── Build ──────────────────────────────────────────────────────────────────

build: build-frontend copy-static
	CGO_ENABLED=0 go build $(GO_LDFLAGS) -o $(BIN) ./cmd/cr-server

# Build the React SPA output → frontend/dist/
build-frontend:
	cd frontend && npm install && npm run build

# Copy frontend/dist into the Go static package so //go:embed can find it.
# The static/ directory is at the module root; embed paths are relative to it.
# rm -rf first to prevent cp -r creating a nested static/dist/dist/ when
# static/dist/ already exists (e.g. from a previous build or git checkout).
copy-static:
	rm -rf static/dist
	cp -r frontend/dist static/

# Just the Go binary (requires copy-static to have been run)
build-go:
	CGO_ENABLED=0 go build $(GO_LDFLAGS) -o $(BIN) ./cmd/cr-server

# ── Development ──────────────────────────────────────────────────────────────

# Start the Go API server only. Run 'npm run dev' separately to start the
# Vite dev server which serves the SPA and proxies /api to this server.
# Example:
#   terminal 1: make dev-api
#   terminal 2: cd frontend && npm run dev
REPO ?= ./sample-repo
WT   ?= ./sample-repo/walkthroughs
PORT ?= 8080

dev-api:
	go run ./cmd/cr-server -repo $(REPO) -walkthroughs $(WT) -port $(PORT)

dev:
	cd frontend && npm install && npm run dev

run: build
	./$(BIN) -repo $(REPO) -walkthroughs $(WT) -port $(PORT)

# ── Testing ─────────────────────────────────────────────────────────────────

test:
	go test ./... -count=1

test-verbose:
	go test ./... -v -count=1

test-race:
	go test ./... -race -count=1

# ── Quality ─────────────────────────────────────────────────────────────────

lint:
	golangci-lint run ./...

fmt:
	gofmt -w ./cmd ./internal ./static

tidy:
	go mod tidy

# ── Clean ─────────────────────────────────────────────────────────────────────

clean:
	rm -rf bin/
	cd frontend && rm -rf dist/
	rm -rf static/dist

# ── Sample data ─────────────────────────────────────────────────────────────

# Copy the auth-refactor walkthrough to the sample walkthroughs dir
sample-wt:
	cp internal/domain/yaml/testdata/auth-refactor.yaml sample-repo/walkthroughs/auth-refactor.yaml
