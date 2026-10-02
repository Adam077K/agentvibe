package nouns

// The upcaster registry: readers say what a past decision meant, upcasters move how it is stored,
// and an upcaster is admitted only after replaying history shows every decision it touches still
// reads the same (09a §4.1).

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"sync"

	"github.com/Adam077K/agentvibe/kernel/internal/label"
)

type version struct {
	typ    string
	schema int
}

type step = func(data json.RawMessage) (json.RawMessage, error)

// Registry holds the readers and upcasters for event types that record decisions. Its zero value
// is not usable; call NewRegistry or Kernel.
//
// A Registry is safe for concurrent use. Readers and Up functions run while it holds its lock and
// must not call back into the Registry they are registered in.
type Registry struct {
	mu      sync.RWMutex
	readers map[version]Reader
	steps   map[version]step // keyed by the schema a step upcasts FROM
}

// NewRegistry returns an empty Registry.
func NewRegistry() *Registry {
	return &Registry{readers: map[version]Reader{}, steps: map[version]step{}}
}

// init makes a zero Registry hold empty maps rather than panic on its first registration. The
// caller holds r.mu.
func (r *Registry) init() {
	if r.readers == nil {
		r.readers = map[version]Reader{}
	}
	if r.steps == nil {
		r.steps = map[version]step{}
	}
}

// Kernel returns a new Registry holding every Reader and Upcaster the Kernel ships: at least the
// schema-1 Reader of DecisionCompiled, reading the canon §3 layout.
//
// It ships no upcaster: decision.compiled has one schema so far.
func Kernel() *Registry {
	r := NewRegistry()
	if err := r.AddReader(DecisionCompiled, 1, readDecisionCompiledV1); err != nil {
		panic(err) // an empty registry refuses nothing; reaching this is a programming error
	}
	return r
}

// AddReader registers read for eventType at schema. A second reader for the same pair is refused
// wrapping ErrDuplicate and the first stays in force.
func (r *Registry) AddReader(eventType string, schema int, read Reader) error {
	if eventType == "" || schema < 1 || read == nil {
		return fmt.Errorf("%w: AddReader(%q, %d) needs an event type, a schema >= 1 and a reader", ErrInvalid, eventType, schema)
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	r.init()
	k := version{eventType, schema}
	if _, ok := r.readers[k]; ok {
		return fmt.Errorf("%w: a reader for %s schema %d", ErrDuplicate, eventType, schema)
	}
	r.readers[k] = read
	return nil
}

// AddUpcaster installs u only if it keeps every past decision's meaning. For every event in history
// of type u.Type, the Outcome read from the event as written (at its own schema) must equal the
// Outcome read after upcasting it through the installed chain and then u. Any difference, or any
// read that fails, refuses u wrapping ErrMeaningChanged. Missing readers at u.From or u.From+1, or
// no history event of u.Type, refuse u wrapping ErrUnverifiable. A refused upcaster is not
// installed; the registry is unchanged.
//
// The check covers exactly the events u would touch: those whose replay through the installed
// chain reaches schema u.From. Each is read after every step of its replay, through u and through
// any installed steps above it, so a step is never judged only at its own output. If no history
// event of u.Type reaches u.From, u is unchecked and refused wrapping ErrUnverifiable.
//
// What the check cannot see: an Up that is not a pure function of its input (it reads a clock, a
// counter, or global state) can behave on history and differently afterwards.
func (r *Registry) AddUpcaster(u Upcaster, history []Event) error {
	if u.Type == "" || u.From < 1 || u.Up == nil {
		return fmt.Errorf("%w: an upcaster needs a type, a From >= 1 and an Up", ErrInvalid)
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	r.init()
	at := version{u.Type, u.From}
	if _, ok := r.steps[at]; ok {
		return fmt.Errorf("%w: an upcaster for %s from schema %d", ErrDuplicate, u.Type, u.From)
	}
	for _, s := range []int{u.From, u.From + 1} {
		if _, ok := r.readers[version{u.Type, s}]; !ok {
			return fmt.Errorf("%w: no reader for %s at schema %d", ErrUnverifiable, u.Type, s)
		}
	}
	// candidate is the installed chain with u added; it is consulted, never stored, until u passes.
	candidate := func(schema int) (step, bool) {
		if schema == u.From {
			return u.Up, true
		}
		f, ok := r.steps[version{u.Type, schema}]
		return f, ok
	}
	checked := 0
	for i, e := range history {
		if e.Type != u.Type || !r.reaches(e.Type, e.Schema, u.From) {
			continue
		}
		checked++
		where := fmt.Sprintf("history[%d] (id %q, %s schema %d)", i, e.ID, e.Type, e.Schema)
		want, err := r.read(e.Type, e.Schema, e.Data)
		if err != nil {
			return fmt.Errorf("%w: %s as written cannot be read: %v", ErrMeaningChanged, where, err)
		}
		data, schema := e.Data, e.Schema // apply copies before an Up sees it
		for {
			f, ok := candidate(schema)
			if !ok {
				break
			}
			data, err = apply(f, data)
			schema++
			if err != nil {
				return fmt.Errorf("%w: %s fails to upcast to schema %d: %v", ErrMeaningChanged, where, schema, err)
			}
			got, err := r.read(e.Type, schema, data)
			if err != nil {
				return fmt.Errorf("%w: %s upcast to schema %d cannot be read: %v", ErrMeaningChanged, where, schema, err)
			}
			if got != want {
				return fmt.Errorf("%w: %s was decided as %+v and reads %+v at schema %d", ErrMeaningChanged, where, want, got, schema)
			}
		}
	}
	if checked == 0 {
		return fmt.Errorf("%w: history holds no %s event that replays through schema %d", ErrUnverifiable, u.Type, u.From)
	}
	r.steps[at] = u.Up
	return nil
}

// reaches reports whether data of typ at schema from replays, through installed steps, to schema to.
// The caller holds r.mu.
func (r *Registry) reaches(typ string, from, to int) bool {
	for s := from; s < to; s++ {
		if _, ok := r.steps[version{typ, s}]; !ok {
			return false
		}
	}
	return from <= to
}

// read applies the reader for (typ, schema) to a copy of data. The caller holds r.mu.
func (r *Registry) read(typ string, schema int, data json.RawMessage) (Outcome, error) {
	read, ok := r.readers[version{typ, schema}]
	if !ok {
		return Outcome{}, fmt.Errorf("no reader for %s at schema %d", typ, schema)
	}
	return read(clone(data))
}

// apply runs one step on a copy of data and requires one JSON value back, compacted, that scanWire
// accepts.
func apply(f step, data json.RawMessage) (json.RawMessage, error) {
	out, err := f(clone(data))
	if err != nil {
		return nil, err
	}
	var buf bytes.Buffer
	if err := json.Compact(&buf, out); err != nil {
		return nil, fmt.Errorf("upcaster returned data that is not one JSON value: %v", err)
	}
	if err := scanWire(buf.Bytes()); err != nil {
		return nil, fmt.Errorf("upcaster returned data the wire refuses: %v", err)
	}
	return buf.Bytes(), nil
}

// Upcast returns a copy of e with its data upcast through every installed upcaster for e.Type,
// from e.Schema to the latest version. Every envelope field but Schema and Data is unchanged, and
// e itself is not modified (its Data is not aliased).
//
// Replay stops at the first schema with no installed upcaster; that schema is the latest version
// e's data can reach.
func (r *Registry) Upcast(e Event) (Event, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := cloneEvent(e)
	for {
		f, ok := r.steps[version{e.Type, out.Schema}]
		if !ok {
			return out, nil
		}
		data, err := apply(f, out.Data)
		if err != nil {
			return Event{}, fmt.Errorf("nouns: upcast %s %q from schema %d: %w", e.Type, e.ID, out.Schema, err)
		}
		out.Data, out.Schema = data, out.Schema+1
	}
}

// Outcome reads e's decision with the Reader registered for (e.Type, e.Schema).
func (r *Registry) Outcome(e Event) (Outcome, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	o, err := r.read(e.Type, e.Schema, e.Data)
	if err != nil {
		return Outcome{}, fmt.Errorf("nouns: outcome of %q: %w", e.ID, err)
	}
	return o, nil
}

func clone(b json.RawMessage) json.RawMessage {
	if b == nil {
		return nil
	}
	return append(make(json.RawMessage, 0, len(b)), b...)
}

// cloneEvent copies e so that nothing the copy holds is shared with e: a caller may change the
// copy's data, actor, rationale or label without reaching the stored event.
func cloneEvent(e Event) Event {
	c := e
	c.Actor, c.Rationale, c.Data = clone(e.Actor), clone(e.Rationale), clone(e.Data)
	c.Label = label.Clone(e.Label)
	return c
}

// readDecisionCompiledV1 reads the canon §3 Decision Contract (00-CANON §3): the operation under
// action.operation_id, and disposition, effect_class and door at the top level. Every value must be
// in its closed set; a reader that let an unknown value through would make "the meaning did not
// change" uncheckable.
//
// Keys are matched exactly. An integer outside ±(2^53-1) anywhere in the data, a duplicate key
// anywhere in it, or a key that differs from one
// this reader reads only by case ("Disposition", "DISPOSITION"), is refused: encoding/json's
// case-insensitive, last-one-wins matching would let a second spelling overrule the decision, and
// would let an upcaster that renames a key's case pass the meaning check.
func readDecisionCompiledV1(data json.RawMessage) (Outcome, error) {
	fail := func(format string, args ...any) (Outcome, error) {
		return Outcome{}, fmt.Errorf("%s data: %s", DecisionCompiled, fmt.Sprintf(format, args...))
	}
	if err := scanWire(data); err != nil {
		return fail("%v", err)
	}
	top, err := members(data, "action", "disposition", "effect_class", "door")
	if err != nil {
		return fail("%v", err)
	}
	var o Outcome
	var errs []error
	if raw, ok := top["action"]; !ok {
		errs = append(errs, errors.New("action is missing"))
	} else if action, err := members(raw, "operation_id"); err != nil {
		errs = append(errs, fmt.Errorf("action %v", err))
	} else if id, err := stringOf("action.operation_id", action["operation_id"]); err != nil || id == "" {
		errs = append(errs, errors.New("action.operation_id is missing, empty or not a string"))
	} else {
		o.OperationID = id
	}
	pick := func(name string, into *string, allowed ...string) {
		raw, ok := top[name]
		if !ok {
			errs = append(errs, fmt.Errorf("%s is missing", name))
			return
		}
		v, err := stringOf(name, raw)
		if err != nil {
			errs = append(errs, err)
			return
		}
		for _, a := range allowed {
			if v == a {
				*into = a
				return
			}
		}
		errs = append(errs, fmt.Errorf("%s is %q; want one of %v", name, v, allowed))
	}
	pick("disposition", &o.Disposition, "auto", "notify", "ask", "co_sign", "never", "held")
	pick("effect_class", &o.EffectClass, "R0", "R1", "R2", "R3", "R4")
	pick("door", &o.Door, "two_way", "costly_reversible", "one_way")
	if err := errors.Join(errs...); err != nil {
		return fail("%v", err)
	}
	return o, nil
}
