package secretscan

import (
	"math"
	"strings"
	"testing"
)

// These tests pin the length-scaled entropy floors in rules.go. They exist because a mutation run
// against a36f1b9 found 16 of 20 mutants of floorAt, highEntropy and the knot tables surviving the
// rest of the suite: nothing asserted what the floor IS at a given length, only that random values
// clear it. The founder decision (2026-10-02, "tighten the scanner") has one hard bound, asserted
// first: the new floor is never above the flat floor it replaced, so nothing reported under the old
// rule goes unreported under the new one.

// The flat floors the length-scaled curves replaced, in bits per character.
const (
	oldHexFloor  = 2.5
	oldTextFloor = 3.2
)

// Kills any knot raised above the old floor, at any position: the bound is checked at every length
// a value can have, 15 (one under the assignment rule's minimum) through 4096. The curve must also
// never fall as length grows (a longer random value has a tighter entropy tail, never a looser
// one) and must END at the old floor, which is what "tighten" means for long values.
func TestFloorNeverAboveOldFlatFloors(t *testing.T) {
	for _, c := range []struct {
		name  string
		knots []entropyKnot
		old   float64
	}{{"hex", hexFloor, oldHexFloor}, {"text", textFloor, oldTextFloor}} {
		prev := math.Inf(-1)
		for n := 15; n <= 4096; n++ {
			f := floorAt(c.knots, n)
			if f > c.old {
				t.Errorf("%s: floorAt(%d) = %.4f, above the old flat floor %.1f", c.name, n, f, c.old)
			}
			if f < prev {
				t.Errorf("%s: floorAt(%d) = %.4f falls below floorAt(%d) = %.4f", c.name, n, f, n-1, prev)
			}
			prev = f
		}
		if f := floorAt(c.knots, 4096); f != c.old {
			t.Errorf("%s: floorAt(4096) = %.4f, want the old flat floor %.1f", c.name, f, c.old)
		}
	}
}

// pinnedFloors is the expected floor at each length, written out by hand from the knots in rules.go
// (hex 1.35@16 1.65@20 2.0@24 2.4@32 2.5@36; text 2.3@16 2.7@20 3.0@24 3.2@28), so a changed knot,
// a wrong interpolation direction, or a wrong value past the last knot fails here by name. Odd
// lengths between knots are included because a knot length alone cannot tell the interpolation
// direction from its reverse.
var pinnedFloors = []struct {
	n         int
	hex, text float64
}{
	{15, 1.35, 2.3},
	{16, 1.35, 2.3},
	{18, 1.5, 2.5},
	{20, 1.65, 2.7},
	{22, 1.825, 2.85},
	{24, 2.0, 3.0},
	{26, 2.1, 3.1},
	{28, 2.2, 3.2},
	{30, 2.3, 3.2},
	{32, 2.4, 3.2},
	{34, 2.45, 3.2},
	{36, 2.5, 3.2},
	{64, 2.5, 3.2},
	{200, 2.5, 3.2},
}

func TestFloorPinnedTable(t *testing.T) {
	const eps = 1e-9
	for _, p := range pinnedFloors {
		if got := floorAt(hexFloor, p.n); math.Abs(got-p.hex) > eps {
			t.Errorf("hex floor at %d = %.6f, want %.6f", p.n, got, p.hex)
		}
		if got := floorAt(textFloor, p.n); math.Abs(got-p.text) > eps {
			t.Errorf("text floor at %d = %.6f, want %.6f", p.n, got, p.text)
		}
	}
}

// Alphabets for the fixed boundary values. Each text alphabet starts with a symbol that is not a hex
// digit, and every boundary value uses its first symbol, so a text value can never be classified as
// hex. Symbol order is the order of the counts below.
const (
	hexAlpha   = "0123456789abcdef"
	alnumAlpha = "ghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdef"
	b64Alpha   = "+/" + alnumAlpha
)

// fromCounts builds a value with counts[i] copies of alphabet[i]. Shannon entropy depends only on
// the counts, so a count vector IS a fixed value of known entropy, and it carries no secret-shaped
// literal into the source.
func fromCounts(t *testing.T, alphabet string, n int, counts []int) string {
	t.Helper()
	if len(counts) > len(alphabet) {
		t.Fatalf("%d symbols from a %d-symbol alphabet", len(counts), len(alphabet))
	}
	var b strings.Builder
	for i, c := range counts {
		b.WriteString(strings.Repeat(alphabet[i:i+1], c))
	}
	if b.Len() != n {
		t.Fatalf("counts %v sum to %d, want %d", counts, b.Len(), n)
	}
	return b.String()
}

// boundaryCounts holds, per class and length, one value just above the floor and one just below it.
// Found 2026-10-02 by random search over count vectors (400,000 per cell) for the closest entropy on
// each side; every gap is under 0.05 bits, and asserted to stay so. A floor moved by more than its
// gap flips one side of the pair.
var boundaryCounts = []struct {
	hex          bool
	n            int
	above, below []int
}{
	{true, 16, []int{9, 5, 2}, []int{10, 3, 3}},
	{true, 18, []int{11, 4, 2, 1}, []int{9, 5, 4}},
	{true, 20, []int{12, 4, 2, 1, 1}, []int{10, 6, 3, 1}},
	{true, 22, []int{12, 4, 3, 2, 1}, []int{8, 8, 4, 2}},
	{true, 24, []int{10, 8, 3, 1, 1, 1}, []int{11, 4, 4, 4, 1}},
	{true, 26, []int{9, 6, 6, 4, 1}, []int{13, 4, 3, 3, 2, 1}},
	{true, 28, []int{12, 5, 5, 3, 2, 1}, []int{8, 8, 6, 3, 3}},
	{true, 30, []int{9, 8, 7, 2, 2, 2}, []int{8, 6, 6, 5, 5}},
	{true, 32, []int{10, 10, 4, 3, 2, 2, 1}, []int{11, 7, 4, 4, 3, 3}},
	{true, 34, []int{14, 5, 4, 4, 3, 2, 2}, []int{9, 8, 7, 4, 3, 3}},
	{true, 36, []int{10, 6, 6, 6, 5, 3}, []int{13, 7, 5, 4, 3, 2, 2}},
	{true, 64, []int{19, 11, 10, 8, 8, 8}, []int{15, 13, 12, 12, 7, 5}},
	{true, 200, []int{51, 40, 38, 31, 23, 17}, []int{55, 44, 27, 25, 25, 24}},
	{false, 16, []int{6, 5, 1, 1, 1, 1, 1}, []int{5, 5, 2, 2, 1, 1}},
	{false, 18, []int{8, 2, 2, 2, 1, 1, 1, 1}, []int{6, 4, 3, 2, 1, 1, 1}},
	{false, 20, []int{7, 3, 2, 2, 2, 2, 1, 1}, []int{9, 2, 2, 1, 1, 1, 1, 1, 1, 1}},
	{false, 22, []int{5, 3, 3, 3, 3, 3, 1, 1}, []int{4, 4, 4, 3, 3, 2, 1, 1}},
	{false, 24, []int{7, 5, 3, 2, 1, 1, 1, 1, 1, 1, 1}, []int{4, 4, 4, 3, 3, 3, 1, 1, 1}},
	{false, 26, []int{5, 5, 5, 3, 2, 1, 1, 1, 1, 1, 1}, []int{7, 4, 4, 2, 2, 2, 1, 1, 1, 1, 1}},
	{false, 28, []int{5, 3, 3, 3, 3, 3, 3, 3, 1, 1}, []int{4, 4, 4, 3, 3, 3, 3, 2, 1, 1}},
	{false, 30, []int{5, 5, 5, 5, 3, 1, 1, 1, 1, 1, 1, 1}, []int{5, 5, 4, 4, 4, 2, 2, 1, 1, 1, 1}},
	{false, 32, []int{5, 5, 5, 4, 3, 2, 2, 2, 2, 2}, []int{5, 4, 4, 4, 4, 4, 2, 2, 2, 1}},
	{false, 34, []int{6, 6, 5, 4, 3, 3, 2, 2, 1, 1, 1}, []int{7, 6, 4, 3, 3, 3, 3, 2, 1, 1, 1}},
	{false, 36, []int{7, 7, 5, 4, 4, 2, 2, 1, 1, 1, 1, 1}, []int{7, 6, 4, 3, 3, 3, 3, 3, 2, 2}},
	{false, 64, []int{9, 9, 8, 8, 7, 7, 5, 5, 5, 1}, []int{10, 9, 9, 7, 7, 7, 5, 5, 3, 2}},
	{false, 200, []int{30, 28, 27, 25, 23, 17, 16, 16, 13, 5}, []int{24, 24, 22, 22, 22, 22, 22, 22, 20}},
}

func pinnedFloor(t *testing.T, hex bool, n int) float64 {
	t.Helper()
	for _, p := range pinnedFloors {
		if p.n == n {
			if hex {
				return p.hex
			}
			return p.text
		}
	}
	t.Fatalf("no pinned floor for length %d", n)
	return 0
}

// Behaviour at the floor, through the scanner's own entry point: the value just above is reported,
// the value just below is not. Each value is first checked against the PINNED floor, never against
// floorAt, so a mutated floor cannot move the fixture along with it.
func TestFloorBoundaryValues(t *testing.T) {
	const maxGap = 0.05
	for _, c := range boundaryCounts {
		floor := pinnedFloor(t, c.hex, c.n)
		alphabets := map[string]string{"hex": hexAlpha}
		if !c.hex {
			alphabets = map[string]string{"alnum": alnumAlpha, "base64": b64Alpha}
		}
		for name, alpha := range alphabets {
			for _, side := range []struct {
				counts []int
				detect bool
			}{{c.above, true}, {c.below, false}} {
				v := fromCounts(t, alpha, c.n, side.counts)
				if hexRE.MatchString(v) != c.hex {
					t.Fatalf("%s/%d: fixture %q classified hex=%v, want %v", name, c.n, v, !c.hex, c.hex)
				}
				e := entropy(v)
				if gap := e - floor; side.detect && (gap <= 0 || gap > maxGap) || !side.detect && (gap >= 0 || -gap > maxGap) {
					t.Fatalf("%s/%d: fixture entropy %.6f is not within %.2f on the %v side of pinned floor %.4f",
						name, c.n, e, maxGap, side.detect, floor)
				}
				got := matchLine("SERVICE_TOKEN=" + v)
				if side.detect && (len(got) != 1 || got[0] != RuleAssignedKey) {
					t.Errorf("%s/%d: %.4f bits >= floor %.4f, got %v, want [%s]", name, c.n, e, floor, got, RuleAssignedKey)
				}
				if !side.detect && got != nil {
					t.Errorf("%s/%d: %.4f bits < floor %.4f, got %v, want no finding", name, c.n, e, floor, got)
				}
			}
		}
	}
}

// The floor is inclusive: "reported when its entropy is at or above the floor". Each value below has
// entropy EXACTLY equal to its floor in float64, because every probability is a power of two (so
// math.Log2 is exact and the sum is exact) and every floor here is reached either at a knot by an
// exact interpolation (b-a is exact by Sterbenz, and a+(b-a) == b) or past the last knot. The
// equality is asserted before the behaviour, so the case cannot pass vacuously if either side drifts.
func TestFloorExactEqualityIsReported(t *testing.T) {
	cases := []struct {
		name     string
		alphabet string
		n        int
		counts   []int
		knots    []entropyKnot
		bits     float64
	}{
		{"hex@24, 4 symbols x 6 (2.0 bits)", hexAlpha, 24, []int{6, 6, 6, 6}, hexFloor, 2.0},
		{"hex@40 past last knot (2.5 bits)", hexAlpha, 40, []int{10, 10, 5, 5, 5, 5}, hexFloor, 2.5},
		{"hex@64 past last knot (2.5 bits)", hexAlpha, 64, []int{16, 16, 8, 8, 8, 8}, hexFloor, 2.5},
		{"alnum@24, 8 symbols x 3 (3.0 bits)", alnumAlpha, 24, []int{3, 3, 3, 3, 3, 3, 3, 3}, textFloor, 3.0},
		{"base64@24, 8 symbols x 3 (3.0 bits)", b64Alpha, 24, []int{3, 3, 3, 3, 3, 3, 3, 3}, textFloor, 3.0},
	}
	for _, c := range cases {
		v := fromCounts(t, c.alphabet, c.n, c.counts)
		e, f := entropy(v), floorAt(c.knots, c.n)
		if e != c.bits || f != c.bits {
			t.Errorf("%s: entropy %v, floor %v, want both exactly %v", c.name, e, f, c.bits)
			continue
		}
		if !highEntropy(v) {
			t.Errorf("%s: entropy == floor, highEntropy = false; the floor is inclusive", c.name)
		}
		if got := matchLine("SERVICE_TOKEN=" + v); len(got) != 1 || got[0] != RuleAssignedKey {
			t.Errorf("%s: matchLine = %v, want [%s]", c.name, got, RuleAssignedKey)
		}
	}
}
