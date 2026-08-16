p = 'scripts/launcher-permissions.test.mjs'
s = open(p).read()

old = """test('the allow list covers what agents actually run', () => {
  const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  const allow = new Set(s.permissions.allow);
  for (const cmd of ['npm', 'bun', 'bunx', 'git', 'node', 'gh', 'printf', 'timeout', 'sleep']) {
    assert.ok(allow.has(`Bash(${cmd} *)`), `Bash(${cmd} *) missing - removing the flag without this makes ordinary work prompt`);
  }
});"""

new = """test('the allow list covers what agents actually run', () => {
  const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  const allow = new Set(s.permissions.allow);
  for (const e of ['Bash(git *)', 'Bash(node *)', 'Bash(gh *)', 'Bash(npm run *)', 'Bash(bun test *)', 'Bash(printf *)', 'Bash(sleep *)']) {
    assert.ok(allow.has(e), `${e} missing - ordinary work would prompt`);
  }
});

test('the package managers are allowed by VERB, never wholesale', () => {
  // An independent reviewer of PR #47 caught this: the first cut allowed Bash(npm *),
  // Bash(bun *) and Bash(bunx *), which auto-approves `npx`/`bunx`/`npm exec` -- downloading and
  // executing an arbitrary remote package. That is the same capability the curl and wget denies
  // exist to refuse, and it shipped in the change that removed the skip-permissions flag and was
  // described as tightening. A wholesale grant on a tool with a fetch-and-run subcommand is a
  // hole regardless of intent.
  const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  for (const bad of ['Bash(npm *)', 'Bash(bun *)', 'Bash(bunx *)', 'Bash(npx *)', 'Bash(timeout *)']) {
    assert.equal(s.permissions.allow.includes(bad), false, `${bad} is a wholesale grant and re-opens fetch-and-run`);
  }
  const deny = new Set(s.permissions.deny);
  for (const d of ['Bash(npx *)', 'Bash(bunx *)', 'Bash(npm exec *)', 'Bash(bun x *)']) {
    assert.ok(deny.has(d), `${d} missing from the deny list`);
  }
});"""

assert old in s, "allow-list test not found"
s = s.replace(old, new)
open(p, 'w').write(s)
print("launcher tests updated")
