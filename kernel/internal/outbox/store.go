package outbox

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

// Persistence. Every Operation is one Journal stream, named by its business key, so the stream's
// expect_seq is both the unique index of §7.1 (only one proposal can be seq 1) and the
// compare-and-set under every later transition. A second stream per Operation ID maps the ID back
// to its key stream. The payload is a Journal blob, content-addressed per venture.
//
// The Journal has one writer and holds an OS lock while open, so the outbox opens it per call and
// closes it before returning — and never holds it across a provider call. That is what lets a
// test process Open the same directory several times, and lets a replacement worker in. A call
// that finds the lock taken waits for it (lockTries x lockPoll), then fails.
const (
	journalFile = "outbox.db"
	keyPrefix   = "outbox/key/"
	idPrefix    = "outbox/id/"
	lockTries   = 6000
	lockPoll    = 5 * time.Millisecond
)

// UncertainDeadline: an attempt still unproven this long after it was journaled as dispatching
// goes to Human (§7 diagram, "uncertain -> human: deadline before proof"). Parameter.
const UncertainDeadline = 24 * time.Hour

// ErrUnknownOperation: no Operation with that ID was ever proposed here.
var ErrUnknownOperation = errors.New("outbox: unknown operation")

// ErrAmended: a re-proposal for an open business key carries another payload or class. §7.1
// makes that an explicit Amendment on the existing Operation, never a new Operation; amendments
// are not in this subset, so it is refused and nothing is written.
var ErrAmended = errors.New("outbox: payload or class differs from the open Operation; amend it")

// Event types, one per transition of §7's state diagram that this subset owns.
const (
	evProposed    = "outbox.proposed"
	evDispatching = "outbox.dispatching"
	evConfirmed   = "outbox.confirmed"
	evFailed      = "outbox.failed"
	evUncertain   = "outbox.uncertain"
	evHuman       = "outbox.human"
	evIndexed     = "outbox.indexed"
)

var stateOf = map[string]State{evProposed: Proposed, evDispatching: Dispatching, evConfirmed: Confirmed,
	evFailed: Failed, evUncertain: Uncertain, evHuman: Human}

var eventOf = map[State]string{Confirmed: evConfirmed, Failed: evFailed, Uncertain: evUncertain, Human: evHuman}

// legalFrom lists, for each state a recorded outcome moves to, the states it may leave. A receipt
// confirms even an attempt already handed to a human: it is the evidence the human was waiting for.
var legalFrom = map[State][]State{
	Confirmed: {Dispatching, Uncertain, Human},
	Failed:    {Dispatching, Uncertain},
	Uncertain: {Dispatching},
	Human:     {Dispatching, Uncertain},
}

// record is one event's data. Fields are omitted where an event type does not carry them.
type record struct {
	ID         string `json:"id,omitempty"`
	Venture    string `json:"venture,omitempty"`
	Verb       string `json:"verb,omitempty"`
	Target     string `json:"target,omitempty"`
	Ref        string `json:"business_ref,omitempty"`
	Class      Class  `json:"class,omitempty"`
	PayloadRef string `json:"payload_ref,omitempty"`
	Attempt    int    `json:"attempt,omitempty"`
	Worker     string `json:"worker,omitempty"`
	Idem       string `json:"idem,omitempty"`
	At         int64  `json:"at,omitempty"` // Deps.Clock, unix nanoseconds
	Reason     string `json:"reason,omitempty"`
	Stream     string `json:"stream,omitempty"` // evIndexed: the Operation's key stream
}

// opState is an Operation folded from its stream, with what the next append and attempt need.
type opState struct {
	Operation
	stream     string
	seq        uint64
	payloadRef journal.BlobRef
	idem       string    // the current attempt's provider idempotency key
	began      time.Time // when the current attempt was journaled as dispatching
}

type outbox struct {
	path string
	d    Deps
}

func open(dir string, d Deps) (Outbox, error) {
	if d.Clock == nil || d.Provider == nil {
		return nil, errors.New("outbox: Deps.Clock and Deps.Provider are required")
	}
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return nil, fmt.Errorf("outbox: %w", err)
	}
	o := &outbox{path: filepath.Join(dir, journalFile), d: d}
	// Create the database file before the Journal first sees it. journal.realPath reads "absent"
	// and then "present" as a dangling symlink when a concurrent first Open creates the file in
	// between; an empty file is a valid empty SQLite database. O_EXCL does not follow a symlink, so
	// a dangling one is left in place for the Journal to refuse.
	if f, err := os.OpenFile(o.path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600); err == nil {
		f.Close()
	} else if !errors.Is(err, os.ErrExist) {
		return nil, fmt.Errorf("outbox: %w", err)
	}
	// Open and close once, so a directory the Journal cannot use fails here and not mid-effect.
	if err := o.withJournal(context.Background(), func(journal.Journal) error { return nil }); err != nil {
		return nil, err
	}
	return o, nil
}

// withJournal runs fn holding the Journal, waiting out another holder, and closes it after.
func (o *outbox) withJournal(ctx context.Context, fn func(journal.Journal) error) error {
	for try := 0; ; try++ {
		j, err := journal.Open(o.path)
		if err == nil {
			ferr := fn(j)
			if cerr := j.Close(); ferr == nil && cerr != nil {
				return fmt.Errorf("outbox: closing journal: %w", cerr)
			}
			return ferr
		}
		if !errors.Is(err, journal.ErrLocked) || try >= lockTries {
			return fmt.Errorf("outbox: opening journal: %w", err)
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(lockPoll):
		}
	}
}

func (o *outbox) crash(p Point) {
	if o.d.Crash != nil {
		o.d.Crash(p)
	}
}

// keyStream names a business key's stream: a domain-tagged, length-prefixed digest, so no two
// keys share a stream and no field can bleed into its neighbour.
func keyStream(k BusinessKey) string {
	h := sha256.New()
	h.Write([]byte("avk.outbox.key.v1\n"))
	for _, f := range []string{k.Venture, k.Verb, k.Target, k.Ref} {
		var n [8]byte
		binary.BigEndian.PutUint64(n[:], uint64(len(f)))
		h.Write(n[:])
		h.Write([]byte(f))
	}
	return keyPrefix + hex.EncodeToString(h.Sum(nil))
}

func appendRecord(ctx context.Context, j journal.Journal, stream string, expect uint64, typ string, r record) error {
	data, err := json.Marshal(r)
	if err != nil {
		return err
	}
	_, err = j.Append(ctx, journal.Proposal{Stream: stream, ExpectSeq: expect, Type: typ, Data: data})
	return err
}

// fold replays an Operation's stream. The first event must be its proposal.
func fold(stream string, evs []journal.Event) (opState, error) {
	var s opState
	for i, ev := range evs {
		var r record
		if err := json.Unmarshal(ev.Data, &r); err != nil {
			return s, fmt.Errorf("outbox: %s seq %d: %w", stream, ev.Seq, err)
		}
		st, ok := stateOf[ev.Type]
		if !ok || (i == 0) != (ev.Type == evProposed) {
			return s, fmt.Errorf("outbox: %s seq %d: unexpected event %q", stream, ev.Seq, ev.Type)
		}
		switch ev.Type {
		case evProposed:
			s.Operation = Operation{ID: r.ID, Key: BusinessKey{Venture: r.Venture, Verb: r.Verb, Target: r.Target, Ref: r.Ref},
				Class: r.Class}
			s.stream, s.payloadRef = stream, journal.BlobRef(r.PayloadRef)
		case evDispatching:
			s.Attempt, s.idem, s.began = r.Attempt, r.Idem, time.Unix(0, r.At)
		default:
			if r.Attempt != s.Attempt {
				return s, fmt.Errorf("outbox: %s seq %d: outcome for attempt %d during attempt %d", stream, ev.Seq, r.Attempt, s.Attempt)
			}
		}
		s.State, s.seq = st, ev.Seq
	}
	if len(evs) == 0 {
		return s, ErrUnknownOperation
	}
	return s, nil
}

func readOp(ctx context.Context, j journal.Journal, stream string) (opState, error) {
	evs, err := j.Read(ctx, stream, 1)
	if err != nil {
		return opState{}, err
	}
	return fold(stream, evs)
}

func load(ctx context.Context, j journal.Journal, id string) (opState, error) {
	idx, err := j.Read(ctx, idPrefix+id, 1)
	if err != nil {
		return opState{}, err
	}
	if len(idx) == 0 {
		return opState{}, fmt.Errorf("%w: %q", ErrUnknownOperation, id)
	}
	var r record
	if err := json.Unmarshal(idx[0].Data, &r); err != nil {
		return opState{}, err
	}
	s, err := readOp(ctx, j, r.Stream)
	if err == nil && s.ID != id {
		err = fmt.Errorf("outbox: index for %q points at Operation %q", id, s.ID)
	}
	return s, err
}

func (o *outbox) Propose(ctx context.Context, e Effect) (Operation, error) {
	k := e.Key
	if k.Venture == "" || k.Verb == "" || k.Target == "" || k.Ref == "" {
		return Operation{}, errors.New("outbox: business key needs venture, verb, target and business_ref")
	}
	switch e.Class {
	case NativeKey, CheckBefore, Natural, AtMostOnce:
	default:
		return Operation{}, fmt.Errorf("outbox: unknown idempotency class %q", e.Class)
	}
	stream := keyStream(k)
	var s opState
	err := o.withJournal(ctx, func(j journal.Journal) error {
		var err error
		if s, err = readOp(ctx, j, stream); errors.Is(err, ErrUnknownOperation) {
			if err = o.create(ctx, j, stream, e); err == nil {
				s, err = readOp(ctx, j, stream)
			}
		}
		if err != nil {
			return err
		}
		if s.Class != e.Class || s.payloadRef != payloadRef(e.Payload) {
			return fmt.Errorf("%w: Operation %s", ErrAmended, s.ID)
		}
		// The index may be missing if a life died between the two appends; any proposer repairs it.
		if seq, _, err := j.Head(ctx, idPrefix+s.ID); err != nil || seq > 0 {
			return err
		}
		return appendRecord(ctx, j, idPrefix+s.ID, 0, evIndexed, record{Stream: stream})
	})
	return s.Operation, err
}

// create journals a new Operation for e: a fresh ULID, the payload as a blob, then seq 1 of the
// key stream — journal first (§7 diagram), and seq 1 is the unique index.
func (o *outbox) create(ctx context.Context, j journal.Journal, stream string, e Effect) error {
	id, err := newULID(o.d.Clock.Now())
	if err != nil {
		return err
	}
	ref, err := j.PutBlob(ctx, e.Key.Venture, e.Payload)
	if err != nil {
		return err
	}
	k := e.Key
	return appendRecord(ctx, j, stream, 0, evProposed, record{ID: id, Venture: k.Venture, Verb: k.Verb, Target: k.Target,
		Ref: k.Ref, Class: e.Class, PayloadRef: string(ref), At: o.d.Clock.Now().UnixNano()})
}

func payloadRef(p []byte) journal.BlobRef {
	sum := sha256.Sum256(p)
	return journal.BlobRef("sha256:" + hex.EncodeToString(sum[:]))
}

func (o *outbox) Dispatch(ctx context.Context, id string) (Operation, error) {
	var s opState
	var payload []byte
	err := o.withJournal(ctx, func(j journal.Journal) error {
		var err error
		if s, err = load(ctx, j, id); err != nil {
			return err
		}
		switch s.State {
		case Confirmed:
			return nil
		case Proposed, Failed:
		default: // dispatching, uncertain, human: an earlier attempt may have happened
			return fmt.Errorf("%w: Operation %s attempt %d is %s", ErrUncertain, id, s.Attempt, s.State)
		}
		if payload, err = j.GetBlob(ctx, s.Key.Venture, s.payloadRef); err != nil {
			return err
		}
		// The provider key is the Operation ID for every attempt: no provider here declares a
		// per-attempt key scope, which is the only case §7.1 allows a suffix in.
		n := s.Attempt + 1
		if err := appendRecord(ctx, j, s.stream, s.seq, evDispatching, record{Attempt: n, Worker: o.d.WorkerID,
			Idem: s.ID, At: o.d.Clock.Now().UnixNano()}); err != nil {
			return err
		}
		s.Attempt, s.State, s.idem = n, Dispatching, s.ID
		return nil
	})
	if err != nil || s.State == Confirmed {
		return s.Operation, err
	}
	o.crash(AfterDispatchingJournaled)
	perr := o.d.Provider.Do(ctx, s.idem, payload)
	switch {
	case perr == nil:
		o.crash(BeforeReceiptPersisted)
		return o.record(ctx, id, s.Attempt, Confirmed, "provider ok")
	case errors.Is(perr, ErrRejected):
		op, err := o.record(ctx, id, s.Attempt, Failed, perr.Error())
		return op, errors.Join(fmt.Errorf("outbox: Operation %s attempt %d: %w", id, s.Attempt, perr), err)
	default:
		to := Uncertain
		if s.Class == AtMostOnce {
			to = Human
		}
		op, err := o.record(ctx, id, s.Attempt, to, perr.Error())
		return op, errors.Join(fmt.Errorf("%w: Operation %s attempt %d: %v", ErrUncertain, id, s.Attempt, perr), err)
	}
}

// record journals attempt n's outcome. Recording the state already held is a no-op; an outcome
// for another attempt, or from a state that may not reach it, is refused and nothing is written.
func (o *outbox) record(ctx context.Context, id string, n int, to State, reason string) (Operation, error) {
	var s opState
	err := o.withJournal(ctx, func(j journal.Journal) error {
		var err error
		if s, err = load(ctx, j, id); err != nil || s.State == to && s.Attempt == n {
			return err
		}
		ok := s.Attempt == n
		if ok {
			ok = false
			for _, from := range legalFrom[to] {
				ok = ok || s.State == from
			}
		}
		if !ok {
			return fmt.Errorf("outbox: Operation %s is %s at attempt %d; refusing %s for attempt %d", id, s.State, s.Attempt, to, n)
		}
		if err := appendRecord(ctx, j, s.stream, s.seq, eventOf[to], record{Attempt: n, Worker: o.d.WorkerID,
			At: o.d.Clock.Now().UnixNano(), Reason: reason}); err != nil {
			return err
		}
		s.State = to
		return nil
	})
	return s.Operation, err
}

func (o *outbox) Reconcile(ctx context.Context) error {
	var open []opState
	err := o.withJournal(ctx, func(j journal.Journal) error {
		streams, err := j.Streams(ctx)
		if err != nil {
			return err
		}
		for _, st := range streams {
			if !strings.HasPrefix(st, keyPrefix) {
				continue
			}
			s, err := readOp(ctx, j, st)
			if err != nil {
				return err
			}
			if s.State == Dispatching || s.State == Uncertain {
				open = append(open, s)
			}
		}
		return nil
	})
	if err != nil {
		return err
	}
	var errs []error
	for _, s := range open {
		to, why := o.resolve(ctx, s)
		if to == s.State {
			continue
		}
		if _, err := o.record(ctx, s.ID, s.Attempt, to, why); err != nil {
			errs = append(errs, err)
		}
	}
	return errors.Join(errs...)
}

// resolve decides, by class, what an in-doubt attempt became. It never dispatches.
func (o *outbox) resolve(ctx context.Context, s opState) (State, string) {
	if s.Class == AtMostOnce {
		return Human, "at_most_once: never retried, never resolved by lookup"
	}
	p, err := o.d.Provider.Lookup(ctx, s.idem)
	o.crash(DuringReconcile)
	switch {
	case err != nil:
		p = Unknown
	case p == Present:
		return Confirmed, "lookup: present"
	case p == Absent:
		return Failed, "lookup: proven absent"
	}
	if !o.d.Clock.Now().Before(s.began.Add(UncertainDeadline)) {
		return Human, "no proof before the deadline"
	}
	why := "lookup: unknown"
	if err != nil {
		why = "lookup failed: " + err.Error()
	}
	return Uncertain, why
}

func (o *outbox) Get(ctx context.Context, id string) (Operation, error) {
	var s opState
	err := o.withJournal(ctx, func(j journal.Journal) error {
		var err error
		s, err = load(ctx, j, id)
		return err
	})
	return s.Operation, err
}

// newULID is a ULID: 48 bits of milliseconds from the outbox's Clock, 80 random bits, 26
// Crockford base32 characters.
func newULID(t time.Time) (string, error) {
	var b [16]byte
	ms := uint64(t.UnixMilli())
	for i := 0; i < 6; i++ {
		b[i] = byte(ms >> (40 - 8*i))
	}
	if _, err := rand.Read(b[6:]); err != nil {
		return "", err
	}
	const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
	hi, lo := binary.BigEndian.Uint64(b[:8]), binary.BigEndian.Uint64(b[8:])
	var out [26]byte
	for i := 25; i >= 0; i-- {
		out[i] = alphabet[lo&31]
		lo = lo>>5 | hi<<59
		hi >>= 5
	}
	return string(out[:]), nil
}
