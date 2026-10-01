package journal

import (
	"bytes"
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"regexp"
)

// Blobs are content-addressed per venture (09a §4.1). They live in the Journal's own file, so one
// writer, one lock, one WAL and one checkpoint cover them exactly as they cover events, and a blob
// a journaled event names cannot be durable on a different schedule from that event.
//
// Not here, and owned by later jobs: redaction before write and D2 per-subject encryption (09a
// §4.1, §11.7). PutBlob stores the bytes it is given.
//
// The table has a rowid on purpose: SQLite advises against WITHOUT ROWID for rows this large.
const blobSchema = `CREATE TABLE IF NOT EXISTS blobs (
	venture TEXT NOT NULL CHECK (venture <> ''),
	ref     TEXT NOT NULL,
	data    BLOB NOT NULL,
	PRIMARY KEY (venture, ref)
)`

// ErrBlobCorrupt: the bytes stored under a ref no longer hash to it. They are never served.
var ErrBlobCorrupt = errors.New("journal: blob does not match its content address")

var blobRefPattern = regexp.MustCompile(`^sha256:[0-9a-f]{64}$`)

func blobRef(data []byte) BlobRef {
	sum := sha256.Sum256(data)
	return BlobRef("sha256:" + hex.EncodeToString(sum[:]))
}

// PutBlob stores data under venture and returns its content address. Storing bytes already
// present is a no-op that returns the same ref; if the row already under that ref holds other
// bytes, the store is corrupt and PutBlob refuses rather than report the new bytes durable.
func (s *store) PutBlob(ctx context.Context, venture string, data []byte) (BlobRef, error) {
	if venture == "" {
		return "", errors.New("journal: empty venture")
	}
	if data == nil {
		data = []byte{}
	}
	ref := blobRef(data)
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.conn == nil {
		return "", errClosed
	}
	tx, err := s.conn.BeginTx(ctx, nil)
	if err != nil {
		return "", fmt.Errorf("journal: begin: %w", err)
	}
	defer tx.Rollback() // no-op after Commit
	var have []byte
	err = tx.QueryRowContext(ctx, `SELECT data FROM blobs WHERE venture = ? AND ref = ?`, venture, string(ref)).Scan(&have)
	switch {
	case err == nil:
		if !bytes.Equal(have, data) {
			return "", fmt.Errorf("%w: venture %q ref %s", ErrBlobCorrupt, venture, ref)
		}
		return ref, nil
	case !errors.Is(err, sql.ErrNoRows):
		return "", fmt.Errorf("journal: blob lookup: %w", err)
	}
	if _, err := tx.ExecContext(ctx, `INSERT INTO blobs (venture, ref, data) VALUES (?, ?, ?)`, venture, string(ref), data); err != nil {
		return "", fmt.Errorf("journal: blob insert: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return "", fmt.Errorf("journal: commit: %w", err)
	}
	return ref, nil
}

// GetBlob returns the bytes stored under ref for venture after checking they still hash to ref.
// A ref that is not "sha256:" + 64 lowercase hex names no blob, so it is ErrBlobNotFound.
func (s *store) GetBlob(ctx context.Context, venture string, ref BlobRef) ([]byte, error) {
	if !blobRefPattern.MatchString(string(ref)) {
		return nil, fmt.Errorf("%w: %q is not a sha256 content address", ErrBlobNotFound, ref)
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.conn == nil {
		return nil, errClosed
	}
	var data []byte
	err := s.conn.QueryRowContext(ctx, `SELECT data FROM blobs WHERE venture = ? AND ref = ?`, venture, string(ref)).Scan(&data)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("%w: venture %q ref %s", ErrBlobNotFound, venture, ref)
	}
	if err != nil {
		return nil, fmt.Errorf("journal: blob read: %w", err)
	}
	if data == nil {
		data = []byte{}
	}
	if blobRef(data) != ref {
		return nil, fmt.Errorf("%w: venture %q ref %s", ErrBlobCorrupt, venture, ref)
	}
	return data, nil
}
