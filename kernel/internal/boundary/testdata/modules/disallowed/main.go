// Fixture: a kernel importing a module that ALLOWED_MODULES does not name. Must fail.
package main

import "example.com/evil"

func main() { evil.Do() }
