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
	"github.com/Adam077K/agentvibe/kernel/internal/journal"
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

// okLease verifies with err and consumes each (job, lease) once, as the authoritative store does.
type okLease struct {
	err  error
	mu   *sync.Mutex
	used map[string]bool
}

func newLease(err error) okLease { return okLease{err, &sync.Mutex{}, map[string]bool{}} }

func (l okLease) Verify(string, string, time.Time) error { return l.err }

func (l okLease) Consume(job, lease string) error {
	l.mu.Lock()
	defer l.mu.Unlock()
	if l.used[job+" "+lease] {
		return errors.New("consumed")
	}
	l.used[job+" "+lease] = true
	return nil
}

type okGrant struct{}

func (okGrant) Live() error { return nil }

// adapterGrant builds the grant from the adapters' own templates, as production does.
func adapterGrant(concurrent int, state string) Grant {
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
		WorktreeRoot:   "/w", JobRoot: "/r", ConfigAllow: cfg, State: state,
	}
}

// fill gives every slot a value its flag's rule accepts for job.
func fill(job string, tokens []string) []string {
	byFlag := map[string]string{"--setting-sources": "project", "--settings": "/r/" + job + "/job.json",
		"--agents": "/r/" + job + "/a.json", "--agent": "builder", "--allowedTools": "Read",
		"--disallowedTools": "Agent,Task", "--json-schema": "/r/" + job + "/s.json", "--max-budget-usd": "0.01",
		"--session-id": "0192f7a4-6f1e-7c3a-9b1d-3c5e7a9b1d3c", "-C": "/w/" + job,
		"--output-schema": "/r/" + job + "/s.json", "-o": "/r/" + job + "/r.json"}
	out := slices.Clone(tokens)
	for i, t := range out {
		if isSlot(t) {
			out[i] = byFlag[out[i-1]]
		}
	}
	return out
}

func req(job string) Request {
	return Request{JobID: job, Binary: tBin, Argv: fill(job, adapter.NewClaude(tDigest).Template()), Unattended: true,
		Requires: Prerequisites{AdmittedJob: true, ToolLease: []string{"Agent", "Task"}, ContextProfile: "launch-pack",
			Isolation: 2, Headless: true, ProviderMode: "sub", BudgetCapCents: 1, FencedLease: "job://" + job + "#7"}}
}

func newL(t *testing.T, concurrent int, e Exec, d digests, s ReceiptSink, lease okLease, state string) Launcher {
	t.Helper()
	g := adapterGrant(concurrent, state)
	g.ReceiptGenesis = s.(GenesisReporter).Genesis()
	l, err := New(g, Deps{Clock: clk{time.Unix(0, 0)}, Exec: e, Digester: d, Receipts: s,
		Leases: lease, Grant: okGrant{}, State: state, Journal: newJournal(t)})
	if err != nil {
		t.Fatal(err)
	}
	return l
}

// newJournal is a fresh journal on disk, closed when the test ends.
func newJournal(t *testing.T) journal.Journal {
	t.Helper()
	j, err := journal.Open(filepath.Join(t.TempDir(), "journal.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { j.Close() })
	return j
}

// newLog is a fresh file-backed receipt log, opened against its pin.
func newLog(t *testing.T) ReceiptSink {
	t.Helper()
	p := filepath.Join(t.TempDir(), "r.log")
	g, err := CreateReceiptLog(p, "")
	if err != nil {
		t.Fatal(err)
	}
	s, err := OpenReceiptLog(p, g)
	if err != nil {
		t.Fatal(err)
	}
	return s
}

func TestAdapterTemplatesLaunchAndConcurrentCap(t *testing.T) {
	e := &blockExec{started: make(chan struct{}, 4), release: make(chan struct{})}
	s := newLog(t)
	l := newL(t, 2, e, digests{tBin: tDigest, cBin: cDigest}, s, newLease(nil), t.TempDir())
	codex := req("j2")
	codex.Binary, codex.Argv = cBin, fill("j2", adapter.NewCodex(cDigest).Template())
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
func (failSink) Genesis() string                    { return "sha256:fail" }

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
		"another job's -C":     {func(r *Request, _ digests) { r.Argv[slices.Index(r.Argv, "/r/j1/job.json")] = "/r/j2/job.json" }, nil, nil, ErrSpec},
		"AV_JOB in env":        {func(r *Request, _ digests) { r.Env = map[string]string{"AV_JOB": "j1"} }, nil, nil, ErrSpec},
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
			l := newL(t, 1, e, d, s, newLease(tc.leaseErr), t.TempDir())
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
	l := newL(t, 1, e, digests{tBin: tDigest}, newLog(t), newLease(nil), state)
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
	if err := os.Remove(filepath.Join(state, "state.json")); err != nil {
		t.Fatal(err)
	}
	g := adapterGrant(1, state)
	g.ReceiptGenesis = failSink{}.Genesis()
	if _, err := New(g, Deps{Clock: clk{}, Exec: e, Digester: digests{}, Receipts: failSink{}, Leases: newLease(nil),
		Grant: okGrant{}, State: state, Journal: newJournal(t)}); !errors.Is(err, ErrState) {
		t.Errorf("New on a used State dir whose state.json is gone: %v, want ErrState", err)
	}
}

func TestNewRefusesMalformed(t *testing.T) {
	state := t.TempDir()
	d := Deps{Clock: clk{}, Exec: &blockExec{}, Digester: digests{}, Receipts: failSink{}, Leases: newLease(nil), Grant: okGrant{},
		State: state, Journal: newJournal(t)}
	for name, m := range map[string]func(*Grant){
		"holder":                 func(g *Grant) { g.Holder = "orchestrator" },
		"zero per_hour":          func(g *Grant) { g.Caps.PerHour = 0 },
		"orphan template":        func(g *Grant) { g.Binaries = g.Binaries[:1] },
		"no templates":           func(g *Grant) { g.Templates = nil },
		"env AV_JOB":             func(g *Grant) { g.EnvAllow = []string{"AV_JOB"} },
		"State unpinned":         func(g *Grant) { g.State = "" },
		"State in a TMPDIR root": func(g *Grant) { g.TmpRoots = []string{filepath.Dir(state)} },
		"env pin on LANG":        func(g *Grant) { g.EnvPinned = map[string]string{"LANG": "C"} },
	} {
		g := adapterGrant(1, state)
		m(&g)
		if _, err := New(g, d); !errors.Is(err, ErrGrant) {
			t.Errorf("%s: %v, want ErrGrant", name, err)
		}
	}
	d.Exec = nil
	if _, err := New(adapterGrant(1, state), d); !errors.Is(err, ErrDeps) {
		t.Errorf("nil Exec: %v, want ErrDeps", err)
	}
	d.Exec, d.Journal = &blockExec{}, nil
	if _, err := New(adapterGrant(1, state), d); !errors.Is(err, ErrDeps) {
		t.Errorf("nil Journal: %v, want ErrDeps", err)
	}
}
