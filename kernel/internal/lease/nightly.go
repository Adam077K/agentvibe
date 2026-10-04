// B1-04 remainder (B1-04r): the nightly drill scheduler. B1-04's acceptance is "SP2 B0-greedy + drill
// fixtures nightly" (docs/vision-v3/14-BUILD-PLAN.md §6; 09a §19 "SP2 B0-greedy and drill as nightly
// fixtures"). This file is the CONTRACT the job implements; the done-test that freezes it is
// fence_r_donetest_test.go.
//
//   - Start is an offset from local midnight in Loc, Length is how long the window stays open. A
//     window may cross midnight. The night a window belongs to is the date, in Loc, on which it
//     opened, formatted "2006-01-02". The drill's window is DrillWindow: 23:00–04:00 local
//     (orchestrator ruling 2026-10-03). A night with no Tick inside its window is missed: no
//     catch-up, nothing recorded for it, the next window fires as usual.
//   - Tick fires run at most once per night: when now is inside [opening, opening+Length) and that
//     night has not been claimed. The claim is a Journal append with ExpectSeq = the stream head,
//     made BEFORE run is called, so a restarted scheduler, or a second one over the same Journal,
//     never fires the same night twice. Nothing sleeps; the caller drives Tick and the clock.
//   - The outcome is journaled after run returns: Passed is run's nil error, Detail its message. A
//     failed run is recorded, not retried inside the same night. A night claimed with no outcome
//     journaled (a crash between the two) reads as a failed run and is not retried.
//
// Open, NOT decided here: which code the production drill runs (the SP2 fixtures live in testdata
// today).
package lease

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

// NightWindow is when a nightly job may fire.
type NightWindow struct {
	Start  time.Duration // offset from local midnight, in [0, 24h)
	Length time.Duration // in (0, 24h]
	Loc    *time.Location
}

// DrillWindow is the SP2 drill's window, 23:00–04:00 in loc.
func DrillWindow(loc *time.Location) NightWindow {
	return NightWindow{Start: 23 * time.Hour, Length: 5 * time.Hour, Loc: loc}
}

// NightlyRun is one night's journaled run.
type NightlyRun struct {
	Night  string // "2006-01-02" in the window's Loc, the date the window opened
	Passed bool
	Detail string
}

// Nightly fires one job once per nightly window.
type Nightly interface {
	// Tick fires the job if now is inside a window whose night is unclaimed, and reports whether
	// it fired.
	Tick(ctx context.Context) (bool, error)
	// Runs lists the journaled runs, oldest night first.
	Runs(ctx context.Context) ([]NightlyRun, error)
}

// NightlyStream returns the Journal stream holding name's nightly claims and outcomes.
func NightlyStream(name string) string { return "nightly:" + name }

// Event types of a nightly stream. A claim is journaled before the run, its outcome after.
const (
	typeNightClaimed  = "nightly.claimed"
	typeNightFinished = "nightly.finished"
)

const nightFormat = "2006-01-02"

// noOutcome is the Detail of a night that was claimed and never finished: the process died between
// the two appends.
const noOutcome = "claimed with no outcome journaled; read as a failed run"

// nightData is both event types' data. Passed and Detail are meaningful on typeNightFinished only.
type nightData struct {
	Night  string `json:"night"`
	At     int64  `json:"at_unix_nano"`
	Passed bool   `json:"passed,omitempty"`
	Detail string `json:"detail,omitempty"`
}

type nightly struct {
	j    journal.Journal
	name string
	w    NightWindow
	now  func() time.Time
	run  func(context.Context) error
}

// NewNightly returns the scheduler for job name, firing run inside w by the clock now.
func NewNightly(j journal.Journal, name string, w NightWindow, now func() time.Time, run func(context.Context) error) (Nightly, error) {
	if j == nil || now == nil || run == nil || w.Loc == nil {
		return nil, errors.New("lease: nightly: nil journal, clock, run or location")
	}
	if name == "" || w.Start < 0 || w.Start >= 24*time.Hour || w.Length <= 0 || w.Length > 24*time.Hour {
		return nil, errors.New("lease: nightly: bad name or window")
	}
	return &nightly{j: j, name: name, w: w, now: now, run: run}, nil
}

// night returns the night whose window is open at now, if any. A window opens at Start past local
// midnight and Length is at most a day, so only today's and yesterday's can contain now.
func (n *nightly) night(now time.Time) (string, bool) {
	y, m, d := now.In(n.w.Loc).Date()
	for back := 1; back >= 0; back-- {
		midnight := time.Date(y, m, d-back, 0, 0, 0, 0, n.w.Loc)
		open := midnight.Add(n.w.Start)
		if !now.Before(open) && now.Before(open.Add(n.w.Length)) {
			return midnight.Format(nightFormat), true
		}
	}
	return "", false
}

// nightState is the stream folded: the claimed nights in claim order, and the outcome of each night
// that has one.
type nightState struct {
	seq      uint64
	order    []string
	finished map[string]nightData
}

func (n *nightly) load(ctx context.Context) (nightState, error) {
	stream := NightlyStream(n.name)
	evs, err := n.j.Read(ctx, stream, 1)
	if err != nil {
		return nightState{}, fmt.Errorf("lease: read %s: %w", stream, err)
	}
	st := nightState{finished: map[string]nightData{}}
	claimed := map[string]bool{}
	for i, ev := range evs {
		if ev.Seq != uint64(i)+1 {
			return nightState{}, corrupt(ev, "holds seq %d at position %d", ev.Seq, i+1)
		}
		var d nightData
		if err := json.Unmarshal(ev.Data, &d); err != nil {
			return nightState{}, corrupt(ev, "%v", err)
		}
		if _, err := time.Parse(nightFormat, d.Night); err != nil {
			return nightState{}, corrupt(ev, "night %q: %v", d.Night, err)
		}
		switch ev.Type {
		case typeNightClaimed:
			if claimed[d.Night] {
				return nightState{}, corrupt(ev, "night %s claimed twice", d.Night)
			}
			claimed[d.Night] = true
			st.order = append(st.order, d.Night)
		case typeNightFinished:
			if _, done := st.finished[d.Night]; done || !claimed[d.Night] {
				return nightState{}, corrupt(ev, "night %s finished twice or never claimed", d.Night)
			}
			st.finished[d.Night] = d
		default:
			return nightState{}, corrupt(ev, "unknown event type")
		}
		st.seq = ev.Seq
	}
	return st, nil
}

func (n *nightly) append(ctx context.Context, expect uint64, typ string, d nightData) error {
	data, err := json.Marshal(d)
	if err != nil {
		return err
	}
	_, err = n.j.Append(ctx, journal.Proposal{Stream: NightlyStream(n.name), ExpectSeq: expect, Type: typ, Data: data})
	return err
}

func (n *nightly) Tick(ctx context.Context) (bool, error) {
	now := n.now()
	night, open := n.night(now)
	if !open {
		return false, nil
	}
	// The claim is decided by the Journal: it admits one append at the head this read saw, and
	// refuses the rest, who re-read and find the night claimed.
	for attempt := 0; attempt < maxAttempts; attempt++ {
		if err := ctx.Err(); err != nil {
			return false, err
		}
		st, err := n.load(ctx)
		if err != nil {
			return false, err
		}
		for _, claimed := range st.order {
			if claimed == night {
				return false, nil
			}
		}
		err = n.append(ctx, st.seq, typeNightClaimed, nightData{Night: night, At: now.UnixNano()})
		if errors.Is(err, journal.ErrSeqConflict) {
			continue
		}
		if err != nil {
			return false, fmt.Errorf("lease: claim night %s of %s: %w", night, n.name, err)
		}
		return true, n.finish(ctx, night)
	}
	return false, fmt.Errorf("lease: claim night %s of %s: gave up after %d contended attempts", night, n.name, maxAttempts)
}

// finish runs the job for a night this scheduler has claimed and journals the outcome. The outcome
// is written even if ctx was cancelled during the run, so a cancelled night reads as the failure it
// was and not as a crash.
func (n *nightly) finish(ctx context.Context, night string) error {
	runErr := n.run(ctx)
	d := nightData{Night: night, At: n.now().UnixNano(), Passed: runErr == nil}
	if runErr != nil {
		d.Detail = runErr.Error()
	}
	out := context.WithoutCancel(ctx)
	for attempt := 0; attempt < maxAttempts; attempt++ {
		st, err := n.load(out)
		if err != nil {
			return err
		}
		err = n.append(out, st.seq, typeNightFinished, d)
		if errors.Is(err, journal.ErrSeqConflict) {
			continue
		}
		if err != nil {
			return fmt.Errorf("lease: record night %s of %s: %w", night, n.name, err)
		}
		return nil
	}
	return fmt.Errorf("lease: record night %s of %s: gave up after %d contended attempts", night, n.name, maxAttempts)
}

func (n *nightly) Runs(ctx context.Context) ([]NightlyRun, error) {
	st, err := n.load(ctx)
	if err != nil {
		return nil, err
	}
	runs := make([]NightlyRun, 0, len(st.order))
	for _, night := range st.order {
		r := NightlyRun{Night: night, Detail: noOutcome}
		if d, done := st.finished[night]; done {
			r.Passed, r.Detail = d.Passed, d.Detail
		}
		runs = append(runs, r)
	}
	sort.Slice(runs, func(a, b int) bool { return runs[a].Night < runs[b].Night })
	return runs, nil
}
