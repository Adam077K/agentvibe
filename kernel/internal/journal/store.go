package journal

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"sync"

	_ "modernc.org/sqlite" // pure-Go SQLite, no cgo (09a §4.1); registers driver "sqlite"
)

// schema: one row per event, keyed (stream, seq). Data is a BLOB stored verbatim.
const schema = `CREATE TABLE IF NOT EXISTS events (
	stream    TEXT    NOT NULL,
	seq       INTEGER NOT NULL CHECK (seq >= 1),
	type      TEXT    NOT NULL,
	data      BLOB    NOT NULL,
	prev_hash TEXT    NOT NULL,
	hash      TEXT    NOT NULL,
	PRIMARY KEY (stream, seq)
) WITHOUT ROWID`

// store is the Journal over one SQLite file. There is one writer per file (the OS lock) and,
// inside it, one connection serialised by mu, so a head check and its insert can never interleave
// with another append.
type store struct {
	mu   sync.Mutex
	db   *sql.DB
	conn *sql.Conn
	lock *writerLock
}

var errClosed = errors.New("journal: closed")

func open(path string) (Journal, error) {
	if strings.ContainsAny(path, "?#") {
		return nil, fmt.Errorf("journal: path %q may not contain '?' or '#'", path)
	}
	// Lock and open the resolved path, so every spelling of one file contends for one lock.
	path, err := realPath(path)
	if err != nil {
		return nil, err
	}
	if strings.ContainsAny(path, "?#") {
		return nil, fmt.Errorf("journal: resolved path %q may not contain '?' or '#'", path)
	}
	lock, err := acquireWriterLock(path)
	if err != nil {
		return nil, err
	}
	s, err := openStore(path, lock)
	if err != nil {
		lock.release()
		return nil, err
	}
	return s, nil
}

func openStore(path string, lock *writerLock) (*store, error) {
	// WAL with synchronous=FULL: a commit returns only after its WAL frames are fsynced, so an
	// Append that returned survives a process kill (and a power cut, though no test proves it).
	dsn := path + "?_pragma=journal_mode(WAL)&_pragma=synchronous(FULL)&_pragma=busy_timeout(5000)&_txlock=immediate"
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("journal: open %s: %w", path, err)
	}
	db.SetMaxOpenConns(1)
	ctx := context.Background()
	conn, err := db.Conn(ctx)
	if err != nil {
		db.Close()
		return nil, fmt.Errorf("journal: open %s: %w", path, err)
	}
	var mode string
	if err := conn.QueryRowContext(ctx, "PRAGMA journal_mode").Scan(&mode); err != nil || mode != "wal" {
		conn.Close()
		db.Close()
		return nil, fmt.Errorf("journal: %s is not in WAL mode (got %q): %v", path, mode, err)
	}
	if _, err := conn.ExecContext(ctx, schema); err != nil {
		conn.Close()
		db.Close()
		return nil, fmt.Errorf("journal: schema: %w", err)
	}
	return &store{db: db, conn: conn, lock: lock}, nil
}

func (s *store) Append(ctx context.Context, p Proposal) (Event, error) {
	if p.Stream == "" {
		return Event{}, errors.New("journal: empty stream name")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.conn == nil {
		return Event{}, errClosed
	}
	tx, err := s.conn.BeginTx(ctx, nil)
	if err != nil {
		return Event{}, fmt.Errorf("journal: begin: %w", err)
	}
	defer tx.Rollback() // no-op after Commit
	seq, prev, err := headOf(ctx, tx, p.Stream)
	if err != nil {
		return Event{}, err
	}
	if seq != p.ExpectSeq {
		return Event{}, fmt.Errorf("%w: stream %q is at seq %d, expect_seq %d", ErrSeqConflict, p.Stream, seq, p.ExpectSeq)
	}
	if prev == "" {
		prev = zeroHash
	}
	data := p.Data
	if data == nil {
		data = []byte{}
	}
	ev := Event{Stream: p.Stream, Seq: seq + 1, Type: p.Type, Data: append([]byte(nil), data...), PrevHash: prev}
	if ev.Hash, err = eventHash(ev.Stream, ev.Seq, ev.Type, ev.Data, ev.PrevHash); err != nil {
		return Event{}, err
	}
	if _, err := tx.ExecContext(ctx, `INSERT INTO events (stream, seq, type, data, prev_hash, hash) VALUES (?, ?, ?, ?, ?, ?)`,
		ev.Stream, int64(ev.Seq), ev.Type, ev.Data, ev.PrevHash, ev.Hash); err != nil {
		return Event{}, fmt.Errorf("journal: insert: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return Event{}, fmt.Errorf("journal: commit: %w", err)
	}
	return ev, nil
}

type querier interface {
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
}

func headOf(ctx context.Context, q querier, stream string) (uint64, string, error) {
	var seq int64
	var hash string
	err := q.QueryRowContext(ctx, `SELECT seq, hash FROM events WHERE stream = ? ORDER BY seq DESC LIMIT 1`, stream).Scan(&seq, &hash)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, "", nil
	}
	if err != nil {
		return 0, "", fmt.Errorf("journal: head of %q: %w", stream, err)
	}
	return uint64(seq), hash, nil
}

func (s *store) Head(ctx context.Context, stream string) (uint64, string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.conn == nil {
		return 0, "", errClosed
	}
	return headOf(ctx, s.conn, stream)
}

func (s *store) Read(ctx context.Context, stream string, fromSeq uint64) ([]Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.conn == nil {
		return nil, errClosed
	}
	if fromSeq > 1<<63-1 {
		return nil, nil
	}
	return s.scan(ctx, `SELECT stream, seq, type, data, prev_hash, hash FROM events WHERE stream = ? AND seq >= ? ORDER BY seq`, stream, int64(fromSeq))
}

func (s *store) scan(ctx context.Context, query string, args ...any) ([]Event, error) {
	rows, err := s.conn.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("journal: query: %w", err)
	}
	defer rows.Close()
	var out []Event
	for rows.Next() {
		var e Event
		var seq int64
		if err := rows.Scan(&e.Stream, &seq, &e.Type, &e.Data, &e.PrevHash, &e.Hash); err != nil {
			return nil, fmt.Errorf("journal: scan: %w", err)
		}
		if seq < 1 {
			return nil, fmt.Errorf("%w: stream %q holds seq %d", ErrChainBroken, e.Stream, seq)
		}
		e.Seq = uint64(seq)
		if e.Data == nil {
			e.Data = []byte{}
		}
		out = append(out, e)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("journal: rows: %w", err)
	}
	return out, nil
}

func (s *store) Streams(ctx context.Context) ([]string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.conn == nil {
		return nil, errClosed
	}
	return s.streams(ctx)
}

// streams is sorted bytewise: SQLite's BINARY collation orders TEXT exactly as Go compares strings.
func (s *store) streams(ctx context.Context) ([]string, error) {
	rows, err := s.conn.QueryContext(ctx, `SELECT DISTINCT stream FROM events ORDER BY stream`)
	if err != nil {
		return nil, fmt.Errorf("journal: streams: %w", err)
	}
	defer rows.Close()
	var out []string
	for rows.Next() {
		var st string
		if err := rows.Scan(&st); err != nil {
			return nil, fmt.Errorf("journal: streams: %w", err)
		}
		out = append(out, st)
	}
	return out, rows.Err()
}

// Verify walks every stream: seq gapless from 1, each prev_hash the previous hash (64 zeros at
// seq 1), and each hash recomputed with the frozen v1 formula.
func (s *store) Verify(ctx context.Context) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.conn == nil {
		return errClosed
	}
	evs, err := s.scan(ctx, `SELECT stream, seq, type, data, prev_hash, hash FROM events ORDER BY stream, seq`)
	if err != nil {
		return err
	}
	var stream, prev string
	var want uint64
	for _, e := range evs {
		if e.Stream != stream {
			stream, prev, want = e.Stream, zeroHash, 1
		}
		if e.Seq != want {
			return fmt.Errorf("%w: stream %q has seq %d where %d belongs", ErrChainBroken, e.Stream, e.Seq, want)
		}
		if e.PrevHash != prev {
			return fmt.Errorf("%w: stream %q seq %d prev_hash does not link", ErrChainBroken, e.Stream, e.Seq)
		}
		h, err := eventHash(e.Stream, e.Seq, e.Type, e.Data, e.PrevHash)
		if err != nil {
			return err
		}
		if h != e.Hash {
			return fmt.Errorf("%w: stream %q seq %d hash does not verify", ErrChainBroken, e.Stream, e.Seq)
		}
		prev, want = e.Hash, want+1
	}
	return nil
}

func (s *store) StateHash(ctx context.Context) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.conn == nil {
		return "", errClosed
	}
	names, err := s.streams(ctx)
	if err != nil {
		return "", err
	}
	heads := make([]head, 0, len(names))
	for _, n := range names {
		seq, h, err := headOf(ctx, s.conn, n)
		if err != nil {
			return "", err
		}
		heads = append(heads, head{stream: n, seq: seq, hash: h})
	}
	return stateHash(heads)
}

// PutBlob and GetBlob belong to B1-01b (docs/vision-v3/14-BUILD-PLAN.md §6).
func (s *store) PutBlob(ctx context.Context, venture string, data []byte) (BlobRef, error) {
	return "", ErrNotImplemented
}

func (s *store) GetBlob(ctx context.Context, venture string, ref BlobRef) ([]byte, error) {
	return nil, ErrNotImplemented
}

// Close checkpoints the WAL into the database file, closes SQLite, then releases the writer lock.
// The lock goes last so no second writer can open the file while this one still holds it.
func (s *store) Close() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.conn == nil {
		return nil
	}
	var errs []error
	var busy, logFrames, done int
	if err := s.conn.QueryRowContext(context.Background(), "PRAGMA wal_checkpoint(TRUNCATE)").Scan(&busy, &logFrames, &done); err != nil {
		errs = append(errs, fmt.Errorf("journal: checkpoint: %w", err))
	} else if busy != 0 {
		errs = append(errs, errors.New("journal: checkpoint did not complete"))
	}
	errs = append(errs, s.conn.Close(), s.db.Close(), s.lock.release())
	s.conn = nil
	return errors.Join(errs...)
}
