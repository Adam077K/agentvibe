package journal

import (
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"fmt"
	"hash"
	"strings"
)

// zeroHash is PrevHash of every stream's seq 1 (api.go, Event).
var zeroHash = strings.Repeat("0", 64)

func putU64(h hash.Hash, n uint64) {
	var b [8]byte
	binary.BigEndian.PutUint64(b[:], n)
	h.Write(b[:])
}

func putBytes(h hash.Hash, b []byte) {
	putU64(h, uint64(len(b)))
	h.Write(b)
}

// rawHash decodes a lowercase hex SHA-256; anything else is a broken chain, never a guess.
func rawHash(s string) ([]byte, error) {
	b, err := hex.DecodeString(s)
	if err != nil || len(b) != sha256.Size || hex.EncodeToString(b) != s {
		return nil, fmt.Errorf("%w: %q is not a lowercase hex SHA-256", ErrChainBroken, s)
	}
	return b, nil
}

// eventHash is the frozen v1 event formula in api.go. Do not edit it: a new field is a v2 tag.
func eventHash(stream string, seq uint64, typ string, data []byte, prevHash string) (string, error) {
	prev, err := rawHash(prevHash)
	if err != nil {
		return "", err
	}
	h := sha256.New()
	h.Write([]byte("avk.event.v1\n"))
	putBytes(h, []byte(stream))
	putU64(h, seq)
	putBytes(h, []byte(typ))
	putBytes(h, data)
	h.Write(prev)
	return hex.EncodeToString(h.Sum(nil)), nil
}

// head is one stream's last seq and hash, as StateHash consumes them.
type head struct {
	stream string
	seq    uint64
	hash   string
}

// stateHash is the frozen v1 state formula in api.go; heads must be in Streams() (sorted) order.
func stateHash(heads []head) (string, error) {
	h := sha256.New()
	h.Write([]byte("avk.state.v1\n"))
	for _, hd := range heads {
		raw, err := rawHash(hd.hash)
		if err != nil {
			return "", err
		}
		putBytes(h, []byte(hd.stream))
		putU64(h, hd.seq)
		h.Write(raw)
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}
