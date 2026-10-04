package runner

import (
	"errors"
	"fmt"
	"syscall"
	"time"

	"golang.org/x/sys/unix"
)

// The process table, read from the kernel (sysctl kern.proc.*), never from a ps subprocess: /bin/ps
// is refused under the armed sandbox (DR-B1-09a-MEASURE M2).

func procFrom(k *unix.KinfoProc) procInfo {
	st := k.Proc.P_starttime
	return procInfo{pid: int(k.Proc.P_pid), ppid: int(k.Eproc.Ppid), pgid: int(k.Eproc.Pgid),
		start: time.Unix(int64(st.Sec), int64(st.Usec)*1000), zombie: k.Proc.P_stat == 5 /* SZOMB */}
}

// procTable returns every process the kernel lists.
func procTable() ([]procInfo, error) {
	ks, err := unix.SysctlKinfoProcSlice("kern.proc.all")
	if err != nil {
		return nil, fmt.Errorf("runner: process table: %w", err)
	}
	out := make([]procInfo, 0, len(ks))
	for i := range ks {
		if ks[i].Proc.P_pid > 0 {
			out = append(out, procFrom(&ks[i]))
		}
	}
	return out, nil
}

// lookupProc returns pid's entry, or an error wrapping syscall.ESRCH when no process has that pid.
// For a pid with no process the sysctl fails with EIO (measured), so a failure is ESRCH only when
// kill(pid, 0) agrees; any other failure stays itself, and Reconcile will not guess through it.
func lookupProc(pid int) (procInfo, error) {
	k, err := unix.SysctlKinfoProc("kern.proc.pid", pid)
	if err == nil && int(k.Proc.P_pid) == pid {
		return procFrom(k), nil
	}
	if err == nil || errors.Is(err, syscall.ENOENT) || syscall.Kill(pid, 0) == syscall.ESRCH {
		return procInfo{}, fmt.Errorf("runner: pid %d: %w", pid, syscall.ESRCH)
	}
	return procInfo{}, fmt.Errorf("runner: pid %d: %w", pid, err)
}
