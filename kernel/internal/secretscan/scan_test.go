package secretscan

import (
	"errors"
	"fmt"
	"go/parser"
	"go/token"
	"math/rand/v2"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"
)

// Every secret-shaped string in this file is assembled at run time from fragments, from a seeded
// generator, so no realistic token ever appears as a literal in the source (GitHub push protection
// would refuse one, and a scanner of this repository would rightly flag one).

const (
	upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	alnum = upper + "abcdefghijklmnopqrstuvwxyz0123456789"
	digit = "0123456789"
)

func pick(r *rand.Rand, set string, n int) string {
	var b strings.Builder
	for range n {
		b.WriteByte(set[r.IntN(len(set))])
	}
	return b.String()
}

type seed struct {
	rule string
	file string // path inside the fixture repo
	line string // the one line that carries the secret
}

// seeds returns the nine secret kinds, each built from fragments. Kind i of fixture n is n % 9.
func seeds(r *rand.Rand) []seed {
	pem := "-----" + "BEGIN " + "RSA " + "PRIVATE" + " KEY" + "-----"
	return []seed{
		{RulePrivateKey, "deploy/id_rsa", pem},
		{RuleAWSKeyID, "config/aws.ini", "aws_access_key_id = " + "AK" + "IA" + pick(r, upper+digit, 16)},
		{RuleGitHub, "scripts/release.sh", "export GH=" + "gh" + "p_" + pick(r, alnum, 36)},
		{RuleGitHub, ".github/ci.yml", "token: " + "github" + "_pat_" + pick(r, alnum, 22) + "_" + pick(r, alnum, 59)},
		{RuleAnthropic, "src/llm.py", `client = Client(api_key="` + "sk-" + "ant-" + "api03-" + pick(r, alnum+"-_", 93) + `")`},
		{RuleOpenAI, "src/oai.ts", `const k = "` + "sk-" + "proj-" + pick(r, alnum, 48) + `";`},
		{RuleSlack, "ops/notify.json", `{"hook": "` + "xo" + "xb-" + pick(r, digit, 12) + "-" + pick(r, digit, 12) + "-" + pick(r, alnum, 24) + `"}`},
		{RuleStripe, "billing/.env.local", "STRIPE=" + "sk" + "_live_" + pick(r, alnum, 32)},
		{RuleAssignedKey, "app/settings.env", "DATABASE" + "_SECRET=" + pick(r, alnum+"+/", 40)},
	}
}

// fixture writes a small ordinary repository into dir: some prose, some code, an empty .git.
func fixture(t *testing.T, dir string) {
	t.Helper()
	write(t, dir, "README.md", "# demo\n\nSet API_KEY in your environment; see docs.\n")
	write(t, dir, "src/main.go", "package main\n\nfunc main() { println(\"hello\") }\n")
	write(t, dir, ".git/HEAD", "ref: refs/heads/main\n")
}

func write(t *testing.T, dir, rel, body string) {
	t.Helper()
	p := filepath.Join(dir, filepath.FromSlash(rel))
	if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(p, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
}

// seeded builds a fixture repo with one secret of kind s, on line 3 of its file.
func seeded(t *testing.T, s seed) string {
	t.Helper()
	dir := t.TempDir()
	fixture(t, dir)
	write(t, dir, s.file, "# config\n\n"+s.line+"\n# end\n")
	return dir
}

func TestSeededSecretInEach26FixturesIsFound(t *testing.T) {
	r := rand.New(rand.NewPCG(19, 76))
	kinds := map[string]int{}
	for n := range 26 {
		s := seeds(r)[n%9]
		kinds[s.rule]++
		t.Run(fmt.Sprintf("%02d-%s", n, s.rule), func(t *testing.T) {
			res, err := Scan(seeded(t, s), "")
			if err != nil {
				t.Fatal(err)
			}
			want := Finding{Path: s.file, Line: 3, Rule: s.rule}
			if len(res.Findings) != 1 || res.Findings[0] != want {
				t.Fatalf("findings = %+v, want exactly [%+v]", res.Findings, want)
			}
		})
	}
	if len(kinds) != 8 { // nine seeds, two of them GitHub shapes
		t.Fatalf("fixtures covered %d rules, want all 8: %v", len(kinds), kinds)
	}
}

func TestCleanRepoHasZeroFindings(t *testing.T) {
	dir := t.TempDir()
	fixture(t, dir)
	write(t, dir, "deploy/app.env", "API_KEY=${API_KEY}\nSESSION_TOKEN: \"changeme-changeme-changeme\"\nPORT=8080\n"+
		"const JWT_SECRET = process.env.JWT_SECRET;\nFAKE_TOKEN=not-a-real-secret-written-by-b0-19\n")
	write(t, dir, "assets/logo.bin", "\x00\x01"+"gh"+"p_"+strings.Repeat("Ab3", 12)) // binary: skipped
	// A token under .git is outside the working tree and must not be read.
	write(t, dir, ".git/config", "url = https://x:"+"gh"+"p_"+pick(rand.New(rand.NewPCG(1, 2)), alnum, 36)+"@example.invalid\n")
	if err := os.Symlink("README.md", filepath.Join(dir, "link.md")); err != nil {
		t.Fatal(err)
	}
	res, err := Scan(dir, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(res.Findings) != 0 || res.FilesBinary != 1 || res.FilesScanned != 3 {
		t.Fatalf("got %d findings %+v, %d binary, %d scanned; want 0, 1, 3",
			len(res.Findings), res.Findings, res.FilesBinary, res.FilesScanned)
	}
}

func TestRequireScannedRefusesUnscannedRepo(t *testing.T) {
	dir := t.TempDir()
	fixture(t, dir)
	if err := RequireScanned(dir, t.TempDir()); !errors.Is(err, ErrNotScanned) {
		t.Fatalf("err = %v, want ErrNotScanned", err)
	}
}

func TestRequireScannedRefusesStaleReceiptAfterChange(t *testing.T) {
	dir, receipts := t.TempDir(), t.TempDir()
	fixture(t, dir)
	if _, _, err := ScanAndRecord(dir, receipts, time.Now()); err != nil {
		t.Fatal(err)
	}
	if err := RequireScanned(dir, receipts); err != nil {
		t.Fatalf("fresh clean receipt refused: %v", err)
	}
	write(t, dir, "src/main.go", "package main\n\nfunc main() {}\n")
	if err := RequireScanned(dir, receipts); !errors.Is(err, ErrStale) {
		t.Fatalf("after edit: err = %v, want ErrStale", err)
	}
}

func TestRequireScannedRefusesReceiptWithFindings(t *testing.T) {
	s := seeds(rand.New(rand.NewPCG(3, 4)))[2]
	dir, receipts := seeded(t, s), t.TempDir()
	_, path, err := ScanAndRecord(dir, receipts, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if err := RequireScanned(dir, receipts); !errors.Is(err, ErrFindings) {
		t.Fatalf("err = %v, want ErrFindings", err)
	}
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	secret := s.line[strings.Index(s.line, "=")+1:]
	if strings.Contains(string(data), secret) || !strings.Contains(string(data), `"findings_count": 1`) {
		t.Fatalf("receipt must count the finding and must not copy the secret:\n%s", data)
	}
}

func TestRequireScannedAcceptsCleanCurrentReceipt(t *testing.T) {
	dir := t.TempDir()
	fixture(t, dir)
	receipts := filepath.Join(dir, ".avscan") // inside the repo: must not move the tree hash
	_, path, err := ScanAndRecord(dir, receipts, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if err := RequireScanned(dir, receipts); err != nil {
		t.Fatalf("clean current receipt refused: %v", err)
	}
	if !strings.Contains(filepath.Base(path), "-") || filepath.Dir(path) != receipts {
		t.Fatalf("receipt written to unexpected path %s", path)
	}
}

// The acceptance says "with no model call". The scanner's own imports are the checkable half of
// that: stdlib only, and nothing that can open a connection or start a process.
func TestScannerImportsNoNetworkOrProcess(t *testing.T) {
	files, err := filepath.Glob("*.go")
	if err != nil {
		t.Fatal(err)
	}
	checked := 0
	for _, f := range files {
		if strings.HasSuffix(f, "_test.go") {
			continue
		}
		af, err := parser.ParseFile(token.NewFileSet(), f, nil, parser.ImportsOnly)
		if err != nil {
			t.Fatal(err)
		}
		for _, imp := range af.Imports {
			p, _ := strconv.Unquote(imp.Path.Value)
			if p == "net" || strings.HasPrefix(p, "net/") || p == "os/exec" || p == "syscall" ||
				strings.Contains(strings.SplitN(p, "/", 2)[0], ".") {
				t.Errorf("%s imports %q", f, p)
			}
		}
		checked++
	}
	if checked < 3 {
		t.Fatalf("checked %d source files, want at least 3", checked)
	}
}
