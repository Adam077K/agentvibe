//go:build donetest

// Done-tests for B1-08 (docs/vision-v3/14-BUILD-PLAN.md): "`--dangerously-skip-permissions`
// refused before exec; an unattended 03:00 launch succeeds; the 121st launch in an hour is
// refused." Frozen by B0-17b; the file's sha256 is registered in build/done-tests/B0-17b.yml.
// Run: go -C kernel test -tags donetest ./internal/launcher/...
package launcher

import (
	"context"
	"errors"
	"testing"
	"time"
)

const (
	claudeBin    = "/opt/av/bin/claude"
	claudeDigest = "sha256:1111111111111111111111111111111111111111111111111111111111111111"
)

type fakeClock struct{ t time.Time }

func (c *fakeClock) Now() time.Time          { return c.t }
func (c *fakeClock) Advance(d time.Duration) { c.t = c.t.Add(d) }

// fakeExec records every call and never starts a process.
type fakeExec struct{ calls [][]string }

func (e *fakeExec) Run(_ context.Context, path string, argv []string) error {
	e.calls = append(e.calls, append([]string{path}, argv...))
	return nil
}

type fakeDigester map[string]string

func (d fakeDigester) Digest(path string) (string, error) {
	if s, ok := d[path]; ok {
		return s, nil
	}
	return "", errors.New("no such binary")
}

type receipts struct{ got []Receipt }

func (r *receipts) Append(x Receipt) error { r.got = append(r.got, x); return nil }

func grant() Grant {
	return Grant{
		Holder:         "kernel.launcher",
		Binaries:       []Binary{{Path: claudeBin, Digest: claudeDigest}},
		ForbiddenFlags: []string{"--dangerously-skip-permissions", "--bare", "-s danger-full-access"},
		Caps:           Caps{Concurrent: 12, PerHour: 120},
	}
}

// request is a launch that satisfies every per_launch_requires item.
func request(job string) Request {
	return Request{
		JobID:      job,
		Binary:     claudeBin,
		Argv:       []string{"-p", "--output-format", "stream-json", "--permission-mode", "acceptEdits"},
		Unattended: true,
		Requires: Prerequisites{
			AdmittedJob:    true,
			ToolLease:      []string{"Agent"},
			ContextProfile: "launch-pack",
			Isolation:      3,
			Headless:       true,
			ProviderMode:   "subscription",
			BudgetCapCents: 500,
			FencedLease:    "job://" + job + "#fence=1",
		},
	}
}

type rig struct {
	l     Launcher
	clock *fakeClock
	exec  *fakeExec
	rcpt  *receipts
}

func newRig(t *testing.T, at time.Time) rig {
	t.Helper()
	r := rig{clock: &fakeClock{t: at}, exec: &fakeExec{}, rcpt: &receipts{}}
	l, err := New(grant(), Deps{
		Clock:    r.clock,
		Exec:     r.exec,
		Digester: fakeDigester{claudeBin: claudeDigest},
		Receipts: r.rcpt,
	})
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	if l == nil {
		t.Fatal("New returned a nil Launcher and no error")
	}
	r.l = l
	return r
}

func at0300() time.Time { return time.Date(2026, 10, 13, 3, 0, 0, 0, time.UTC) }

// B1-08 · done-test 1: --dangerously-skip-permissions is refused before exec.
func TestB108ForbiddenFlagRefusedBeforeExec(t *testing.T) {
	cases := map[string][]string{
		"skip-permissions":        {"-p", "--dangerously-skip-permissions"},
		"skip-permissions=true":   {"-p", "--dangerously-skip-permissions=true"},
		"bare":                    {"-p", "--bare"},
		"sandbox danger two args": {"exec", "-s", "danger-full-access"},
		"sandbox danger joined":   {"exec", "-s=danger-full-access"},
	}
	for name, argv := range cases {
		t.Run(name, func(t *testing.T) {
			r := newRig(t, at0300())
			req := request("job-forbidden")
			req.Argv = argv
			_, err := r.l.Launch(context.Background(), req)
			if !errors.Is(err, ErrForbiddenFlag) {
				t.Errorf("Launch(%q) error = %v, want ErrForbiddenFlag", argv, err)
			}
			if len(r.exec.calls) != 0 {
				t.Errorf("exec called %d times for a forbidden flag, want 0", len(r.exec.calls))
			}
		})
	}
}

// B1-08 · done-test 2: an unattended 03:00 launch succeeds — one exec, one Receipt, no human.
func TestB108UnattendedLaunchAt0300Succeeds(t *testing.T) {
	r := newRig(t, at0300())
	req := request("job-0300")
	rc, err := r.l.Launch(context.Background(), req)
	if err != nil {
		t.Fatalf("unattended 03:00 Launch: %v, want success", err)
	}
	if len(r.exec.calls) != 1 {
		t.Fatalf("exec called %d times, want exactly 1", len(r.exec.calls))
	}
	if r.exec.calls[0][0] != claudeBin {
		t.Errorf("exec path = %q, want %q", r.exec.calls[0][0], claudeBin)
	}
	if len(r.rcpt.got) != 1 {
		t.Fatalf("receipts = %d, want exactly 1 per launch", len(r.rcpt.got))
	}
	got := r.rcpt.got[0]
	if got.JobID != req.JobID || got.Digest != claudeDigest || !got.At.Equal(at0300()) {
		t.Errorf("receipt = %+v, want job %q digest %q at %v", got, req.JobID, claudeDigest, at0300())
	}
	if rc.JobID != got.JobID || rc.Digest != got.Digest {
		t.Errorf("returned receipt %+v differs from the appended one %+v", rc, got)
	}
}

// B1-08 · done-test 3: the 121st launch in an hour is refused; the cap is a window, not a ban.
func TestB108HundredTwentyFirstLaunchInAnHourRefused(t *testing.T) {
	r := newRig(t, at0300())
	ctx := context.Background()
	const spacing = 29 * time.Second // 120 launches span 57m31s, inside one hour
	for i := 1; i <= 120; i++ {
		if _, err := r.l.Launch(ctx, request("job-rate")); err != nil {
			t.Fatalf("launch %d of 120: %v, want success", i, err)
		}
		r.clock.Advance(spacing)
	}
	execs := len(r.exec.calls)
	_, err := r.l.Launch(ctx, request("job-rate"))
	if !errors.Is(err, ErrRateCap) {
		t.Fatalf("121st launch in the hour: error = %v, want ErrRateCap", err)
	}
	if len(r.exec.calls) != execs {
		t.Errorf("121st launch reached exec (%d -> %d calls)", execs, len(r.exec.calls))
	}
	if len(r.rcpt.got) != 120 {
		t.Errorf("receipts = %d, want 120 (one per launch that ran)", len(r.rcpt.got))
	}
	// Paired legitimate case: once the first launch leaves the trailing hour, a launch succeeds.
	r.clock.t = at0300().Add(time.Hour + time.Second)
	if _, err := r.l.Launch(ctx, request("job-rate")); err != nil {
		t.Errorf("launch after the window slid: %v, want success (a cap that blocks everything fails)", err)
	}
}
