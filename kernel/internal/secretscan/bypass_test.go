package secretscan

import (
	"errors"
	"math/rand/v2"
	"os"
	"path/filepath"
	"testing"
	"time"
)

// These tests pin the bypasses found by the review of 4176882; each was reproduced against avscan
// before it was closed. Secret-shaped strings are assembled at run time, as in scan_test.go.

const b64url = alnum + "_"

// jwt builds a three-part token with no '-' in it: the shape an earlier dotted-reference
// suppression hid when it was assigned to a *_KEY name.
func jwt(r *rand.Rand) string {
	return "ey" + "J" + pick(r, b64url, 30) + "." + "ey" + "J" + pick(r, b64url, 80) + "." + pick(r, b64url, 43)
}

// Item 1 and item 6: named assignment forms, the JWT rule, the one suppression, and the floor.
// The miss rate on random values is TestAssignedSecretRandomMissRate.
func TestAssignedSecretCoverage(t *testing.T) {
	r := rand.New(rand.NewPCG(7, 7))
	cases := []struct{ line, want string }{
		{"SUPABASE_SERVICE_ROLE_KEY=" + jwt(r), RuleJWT},
		{"DB_PASSWORD=" + pick(r, alnum+"!@#%^&*", 20), RuleAssignedKey},
		{`  apiKey: "` + pick(r, alnum, 32) + `",`, RuleAssignedKey},
		{"api_key: " + pick(r, "0123456789abcdef", 40), RuleAssignedKey},
		{`"clientSecret": "` + pick(r, alnum, 24) + `"`, RuleAssignedKey},
	}
	for _, c := range cases {
		if got := matchLine(c.line); len(got) != 1 || got[0] != c.want {
			t.Errorf("matchLine(%.30q...) = %v, want [%s]", c.line, got, c.want)
		}
	}
	for _, ref := range []string{"X_TOKEN=${X_TOKEN_FROM_THE_VAULT}", "const JWT_SECRET = process.env.JWT_SECRET;"} {
		if got := matchLine(ref); got != nil {
			t.Errorf("reference %q flagged as %v", ref, got)
		}
	}
	// The floor still exists: near-constant placeholders are not reported.
	for _, ph := range []string{"SERVICE_TOKEN=xxxxxxxxxxxxxxxxxxxx", "SESSION_TOKEN=changeme-changeme-changeme", "API_KEY=0000000000000000"} {
		if got := matchLine(ph); got != nil {
			t.Errorf("placeholder %q flagged as %v", ph, got)
		}
	}
}

// The miss rate on random values of the lengths real keys use (16-64), for hex, alphanumeric and
// base64. Every set order under several seeds, each from a fresh generator, so the sample is fixed
// and no one order or seed is chosen: the flat floors this replaced missed "770ffdf4dff07c44" and
// "FpHdHxxdXdKwkH2p" under some orders and not others, and a test that ranged over a map of sets
// failed ~1 run in 6. The measurement is the evidence the rules.go comment cites.
func TestAssignedSecretRandomMissRate(t *testing.T) {
	sets := map[string]string{"hex": "0123456789abcdef", "alnum": alnum, "base64": alnum + "+/"}
	orders := [][]string{
		{"hex", "alnum", "base64"}, {"hex", "base64", "alnum"},
		{"alnum", "hex", "base64"}, {"alnum", "base64", "hex"},
		{"base64", "hex", "alnum"}, {"base64", "alnum", "hex"},
	}
	const n = 3000
	misses, drawn := map[string]int{}, map[string]int{}
	for _, seed := range [][2]uint64{{7, 7}, {19, 76}, {2026, 1002}} {
		for _, order := range orders {
			r := rand.New(rand.NewPCG(seed[0], seed[1]))
			for _, name := range order {
				for i := range n {
					v := pick(r, sets[name], 16+i%49) // lengths 16..64
					drawn[name]++
					if matchLine("SERVICE_TOKEN="+v) == nil {
						misses[name]++
						t.Errorf("%s: missed %q (len %d, %.3f bits)", name, v, len(v), entropy(v))
					}
				}
			}
		}
	}
	for _, name := range []string{"hex", "alnum", "base64"} {
		t.Logf("%s: %d of %d random values missed", name, misses[name], drawn[name])
		if drawn[name] != 3*len(orders)*n {
			t.Errorf("%s: drew %d values, want %d", name, drawn[name], 3*len(orders)*n)
		}
	}
}

// Item 2: a symlink leaving the repository (or into the top-level .git) is a finding, not a skip.
func TestSymlinkEscapingRepoIsAFinding(t *testing.T) {
	dir, outside := t.TempDir(), t.TempDir()
	fixture(t, dir)
	write(t, outside, "creds.txt", "nothing yet\n")
	links := map[string]string{
		"vendor/creds.txt": filepath.Join(outside, "creds.txt"),
		"relative-up":      "../../..",
		"git-config":       ".git/HEAD",
		"missing-outside":  filepath.Join(outside, "not-there-yet"),
	}
	for name, target := range links {
		p := filepath.Join(dir, name)
		os.MkdirAll(filepath.Dir(p), 0o755)
		if err := os.Symlink(target, p); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.Symlink("README.md", filepath.Join(dir, "ok-link")); err != nil {
		t.Fatal(err)
	}
	res, err := Scan(dir, t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	got := map[string]bool{}
	for _, f := range res.Findings {
		if f.Rule != RuleSymlinkEscape {
			t.Errorf("unexpected finding %+v", f)
		}
		got[f.Path] = true
	}
	for name := range links {
		if !got[name] {
			t.Errorf("symlink %s -> %s was not refused", name, links[name])
		}
	}
	if got["ok-link"] || len(got) != len(links) {
		t.Fatalf("findings = %+v, want exactly the %d escaping links", res.Findings, len(links))
	}
}

// Item 3: only the top-level, real .git is skipped. A nested .git added after a scan invalidates the
// receipt and is scanned.
func TestNestedGitDirIsScannedAndHashed(t *testing.T) {
	dir, receipts := t.TempDir(), t.TempDir()
	fixture(t, dir)
	if _, _, err := ScanAndRecord(dir, receipts, time.Now()); err != nil {
		t.Fatal(err)
	}
	write(t, dir, "lib/.git/token", "gh"+"p_"+pick(rand.New(rand.NewPCG(5, 5)), alnum, 36)+"\n")
	if err := RequireScanned(dir, receipts); !errors.Is(err, ErrStale) {
		t.Fatalf("after nested .git write: err = %v, want ErrStale", err)
	}
	res, err := Scan(dir, receipts)
	if err != nil {
		t.Fatal(err)
	}
	want := Finding{Path: "lib/.git/token", Line: 1, Rule: RuleGitHub}
	if len(res.Findings) != 1 || res.Findings[0] != want {
		t.Fatalf("findings = %+v, want [%+v]", res.Findings, want)
	}
}

// Item 4: a receipt directory inside the repository is refused by every entry point.
func TestReceiptDirInsideRepoIsRefused(t *testing.T) {
	dir := t.TempDir()
	fixture(t, dir)
	for _, rd := range []string{filepath.Join(dir, ".avscan"), dir, filepath.Join(dir, "a", "b")} {
		if _, _, err := ScanAndRecord(dir, rd, time.Now()); !errors.Is(err, ErrReceiptInRepo) {
			t.Errorf("ScanAndRecord(%s): err = %v, want ErrReceiptInRepo", rd, err)
		}
		if err := RequireScanned(dir, rd); !errors.Is(err, ErrReceiptInRepo) {
			t.Errorf("RequireScanned(%s): err = %v, want ErrReceiptInRepo", rd, err)
		}
	}
}

// Item 5: UTF-16 text (BOM, NUL-interleaved) is read, not skipped as binary.
func TestUTF16TextIsMatched(t *testing.T) {
	line := "token = " + "gh" + "p_" + pick(rand.New(rand.NewPCG(9, 9)), alnum, 36)
	for name, bom := range map[string][]byte{"le": {0xFF, 0xFE}, "be": {0xFE, 0xFF}} {
		enc := append([]byte{}, bom...)
		for _, b := range []byte("# notes\n" + line + "\n") {
			if name == "le" {
				enc = append(enc, b, 0)
			} else {
				enc = append(enc, 0, b)
			}
		}
		dir := t.TempDir()
		fixture(t, dir)
		write(t, dir, "notes.txt", string(enc))
		res, err := Scan(dir, t.TempDir())
		if err != nil {
			t.Fatal(err)
		}
		want := Finding{Path: "notes.txt", Line: 2, Rule: RuleGitHub}
		if len(res.Findings) != 1 || res.Findings[0] != want || res.FilesBinary != 1 {
			t.Errorf("utf-16%s: findings = %+v (binary %d), want [%+v]", name, res.Findings, res.FilesBinary, want)
		}
	}
}
