//go:build donetest

// B1-08h done-test F1, the socket half, frozen 2026-10-03 from the B1-08 r7 Opus review's follow-ups
// (HANDOFF-NEXT.md, "B1-08 follow-ups"). The launcher's journal stream is the Kernel's: a Userland
// propose_event to it moves the stream head between the launcher's read and its append, which today
// forces ErrState and burns a lease (command.go:176-189). Like RefusalStream it is refused
// invalid_field, whatever the event type or expect_seq. The launcher half is
// launcher_h_donetest_test.go. Reuses round 2's rig (serveWith, connect, proposeLine, refusals).
//
// Run (binds a unix socket, so outside the sandbox):
//
//	go -C kernel test -count=1 -tags donetest -run B108_H ./internal/socket/
package socket_test

import (
	"context"
	"slices"
	"strings"
	"testing"

	"github.com/Adam077K/agentvibe/kernel/internal/launcher"
	"github.com/Adam077K/agentvibe/kernel/internal/socket"
)

// TestB108_H_F1_LauncherStreamIsKernelOnly: propose_event to launcher.JournalStream is refused
// invalid_field and appends nothing there; the same line to another stream is accepted, so only the
// stream name refuses it.
func TestB108_H_F1_LauncherStreamIsKernelOnly(t *testing.T) {
	r := serveWith(t, &fakeBackend{})
	c := connect(t, r.sock)
	launchTyped := strings.Replace(proposeLine(launcher.JournalStream, 0), `"type":"note.recorded"`,
		`"type":"`+launcher.JournalLaunchType+`"`, 1)
	if launchTyped == proposeLine(launcher.JournalStream, 0) {
		t.Fatal("the launch-typed line was not built")
	}
	forged := []string{proposeLine(launcher.JournalStream, 0), proposeLine(launcher.JournalStream, 1), launchTyped}
	for _, line := range forged {
		if resp := c.mustDo(t, line); resp.OK || resp.Reason != socket.ReasonInvalidField || len(resp.Result) != 0 {
			t.Errorf("propose_event to %s: %+v; want ok:false reason %q", launcher.JournalStream, resp, socket.ReasonInvalidField)
		}
	}
	if resp := c.mustDo(t, proposeLine("notes", 0)); !resp.OK {
		t.Errorf("the same propose_event to another stream: %+v; want ok:true", resp)
	}
	j := r.stop(t)
	got := refusals(t, j)
	if len(got) != len(forged) {
		t.Fatalf("%d refusals; want %d, one per forged line", len(got), len(forged))
	}
	for i, d := range got {
		if d.Reason != socket.ReasonInvalidField || d.Cmd != "propose_event" || d.Bytes != len(forged[i]) {
			t.Errorf("refusal %d: %+v; want reason %q cmd propose_event bytes %d", i+1, d, socket.ReasonInvalidField, len(forged[i]))
		}
	}
	streams, err := j.Streams(context.Background())
	if err != nil || slices.Contains(streams, launcher.JournalStream) || !slices.Contains(streams, "notes") {
		t.Errorf("Journal streams %q (err %v); want %q absent and \"notes\" present", streams, err, launcher.JournalStream)
	}
}
