package launcher

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"slices"
	"sync"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/adapter"
)

const (
	tBin    = "/opt/av/bin/claude"
	tDigest = "sha256:1111111111111111111111111111111111111111111111111111111111111111"
	cBin    = "/opt/av/bin/codex"
	cDigest = "sha256:2222222222222222222222222222222222222222222222222222222222222222"
)

type clk struct{ t time.Time }

func (c clk) Now() time.Time { return c.t }

// blockExec holds every Run until release is closed, so launches overlap.
type blockExec struct {
	mu      sync.Mutex
	n       int
	started chan struct{}
	release chan struct{}
}

func (e *blockExec) Run(context.Context, string, string, []string, []string) error {
	e.mu.Lock()
	e.n++
	e.mu.Unlock()
	e.started <- struct{}{}
	<-e.release
	return nil
}

type digests map[string]string

func (d digests) Digest(p string) (string, error) { return d[p], nil }

type okLease struct{ err error }

func (l okLease) Verify(string, string, time.Time) error { return l.err }

type okGrant struct{}

func (okGrant) Live() error { return nil }

// adapterGrant builds the grant from the adapters' own templates, as production does.
func adapterGrant(concurrent int) Grant {
	tc, tx := TemplateOf(tBin, adapter.NewClaude(tDigest)), TemplateOf(cBin, adapter.NewCodex(cDigest))
	var cfg []string
	for i := 1; i < len(tx.Tokens); i++ {
		if tx.Tokens[i-1] == "-c" {
			cfg = append(cfg, tx.Tokens[i])
		}
	}
	return Grant{
		Holder:         Holder,
		Binaries:       []Binary{{tBin, tDigest}, {cBin, cDigest}},
		Templates:      []ArgvTemplate{tc, tx},
		ForbiddenFlags: []string{"--dangerously-skip-permissions", "--bare", "-s danger-full-access"},
		Caps:           Caps{Concurrent: concurrent, PerHour: 120},
		WorktreeRoot:   "/w", JobRoot: "/r", ConfigAllow: cfg,
	}
}

// fill gives every slot a value its flag's rule accepts.
func fill(tokens []string) []string {
	byFlag := map[string]string{"--setting-sources": "project", "--settings": "/r/j/job.json", "--agents": "/r/j/a.json",
		"--agent": "builder", "--allowedTools": "Read", "--disallowedTools": "Agent,Task", "--json-schema": "/r/j/s.json",
		"--max-budget-usd": "0.01", "--session-id": "0192f7a4-6f1e-7c3a-9b1d-3c5e7a9b1d3c", "-C": "/w/j",
		"--output-schema": "/r/j/s.json", "-o": "/r/j/r.json"}
	out := slices.Clone(tokens)
	for i, t := range out {
		if isSlot(t) {
			out[i] = byFlag[out[i-1]]
		}
	}
	return out
}

func req(job string) Request {
	return Request{JobID: job, Binary: tBin, Argv: fill(adapter.NewClaude(tDigest).Template()), Unattended: true,
		Requires: Prerequisites{AdmittedJob: true, ToolLease: []string{"Agent", "Task"}, ContextProfile: "launch-pack",
			Isolation: 2, Headless: true, ProviderMode: "sub", BudgetCapCents: 1, FencedLease: "job://" + job + "#7"}}
}

func newL(t *testing.T, g Grant, e Exec, d digests, s ReceiptSink, leaseErr error, state string) Launcher {
	t.Helper()
	l, err := New(g, Deps{Clock: clk{time.Unix(0, 0)}, Exec: e, Digester: d, Receipts: s,
		Leases: okLease{leaseErr}, Grant: okGrant{}, State: state})
	if err != nil {
		t.Fatal(err)
	}
	return l
}

// newLog is a fresh file-backed receipt log.
func newLog(t *testing.T) ReceiptSink {
	t.Helper()
	p := filepath.Join(t.TempDir(), "r.log")
	if err := CreateReceiptLog(p); err != nil {
		t.Fatal(err)
	}
	s, err := OpenReceiptLog(p)
	if err != nil {
		t.Fatal(err)
	}
	return s
}

func TestAdapterTemplatesLaunchAndConcurrentCap(t *testing.T) {
	e := &blockExec{started: make(chan struct{}, 4), release: make(chan struct{})}
	s := newLog(t)
	l := newL(t, adapterGrant(2), e, digests{tBin: tDigest, cBin: cDigest}, s, nil, t.TempDir())
	codex := req("j2")
	codex.Binary, codex.Argv = cBin, fill(adapter.NewCodex(cDigest).Template())
	errs := make(chan error, 2)
	for _, r := range []Request{req("j1"), codex} {
		go func(r Request) { _, err := l.Launch(context.Background(), r); errs <- err }(r)
	}
	<-e.started
	<-e.started
	if _, err := l.Launch(context.Background(), req("j3")); !errors.Is(err, ErrConcurrentCap) {
		t.Errorf("third concurrent launch: %v, want ErrConcurrentCap", err)
	}
	close(e.release)
	for range 2 {
		if err := <-errs; err != nil {
			t.Errorf("adapter-template launch: %v", err)
		}
	}
	if _, err := l.Launch(context.Background(), req("j4")); err != nil {
		t.Errorf("launch after the slots freed: %v", err)
	}
	if got, err := s.Since(time.Unix(-1, 0)); err != nil || len(got) != 3 || e.n != 3 {
		t.Errorf("execs %d, receipts %d (%v), want 3 and 3", e.n, len(got), err)
	}
}

type failSink struct{}

func (failSink) Append(Receipt) error               { return errors.New("disk") }
func (failSink) Since(time.Time) ([]Receipt, error) { return nil, nil }

func TestRefusalsBeforeExec(t *testing.T) {
	cases := map[string]struct {
		m        func(*Request, digests)
		leaseErr error
		sink     ReceiptSink
		want     error
	}{
		"digest mismatch":      {func(_ *Request, d digests) { d[tBin] = cDigest }, nil, nil, ErrBinary},
		"binary not granted":   {func(r *Request, _ digests) { r.Binary = "/bin/sh" }, nil, nil, ErrBinary},
		"api undecided":        {func(r *Request, _ digests) { r.Requires.ProviderMode = "api" }, nil, nil, ErrUndecided},
		"subscription":         {func(r *Request, _ digests) { r.Requires.ProviderMode = "subscription" }, nil, nil, ErrPrerequisite},
		"no fenced lease":      {func(r *Request, _ digests) { r.Requires.FencedLease = "" }, nil, nil, ErrPrerequisite},
		"attended claude -p":   {func(r *Request, _ digests) { r.Unattended = false }, nil, nil, ErrSpec},
		"allowed Agent(x)":     {func(r *Request, _ digests) { r.Argv[slices.Index(r.Argv, "Read")] = "Agent(x)" }, nil, nil, ErrSpec},
		"lease not live":       {func(*Request, digests) {}, errors.New("stale"), nil, ErrLease},
		"receipt fails":        {func(*Request, digests) {}, nil, failSink{}, ErrReceipt},
		"-sdanger-full-access": {func(r *Request, _ digests) { r.Argv = append(r.Argv, "-sdanger-full-access") }, nil, nil, ErrForbiddenFlag},
	}
	for name, tc := range cases {
		t.Run(name, func(t *testing.T) {
			e := &blockExec{started: make(chan struct{}, 1), release: make(chan struct{})}
			close(e.release)
			d, r, s := digests{tBin: tDigest, cBin: cDigest}, req("j1"), tc.sink
			if s == nil {
				s = newLog(t)
			}
			tc.m(&r, d)
			l := newL(t, adapterGrant(1), e, d, s, tc.leaseErr, t.TempDir())
			if _, err := l.Launch(context.Background(), r); !errors.Is(err, tc.want) || e.n != 0 {
				t.Errorf("err = %v with %d execs, want %v and none", err, e.n, tc.want)
			}
		})
	}
}

func TestStateFailsClosed(t *testing.T) {
	e := &blockExec{started: make(chan struct{}, 2), release: make(chan struct{})}
	close(e.release)
	state := t.TempDir()
	l := newL(t, adapterGrant(1), e, digests{tBin: tDigest}, newLog(t), nil, state)
	if _, err := l.Launch(context.Background(), req("j1")); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(state, "state.json"), []byte("{"), 0o600); err != nil {
		t.Fatal(err)
	}
	if _, err := l.Launch(context.Background(), req("j2")); !errors.Is(err, ErrState) || e.n != 1 {
		t.Errorf("corrupt state: %v with %d execs, want ErrState and 1", err, e.n)
	}
	if err := l.End(context.Background(), "j1", "job://j1#7"); !errors.Is(err, ErrState) {
		t.Errorf("End on corrupt state: %v, want ErrState", err)
	}
}

func TestNewRefusesMalformed(t *testing.T) {
	d := Deps{Clock: clk{}, Exec: &blockExec{}, Digester: digests{}, Receipts: failSink{}, Leases: okLease{}, Grant: okGrant{}, State: t.TempDir()}
	for name, m := range map[string]func(*Grant){
		"holder":          func(g *Grant) { g.Holder = "orchestrator" },
		"zero per_hour":   func(g *Grant) { g.Caps.PerHour = 0 },
		"orphan template": func(g *Grant) { g.Binaries = g.Binaries[:1] },
		"no templates":    func(g *Grant) { g.Templates = nil },
		"env name with =": func(g *Grant) { g.EnvAllow = []string{"A=B"} },
	} {
		g := adapterGrant(1)
		m(&g)
		if _, err := New(g, d); !errors.Is(err, ErrGrant) {
			t.Errorf("%s: %v, want ErrGrant", name, err)
		}
	}
	d.Exec = nil
	if _, err := New(adapterGrant(1), d); !errors.Is(err, ErrDeps) {
		t.Errorf("nil Exec: %v, want ErrDeps", err)
	}
}
