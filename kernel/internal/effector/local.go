package effector

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/outbox"
)

// The three local effectors (Q7: tight limits until widened). None reaches a network: mail is a
// local Maildir, and git and deploy go through the GitHost and DeployHost the caller supplies.

// rejectf is a definite refusal: the effect did not happen and nothing was touched.
func rejectf(format string, a ...any) error {
	return fmt.Errorf("%w: %s", outbox.ErrRejected, fmt.Sprintf(format, a...))
}

// outside is a definite refusal of an effect aimed outside the effector's sandbox.
func outside(format string, a ...any) error {
	return fmt.Errorf("%w: %w: %s", ErrOutsideSandbox, outbox.ErrRejected, fmt.Sprintf(format, a...))
}

// hostErr maps a host error: ErrHostRejected is definite, anything else is ambiguous.
func hostErr(what string, err error) error {
	if errors.Is(err, ErrHostRejected) {
		return fmt.Errorf("%w: %s: %w", outbox.ErrRejected, what, err)
	}
	return fmt.Errorf("effector: %s, outcome unknown: %w", what, err)
}

// decode reads a JSON object payload strictly: unknown keys and trailing data are refused.
func decode(payload []byte, v any) error {
	dec := json.NewDecoder(bytes.NewReader(payload))
	dec.DisallowUnknownFields()
	if err := dec.Decode(v); err != nil {
		return rejectf("payload: %v", err)
	}
	if dec.More() {
		return rejectf("payload: trailing data")
	}
	return nil
}

// safeIdem is an idem that may name a file and a header without escaping.
var safeIdem = regexp.MustCompile(`^[0-9A-Za-z._-]{1,128}$`)

type lag time.Duration

func (l lag) VisibilityLag() time.Duration { return time.Duration(l) }

// ---- founder mailbox ----

type mailbox struct {
	lag
	dir, founder string
}

func newMailbox(cfg MailboxConfig) (Effector, error) {
	if cfg.Dir == "" || cfg.Founder == "" {
		return nil, errors.New("effector: mailbox needs Dir and Founder")
	}
	for _, sub := range []string{"tmp", "new", "cur"} {
		if err := os.MkdirAll(filepath.Join(cfg.Dir, sub), 0o700); err != nil {
			return nil, fmt.Errorf("effector: mailbox: %w", err)
		}
	}
	return &mailbox{lag: lag(cfg.VisibilityLag), dir: cfg.Dir, founder: cfg.Founder}, nil
}

func (m *mailbox) Class() outbox.Class { return outbox.CheckBefore }

func (m *mailbox) messageID(idem string) string { return "<" + idem + "@avk.mailbox.local>" }

func (m *mailbox) Do(ctx context.Context, idem string, payload []byte) error {
	var p MailPayload
	if err := decode(payload, &p); err != nil {
		return err
	}
	if !safeIdem.MatchString(idem) {
		return rejectf("idem %q cannot name a message", idem)
	}
	if p.To != m.founder { // Q7: the founder only, matched exactly
		return outside("recipient %q is not the founder", p.To)
	}
	if strings.ContainsAny(p.Subject, "\r\n") {
		return rejectf("subject carries a line break")
	}
	// check_before (09a §7.2, "Sent by Message-ID"): never deliver a second message for one idem.
	switch present, err := m.Lookup(ctx, idem); {
	case err != nil:
		return fmt.Errorf("effector: mailbox query failed, nothing sent: %w", err)
	case present == outbox.Present:
		return nil
	}
	msg := fmt.Sprintf("To: %s\r\nSubject: %s\r\nMessage-ID: %s\r\n\r\n%s", p.To, p.Subject, m.messageID(idem), p.Body)
	name := idem + ".avk"
	tmp := filepath.Join(m.dir, "tmp", name)
	if err := os.WriteFile(tmp, []byte(msg), 0o600); err != nil {
		return fmt.Errorf("effector: mailbox write, outcome unknown: %w", err)
	}
	if err := os.Rename(tmp, filepath.Join(m.dir, "new", name)); err != nil {
		return fmt.Errorf("effector: mailbox deliver, outcome unknown: %w", err)
	}
	return nil
}

// Lookup reads every delivered message's Message-ID header. A read that fails is an error.
func (m *mailbox) Lookup(_ context.Context, idem string) (outbox.Presence, error) {
	want := m.messageID(idem)
	for _, sub := range []string{"new", "cur"} {
		ents, err := os.ReadDir(filepath.Join(m.dir, sub))
		if err != nil {
			return outbox.Unknown, fmt.Errorf("effector: mailbox read: %w", err)
		}
		for _, e := range ents {
			b, err := os.ReadFile(filepath.Join(m.dir, sub, e.Name()))
			if err != nil {
				return outbox.Unknown, fmt.Errorf("effector: mailbox read: %w", err)
			}
			head, _, _ := strings.Cut(strings.ReplaceAll(string(b), "\r\n", "\n"), "\n\n")
			for _, l := range strings.Split(head, "\n") {
				if k, v, ok := strings.Cut(l, ":"); ok && strings.EqualFold(k, "Message-ID") && strings.TrimSpace(v) == want {
					return outbox.Present, nil
				}
			}
		}
	}
	return outbox.Absent, nil
}

// ---- git PR ----

type gitPR struct {
	lag
	host  GitHost
	repos map[string]bool
}

func newGitPR(cfg GitPRConfig) (Effector, error) {
	if cfg.Host == nil {
		return nil, errors.New("effector: git PR needs a Host")
	}
	g := &gitPR{lag: lag(cfg.VisibilityLag), host: cfg.Host, repos: map[string]bool{}}
	for _, r := range cfg.Repos {
		g.repos[r] = true
	}
	return g, nil
}

func (g *gitPR) Class() outbox.Class { return outbox.CheckBefore }

func (g *gitPR) Do(ctx context.Context, idem string, payload []byte) error {
	var pr PRPayload
	if err := decode(payload, &pr); err != nil {
		return err
	}
	if !g.repos[pr.Repo] {
		return outside("repo %q is not allow-listed", pr.Repo)
	}
	if pr.Base == "" || pr.Head == "" || pr.Title == "" {
		return rejectf("a PR needs base, head and title")
	}
	// check_before: no native key, so query by marker and open only if absent.
	found, err := g.host.FindPR(ctx, idem)
	if err != nil {
		return fmt.Errorf("effector: PR query failed, nothing sent: %w", err)
	}
	if found {
		return nil
	}
	if err := g.host.CreatePR(ctx, pr, idem); err != nil {
		return hostErr("create PR", err)
	}
	return nil
}

func (g *gitPR) Lookup(ctx context.Context, idem string) (outbox.Presence, error) {
	found, err := g.host.FindPR(ctx, idem)
	if err != nil {
		return outbox.Unknown, fmt.Errorf("effector: PR query: %w", err)
	}
	if found {
		return outbox.Present, nil
	}
	return outbox.Absent, nil
}

// ---- preview deploy ----

var digest = regexp.MustCompile(`^sha256:[0-9a-f]{64}$`)

type previewDeploy struct {
	lag
	host DeployHost
}

func newPreviewDeploy(cfg DeployConfig) (Effector, error) {
	if cfg.Host == nil {
		return nil, errors.New("effector: preview deploy needs a Host")
	}
	return &previewDeploy{lag: lag(cfg.VisibilityLag), host: cfg.Host}, nil
}

// Class is natural (09a §7.2): the payload is the digest, so a repeat deploy is the same deploy.
func (d *previewDeploy) Class() outbox.Class { return outbox.Natural }

func (d *previewDeploy) Do(ctx context.Context, idem string, payload []byte) error {
	var p DeployPayload
	if err := decode(payload, &p); err != nil {
		return err
	}
	if p.Environment != "preview" { // Q7: never production, matched exactly
		return outside("environment %q is not preview", p.Environment)
	}
	if !digest.MatchString(p.Digest) {
		return rejectf("digest %q is not sha256 + 64 lowercase hex", p.Digest)
	}
	if p.Project == "" {
		return rejectf("a deploy needs a project")
	}
	if err := d.host.Deploy(ctx, p.Project, p.Digest, idem); err != nil {
		return hostErr("deploy", err)
	}
	return nil
}

func (d *previewDeploy) Lookup(ctx context.Context, idem string) (outbox.Presence, error) {
	found, err := d.host.FindDeploy(ctx, idem)
	if err != nil {
		return outbox.Unknown, fmt.Errorf("effector: deploy query: %w", err)
	}
	if found {
		return outbox.Present, nil
	}
	return outbox.Absent, nil
}
