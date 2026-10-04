package runner

import (
	"fmt"
	"syscall"
	"time"
)

type procInfo struct {
	pid, ppid, pgid int
	start           time.Time // the kernel's start time: with the pid, the process's identity
	zombie          bool
}

// ProcIdentity returns pid's identity from the kernel's process table (kern.proc.pid on darwin; never
// a ps subprocess), or an error wrapping syscall.ESRCH when no live process has that pid.
func ProcIdentity(pid int) (Identity, error) {
	if pid <= 0 {
		return Identity{}, fmt.Errorf("runner: pid %d: %w", pid, syscall.EINVAL)
	}
	p, err := lookupProc(pid)
	if err != nil {
		return Identity{}, err
	}
	return Identity{PID: pid, Start: p.start}, nil
}

// tree is a worker's process tree: its process group, and every descendant, including those that left
// the group with setsid(2) (a kill(-pgid) alone misses them: DR M1). A descendant is found by ppid only
// while its parent lives, so scan runs while the tree runs and not only when it ends (DR M2b).
type tree struct {
	pgid  int
	known map[int]procInfo    // every process seen, by pid; the start time tells a reused pid apart
	vet   func(procInfo) bool // nil, or the pid-reuse guard: false means "not ours, do not touch"
}

func newTree(pgid int, vet func(procInfo) bool) *tree {
	return &tree{pgid: pgid, known: map[int]procInfo{}, vet: vet}
}

// scan returns the live processes of the tree and remembers them.
func (t *tree) scan() (map[int]procInfo, error) {
	tab, err := procTable()
	if err != nil {
		return nil, err
	}
	live := map[int]procInfo{}
	add := func(p procInfo) bool {
		if p.zombie || live[p.pid].pid != 0 || (t.vet != nil && !t.vet(p)) {
			return false
		}
		live[p.pid] = p
		return true
	}
	for _, p := range tab {
		if k, ok := t.known[p.pid]; (t.pgid > 1 && p.pgid == t.pgid) || (ok && k.start.Equal(p.start)) {
			add(p)
		}
	}
	for grew := true; grew; { // descendants of those, to a fixed point; launchd (pid 1) adopts orphans and is no one's parent here
		grew = false
		for _, p := range tab {
			if parent, ok := live[p.ppid]; ok && parent.pid > 1 && add(p) {
				grew = true
			}
		}
	}
	for pid, p := range live {
		t.known[pid] = p
	}
	return live, nil
}

// kill ends the tree and reports whether it confirmed that no process of it lives (false: a scan failed
// or something survived SIGKILL for 3s). It freezes first (SIGSTOP until a scan
// finds nothing new, so nothing forks past the walk), then SIGKILLs the group and every process found.
func (t *tree) kill() bool {
	stopped := map[int]bool{}
	for round := 0; round < 10; round++ {
		if t.pgid > 1 {
			syscall.Kill(-t.pgid, syscall.SIGSTOP)
		}
		live, _ := t.scan()
		fresh := false
		for pid := range live {
			if !stopped[pid] {
				stopped[pid], fresh = true, true
				syscall.Kill(pid, syscall.SIGSTOP)
			}
		}
		if !fresh {
			break
		}
	}
	for deadline := time.Now().Add(3 * time.Second); time.Now().Before(deadline); time.Sleep(10 * time.Millisecond) {
		if t.pgid > 1 {
			syscall.Kill(-t.pgid, syscall.SIGKILL)
		}
		live, err := t.scan()
		for pid := range live {
			syscall.Kill(pid, syscall.SIGKILL)
		}
		if err != nil {
			return false
		}
		if len(live) == 0 {
			return true
		}
	}
	return false
}
