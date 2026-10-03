package launcher

import (
	"crypto/rand"
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

// The receipt log (B1-08 r6) is the launch count's only source. One line per record,
// "<hex sha256(previous hash || payload)> <payload>\n", the payload a JSON logRecord. The first
// record is the genesis, unique by a random nonce; its hash is the genesis hash the founder pins
// (Grant.ReceiptGenesis), so a log deleted and re-created never matches the pin. path+".head"
// holds "<records> <last hash>", which is how a cut at a record boundary is seen. Every Since and
// Append re-verifies the whole log against the pin and the head; any mismatch is ErrState.
type logGenesis struct {
	Nonce string        `json:"nonce"`
	Prior string        `json:"prior,omitempty"` // the genesis a founder reset replaced
	Reset *FounderReset `json:"reset,omitempty"`
}

type logRecord struct {
	Genesis *logGenesis `json:"genesis,omitempty"`
	Receipt *Receipt    `json:"receipt,omitempty"`
}

type fileLog struct {
	mu      sync.Mutex
	path    string
	genesis string // the pin
}

// CreateReceiptLog creates a machine's receipt log at path and returns its genesis hash, which
// the founder pins as Grant.ReceiptGenesis. It is refused while pinned is non-empty (a prior log,
// and so prior receipts, exist for this machine), and refuses an existing path. Each genesis is
// unique, so a log re-created after a deletion never matches the pin.
func CreateReceiptLog(path, pinned string) (string, error) {
	if pinned != "" {
		return "", fmt.Errorf("%w: a receipt log is already pinned (%s); only a founder reset replaces it", ErrState, pinned)
	}
	f, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
	if err != nil {
		return "", fmt.Errorf("%w: create %s: %v", ErrState, path, err)
	}
	if err := f.Close(); err != nil {
		return "", fmt.Errorf("%w: %v", ErrState, err)
	}
	return writeGenesis(path, logGenesis{})
}

// FounderResetReceiptLog replaces the log at path, explicitly: prior is the currently pinned
// genesis, r names who and why. The new genesis records r and prior and is returned for the
// founder to pin. The count is never reset to 0: the hour after r.At counts as full.
func FounderResetReceiptLog(path, prior string, r FounderReset) (string, error) {
	if prior == "" || r.By == "" || r.Reason == "" || r.At.IsZero() {
		return "", fmt.Errorf("%w: a founder reset needs the prior pin, By, Reason and At", ErrState)
	}
	return writeGenesis(path, logGenesis{Prior: prior, Reset: &r})
}

// OpenReceiptLog opens the log at path; it refuses one whose genesis hash is not genesis (the
// pin), a missing one, and one that does not verify. Since and Append re-verify every call.
func OpenReceiptLog(path, genesis string) (ReceiptSink, error) {
	l := &fileLog{path: path, genesis: genesis}
	if _, _, err := l.read(); err != nil {
		return nil, err
	}
	return l, nil
}

func writeGenesis(path string, g logGenesis) (string, error) {
	nonce := make([]byte, 16)
	_, err := rand.Read(nonce)
	g.Nonce = hex.EncodeToString(nonce)
	var line, hash string
	if err == nil {
		line, hash, err = encode("", logRecord{Genesis: &g})
	}
	if err == nil {
		err = replace(path, line)
	}
	if err == nil {
		err = replace(path+".head", fmt.Sprintf("1 %s\n", hash))
	}
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrState, err)
	}
	return "sha256:" + hash, nil
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

// read verifies the whole log, pinned genesis to head, and returns its records and last hash.
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
		if (r.Genesis != nil) != (i == 0) || r.Genesis == nil && r.Receipt == nil {
			return bad(fmt.Sprintf("record %d is out of place", i+1))
		}
		if i == 0 && "sha256:"+h != l.genesis {
			return bad("genesis is not the pinned one")
		}
		recs, prev = append(recs, r), h
	}
	if string(head) != fmt.Sprintf("%d %s\n", len(recs), prev) {
		return bad("does not match its head")
	}
	return recs, prev, nil
}

// Genesis (B1-08 r7) is the pinned genesis this log was opened against (GenesisReporter).
func (l *fileLog) Genesis() string { return l.genesis }

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

// Since returns the receipts after t. A window reaching before a founder reset is unknown
// history, so it fails closed rather than counting it as empty.
func (l *fileLog) Since(t time.Time) ([]Receipt, error) {
	l.mu.Lock()
	defer l.mu.Unlock()
	recs, _, err := l.read()
	if err != nil {
		return nil, err
	}
	if r := recs[0].Genesis.Reset; r != nil && t.Before(r.At) {
		return nil, fmt.Errorf("%w: history before the founder reset at %s is unknown", ErrState, r.At.Format(time.RFC3339))
	}
	var out []Receipt
	for _, r := range recs[1:] {
		if r.Receipt.At.After(t) {
			out = append(out, *r.Receipt)
		}
	}
	return out, nil
}
