package journal

import (
	"context"
	"errors"
)

// The Journal's contract, frozen by B0-17a so that the done-tests for B1-01a (core) and B1-01b
// (hash chain + blobs) exist before either does (docs/vision-v3/14-BUILD-PLAN.md §6). Open returns
// ErrNotImplemented until B1-01a lands; nothing here holds logic. Storage is SQLite in WAL mode
// with a single writer (09a §4.1), but no SQLite type crosses this API, so the done-tests never
// import SQLite themselves.

// ErrNotImplemented is returned by every entry point until B1-01a/B1-01b implement them.
var ErrNotImplemented = errors.New("journal: not implemented")

// ErrSeqConflict: a Proposal's ExpectSeq is not the stream's current head seq (optimistic
// concurrency, 09a §3 propose_event.expect_seq). Nothing is written.
var ErrSeqConflict = errors.New("journal: expect_seq does not match the stream head")

// ErrLocked: another writer holds the Journal. There is exactly one writer (09a §4.1).
var ErrLocked = errors.New("journal: already open by another writer")

// ErrChainBroken: a stored event's hash or prev_hash does not verify. The Journal refuses to
// serve or extend a broken chain rather than repair it.
var ErrChainBroken = errors.New("journal: hash chain broken")

// ErrBlobNotFound: no blob with that ref exists for that venture.
var ErrBlobNotFound = errors.New("journal: blob not found")

// Proposal is one event to append (09a §3 propose_event).
type Proposal struct {
	Stream    string
	ExpectSeq uint64 // the stream head's seq before this append; 0 for an empty stream
	Type      string
	Data      []byte // stored verbatim in the database file (the B1-01b tamper test relies on it)
}

// Event is one stored event. Seq is per-stream, gapless, starting at 1. PrevHash of seq 1 is 64
// zeros. Hash and PrevHash are lowercase hex SHA-256 (09a §3 Event.prev_hash / hash).
//
// THE HASH FORMULA IS FROZEN (B0-17a; the B1-01b done-test recomputes it for every event).
// With u64(n) = n as 8 bytes big-endian, and raw(h) = the 32 bytes the hex string h encodes:
//
//	Hash = hex(SHA-256( "avk.event.v1\n"
//	                    || u64(len(Stream)) || Stream
//	                    || u64(Seq)
//	                    || u64(len(Type))   || Type
//	                    || u64(len(Data))   || Data
//	                    || raw(PrevHash) ))
//
// Every variable-length field is length-prefixed, so no two distinct events share an encoding.
// A field added to Event later (09a §3 lists ts, actor, label, …) goes into a new domain tag,
// "avk.event.v2\n", never silently into v1.
type Event struct {
	Stream   string
	Seq      uint64
	Type     string
	Data     []byte
	PrevHash string
	Hash     string
}

// BlobRef is a content address: "sha256:" + lowercase hex SHA-256 of the blob's bytes (09a §4.1:
// blobs are content-addressed per venture).
type BlobRef string

// Journal is the Kernel's single-writer event store.
type Journal interface {
	// Append writes p as the stream's next event, or returns an error wrapping ErrSeqConflict and
	// writes nothing. A nil error means the event is durable: it survives a SIGKILL.
	Append(ctx context.Context, p Proposal) (Event, error)
	// Read returns the stream's events with Seq >= fromSeq, in seq order.
	Read(ctx context.Context, stream string, fromSeq uint64) ([]Event, error)
	// Head returns the stream's last seq and hash; (0, "", nil) for an unknown stream.
	Head(ctx context.Context, stream string) (seq uint64, hash string, err error)
	// Streams lists every stream holding at least one event, sorted.
	Streams(ctx context.Context) ([]string, error)
	// Verify walks every stream's chain; on the first mismatch it returns an error wrapping
	// ErrChainBroken.
	Verify(ctx context.Context) error
	// StateHash digests every stream head; reopening the same file reproduces it exactly.
	// FROZEN: over the streams in Streams() order (sorted),
	//
	//	StateHash = hex(SHA-256( "avk.state.v1\n"
	//	                         || for each stream: u64(len(stream)) || stream
	//	                                             || u64(headSeq) || raw(headHash) ))
	//
	// Each head hash commits to its stream's whole history, so StateHash does too.
	StateHash(ctx context.Context) (string, error)
	// PutBlob stores data content-addressed under venture and returns its ref.
	PutBlob(ctx context.Context, venture string, data []byte) (BlobRef, error)
	// GetBlob returns the bytes stored under ref for venture, or an error wrapping
	// ErrBlobNotFound.
	GetBlob(ctx context.Context, venture string, ref BlobRef) ([]byte, error)
	// Close checkpoints the WAL into the database file and releases the writer lock.
	Close() error
}

// Open opens (creating if absent) the Journal at path as its single writer. It returns an error
// wrapping ErrLocked if another writer holds it. Opening a file whose chain does not verify either
// fails wrapping ErrChainBroken or returns a Journal that refuses that chain on every call.
func Open(path string) (Journal, error) {
	return nil, ErrNotImplemented
}
