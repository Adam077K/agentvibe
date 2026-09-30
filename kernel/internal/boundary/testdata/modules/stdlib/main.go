// Fixture: a kernel that uses only the standard library, Ed25519 included. Must pass.
package main

import (
	"crypto/ed25519"
	"database/sql"
	"fmt"
)

func main() {
	fmt.Println(ed25519.PublicKeySize, sql.Drivers())
}
