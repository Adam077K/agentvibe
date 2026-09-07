#!/bin/sh
# R33 probe — does a LaunchAgent on THIS Mac read a keychain item after sleep,
# and after reboot with the screen locked?
#
# READ THIS BEFORE RUNNING. It makes exactly four changes, all listed here and
# all reversed by uninstall.sh in the same directory:
#
#   1. creates ONE keychain item — service `keel-r33-probe`, account `keel-r33`,
#      holding the literal string R33-OK. It is not a real secret and nothing
#      else reads it.
#   2. writes  ~/.keel-probes/r33-probe.sh
#   3. writes  ~/Library/LaunchAgents/com.keel.r33-probe.plist
#   4. bootstraps that agent into your GUI session
#
# It runs every 5 minutes and appends one line per run to
# ~/.keel-probes/r33-probe.log. It reads nothing else, sends nothing anywhere,
# and takes no network action.
#
# NOTE ON THE ACL, because it is the whole point: the item is created WITHOUT
# `-A`, so its access list trusts only the creating binary. That is the
# realistic case. If the probe logs a non-zero rc -- measured as rc=152 on this
# machine, twice, which is errSecInteractionNotAllowed -- or a
# prompt appears, that IS the finding — it means a scheduled job cannot reach a
# credential unattended, which decides how the night is allowed to authenticate.

set -eu

PROBE_DIR="$HOME/.keel-probes"
PLIST="$HOME/Library/LaunchAgents/com.keel.r33-probe.plist"
LABEL="com.keel.r33-probe"
SERVICE="keel-r33-probe"
ACCOUNT="keel-r33"

mkdir -p "$PROBE_DIR"

# 1 · the keychain item -------------------------------------------------------
if security find-generic-password -a "$ACCOUNT" -s "$SERVICE" >/dev/null 2>&1; then
  echo "keychain item already present, leaving it alone"
else
  security add-generic-password -a "$ACCOUNT" -s "$SERVICE" -w "R33-OK" \
    -l "Keel R33 probe (safe to delete)"
  echo "created keychain item $SERVICE"
fi

# 2 · the probe ---------------------------------------------------------------
cat > "$PROBE_DIR/r33-probe.sh" <<'ENDPROBE'
#!/bin/sh
LOG="$HOME/.keel-probes/r33-probe.log"
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

OUT=$(security find-generic-password -a keel-r33 -s keel-r33-probe -w 2>&1) && RC=0 || RC=$?

case "$OUT" in
  R33-OK) VERDICT=READ ;;
  *)      VERDICT=DENIED ;;
esac

if ioreg -n Root -d1 -k CGSSessionScreenIsLocked 2>/dev/null | grep -q 'CGSSessionScreenIsLocked = Yes'; then
  LOCKED=yes
else
  LOCKED=no
fi

POWER=$(pmset -g batt 2>/dev/null | head -1 | sed 's/.*drawing from .//; s/.$//')
UP=$(uptime | sed 's/.*up //; s/,.*users.*//')

printf '%s verdict=%s rc=%s locked=%s power=%s uptime=%s detail=%s\n' \
  "$TS" "$VERDICT" "$RC" "$LOCKED" "${POWER:-unknown}" "${UP:-unknown}" \
  "$(printf '%s' "$OUT" | tr -d '\n' | cut -c1-60)" >> "$LOG"
ENDPROBE
chmod 755 "$PROBE_DIR/r33-probe.sh"
echo "wrote $PROBE_DIR/r33-probe.sh"

# 3 · the LaunchAgent ---------------------------------------------------------
cat > "$PLIST" <<ENDPLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>            <string>$LABEL</string>
  <key>ProgramArguments</key> <array>
    <string>/bin/sh</string>
    <string>$PROBE_DIR/r33-probe.sh</string>
  </array>
  <key>StartInterval</key>    <integer>300</integer>
  <key>RunAtLoad</key>        <true/>
  <key>StandardErrorPath</key><string>$PROBE_DIR/r33-probe.err</string>
</dict>
</plist>
ENDPLIST
echo "wrote $PLIST"

# 4 · load it -----------------------------------------------------------------
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl kickstart -p "gui/$(id -u)/$LABEL" >/dev/null 2>&1 || true

echo
echo "installed. it runs every 5 minutes."
echo "watch it:   tail -f $PROBE_DIR/r33-probe.log"
echo "remove it:  sh docs/03-system-design/final-v2/probes/r33/uninstall.sh"
