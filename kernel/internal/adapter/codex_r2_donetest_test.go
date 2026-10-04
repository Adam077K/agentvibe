//go:build donetest

// Round-2 done-tests for B1-07, after the Opus review FAILED the implementation at 2592de6 and the
// founder ruling of 2026-10-03 superseded ruling 4 (docs/vision-v3/_process/
// DR-B1-07-CODEX-RULINGS-2026-10-02.md, "Round 2"). Measured on codex-cli 0.154.0 with a throwaway
// CODEX_HOME and no credential, so no turn was served: with --ignore-user-config the banner
// reports the default model, not the profile's, so -p is not loaded; with --ignore-rules it
// reports the profile's.
//
//   - The argv never carries --ignore-user-config. It carries -p <profile> and --ignore-rules,
//     which stops user and project execpolicy .rules files (a project file sits in the
//     worktree the worker writes) from loosening what the pinned profile allows.
//   - The user's own config is honoured, so the pinned profile must set every safety-relevant
//     key itself: CodexProfileTOML is the profile's exact bytes, its sha256 must equal the pin
//     (init_expect), and a profile that omits any key of cxRequiredKeys is ErrSpec. Each key was
//     accepted by `codex exec --strict-config` 0.154.0 in a profile; a misspelt key is not.
//   - -C stays inside the job's Worktree; -o is outside it and is not, and has no ancestor that
//     is, a symlink; CODEX_HOME in Env is absent or exactly the pinned CodexHome.
//   - The review's surviving mutants: answer dupFree, abort on no pin, turn.failed order and
//     reason, item id required, Children exact.
//
// ROUND 4 (2026-10-03, DR-B1-07 "Round 4"): the profile is superseded, so its helpers and
// R2_ProfileLoadsAndRulesIgnored and R2_ProfileRequiredKeys are removed; the bullets above on the
// profile are history. The worktree, -o, CODEX_HOME and review-mutant tests stand.
//
// Hashed in build/done-tests/B1-07.yml. Run: go -C kernel test -count=1 -tags donetest -run B1_07 ./internal/adapter/
package adapter

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"os"
	"path/filepath"
	"reflect"
	"slices"
	"strings"
	"testing"
)

func cxSHA(s string) string {
	h := sha256.Sum256([]byte(s))
	return "sha256:" + hex.EncodeToString(h[:])
}

func TestB1_07_R2_WorktreeBounds(t *testing.T) {
	for name, c := range map[string][2]string{ // {worktree, cwd}
		"cwd /":               {"/w/job-1", "/"},
		"worktree and cwd /":  {"/", "/"},
		"cwd above":           {"/w/job-1", "/w"},
		"cwd sibling":         {"/w/job-1", "/w/job-2"},
		"cwd shares a prefix": {"/w/job-1", "/w/job-10"},
		"cwd .. out":          {"/w/job-1", "/w/job-1/../job-2"},
		"cwd .. at the end":   {"/w/job-1", "/w/job-1/.."},
		"cwd .. back in":      {"/w/job-1", "/w/job-1/a/../b"},
		"cwd . segment":       {"/w/job-1", "/w/job-1/./a"},
		"cwd double slash":    {"/w/job-1", "/w//job-1"},
		"cwd trailing slash":  {"/w/job-1", "/w/job-1/"},
		"worktree missing":    {"", "/w/job-1"},
		"worktree relative":   {"w/job-1", "w/job-1"},
		"worktree with ..":    {"/w/x/../job-1", "/w/x/../job-1"},
		"worktree non-ASCII":  {"/w/j\u00f6b", "/w/j\u00f6b"},
	} {
		s := cxSpec()
		s.Worktree, s.Cwd = c[0], c[1]
		cxRefused(t, name, s, ErrSpec)
	}
	for _, cwd := range []string{"/w/job-1", "/w/job-1/pkg", "/w/job-1/pkg/sub"} {
		s := cxSpec()
		s.Cwd = cwd
		if v := cxSlotAfter(t, cxArgv(t, s), "-C"); v != cwd {
			t.Errorf("-C = %q, want %q", v, cwd)
		}
	}
}

func TestB1_07_R2_ResultPathOutsideAndNoSymlink(t *testing.T) {
	for _, p := range []string{"/w/job-1", "/w/job-1/result.json", "/w/job-1/.codex/r.json",
		"/w/job-1/pkg/r.json", "/run/av/../../w/job-1/r.json", "/run/av/./r.json", "/run//av/r.json"} {
		s := cxSpec()
		s.ResultPath = p
		cxRefused(t, "-o "+p, s, ErrSpec)
	}
	s := cxSpec()
	s.Cwd = "/w/job-1/pkg"
	s.ResultPath = "/w/job-1/r.json" // outside the -C directory, still inside the worktree
	cxRefused(t, "-o in the worktree, beside -C", s, ErrSpec)

	dir, err := filepath.EvalSymlinks(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	real := filepath.Join(dir, "real")
	if err := os.Mkdir(real, 0o755); err != nil {
		t.Fatal(err)
	}
	target := filepath.Join(real, "target.json")
	if err := os.WriteFile(target, []byte("{}"), 0o644); err != nil {
		t.Fatal(err)
	}
	must := func(err error) {
		if err != nil {
			t.Fatal(err)
		}
	}
	must(os.Symlink(target, filepath.Join(dir, "link.json")))
	must(os.Symlink(filepath.Join(dir, "nowhere.json"), filepath.Join(dir, "dangling.json")))
	must(os.Symlink(real, filepath.Join(dir, "ldir")))
	must(os.Symlink("/w/job-1/forged.json", filepath.Join(dir, "into-worktree.json")))
	for _, p := range []string{"link.json", "dangling.json", "ldir/r.json", "ldir/target.json", "into-worktree.json"} {
		s := cxSpec()
		s.ResultPath = filepath.Join(dir, p)
		cxRefused(t, "-o through a symlink: "+p, s, ErrSpec)
	}
	for _, p := range []string{filepath.Join(dir, "r.json"), filepath.Join(real, "r.json"), target} {
		s := cxSpec()
		s.ResultPath = p
		if v := cxSlotAfter(t, cxArgv(t, s), "-o"); v != p {
			t.Errorf("-o = %q, want %q", v, p)
		}
	}
}

func TestB1_07_R2_CodexHomePinned(t *testing.T) {
	env := func(home, pinned string, set bool) LaunchSpec {
		s := cxSpec()
		s.CodexHome = pinned
		s.Env = map[string]string{"LANG": "C.UTF-8"}
		if set {
			s.Env["CODEX_HOME"] = home
		}
		return s
	}
	cxArgv(t, env("", "", false))
	cxArgv(t, env("", "/h/codex", false))
	cxArgv(t, env("/h/codex", "/h/codex", true))
	for name, s := range map[string]LaunchSpec{
		"another home":        env("/h/other", "/h/codex", true),
		"set, nothing pinned": env("/h/codex", "", true),
		"set empty":           env("", "", true),
		"set empty, pinned":   env("", "/h/codex", true),
		"trailing slash":      env("/h/codex/", "/h/codex", true),
		"case differs":        env("/H/codex", "/h/codex", true),
		"pin relative":        env("h/codex", "h/codex", true),
		"pin with ..":         env("/h/x/../codex", "/h/x/../codex", true),
		"pin is the worktree": env("/w/job-1", "/w/job-1", true),
		"pin in the worktree": env("/w/job-1/.codex", "/w/job-1/.codex", true),
	} {
		cxRefused(t, "CODEX_HOME "+name, s, ErrSpec)
	}
}

// The review's surviving mutants on 2592de6, each pinned.
func TestB1_07_R2_ReviewMutants(t *testing.T) {
	// :280 the answer itself must have no repeated key.
	dup := `{"verdict":"PASS","summary":"ok","verdict":"FORGED"}`
	cxNot(t, "answer with a repeated key", cxRun(cxSuccessWith(t, cxLMsg, cxMsg("item_2", dup)), ExitInfo{}))

	// :167 a run with no well-formed pin aborts once, as harness, before reading.
	ok := cxFixture(t, "success.jsonl")
	for _, pin := range []string{"", "x", strings.ToUpper(cxPin)} {
		r := cxRunRaw(bytes.NewReader(ok), pin, cxWithFile(ok, ExitInfo{}))
		if !reflect.DeepEqual(r.aborts, []Reason{ReasonHarness}) || !errors.Is(r.err, ErrHarness) {
			t.Errorf("pin %q: aborts %v, err %v; want one abort(harness) and ErrHarness", pin, r.aborts, r.err)
		}
		cxStatus(t, "pin "+pin, r.o, Unresolved, ReasonHarness)
	}

	// :215 turn.failed in order is a typed failure, unresolved with no reason; out of order, or
	// followed by anything, it is UNPARSED.
	l := cxLines(t, "success.jsonl")
	failed := `{"type":"turn.failed","error":{"message":"stream disconnected"}}`
	cxStatus(t, "turn-failed.jsonl", cxRun(cxFixture(t, "turn-failed.jsonl"), ExitInfo{Code: 1}), Unresolved, "")
	cxStatus(t, "answer then turn.failed", cxRun(cxSuccessWith(t, cxLDone, failed), ExitInfo{}), Unresolved, "")
	cxUnparsed(t, "turn.failed before turn.started", cxRun(cxJoin(l[cxLThread], failed), ExitInfo{}))
	cxUnparsed(t, "turn.failed before thread.started", cxRun(cxJoin(failed), ExitInfo{}))
	cxUnparsed(t, "turn.failed then an answer", cxRun(cxJoin(append(slices.Clone(l[:cxLMsg]), failed, l[cxLMsg])...), ExitInfo{}))
	cxUnparsed(t, "turn.failed twice", cxRun(cxJoin(append(slices.Clone(l[:cxLDone]), failed, failed)...), ExitInfo{}))

	// :222 every item has a non-empty string id.
	for name, item := range map[string]string{
		"empty id":               `{"type":"item.completed","item":{"id":"","type":"reasoning","text":"x"}}`,
		"no id":                  `{"type":"item.completed","item":{"type":"reasoning","text":"x"}}`,
		"numeric id":             `{"type":"item.completed","item":{"id":7,"type":"reasoning","text":"x"}}`,
		"empty id on the answer": `{"type":"item.completed","item":{"id":"","type":"agent_message","text":"{\"verdict\":\"PASS\",\"summary\":\"ok\"}"}}`,
	} {
		cxUnparsed(t, name, cxRun(cxJoin(slices.Insert(slices.Clone(l), cxLMsg, item)...), ExitInfo{}))
	}

	// :235-236 Children: one child per collab_tool_call id, in order, with its tool.
	c := NewCodex(cxDigest)
	r := cxRunReader(cxFixture(t, "collab-spawn.jsonl"), ExitInfo{})
	want := []ChildJob{{ToolUseID: "item_3", Tool: "spawn_agent"}}
	if got := c.Children(r.tr); !reflect.DeepEqual(got, want) {
		t.Errorf("Children(collab-spawn) = %+v, want %+v", got, want)
	}
	second := `{"type":"item.completed","item":{"id":"item_7","type":"collab_tool_call","tool":"wait","receiver_thread_ids":[],"prompt":"","status":"completed"}}`
	cl := cxLines(t, "collab-spawn.jsonl")
	two := cxJoin(slices.Insert(slices.Clone(cl), len(cl)-1, second)...)
	r = cxRunReader(two, ExitInfo{})
	want = append(want, ChildJob{ToolUseID: "item_7", Tool: "wait"})
	if got := c.Children(r.tr); !reflect.DeepEqual(got, want) {
		t.Errorf("Children(two collab items) = %+v, want %+v", got, want)
	}
}
