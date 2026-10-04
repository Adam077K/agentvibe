//go:build donetest

// Round-5 done-tests for B1-07. The Opus review PASSED 9faaaef on security with two MED-security
// findings; the orchestrator's fail-safe calls (2026-10-03, DR-B1-07 "Round 5"):
//
//  1. Env is an ALLOWLIST: HOME, CODEX_HOME, PATH, LANG; any other key is ErrSpec (OPENAI_BASE_URL,
//     OPENAI_API_KEY and CODEX_CA_CERTIFICATE were accepted). Measured, env -i and no model turn:
//     PATH is required (codex is a `#!/usr/bin/env node` launcher); one of HOME and CODEX_HOME is
//     required; nothing else is. PATH entries are clean absolute paths outside the worktree, none
//     empty (an empty entry is the cwd), so the worker cannot plant a binary codex runs.
//  2. `features={}` changes nothing (measured: `codex features list` is identical with and without
//     it), so apps, plugins, multi_agent, computer_use and more stayed on. Every feature that
//     `codex features list` reports and whose stage is not "removed" is pinned on the line, in its
//     listed order, with -c features.<name>=<bool>: false, except shell_tool (the worker's command
//     tool) and unified_exec (measured: -c features.unified_exec=false leaves it true). An unknown
//     name is refused by --strict-config (measured), so the list is also a version tripwire.
//  3. mcp_tool_call and web_search are locked off, so such an item means the lock failed: UNPARSED.
//  4. The review's two surviving test-gap mutants: a non-string agent_message followed by a valid
//     one, and the -C lexical check (an alias outside the worktree that resolves into it).
//
// Hashed in build/done-tests/B1-07.yml. Run: go -C kernel test -count=1 -tags donetest -run B1_07 ./internal/adapter/
package adapter

import (
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"testing"
)

// cxFeatures: `codex features list` of codex-cli 0.154.0 (throwaway HOME and CODEX_HOME), every
// feature whose stage is not "removed", in listed order, with the value the line pins.
var cxFeatures = []struct {
	name string
	on   bool
}{
	{"apply_patch_preserve_line_endings", false},
	{"apply_patch_streaming_events", false},
	{"apps", false},
	{"artifact", false},
	{"auth_elicitation", false},
	{"background_paginated_rollout_migration", false},
	{"bedrock_setup_wizard", false},
	{"browser_use", false},
	{"browser_use_external", false},
	{"browser_use_full_cdp_access", false},
	{"chronicle", false},
	{"code_mode", false},
	{"code_mode_host", false},
	{"code_mode_interrupt", false},
	{"code_mode_only", false},
	{"code_mode_prewarm", false},
	{"compaction_image_budget", false},
	{"computer_use", false},
	{"concurrent_reasoning_summaries", false},
	{"content_item_kinds", false},
	{"context_management", false},
	{"current_time_reminder", false},
	{"cwd_relative_turn_diffs", false},
	{"default_mode_request_user_input", false},
	{"deferred_executor", false},
	{"deferred_tool_world_state", false},
	{"enable_mcp_apps", false},
	{"enable_request_compression", false},
	{"exec_permission_approvals", false},
	{"executed_tool_call_metadata", false},
	{"executor_capability_discovery", false},
	{"external_agent_memory_import", false},
	{"fast_mode", false},
	{"goals", false},
	{"guardian_approval", false},
	{"guardian_enhanced_node_repl_transcripts", false},
	{"guardian_ext", false},
	{"guardian_node_repl_transcript_images", false},
	{"guardian_reuse_parent_compaction", false},
	{"guardianv2", false},
	{"guardianv2.thread_context", false},
	{"hooks", false},
	{"image_generation", false},
	{"image_resize_notice", false},
	{"in_app_browser", false},
	{"in_app_chat", false},
	{"in_app_dictation", false},
	{"in_app_local_automation", false},
	{"in_app_updates", false},
	{"local_thread_store_compression", false},
	{"mcp_2026_07_28", false},
	{"mcp_oauth_refresh_coordination", false},
	{"memories", false},
	{"mentions_v2", false},
	{"multi_agent", false},
	{"multi_agent_v2", false},
	{"network_proxy", false},
	{"non_prefixed_mcp_tool_names", false},
	{"omit_app_server_notification_media", false},
	{"personality", false},
	{"plugin_sharing", false},
	{"plugins", false},
	{"powershell_shell_version", false},
	{"prevent_idle_sleep", false},
	{"psp", false},
	{"reasoning_effort_override", false},
	{"recommended_plugins", false},
	{"remote_compaction_v2", false},
	{"remote_plugin", false},
	{"request_permissions_tool", false},
	{"respect_system_proxy", false},
	{"retain_client_developer_messages", false},
	{"rollout_budget", false},
	{"runtime_metrics", false},
	{"secret_auth_storage", false},
	{"shell_snapshot", false},
	{"shell_snapshot_v2", false},
	{"shell_tool", true},
	{"shell_zsh_fork", false},
	{"skill_mcp_dependency_install", false},
	{"skill_search", false},
	{"skip_host_skill_discovery", false},
	{"sleep_tool", false},
	{"standalone_web_search", false},
	{"step_model_switching", false},
	{"terminal_visualization_instructions", false},
	{"token_budget", false},
	{"tool_call_mcp_elicitation", false},
	{"tool_suggest", false},
	{"transcript_v2", false},
	{"unbounded_connection_retries", false},
	{"unified_exec", true},
	{"unified_exec_tty", false},
	{"unified_image_budget", false},
	{"use_agent_identity", false},
	{"use_legacy_landlock", false},
	{"view_image", false},
	{"web_search_cached", false},
	{"web_search_request", false},
	{"windows_sandbox_service", false},
	{"workspace_dependencies", false},
	{"worktrees", false},
	{"write_stdin_approval", false},
}

// cxFeaturePins is the -c pair for each of cxFeatures, in order: the tail of the locked line.
func cxFeaturePins() []string {
	var out []string
	for _, f := range cxFeatures {
		out = append(out, "-c", "features."+f.name+"="+strconv.FormatBool(f.on))
	}
	return out
}

func init() {
	for _, f := range cxFeatures {
		cxLocked["features."+f.name] = strconv.FormatBool(f.on)
	}
}

func TestB1_07_R5_EnvAllowlist(t *testing.T) {
	ok := []map[string]string{
		nil, {}, {"LANG": "C.UTF-8"}, {"PATH": "/usr/bin:/bin"},
		{"PATH": "/opt/homebrew/bin:/usr/bin:/bin", "LANG": "en_US.UTF-8"},
	}
	for _, env := range ok {
		s := cxSpec()
		s.Env = env
		cxArgv(t, s)
	}
	s := cxSpec()
	s.Home, s.CodexHome = "/h/user", "/h/user/.codex"
	s.Env = map[string]string{"HOME": "/h/user", "CODEX_HOME": "/h/user/.codex", "PATH": "/usr/bin", "LANG": "C"}
	cxArgv(t, s)
	for _, k := range []string{"OPENAI_BASE_URL", "OPENAI_API_KEY", "OPENAI_ORG_ID", "CODEX_CA_CERTIFICATE",
		"CODEX_API_KEY", "CODEX_ACCESS_TOKEN", "CODEX_AUTH", "CODEX_SQLITE_HOME", "CODEX_URL",
		"CODEX_INTERNAL_ORIGINATOR_OVERRIDE", "CODEX_MANAGED_PACKAGE_ROOT", "HTTPS_PROXY", "https_proxy",
		"HTTP_PROXY", "ALL_PROXY", "NO_PROXY", "SSL_CERT_FILE", "SSL_CERT_DIR", "NODE_OPTIONS",
		"NODE_EXTRA_CA_CERTS", "LD_PRELOAD", "DYLD_INSERT_LIBRARIES", "RUST_LOG", "TMPDIR", "SHELL",
		"AV_JOB", "path", "Path", "lang", "PATH ", " PATH", "HOME\x00", "", "LC_ALL"} {
		s := cxSpec()
		s.Env = map[string]string{"LANG": "C.UTF-8", k: "x"}
		cxRefused(t, "Env key "+strconv.Quote(k), s, ErrSpec)
	}
	for _, p := range []string{"", ":", "/usr/bin:", ":/usr/bin", "/usr/bin::/bin", ".", "bin", "./bin",
		"/usr/bin:bin", "/usr/../bin", "/usr/bin/", "/usr//bin", "/w/job-1", "/w/job-1/bin",
		"/usr/bin:/w/job-1/node_modules/.bin", "/usr/bin\n/bin", "/usr/b\u00efn"} {
		s := cxSpec()
		s.Env = map[string]string{"PATH": p}
		cxRefused(t, "PATH "+strconv.Quote(p), s, ErrSpec)
	}
}

// A PATH entry that names the worktree through a symlink outside it is in the worktree.
func TestB1_07_R5_PathResolved(t *testing.T) {
	dir, wt := cxR3Dirs(t)
	bin := filepath.Join(wt, "bin")
	if err := os.Mkdir(bin, 0o755); err != nil {
		t.Fatal(err)
	}
	alias := filepath.Join(dir, "alias-bin")
	cxR3Symlink(t, bin, alias)
	s := cxR3Spec(wt)
	s.Env = map[string]string{"PATH": "/usr/bin:" + alias}
	cxRefused(t, "PATH through an alias into the worktree", s, ErrSpec)
	s.Env = map[string]string{"PATH": "/usr/bin:" + dir}
	cxArgv(t, s)
}

func TestB1_07_R5_FeaturesPinned(t *testing.T) {
	for name, a := range map[string][]string{"Template": NewCodex(cxDigest).Template(), "Argv": cxArgv(t, cxSpec())} {
		if slices.Contains(a, "features={}") {
			t.Errorf("%s still carries features={}, which measured as a no-op", name)
		}
		var pins []string
		for i := 0; i+1 < len(a); i++ {
			if a[i] == "-c" && strings.HasPrefix(a[i+1], "features") {
				pins = append(pins, a[i+1])
			}
		}
		if want := cxFeaturePins(); len(pins)*2 != len(want) {
			t.Errorf("%s pins %d features, want the %d measured", name, len(pins), len(want)/2)
		}
		for _, f := range cxFeatures {
			want := "features." + f.name + "=" + strconv.FormatBool(f.on)
			if n := strings.Count(strings.Join(pins, "\n")+"\n", want+"\n"); n != 1 {
				t.Errorf("%s: %q appears %d times, want once", name, want, n)
			}
		}
		if !slices.Equal(a[len(a)-len(cxFeaturePins()):], cxFeaturePins()) {
			t.Errorf("%s does not end with the feature pins in measured order", name)
		}
	}
	on := 0
	for _, f := range cxFeatures {
		if f.on {
			on++
		}
	}
	if on != 2 {
		t.Fatalf("the measured list turns %d features on, want 2 (shell_tool, unified_exec)", on)
	}
}

// Founder ruling 2: nested agents never. multi_agent was on by default (measured).
func TestB1_07_R5_MultiAgentOff(t *testing.T) {
	argv := cxArgv(t, cxSpec())
	for _, want := range []string{"features.multi_agent=false", "features.multi_agent_v2=false"} {
		if i := slices.Index(argv, want); i < 1 || argv[i-1] != "-c" {
			t.Errorf("argv lacks -c %s", want)
		}
	}
	for i, a := range argv {
		if strings.Contains(a, "multi_agent") && !strings.HasSuffix(a, "=false") || strings.Contains(a, "collab") {
			t.Errorf("argv[%d] = %q turns a nested-agent feature on", i, a)
		}
	}
	on := slices.Clone(cxTokens)
	on[slices.Index(on, "features.multi_agent=false")] = "features.multi_agent=true"
	s := cxSpec()
	s.InitExpect = cxArgvDigest(on)
	cxRefused(t, "a line with multi_agent on", s, ErrSpec)
}

// MCP and web search are locked off; such an item means the lock failed, so it is never a pass.
func TestB1_07_R5_LockedOffItemsUnparsed(t *testing.T) {
	for _, ityp := range []string{"mcp_tool_call", "web_search"} {
		for _, ev := range []string{"item.started", "item.updated", "item.completed"} {
			line := cxEvent(map[string]any{"type": ev, "item": map[string]any{"id": "item_0", "type": ityp}})
			cxUnparsed(t, ev+" "+ityp, cxRun(cxSuccessWith(t, 2, line), ExitInfo{}))
		}
	}
	// Control: the quiet items that remain still let a good run adjudicate.
	for _, ityp := range []string{"reasoning", "command_execution", "file_change", "todo_list"} {
		line := cxEvent(map[string]any{"type": "item.completed", "item": map[string]any{"id": "item_0", "type": ityp}})
		cxAdjudicated(t, ityp, cxRun(cxSuccessWith(t, 2, line), ExitInfo{}), cxOutput)
	}
}

// A completed agent_message whose text is not a string is out of shape, even when a valid
// message follows and becomes the answer.
func TestB1_07_R5_NonStringMessageThenValid(t *testing.T) {
	for name, text := range map[string]any{"number": 5, "null": nil, "object": map[string]any{"verdict": "PASS"},
		"array": []any{"x"}, "bool": true} {
		line := cxEvent(map[string]any{"type": "item.completed",
			"item": map[string]any{"id": "item_0", "type": "agent_message", "text": text}})
		cxUnparsed(t, "text "+name+" then a valid message", cxRun(cxSuccessWith(t, 2, line), ExitInfo{}))
	}
}

// -C is named inside the worktree lexically as well as after resolution: an alias outside the
// worktree that resolves into it is refused, so -C (codex's writable root) and Worktree agree.
func TestB1_07_R5_CwdLexical(t *testing.T) {
	dir, wt := cxR3Dirs(t)
	sub := filepath.Join(wt, "sub")
	if err := os.Mkdir(sub, 0o755); err != nil {
		t.Fatal(err)
	}
	alias := filepath.Join(dir, "alias-wt")
	cxR3Symlink(t, wt, alias)
	for name, cwd := range map[string]string{
		"alias of the worktree": alias, "alias then a subdirectory": filepath.Join(alias, "sub"),
	} {
		s := cxR3Spec(wt)
		s.Cwd = cwd
		cxRefused(t, name, s, ErrSpec)
	}
	s := cxR3Spec(wt)
	s.Cwd = sub
	cxArgv(t, s)
}
