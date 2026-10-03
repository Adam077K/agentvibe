package adapter

import (
	"bufio"
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"slices"
	"strings"
)

// Codex is the WorkerAdapter for the `codex` CLI (09a §8.1: codex-cli 0.154.0, `exec` with -s,
// --json, --output-schema, -o, --ephemeral), under the founder rulings in
// docs/vision-v3/_process/DR-B1-07-CODEX-RULINGS-2026-10-02.md.
type Codex struct {
	digest string
}

// NewCodex returns the adapter for the codex binary whose content digest is binaryDigest
// ("sha256:<hex>", the launcher grant's Binary.Digest): the pinned binary hash (ruling 1+3).
func NewCodex(binaryDigest string) *Codex { return &Codex{digest: binaryDigest} }

var _ WorkerAdapter = (*Codex)(nil)

// codexTemplate is the locked codex line (DR-B1-07 round 4, the B1-08 launcher's codexTokens):
// --ignore-user-config drops the user and project config (measured: no MCP server starts, a
// worktree .codex/config.toml is ignored, auth is still read from CODEX_HOME), --ignore-rules
// drops execpolicy .rules files, and every locked setting is a -c. There is no -p and no profile.
var codexTemplate = [...]string{"exec", "-C", "<worktree>", "-s", "workspace-write", "--json",
	"--output-schema", "<f>", "-o", "<result.json>", "--ephemeral", "--ignore-user-config", "--ignore-rules",
	"-c", `approval_policy="never"`, "-c", `approvals_reviewer="user"`, "-c", `sandbox_mode="workspace-write"`,
	"-c", "sandbox_workspace_write.network_access=false", "-c", "sandbox_workspace_write.writable_roots=[]",
	"-c", "sandbox_workspace_write.exclude_tmpdir_env_var=true", "-c", "sandbox_workspace_write.exclude_slash_tmp=true",
	"-c", `shell_environment_policy.inherit="core"`, "-c", "mcp_servers={}", "-c", `web_search="disabled"`,
	"-c", `model_provider="openai"`, "-c", "model_providers={}", "-c", "notify=[]", "-c", "hooks={}",
	"-c", "features={}", "-c", "tools={}", "-c", "projects={}"}

// codexPin is init_expect for codex (round 4): the sha256 of the whole template, the tokens
// joined by NUL (the launcher's ArgvTemplate digest).
var codexPin = func() string {
	sum := sha256.Sum256([]byte(strings.Join(codexTemplate[:], "\x00")))
	return "sha256:" + hex.EncodeToString(sum[:])
}()

// Family is "codex".
func (c *Codex) Family() string { return "codex" }

// Template is codexTemplate as argv[1:] tokens, "<name>" tokens being slots; a fresh copy.
func (c *Codex) Template() []string { return slices.Clone(codexTemplate[:]) }

// ContractHash is ContractHashOf(the binary digest, Template()).
func (c *Codex) ContractHash() string { return ContractHashOf(c.digest, codexTemplate[:]) }

// absASCII: an absolute path of printable ASCII only (no control byte, DEL or non-ASCII rune
// that a reader could split on or confuse), which also passes the launcher's slot rule.
func absASCII(v string) bool {
	if !slotValue(v) || v[0] != '/' {
		return false
	}
	for i := 0; i < len(v); i++ {
		if v[i] < 0x20 || v[i] > 0x7e {
			return false
		}
	}
	return true
}

// Argv fills Template's slots from spec: -C Cwd, --output-schema SchemaPath, -o ResultPath.
// ErrSpec unless: the binary digest equals the adapter's and InitExpect equals the template's
// digest, each a well-formed sha256 (rounds 1+3 and 4); no funded team (ruling 2), tool lease,
// profile field (round 4) or claude-only field; a pinned context profile; a finite positive
// budget; -C clean and, resolved, inside Worktree (never "/"); -o clean, outside Worktree after
// resolution and reaching no symlink; Env[CODEX_HOME] and Env[HOME] absent or exactly the
// pinned CodexHome and Home, clean and outside Worktree (rounds 2 and 3).
func (c *Codex) Argv(spec LaunchSpec) ([]string, error) {
	switch {
	case !harnessHash.MatchString(c.digest) || spec.BinaryDigest != c.digest:
		return nil, specErr("codex binary digest %q is not the pinned %q", spec.BinaryDigest, c.digest)
	case spec.InitExpect != codexPin:
		return nil, specErr("init_expect %q is not the locked line's digest %q", spec.InitExpect, codexPin)
	case spec.FundedTeam:
		return nil, specErr("nested agents are never allowed for codex")
	case len(spec.ToolLease.Allowed)+len(spec.ToolLease.Forbidden) > 0:
		return nil, specErr("a codex tool lease has no token: the locked line holds the limits")
	case spec.CodexProfile+spec.CodexProfileTOML+spec.ProfileDigest != "":
		return nil, specErr("a codex profile field was built for the superseded -p line")
	case spec.SettingsPath+spec.AgentsPath+spec.Record+spec.SessionID != "":
		return nil, specErr("a claude-only field has no codex token")
	case !budgetOK(spec.BudgetUSD):
		return nil, specErr("budget %v is not finite and positive", spec.BudgetUSD)
	}
	if _, ok := settingSources(spec.ContextProfile); !ok {
		return nil, specErr("context profile %q is not in the pinned table", spec.ContextProfile)
	}
	fill := map[string]string{"<worktree>": spec.Cwd, "<f>": spec.SchemaPath, "<result.json>": spec.ResultPath}
	for slot, v := range fill {
		if !cleanAbs(v) {
			return nil, specErr("slot %s value %q is not a clean absolute ASCII path", slot, v)
		}
	}
	wt := spec.Worktree
	cwdIn, cwdOK := inWorktree(spec.Cwd, wt) // resolved, so a symlink out of it is out
	switch {
	case !cleanAbs(wt) || wt == "/" || !within(spec.Cwd, wt) || !cwdIn || !cwdOK:
		return nil, specErr("-C %q is not inside the worktree %q", spec.Cwd, wt)
	case !noSymlink(spec.ResultPath) || !outsideWorktree(spec.ResultPath, wt):
		return nil, specErr("-o %q is inside the worktree or passes through a symlink", spec.ResultPath)
	case !pinnedEnv(spec.Env, "CODEX_HOME", spec.CodexHome, wt):
		return nil, specErr("CODEX_HOME is not absent or the pinned %q outside the worktree", spec.CodexHome)
	case !pinnedEnv(spec.Env, "HOME", spec.Home, wt):
		return nil, specErr("HOME is not absent or the pinned %q outside the worktree", spec.Home)
	}
	argv := make([]string, len(codexTemplate))
	for i, tok := range codexTemplate {
		if v, ok := fill[tok]; ok {
			argv[i] = v
		} else {
			argv[i] = tok
		}
	}
	return argv, nil
}

// cleanAbs: an absolute printable-ASCII path that filepath.Clean leaves unchanged (no "..", ".",
// doubled or trailing slash).
func cleanAbs(v string) bool { return absASCII(v) && filepath.Clean(v) == v }

// within: p is root or below it. Both are clean absolute paths.
func within(p, root string) bool { return p == root || strings.HasPrefix(p, root+"/") }

// noSymlink: neither p nor any existing ancestor is a symlink. An ancestor that does not exist
// yet is fine; any other Lstat error is refused.
func noSymlink(p string) bool {
	for ; p != "/"; p = filepath.Dir(p) {
		fi, err := os.Lstat(p)
		if err == nil && fi.Mode()&os.ModeSymlink != 0 || err != nil && !errors.Is(err, fs.ErrNotExist) {
			return false
		}
	}
	return true
}

// resolve is p through EvalSymlinks on its longest existing prefix, the rest appended. A dangling
// symlink, or any error but not-exist, fails: it is never taken for a path not made yet.
func resolve(p string) (string, bool) {
	rest := ""
	for q := p; ; q = filepath.Dir(q) {
		r, err := filepath.EvalSymlinks(q)
		if err == nil {
			return filepath.Join(r, rest), true
		}
		if _, lerr := os.Lstat(q); lerr == nil || !errors.Is(err, fs.ErrNotExist) || q == "/" {
			return "", false
		}
		rest = filepath.Join(filepath.Base(q), rest)
	}
}

// inWorktree: p, resolved, is the resolved worktree or below it, by path or by the identity of an
// existing ancestor (a case variant on a case-insensitive filesystem). ok is false when either
// cannot be resolved, or the worktree resolves to "/".
func inWorktree(p, wt string) (in, ok bool) {
	rp, okP := resolve(p)
	rw, okW := resolve(wt)
	if !okP || !okW || rw == "/" {
		return false, false
	}
	if within(rp, rw) {
		return true, true
	}
	wfi, err := os.Stat(rw)
	if err != nil {
		return false, errors.Is(err, fs.ErrNotExist)
	}
	for q := rp; ; q = filepath.Dir(q) {
		if fi, err := os.Stat(q); err == nil && os.SameFile(fi, wfi) {
			return true, true
		}
		if q == "/" {
			return false, true
		}
	}
}

// outsideWorktree: p is clean and resolves outside the worktree.
func outsideWorktree(p, wt string) bool {
	in, ok := inWorktree(p, wt)
	return cleanAbs(p) && ok && !in
}

// pinnedEnv: Env[name] is absent, or exactly pin; a pin, when set, is clean, not "/" and
// outside the worktree (codex reads CODEX_HOME, else $HOME/.codex: DR-B1-07 rounds 2 and 3).
func pinnedEnv(env map[string]string, name, pin, wt string) bool {
	v, set := env[name]
	if pin != "" && (pin == "/" || !outsideWorktree(pin, wt)) {
		return false
	}
	return !set || pin != "" && v == pin
}

// codexStream is what Watch read from a codex --json stream.
type codexStream struct {
	thread    string  // thread.started's thread_id: the session id
	state     int     // 0 want thread.started, 1 want turn.started, 2 in the turn, 3 the turn ended
	completed bool    // turn.completed closed the turn
	signal    bool    // an error event or item, turn.failed or a nested agent: never a pass (rulings 2, 6)
	answer    *string // the last item.completed agent_message text
	children  []ChildJob
}

// codexQuietItems are the item types (serde strings of codex-cli 0.154.0) that neither answer
// nor signal; agent_message, collab_tool_call and error are handled apart. Byte-for-byte.
var codexQuietItems = [...]string{"reasoning", "command_execution", "file_change", "mcp_tool_call",
	"web_search", "todo_list"}

// dupFree: no JSON object anywhere in b repeats a key. encoding/json lets the last duplicate
// win; the worker must never pick which one the adapter reads.
func dupFree(b []byte) bool {
	d := json.NewDecoder(bytes.NewReader(b))
	var keys []map[string]bool // one per open container; nil for an array
	var wantKey []bool
	for {
		tok, err := d.Token()
		if err == io.EOF {
			return true
		} else if err != nil {
			return false
		}
		n := len(keys)
		if s, isStr := tok.(string); isStr && n > 0 && keys[n-1] != nil && wantKey[n-1] {
			if keys[n-1][s] {
				return false
			}
			keys[n-1][s], wantKey[n-1] = true, false
			continue
		}
		switch tok {
		case json.Delim('{'):
			keys, wantKey = append(keys, map[string]bool{}), append(wantKey, true)
			continue
		case json.Delim('['):
			keys, wantKey = append(keys, nil), append(wantKey, false)
			continue
		case json.Delim('}'), json.Delim(']'):
			keys, wantKey = keys[:n-1], wantKey[:n-1]
		}
		if m := len(keys); m > 0 && keys[m-1] != nil {
			wantKey[m-1] = true // a value ended: its object expects a key next
		}
	}
}

// Watch reads the `codex exec --json` stream from r to EOF, one event per '\n'-ended line (a
// trailing '\r' is dropped: a pseudo-TTY writes CRLF); a line may be of any length. initExpect is
// the pinned digest of the locked line (round 4): one that is not a well-formed sha256 was never pinned,
// so Watch calls abort(ReasonHarness) before reading and returns ErrHarness.
//
// The stream must be thread.started (a non-empty thread_id), turn.started, items, then
// turn.completed, with nothing after the turn ends. Any other order, a line that is not one
// JSON object with a string type and no repeated key, an item with no string type and id, or an
// agent_message whose completed text is not a string is a line out of shape; an unknown event
// or item type is counted apart. Keys are matched exactly.
func (c *Codex) Watch(r io.Reader, initExpect string, abort func(Reason)) (Transcript, error) {
	var t Transcript
	if !harnessHash.MatchString(initExpect) {
		t.aborted = true
		abort(ReasonHarness)
		return t, ErrHarness
	}
	t.cx = &codexStream{}
	br := bufio.NewReaderSize(r, 64<<10)
	for {
		line, rerr := br.ReadBytes('\n')
		if len(line) > 0 {
			t.codexLine(bytes.TrimSuffix(bytes.TrimSuffix(line, []byte("\n")), []byte("\r")))
		}
		if rerr == io.EOF {
			return t, nil
		}
		if rerr != nil {
			t.readErr = true
			return t, rerr
		}
	}
}

func (t *Transcript) codexLine(line []byte) {
	s := t.cx
	o, ok := objectOf(line)
	typ, okType := o.str("type")
	if !ok || !okType || !dupFree(line) || s.state == 3 {
		t.unparsed++
		return
	}
	bad := func(b bool) {
		if b {
			t.unparsed++
		}
	}
	switch typ {
	case "thread.started":
		id, ok := o.str("thread_id")
		if s.state != 0 || !ok || id == "" {
			t.unparsed++
			return
		}
		s.thread, s.state = id, 1
	case "turn.started":
		bad(s.state != 1)
		s.state = 2
	case "turn.completed":
		bad(s.state != 2)
		s.state, s.completed = 3, true
	case "turn.failed": // a typed failure only inside the turn; anywhere else it is out of shape
		bad(s.state != 2)
		s.state, s.signal = 3, true
	case "error":
		s.signal = true
	case "item.started", "item.updated", "item.completed":
		it, ok := objectOf(o["item"])
		ityp, okType := it.str("type")
		id, okID := it.str("id")
		if s.state != 2 || !ok || !okType || !okID || id == "" {
			t.unparsed++
			return
		}
		switch {
		case ityp == "agent_message":
			if typ == "item.completed" {
				text, ok := it.str("text")
				bad(!ok)
				s.answer = &text
			}
		case ityp == "collab_tool_call":
			s.signal = true
			if !slices.ContainsFunc(s.children, func(c ChildJob) bool { return c.ToolUseID == id }) {
				tool, _ := it.str("tool")
				s.children = append(s.children, ChildJob{ToolUseID: id, Tool: tool})
			}
		case ityp == "error":
			s.signal = true
		case !slices.Contains(codexQuietItems[:], ityp):
			t.unknown++
		}
	default:
		t.unknown++ // ruling 6: an unrecognised signal is never a pass
	}
}

// Classify maps the stream to a WorkerOutcome; it never uses the worker's own claim.
// Precedence, first match wins: the shared stops (no pin, a kill); an unknown event or item, a
// line out of shape or a read error → unresolved(unparsed); an error, turn.failed or nested
// agent → unresolved (rulings 2, 6: the rate-limit shape is unmeasured); no turn.completed or no
// answer (empty stdout, Codex bug #19945) → unresolved(unparsed); a non-zero exit → unresolved;
// an -o file that is missing or not the answer byte for byte → unresolved(unparsed) (ruling 5);
// an answer that is not a non-empty JSON object → unresolved; else adjudicate.
func (c *Codex) Classify(t Transcript, exit ExitInfo) WorkerOutcome {
	var o WorkerOutcome
	s := t.cx
	if s != nil {
		o.SessionID = s.thread
	}
	set := func(st Status, r Reason) WorkerOutcome {
		o.Status, o.Reason = st, r
		return o
	}
	if st, r, ok := stopped(t.aborted || s == nil, exit.Killed); ok {
		return set(st, r)
	}
	switch {
	case t.unknown > 0 || t.unparsed > 0 || t.readErr:
		return set(Unresolved, ReasonUnparsed)
	case s.signal:
		return set(Unresolved, "")
	case !s.completed || s.answer == nil:
		return set(Unresolved, ReasonUnparsed)
	case exit.Code != 0:
		return set(Unresolved, "")
	case !exit.ResultFileRead || exit.ResultFile != *s.answer:
		return set(Unresolved, ReasonUnparsed)
	case !nonEmptyObject(json.RawMessage(*s.answer)) || !dupFree([]byte(*s.answer)):
		return set(Unresolved, "")
	}
	o.Output = json.RawMessage(*s.answer)
	return set(Adjudicate, "")
}

// Children returns every nested agent (collab_tool_call) in t, by item id, in order of first
// appearance, whether or not it completed.
func (c *Codex) Children(t Transcript) []ChildJob {
	if t.cx == nil {
		return nil
	}
	return slices.Clone(t.cx.children)
}
