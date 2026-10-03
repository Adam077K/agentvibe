package adapter

import (
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// The codex profile check (DR-B1-07 round 3): a minimal strict TOML reader for the subset the
// generated profile needs. No Go TOML library is in the offline module cache. Anything outside the
// subset is refused, never guessed at, so a key can only count where TOML would put it.
//
// The subset, one construct per line: blank lines and '#' comments; [table] headers (no [[array
// of tables]]); key = value pairs whose key is bare, "quoted" or 'literal', dotted or not; values
// that are a one-line basic or literal string (no multi-line """ or ''' string), true/false, a
// decimal number, a one-line array of values or a one-line inline table. A value may be followed
// by a comment. A key defined twice, in any spelling, is refused.

var (
	tomlBare   = regexp.MustCompile(`^[A-Za-z0-9_-]+`)
	tomlScalar = regexp.MustCompile(`^(true|false|[+-]?(0|[1-9][0-9_]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?)`)
)

type tomlLine struct {
	s string
	i int
}

func (p *tomlLine) ws() {
	for p.i < len(p.s) && (p.s[p.i] == ' ' || p.s[p.i] == '\t') {
		p.i++
	}
}

func (p *tomlLine) eat(c byte) bool {
	if p.i < len(p.s) && p.s[p.i] == c {
		p.i++
		return true
	}
	return false
}

// end: nothing but a comment is left.
func (p *tomlLine) end() bool { p.ws(); return p.i >= len(p.s) || p.s[p.i] == '#' }

// str reads one single-line string at p.i. A key may carry no escape at all.
func (p *tomlLine) str(key bool) (string, bool) {
	q := p.s[p.i]
	p.i++
	var b strings.Builder
	for p.i < len(p.s) {
		c := p.s[p.i]
		p.i++
		switch {
		case c == q:
			return b.String(), true
		case c < 0x20 && c != '\t' || c == 0x7f:
			return "", false
		case c == '\\' && q == '"':
			if key || p.i >= len(p.s) || !strings.ContainsRune(`btnfr"\`, rune(p.s[p.i])) {
				return "", false
			}
			b.WriteByte('\\')
			b.WriteByte(p.s[p.i])
			p.i++
		default:
			b.WriteByte(c)
		}
	}
	return "", false // unterminated
}

// key reads a dotted key; its parts are joined with NUL, so "a.b" quoted is one part, not two.
func (p *tomlLine) key() (string, bool) {
	var parts []string
	for {
		p.ws()
		if p.i < len(p.s) && (p.s[p.i] == '"' || p.s[p.i] == '\'') {
			k, ok := p.str(true)
			if !ok {
				return "", false
			}
			parts = append(parts, k)
		} else if m := tomlBare.FindString(p.s[p.i:]); m != "" {
			parts, p.i = append(parts, m), p.i+len(m)
		} else {
			return "", false
		}
		p.ws()
		if !p.eat('.') {
			return strings.Join(parts, "\x00"), true
		}
	}
}

func (p *tomlLine) value(depth int) bool {
	if depth > 8 || p.i >= len(p.s) {
		return false
	}
	switch p.s[p.i] {
	case '"', '\'':
		_, ok := p.str(false)
		return ok
	case '[':
		p.i++
		return p.seq(']', func() bool { return p.value(depth + 1) })
	case '{':
		p.i++
		seen := map[string]bool{}
		return p.seq('}', func() bool {
			k, ok := p.key()
			if !ok || seen[k] || !p.eat('=') {
				return false
			}
			seen[k] = true
			p.ws()
			return p.value(depth + 1)
		})
	}
	m := tomlScalar.FindString(p.s[p.i:])
	p.i += len(m)
	return m != ""
}

// seq reads comma-separated elements up to close, on this line, with no trailing comma.
func (p *tomlLine) seq(close byte, elem func() bool) bool {
	if p.ws(); p.eat(close) {
		return true
	}
	for {
		if p.ws(); !elem() {
			return false
		}
		if p.ws(); p.eat(close) {
			return true
		}
		if !p.eat(',') {
			return false
		}
	}
}

// profileComplete: toml parses in the subset above and defines every codexRequiredKeys entry
// as a value. It checks presence only, never values (DR round 2, residual risk).
func profileComplete(toml string) bool {
	vals, tabs, hdrs := map[string]bool{}, map[string]bool{}, map[string]bool{}
	define := func(full string, header bool) bool {
		parts := strings.Split(full, "\x00")
		for j := 1; j < len(parts); j++ {
			pre := strings.Join(parts[:j], "\x00")
			if vals[pre] {
				return false
			}
			tabs[pre] = true
		}
		if vals[full] || header && hdrs[full] || !header && tabs[full] {
			return false
		}
		if header {
			hdrs[full], tabs[full] = true, true
		} else {
			vals[full] = true
		}
		return true
	}
	table := ""
	for _, line := range strings.Split(toml, "\n") {
		p := &tomlLine{s: strings.TrimSuffix(line, "\r")}
		if p.end() {
			continue
		}
		if p.eat('[') {
			k, ok := p.key()
			if !ok || !p.eat(']') || !define(k, true) || !p.end() {
				return false
			}
			table = k + "\x00"
			continue
		}
		k, ok := p.key()
		if !ok || !p.eat('=') {
			return false
		}
		if p.ws(); !p.value(0) || !define(table+k, false) || !p.end() {
			return false
		}
	}
	for _, k := range codexRequiredKeys {
		if !vals[strings.ReplaceAll(k, ".", "\x00")] {
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

// resolve is p through EvalSymlinks on its longest existing prefix, the rest appended. A dangling
// symlink, or any error but not-exist, fails.
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
