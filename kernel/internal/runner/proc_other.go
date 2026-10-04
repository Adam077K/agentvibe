//go:build !darwin

package runner

import "errors"

// The Kernel's process control is darwin's (09a §8.2). Elsewhere every lookup fails, so Reconcile and
// Exec refuse rather than guess.

func procTable() ([]procInfo, error)   { return nil, errors.ErrUnsupported }
func lookupProc(int) (procInfo, error) { return procInfo{}, errors.ErrUnsupported }
