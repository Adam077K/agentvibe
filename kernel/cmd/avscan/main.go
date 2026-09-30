// Command avscan is the pre-model secret scanner (B0-19): it scans a repository's working tree and
// writes a receipt, or, with -check, asks whether the current tree has a clean receipt.
//
//	avscan -receipts DIR REPO          scan and record   (exit 0 clean · 1 findings · 2 error)
//	avscan -receipts DIR -check REPO   RequireScanned    (exit 0 accepted · 1 refused · 2 error)
//
// Findings are printed as path:line rule. The matched value is never printed. Git history is out of
// scope for v0; see package secretscan.
package main

import (
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/secretscan"
)

func main() { os.Exit(run(os.Args[1:], os.Stdout, os.Stderr)) }

func run(args []string, stdout, stderr io.Writer) int {
	fs := flag.NewFlagSet("avscan", flag.ContinueOnError)
	fs.SetOutput(stderr)
	receipts := fs.String("receipts", "", "directory holding scan receipts (required)")
	check := fs.Bool("check", false, "do not scan; refuse unless the current tree has a clean receipt")
	if err := fs.Parse(args); err != nil {
		return 2
	}
	if *receipts == "" || fs.NArg() != 1 {
		fmt.Fprintln(stderr, "usage: avscan -receipts DIR [-check] REPO")
		return 2
	}
	repo := fs.Arg(0)

	if *check {
		err := secretscan.RequireScanned(repo, *receipts)
		switch {
		case err == nil:
			fmt.Fprintf(stdout, "avscan: %s has a clean receipt for its current tree\n", repo)
			return 0
		case errors.Is(err, secretscan.ErrNotScanned), errors.Is(err, secretscan.ErrStale),
			errors.Is(err, secretscan.ErrFindings):
			fmt.Fprintf(stderr, "avscan: refused: %v\n", err)
			return 1
		default:
			fmt.Fprintf(stderr, "avscan: %v\n", err)
			return 2
		}
	}

	res, path, err := secretscan.ScanAndRecord(repo, *receipts, time.Now())
	if err != nil {
		fmt.Fprintf(stderr, "avscan: %v\n", err)
		return 2
	}
	for _, f := range res.Findings {
		fmt.Fprintf(stdout, "%s:%d %s\n", f.Path, f.Line, f.Rule)
	}
	fmt.Fprintf(stdout, "avscan: %d finding(s) · %d files scanned · %d binary skipped · rules %s · receipt %s\n",
		len(res.Findings), res.FilesScanned, res.FilesBinary, secretscan.RulesVersion, path)
	if len(res.Findings) > 0 {
		return 1
	}
	return 0
}
