package socket

import (
	"bufio"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"net"
	"os"
	"sync"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

// MaxLine bounds one request line, without its '\n'. A longer line is not a command the Kernel can
// judge: the connection is closed without an answer, and nothing is journaled for it.
const MaxLine = 1 << 20

type server struct {
	journal journal.Journal
	backend Backend
	l       *net.UnixListener
	sock    string
	sockFI  fs.FileInfo

	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup

	mu      sync.Mutex
	closing bool
	conns   map[net.Conn]struct{}

	refuseMu sync.Mutex // serialises the refusal stream's head read and its append

	closeOnce sync.Once
	closeErr  error
}

func serve(ctx context.Context, cfg Config) (Server, error) {
	if cfg.Backend == nil {
		return nil, errors.New("socket: Config.Backend is nil")
	}
	if cfg.SocketPath == "" || cfg.JournalPath == "" {
		return nil, errors.New("socket: Config.SocketPath and Config.JournalPath are required")
	}
	jpath, err := resolveJournal(cfg.JournalPath)
	if err != nil {
		return nil, fmt.Errorf("socket: journal %s: %w", cfg.JournalPath, err)
	}
	if err := createJournal(jpath); err != nil {
		return nil, fmt.Errorf("socket: journal %s: %w", jpath, err)
	}
	if err := narrowJournal(jpath); err != nil {
		return nil, fmt.Errorf("socket: journal cannot be held at %#o: %w", journalMode, err)
	}
	j, err := journal.Open(jpath)
	if err != nil {
		return nil, fmt.Errorf("socket: %w", err)
	}
	// SQLite has created -wal and -shm by now, from the database's mode; hold them to it anyway.
	if err := narrowJournal(jpath); err != nil {
		j.Close()
		return nil, fmt.Errorf("socket: journal cannot be held at %#o: %w", journalMode, err)
	}
	l, fi, err := listen(cfg.SocketPath, cfg.UserlandGID)
	if err != nil {
		j.Close()
		return nil, fmt.Errorf("socket: %s: %w", cfg.SocketPath, err)
	}
	s := &server{journal: j, backend: cfg.Backend, l: l, sock: cfg.SocketPath, sockFI: fi,
		conns: map[net.Conn]struct{}{}}
	s.ctx, s.cancel = context.WithCancel(ctx)
	s.wg.Add(1)
	go s.accept()
	go func() {
		<-s.ctx.Done() // the caller's context ending stops the server, as Close does
		s.Close()
	}()
	return s, nil
}

func (s *server) accept() {
	defer s.wg.Done()
	backoff := 5 * time.Millisecond
	for {
		c, err := s.l.Accept()
		if err != nil {
			if s.isClosing() || errors.Is(err, net.ErrClosed) {
				return
			}
			time.Sleep(backoff) // e.g. EMFILE: wait for a descriptor rather than spin
			backoff = min(2*backoff, time.Second)
			continue
		}
		backoff = 5 * time.Millisecond
		s.mu.Lock()
		if s.closing {
			s.mu.Unlock()
			c.Close()
			return
		}
		s.conns[c] = struct{}{}
		s.wg.Add(1)
		s.mu.Unlock()
		go s.handleConn(c)
	}
}

func (s *server) isClosing() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.closing
}

// handleConn answers each line with one Response, in order, until the client goes away, a line is
// too long, or a refusal cannot be journaled.
func (s *server) handleConn(c net.Conn) {
	defer s.wg.Done()
	defer func() {
		s.mu.Lock()
		delete(s.conns, c)
		s.mu.Unlock()
		c.Close()
	}()
	r := bufio.NewReader(c)
	for {
		line, err := readLine(r)
		if err != nil {
			return
		}
		resp, ok := s.handle(line)
		if !ok {
			return
		}
		out, err := json.Marshal(resp)
		if err != nil {
			return
		}
		if _, err := c.Write(append(out, '\n')); err != nil {
			return
		}
	}
}

var errLineTooLong = errors.New("socket: line exceeds MaxLine")

// readLine returns the next line without its '\n'. A final line with no '\n' is not a request.
func readLine(r *bufio.Reader) ([]byte, error) {
	var line []byte
	for {
		chunk, err := r.ReadSlice('\n')
		if len(line)+len(chunk) > MaxLine+1 {
			return nil, errLineTooLong
		}
		line = append(line, chunk...)
		if err == nil {
			return line[:len(line)-1], nil
		}
		if !errors.Is(err, bufio.ErrBufferFull) {
			return nil, err
		}
	}
}

// handle judges one line. ok is false when the line was refused and the refusal could not be
// journaled: such a line is never answered as a refusal.
func (s *server) handle(line []byte) (resp Response, ok bool) {
	cmd, ref := parse(line)
	if ref != nil {
		if err := s.journalRefusal(line, ref); err != nil {
			return Response{}, false
		}
		return Response{OK: false, Reason: ref.reason}, true
	}
	result, err := s.dispatch(cmd)
	switch {
	case errors.Is(err, journal.ErrSeqConflict):
		return Response{OK: false, Reason: ReasonSeqConflict}, true
	case err != nil:
		return Response{OK: false, Reason: ReasonFailed}, true
	}
	return Response{OK: true, Result: result}, true
}

func (s *server) journalRefusal(line []byte, ref *refusal) error {
	sum := sha256.Sum256(line)
	data, err := json.Marshal(RefusalData{Reason: ref.reason, Cmd: ref.cmd,
		SHA256: hex.EncodeToString(sum[:]), Bytes: len(line)})
	if err != nil {
		return err
	}
	s.refuseMu.Lock()
	defer s.refuseMu.Unlock()
	head, _, err := s.journal.Head(s.ctx, RefusalStream)
	if err != nil {
		return err
	}
	_, err = s.journal.Append(s.ctx, journal.Proposal{
		Stream: RefusalStream, ExpectSeq: head, Type: RefusalType, Data: data})
	return err
}

// dispatch carries out a validated command: propose_event here, every other verb through Backend.
func (s *server) dispatch(c command) (result json.RawMessage, err error) {
	defer func() {
		if p := recover(); p != nil { // a Backend panic fails the command, not the Kernel
			result, err = nil, fmt.Errorf("socket: %s panicked: %v", c.cmd, p)
		}
	}()
	f := c.fields
	switch c.cmd {
	case "propose_event":
		return s.proposeEvent(c)
	case "request_leases":
		var res []string
		json.Unmarshal(f["resources"], &res)
		result, err = s.backend.RequestLeases(s.ctx, RequestLeases{Job: c.str("job"), Resources: res,
			Mode: c.str("mode"), Policy: c.str("policy")})
	case "propose_effect":
		result, err = s.backend.ProposeEffect(s.ctx, ProposeEffect{Verb: c.str("verb"),
			Target: compactJSON(f["target"]), BusinessRef: c.str("business_ref"),
			PayloadRef: c.str("payload_ref"), LeaseTokens: compactJSON(f["lease_tokens"])})
	case "admit_job":
		result, err = s.backend.AdmitJob(s.ctx, AdmitJob{Spec: compactJSON(f["spec"])})
	case "compile":
		result, err = s.backend.Compile(s.ctx, Compile{Action: compactJSON(f["action"])})
	case "renew", "release":
		token, _ := bigintOf(f["token"])
		lc := LeaseCommand{LeaseID: c.str("lease_id"), Token: token}
		if c.cmd == "renew" {
			result, err = s.backend.Renew(s.ctx, lc)
		} else {
			result, err = s.backend.Release(s.ctx, lc)
		}
	default:
		return nil, fmt.Errorf("socket: no route for %q", c.cmd) // parse admits only routed verbs
	}
	if err != nil {
		return nil, err
	}
	if len(result) > 0 && !json.Valid(result) {
		return nil, fmt.Errorf("socket: %s returned a result that is not JSON", c.cmd)
	}
	return compactJSON(result), nil
}

// proposeEvent appends the command's event: Data is {"label","data"[,"rationale"]}.
func (s *server) proposeEvent(c command) (json.RawMessage, error) {
	f := c.fields
	expect, _ := seqOf(f["expect_seq"])
	body := map[string]json.RawMessage{"label": compactJSON(f["label"]), "data": compactJSON(f["data"])}
	if r, ok := f["rationale"]; ok {
		body["rationale"] = compactJSON(r)
	}
	data, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	ev, err := s.journal.Append(s.ctx, journal.Proposal{
		Stream: c.str("stream"), ExpectSeq: expect, Type: c.str("type"), Data: data})
	if err != nil {
		return nil, err
	}
	return json.Marshal(map[string]any{"stream": ev.Stream, "seq": ev.Seq, "hash": ev.Hash})
}

// Close stops accepting, drops open connections once their in-flight request is done, removes the
// socket file if it is still the one Serve created, and closes the Journal.
func (s *server) Close() error {
	s.closeOnce.Do(func() {
		s.mu.Lock()
		s.closing = true
		for c := range s.conns {
			c.Close()
		}
		s.mu.Unlock()
		errs := []error{s.l.Close()}
		s.cancel()
		s.wg.Wait()
		if fi, err := os.Lstat(s.sock); err == nil && os.SameFile(fi, s.sockFI) {
			errs = append(errs, os.Remove(s.sock))
		}
		errs = append(errs, s.journal.Close())
		s.closeErr = errors.Join(errs...)
	})
	return s.closeErr
}
