// B1-04 remainder (B1-04r): the nightly drill scheduler. B1-04's acceptance is "SP2 B0-greedy + drill
// fixtures nightly" (docs/vision-v3/14-BUILD-PLAN.md §6; 09a §19 "SP2 B0-greedy and drill as nightly
// fixtures"). This file is the CONTRACT the job implements; the done-test that freezes it is
// fence_r_donetest_test.go.
//
//   - The spec names no window, so the window is the caller's: Start is an offset from local midnight
//     in Loc, Length is how long it stays open. A window may cross midnight. The night a window
//     belongs to is the date, in Loc, on which it opened, formatted "2006-01-02".
//   - Tick fires run at most once per night: when now is inside [opening, opening+Length) and that
//     night has not been claimed. The claim is a Journal append with ExpectSeq = the stream head,
//     made BEFORE run is called, so a restarted scheduler, or a second one over the same Journal,
//     never fires the same night twice. Nothing sleeps; the caller drives Tick and the clock.
//   - The outcome is journaled after run returns: Passed is run's nil error, Detail its message. A
//     failed run is recorded, not retried inside the same night.
//
// Open, NOT decided here: the window itself; a night missed entirely (fire late or skip); a crash
// between the claim and the outcome; and which code the production drill runs (the SP2 fixtures
// live in testdata today).
package lease

import (
	"context"
	"errors"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

// NightWindow is when a nightly job may fire.
type NightWindow struct {
	Start  time.Duration // offset from local midnight, in [0, 24h)
	Length time.Duration // in (0, 24h]
	Loc    *time.Location
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

// NewNightly returns the scheduler for job name, firing run inside w by the clock now.
func NewNightly(j journal.Journal, name string, w NightWindow, now func() time.Time, run func(context.Context) error) (Nightly, error) {
	if j == nil || now == nil || run == nil || w.Loc == nil {
		return nil, errors.New("lease: nightly: nil journal, clock, run or location")
	}
	if name == "" || w.Start < 0 || w.Start >= 24*time.Hour || w.Length <= 0 || w.Length > 24*time.Hour {
		return nil, errors.New("lease: nightly: bad name or window")
	}
	return nil, ErrNotImplemented
}
