#!/bin/bash
DELAY="${1:-30}"
SENTINEL="$HOME/.claude/notify_pending"

# Write a unique token for this event
TOKEN=$(date +%s%N 2>/dev/null || date +%s)
echo "$TOKEN" > "$SENTINEL"

(
  sleep "$DELAY"
  # Only notify if our token is still current (no newer event fired)
  if [ "$(cat "$SENTINEL" 2>/dev/null)" = "$TOKEN" ]; then
    rm -f "$SENTINEL"
    powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -Command "
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
\$notify = New-Object System.Windows.Forms.NotifyIcon
\$notify.Icon = [System.Drawing.SystemIcons]::Information
\$notify.BalloonTipTitle = 'Claude Code'
\$notify.BalloonTipText = 'Awaiting your input'
\$notify.BalloonTipIcon = 'Info'
\$notify.Visible = \$true
\$notify.ShowBalloonTip(5000)
Start-Sleep -Milliseconds 6000
\$notify.Dispose()
"
  fi
) &
