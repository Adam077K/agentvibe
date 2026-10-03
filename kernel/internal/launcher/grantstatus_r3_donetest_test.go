//go:build donetest

// B1-08d done-tests, round 3: "2026-10-03 review r1 gaps".
//
//	V5 Live fails closed on a clock it cannot compare: the zero time, and any instant outside the
//	   int64 Unix-nanosecond range (before 1677-09-21 or after 2262-04-11), is never read as before
//	   the grant's until.
//
// Run: go -C kernel test -count=1 -tags donetest -run B1_08d ./internal/launcher/
package launcher

import (
	"testing"
	"time"
)

// TestB1_08d_R3_UnrepresentableClockFailsClosed: V5.
func TestB1_08d_R3_UnrepresentableClockFailsClosed(t *testing.T) {
	j, _ := d8Journal(t)
	d8Release(t, j, d8GrantA, time.Now().Add(24*time.Hour))
	if err := d8Status(t, j, d8GrantA, time.Now).Live(); err != nil {
		t.Fatalf("Live on the real clock: %v; want nil (control)", err)
	}
	for _, tc := range []struct {
		name string
		at   time.Time
	}{
		{"the zero time", time.Time{}},
		{"year 1, below the int64 range (before 1677-09-21)", time.Date(1, 1, 2, 0, 0, 0, 0, time.UTC)},
		{"one nanosecond past the int64 range", time.Unix(0, 1<<63-1).Add(time.Nanosecond)},
		{"year 2263", time.Date(2263, 1, 1, 0, 0, 0, 0, time.UTC)},
		{"year 9999", time.Date(9999, 12, 31, 0, 0, 0, 0, time.UTC)},
	} {
		at := tc.at
		if err := d8Status(t, j, d8GrantA, func() time.Time { return at }).Live(); err == nil {
			t.Errorf("Live with the clock at %s (%s): nil; want an error (fail closed)", tc.name, at.Format(time.RFC3339Nano))
		}
	}
}
