// Fixture: an import no go.mod requires, so go list cannot resolve it. The check must error, not pass.
package main

import "example.com/nowhere"

func main() { nowhere.Do() }
