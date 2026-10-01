package main

import (
	"bytes"
	"strings"
	"testing"
)

func TestRunExitCodes(t *testing.T) {
	t.Setenv("GOPROXY", "off")
	t.Setenv("GOFLAGS", "")
	real := []string{"-kernel", "../..", "-repo", "../../.."}
	for _, tc := range []struct {
		name string
		args []string
		want int
		out  string
	}{
		{"clean tree passes", real, 0, "avk-boundary: ok"},
		{"a finding fails", append(real, "-max-lines", "1"), 1, "[size]"},
		{"a check that cannot run is not a pass", append(real, "-allowed", "testdata-missing"), 2, "no such file"},
		{"kernel outside the repo is refused", []string{"-kernel", "../..", "-repo", "../../internal"}, 2, "not a directory inside repo"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var out, errOut bytes.Buffer
			if got := run(tc.args, &out, &errOut); got != tc.want {
				t.Fatalf("exit %d, want %d\nstdout: %s\nstderr: %s", got, tc.want, &out, &errOut)
			}
			if all := out.String() + errOut.String(); !strings.Contains(all, tc.out) {
				t.Fatalf("output lacks %q:\n%s", tc.out, all)
			}
		})
	}
}
