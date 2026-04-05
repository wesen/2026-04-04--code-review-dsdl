// Package static provides the embedded frontend build artifacts.
package static

import "embed"

// Dist contains the frontend build artifacts embedded at compile time.
// Populated by 'make build-frontend' → copied to static/dist/ by 'make copy-static'.
//
//go:embed dist
var Dist embed.FS
