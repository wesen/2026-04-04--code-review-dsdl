.PHONY: build test lint clean run dev

# Binary name and output directory
BIN := bin/cr-server
GO_LDFLAGS := -ldflags="-s -w"

# ── Build ──────────────────────────────────────────────────────────────────

build: build-frontend
	CGO_ENABLED=0 go build $(GO_LDFLAGS) -o $(BIN) ./cmd/cr-server

build-frontend:
	cd frontend && npm install && npm run build

build-go:
	CGO_ENABLED=0 go build $(GO_LDFLAGS) -o $(BIN) ./cmd/cr-server

# ── Development ──────────────────────────────────────────────────────────────

# Run the backend server (requires a git repo and walkthroughs dir)
# Example: make run REPO=/path/to/repo WT=/path/to/walkthroughs
REPO ?= ./sample-repo
WT   ?= ./sample-repo/walkthroughs
PORT ?= 8080

run: build-go
	./$(BIN) -repo $(REPO) -walkthroughs $(WT) -port $(PORT)

dev:
	go run ./cmd/cr-server -repo $(REPO) -walkthroughs $(WT) -port $(PORT)

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
	gofmt -w ./cmd ./internal

tidy:
	go mod tidy

# ── Clean ─────────────────────────────────────────────────────────────────────

clean:
	rm -rf bin/
	cd frontend && rm -rf dist/

# ── Sample data ─────────────────────────────────────────────────────────────

# Copy the auth-refactor walkthrough to the sample walkthroughs dir
sample-wt:
	cp internal/domain/yaml/testdata/auth-refactor.yaml sample-repo/walkthroughs/auth-refactor.yaml
