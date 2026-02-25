# claude-code-config

Portable [Claude Code](https://docs.anthropic.com/en/docs/claude-code) hooks and status line configuration for Windows (Git Bash).

## What's included

- **hooks/notify.sh** — Windows balloon notification after 30 seconds of idle (Stop hook)
- **hooks/cancel_notify.sh** — Cancels pending notification when you submit a new prompt
- **statusline/statusline-command.js** — Custom status line showing folder, model, context usage, git branch, and diff stats

## Prerequisites

- Git Bash (ships with Git for Windows)
- [Node.js](https://nodejs.org/)
- [jq](https://jqlang.github.io/jq/) (`winget install jqlang.jq`)

## Install

```bash
git clone https://github.com/YOUR_USERNAME/claude-code-config.git
cd claude-code-config
bash install.sh
```

The install script:

1. Copies hooks and statusline scripts to `~/.claude/hooks/` and `~/.claude/statusline/`
2. Merges `hooks` and `statusLine` config into `~/.claude/settings.json` (preserving your other settings)
3. Removes old flat-layout files (`~/.claude/notify.sh`, etc.) if present

Restart Claude Code after installing.

## Updating

Pull the latest changes and re-run the install script:

```bash
cd claude-code-config
git pull
bash install.sh
```
