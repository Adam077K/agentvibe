package launcher

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"
	"sync"
	"time"
)

// The receipt log is one line per record, "<hex sha256(previous hash || payload)> <payload>\n",
// the payload a JSON logRecord. The first record is the genesis: created, or re-established at a
// time before which the history is unknown. path+".head" holds "<records> <last hash>", which is
// how a cut at a record boundary, or a deleted tail, is seen. Any mismatch is ErrState.
type logRecord struct {
	Created       bool       `json:"created,omitempty"`
	Reestablished *time.Time `json:"reestablished,omitempty"`
	Receipt       *Receipt   `json:"receipt,omitempty"`
}

type fileLog struct {
	mu   sync.Mutex
	path string
}

// CreateReceiptLog creates an empty receipt log at path; it refuses one that exists.
func CreateReceiptLog(path string) error {
	f, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
	if err != nil {
		return fmt.Errorf("%w: create %s: %v", ErrState, path, err)
	}
	if err := f.Close(); err != nil {
		return fmt.Errorf("%w: %v", ErrState, err)
	}
	return writeGenesis(path, logRecord{Created: true})
}

// ReestablishReceiptLog explicitly replaces a broken (or absent) log at path with one whose
// history before at is unknown and counts as full for the trailing hour.
func ReestablishReceiptLog(path string, at time.Time) error {
	return writeGenesis(path, logRecord{Reestablished: &at})
}

// OpenReceiptLog opens the receipt log at path; it refuses one that was never created, or that
// does not verify.
func OpenReceiptLog(path string) (ReceiptSink, error) {
	l := &fileLog{path: path}
	if _, _, err := l.read(); err != nil {
		return nil, err
	}
	return l, nil
}

func writeGenesis(path string, g logRecord) error {
	line, hash, err := encode("", g)
	if err == nil {
		err = replace(path, line)
	}
	if err == nil {
		err = replace(path+".head", fmt.Sprintf("1 %s\n", hash))
	}
	if err != nil {
		return fmt.Errorf("%w: %v", ErrState, err)
	}
	return nil
}

// replace writes data to path atomically: a whole new file or the old one.
func replace(path, data string) error {
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, []byte(data), 0o600); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

func chain(prev string, payload []byte) string {
	s := sha256.Sum256(append([]byte(prev), payload...))
	return hex.EncodeToString(s[:])
}

func encode(prev string, r logRecord) (line, hash string, err error) {
	b, err := json.Marshal(r)
	if err != nil {
		return "", "", err
	}
	hash = chain(prev, b)
	return hash + " " + string(b) + "\n", hash, nil
}

// read verifies the whole log, genesis to head, and returns its records and last hash.
func (l *fileLog) read() ([]logRecord, string, error) {
	bad := func(why string) ([]logRecord, string, error) {
		return nil, "", fmt.Errorf("%w: receipt log %s: %s", ErrState, l.path, why)
	}
	data, err := os.ReadFile(l.path)
	if err != nil {
		return bad(err.Error())
	}
	head, err := os.ReadFile(l.path + ".head")
	if err != nil {
		return bad(err.Error())
	}
	if len(data) == 0 || data[len(data)-1] != '\n' {
		return bad("empty or cut mid-record")
	}
	var recs []logRecord
	prev := ""
	for i, line := range strings.Split(string(data[:len(data)-1]), "\n") {
		h, payload, ok := strings.Cut(line, " ")
		var r logRecord
		if !ok || h != chain(prev, []byte(payload)) || json.Unmarshal([]byte(payload), &r) != nil {
			return bad(fmt.Sprintf("record %d does not verify", i+1))
		}
		genesis := r.Created || r.Reestablished != nil
		if genesis != (i == 0) || !genesis && r.Receipt == nil {
			return bad(fmt.Sprintf("record %d is out of place", i+1))
		}
		recs, prev = append(recs, r), h
	}
	if string(head) != fmt.Sprintf("%d %s\n", len(recs), prev) {
		return bad("does not match its head")
	}
	return recs, prev, nil
}

// Append verifies the log, then appends r and advances the head.
func (l *fileLog) Append(r Receipt) error {
	l.mu.Lock()
	defer l.mu.Unlock()
	recs, prev, err := l.read()
	if err != nil {
		return err
	}
	line, hash, err := encode(prev, logRecord{Receipt: &r})
	if err != nil {
		return fmt.Errorf("%w: %v", ErrState, err)
	}
	f, err := os.OpenFile(l.path, os.O_APPEND|os.O_WRONLY, 0)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrState, err)
	}
	_, err = f.WriteString(line)
	if err = errors.Join(err, f.Sync(), f.Close()); err == nil {
		err = replace(l.path+".head", fmt.Sprintf("%d %s\n", len(recs)+1, hash))
	}
	if err != nil {
		return fmt.Errorf("%w: %v", ErrState, err)
	}
	return nil
}

// Since returns the receipts after t. A window that reaches before a re-establishment is
// unknown history, so it fails closed rather than counting it as empty.
func (l *fileLog) Since(t time.Time) ([]Receipt, error) {
	l.mu.Lock()
	defer l.mu.Unlock()
	recs, _, err := l.read()
	if err != nil {
		return nil, err
	}
	if g := recs[0].Reestablished; g != nil && t.Before(*g) {
		return nil, fmt.Errorf("%w: history before %s is unknown", ErrState, g.Format(time.RFC3339))
	}
	var out []Receipt
	for _, r := range recs[1:] {
		if r.Receipt.At.After(t) {
			out = append(out, *r.Receipt)
		}
	}
	return out, nil
}
