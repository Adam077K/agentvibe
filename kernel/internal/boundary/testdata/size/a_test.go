// Fixture: a test file. Tests are not kernel code and must not count toward the budget.
package size

import "testing"

func TestN(t *testing.T) {
	if N != 5 {
		t.Fatal(N)
	}
}
