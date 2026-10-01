//go:build donetest

// B1-03 done-tests, round 2 (re-frozen 2026-10-01 after an independent Opus review found seven wrong
// implementations that socket_donetest_test.go let pass). Registered in build/done-tests/B1-03.yml
// beside the round-1 file, whose helpers (start's umask discipline, userlandGID, fakeBackend,
// openJournal) this file reuses.
//
// Two kinds of test live here, and the register says which is which:
//   - CONTRACT tests hold the implementation to socket.go and 09a §2/§4.1 as written. Each names the
//     surviving mutant it kills.
//   - SAFE-BEHAVIOUR tests (names end in "Ratify") assert a property the contract is silent on, or
//     states only in part, written to the safe side: a bounded number of connections, a deadline on
//     a stalled connection, an oversized line journaled, a symlink never followed. They need the
//     founder's ratification before they bind, and each states the number it chose.
//
// Run: go -C kernel test -tags donetest -count=1 ./internal/socket/
package socket_test

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"net"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"sync/atomic"
	"syscall"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
	"github.com/Adam077K/agentvibe/kernel/internal/socket"
)

// labelJSON is a Label B1-02 accepts (the same one TestB103JournalIsKernelOnly0600 sends).
const labelJSON = `{"schema":"label/1","origin":"internal","dclass":"D0","boundary":"open","venture":"v_keel",` +
	`"retention":{"class":"operational","hold":"none"},"permission":"none","exportable":false,` +
	`"taint":"clean","provenance":[],"revocation_epoch":0}`

func proposeLine(stream string, expect uint64) string {
	return fmt.Sprintf(`{"cmd":"propose_event","stream":%q,"expect_seq":%d,"type":"note.recorded","label":%s,"data":{"n":%d}}`,
		stream, expect, labelJSON, expect)
}

// rig is a served Kernel with any Backend, under umask 0 as start() runs it.
type rig struct {
	dir, sock, journal string
	gid                int
	srv                socket.Server
	closed             bool
}

func serveWith(t *testing.T, b socket.Backend) *rig {
	t.Helper()
	dir, err := os.MkdirTemp("", "avk-b103-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(dir) })
	old := syscall.Umask(0)
	t.Cleanup(func() { syscall.Umask(old) })
	r := &rig{dir: dir, sock: filepath.Join(dir, "avk.sock"), journal: filepath.Join(dir, "journal.db")}
	r.gid = userlandGID(t, dir)
	srv, err := socket.Serve(context.Background(), socket.Config{
		SocketPath: r.sock, JournalPath: r.journal, UserlandGID: r.gid, Backend: b,
	})
	if err != nil {
		t.Fatalf("Serve: %v", err)
	}
	if srv == nil {
		t.Fatal("Serve returned a nil Server and no error")
	}
	r.srv = srv
	t.Cleanup(func() {
		if !r.closed {
			r.closed = true
			r.srv.Close()
		}
	})
	return r
}

// stop closes the server and opens its Journal, which only one writer may hold.
func (r *rig) stop(t *testing.T) journal.Journal {
	t.Helper()
	if !r.closed {
		r.closed = true
		if err := r.srv.Close(); err != nil {
			t.Fatalf("Close: %v", err)
		}
	}
	j, err := journal.Open(r.journal)
	if err != nil {
		t.Fatalf("journal.Open after Close: %v", err)
	}
	t.Cleanup(func() { j.Close() })
	return j
}

// client is a connection whose failures are returned, not fatal, so goroutines can use it.
type client struct {
	c net.Conn
	r *bufio.Reader
}

func connect(t *testing.T, sock string) *client {
	t.Helper()
	c, err := net.DialTimeout("unix", sock, 5*time.Second)
	if err != nil {
		t.Fatalf("dial %s: %v", sock, err)
	}
	t.Cleanup(func() { c.Close() })
	return &client{c: c, r: bufio.NewReader(c)}
}

// do writes line plus '\n' and reads exactly one Response, within d.
func (c *client) do(line string, d time.Duration) (socket.Response, error) {
	c.c.SetDeadline(time.Now().Add(d))
	if _, err := c.c.Write([]byte(line + "\n")); err != nil {
		return socket.Response{}, fmt.Errorf("write: %w", err)
	}
	reply, err := c.r.ReadBytes('\n')
	if err != nil {
		return socket.Response{}, fmt.Errorf("no response line: %w (got %q)", err, reply)
	}
	var resp socket.Response
	dec := json.NewDecoder(bytes.NewReader(reply))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&resp); err != nil {
		return socket.Response{}, fmt.Errorf("response %q is not a socket.Response: %w", reply, err)
	}
	return resp, nil
}

func (c *client) mustDo(t *testing.T, line string) socket.Response {
	t.Helper()
	resp, err := c.do(line, 10*time.Second)
	if err != nil {
		t.Fatalf("%.120s: %v", line, err)
	}
	return resp
}

// closedUnanswered reports whether the server closed the connection without writing a byte,
// within d. A timeout is the server still holding the connection open.
func (c *client) closedUnanswered(d time.Duration) (bool, string) {
	c.c.SetReadDeadline(time.Now().Add(d))
	b, err := io.ReadAll(c.r)
	switch {
	case len(b) > 0:
		return false, fmt.Sprintf("the server answered %q", b)
	case err == nil, errors.Is(err, syscall.ECONNRESET):
		return true, ""
	case errors.Is(err, os.ErrDeadlineExceeded):
		return false, fmt.Sprintf("the connection was still open after %v", d)
	}
	return false, fmt.Sprintf("read: %v", err)
}

// refusals returns the refusal stream's events decoded strictly, failing on any that is not a
// RefusalType event carrying RefusalData.
func refusals(t *testing.T, j journal.Journal) []socket.RefusalData {
	t.Helper()
	evs, err := j.Read(context.Background(), socket.RefusalStream, 1)
	if err != nil {
		t.Fatalf("Read %s: %v", socket.RefusalStream, err)
	}
	out := make([]socket.RefusalData, 0, len(evs))
	for i, ev := range evs {
		if ev.Type != socket.RefusalType {
			t.Errorf("%s event %d: type %q data %s; want %q only (Userland may not write here)",
				socket.RefusalStream, i+1, ev.Type, ev.Data, socket.RefusalType)
			continue
		}
		var d socket.RefusalData
		dec := json.NewDecoder(bytes.NewReader(ev.Data))
		dec.DisallowUnknownFields()
		if err := dec.Decode(&d); err != nil {
			t.Errorf("%s event %d: data %q is not RefusalData: %v", socket.RefusalStream, i+1, ev.Data, err)
			continue
		}
		out = append(out, d)
	}
	return out
}

func refusalHead(t *testing.T, j journal.Journal) uint64 {
	t.Helper()
	seq, _, err := j.Head(context.Background(), socket.RefusalStream)
	if err != nil {
		t.Fatalf("Head %s: %v", socket.RefusalStream, err)
	}
	return seq
}

// ---------------------------------------------------------------------------------------------
// CONTRACT tests
// ---------------------------------------------------------------------------------------------

// TestB103SocketNeverVisibleWiderThanFinal: Serve "creates the socket with its final owner, group
// and mode" (socket.go), so at no instant does the public path name a socket that grants more than
// 0660 to Kernel-uid:UserlandGID. Pollers Lstat the public path continuously while Serve runs
// repeatedly under umask 0. A socket observed with any "other" bit, any bit outside 0660, an owner
// that is not the Kernel, or group bits while still in a group that is not UserlandGID is a client
// who could have connected before the Kernel narrowed it.
//
// Kills (surviving mutant 1): bind at the public path, then chown and chmod. Under umask 0 that
// socket appears 0777 in the directory's group for the span of two syscalls. Binding privately
// and renaming, or binding under a umask that leaves no group or other bits, both pass.
//
// The check is a race the test must win, so it is repeated: it cannot pass a correct
// implementation falsely (the public name never shows a wider socket), only miss a wrong one. A
// positive control fails the test if the pollers never observed the socket at all.
func TestB103SocketNeverVisibleWiderThanFinal(t *testing.T) {
	dir, err := os.MkdirTemp("", "avk-b103-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(dir) })
	old := syscall.Umask(0)
	t.Cleanup(func() { syscall.Umask(old) })
	gid := userlandGID(t, dir)
	sock, jp := filepath.Join(dir, "avk.sock"), filepath.Join(dir, "journal.db")
	euid := os.Geteuid()

	var stop atomic.Bool
	var observed, wider atomic.Int64
	var mu sync.Mutex
	var examples []string
	pollers := min(max(runtime.NumCPU()-1, 2), 6)
	var wg sync.WaitGroup
	for range pollers {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for !stop.Load() {
				fi, err := os.Lstat(sock)
				if err != nil {
					continue
				}
				observed.Add(1)
				perm := fi.Mode() & (fs.ModePerm | fs.ModeSetuid | fs.ModeSetgid | fs.ModeSticky)
				st := fi.Sys().(*syscall.Stat_t)
				bad := fi.Mode().Type() != fs.ModeSocket || perm&^0o660 != 0 || int(st.Uid) != euid ||
					(perm&0o060 != 0 && int(st.Gid) != gid)
				if bad {
					wider.Add(1)
					mu.Lock()
					if len(examples) < 5 {
						examples = append(examples, fmt.Sprintf("%v uid %d gid %d", fi.Mode(), st.Uid, st.Gid))
					}
					mu.Unlock()
				}
			}
		}()
	}
	const rounds = 300
	for i := range rounds {
		srv, err := socket.Serve(context.Background(), socket.Config{
			SocketPath: sock, JournalPath: jp, UserlandGID: gid, Backend: &fakeBackend{},
		})
		if err != nil {
			stop.Store(true)
			wg.Wait()
			t.Fatalf("Serve, round %d: %v", i+1, err)
		}
		if err := srv.Close(); err != nil {
			stop.Store(true)
			wg.Wait()
			t.Fatalf("Close, round %d: %v", i+1, err)
		}
	}
	stop.Store(true)
	wg.Wait()
	if observed.Load() == 0 {
		t.Fatalf("the pollers never saw the socket in %d rounds; the check proved nothing", rounds)
	}
	if n := wider.Load(); n > 0 {
		t.Errorf("%d of %d observations of %s were wider than Kernel-uid:gid %d mode 0660, e.g. %q: "+
			"the socket was public before its owner and mode were set", n, observed.Load(), sock, gid, examples)
	}
	t.Logf("%d rounds, %d observations by %d pollers, %d wider", rounds, observed.Load(), pollers, wider.Load())
}

// TestB103ExpectSeqIsTheCommands: propose_event appends "with ExpectSeq expect_seq" (socket.go),
// the optimistic-concurrency check 09a §4.1's gapless per-stream seq rests on. A stale or future
// expect_seq is a well-formed command that cannot be carried out: {"ok":false,"reason":
// "seq_conflict"}, nothing appended, and no refusal journaled. A current one appends at head+1.
//
// Kills (surviving mutant 2): ExpectSeq taken from the stream's head instead of the command, which
// accepts every expect_seq, so two writers that read the same head both "win".
func TestB103ExpectSeqIsTheCommands(t *testing.T) {
	r := serveWith(t, &fakeBackend{})
	c := connect(t, r.sock)
	const stream = "venture:v_keel"
	steps := []struct {
		expect uint64
		ok     bool
		seq    uint64
	}{
		{0, true, 1},
		{0, false, 0}, // stale: the head is 1
		{5, false, 0}, // future
		{1, true, 2},
		{1, false, 0}, // stale again
	}
	head := uint64(0)
	for i, s := range steps {
		resp := c.mustDo(t, proposeLine(stream, s.expect))
		if !s.ok {
			if resp.OK || resp.Reason != socket.ReasonSeqConflict || len(resp.Result) != 0 {
				t.Errorf("step %d, expect_seq %d against head %d: %+v; want ok:false reason %q",
					i+1, s.expect, head, resp, socket.ReasonSeqConflict)
			}
			continue
		}
		head = s.seq
		var res struct {
			Stream string `json:"stream"`
			Seq    uint64 `json:"seq"`
			Hash   string `json:"hash"`
		}
		if !resp.OK || json.Unmarshal(resp.Result, &res) != nil || res.Stream != stream || res.Seq != s.seq || res.Hash == "" {
			t.Errorf("step %d, expect_seq %d: %+v; want ok:true result {stream %q, seq %d, hash}", i+1, s.expect, resp, stream, s.seq)
		}
	}
	j := r.stop(t)
	evs, err := j.Read(context.Background(), stream, 1)
	if err != nil {
		t.Fatalf("Read %s: %v", stream, err)
	}
	if len(evs) != 2 {
		t.Errorf("%d events on %s; want 2: a conflicting expect_seq appends nothing", len(evs), stream)
	}
	if n := refusalHead(t, j); n != 0 {
		t.Errorf("%d refusals journaled; want 0: a seq conflict is a failure, not a refusal", n)
	}
	if err := j.Verify(context.Background()); err != nil {
		t.Errorf("Verify: %v", err)
	}
}

// failingBackend fails every verb in one of the three ways socket.go names as failure: an error, a
// panic, or a result that is not JSON.
type failingBackend struct {
	mu    sync.Mutex
	calls int
}

func (f *failingBackend) fail(verb string) (json.RawMessage, error) {
	f.mu.Lock()
	f.calls++
	f.mu.Unlock()
	switch verb {
	case "request_leases", "compile", "renew":
		return nil, errors.New("backend: " + verb + " failed")
	case "propose_effect", "release":
		panic("backend: " + verb + " panicked")
	}
	return json.RawMessage(`{not json`), nil // admit_job
}

func (f *failingBackend) RequestLeases(context.Context, socket.RequestLeases) (json.RawMessage, error) {
	return f.fail("request_leases")
}
func (f *failingBackend) ProposeEffect(context.Context, socket.ProposeEffect) (json.RawMessage, error) {
	return f.fail("propose_effect")
}
func (f *failingBackend) AdmitJob(context.Context, socket.AdmitJob) (json.RawMessage, error) {
	return f.fail("admit_job")
}
func (f *failingBackend) Compile(context.Context, socket.Compile) (json.RawMessage, error) {
	return f.fail("compile")
}
func (f *failingBackend) Renew(context.Context, socket.LeaseCommand) (json.RawMessage, error) {
	return f.fail("renew")
}
func (f *failingBackend) Release(context.Context, socket.LeaseCommand) (json.RawMessage, error) {
	return f.fail("release")
}

// TestB103BackendFailureIsNotRefusal: "FAILURE IS NOT REFUSAL" (socket.go). A well-formed command
// the Backend fails (error, panic, or a non-JSON result) is answered {"ok":false,"reason":"failed"},
// journals no refusal and appends nothing anywhere, and the connection goes on serving.
//
// Kills (surviving mutant 7): Backend errors journaled as refusals. socket:refusals records only
// malformed input; a Kernel that journals its own Backend's failures there makes every outage look
// like an attack.
func TestB103BackendFailureIsNotRefusal(t *testing.T) {
	f := load(t)
	b := &failingBackend{}
	r := serveWith(t, b)
	c := connect(t, r.sock) // one connection: a failure must not end it
	sent := 0
	for _, v := range f.Valid {
		cmd := cmdOf(t, v.Command)
		if cmd == "propose_event" {
			continue // the Kernel's own verb; its failure, seq_conflict, is TestB103ExpectSeqIsTheCommands
		}
		resp := c.mustDo(t, string(compact(t, v.Command)))
		sent++
		if resp.OK || resp.Reason != socket.ReasonFailed || len(resp.Result) != 0 {
			t.Errorf("%s against a failing Backend: %+v; want ok:false reason %q", cmd, resp, socket.ReasonFailed)
		}
	}
	if sent != 6 {
		t.Fatalf("fixture: %d Backend verbs; want 6", sent)
	}
	b.mu.Lock()
	calls := b.calls
	b.mu.Unlock()
	if calls != sent {
		t.Errorf("Backend called %d times for %d commands; want once each", calls, sent)
	}
	j := r.stop(t)
	if n := refusalHead(t, j); n != 0 {
		t.Errorf("%d refusals journaled for %d Backend failures; want 0: failure is not refusal", n, sent)
	}
	if streams, err := j.Streams(context.Background()); err != nil || len(streams) != 0 {
		t.Errorf("Journal streams %q (err %v); want none: a failed command appends nothing", streams, err)
	}
}

// TestB103ConcurrentRefusalsAllJournaled: every refused line on every connection is answered and
// journaled exactly once, however many arrive at once ("exactly one event of type RefusalType is
// appended to RefusalStream", socket.go). The refusal stream's head read and its append are one
// step; two refusals that read the same head must not race to the same seq.
//
// Kills (surviving mutant 4): refuseMu removed. Concurrent refusals then conflict on the refusal
// stream's seq; the loser cannot be journaled, so its connection is closed unanswered.
func TestB103ConcurrentRefusalsAllJournaled(t *testing.T) {
	r := serveWith(t, &fakeBackend{})
	const conns, lines = 24, 25
	var wg sync.WaitGroup
	errs := make(chan error, conns)
	start := make(chan struct{})
	for i := range conns {
		c := connect(t, r.sock)
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			for n := range lines {
				line := fmt.Sprintf(`not json %d/%d`, i, n)
				resp, err := c.do(line, 20*time.Second)
				if err != nil {
					errs <- fmt.Errorf("connection %d, line %d: %w", i, n+1, err)
					return
				}
				if resp.OK || resp.Reason != socket.ReasonBadJSON {
					errs <- fmt.Errorf("connection %d, line %d: %+v; want ok:false reason %q", i, n+1, resp, socket.ReasonBadJSON)
					return
				}
			}
		}()
	}
	close(start)
	wg.Wait()
	close(errs)
	for err := range errs {
		t.Error(err)
	}
	j := r.stop(t)
	got := refusals(t, j)
	if len(got) != conns*lines {
		t.Errorf("%d refusals journaled for %d refused lines; want one each", len(got), conns*lines)
	}
	seen := map[string]bool{}
	for _, d := range got {
		if seen[d.SHA256] {
			t.Errorf("refusal %s journaled twice", d.SHA256)
		}
		seen[d.SHA256] = true
	}
	if err := j.Verify(context.Background()); err != nil {
		t.Errorf("Verify: %v", err)
	}
}

// TestB103RefusalStreamIsKernelOnly: `stream` "may not be RefusalStream, which only the Kernel
// appends to" (socket.go), refused invalid_field. Sent with expect_seq 0 and with expect_seq equal
// to the refusal stream's real head, so a Kernel that let it through would append. Afterwards the
// refusal stream holds only RefusalData events: the record of what was refused cannot be forged.
//
// Kills (surviving mutant 5): Userland allowed to write to RefusalStream.
func TestB103RefusalStreamIsKernelOnly(t *testing.T) {
	r := serveWith(t, &fakeBackend{})
	c := connect(t, r.sock)
	if resp := c.mustDo(t, `garbage`); resp.OK || resp.Reason != socket.ReasonBadJSON {
		t.Fatalf("a garbage line: %+v; want ok:false reason %q", resp, socket.ReasonBadJSON)
	}
	forged := []string{proposeLine(socket.RefusalStream, 1), proposeLine(socket.RefusalStream, 0)}
	for _, line := range forged {
		if resp := c.mustDo(t, line); resp.OK || resp.Reason != socket.ReasonInvalidField || len(resp.Result) != 0 {
			t.Errorf("propose_event to %s: %+v; want ok:false reason %q", socket.RefusalStream, resp, socket.ReasonInvalidField)
		}
	}
	j := r.stop(t)
	got := refusals(t, j)
	if len(got) != 1+len(forged) {
		t.Fatalf("%d events on %s; want %d, one refusal per refused line and nothing else", len(got), socket.RefusalStream, 1+len(forged))
	}
	for i, d := range got[1:] {
		if d.Reason != socket.ReasonInvalidField || d.Cmd != "propose_event" || d.Bytes != len(forged[i]) {
			t.Errorf("refusal of forged line %d: %+v; want reason %q cmd propose_event bytes %d", i+1, d, socket.ReasonInvalidField, len(forged[i]))
		}
	}
	if streams, err := j.Streams(context.Background()); err != nil || len(streams) != 1 || streams[0] != socket.RefusalStream {
		t.Errorf("Journal streams %q (err %v); want only %q", streams, err, socket.RefusalStream)
	}
}

// TestB103DuplicateKeyRefused: "A key that appears twice in the line is refused (bad_json): which
// copy wins would be the parser's choice, not the bytes'" (socket.go). Each line below is a valid
// command whichever copy wins, so only the duplicate can refuse it: answered bad_json, journaled,
// nothing reaching the Backend.
//
// Kills (surviving mutant 6): the duplicate-key check removed (last copy wins, silently).
func TestB103DuplicateKeyRefused(t *testing.T) {
	b := &fakeBackend{}
	r := serveWith(t, b)
	c := connect(t, r.sock)
	lines := []string{
		`{"cmd":"compile","action":{"a":1},"action":{"a":2}}`,
		`{"cmd":"admit_job","cmd":"compile","action":{},"spec":{}}`,
		`{"cmd":"renew","lease_id":"lease_5","token":"7","token":"8"}`,
		`{"cmd":"release","lease_id":"lease_6","lease_id":"lease_6","token":"7"}`,
	}
	for _, line := range lines {
		if resp := c.mustDo(t, line); resp.OK || resp.Reason != socket.ReasonBadJSON {
			t.Errorf("%s: %+v; want ok:false reason %q", line, resp, socket.ReasonBadJSON)
		}
	}
	if calls := b.snapshot(); len(calls) != 0 {
		t.Errorf("a line with a duplicate key reached the Backend: %+v", calls)
	}
	j := r.stop(t)
	got := refusals(t, j)
	if len(got) != len(lines) {
		t.Fatalf("%d refusals journaled for %d duplicate-key lines; want one each", len(got), len(lines))
	}
	for i, d := range got {
		if d.Reason != socket.ReasonBadJSON || d.Bytes != len(lines[i]) {
			t.Errorf("refusal %d: %+v; want reason %q bytes %d", i+1, d, socket.ReasonBadJSON, len(lines[i]))
		}
	}
}

// compileLine is a well-formed compile command exactly n bytes long, without its '\n'.
func compileLine(t *testing.T, n int) string {
	t.Helper()
	const head, tail = `{"cmd":"compile","action":"`, `"}`
	pad := n - len(head) - len(tail)
	if pad < 0 {
		t.Fatalf("compileLine(%d): too short", n)
	}
	return head + strings.Repeat("x", pad) + tail
}

// TestB103OversizedLineClosedUnanswered: "A line longer than MaxLine is not judged: the connection
// is closed without an answer" (socket.go). A well-formed command of exactly MaxLine bytes is
// answered; the same command one byte longer is not, never reaches the Backend, and its connection
// is closed; and a line that never ends is cut off rather than buffered without bound.
//
// Kills (surviving mutant 3): readLine replaced with bufio.Reader.ReadBytes, which has no limit. It
// answers the oversized command ok:true and buffers the endless line until memory runs out.
func TestB103OversizedLineClosedUnanswered(t *testing.T) {
	b := &fakeBackend{}
	r := serveWith(t, b)

	if resp := connect(t, r.sock).mustDo(t, compileLine(t, socket.MaxLine)); !resp.OK {
		t.Fatalf("a well-formed compile of exactly MaxLine (%d) bytes: %+v; want ok:true", socket.MaxLine, resp)
	}

	over := connect(t, r.sock)
	over.c.SetWriteDeadline(time.Now().Add(10 * time.Second))
	over.c.Write([]byte(compileLine(t, socket.MaxLine+1) + "\n")) // the server may close mid-write
	if ok, why := over.closedUnanswered(10 * time.Second); !ok {
		t.Errorf("a well-formed compile of MaxLine+1 bytes: %s; want the connection closed without an answer", why)
	}

	endless := connect(t, r.sock)
	go func() {
		endless.c.SetWriteDeadline(time.Now().Add(10 * time.Second))
		chunk := bytes.Repeat([]byte("y"), 64<<10)
		for range 2 * socket.MaxLine / len(chunk) {
			if _, err := endless.c.Write(chunk); err != nil {
				return
			}
		}
	}()
	if ok, why := endless.closedUnanswered(10 * time.Second); !ok {
		t.Errorf("2×MaxLine bytes with no newline: %s; want the connection closed once MaxLine is passed", why)
	}

	if calls := b.snapshot(); len(calls) != 1 {
		t.Errorf("%d Backend calls; want 1 (the MaxLine command only): an oversized line is not judged", len(calls))
	}
}

// ---------------------------------------------------------------------------------------------
// SAFE-BEHAVIOUR tests: need ratification (see build/done-tests/B1-03.yml)
// ---------------------------------------------------------------------------------------------

// TestB103OversizedLineJournaledRatify: an oversized line is input the Kernel refused to judge, and
// 14-BUILD-PLAN B1-03's done-test is "a malformed command is refused and journaled". So each
// oversized line leaves exactly one RefusalType event whose Bytes exceeds MaxLine; its reason and
// digest are left to the implementation (the line need not be buffered whole to be accounted for).
//
// RATIFY: socket.go says the connection "is closed without an answer" and is silent on the
// Journal; server.go's MaxLine comment says "nothing is journaled for it". The safe side is to
// account for it, so a client probing the limit leaves a trace. A Kernel that journals nothing for
// an oversized line fails this test.
func TestB103OversizedLineJournaledRatify(t *testing.T) {
	r := serveWith(t, &fakeBackend{})
	over := connect(t, r.sock)
	over.c.SetWriteDeadline(time.Now().Add(10 * time.Second))
	over.c.Write([]byte(compileLine(t, socket.MaxLine+1) + "\n"))
	over.closedUnanswered(10 * time.Second)

	endless := connect(t, r.sock)
	endless.c.SetWriteDeadline(time.Now().Add(10 * time.Second))
	chunk := bytes.Repeat([]byte("y"), 64<<10)
	for range 2 * socket.MaxLine / len(chunk) {
		if _, err := endless.c.Write(chunk); err != nil {
			break
		}
	}
	endless.closedUnanswered(10 * time.Second)

	j := r.stop(t)
	got := refusals(t, j)
	if len(got) != 2 {
		t.Fatalf("%d refusals journaled for 2 oversized lines; want one each", len(got))
	}
	for i, d := range got {
		if d.Reason == "" || d.Bytes <= socket.MaxLine {
			t.Errorf("refusal %d: %+v; want a reason and bytes > MaxLine (%d)", i+1, d, socket.MaxLine)
		}
	}
}

// maxConnsBound is the most concurrent connections the Kernel may serve. RATIFY: the number is
// this test's choice; any cap at or below it passes.
const maxConnsBound = 1024

// TestB103ConnectionsAreBoundedRatify: with maxConnsBound+64 clients connected and each sending one
// well-formed command while every connection stays open, at most maxConnsBound are answered. Excess
// clients may be refused at connect, closed, or left waiting; they may not all be served, because
// each served connection holds a descriptor and a goroutine in the process that holds the Journal.
// Once they go away, a new client is served again.
//
// RATIFY: socket.go and 09a §2 are silent on a connection limit. A Kernel with no limit fails.
func TestB103ConnectionsAreBoundedRatify(t *testing.T) {
	const clients = maxConnsBound + 64
	need := uint64(4*clients + 512) // a client and a server descriptor each, with room
	var lim syscall.Rlimit
	if err := syscall.Getrlimit(syscall.RLIMIT_NOFILE, &lim); err != nil {
		t.Fatal(err)
	}
	if lim.Cur < need && lim.Max >= need {
		lim.Cur = need
		syscall.Setrlimit(syscall.RLIMIT_NOFILE, &lim)
		syscall.Getrlimit(syscall.RLIMIT_NOFILE, &lim)
	}
	if lim.Cur < need {
		// Not a skip: a test that cannot hold its clients open would pass an uncapped Kernel.
		t.Fatalf("RLIMIT_NOFILE %d < %d: the test cannot open its clients, so it cannot judge the cap", lim.Cur, need)
	}

	r := serveWith(t, &fakeBackend{})
	var held []net.Conn
	t.Cleanup(func() {
		for _, c := range held {
			c.Close()
		}
	})
	for range clients {
		var c net.Conn
		var err error
		for try := 0; try < 5; try++ { // a full backlog refuses; give the accept loop a moment
			if c, err = net.DialTimeout("unix", r.sock, 200*time.Millisecond); err == nil {
				break
			}
			if errors.Is(err, syscall.EMFILE) || errors.Is(err, syscall.ENFILE) {
				t.Fatalf("dial: %v: the test ran out of descriptors, so it cannot judge the cap", err)
			}
			time.Sleep(10 * time.Millisecond)
		}
		if err == nil {
			held = append(held, c)
		}
	}
	var answered atomic.Int64
	var wg sync.WaitGroup
	line := []byte(`{"cmd":"compile","action":{}}` + "\n")
	for _, c := range held {
		wg.Add(1)
		go func() {
			defer wg.Done()
			c.SetDeadline(time.Now().Add(5 * time.Second))
			if _, err := c.Write(line); err != nil {
				return
			}
			reply, err := bufio.NewReader(c).ReadBytes('\n')
			var resp socket.Response
			if err == nil && json.Unmarshal(reply, &resp) == nil && resp.OK {
				answered.Add(1)
			}
		}()
	}
	wg.Wait()
	if answered.Load() == 0 {
		t.Fatalf("no client of %d was answered; the Kernel is not serving, so the cap is not judged", len(held))
	}
	if n := answered.Load(); n > maxConnsBound {
		t.Errorf("%d of %d concurrently open clients were served; want at most %d", n, len(held), maxConnsBound)
	}
	for _, c := range held {
		c.Close()
	}
	held = nil
	deadline := time.Now().Add(10 * time.Second)
	for {
		c, err := net.DialTimeout("unix", r.sock, time.Second)
		if err == nil {
			cl := &client{c: c, r: bufio.NewReader(c)}
			resp, err := cl.do(`{"cmd":"compile","action":{}}`, 2*time.Second)
			c.Close()
			if err == nil && resp.OK {
				break
			}
		}
		if time.Now().After(deadline) {
			t.Fatal("after every client left, a new client was not served within 10s: the cap does not release")
		}
		time.Sleep(100 * time.Millisecond)
	}
}

// stallBound is how long a stalled connection may hold its descriptor. RATIFY: the number is this
// test's choice; any deadline at or below it passes, and a deadline under one second fails the
// keep-alive check below.
const stallBound = 30 * time.Second

// TestB103StalledConnectionsAreClosedRatify: a connection that sends nothing, one that stops
// mid-line, and one that keeps sending but never reads its answers are each closed by the Kernel
// within stallBound. A connection that pauses one second between requests is still served.
//
// RATIFY: socket.go and 09a §2 are silent on deadlines. Without them, idle clients hold
// descriptors and goroutines for ever. A Kernel with no read deadline fails the first two cases; one
// with no write deadline fails the third.
func TestB103StalledConnectionsAreClosedRatify(t *testing.T) {
	r := serveWith(t, &fakeBackend{})

	keep := connect(t, r.sock)
	if resp := keep.mustDo(t, `{"cmd":"compile","action":{}}`); !resp.OK {
		t.Fatalf("first request: %+v", resp)
	}
	time.Sleep(time.Second)
	if resp, err := keep.do(`{"cmd":"compile","action":{}}`, 5*time.Second); err != nil || !resp.OK {
		t.Fatalf("a request after a one-second pause: %+v, %v; want it served", resp, err)
	}

	silent := connect(t, r.sock)
	partial := connect(t, r.sock)
	if _, err := partial.c.Write([]byte(`{"cmd":"compile","act`)); err != nil {
		t.Fatal(err)
	}
	reader := connect(t, r.sock) // never reads

	var wg sync.WaitGroup
	results := make([]string, 3)
	wg.Add(3)
	go func() {
		defer wg.Done()
		if ok, why := silent.closedUnanswered(stallBound + 5*time.Second); !ok {
			results[0] = "a connection that sent nothing: " + why
		}
	}()
	go func() {
		defer wg.Done()
		if ok, why := partial.closedUnanswered(stallBound + 5*time.Second); !ok {
			results[1] = "a connection stopped mid-line: " + why
		}
	}()
	go func() {
		defer wg.Done()
		// Requests are written until the Kernel stops reading them (it is blocked writing answers
		// nobody reads) and then until it closes the connection, which fails the write. A write
		// still blocked at the deadline is a Kernel holding the connection for ever.
		reader.c.SetWriteDeadline(time.Now().Add(stallBound + 5*time.Second))
		line := []byte(`{"cmd":"compile","action":{}}` + "\n")
		for {
			if _, err := reader.c.Write(line); err != nil {
				if errors.Is(err, os.ErrDeadlineExceeded) {
					results[2] = fmt.Sprintf("a connection that never reads its answers: still open after %v", stallBound+5*time.Second)
				}
				return
			}
		}
	}()
	wg.Wait()
	for _, s := range results {
		if s != "" {
			t.Errorf("%s; want it closed within %v", s, stallBound)
		}
	}
}

// TestB103JournalSidecarSymlinkNotFollowedRatify: Serve narrows every file beside the Journal whose
// name begins with the Journal's (socket.go). Narrowing must act on that file, never on what a
// symlink names: a symlink there is refused or ignored, and the file it points at keeps its mode.
//
//   - static: journal.db.decoy is a symlink to a victim file the Kernel's uid owns at 0644.
//   - race: journal.db.decoy flips between a regular 0644 file and that symlink while Serve runs
//     repeatedly; a Kernel that Lstats the name and then chmods it by name (which follows a
//     symlink) narrows the victim when the flip lands between the two calls.
//
// RATIFY: the contract does not mention symlinks. The safe behaviour is to change a mode only
// through a descriptor opened with O_NOFOLLOW (or fchmodat AT_SYMLINK_NOFOLLOW). The race half can
// only miss a wrong Kernel, never fail a correct one: a Kernel that never follows can never narrow
// the victim.
func TestB103JournalSidecarSymlinkNotFollowedRatify(t *testing.T) {
	victimDir, err := os.MkdirTemp("", "avk-b103-victim-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(victimDir) })
	victim := filepath.Join(victimDir, "victim")
	if err := os.WriteFile(victim, []byte("not the Kernel's"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(victim, 0o644); err != nil {
		t.Fatal(err)
	}
	victimMode := func() fs.FileMode {
		fi, err := os.Stat(victim)
		if err != nil {
			t.Fatal(err)
		}
		return fi.Mode().Perm()
	}

	dir, err := os.MkdirTemp("", "avk-b103-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(dir) })
	old := syscall.Umask(0)
	t.Cleanup(func() { syscall.Umask(old) })
	gid := userlandGID(t, dir)
	jp, decoy := filepath.Join(dir, "journal.db"), filepath.Join(dir, "journal.db.decoy")
	cfg := socket.Config{SocketPath: filepath.Join(dir, "avk.sock"), JournalPath: jp, UserlandGID: gid, Backend: &fakeBackend{}}
	serveOnce := func(t *testing.T) {
		t.Helper()
		if srv, err := socket.Serve(context.Background(), cfg); err == nil {
			if err := srv.Close(); err != nil {
				t.Fatalf("Close: %v", err)
			}
		}
	}

	t.Run("static", func(t *testing.T) {
		if err := os.Symlink(victim, decoy); err != nil {
			t.Fatal(err)
		}
		defer os.Remove(decoy)
		serveOnce(t)
		if m := victimMode(); m != 0o644 {
			t.Errorf("victim mode %#o after Serve; want 0644: Serve narrowed the target of %s", m, decoy)
		}
	})

	t.Run("race", func(t *testing.T) {
		reg, lnk := filepath.Join(dir, "reg.tmp"), filepath.Join(dir, "lnk.tmp")
		var stop atomic.Bool
		var flips atomic.Int64
		done := make(chan struct{})
		go func() {
			defer close(done)
			for !stop.Load() {
				os.Remove(reg)
				if f, err := os.OpenFile(reg, os.O_CREATE|os.O_WRONLY|os.O_EXCL, 0o644); err == nil {
					f.Close()
					os.Rename(reg, decoy)
				}
				os.Remove(lnk)
				if os.Symlink(victim, lnk) == nil {
					os.Rename(lnk, decoy)
				}
				flips.Add(1)
			}
		}()
		const rounds = 2000
		deadline := time.Now().Add(20 * time.Second)
		i := 0
		for ; i < rounds && time.Now().Before(deadline); i++ {
			serveOnce(t)
			if m := victimMode(); m != 0o644 {
				break
			}
		}
		stop.Store(true)
		<-done
		if flips.Load() == 0 {
			t.Fatal("the swapper never flipped the decoy; the race was not run")
		}
		if m := victimMode(); m != 0o644 {
			t.Errorf("victim mode %#o after %d Serve rounds; want 0644: Serve followed a symlink at %s it had Lstat'ed as a regular file",
				m, i+1, decoy)
		}
		t.Logf("%d Serve rounds, %d flips", i, flips.Load())
	})
}
