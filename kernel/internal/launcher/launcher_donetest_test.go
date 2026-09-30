//go:build donetest

// Done-tests for B1-08 (docs/vision-v3/14-BUILD-PLAN.md): "`--dangerously-skip-permissions`
// refused before exec; an unattended 03:00 launch succeeds; the 121st launch in an hour is
// refused." Frozen by B0-17b; the file's sha256 is registered in build/done-tests/B0-17b.yml.
// Run: go -C kernel test -tags donetest ./internal/launcher/...
package launcher

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strings"
	"testing"
	"time"
)

const (
	claudeBin    = "/opt/av/bin/claude"
	claudeDigest = "sha256:1111111111111111111111111111111111111111111111111111111111111111"
	codexBin     = "/opt/av/bin/codex"
	codexDigest  = "sha256:2222222222222222222222222222222222222222222222222222222222222222"
)

// The pinned launch lines of 09a §8, as templates. "<name>" tokens are slots.
var (
	claudeTokens = []string{"-p", "--setting-sources", "<profile>", "--settings", "<job.json>",
		"--agents", "<compiled.json>", "--agent", "<record>", "--permission-mode", "dontAsk",
		"--allowedTools", "<allowed>", "--disallowedTools", "<forbidden>",
		"--output-format", "stream-json", "--verbose", "--json-schema", "<f>",
		"--max-budget-usd", "<B>", "--session-id", "<uuid>"}
	codexTokens = []string{"exec", "-C", "<worktree>", "-s", "workspace-write", "-p", "<profile>",
		"--json", "--output-schema", "<f>", "-o", "<result.json>", "--ephemeral"}
	slotValues = map[string]string{
		"<profile>": "project", "<job.json>": "/run/av/job-1/job.json", "<compiled.json>": "/run/av/job-1/agents.json",
		"<record>": "builder", "<allowed>": "Read,Edit,Bash", "<forbidden>": "Agent,Task",
		"<f>": "/run/av/job-1/schema.json", "<B>": "5", "<uuid>": "0192f7a4-6f1e-7c3a-9b1d-3c5e7a9b1d3c",
		"<worktree>": "/w/job-1", "<result.json>": "/run/av/job-1/result.json",
	}
)

// argvDigest is the frozen digest encoding documented on ArgvTemplate.
func argvDigest(tokens []string) string {
	s := sha256.Sum256([]byte(strings.Join(tokens, "\x00")))
	return "sha256:" + hex.EncodeToString(s[:])
}

// render fills a template's slots with slotValues.
func render(tokens []string) []string {
	out := make([]string, len(tokens))
	for i, tok := range tokens {
		if v, ok := slotValues[tok]; ok {
			out[i] = v
		} else {
			out[i] = tok
		}
	}
	return out
}

// with returns a copy of argv with argv[i] replaced (or, for i == len, appended).
func with(argv []string, i int, v ...string) []string {
	out := append([]string{}, argv[:i]...)
	out = append(out, v...)
	if i < len(argv) {
		out = append(out, argv[i+1:]...)
	}
	return out
}

func index(argv []string, tok string) int {
	for i, a := range argv {
		if a == tok {
			return i
		}
	}
	panic("token not in argv: " + tok)
}

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
		Holder:   "kernel.launcher",
		Binaries: []Binary{{Path: claudeBin, Digest: claudeDigest}, {Path: codexBin, Digest: codexDigest}},
		Templates: []ArgvTemplate{
			{Binary: claudeBin, Tokens: claudeTokens, Digest: argvDigest(claudeTokens)},
			{Binary: codexBin, Tokens: codexTokens, Digest: argvDigest(codexTokens)},
		},
		ForbiddenFlags: []string{"--dangerously-skip-permissions", "--bare", "-s danger-full-access"},
		Caps:           Caps{Concurrent: 12, PerHour: 120},
	}
}

func deps(r *rig) Deps {
	return Deps{
		Clock:    r.clock,
		Exec:     r.exec,
		Digester: fakeDigester{claudeBin: claudeDigest, codexBin: codexDigest},
		Receipts: r.rcpt,
	}
}

// request is a launch that satisfies every per_launch_requires item.
func request(job string) Request {
	return Request{
		JobID:      job,
		Binary:     claudeBin,
		Argv:       render(claudeTokens),
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
	l, err := New(grant(), deps(&r))
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

// B1-08 · done-test 1: --dangerously-skip-permissions is refused before exec — and so is every
// argv that is not a pinned template. A denylist alone fails this test: it lets
// "--permission-mode bypassPermissions" through.
func TestB108ForbiddenFlagRefusedBeforeExec(t *testing.T) {
	good := render(claudeTokens)
	pm := index(good, "--permission-mode")
	cases := []struct {
		name   string
		binary string
		argv   []string
	}{
		{"skip-permissions appended", claudeBin, with(good, len(good), "--dangerously-skip-permissions")},
		{"skip-permissions=true appended", claudeBin, with(good, len(good), "--dangerously-skip-permissions=true")},
		{"bare prepended", claudeBin, with(good, 0, "--bare", good[0])},
		{"skip-permissions in a slot", claudeBin, with(good, index(good, "builder"), "--dangerously-skip-permissions")},
		{"bypassPermissions for dontAsk", claudeBin, with(good, pm+1, "bypassPermissions")},
		{"acceptEdits for dontAsk", claudeBin, with(good, pm+1, "acceptEdits")},
		{"equivalent spelling --permission-mode=dontAsk", claudeBin, with(with(good, pm, "--permission-mode=dontAsk"), pm+1)},
		{"unknown flag appended", claudeBin, with(good, len(good), "--add-dir", "/")},
		{"pinned flag repeated", claudeBin, with(good, len(good), "--verbose")},
		{"two pinned pairs reordered", claudeBin, append(append(append([]string{}, good[:1]...), good[3:5]...), append(append([]string{}, good[1:3]...), good[5:]...)...)},
		{"pinned token dropped", claudeBin, with(good, index(good, "--verbose"))},
		{"empty argv", claudeBin, nil},
		{"codex argv on the claude binary", claudeBin, render(codexTokens)},
		{"codex danger-full-access", codexBin, with(render(codexTokens), index(render(codexTokens), "workspace-write"), "danger-full-access")},
		{"codex -s=danger-full-access", codexBin, with(with(render(codexTokens), 3, "-s=danger-full-access"), 4)},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			r := newRig(t, at0300())
			req := request("job-refused")
			req.Binary, req.Argv = tc.binary, tc.argv
			_, err := r.l.Launch(context.Background(), req)
			if !errors.Is(err, ErrArgvNotPinned) && !errors.Is(err, ErrForbiddenFlag) {
				t.Errorf("Launch(%q) error = %v, want ErrArgvNotPinned or ErrForbiddenFlag", tc.argv, err)
			}
			if len(r.exec.calls) != 0 || len(r.rcpt.got) != 0 {
				t.Errorf("refused argv reached exec (%d calls, %d receipts), want 0", len(r.exec.calls), len(r.rcpt.got))
			}
		})
	}

	t.Run("paired: both pinned lines run", func(t *testing.T) {
		r := newRig(t, at0300())
		for _, req := range []Request{request("job-claude"), func() Request {
			q := request("job-codex")
			q.Binary, q.Argv = codexBin, render(codexTokens)
			return q
		}()} {
			if _, err := r.l.Launch(context.Background(), req); err != nil {
				t.Errorf("pinned %s launch: %v, want success", req.Binary, err)
			}
		}
	})

	t.Run("grant integrity", func(t *testing.T) {
		r := rig{clock: &fakeClock{t: at0300()}, exec: &fakeExec{}, rcpt: &receipts{}}
		g := grant()
		g.Templates[0].Digest = argvDigest(append(append([]string{}, claudeTokens...), "--add-dir", "/"))
		if _, err := New(g, deps(&r)); !errors.Is(err, ErrGrant) {
			t.Errorf("New with a template whose digest does not match its tokens: %v, want ErrGrant", err)
		}
		g = grant()
		bad := with(claudeTokens, index(claudeTokens, "dontAsk"), "dontAsk", "--dangerously-skip-permissions")
		g.Templates[0] = ArgvTemplate{Binary: claudeBin, Tokens: bad, Digest: argvDigest(bad)}
		if _, err := New(g, deps(&r)); !errors.Is(err, ErrForbiddenFlag) {
			t.Errorf("New with a pinned template carrying a forbidden flag: %v, want ErrForbiddenFlag", err)
		}
	})
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
	if got.JobID != req.JobID || got.Digest != claudeDigest || got.Template != argvDigest(claudeTokens) || !got.At.Equal(at0300()) {
		t.Errorf("receipt = %+v, want job %q digest %q template %q at %v", got, req.JobID, claudeDigest, argvDigest(claudeTokens), at0300())
	}
	if rc.JobID != got.JobID || rc.Digest != got.Digest {
		t.Errorf("returned receipt %+v differs from the appended one %+v", rc, got)
	}
}

// B1-08 · done-test 3: the 121st launch in an hour is refused. "An hour" is a ROLLING 60-minute
// window: a counter that resets on the clock hour, or all at once, fails. Every run starts
// mid-hour and crosses an hour boundary.
func TestB108HundredTwentyFirstLaunchInAnHourRefused(t *testing.T) {
	ctx := context.Background()
	launch := func(r rig) error { _, err := r.l.Launch(ctx, request("job-rate")); return err }
	refused := func(t *testing.T, r rig, when string) {
		t.Helper()
		execs, rcpts := len(r.exec.calls), len(r.rcpt.got)
		if err := launch(r); !errors.Is(err, ErrRateCap) {
			t.Fatalf("%s: error = %v, want ErrRateCap", when, err)
		}
		if len(r.exec.calls) != execs || len(r.rcpt.got) != rcpts {
			t.Errorf("%s: a refused launch reached exec or wrote a receipt", when)
		}
	}

	t.Run("spread across 04:00", func(t *testing.T) {
		start := time.Date(2026, 10, 13, 3, 17, 23, 0, time.UTC)
		r := newRig(t, start)
		for i := 0; i < 120; i++ { // 03:17:23 .. 04:14:54, 29s apart
			r.clock.t = start.Add(time.Duration(i) * 29 * time.Second)
			if err := launch(r); err != nil {
				t.Fatalf("launch %d of 120 at %s: %v, want success", i+1, r.clock.t.Format("15:04:05"), err)
			}
		}
		r.clock.t = start.Add(57*time.Minute + 30*time.Second) // 04:14:53 + ..., still < 60m after the first
		refused(t, r, "121st launch 57m30s after the first")
		if len(r.rcpt.got) != 120 {
			t.Errorf("receipts = %d, want 120 (one per launch that ran)", len(r.rcpt.got))
		}
	})

	t.Run("burst at 03:59 then 04:00", func(t *testing.T) {
		start := time.Date(2026, 10, 13, 3, 59, 0, 0, time.UTC)
		r := newRig(t, start)
		for i := 0; i < 120; i++ { // 03:59:00.0 .. 03:59:59.5
			r.clock.t = start.Add(time.Duration(i) * 500 * time.Millisecond)
			if err := launch(r); err != nil {
				t.Fatalf("burst launch %d: %v, want success", i+1, err)
			}
		}
		r.clock.t = time.Date(2026, 10, 13, 4, 0, 30, 0, time.UTC)
		refused(t, r, "04:00:30, a new clock hour but the same rolling hour")
		r.clock.t = time.Date(2026, 10, 13, 4, 58, 59, 0, time.UTC)
		refused(t, r, "04:58:59, every burst launch still inside the window")
		// Paired legitimate case: exactly one launch has aged out, so exactly one is admitted.
		r.clock.t = start.Add(time.Hour + 250*time.Millisecond)
		if err := launch(r); err != nil {
			t.Fatalf("first launch aged out: %v, want success (a cap that blocks everything fails)", err)
		}
		refused(t, r, "the next launch, with only one slot freed")
	})
}
