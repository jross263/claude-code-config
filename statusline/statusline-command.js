#!/usr/bin/env node
"use strict";

const { execSync } = require("child_process");

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------
const R  = "\x1b[0m";

// Catppuccin Mocha palette (true-color)
const fg = (r, g, b) => `\x1b[38;2;${r};${g};${b}m`;
const SAPPHIRE  = fg(116, 199, 236);   // folder
const LAVENDER  = fg(180, 190, 254);   // model (subtle)
const MAUVE     = fg(203, 166, 247);   // git branch
const GREEN     = fg(166, 227, 161);   // insertions / ctx low
const PEACH     = fg(250, 179, 135);   // ctx mid
const RED       = fg(243, 139, 168);   // deletions / ctx high
const SURFACE2  = fg(88,  91, 112);    // separators, dim labels

function sep() {
  return `${SURFACE2} │ ${R}`;
}

function abbreviateModel(name) {
  if (!name || name === "?") return name;
  return name.replace(/^Claude\s+/i, "");
}

// Context bar: 8 blocks wide, color shifts green→yellow→red by percentage.
function contextBar(usedPct) {
  if (usedPct == null) {
    return `${SURFACE2}ctx --${R}`;
  }
  const pct    = Math.round(usedPct);
  const filled = Math.round(pct / 10); // 0–10 steps mapped to 0–8 below
  const blocks = Math.round((filled / 10) * 8);
  const bar    = "█".repeat(blocks) + "░".repeat(8 - blocks);

  let barColor;
  if (pct < 50)       barColor = GREEN;
  else if (pct < 80)  barColor = PEACH;
  else                barColor = RED;

  return `${SURFACE2}\uF080 ${R}${barColor}${bar}${R}${SURFACE2} ${pct}%${R}`;  //  bar-chart
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let input = {};
  try {
    input = JSON.parse(raw);
  } catch (_) {}

  // Current folder (last path component only)
  const cwd    = input?.workspace?.current_dir || input?.cwd || "";
  const folder = cwd.split(/[\\/]/).filter(Boolean).pop() || "?";

  // Model display name, abbreviated
  const model = abbreviateModel(input?.model?.display_name || "?");

  // Context used percentage (pre-calculated, 0–100 or null)
  const usedPct = input?.context_window?.used_percentage;
  const ctxStr  = contextBar(usedPct);

  // Build output parts
  const folderPart = `${SAPPHIRE}\uF07C ${folder}${R}`;   //  folder-open
  const modelPart  = `${LAVENDER}\uF2DB ${model}${R}`;    //  microchip

  let parts = [folderPart, modelPart, ctxStr];

  // Git branch and +/- diff stats
  if (cwd) {
    try {
      let branch;
      try {
        branch = execSync(`git -C "${cwd}" symbolic-ref --short HEAD`, {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        }).trim();
      } catch (_) {
        branch = execSync(`git -C "${cwd}" rev-parse --short HEAD`, {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        }).trim();
      }

      // Colored branch with  glyph
      const branchPart = `${MAUVE}󰘬 ${branch}${R}`;

      let insertions = 0;
      let deletions  = 0;
      try {
        const stats = execSync(
          `git -C "${cwd}" diff --shortstat HEAD`,
          { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
        ).trim();
        const insMatch = stats.match(/(\d+) insertion/);
        const delMatch = stats.match(/(\d+) deletion/);
        if (insMatch) insertions = parseInt(insMatch[1], 10);
        if (delMatch) deletions  = parseInt(delMatch[1], 10);
      } catch (_) {}

      let diffPart;
      if (insertions === 0 && deletions === 0) {
        diffPart = `${SURFACE2}\uF00C no changes${R}`;  //  check
      } else {
        diffPart =
          `${GREEN}+${insertions}${R}` +
          `${SURFACE2} / ${R}` +
          `${RED}-${deletions}${R}`;
      }

      parts.push(`${branchPart} ${diffPart}`);
    } catch (_) {}
  }

  process.stdout.write(parts.join(sep()));
});
