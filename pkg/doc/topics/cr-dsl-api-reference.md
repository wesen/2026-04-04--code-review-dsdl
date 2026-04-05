---
Title: "API Reference — REST Endpoints"
Slug: cr-dsl-api-reference
SectionType: GeneralTopic
Topics:
  - cr-dsl
  - api
  - reference
  - go
  - backend
  - rest
IsTemplate: false
IsTopLevel: false
ShowPerDefault: true
Order: 13
---

The Go API server exposes a REST interface for walkthrough metadata, walkthrough content, git file reads, and git diffs. All responses are JSON. The base URL is `:8080/api`.

The API is served by Chi (`github.com/go-chi/chi/v5`). Routes are registered in `internal/api/server.go`. Route handlers live in `internal/api/routes/`.

## Health check

### GET /api/health

Returns the server status. Use this to verify the server is up.

**Request:**

```
GET /api/health
```

**Response 200 OK:**

```json
{"status": "ok"}
```

**Response fields:**

| Field | Type | Description |
|---|---|---|
| `status` | string | Always `"ok"` when the server is running. |

---

## Walkthroughs

### GET /api/walkthroughs

Lists all available walkthroughs in the walkthroughs directory.

**Request:**

```
GET /api/walkthroughs
```

**Response 200 OK:**

```json
{
  "walkthroughs": [
    {
      "id": "auth-refactor",
      "path": "/home/user/repo/sample-repo/walkthroughs/auth-refactor.yaml",
      "title": "PR #482: Refactor auth middleware",
      "repo": "github/acme/backend",
      "base": "main",
      "head": "feat/auth-refactor",
      "authors": ["alice", "bob"],
      "stepCount": 8
    }
  ]
}
```

**Response fields:**

| Field | Type | Description |
|---|---|---|
| `walkthroughs[]` | WalkthroughSummary[] | Ordered list of walkthrough metadata objects. |
| `walkthroughs[].id` | string | Walkthrough ID (filename without `.yaml`). |
| `walkthroughs[].path` | string | Absolute path to the YAML file on disk. |
| `walkthroughs[].title` | string | Human-readable title from the YAML. |
| `walkthroughs[].repo` | string | Repository identifier. |
| `walkthroughs[].base` | string | Git ref for the base/old state. |
| `walkthroughs[].head` | string | Git ref for the head/new state. |
| `walkthroughs[].authors` | string[] | List of author names. |
| `walkthroughs[].stepCount` | int | Number of steps in the walkthrough. |

**Errors:**

| Status | When |
|---|---|
| 500 Internal Server Error | The walkthroughs directory does not exist or is not readable. |

---

### GET /api/walkthroughs/:id

Returns the full walkthrough with all step data.

**Request:**

```
GET /api/walkthroughs/auth-refactor
```

**Response 200 OK:**

```json
{
  "id": "auth-refactor",
  "title": "PR #482: Refactor auth middleware",
  "repo": "github/acme/backend",
  "base": "main",
  "head": "feat/auth-refactor",
  "authors": ["alice", "bob"],
  "steps": [
    {
      "type": "text",
      "body": "This PR replaces the legacy session-based auth..."
    },
    {
      "type": "source",
      "file": "src/utils/token.ts",
      "lines": [12, 48],
      "ref": "feat/auth-refactor",
      "highlight": [30, 35],
      "note": "New verifyToken helper."
    }
  ]
}
```

**Response fields:**

| Field | Type | Description |
|---|---|---|
| (all top-level fields) | | Same as `WalkthroughSummary` above. |
| `steps` | Step[] | Ordered array of typed step objects. See `cr-dsl-walkthrough-reference` for the full step schema. |

**Errors:**

| Status | When |
|---|---|
| 404 Not Found | No walkthrough with this ID exists. |
| 500 Internal Server Error | File exists but cannot be parsed as valid YAML. |

**URL encoding:** If the walkthrough ID contains special characters, URL-encode them. For example, `feat/my-branch` becomes `feat%2Fmy-branch` in the URL.

---

## File content

### GET /api/files/content

Reads a range of lines from a file at a specific git ref. The ref is resolved using the git repository's reflog, so branch names, tags, commit SHAs, and relative refs (e.g., `HEAD~1`) all work.

**Request:**

```
GET /api/files/content?ref=feat/auth-refactor&path=src/utils/token.ts&start=12&end=48
```

**Query parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `ref` | string | Yes | Git ref (branch, tag, SHA, or relative). Defaults to `HEAD` if omitted. |
| `path` | string | Yes | Path to the file within the git repository. |
| `start` | int | Yes | First line number (1-indexed, inclusive). |
| `end` | int | Yes | Last line number (1-indexed, inclusive). |

**Response 200 OK:**

```json
{
  "ref": "feat/auth-refactor",
  "path": "src/utils/token.ts",
  "start": 12,
  "end": 48,
  "lines": [
    "export function createToken(payload: unknown): string {",
    "  const header = base64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));",
    "  ..."
  ]
}
```

**Response fields:**

| Field | Type | Description |
|---|---|---|
| `ref` | string | The resolved git ref (may differ from requested if requested ref is relative). |
| `path` | string | The requested file path. |
| `start` | int | The requested start line. |
| `end` | int | The requested end line. |
| `lines` | string[] | Array of source code lines. Empty array if the range is invalid. |

**Errors:**

| Status | Cause | Response |
|---|---|---|
| 400 Bad Request | Missing `path`, `start`, or `end` parameter | `{"error": "..."}` |
| 404 Not Found | File does not exist at that ref | `{"error": "file not found"}` |
| 416 Range Not Satisfiable | `start > end` or range is invalid | `{"error": "invalid line range"}` |
| 500 Internal Server Error | Git repository error | `{"error": "..."}` |

**Caching:** File reads are cached in memory with a 5-minute TTL via `RepoServiceWithCache`. The cache key is `{ ref, path }`. The `start`/`end` parameters are not part of the cache key — the full file is cached and line ranges are sliced from it on each request. This means many line-range requests for the same file share one cache entry.

---

## Diff

### GET /api/files/diff

Returns a unified diff between two git refs for a specific file.

**Request:**

```
GET /api/files/diff?from=main&to=feat/auth-refactor&path=src/middleware/auth.ts
```

**Query parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `from` | string | Yes | "Before" git ref. |
| `to` | string | Yes | "After" git ref. |
| `path` | string | No | File path to restrict the diff to. If omitted, all changed files are included. |

**Response 200 OK:**

```json
{
  "from": "main",
  "to": "feat/auth-refactor",
  "path": "src/middleware/auth.ts",
  "diff": "diff --git a/src/middleware/auth.ts b/src/middleware/auth.ts\n--- a/src/middleware/auth.ts\n+++ b/src/middleware/auth.ts\n@@ -8,7 +8,7 @@\nexport async function authMiddleware(...) {\n-  const user = await Session.find(req.cookie.sid);\n+  const user = await verifyToken(token.replace(\"Bearer \", \"\"));\n   req.user = user;\n }"
}
```

**Response fields:**

| Field | Type | Description |
|---|---|---|
| `from` | string | The `from` query parameter. |
| `to` | string | The `to` query parameter. |
| `path` | string | The `path` query parameter if provided. |
| `diff` | string | Unified diff text. Empty string if no changes exist between the refs for this path. |

**Implementation note:** Diffs are currently generated using a subprocess call to `git diff A B -- path`. This is correct and stable. A future optimization may replace it with a pure go-git tree comparison.

---

## Repository refs

### GET /api/repos/refs

Lists all git refs (branches and tags) in the served repository.

**Request:**

```
GET /api/repos/refs
```

**Response 200 OK:**

```json
{
  "refs": [
    { "name": "main", "type": "branch", "hash": "b309b970f91972e298aca5da143e836402a5a20e" },
    { "name": "feat/auth-refactor", "type": "branch", "hash": "30a6fdd1587ae968d1ad566078c67b08dcc111c9" },
    { "name": "v1.0.0", "type": "tag", "hash": "b309b970f91972e298aca5da143e836402a5a20e" }
  ]
}
```

**Response fields:**

| Field | Type | Description |
|---|---|---|
| `refs[]` | RefInfo[] | All refs in the repository. |
| `refs[].name` | string | Short name (e.g., `main`, `feat/my-branch`). |
| `refs[].type` | `"branch" \| "tag"` | The type of ref. |
| `refs[].hash` | string | Full commit SHA. |

---

## Architecture notes

### Git service interface

All git operations go through a `RepoService` interface (`internal/domain/git/service.go`). This allows the caching decorator, mocking, and future implementations:

```go
// internal/domain/git/service.go
type RepoService interface {
    Open(path string) error
    ResolveRef(ref string) (plumbing.Hash, error)
    ReadFileLines(ref string, path string) ([]string, error)
}
```

The API handlers only know about the interface, not the implementation. `NewServer` in `server.go` wires in a cached decorator by default:

```go
repoSvc := git.NewCachedRepoService(git.NewRepoService(), 5*time.Minute)
```

To use a mock in tests: pass a different `RepoService` via `Config.RepoService`.

### Error responses

All error responses have the same shape:

```json
{"error": "human-readable message"}
```

The HTTP status code is set appropriately (400, 404, 416, 500). Errors are logged server-side.

## See Also

- [`cr-dsl-walkthrough-reference`](cr-dsl-walkthrough-reference) — Walkthrough YAML schema consumed by these endpoints
- [`cr-dsl-step-types`](cr-dsl-step-types) — What the frontend does with the API response data
- [`cr-dsl-quickstart`](cr-dsl-quickstart) — How to run the server and verify the API
