#!/bin/bash
set -euo pipefail

CLAUDE_DIR="$HOME/.claude"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Installing Claude Code config..."

# 1. Create target directories
mkdir -p "$CLAUDE_DIR/hooks"
mkdir -p "$CLAUDE_DIR/statusline"

# 2. Copy scripts
cp "$SCRIPT_DIR/hooks/notify.sh"       "$CLAUDE_DIR/hooks/notify.sh"
cp "$SCRIPT_DIR/hooks/cancel_notify.sh" "$CLAUDE_DIR/hooks/cancel_notify.sh"
cp "$SCRIPT_DIR/statusline/statusline-command.js" "$CLAUDE_DIR/statusline/statusline-command.js"

# 3. Make shell scripts executable
chmod +x "$CLAUDE_DIR/hooks/notify.sh"
chmod +x "$CLAUDE_DIR/hooks/cancel_notify.sh"

echo "  Copied hooks and statusline scripts."

# 4. Merge config into settings.json using jq
SETTINGS="$CLAUDE_DIR/settings.json"
[ -f "$SETTINGS" ] || echo '{}' > "$SETTINGS"

PATCH=$(cat <<EOF
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "$HOME/.claude/hooks/notify.sh",
        "async": true
      }]
    }],
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "$HOME/.claude/hooks/cancel_notify.sh",
        "async": true
      }]
    }]
  },
  "statusLine": {
    "type": "command",
    "command": "node $HOME/.claude/statusline/statusline-command.js"
  }
}
EOF
)

PATCH_FILE=$(mktemp)
echo "$PATCH" > "$PATCH_FILE"
jq -s '.[0] * .[1]' "$SETTINGS" "$PATCH_FILE" > "$SETTINGS.tmp"
rm -f "$PATCH_FILE"
mv "$SETTINGS.tmp" "$SETTINGS"

echo "  Merged hooks and statusLine into settings.json."

# 5. Clean up old flat files if they exist
removed=0
for old_file in "$CLAUDE_DIR/notify.sh" "$CLAUDE_DIR/cancel_notify.sh" "$CLAUDE_DIR/statusline-command.js"; do
  if [ -f "$old_file" ]; then
    rm "$old_file"
    removed=$((removed + 1))
  fi
done
if [ "$removed" -gt 0 ]; then
  echo "  Removed $removed old flat file(s) from ~/.claude/."
fi

echo "Done! Restart Claude Code for changes to take effect."
