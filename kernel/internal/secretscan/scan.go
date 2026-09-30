// Package secretscan is the pre-model secret scanner (B0-19, DR-76): a deterministic walk of a
// repository's working tree, matched against a small fixed rule set (rules.go), with no network
// access and no model call. It writes a receipt bound to the tree it scanned, and RequireScanned
// refuses a repository whose current tree has no clean receipt.
//
// The walk is default-deny on what it cannot see:
//   - Only the top-level .git is skipped, and only when it is a real git directory (holds HEAD).
//     A .git at any other depth, or a .git file, is scanned and hashed like any other entry.
//   - A file holding NUL bytes (binary, or UTF-16 text) is matched with its NULs dropped, so
//     UTF-16 text reads as ASCII; it is never skipped.
//   - A symlink is never followed. One whose target leaves the repository, or points into the
//     top-level .git, is a finding. An in-repo target's content is folded into the link's hash line.
//   - A receipt directory inside the repository is refused outright (ErrReceiptInRepo), because
//     anything excluded from the tree hash is a place to hide a file after the scan.
//
// Scope, v0: the working tree only. Git history is OUT of scope — a secret committed and later
// deleted from the tree is not found. A secret split across lines, encoded, or assembled at run
// time defeats every rule.
package secretscan

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

// ErrReceiptInRepo refuses a receipt directory that lies inside the repository it describes.
var ErrReceiptInRepo = errors.New("secretscan: receipt directory is inside the repository")

// Finding locates one rule match. It deliberately carries no part of the matched value, so a
// receipt or a log line never becomes a second copy of the secret. Line is 0 for a symlink finding.
type Finding struct {
	Path string `json:"path"`
	Line int    `json:"line"`
	Rule string `json:"rule"`
}

// Result is one scan of one working tree. FilesBinary counts files holding NUL bytes, which are
// matched with the NULs dropped; FilesScanned counts the rest.
type Result struct {
	Repo         string    `json:"repo"`
	TreeHash     string    `json:"tree_hash"`
	FilesScanned int       `json:"files_scanned"`
	FilesBinary  int       `json:"files_binary"`
	Findings     []Finding `json:"findings"`
}

// canonical returns the absolute, symlink-resolved path of p, so one directory has one name.
func canonical(p string) (string, error) {
	abs, err := filepath.Abs(p)
	if err != nil {
		return "", err
	}
	return filepath.EvalSymlinks(abs)
}

// canonicalNear resolves the longest existing prefix of p, so a directory that does not exist yet
// still gets the name it will have.
func canonicalNear(p string) (string, error) {
	abs, err := filepath.Abs(p)
	if err != nil {
		return "", err
	}
	for cur := abs; ; cur = filepath.Dir(cur) {
		if r, err := filepath.EvalSymlinks(cur); err == nil {
			rest, _ := filepath.Rel(cur, abs)
			return filepath.Join(r, rest), nil
		}
		if filepath.Dir(cur) == cur {
			return abs, nil
		}
	}
}

// inside reports whether p is dir or lies beneath it. Both must be clean absolute paths.
func inside(dir, p string) bool {
	rel, err := filepath.Rel(dir, p)
	return err == nil && rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator))
}

func isRealGitDir(p string) bool {
	if fi, err := os.Lstat(p); err != nil || !fi.IsDir() {
		return false
	}
	fi, err := os.Lstat(filepath.Join(p, "HEAD"))
	return err == nil && fi.Mode().IsRegular()
}

func fileHash(p string) (string, error) {
	data, err := os.ReadFile(p)
	if err != nil {
		return "", err
	}
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:]), nil
}

// walk visits the tree under root and returns its hash: sha256 over one line per entry, in lexical
// path order, naming the entry's kind, its slash-separated relative path and its content hash (for
// a symlink: its target and the target's content hash). When res is non-nil, files are also matched.
func walk(root string, res *Result) (string, error) {
	h := sha256.New()
	gitDir := filepath.Join(root, ".git")
	skipGit := isRealGitDir(gitDir)
	forbidden := func(p string) bool { return !inside(root, p) || (skipGit && inside(gitDir, p)) }

	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if skipGit && path == gitDir {
			return fs.SkipDir
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
			lexical := target
			if !filepath.IsAbs(lexical) {
				lexical = filepath.Join(filepath.Dir(path), target)
			}
			escapes := forbidden(filepath.Clean(lexical))
			content := "-"
			if resolved, err := filepath.EvalSymlinks(path); err == nil {
				escapes = escapes || forbidden(resolved)
				if fi, err := os.Stat(resolved); !escapes && err == nil && fi.Mode().IsRegular() {
					if content, err = fileHash(resolved); err != nil {
						return err
					}
				}
			}
			fmt.Fprintf(h, "L\x00%s\x00%s\x00%s\n", rel, target, content)
			if escapes && res != nil {
				res.Findings = append(res.Findings, Finding{Path: rel, Line: 0, Rule: RuleSymlinkEscape})
			}
			return nil
		case !d.Type().IsRegular():
			fmt.Fprintf(h, "S\x00%s\x00%s\n", rel, d.Type())
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
		text := data
		if bytes.IndexByte(data, 0) >= 0 {
			res.FilesBinary++
			text = bytes.ReplaceAll(data, []byte{0}, nil)
		} else {
			res.FilesScanned++
		}
		for i, line := range strings.Split(string(text), "\n") {
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

// prepare canonicalises repo and refuses a receipt directory inside it.
func prepare(repo, receiptDir string) (string, error) {
	root, err := canonical(repo)
	if err != nil {
		return "", fmt.Errorf("secretscan: %w", err)
	}
	rd, err := canonicalNear(receiptDir)
	if err != nil {
		return "", fmt.Errorf("secretscan: %w", err)
	}
	if inside(root, rd) {
		return "", fmt.Errorf("%w: %s is under %s", ErrReceiptInRepo, rd, root)
	}
	return root, nil
}

// Scan walks repo's working tree and matches every file against the rule set. receiptDir must lie
// outside repo; Scan does not write it.
func Scan(repo, receiptDir string) (*Result, error) {
	root, err := prepare(repo, receiptDir)
	if err != nil {
		return nil, err
	}
	res := &Result{Repo: root, Findings: []Finding{}}
	hash, err := walk(root, res)
	if err != nil {
		return nil, fmt.Errorf("secretscan: walk %s: %w", root, err)
	}
	res.TreeHash = hash
	return res, nil
}

// TreeHash returns repo's canonical path and the hash Scan would record for it now, matching nothing.
func TreeHash(repo, receiptDir string) (root, hash string, err error) {
	root, err = prepare(repo, receiptDir)
	if err != nil {
		return "", "", err
	}
	hash, err = walk(root, nil)
	if err != nil {
		return "", "", fmt.Errorf("secretscan: walk %s: %w", root, err)
	}
	return root, hash, nil
}
