package runner

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"hash"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"syscall"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/launcher"
)

type (
	limitsKey struct{}
	startKey  struct{}
)

// WithLimits returns ctx carrying l for Exec.Run.
func WithLimits(ctx context.Context, l Limits) context.Context {
	return context.WithValue(ctx, limitsKey{}, l)
}

// withStart returns ctx carrying f, which Exec.Run calls with the leader's pid as soon as it exists:
// how the Runner learns, through the frozen launcher.Exec signature, whom to record. An error from f
// kills the worker's tree and fails the Run: a worker that cannot be recorded must not outlive the daemon.
func withStart(ctx context.Context, f func(pid int) error) context.Context {
	return context.WithValue(ctx, startKey{}, f)
}

var digestRe = regexp.MustCompile(`^sha256:[0-9a-f]{64}$`)

// Seams for the regression tests: nothing else makes a process-table lookup fail, or a kill go
// unconfirmed, on demand.
var (
	lookup   = lookupProc
	killTree = func(t *tree) bool { return t.kill() }
)

var errSurvivors = errors.New("runner: part of the worker tree survived SIGKILL")

const pollEvery = 50 * time.Millisecond // how often a running tree is scanned for descendants

type execer struct {
	uid   int
	gids  []int
	roots []string
	acl   func(path string) (bool, error) // ExecConfig.ACLWritable; nil: the platform's reader
}

// aclWritable asks the seam about each path in turn, or the platform reader about all of them: true
// when one is writable or unreadable (an error is writable).
func (e *execer) aclWritable(paths []string) bool {
	if e.acl == nil {
		return aclWritable(paths)
	}
	for _, p := range paths {
		if w, err := e.acl(p); w || err != nil {
			return true
		}
	}
	return false
}

func (cfg ExecConfig) valid() bool {
	if cfg.WorkerUID <= 0 || len(cfg.WorkerRoots) == 0 {
		return false
	}
	for _, r := range cfg.WorkerRoots {
		if !filepath.IsAbs(r) || filepath.Clean(r) != r || r == "/" {
			return false
		}
	}
	return true
}

// NewExec returns the real launcher.Exec, or ErrSpec for a malformed cfg. Run executes only bytes that
// hash to digest, on both paths (see inPlace). The worker runs in a new process group, with exactly
// env as its environment, and Run returns only after the group and every descendant are dead, however
// the leader ended. The 90% SIGINT goes to the whole group, the SIGKILL at 100% to the group and every
// descendant found. ctx cancellation kills the tree and returns ctx.Err(). A worker that exits
// non-zero, or dies by a signal no backstop and no ctx sent, is reported as its *exec.ExitError.
func NewExec(cfg ExecConfig) (launcher.Exec, error) {
	if !cfg.valid() {
		return nil, fmt.Errorf("%w: ExecConfig needs a non-root WorkerUID and clean absolute WorkerRoots other than /", ErrSpec)
	}
	return &execer{uid: cfg.WorkerUID, gids: slices.Clone(cfg.WorkerGIDs), roots: slices.Clone(cfg.WorkerRoots), acl: cfg.ACLWritable}, nil
}

// writable reports whether p or any ancestor is writable by the worker: by owner, group and other mode
// bits, then by ACL, failing closed. It also returns p's own stat. With sticky set, a sticky ancestor
// (/tmp) does not count for its group and other bits: only an entry's owner may replace it there, and
// the copy's directory is the daemon's own. The check of a binary run in place never sets it.
func (e *execer) writable(p string, sticky bool, acl func([]string) bool) (bool, syscall.Stat_t) {
	var self syscall.Stat_t
	var chain []string
	for q := p; ; q = filepath.Dir(q) {
		var st syscall.Stat_t
		if err := syscall.Stat(q, &st); err != nil {
			return true, self
		}
		if q == p {
			self = st
		}
		m := st.Mode & 0o777
		if sticky && q != p && st.Mode&syscall.S_ISVTX != 0 {
			m &^= 0o022
		}
		if int(st.Uid) == e.uid || m&0o002 != 0 || (m&0o020 != 0 && slices.Contains(e.gids, int(st.Gid))) {
			return true, self
		}
		chain = append(chain, q)
		if q == "/" {
			break
		}
	}
	return acl(chain), self
}

// inRoot reports whether p lies in a worker root, as given or with symlinks resolved.
func (e *execer) inRoot(p string) bool {
	for _, r := range e.roots {
		for _, root := range []string{r, resolved(r)} {
			if p == root || strings.HasPrefix(p, root+"/") {
				return true
			}
		}
	}
	return false
}

func resolved(p string) string {
	if r, err := filepath.EvalSymlinks(p); err == nil {
		return r
	}
	return p
}

// prepare returns the path to exec for path, after checking its bytes against digest, and a cleanup. It
// execs in place only when the resolved binary and every ancestor lie outside all worker roots and are
// not worker-writable, and the file opened is the file checked; else it copies the bytes it hashed.
func (e *execer) prepare(path, digest string) (string, func(), error) {
	real, err := filepath.EvalSymlinks(path)
	if err != nil {
		return "", nil, err
	}
	w, checked := e.writable(real, false, e.aclWritable)
	inPlace := !w && !e.inRoot(real)
	src, err := os.Open(real)
	if err != nil {
		return "", nil, err
	}
	defer src.Close()
	if fi, err := src.Stat(); inPlace && (err != nil || fi.Sys().(*syscall.Stat_t).Dev != checked.Dev || fi.Sys().(*syscall.Stat_t).Ino != checked.Ino) {
		inPlace = false // swapped between the check and the open: the check judged another file
	}
	h := sha256.New()
	if inPlace { // not writable by the worker: hashing the path and exec'ing it cannot be swapped
		if _, err := io.Copy(h, src); err != nil {
			return "", nil, err
		}
		if err := match(h, digest); err != nil {
			return "", nil, err
		}
		return real, func() {}, nil
	}
	dir, err := os.MkdirTemp("", "avk-exec-") // 0700: private to the Kernel
	if err != nil {
		return "", nil, err
	}
	cleanup := func() { os.RemoveAll(dir) }
	// A worker that is not the daemon's uid must not be able to write the copy's directory or replace
	// it (a writable ancestor, or an inherited ACL; read by the platform's reader, never the seam). The
	// same uid could write anything the daemon can.
	if d := resolved(dir); e.uid != os.Getuid() {
		if dw, _ := e.writable(d, true, aclWritable); dw || e.inRoot(d) {
			cleanup()
			return "", nil, fmt.Errorf("runner: private copy dir %s is writable by the worker", d)
		}
	}
	dst, err := os.OpenFile(filepath.Join(dir, filepath.Base(real)), os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o700)
	if err == nil {
		_, err = io.Copy(io.MultiWriter(h, dst), src) // one read: the bytes hashed are the bytes copied
		if cerr := dst.Close(); err == nil {
			err = cerr
		}
	}
	if err == nil {
		err = match(h, digest)
	}
	if err != nil {
		cleanup()
		return "", nil, err
	}
	return dst.Name(), cleanup, nil
}

func match(h hash.Hash, digest string) error {
	if got := "sha256:" + hex.EncodeToString(h.Sum(nil)); got != digest {
		return fmt.Errorf("%w: bytes hash to %s, pinned %s", ErrDigest, got, digest)
	}
	return nil
}

func (e *execer) Run(ctx context.Context, path, digest string, argv, env []string) error {
	lim, ok := ctx.Value(limitsKey{}).(Limits)
	if !ok || env == nil || lim.Wall <= 0 || lim.Idle <= 0 {
		return fmt.Errorf("%w: need Limits on ctx, a non-nil env, and positive Wall and Idle", ErrSpec)
	}
	if !digestRe.MatchString(digest) {
		return fmt.Errorf("%w: %q is not sha256:<64 lowercase hex>", ErrDigest, digest)
	}
	if err := ctx.Err(); err != nil {
		return err
	}
	bin, cleanup, err := e.prepare(path, digest)
	if err != nil {
		return err
	}
	defer cleanup()
	out := lim.Stdout
	if out == nil {
		out = io.Discard
	}
	pr, pw, err := os.Pipe()
	if err != nil {
		return err
	}
	defer pr.Close()
	var cmd *exec.Cmd
	for try := 0; ; try++ { // a concurrent fork can still hold the copy's write fd (ETXTBSY): it clears at once
		cmd = exec.Command(bin, argv...)
		cmd.Env, cmd.Dir, cmd.Stdout = env, lim.Dir, pw
		cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
		if err = cmd.Start(); !errors.Is(err, syscall.ETXTBSY) || try == 20 {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	pw.Close()
	if err != nil {
		return err
	}
	pid := cmd.Process.Pid
	tr := newTree(pid, nil)
	p, lerr := lookup(pid) // before the Wait goroutine: until then even a leader that has exited is still listed
	if lerr == nil {
		tr.known[pid] = p // a leader that leaves its group is still found, by its identity
	}
	waitCh := make(chan error, 1)
	go func() { waitCh <- cmd.Wait() }()
	// abort kills the worker, group and tree, waits for the leader, and fails the Run: used when the
	// worker cannot be tracked or recorded, because one that is not must not be left running.
	abort := func(cause error) error {
		cmd.Process.Signal(syscall.SIGKILL) // never signals a pid already reaped
		syscall.Kill(-pid, syscall.SIGKILL)
		dead := killTree(tr)
		select {
		case <-waitCh:
		case <-time.After(5 * time.Second):
		}
		if !dead {
			cause = errors.Join(cause, errSurvivors)
		}
		return fmt.Errorf("runner: worker %d: %w; killed", pid, cause)
	}
	if lerr != nil { // unseeded, a leader that left its group would outlive every kill: fail closed
		return abort(fmt.Errorf("cannot identify the leader: %w", lerr))
	}
	if f, ok := ctx.Value(startKey{}).(func(int) error); ok {
		if err := f(pid); err != nil {
			return abort(fmt.Errorf("cannot record it: %w", err))
		}
	}

	activity := make(chan struct{}, 1)
	readDone := make(chan struct{})
	go func() {
		defer close(readDone)
		buf := make([]byte, 32<<10)
		for {
			n, err := pr.Read(buf)
			if n > 0 {
				out.Write(buf[:n])
				select {
				case activity <- struct{}{}:
				default:
				}
			}
			if err != nil {
				return
			}
		}
	}()

	sigint, sigkill, idle := time.NewTimer(lim.Wall/10*9), time.NewTimer(lim.Wall), time.NewTimer(lim.Idle)
	poll := time.NewTicker(pollEvery)
	defer func() { sigint.Stop(); sigkill.Stop(); idle.Stop(); poll.Stop() }()
	var result error
	waited, intSent := false, false
loop:
	for {
		select {
		case werr := <-waitCh:
			waited, result = true, werr
			if intSent {
				result = ErrWall // it ended at the SIGINT stage: the wall ended it
			}
			break loop
		case <-ctx.Done():
			result = ctx.Err()
			break loop
		case <-sigint.C:
			tr.scan() // before the SIGINT: a member that dies of it orphans its setsid child beyond any later walk
			syscall.Kill(-pid, syscall.SIGINT)
			intSent = true
		case <-sigkill.C:
			result = ErrWall
			break loop
		case <-idle.C:
			result = ErrIdle
			break loop
		case <-activity:
			idle.Reset(lim.Idle)
		case <-poll.C:
			tr.scan()
		}
	}
	if !killTree(tr) { // the leader's end does not end its tree
		result = errors.Join(result, errSurvivors)
	}
	if !waited {
		select {
		case <-waitCh:
		case <-time.After(5 * time.Second):
		}
	}
	select {
	case <-readDone: // EOF: every holder of the pipe is dead
	case <-time.After(time.Second): // an escapee outside the tree holds it (a known gap until B1-10)
		pr.Close()
		select {
		case <-readDone:
		case <-time.After(time.Second): // a Stdout that never returns: Run does not wait on it, and it keeps the reader
		}
	}
	return result
}
