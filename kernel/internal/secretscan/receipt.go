package secretscan

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// ReceiptSchema identifies the receipt format.
const ReceiptSchema = "avscan.receipt/v0"

// The three refusals RequireScanned can return. Test them with errors.Is.
var (
	ErrNotScanned = errors.New("secretscan: repository has never been scanned")
	ErrStale      = errors.New("secretscan: receipt is stale")
	ErrFindings   = errors.New("secretscan: scan found secrets")
)

// Receipt is the JSON record of one scan. It is bound to the tree by hash; it is not signed, so it
// proves which tree was scanned to whoever trusts the receipt directory, and no more.
type Receipt struct {
	Schema        string    `json:"schema"`
	Repo          string    `json:"repo"`
	TreeHash      string    `json:"tree_hash"`
	RulesVersion  string    `json:"rules_version"`
	FilesScanned  int       `json:"files_scanned"`
	FilesBinary   int       `json:"files_binary"`
	FindingsCount int       `json:"findings_count"`
	Findings      []Finding `json:"findings"`
	ScannedAt     string    `json:"scanned_at"`
}

// repoKey names a repository inside a receipt directory that several repositories may share.
func repoKey(root string) string {
	sum := sha256.Sum256([]byte(root))
	return hex.EncodeToString(sum[:8])
}

func receiptName(root, treeHash string) string {
	return repoKey(root) + "-" + treeHash + ".json"
}

// WriteReceipt records res in dir (created 0700 if absent) as <repo key>-<tree hash>.json, written
// to a temporary file and renamed, so a reader never sees half a receipt. It returns the path.
func WriteReceipt(res *Result, dir string, now time.Time) (string, error) {
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return "", fmt.Errorf("secretscan: receipt dir: %w", err)
	}
	rc := Receipt{
		Schema:        ReceiptSchema,
		Repo:          res.Repo,
		TreeHash:      res.TreeHash,
		RulesVersion:  RulesVersion,
		FilesScanned:  res.FilesScanned,
		FilesBinary:   res.FilesBinary,
		FindingsCount: len(res.Findings),
		Findings:      res.Findings,
		ScannedAt:     now.UTC().Format(time.RFC3339),
	}
	data, err := json.MarshalIndent(rc, "", "  ")
	if err != nil {
		return "", err
	}
	tmp, err := os.CreateTemp(dir, ".receipt-*")
	if err != nil {
		return "", fmt.Errorf("secretscan: %w", err)
	}
	defer os.Remove(tmp.Name())
	if _, err := tmp.Write(append(data, '\n')); err != nil {
		tmp.Close()
		return "", fmt.Errorf("secretscan: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return "", fmt.Errorf("secretscan: %w", err)
	}
	dst := filepath.Join(dir, receiptName(res.Repo, res.TreeHash))
	if err := os.Rename(tmp.Name(), dst); err != nil {
		return "", fmt.Errorf("secretscan: %w", err)
	}
	return dst, nil
}

// ScanAndRecord scans repo and writes its receipt into receiptDir.
func ScanAndRecord(repo, receiptDir string, now time.Time) (*Result, string, error) {
	res, err := Scan(repo, receiptDir)
	if err != nil {
		return nil, "", err
	}
	path, err := WriteReceipt(res, receiptDir, now)
	if err != nil {
		return nil, "", err
	}
	return res, path, nil
}

// RequireScanned returns nil only when receiptDir holds a receipt for repo's CURRENT tree, made
// under the current rule set, with zero findings. Otherwise it refuses with ErrNotScanned (no receipt
// for this repository at all), ErrStale (a receipt exists, but for another tree or rule set) or
// ErrFindings (the current tree was scanned and holds secrets), and with ErrReceiptInRepo when
// receiptDir lies inside repo. It never scans: a worker launcher
// calls it, and only a deliberate ScanAndRecord can satisfy it.
func RequireScanned(repo, receiptDir string) error {
	root, hash, err := TreeHash(repo, receiptDir)
	if err != nil {
		return err
	}
	data, err := os.ReadFile(filepath.Join(receiptDir, receiptName(root, hash)))
	if errors.Is(err, fs.ErrNotExist) {
		if hasAnyReceipt(receiptDir, root) {
			return fmt.Errorf("%w: %s changed since it was last scanned", ErrStale, root)
		}
		return fmt.Errorf("%w: %s", ErrNotScanned, root)
	}
	if err != nil {
		return fmt.Errorf("secretscan: read receipt: %w", err)
	}
	var rc Receipt
	if err := json.Unmarshal(data, &rc); err != nil {
		return fmt.Errorf("%w: unreadable receipt for %s: %v", ErrStale, root, err)
	}
	switch {
	case rc.Schema != ReceiptSchema || rc.Repo != root || rc.TreeHash != hash:
		return fmt.Errorf("%w: receipt does not describe %s at tree %s", ErrStale, root, hash)
	case rc.RulesVersion != RulesVersion:
		return fmt.Errorf("%w: scanned under rules %q, current is %q", ErrStale, rc.RulesVersion, RulesVersion)
	case rc.FindingsCount != 0 || len(rc.Findings) != 0:
		return fmt.Errorf("%w: %d finding(s) in %s", ErrFindings, max(rc.FindingsCount, len(rc.Findings)), root)
	}
	return nil
}

func hasAnyReceipt(dir, root string) bool {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return false
	}
	prefix := repoKey(root) + "-"
	for _, e := range entries {
		if strings.HasPrefix(e.Name(), prefix) && strings.HasSuffix(e.Name(), ".json") {
			return true
		}
	}
	return false
}
