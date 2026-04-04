// Command cr-server is the HTTP server for the CR Walkthrough System.
package main

import (
	"flag"
	"fmt"
	"log"

	"github.com/crs-cradle/cr-walkthrough/internal/api"
)

func main() {
	walkthroughsDir := flag.String("walkthroughs", "./walkthroughs", "directory containing YAML walkthrough files")
	repoPath := flag.String("repo", ".", "root path of the git repository")
	port := flag.Int("port", 8080, "HTTP server port")

	flag.Usage = func() {
		fmt.Fprintf(flag.CommandLine.Output(), "Usage: cr-server [flags]\n\nFlags:\n")
		flag.PrintDefaults()
	}
	flag.Parse()

	cfg := api.Config{
		WalkthroughsDir: *walkthroughsDir,
		RepoPath:        *repoPath,
		Port:            *port,
	}

	log.Printf("cr-server: walkthroughs=%s repo=%s port=%d",
		cfg.WalkthroughsDir, cfg.RepoPath, cfg.Port)

	if err := api.ListenAndRun(cfg); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
