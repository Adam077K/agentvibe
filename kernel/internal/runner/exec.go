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
// how the Runner learns, through the frozen launcher.Exec signature, whom to record.
func withStart(ctx context.Context, f func(pid int)) context.Context {
	return context.WithValue(ctx, startKey{}, f)
}

var digestRe = regexp.MustCompile(`^sha256:[0-9a-f]{64}$`)

const pollEvery = 50 * time.Millisecond // how often a running tree is scanned for descendants

type execer struct {
	uid   int
	gids  []int
	roots []string
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
	return &execer{uid: cfg.WorkerUID, gids: slices.Clone(cfg.WorkerGIDs), roots: slices.Clone(cfg.WorkerRoots)}, nil
}

// inPlace reports whether real (symlinks resolved) may be exec'd where it is: it and every ancestor lie
// outside all worker roots and are not writable by the worker, by owner, group and other mode bits, and
// by ACL, failing closed. Anything else is copied, and the copy's bytes are the bytes that were hashed.
func (e *execer) inPlace(real string) bool {
	for _, r := range e.roots {
		for _, root := range []string{r, resolved(r)} {
			if real == root || strings.HasPrefix(real, root+"/") {
				return false
			}
		}
	}
	var chain []string
	for p := real; ; p = filepath.Dir(p) {
		var st syscall.Stat_t
		if err := syscall.Stat(p, &st); err != nil {
			return false
		}
		m := st.Mode & 0o777
		if int(st.Uid) == e.uid || m&0o002 != 0 || (m&0o020 != 0 && slices.Contains(e.gids, int(st.Gid))) {
			return false
		}
		chain = append(chain, p)
		if p == "/" {
			break
		}
	}
	return !aclWritable(chain)
}

func resolved(p string) string {
	if r, err := filepath.EvalSymlinks(p); err == nil {
		return r
	}
	return p
}

// prepare returns the path to exec for path, after checking its bytes against digest, and a cleanup.
func (e *execer) prepare(path, digest string) (string, func(), error) {
	real, err := filepath.EvalSymlinks(path)
	if err != nil {
		return "", nil, err
	}
	src, err := os.Open(real)
	if err != nil {
		return "", nil, err
	}
	defer src.Close()
	h := sha256.New()
	if e.inPlace(real) { // not writable by the worker: hashing the path and exec'ing it cannot be swapped
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
	if f, ok := ctx.Value(startKey{}).(func(int)); ok {
		f(pid)
	}
	tr := newTree(pid, nil)

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
	waitCh := make(chan error, 1)
	go func() { waitCh <- cmd.Wait() }()

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
	tr.kill() // the leader's end does not end its tree
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
		<-readDone
	}
	return result
}
