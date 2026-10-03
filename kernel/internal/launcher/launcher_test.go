package launcher

import (
	"context"
	"errors"
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

func (e *blockExec) Run(context.Context, string, []string) error {
	e.mu.Lock()
	e.n++
	e.mu.Unlock()
	e.started <- struct{}{}
	<-e.release
	return nil
}

type digests map[string]string

func (d digests) Digest(p string) (string, error) { return d[p], nil }

type sink struct {
	mu  sync.Mutex
	n   int
	err error
}

func (s *sink) Append(Receipt) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.err != nil {
		return s.err
	}
	s.n++
	return nil
}

// adapterGrant builds the grant from the adapters' own templates, as production does.
func adapterGrant(concurrent int) Grant {
	return Grant{
		Holder:         Holder,
		Binaries:       []Binary{{tBin, tDigest}, {cBin, cDigest}},
		Templates:      []ArgvTemplate{TemplateOf(tBin, adapter.NewClaude(tDigest)), TemplateOf(cBin, adapter.NewCodex(cDigest))},
		ForbiddenFlags: []string{"--dangerously-skip-permissions", "--bare", "-s danger-full-access"},
		Caps:           Caps{Concurrent: concurrent, PerHour: 120},
	}
}

func fill(tokens []string) []string {
	out := slices.Clone(tokens)
	for i, t := range out {
		if t[0] == '<' {
			out[i] = "v"
		}
	}
	return out
}

func req(job string) Request {
	return Request{JobID: job, Binary: tBin, Argv: fill(adapter.NewClaude(tDigest).Template()), Unattended: true,
		Requires: Prerequisites{AdmittedJob: true, ToolLease: []string{"Agent", "Task"}, ContextProfile: "launch-pack",
			Isolation: 2, Headless: true, ProviderMode: "sub", BudgetCapCents: 1, FencedLease: "job://" + job + "#7"}}
}

func newL(t *testing.T, g Grant, e Exec, d digests, s *sink) Launcher {
	t.Helper()
	l, err := New(g, Deps{Clock: clk{time.Unix(0, 0)}, Exec: e, Digester: d, Receipts: s})
	if err != nil {
		t.Fatal(err)
	}
	return l
}

func TestAdapterTemplatesLaunchAndConcurrentCap(t *testing.T) {
	e := &blockExec{started: make(chan struct{}, 4), release: make(chan struct{})}
	s := &sink{}
	l := newL(t, adapterGrant(2), e, digests{tBin: tDigest, cBin: cDigest}, s)
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
	if e.n != 3 || s.n != 3 {
		t.Errorf("execs %d receipts %d, want 3 and 3", e.n, s.n)
	}
}

func TestRefusalsBeforeExec(t *testing.T) {
	type mut func(*Request, digests, *sink)
	cases := map[string]struct {
		m    mut
		want error
	}{
		"digest mismatch":      {func(_ *Request, d digests, _ *sink) { d[tBin] = cDigest }, ErrBinary},
		"binary not granted":   {func(r *Request, _ digests, _ *sink) { r.Binary = "/bin/sh" }, ErrBinary},
		"api undecided":        {func(r *Request, _ digests, _ *sink) { r.Requires.ProviderMode = "api" }, ErrUndecided},
		"unknown mode":         {func(r *Request, _ digests, _ *sink) { r.Requires.ProviderMode = "queue" }, ErrPrerequisite},
		"not admitted":         {func(r *Request, _ digests, _ *sink) { r.Requires.AdmittedJob = false }, ErrPrerequisite},
		"no tool lease":        {func(r *Request, _ digests, _ *sink) { r.Requires.ToolLease = nil }, ErrPrerequisite},
		"no context profile":   {func(r *Request, _ digests, _ *sink) { r.Requires.ContextProfile = "" }, ErrPrerequisite},
		"headless at I1":       {func(r *Request, _ digests, _ *sink) { r.Requires.Isolation = 1 }, ErrPrerequisite},
		"no budget cap":        {func(r *Request, _ digests, _ *sink) { r.Requires.BudgetCapCents = 0 }, ErrPrerequisite},
		"lease of another job": {func(r *Request, _ digests, _ *sink) { r.Requires.FencedLease = "job://j10#7" }, ErrPrerequisite},
		"lease without token":  {func(r *Request, _ digests, _ *sink) { r.Requires.FencedLease = "job://j1#" }, ErrPrerequisite},
		"receipt fails":        {func(_ *Request, _ digests, s *sink) { s.err = errors.New("disk") }, ErrReceipt},
		"-sdanger-full-access": {func(r *Request, _ digests, _ *sink) { r.Argv = append(r.Argv, "-sdanger-full-access") }, ErrForbiddenFlag},
	}
	for name, tc := range cases {
		t.Run(name, func(t *testing.T) {
			e := &blockExec{started: make(chan struct{}, 1), release: make(chan struct{})}
			close(e.release)
			d, s, r := digests{tBin: tDigest, cBin: cDigest}, &sink{}, req("j1")
			tc.m(&r, d, s)
			l := newL(t, adapterGrant(1), e, d, s)
			if _, err := l.Launch(context.Background(), r); !errors.Is(err, tc.want) {
				t.Errorf("err = %v, want %v", err, tc.want)
			}
			if e.n != 0 || s.n != 0 {
				t.Errorf("refused launch reached exec (%d) or wrote a receipt (%d)", e.n, s.n)
			}
			if name == "receipt fails" { // the slot is returned: the next launch runs
				s.err = nil
				if _, err := l.Launch(context.Background(), req("j1")); err != nil || e.n != 1 {
					t.Errorf("launch after a failed receipt: %v, %d execs", err, e.n)
				}
			}
		})
	}
}

func TestNewRefusesMalformed(t *testing.T) {
	d := Deps{Clock: clk{}, Exec: &blockExec{}, Digester: digests{}, Receipts: &sink{}}
	for name, m := range map[string]func(*Grant){
		"holder":          func(g *Grant) { g.Holder = "orchestrator" },
		"zero per_hour":   func(g *Grant) { g.Caps.PerHour = 0 },
		"orphan template": func(g *Grant) { g.Binaries = g.Binaries[:1] },
		"no templates":    func(g *Grant) { g.Templates = nil },
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
