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
	"regexp"
	"slices"
	"strings"
)

// Codex is the WorkerAdapter for the `codex` CLI (09a §8.1: codex-cli 0.154.0, `exec` with -s, -p,
// --json, --output-schema, -o, --ephemeral), under the founder rulings in
// docs/vision-v3/_process/DR-B1-07-CODEX-RULINGS-2026-10-02.md.
type Codex struct {
	digest string
}

// NewCodex returns the adapter for the codex binary whose content digest is binaryDigest
// ("sha256:<hex>", the launcher grant's Binary.Digest): the pinned binary hash (ruling 1+3).
func NewCodex(binaryDigest string) *Codex { return &Codex{digest: binaryDigest} }

var _ WorkerAdapter = (*Codex)(nil)

// codexTemplate is the pinned codex line of 09a §8.2 plus --ignore-rules (DR-B1-07 round 2:
// ruling 4's --ignore-user-config stops -p loading the profile on 0.154.0, so it is never passed;
// --ignore-rules keeps user and project execpolicy .rules files out and leaves the profile loaded).
var codexTemplate = [...]string{"exec", "-C", "<worktree>", "-s", "workspace-write", "-p", "<profile>",
	"--json", "--output-schema", "<f>", "-o", "<result.json>", "--ephemeral", "--ignore-rules"}

// codexRequiredKeys: every safety-relevant key the pinned profile must set itself, because the
// user's config is honoured (DR-B1-07 round 2). A dotted key lives in the table before the dot.
var codexRequiredKeys = [...]string{"approval_policy", "approvals_reviewer", "sandbox_mode",
	"sandbox_workspace_write.network_access", "sandbox_workspace_write.writable_roots",
	"sandbox_workspace_write.exclude_tmpdir_env_var", "sandbox_workspace_write.exclude_slash_tmp",
	"shell_environment_policy.inherit", "mcp_servers", "web_search", "model_provider",
	"model_providers", "notify", "hooks", "features", "tools", "projects"}

var (
	tomlTable = regexp.MustCompile(`^\[([A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*)\]$`)
	tomlKey   = regexp.MustCompile(`^([A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*)[ \t]*=[ \t]*\S`)
)

// profileComplete reads the generated profile line by line: blank lines, '#' comments, [table]
// headers and single-line `bare.key = value` pairs, nothing else (a multi-line value is refused).
// It refuses a repeated table or key, and requires every codexRequiredKeys entry by exact bytes.
// It checks presence only, never values (DR round 2, residual risk).
func profileComplete(toml string) bool {
	seen := map[string]bool{}
	table := ""
	for _, line := range strings.Split(toml, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || line[0] == '#' {
			continue
		}
		if m := tomlTable.FindStringSubmatch(line); m != nil {
			if seen["["+m[1]+"]"] {
				return false
			}
			seen["["+m[1]+"]"], table = true, m[1]+"."
			continue
		}
		m := tomlKey.FindStringSubmatch(line)
		if m == nil || seen[table+m[1]] {
			return false
		}
		seen[table+m[1]] = true
	}
	for _, k := range codexRequiredKeys {
		if !seen[k] {
			return false
		}
	}
	return true
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

// Family is "codex".
func (c *Codex) Family() string { return "codex" }

// Template is codexTemplate as argv[1:] tokens, "<name>" tokens being slots; a fresh copy.
func (c *Codex) Template() []string { return slices.Clone(codexTemplate[:]) }

// ContractHash is ContractHashOf(the binary digest, Template()).
func (c *Codex) ContractHash() string { return ContractHashOf(c.digest, codexTemplate[:]) }

// profileName: a codex -p value is a profile name, never a path: ASCII letters, digits, '_'
// and '-', not beginning with '-'.
var profileName = regexp.MustCompile(`^[A-Za-z0-9_][A-Za-z0-9_-]*$`)

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

// Argv fills Template's slots from spec: -C Cwd, -p CodexProfile, --output-schema SchemaPath,
// -o ResultPath. Before that it checks the two pins (ruling 1+3): BinaryDigest equals the
// adapter's binary digest, and ProfileDigest equals InitExpect, the pinned profile hash, each a
// well-formed sha256. A tool lease (the profile holds it), a funded team (ruling 2: never for
// codex), a claude-only field, a context profile outside the pinned table and a budget that is
// not finite and positive are ErrSpec too. Round 2: CodexProfileTOML must hash to the pin and set
// every codexRequiredKeys entry; -C is clean and inside Worktree (never "/"); -o is clean, outside
// Worktree and reaches no symlink; Env[CODEX_HOME] is absent or exactly the pinned CodexHome,
// which is clean and outside Worktree.
func (c *Codex) Argv(spec LaunchSpec) ([]string, error) {
	switch {
	case !harnessHash.MatchString(c.digest) || spec.BinaryDigest != c.digest:
		return nil, specErr("codex binary digest %q is not the pinned %q", spec.BinaryDigest, c.digest)
	case !harnessHash.MatchString(spec.InitExpect) || spec.ProfileDigest != spec.InitExpect:
		return nil, specErr("profile digest %q is not the pinned %q", spec.ProfileDigest, spec.InitExpect)
	case spec.FundedTeam:
		return nil, specErr("nested agents are never allowed for codex")
	case len(spec.ToolLease.Allowed)+len(spec.ToolLease.Forbidden) > 0:
		return nil, specErr("a codex tool lease belongs in the pinned profile")
	case spec.SettingsPath+spec.AgentsPath+spec.Record+spec.SessionID != "":
		return nil, specErr("a claude-only field has no codex token")
	case !budgetOK(spec.BudgetUSD):
		return nil, specErr("budget %v is not finite and positive", spec.BudgetUSD)
	case !profileName.MatchString(spec.CodexProfile):
		return nil, specErr("codex profile %q is not a profile name", spec.CodexProfile)
	}
	if _, ok := settingSources(spec.ContextProfile); !ok {
		return nil, specErr("context profile %q is not in the pinned table", spec.ContextProfile)
	}
	sum := sha256.Sum256([]byte(spec.CodexProfileTOML))
	if "sha256:"+hex.EncodeToString(sum[:]) != spec.InitExpect || !profileComplete(spec.CodexProfileTOML) {
		return nil, specErr("profile bytes are not the pinned profile, or it does not set every required key")
	}
	fill := map[string]string{"<worktree>": spec.Cwd, "<f>": spec.SchemaPath, "<result.json>": spec.ResultPath}
	for slot, v := range fill {
		if !cleanAbs(v) {
			return nil, specErr("slot %s value %q is not a clean absolute ASCII path", slot, v)
		}
	}
	wt, home := spec.Worktree, spec.CodexHome
	envHome, homeSet := spec.Env["CODEX_HOME"]
	switch {
	case !cleanAbs(wt) || wt == "/" || !within(spec.Cwd, wt):
		return nil, specErr("-C %q is not inside the worktree %q", spec.Cwd, wt)
	case within(spec.ResultPath, wt) || !noSymlink(spec.ResultPath):
		return nil, specErr("-o %q is inside the worktree or passes through a symlink", spec.ResultPath)
	case home != "" && (!cleanAbs(home) || within(home, wt)), homeSet && (home == "" || envHome != home):
		return nil, specErr("CODEX_HOME %q is not the pinned %q outside the worktree", envHome, home)
	}
	fill["<profile>"] = spec.CodexProfile
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
// the pinned profile hash (ruling 1+3): one that is not a well-formed sha256 was never pinned,
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
