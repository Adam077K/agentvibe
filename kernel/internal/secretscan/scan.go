// Package secretscan is the pre-model secret scanner (B0-19, DR-76): a deterministic walk of a
// repository's working tree, matched against a small fixed rule set (rules.go), with no network
// access and no model call. It writes a receipt bound to the tree it scanned, and RequireScanned
// refuses a repository whose current tree has no clean receipt.
//
// Scope, v0: the working tree only. Git history is OUT of scope — a secret committed and later
// deleted from the tree is not found. Every .git entry (directory or gitlink file) is skipped. A file
// whose first 8 KiB holds a NUL byte is treated as binary and not matched, but it is still hashed, so
// changing it invalidates a receipt. Symlinks are hashed by target and never followed. A secret split
// across lines, encoded, or assembled at run time defeats every rule.
package secretscan

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

// Finding locates one rule match. It deliberately carries no part of the matched value, so a
// receipt or a log line never becomes a second copy of the secret.
type Finding struct {
	Path string `json:"path"`
	Line int    `json:"line"`
	Rule string `json:"rule"`
}

// Result is one scan of one working tree.
type Result struct {
	Repo         string    `json:"repo"`
	TreeHash     string    `json:"tree_hash"`
	FilesScanned int       `json:"files_scanned"`
	FilesBinary  int       `json:"files_binary"`
	Findings     []Finding `json:"findings"`
}

const binarySniff = 8 << 10

// canonical returns the absolute, symlink-resolved path of p, so one directory has one name.
func canonical(p string) (string, error) {
	abs, err := filepath.Abs(p)
	if err != nil {
		return "", err
	}
	return filepath.EvalSymlinks(abs)
}

// walk visits the tree under root and returns its hash: sha256 over one line per entry, in lexical
// path order, naming the entry's kind, its slash-separated relative path and its content hash (or a
// symlink's target). When res is non-nil, text files are also matched and counted into res. exclude,
// when it lies inside root, is skipped entirely: a receipt directory kept inside the repository must
// not change the hash it records.
func walk(root, exclude string, res *Result) (string, error) {
	h := sha256.New()
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if path != root && (d.Name() == ".git" || path == exclude) {
			if d.IsDir() {
				return fs.SkipDir
			}
			return nil
		}
		rel, err := filepath.Rel(root, path)
		if err != nil {
			return err
		}
		rel = filepath.ToSlash(rel)
		switch {
		case d.IsDir():
			return nil
		case d.Type()&fs.ModeSymlink != 0:
			target, err := os.Readlink(path)
			if err != nil {
				return err
			}
			fmt.Fprintf(h, "L\x00%s\x00%s\n", rel, target)
			return nil
		case !d.Type().IsRegular():
			return nil
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		sum := sha256.Sum256(data)
		fmt.Fprintf(h, "F\x00%s\x00%s\n", rel, hex.EncodeToString(sum[:]))
		if res == nil {
			return nil
		}
		if bytes.IndexByte(data[:min(len(data), binarySniff)], 0) >= 0 {
			res.FilesBinary++
			return nil
		}
		res.FilesScanned++
		for i, line := range strings.Split(string(data), "\n") {
			for _, r := range matchLine(line) {
				res.Findings = append(res.Findings, Finding{Path: rel, Line: i + 1, Rule: r})
			}
		}
		return nil
	})
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

// excludeFor canonicalises receiptDir. A directory that does not exist yet cannot be inside the
// tree, so it excludes nothing.
func excludeFor(receiptDir string) string {
	if receiptDir == "" {
		return ""
	}
	if p, err := canonical(receiptDir); err == nil {
		return p
	}
	return ""
}

// Scan walks repo's working tree and matches every text file against the rule set. receiptDir, if
// it lies inside repo, is excluded from both the match and the tree hash.
func Scan(repo, receiptDir string) (*Result, error) {
	root, err := canonical(repo)
	if err != nil {
		return nil, fmt.Errorf("secretscan: %w", err)
	}
	res := &Result{Repo: root, Findings: []Finding{}}
	hash, err := walk(root, excludeFor(receiptDir), res)
	if err != nil {
		return nil, fmt.Errorf("secretscan: walk %s: %w", root, err)
	}
	res.TreeHash = hash
	return res, nil
}

// TreeHash returns repo's canonical path and the hash Scan would record for it now, matching nothing.
func TreeHash(repo, receiptDir string) (root, hash string, err error) {
	root, err = canonical(repo)
	if err != nil {
		return "", "", fmt.Errorf("secretscan: %w", err)
	}
	hash, err = walk(root, excludeFor(receiptDir), nil)
	if err != nil {
		return "", "", fmt.Errorf("secretscan: walk %s: %w", root, err)
	}
	return root, hash, nil
}
