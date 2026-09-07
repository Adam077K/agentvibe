#!/bin/sh
# Reverses install.sh completely. Keeps the log unless you pass --purge.
set -u
LABEL="com.keel.r33-probe"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
PROBE_DIR="$HOME/.keel-probes"

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null && echo "unloaded $LABEL" || echo "$LABEL was not loaded"
rm -f "$PLIST"                  && echo "removed $PLIST"
rm -f "$PROBE_DIR/r33-probe.sh" && echo "removed the probe script"
security delete-generic-password -a keel-r33 -s keel-r33-probe >/dev/null 2>&1 \
  && echo "removed the keychain item" || echo "keychain item was already gone"

if [ "${1:-}" = "--purge" ]; then
  rm -f "$PROBE_DIR/r33-probe.log" "$PROBE_DIR/r33-probe.err"
  rmdir "$PROBE_DIR" 2>/dev/null || true
  echo "purged the log"
else
  echo "log kept at $PROBE_DIR/r33-probe.log — pass --purge to delete it"
fi
