// Command avk-boundary fails when the Kernel crosses one of its boundaries
// (docs/vision-v3/09a-ENGINEERING.md §2): a module outside ALLOWED_MODULES, more non-test Go lines
// than the budget, or a path outside kernel/ naming the Journal.
//
// Run it from kernel/:
//
//	go run ./cmd/avk-boundary [-kernel .] [-repo ..] [-allowed ALLOWED_MODULES] [-max-lines 8000]
//
// Exit 0: all three checks ran and found nothing. Exit 1: a finding. Exit 2: a check could not run,
// which is never a pass.
package main

import (
	"context"
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/Adam077K/agentvibe/kernel/internal/boundary"
)

func main() {
	os.Exit(run(os.Args[1:], os.Stdout, os.Stderr))
}

func run(args []string, stdout, stderr io.Writer) int {
	fl := flag.NewFlagSet("avk-boundary", flag.ContinueOnError)
	fl.SetOutput(stderr)
	kernelDir := fl.String("kernel", ".", "the kernel module directory")
	repoDir := fl.String("repo", "..", "the repository root scanned for Journal references")
	allowedPath := fl.String("allowed", "", "the allowed-module list (default <kernel>/ALLOWED_MODULES)")
	maxLines := fl.Int("max-lines", boundary.DefaultMaxLines, "the non-test Go line budget")
	if err := fl.Parse(args); err != nil {
		return 2
	}
	if fl.NArg() > 0 {
		fmt.Fprintf(stderr, "avk-boundary: unexpected arguments %q\n", fl.Args())
		return 2
	}
	if *allowedPath == "" {
		*allowedPath = filepath.Join(*kernelDir, "ALLOWED_MODULES")
	}

	fail := func(err error) int {
		fmt.Fprintf(stderr, "avk-boundary: %v\n", err)
		return 2
	}
	kernelAbs, err := filepath.Abs(*kernelDir)
	if err != nil {
		return fail(err)
	}
	repoAbs, err := filepath.Abs(*repoDir)
	if err != nil {
		return fail(err)
	}
	kernelRel, err := filepath.Rel(repoAbs, kernelAbs)
	if err != nil || kernelRel == "." || !filepath.IsLocal(kernelRel) {
		return fail(fmt.Errorf("kernel %s is not a directory inside repo %s", kernelAbs, repoAbs))
	}

	allowed, err := boundary.LoadAllowed(*allowedPath)
	if err != nil {
		return fail(err)
	}
	modFindings, err := boundary.CheckModules(context.Background(), kernelAbs, allowed)
	if err != nil {
		return fail(err)
	}
	sizeFindings, lines, err := boundary.CheckSize(kernelAbs, *maxLines)
	if err != nil {
		return fail(err)
	}
	journalFindings, err := boundary.CheckJournalWriters(repoAbs, kernelRel)
	if err != nil {
		return fail(err)
	}

	findings := append(append(modFindings, sizeFindings...), journalFindings...)
	for _, f := range findings {
		fmt.Fprintln(stderr, f)
	}
	if len(findings) > 0 {
		fmt.Fprintf(stderr, "avk-boundary: FAIL, %d finding(s)\n", len(findings))
		return 1
	}
	fmt.Fprintf(stdout, "avk-boundary: ok (modules within ALLOWED_MODULES, %d of %d lines, Journal named only under %s/)\n",
		lines, *maxLines, filepath.ToSlash(kernelRel))
	return 0
}
