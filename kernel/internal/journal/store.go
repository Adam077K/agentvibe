package journal

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"sort"
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

const selectEvents = `SELECT stream, seq, type, data, prev_hash, hash FROM events`

// store is the Journal over one SQLite file. There is one writer per file (the OS lock) and,
// inside it, one connection serialised by mu, so a head check and its insert can never interleave
// with another append.
//
// The chain is verified once, in full, when the file is opened. What verified is held in heads;
// every later call checks the rows it touches against it, so a row edited behind the Journal's
// back — before Open or while it is held — is noticed and its stream lands in broken. A broken
// stream is refused on every call that would serve, extend or digest it, and is never repaired:
// the other streams are still served.
type store struct {
	mu     sync.Mutex
	db     *sql.DB
	conn   *sql.Conn
	lock   *writerLock
	heads  map[string]head  // the verified head of every intact stream
	broken map[string]error // streams whose chain does not verify; each error wraps ErrChainBroken
}

var errClosed = errors.New("journal: closed")

func open(path string) (Journal, error) {
	if strings.ContainsAny(path, "?#") {
		return nil, fmt.Errorf("journal: path %q may not contain '?' or '#'", path)
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
	fail := func(err error) (*store, error) {
		conn.Close()
		db.Close()
		return nil, err
	}
	var mode string
	if err := conn.QueryRowContext(ctx, "PRAGMA journal_mode").Scan(&mode); err != nil || mode != "wal" {
		return fail(fmt.Errorf("journal: %s is not in WAL mode (got %q): %v", path, mode, err))
	}
	for _, stmt := range []string{schema, blobSchema} {
		if _, err := conn.ExecContext(ctx, stmt); err != nil {
			return fail(fmt.Errorf("journal: schema: %w", err))
		}
	}
	s := &store{db: db, conn: conn, lock: lock}
	heads, broken, err := s.walk(ctx)
	if err != nil {
		return fail(err)
	}
	s.heads, s.broken = heads, broken
	return s, nil
}

// scanEvent reads one row. A seq below 1 cannot be held by the schema; if a file holds one anyway
// the row is returned with its stream and an error wrapping ErrChainBroken.
func scanEvent(rows *sql.Rows) (Event, error) {
	var e Event
	var seq int64
	if err := rows.Scan(&e.Stream, &seq, &e.Type, &e.Data, &e.PrevHash, &e.Hash); err != nil {
		return Event{}, fmt.Errorf("journal: scan: %w", err)
	}
	if e.Data == nil {
		e.Data = []byte{}
	}
	if seq < 1 {
		return e, fmt.Errorf("%w: stream %q holds seq %d", ErrChainBroken, e.Stream, seq)
	}
	e.Seq = uint64(seq)
	return e, nil
}

// checkEvent verifies one event in place: it sits at seq want, links to prev (skipped when prev is
// ""), and its hash is the frozen v1 formula over its own content.
func checkEvent(e Event, want uint64, prev string) error {
	if e.Seq != want {
		return fmt.Errorf("%w: stream %q has seq %d where %d belongs", ErrChainBroken, e.Stream, e.Seq, want)
	}
	if prev != "" && e.PrevHash != prev {
		return fmt.Errorf("%w: stream %q seq %d prev_hash does not link", ErrChainBroken, e.Stream, e.Seq)
	}
	h, err := eventHash(e.Stream, e.Seq, e.Type, e.Data, e.PrevHash)
	if err != nil {
		return fmt.Errorf("stream %q seq %d: %w", e.Stream, e.Seq, err)
	}
	if h != e.Hash {
		return fmt.Errorf("%w: stream %q seq %d hash does not verify", ErrChainBroken, e.Stream, e.Seq)
	}
	return nil
}

// walk verifies every stream from seq 1: gapless seq, each prev_hash the previous hash (64 zeros
// at seq 1), each hash recomputed with the frozen v1 formula. It returns the head of every stream
// that verifies and the first failure of every stream that does not. Its error is only for a
// failure to read; a broken chain is a result, not an error.
func (s *store) walk(ctx context.Context) (map[string]head, map[string]error, error) {
	rows, err := s.conn.QueryContext(ctx, selectEvents+` ORDER BY stream, seq`)
	if err != nil {
		return nil, nil, fmt.Errorf("journal: query: %w", err)
	}
	defer rows.Close()
	heads := map[string]head{}
	broken := map[string]error{}
	var cur, prev string
	var want uint64
	first := true
	for rows.Next() {
		e, err := scanEvent(rows)
		if err != nil && !errors.Is(err, ErrChainBroken) {
			return nil, nil, err
		}
		if first || e.Stream != cur {
			cur, prev, want, first = e.Stream, zeroHash, 1, false
		}
		if broken[cur] != nil {
			continue
		}
		if err == nil {
			err = checkEvent(e, want, prev)
		}
		if err != nil {
			broken[cur] = err
			delete(heads, cur)
			continue
		}
		heads[cur] = head{stream: cur, seq: e.Seq, hash: e.Hash}
		prev, want = e.Hash, want+1
	}
	if err := rows.Err(); err != nil {
		return nil, nil, fmt.Errorf("journal: rows: %w", err)
	}
	return heads, broken, nil
}

// refuse records stream as broken by err (which wraps ErrChainBroken) and returns err.
func (s *store) refuse(stream string, err error) error {
	if s.broken[stream] == nil {
		s.broken[stream] = err
	}
	delete(s.heads, stream)
	return err
}

// brokenErr is the recorded failure for stream, or nil if its chain verified.
func (s *store) brokenErr(stream string) error {
	if err := s.broken[stream]; err != nil {
		return fmt.Errorf("%w (stream %q is refused until the Journal is reopened on a file that verifies)", err, stream)
	}
	return nil
}

// headRow reads the stream's last row in full, or reports an empty stream with ok false.
func headRow(ctx context.Context, q interface {
	QueryContext(context.Context, string, ...any) (*sql.Rows, error)
}, stream string) (e Event, ok bool, err error) {
	rows, err := q.QueryContext(ctx, selectEvents+` WHERE stream = ? ORDER BY seq DESC LIMIT 1`, stream)
	if err != nil {
		return Event{}, false, fmt.Errorf("journal: head of %q: %w", stream, err)
	}
	defer rows.Close()
	if !rows.Next() {
		return Event{}, false, rows.Err()
	}
	e, err = scanEvent(rows)
	return e, err == nil || errors.Is(err, ErrChainBroken), err
}

// checkHead confirms the stream's stored head row is the verified head: same seq, same hash, and
// a hash that still recomputes from the row's content. A mismatch marks the stream broken.
func (s *store) checkHead(ctx context.Context, q interface {
	QueryContext(context.Context, string, ...any) (*sql.Rows, error)
}, stream string) (head, error) {
	if err := s.brokenErr(stream); err != nil {
		return head{}, err
	}
	e, ok, err := headRow(ctx, q, stream)
	if err != nil && !errors.Is(err, ErrChainBroken) {
		return head{}, err
	}
	want, known := s.heads[stream]
	switch {
	case err != nil:
		return head{}, s.refuse(stream, err)
	case !ok && !known:
		return head{}, nil
	case !ok:
		return head{}, s.refuse(stream, fmt.Errorf("%w: stream %q lost its rows from seq 1 to %d", ErrChainBroken, stream, want.seq))
	case !known:
		return head{}, s.refuse(stream, fmt.Errorf("%w: stream %q holds rows the Journal never verified", ErrChainBroken, stream))
	case e.Seq != want.seq || e.Hash != want.hash:
		return head{}, s.refuse(stream, fmt.Errorf("%w: stream %q head is seq %d, the verified head is seq %d", ErrChainBroken, stream, e.Seq, want.seq))
	}
	if err := checkEvent(e, want.seq, ""); err != nil {
		return head{}, s.refuse(stream, err)
	}
	return want, nil
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
	if err := s.brokenErr(p.Stream); err != nil {
		return Event{}, err
	}
	tx, err := s.conn.BeginTx(ctx, nil)
	if err != nil {
		return Event{}, fmt.Errorf("journal: begin: %w", err)
	}
	defer tx.Rollback() // no-op after Commit
	hd, err := s.checkHead(ctx, tx, p.Stream)
	if err != nil {
		return Event{}, err
	}
	if hd.seq != p.ExpectSeq {
		return Event{}, fmt.Errorf("%w: stream %q is at seq %d, expect_seq %d", ErrSeqConflict, p.Stream, hd.seq, p.ExpectSeq)
	}
	prev := hd.hash
	if prev == "" {
		prev = zeroHash
	}
	data := p.Data
	if data == nil {
		data = []byte{}
	}
	ev := Event{Stream: p.Stream, Seq: hd.seq + 1, Type: p.Type, Data: append([]byte{}, data...), PrevHash: prev} // never nil: nil binds as NULL
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
	s.heads[ev.Stream] = head{stream: ev.Stream, seq: ev.Seq, hash: ev.Hash}
	return ev, nil
}

func (s *store) Head(ctx context.Context, stream string) (uint64, string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.conn == nil {
		return 0, "", errClosed
	}
	hd, err := s.checkHead(ctx, s.conn, stream)
	if err != nil {
		return 0, "", err
	}
	return hd.seq, hd.hash, nil
}

// Read serves only rows that verify. It re-reads the predecessor of fromSeq so the first returned
// event's prev_hash is checked against a recomputed hash, checks every row in the range, and, since
// the range always runs to the head, checks that the last row is the verified head.
func (s *store) Read(ctx context.Context, stream string, fromSeq uint64) ([]Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.conn == nil {
		return nil, errClosed
	}
	if err := s.brokenErr(stream); err != nil {
		return nil, err
	}
	if fromSeq > 1<<63-1 {
		return nil, nil
	}
	if fromSeq < 1 {
		fromSeq = 1
	}
	base := fromSeq
	if base > 1 {
		base-- // the predecessor, read to link the first returned event
	}
	evs, err := s.readRange(ctx, stream, base)
	if err != nil {
		return nil, err
	}
	hd, known := s.heads[stream]
	if len(evs) == 0 {
		if known && hd.seq >= base {
			return nil, s.refuse(stream, fmt.Errorf("%w: stream %q lost its rows from seq %d to %d", ErrChainBroken, stream, base, hd.seq))
		}
		return nil, nil
	}
	if !known {
		return nil, s.refuse(stream, fmt.Errorf("%w: stream %q holds rows the Journal never verified", ErrChainBroken, stream))
	}
	prev := ""
	if base == 1 {
		prev = zeroHash
	}
	for i, e := range evs {
		if err := checkEvent(e, base+uint64(i), prev); err != nil {
			return nil, s.refuse(stream, err)
		}
		prev = e.Hash
	}
	if last := evs[len(evs)-1]; last.Seq != hd.seq || last.Hash != hd.hash {
		return nil, s.refuse(stream, fmt.Errorf("%w: stream %q ends at seq %d, the verified head is seq %d", ErrChainBroken, stream, last.Seq, hd.seq))
	}
	if base < fromSeq {
		evs = evs[1:]
	}
	if len(evs) == 0 {
		return nil, nil
	}
	return evs, nil
}

func (s *store) readRange(ctx context.Context, stream string, from uint64) ([]Event, error) {
	rows, err := s.conn.QueryContext(ctx, selectEvents+` WHERE stream = ? AND seq >= ? ORDER BY seq`, stream, int64(from))
	if err != nil {
		return nil, fmt.Errorf("journal: query: %w", err)
	}
	defer rows.Close()
	var out []Event
	for rows.Next() {
		e, err := scanEvent(rows)
		if errors.Is(err, ErrChainBroken) {
			return nil, s.refuse(stream, err)
		}
		if err != nil {
			return nil, err
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

// Verify re-walks every stream from seq 1 and compares what verifies with the heads verified so
// far, so a stream truncated, extended or rewritten behind the Journal's back while it is open is
// caught as well. Every failure is recorded; the first, in stream order, is returned.
func (s *store) Verify(ctx context.Context) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.conn == nil {
		return errClosed
	}
	heads, broken, err := s.walk(ctx)
	if err != nil {
		return err
	}
	for name, err := range broken {
		s.refuse(name, err)
	}
	for name, hd := range heads {
		if want, ok := s.heads[name]; !ok && s.broken[name] == nil {
			s.refuse(name, fmt.Errorf("%w: stream %q holds rows the Journal never verified", ErrChainBroken, name))
		} else if ok && want != hd {
			s.refuse(name, fmt.Errorf("%w: stream %q head is seq %d, the verified head is seq %d", ErrChainBroken, name, hd.seq, want.seq))
		}
	}
	for name, want := range s.heads {
		if _, ok := heads[name]; !ok {
			s.refuse(name, fmt.Errorf("%w: stream %q lost its rows from seq 1 to %d", ErrChainBroken, name, want.seq))
		}
	}
	return s.firstBroken()
}

// firstBroken returns the recorded failure of the first broken stream in sorted order, or nil.
func (s *store) firstBroken() error {
	if len(s.broken) == 0 {
		return nil
	}
	names := make([]string, 0, len(s.broken))
	for n := range s.broken {
		names = append(names, n)
	}
	sort.Strings(names)
	return s.brokenErr(names[0])
}

// StateHash digests every stream head with the frozen v1 formula. It refuses while any stream is
// broken: a digest over a head that does not verify would commit to history nobody can check.
func (s *store) StateHash(ctx context.Context) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.conn == nil {
		return "", errClosed
	}
	if err := s.firstBroken(); err != nil {
		return "", err
	}
	names, err := s.streams(ctx)
	if err != nil {
		return "", err
	}
	heads := make([]head, 0, len(names))
	for _, n := range names {
		hd, err := s.checkHead(ctx, s.conn, n)
		if err != nil {
			return "", err
		}
		heads = append(heads, head{stream: n, seq: hd.seq, hash: hd.hash})
	}
	if len(heads) != len(s.heads) {
		for name, want := range s.heads {
			if i := sort.SearchStrings(names, name); i == len(names) || names[i] != name {
				return "", s.refuse(name, fmt.Errorf("%w: stream %q lost its rows from seq 1 to %d", ErrChainBroken, name, want.seq))
			}
		}
	}
	return stateHash(heads)
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
