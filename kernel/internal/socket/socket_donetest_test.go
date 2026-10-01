//go:build donetest

// B1-03 done-test (docs/vision-v3/14-BUILD-PLAN.md §6): "Userland's direct append fails at the OS
// (mode 660); a malformed command is refused and journaled". This file and
// testdata/socket/commands.json are hash-registered in build/done-tests/B1-03.yml; editing either
// changes the job's acceptance, which is a register change, not a fix. socket.go is the contract
// the job implements and is not registered.
//
// Canon: 09a §2 (the socket is `avk:avd`, mode 660; the KernelCommand verbs) and §4.1 (the Journal
// is owner avk, mode 600).
//
// Run: go -C kernel test -tags donetest -count=1 ./internal/socket/
package socket_test

import (
	"bufio"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io/fs"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"slices"
	"strings"
	"sync"
	"syscall"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
	"github.com/Adam077K/agentvibe/kernel/internal/nouns"
	"github.com/Adam077K/agentvibe/kernel/internal/socket"
)

// verbs is 09a §2's KernelCommand, every cmd value. The fixture must cover each exactly once.
var verbs = []string{"propose_event", "request_leases", "propose_effect", "admit_job", "compile", "renew", "release"}

type validCase struct {
	Name    string          `json:"name"`
	Command json.RawMessage `json:"command"`
}

type invalidCase struct {
	Name   string `json:"name"`
	Reason string `json:"reason"`
	Why    string `json:"why"`
	Line   string `json:"line"`
}

type fixtures struct {
	Comment string        `json:"comment"`
	Valid   []validCase   `json:"valid"`
	Invalid []invalidCase `json:"invalid"`
}

func load(t *testing.T) fixtures {
	t.Helper()
	b, err := os.ReadFile(filepath.Join("testdata", "socket", "commands.json"))
	if err != nil {
		t.Fatalf("fixture: %v", err)
	}
	var f fixtures
	d := json.NewDecoder(bytes.NewReader(b))
	d.DisallowUnknownFields()
	if err := d.Decode(&f); err != nil {
		t.Fatalf("fixture: %v", err)
	}
	if len(f.Valid) == 0 || len(f.Invalid) == 0 {
		t.Fatalf("fixture: %d valid, %d invalid; want both non-empty", len(f.Valid), len(f.Invalid))
	}
	reasons := []string{socket.ReasonBadJSON, socket.ReasonMissingField, socket.ReasonUnknownCmd, socket.ReasonInvalidField}
	seen := map[string]bool{}
	for _, c := range f.Invalid {
		if !slices.Contains(reasons, c.Reason) {
			t.Fatalf("fixture %s: reason %q is not a socket.Reason constant", c.Name, c.Reason)
		}
		if strings.ContainsRune(c.Line, '\n') {
			t.Fatalf("fixture %s: a line may not hold a newline", c.Name)
		}
		seen[c.Reason] = true
	}
	for _, r := range reasons {
		if !seen[r] {
			t.Fatalf("fixture: no invalid case has reason %q", r)
		}
	}
	return f
}

// cmdOf returns the command's cmd string.
func cmdOf(t *testing.T, raw json.RawMessage) string {
	t.Helper()
	var head struct {
		Cmd string `json:"cmd"`
	}
	if err := json.Unmarshal(raw, &head); err != nil || head.Cmd == "" {
		t.Fatalf("fixture command without a cmd: %s", raw)
	}
	return head.Cmd
}

func compact(t *testing.T, raw []byte) []byte {
	t.Helper()
	var b bytes.Buffer
	if err := json.Compact(&b, raw); err != nil {
		t.Fatalf("compact %s: %v", raw, err)
	}
	return b.Bytes()
}

// sameJSON compares by value, so key order and spacing do not matter.
func sameJSON(t *testing.T, got, want []byte) bool {
	t.Helper()
	var g, w any
	if err := json.Unmarshal(got, &g); err != nil {
		return false
	}
	if err := json.Unmarshal(want, &w); err != nil {
		t.Fatalf("want is not JSON: %s", want)
	}
	return reflect.DeepEqual(g, w)
}

// fakeBackend records each call and answers {"fake":"<verb>"}, so a response proves its route.
type call struct {
	verb string
	arg  any
}

type fakeBackend struct {
	mu    sync.Mutex
	calls []call
}

func (f *fakeBackend) record(verb string, arg any) (json.RawMessage, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.calls = append(f.calls, call{verb, arg})
	return json.RawMessage(`{"fake":"` + verb + `"}`), nil
}

func (f *fakeBackend) snapshot() []call {
	f.mu.Lock()
	defer f.mu.Unlock()
	return slices.Clone(f.calls)
}

func (f *fakeBackend) RequestLeases(_ context.Context, c socket.RequestLeases) (json.RawMessage, error) {
	return f.record("request_leases", c)
}
func (f *fakeBackend) ProposeEffect(_ context.Context, c socket.ProposeEffect) (json.RawMessage, error) {
	return f.record("propose_effect", c)
}
func (f *fakeBackend) AdmitJob(_ context.Context, c socket.AdmitJob) (json.RawMessage, error) {
	return f.record("admit_job", c)
}
func (f *fakeBackend) Compile(_ context.Context, c socket.Compile) (json.RawMessage, error) {
	return f.record("compile", c)
}
func (f *fakeBackend) Renew(_ context.Context, c socket.LeaseCommand) (json.RawMessage, error) {
	return f.record("renew", c)
}
func (f *fakeBackend) Release(_ context.Context, c socket.LeaseCommand) (json.RawMessage, error) {
	return f.record("release", c)
}

type kernel struct {
	dir, sock, journal string
	gid                int
	backend            *fakeBackend
	srv                socket.Server
	closed             bool
}

// close stops the server; the Journal can only be opened by the test once its single writer is gone.
func (k *kernel) close(t *testing.T) {
	t.Helper()
	if k.closed {
		return
	}
	k.closed = true
	if err := k.srv.Close(); err != nil {
		t.Fatalf("Close: %v", err)
	}
}

// userlandGID picks a group the test user belongs to that is neither its primary group nor dir's
// group, so a server that never chowns the socket (and inherits either) is caught. Fallbacks are
// logged, because they weaken that check.
func userlandGID(t *testing.T, dir string) int {
	t.Helper()
	fi, err := os.Stat(dir)
	if err != nil {
		t.Fatal(err)
	}
	dirGID := int(fi.Sys().(*syscall.Stat_t).Gid)
	groups, _ := os.Getgroups()
	for _, g := range groups {
		if g != os.Getgid() && g != dirGID {
			return g
		}
	}
	for _, g := range groups {
		if g != dirGID {
			t.Logf("WEAK: no group distinct from the primary group; using %d", g)
			return g
		}
	}
	t.Logf("WEAK: no group distinct from the directory's group %d", dirGID)
	return os.Getgid()
}

// start serves a Kernel in a fresh short directory (a Unix socket path is capped near 104 bytes).
// The umask is 0 while it runs: the modes under test must be the Kernel's choice, not inherited.
func start(t *testing.T) *kernel {
	t.Helper()
	dir, err := os.MkdirTemp("", "avk-b103-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(dir) })
	old := syscall.Umask(0)
	t.Cleanup(func() { syscall.Umask(old) })
	k := &kernel{
		dir:     dir,
		sock:    filepath.Join(dir, "avk.sock"),
		journal: filepath.Join(dir, "journal.db"),
		backend: &fakeBackend{},
	}
	k.gid = userlandGID(t, dir)
	srv, err := socket.Serve(context.Background(), socket.Config{
		SocketPath:  k.sock,
		JournalPath: k.journal,
		UserlandGID: k.gid,
		Backend:     k.backend,
	})
	if err != nil {
		t.Fatalf("Serve: %v", err)
	}
	if srv == nil {
		t.Fatal("Serve returned a nil Server and no error")
	}
	k.srv = srv
	t.Cleanup(func() {
		if !k.closed {
			k.closed = true
			k.srv.Close()
		}
	})
	return k
}

// conn is one client connection with a line reader.
type conn struct {
	c net.Conn
	r *bufio.Reader
}

func dial(t *testing.T, k *kernel) *conn {
	t.Helper()
	c, err := net.DialTimeout("unix", k.sock, 5*time.Second)
	if err != nil {
		t.Fatalf("dial %s: %v", k.sock, err)
	}
	t.Cleanup(func() { c.Close() })
	return &conn{c: c, r: bufio.NewReader(c)}
}

// send writes line plus '\n' and reads exactly one Response line.
func (c *conn) send(t *testing.T, line string) socket.Response {
	t.Helper()
	c.c.SetDeadline(time.Now().Add(10 * time.Second))
	if _, err := c.c.Write([]byte(line + "\n")); err != nil {
		t.Fatalf("write: %v", err)
	}
	reply, err := c.r.ReadBytes('\n')
	if err != nil {
		t.Fatalf("no response line to %q: %v (got %q)", line, err, reply)
	}
	var resp socket.Response
	d := json.NewDecoder(bytes.NewReader(reply))
	d.DisallowUnknownFields()
	if err := d.Decode(&resp); err != nil {
		t.Fatalf("response %q is not a socket.Response: %v", reply, err)
	}
	return resp
}

func openJournal(t *testing.T, k *kernel) journal.Journal {
	t.Helper()
	j, err := journal.Open(k.journal)
	if err != nil {
		t.Fatalf("journal.Open after Close: %v", err)
	}
	t.Cleanup(func() { j.Close() })
	return j
}

// sent is one malformed line as it went over the wire, with the refusal it must produce.
type sent struct {
	name, reason, line string
}

// TestB103MalformedRefusedAndJournaled: every malformed line gets {"ok":false,"reason":…}, reaches
// no Backend, appends nothing to the stream it names, and leaves exactly one command.refused event
// carrying that line's digest. Kills: a socket that refuses but does not journal (no refusal
// events); one that journals but accepts (ok:true, a Backend call, or an event on venture:v_keel);
// one that journals only some reasons (count and per-line digest).
func TestB103MalformedRefusedAndJournaled(t *testing.T) {
	f := load(t)

	// The label cases are malformed because B1-02 refuses their label: hold the fixture to that.
	var good struct {
		Label json.RawMessage `json:"label"`
	}
	for _, v := range f.Valid {
		if cmdOf(t, v.Command) == "propose_event" {
			json.Unmarshal(v.Command, &good)
		}
	}
	if _, err := nouns.Decode[nouns.Label](good.Label); err != nil {
		t.Fatalf("fixture: the well-formed propose_event's label fails B1-02: %v", err)
	}
	labelCases := 0
	for _, c := range f.Invalid {
		if !strings.Contains(c.Name, ".label-") {
			continue
		}
		labelCases++
		var bad struct {
			Label json.RawMessage `json:"label"`
		}
		if err := json.Unmarshal([]byte(c.Line), &bad); err != nil {
			t.Fatalf("fixture %s: %v", c.Name, err)
		}
		if _, err := nouns.Decode[nouns.Label](bad.Label); err == nil {
			t.Fatalf("fixture %s: B1-02 accepts this label, so the case tests nothing", c.Name)
		}
	}
	if labelCases == 0 {
		t.Fatal("fixture: no case carries a label B1-02 refuses")
	}

	k := start(t)
	var all []sent
	for _, c := range f.Invalid {
		resp := dial(t, k).send(t, c.Line)
		if resp.OK || resp.Reason != c.Reason || len(resp.Result) != 0 {
			t.Errorf("%s (%s): response %+v; want ok:false reason %q and no result", c.Name, c.Why, resp, c.Reason)
		}
		all = append(all, sent{c.Name, c.Reason, c.Line})
	}
	// A refusal does not end the connection: two malformed lines on one connection, both answered.
	shared := dial(t, k)
	for i, c := range []invalidCase{f.Invalid[0], f.Invalid[len(f.Invalid)-1]} {
		resp := shared.send(t, c.Line)
		if resp.OK || resp.Reason != c.Reason {
			t.Errorf("shared connection, line %d (%s): response %+v; want ok:false reason %q", i+1, c.Name, resp, c.Reason)
		}
		all = append(all, sent{c.Name + " (shared connection)", c.Reason, c.Line})
	}
	if calls := k.backend.snapshot(); len(calls) != 0 {
		t.Errorf("a refused command reached the Backend: %+v", calls)
	}
	k.close(t)

	j := openJournal(t, k)
	ctx := context.Background()
	streams, err := j.Streams(ctx)
	if err != nil {
		t.Fatalf("Streams: %v", err)
	}
	if !slices.Equal(streams, []string{socket.RefusalStream}) {
		t.Errorf("Journal streams %q; want only %q (a refused command appends nothing it names)", streams, socket.RefusalStream)
	}
	evs, err := j.Read(ctx, socket.RefusalStream, 1)
	if err != nil {
		t.Fatalf("Read %s: %v", socket.RefusalStream, err)
	}
	if len(evs) != len(all) {
		t.Fatalf("%d refusal events for %d refused lines; want one each", len(evs), len(all))
	}
	for i, ev := range evs {
		s := all[i]
		if ev.Type != socket.RefusalType {
			t.Errorf("refusal %d (%s): type %q; want %q", i+1, s.name, ev.Type, socket.RefusalType)
			continue
		}
		var data socket.RefusalData
		d := json.NewDecoder(bytes.NewReader(ev.Data))
		d.DisallowUnknownFields()
		if err := d.Decode(&data); err != nil {
			t.Errorf("refusal %d (%s): data %q is not RefusalData: %v", i+1, s.name, ev.Data, err)
			continue
		}
		sum := sha256.Sum256([]byte(s.line))
		if data.SHA256 != hex.EncodeToString(sum[:]) || data.Bytes != len(s.line) {
			t.Errorf("refusal %d (%s): sha256 %s bytes %d; want the line's, %x and %d", i+1, s.name, data.SHA256, data.Bytes, sum, len(s.line))
		}
		if data.Reason != s.reason {
			t.Errorf("refusal %d (%s): reason %q; want %q", i+1, s.name, data.Reason, s.reason)
		}
		if s.reason == socket.ReasonUnknownCmd {
			var head struct {
				Cmd string `json:"cmd"`
			}
			json.Unmarshal([]byte(s.line), &head)
			if data.Cmd != head.Cmd {
				t.Errorf("refusal %d (%s): cmd %q; want %q", i+1, s.name, data.Cmd, head.Cmd)
			}
		}
	}
	if err := j.Verify(ctx); err != nil {
		t.Errorf("Verify: %v", err)
	}
}

// TestB103EachVerbAcceptsWellFormed: one well-formed command per 09a §2 verb is answered ok:true
// and journals no refusal. propose_event appends exactly one event; every other verb reaches its
// own Backend method once, with the command's fields, and its result comes back. Kills: a socket
// that refuses a valid verb, routes renew to Release (or any swap), drops a field, or journals a
// refusal for an accepted command.
func TestB103EachVerbAcceptsWellFormed(t *testing.T) {
	f := load(t)
	byVerb := map[string]json.RawMessage{}
	for _, v := range f.Valid {
		cmd := cmdOf(t, v.Command)
		if _, dup := byVerb[cmd]; dup {
			t.Fatalf("fixture: two well-formed %s commands", cmd)
		}
		byVerb[cmd] = v.Command
	}
	for _, v := range verbs {
		if byVerb[v] == nil {
			t.Fatalf("fixture: no well-formed %s", v)
		}
	}
	if len(byVerb) != len(verbs) {
		t.Fatalf("fixture: %d verbs; want exactly 09a §2's %d", len(byVerb), len(verbs))
	}

	k := start(t)
	for _, v := range verbs {
		line := string(compact(t, byVerb[v]))
		resp := dial(t, k).send(t, line)
		if !resp.OK || resp.Reason != "" {
			t.Errorf("%s: response %+v; want ok:true", v, resp)
			continue
		}
		if v != "propose_event" && !sameJSON(t, resp.Result, []byte(`{"fake":"`+v+`"}`)) {
			t.Errorf("%s: result %s; want the %s Backend's own answer", v, resp.Result, v)
		}
	}

	// Each Backend verb was called once, with the command's fields.
	raw := map[string]map[string]json.RawMessage{}
	for v, b := range byVerb {
		m := map[string]json.RawMessage{}
		json.Unmarshal(b, &m)
		raw[v] = m
	}
	str := func(v, k string) string {
		var s string
		json.Unmarshal(raw[v][k], &s)
		return s
	}
	var resources []string
	json.Unmarshal(raw["request_leases"]["resources"], &resources)
	want := map[string]any{
		"request_leases": socket.RequestLeases{Job: str("request_leases", "job"), Resources: resources,
			Mode: str("request_leases", "mode"), Policy: str("request_leases", "policy")},
		"propose_effect": socket.ProposeEffect{Verb: str("propose_effect", "verb"), Target: raw["propose_effect"]["target"],
			BusinessRef: str("propose_effect", "business_ref"), PayloadRef: str("propose_effect", "payload_ref"),
			LeaseTokens: raw["propose_effect"]["lease_tokens"]},
		"admit_job": socket.AdmitJob{Spec: raw["admit_job"]["spec"]},
		"compile":   socket.Compile{Action: raw["compile"]["action"]},
		"renew":     socket.LeaseCommand{LeaseID: str("renew", "lease_id"), Token: 18446744073709551615},
		"release":   socket.LeaseCommand{LeaseID: str("release", "lease_id"), Token: 7},
	}
	if str("renew", "token") != "18446744073709551615" || str("release", "token") != "7" {
		t.Fatal("fixture: renew/release tokens changed; update the expected values here too")
	}
	calls := k.backend.snapshot()
	if len(calls) != len(want) {
		t.Errorf("%d Backend calls %+v; want %d, one per non-propose_event verb", len(calls), calls, len(want))
	}
	for _, c := range calls {
		w, ok := want[c.verb]
		if !ok {
			t.Errorf("unexpected Backend call %s", c.verb)
			continue
		}
		delete(want, c.verb)
		if !sameArg(t, c.arg, w) {
			t.Errorf("%s: Backend got %+v; want %+v", c.verb, c.arg, w)
		}
	}
	for v := range want {
		t.Errorf("%s: never reached its Backend method", v)
	}
	k.close(t)

	j := openJournal(t, k)
	ctx := context.Background()
	if seq, _, err := j.Head(ctx, socket.RefusalStream); err != nil || seq != 0 {
		t.Errorf("refusal stream head %d (err %v); want 0: nothing was malformed", seq, err)
	}
	pe := raw["propose_event"]
	stream := str("propose_event", "stream")
	evs, err := j.Read(ctx, stream, 1)
	if err != nil {
		t.Fatalf("Read %s: %v", stream, err)
	}
	if len(evs) != 1 {
		t.Fatalf("propose_event: %d events on %s; want 1", len(evs), stream)
	}
	ev := evs[0]
	if ev.Seq != 1 || ev.Type != str("propose_event", "type") {
		t.Errorf("propose_event: appended seq %d type %q; want seq 1 (expect_seq 0) type %q", ev.Seq, ev.Type, str("propose_event", "type"))
	}
	var data map[string]json.RawMessage
	if err := json.Unmarshal(ev.Data, &data); err != nil {
		t.Fatalf("propose_event: event data %q is not a JSON object: %v", ev.Data, err)
	}
	for _, key := range []string{"label", "data"} {
		if !sameJSON(t, data[key], pe[key]) {
			t.Errorf("propose_event: event data.%s %s; want the command's %s", key, data[key], pe[key])
		}
	}
	if err := j.Verify(ctx); err != nil {
		t.Errorf("Verify: %v", err)
	}
}

// sameArg compares Backend arguments with their raw-JSON fields compared by value.
func sameArg(t *testing.T, got, want any) bool {
	t.Helper()
	norm := func(v any) any {
		switch a := v.(type) {
		case socket.ProposeEffect:
			a.Target = compact(t, a.Target)
			a.LeaseTokens = compact(t, a.LeaseTokens)
			return a
		case socket.AdmitJob:
			a.Spec = compact(t, a.Spec)
			return a
		case socket.Compile:
			a.Action = compact(t, a.Action)
			return a
		}
		return v
	}
	return reflect.DeepEqual(norm(got), norm(want))
}

// TestB103SocketIsAvkAvd0660: the socket is owned by the Kernel's uid, grouped to Userland's gid,
// mode exactly 0660 (09a §2). Kills: a socket left at 0666 (any local user may command the
// Kernel), one at the umask default, and one never chowned to the avd group.
func TestB103SocketIsAvkAvd0660(t *testing.T) {
	k := start(t)
	fi, err := os.Lstat(k.sock)
	if err != nil {
		t.Fatalf("Lstat socket: %v", err)
	}
	if fi.Mode()&fs.ModeSocket == 0 {
		t.Fatalf("%s is %v; want a Unix socket", k.sock, fi.Mode())
	}
	perm := fi.Mode() & (fs.ModePerm | fs.ModeSetuid | fs.ModeSetgid | fs.ModeSticky)
	if perm != 0o660 {
		t.Errorf("socket mode %#o; want exactly 0660", perm)
	}
	st := fi.Sys().(*syscall.Stat_t)
	if int(st.Uid) != os.Geteuid() {
		t.Errorf("socket owner uid %d; want the Kernel's, %d", st.Uid, os.Geteuid())
	}
	if int(st.Gid) != k.gid {
		t.Errorf("socket group gid %d; want Config.UserlandGID %d", st.Gid, k.gid)
	}
	// The group can use it: a member connects and is answered.
	if resp := dial(t, k).send(t, `{"cmd":"compile","action":{}}`); !resp.OK {
		t.Errorf("a well-formed command over the socket: %+v; want ok:true", resp)
	}
}

// journalFiles returns the Journal and every file beside it that belongs to it (-wal, -shm, .lock).
func journalFiles(t *testing.T, k *kernel) []string {
	t.Helper()
	names, err := filepath.Glob(k.journal + "*")
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Contains(names, k.journal) {
		t.Fatalf("no Journal at %s; files %q", k.journal, names)
	}
	return names
}

func assertKernelOnly(t *testing.T, when string, names []string) {
	t.Helper()
	for _, n := range names {
		fi, err := os.Lstat(n)
		if err != nil {
			t.Errorf("%s: %v", when, err)
			continue
		}
		if !fi.Mode().IsRegular() {
			t.Errorf("%s: %s is %v; want a regular file", when, filepath.Base(n), fi.Mode())
		}
		perm := fi.Mode() & (fs.ModePerm | fs.ModeSetuid | fs.ModeSetgid | fs.ModeSticky)
		if perm != 0o600 {
			t.Errorf("%s: %s mode %#o; want exactly 0600", when, filepath.Base(n), perm)
		}
		if uid := int(fi.Sys().(*syscall.Stat_t).Uid); uid != os.Geteuid() {
			t.Errorf("%s: %s owner uid %d; want the Kernel's, %d", when, filepath.Base(n), uid, os.Geteuid())
		}
	}
}

// TestB103JournalIsKernelOnly0600: Userland's direct append must fail at the OS. The Journal and
// its -wal/-shm/.lock files are owned by the Kernel's uid at exactly 0600 (09a §4.1), while the
// Kernel runs, after it stops, and when the file already existed with a wider mode. Kills: a
// Journal left at 0644 or 0660 (the umask is 0 here, so a Kernel that sets no mode leaves 0644 for
// the database and lets the WAL follow it).
//
// GAP, stated rather than hidden: the clause "fails at the OS" is exercised directly only when the
// test runs as root, where a child with another uid and Userland's gid must be refused opening the
// Journal for write. As an ordinary user no second uid exists, so the test asserts mode and owner
// only and logs that it did.
func TestB103JournalIsKernelOnly0600(t *testing.T) {
	t.Run("fresh", func(t *testing.T) {
		k := start(t)
		// One accepted append, so the WAL holds a frame and every sidecar exists.
		if resp := dial(t, k).send(t, `{"cmd":"propose_event","stream":"s","expect_seq":0,"type":"t","label":`+
			`{"schema":"label/1","origin":"internal","dclass":"D0","boundary":"open","venture":"v_keel",`+
			`"retention":{"class":"operational","hold":"none"},"permission":"none","exportable":false,`+
			`"taint":"clean","provenance":[],"revocation_epoch":0},"data":1}`); !resp.OK {
			t.Fatalf("propose_event: %+v; want ok:true", resp)
		}
		running := journalFiles(t, k)
		assertKernelOnly(t, "running", running)
		crossUID(t, k)
		k.close(t)
		assertKernelOnly(t, "stopped", journalFiles(t, k))
	})
	t.Run("pre-existing-0644", func(t *testing.T) {
		dir, err := os.MkdirTemp("", "avk-b103-")
		if err != nil {
			t.Fatal(err)
		}
		t.Cleanup(func() { os.RemoveAll(dir) })
		jp := filepath.Join(dir, "journal.db")
		if err := os.WriteFile(jp, nil, 0o644); err != nil {
			t.Fatal(err)
		}
		if err := os.Chmod(jp, 0o644); err != nil {
			t.Fatal(err)
		}
		k := &kernel{dir: dir, sock: filepath.Join(dir, "avk.sock"), journal: jp, backend: &fakeBackend{}}
		k.gid = userlandGID(t, dir)
		srv, err := socket.Serve(context.Background(), socket.Config{
			SocketPath: k.sock, JournalPath: jp, UserlandGID: k.gid, Backend: k.backend,
		})
		if errors.Is(err, socket.ErrNotImplemented) {
			t.Fatalf("Serve: %v", err)
		}
		if err != nil {
			t.Logf("Serve refused a Journal found at 0644: %v (allowed: refusing is a valid answer)", err)
			return
		}
		k.srv = srv
		defer k.close(t)
		assertKernelOnly(t, "pre-existing 0644, running", journalFiles(t, k))
	})
}

// crossUID runs, as root only, a child with another uid and Userland's gid that tries to open each
// Journal file for append; the OS must refuse it. A positive control in the same directory, which
// that child may write, must succeed, so a refusal is the file's mode and not the harness.
func crossUID(t *testing.T, k *kernel) {
	t.Helper()
	if os.Geteuid() != 0 {
		t.Logf("GAP: euid %d is not root, so no second uid can be assumed; the OS refusal of a "+
			"direct append is asserted through mode 0600 and owner only", os.Geteuid())
		return
	}
	// The directory must not be what refuses the child, or the check proves nothing.
	if err := os.Chmod(k.dir, 0o711); err != nil {
		t.Fatal(err)
	}
	control := filepath.Join(k.dir, "control")
	if err := os.WriteFile(control, nil, 0o666); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(control, 0o666); err != nil {
		t.Fatal(err)
	}
	appendAs := func(name string) ([]byte, error) {
		cmd := exec.Command("/bin/sh", "-c", `: >> "$1"`, "sh", name)
		cmd.SysProcAttr = &syscall.SysProcAttr{Credential: &syscall.Credential{Uid: 65534, Gid: uint32(k.gid)}}
		return cmd.CombinedOutput()
	}
	if out, err := appendAs(control); err != nil {
		t.Fatalf("control: uid 65534 cannot append to a 0666 file: %v, %s; the cross-uid check cannot run", err, out)
	}
	for _, name := range journalFiles(t, k) {
		out, err := appendAs(name)
		if err == nil || !strings.Contains(strings.ToLower(string(out)), "permission denied") {
			t.Errorf("uid 65534 gid %d appending to %s: err %v, output %q; want the OS to refuse (permission denied)",
				k.gid, filepath.Base(name), err, out)
		}
	}
}
