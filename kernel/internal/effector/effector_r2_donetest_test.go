//go:build donetest

// Done-tests for B1-12b, round 2. Re-frozen 2026-10-03 after the Opus review of d75c5c5, which
// passed it and left: (1) MED, the deploy target unvalidated — DeployHost was not told the
// environment and the project was not allow-listed, so a production deploy could pass; (2) MED,
// surviving mutants on the founder check and the subject line-break check; (3) LOW, a fence record
// that a later proposal could overwrite, among other survivors. Round 1 shares its helpers (world,
// testEff, tokens, mustJSON, rejected, messages, founderTo, goodSHA) with this file.
//
// Canon: founder ruling Q7, 2026-10-03 (docs/vision-v3/_process/DR-B1-12B-RULINGS-2026-10-03.md):
// email to the founder recipient only, a PR to an allow-listed repo only, a deploy to preview only
// and never production; anything else is refused until widened. 09a §7: "proposed --> refused:
// … stale token".
//
// Run: go -C kernel test -count=1 -tags donetest ./internal/effector/
package effector_test

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/effector"
	"github.com/Adam077K/agentvibe/kernel/internal/outbox"
)

// TestB112bR2ConstructorsRefuseIncompleteConfig: a Gateway or effector missing a collaborator is
// refused at construction, never left to fail open (or panic) on its first effect.
func TestB112bR2ConstructorsRefuseIncompleteConfig(t *testing.T) {
	e := newEff(outbox.CheckBefore)
	w := newWorld(t, e, e.total)
	full := func() effector.Config {
		return effector.Config{Dir: filepath.Join(w.dir, "gw"), Venture: venture, WorkerID: "w", Clock: w.clock,
			Blobs: w.j, Fence: w.fence, Ventures: jobVentures, Effectors: map[string]effector.Effector{verb: e}}
	}
	if _, err := effector.Open(full()); err != nil {
		t.Fatalf("the complete Config: %v", err)
	}
	for name, mod := range map[string]func(*effector.Config){
		"no Dir":            func(c *effector.Config) { c.Dir = "" },
		"no Venture":        func(c *effector.Config) { c.Venture = "" },
		"no Clock":          func(c *effector.Config) { c.Clock = nil },
		"no Blobs":          func(c *effector.Config) { c.Blobs = nil },
		"no Fence":          func(c *effector.Config) { c.Fence = nil },
		"no Ventures":       func(c *effector.Config) { c.Ventures = nil },
		"no Effectors":      func(c *effector.Config) { c.Effectors = nil },
		"a nil Effector":    func(c *effector.Config) { c.Effectors = map[string]effector.Effector{verb: nil} },
	} {
		c := full()
		mod(&c)
		if _, err := effector.Open(c); err == nil {
			t.Errorf("Open with %s succeeded; want refused", name)
		}
	}
	dir := t.TempDir()
	for name, f := range map[string]func() error{
		"mailbox without Founder": func() error { _, err := effector.NewMailbox(effector.MailboxConfig{Dir: dir}); return err },
		"mailbox without Dir":     func() error { _, err := effector.NewMailbox(effector.MailboxConfig{Founder: founderTo}); return err },
		"git PR without Host":     func() error { _, err := effector.NewGitPR(effector.GitPRConfig{Repos: []string{"r"}}); return err },
		"deploy without Host": func() error {
			_, err := effector.NewPreviewDeploy(effector.DeployConfig{Projects: []string{"p"}})
			return err
		},
	} {
		if f() == nil {
			t.Errorf("%s succeeded; want refused", name)
		}
	}
}

// TestB112bR2IncompleteRequestsRefused: an empty target is not a string id (Q3), and a PR missing
// its base, head or title is refused before the host is asked anything.
func TestB112bR2IncompleteRequestsRefused(t *testing.T) {
	e := newEff(outbox.CheckBefore)
	w := newWorld(t, e, e.total)
	c := w.cmd("inv-1", w.claim("A"))
	c.Target = json.RawMessage(`""`)
	if _, err := w.open("w1").ProposeEffect(ctx, c); !errors.Is(err, effector.ErrInvalidTarget) {
		t.Fatalf("empty target: err = %v; want ErrInvalidTarget", err)
	}
	g := &fakeGit{prs: map[string]effector.PRPayload{}}
	pr, err := effector.NewGitPR(effector.GitPRConfig{Host: g, Repos: []string{"adam077k/venture-keel"}})
	if err != nil {
		t.Fatal(err)
	}
	full := effector.PRPayload{Repo: "adam077k/venture-keel", Base: "main", Head: "feat/x", Title: "T", Body: "B"}
	for name, mod := range map[string]func(*effector.PRPayload){
		"no base": func(p *effector.PRPayload) { p.Base = "" }, "no head": func(p *effector.PRPayload) { p.Head = "" },
		"no title": func(p *effector.PRPayload) { p.Title = "" },
	} {
		p := full
		mod(&p)
		rejected(t, "PR with "+name, pr.Do(ctx, "01R2PR1", mustJSON(t, p)), false)
	}
	if g.creates != 0 {
		t.Fatalf("%d PRs created from incomplete requests; want 0", g.creates)
	}
}

// recDeploy records every call exactly as the host receives it.
type recDeploy struct {
	mu    sync.Mutex
	calls []string // project|digest|environment|marker
}

func (d *recDeploy) Deploy(_ context.Context, project, digest, environment, marker string) error {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.calls = append(d.calls, project+"|"+digest+"|"+environment+"|"+marker)
	return nil
}
func (d *recDeploy) FindDeploy(context.Context, string) (bool, error) { return false, nil }
func (d *recDeploy) n() int                                           { d.mu.Lock(); defer d.mu.Unlock(); return len(d.calls) }

// TestB112bR2DeployTargetIsPinned: the host is told the environment, which is always "preview";
// the project must be allow-listed; a production flag or target anywhere in the request is
// refused, including one hidden in a duplicate key or in trailing data. The host is never called.
func TestB112bR2DeployTargetIsPinned(t *testing.T) {
	d := &recDeploy{}
	e, err := effector.NewPreviewDeploy(effector.DeployConfig{Host: d, Projects: []string{"keel-site"}})
	if err != nil {
		t.Fatalf("NewPreviewDeploy: %v", err)
	}
	good := effector.DeployPayload{Project: "keel-site", Digest: goodSHA, Environment: "preview"}
	if err := e.Do(ctx, "01R2DEP1", mustJSON(t, good)); err != nil {
		t.Fatalf("Do: %v", err)
	}
	if want := "keel-site|" + goodSHA + "|preview|01R2DEP1"; d.n() != 1 || d.calls[0] != want {
		t.Fatalf("host calls %q; want exactly [%q]: the environment is passed explicitly", d.calls, want)
	}
	for _, project := range []string{"other-site", "keel-site --prod", "keel-site ", "KEEL-SITE", "", "production", "keel-site/production"} {
		p := good
		p.Project = project
		rejected(t, "project "+project, e.Do(ctx, "01R2DEP2", mustJSON(t, p)), true)
	}
	for _, env := range []string{"prod", "production", "preview --prod", " preview", "preview\n", "preview,production"} {
		p := good
		p.Environment = env
		rejected(t, "environment "+env, e.Do(ctx, "01R2DEP3", mustJSON(t, p)), true)
	}
	base := `"project":"keel-site","digest":"` + goodSHA + `"`
	for name, raw := range map[string]string{
		"a prod flag":                  `{` + base + `,"environment":"preview","prod":true}`,
		"a --prod flag list":           `{` + base + `,"environment":"preview","flags":["--prod"]}`,
		"a production target":          `{` + base + `,"environment":"preview","target":"production"}`,
		"production, then preview":     `{` + base + `,"environment":"production","environment":"preview"}`,
		"preview, then production":     `{` + base + `,"environment":"preview","environment":"production"}`,
		"a second project, production": `{` + base + `,"environment":"preview","project":"keel-site-prod"}`,
		"trailing prod object":         `{` + base + `,"environment":"preview"}{"prod":true}`,
	} {
		rejected(t, name, e.Do(ctx, "01R2DEP4", []byte(raw)), false)
	}
	if d.n() != 1 {
		t.Fatalf("host called %d times; every refusal must leave it untouched", d.n())
	}
	none, err := effector.NewPreviewDeploy(effector.DeployConfig{Host: d})
	if err != nil {
		t.Fatalf("NewPreviewDeploy with no projects: %v", err)
	}
	rejected(t, "no allow-list: refused until widened", none.Do(ctx, "01R2DEP5", mustJSON(t, good)), true)
	if d.n() != 1 {
		t.Fatalf("host called %d times with no allow-list", d.n())
	}
}

// TestB112bR2MailboxFounderIsExact: the recipient must equal the founder address byte for byte.
// A superstring, a display-name form, a list, padding or a case variant is refused.
func TestB112bR2MailboxFounderIsExact(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "mail")
	e, err := effector.NewMailbox(effector.MailboxConfig{Dir: dir, Founder: founderTo})
	if err != nil {
		t.Fatalf("NewMailbox: %v", err)
	}
	for _, to := range []string{
		founderTo + ".evil",
		"x" + founderTo,
		`"Founder" <` + founderTo + `>`,
		`"Founder" <` + founderTo + `>, other@y.example`,
		founderTo + ", other@y.example",
		founderTo + ";other@y.example",
		" " + founderTo,
		founderTo + " ",
		strings.ToUpper(founderTo),
	} {
		err := e.Do(ctx, "01R2MAIL1", mustJSON(t, effector.MailPayload{To: to, Subject: "s", Body: "b"}))
		rejected(t, "recipient "+to, err, true)
	}
	if n := len(messages(t, dir)); n != 0 {
		t.Fatalf("%d messages delivered; every recipient but the founder is refused", n)
	}
}

// TestB112bR2HeaderLineBreaksRefused: CR or LF in any header field (To, Subject) is refused, so no
// header can be injected; the body may carry line breaks.
func TestB112bR2HeaderLineBreaksRefused(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "mail")
	e, err := effector.NewMailbox(effector.MailboxConfig{Dir: dir, Founder: founderTo})
	if err != nil {
		t.Fatalf("NewMailbox: %v", err)
	}
	for _, s := range []string{"a\r\nBcc: other@y.example", "a\nBcc: other@y.example", "a\rb", "\r\n", "end\n"} {
		err := e.Do(ctx, "01R2HDR1", mustJSON(t, effector.MailPayload{To: founderTo, Subject: s, Body: "b"}))
		rejected(t, "subject "+strings.ReplaceAll(strings.ReplaceAll(s, "\r", `\r`), "\n", `\n`), err, false)
	}
	for _, to := range []string{founderTo + "\r\nBcc: other@y.example", founderTo + "\n", "\r" + founderTo} {
		rejected(t, "recipient with a line break", e.Do(ctx, "01R2HDR2",
			mustJSON(t, effector.MailPayload{To: to, Subject: "s", Body: "b"})), false)
	}
	if n := len(messages(t, dir)); n != 0 {
		t.Fatalf("%d messages after header refusals; want 0", n)
	}
	body := "line one\r\nline two\nBcc: not-a-header@y.example"
	if err := e.Do(ctx, "01R2HDR3", mustJSON(t, effector.MailPayload{To: founderTo, Subject: "ok", Body: body})); err != nil {
		t.Fatalf("a body with line breaks: %v", err)
	}
	got := messages(t, dir)
	if len(got) != 1 || !strings.Contains(got[0], "line two") {
		t.Fatalf("messages %q; want the one with the multi-line body", got)
	}
	head, _, _ := strings.Cut(strings.ReplaceAll(got[0], "\r\n", "\n"), "\n\n")
	if strings.Contains(head, "Bcc:") {
		t.Fatalf("the body leaked into the header:\n%s", head)
	}
}

// TestB112bR2MailboxRefusesUnsafeInput: an idem that cannot name a file inside the Maildir, and a
// payload with trailing data, are refused and write nothing anywhere.
func TestB112bR2MailboxRefusesUnsafeInput(t *testing.T) {
	root := t.TempDir()
	dir := filepath.Join(root, "mail")
	e, err := effector.NewMailbox(effector.MailboxConfig{Dir: dir, Founder: founderTo})
	if err != nil {
		t.Fatalf("NewMailbox: %v", err)
	}
	ok := mustJSON(t, effector.MailPayload{To: founderTo, Subject: "s", Body: "b"})
	for _, idem := range []string{"../../escape", "a/b", "", "x\r\nBcc: y"} {
		rejected(t, "idem "+idem, e.Do(ctx, idem, ok), false)
	}
	rejected(t, "trailing data", e.Do(ctx, "01R2SAFE1", append(append([]byte{}, ok...), `{"to":"x"}`...)), false)
	if n := len(messages(t, dir)); n != 0 {
		t.Fatalf("%d messages; want 0", n)
	}
	if ents, _ := os.ReadDir(root); len(ents) != 1 {
		t.Fatalf("%d entries beside the Maildir; nothing may be written outside it", len(ents))
	}
}

// TestB112bR2FenceRecordIsNeverReplaced: the resources the FIRST proposal named stay the fence. A
// later re-proposal of the same business key under another current lease of the venture returns
// the same Operation and does not replace the record, so a dispatch presenting only that other
// lease is refused, whichever Gateway handles it.
func TestB112bR2FenceRecordIsNeverReplaced(t *testing.T) {
	e := newEff(outbox.CheckBefore)
	w := newWorld(t, e, e.total)
	gw := w.open("w1")
	a := w.claim("A") // job://J7
	id := w.propose(gw, w.cmd("inv-1", a))
	j8, err := w.claims.ClaimJob(ctx, "J8", "C", time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	// Superset first, then only J8: a last-writer-wins record would end as [J8].
	both := w.cmd("inv-1", a)
	both.LeaseTokens = json.RawMessage(`{"` + a.Resource + `":"` + strconv.FormatUint(a.Token, 10) + `","` +
		j8.Resource + `":"` + strconv.FormatUint(j8.Token, 10) + `"}`)
	only8 := w.cmd("inv-1", a)
	only8.LeaseTokens = json.RawMessage(tokensJSON(j8))
	if again := w.propose(w.open("w2"), both); again != id {
		t.Fatalf("re-proposal under both leases = %q; want %q", again, id)
	}
	if again := w.propose(w.open("w3"), only8); again != id {
		t.Fatalf("re-proposal under only J8 = %q; want %q", again, id)
	}
	for _, g := range []effector.Gateway{gw, w.open("w4")} {
		if _, err := g.Dispatch(ctx, id, tokens(j8)); !errors.Is(err, effector.ErrStaleToken) {
			t.Fatalf("dispatch under only the later proposal's lease: err = %v; want ErrStaleToken", err)
		}
		w.sends(0, "dispatch under only the later proposal's lease")
	}
	if op, err := gw.Dispatch(ctx, id, tokens(a)); err != nil || op.State != outbox.Confirmed {
		t.Fatalf("dispatch under the first proposal's lease = %+v, %v; want confirmed", op, err)
	}
	w.sends(1, "first proposal's lease")
}
