#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const VERSION = "0.2.0";
const INVOCATION_DIR = process.cwd();

main();

function main() {
  const argv = process.argv.slice(2);
  const command = argv[0] && !argv[0].startsWith("-") ? argv[0] : "help";
  const args = parseArgs(command === "help" ? argv : argv.slice(1));

  if (args.help || command === "help") {
    printHelp();
    process.exit(0);
  }

  switch (command) {
    case "save":
      cmdSave(args);
      return;
    case "show":
      cmdShow(args);
      return;
    case "export":
      cmdExport(args);
      return;
    case "doctor":
      cmdDoctor(args);
      return;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

function cmdSave(args) {
  const cwd = path.resolve(args.cwd ?? INVOCATION_DIR);
  const paths = buildStorePaths(cwd);
  ensureStore(paths);

  const snapshot = buildSnapshot(cwd, args.focus ?? "");
  const fileName = `${formatDateCompact(new Date())}.json`;
  const target = path.join(paths.snapshotsDir, fileName);
  fs.writeFileSync(target, JSON.stringify(snapshot, null, 2), "utf8");
  fs.writeFileSync(paths.latestPath, JSON.stringify(snapshot, null, 2), "utf8");

  if (args.json) {
    process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
    return;
  }

  console.log(`Saved snapshot: ${path.relative(INVOCATION_DIR, target) || "."}`);
  console.log(renderSnapshot(snapshot, { brief: true }));
}

function cmdShow(args) {
  const cwd = path.resolve(args.cwd ?? INVOCATION_DIR);
  const paths = buildStorePaths(cwd);
  const snapshot = readLatestSnapshot(paths.latestPath);
  if (!snapshot) {
    failNoSnapshot(paths.latestPath);
  }
  if (args.json) {
    process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
    return;
  }
  console.log(renderSnapshot(snapshot, { brief: false }));
}

function cmdExport(args) {
  const cwd = path.resolve(args.cwd ?? INVOCATION_DIR);
  const paths = buildStorePaths(cwd);
  const snapshot = readLatestSnapshot(paths.latestPath);
  if (!snapshot) {
    failNoSnapshot(paths.latestPath);
  }
  if (args.json) {
    process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
    return;
  }
  console.log(renderExport(snapshot));
}

function cmdDoctor(args) {
  const cwd = path.resolve(args.cwd ?? INVOCATION_DIR);
  const paths = buildStorePaths(cwd);
  const gitVersion = run("git", ["--version"], cwd);
  const inRepo = run("git", ["rev-parse", "--is-inside-work-tree"], cwd);
  const home = os.homedir();
  const claudeDir = path.join(home, ".claude");
  const historyPath = path.join(claudeDir, "history.jsonl");
  const projectsDir = path.join(claudeDir, "projects");

  const doctor = {
    version: VERSION,
    cwd,
    storeDir: paths.storeDir,
    writableStore: canWrite(paths.storeDir),
    git: {
      available: gitVersion.ok,
      insideRepo: inRepo.ok && inRepo.stdout.trim() === "true",
      details: gitVersion.ok ? (inRepo.ok ? "ok" : "not in git repo") : gitVersion.stderr.trim() || "not available",
    },
    claude: {
      dirExists: fs.existsSync(claudeDir),
      historyExists: fs.existsSync(historyPath),
      projectsExists: fs.existsSync(projectsDir),
    },
  };

  if (args.json) {
    process.stdout.write(`${JSON.stringify(doctor, null, 2)}\n`);
    return;
  }
  console.log("Agent Lifeline Doctor");
  console.log(`- version: ${doctor.version}`);
  console.log(`- cwd: ${doctor.cwd}`);
  console.log(`- writable store: ${doctor.writableStore ? "yes" : "no"}`);
  console.log(`- git available: ${doctor.git.available ? "yes" : "no"}`);
  console.log(`- in git repo: ${doctor.git.insideRepo ? "yes" : "no"}`);
  console.log(`- ~/.claude present: ${doctor.claude.dirExists ? "yes" : "no"}`);
  console.log(`- history.jsonl: ${doctor.claude.historyExists ? "yes" : "no"}`);
  console.log(`- projects/: ${doctor.claude.projectsExists ? "yes" : "no"}`);
}


function buildSnapshot(cwd, focus) {
  const createdAt = new Date().toISOString();
  const git = collectGitState(cwd);
  const tasks = collectTasks(cwd);
  const execution = collectExecutionSummary(cwd);
  const claude = collectClaudeContext(cwd);

  return {
    schemaVersion: 1,
    tool: "agent-lifeline",
    version: VERSION,
    createdAt,
    cwd,
    focus: focus.trim() || null,
    git,
    tasks,
    execution,
    claude,
  };
}

function collectGitState(cwd) {
  const inRepo = run("git", ["rev-parse", "--is-inside-work-tree"], cwd);
  if (!inRepo.ok || inRepo.stdout.trim() !== "true") {
    return null;
  }

  const branch = run("git", ["branch", "--show-current"], cwd).stdout.trim() || "(detached)";
  const status = run("git", ["status", "--porcelain"], cwd).stdout;
  const lines = status.split(/\r?\n/).filter(Boolean);

  let staged = 0;
  let modified = 0;
  let untracked = 0;
  for (const line of lines) {
    if (line.startsWith("??")) {
      untracked += 1;
      continue;
    }
    const x = line[0] ?? " ";
    const y = line[1] ?? " ";
    if (x !== " ") staged += 1;
    if (y !== " ") modified += 1;
  }

  const diff = run("git", ["diff", "--name-status", "--relative", "HEAD"], cwd).stdout;
  const changedFiles = diff
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(0, 25)
    .map((line) => {
      const [statusCode, ...rest] = line.trim().split(/\s+/);
      return { status: statusCode, path: rest.join(" ") };
    });

  const aheadBehind = run("git", ["rev-list", "--left-right", "--count", "HEAD...@{u}"], cwd);
  let ahead = 0;
  let behind = 0;
  if (aheadBehind.ok) {
    const parts = aheadBehind.stdout.trim().split(/\s+/);
    if (parts.length === 2) {
      ahead = Number.parseInt(parts[0], 10) || 0;
      behind = Number.parseInt(parts[1], 10) || 0;
    }
  }

  const recentCommits = run("git", ["log", "--oneline", "-5"], cwd).stdout
    .split(/\r?\n/)
    .filter(Boolean);

  return {
    branch,
    ahead,
    behind,
    dirty: lines.length > 0,
    changedCount: lines.length,
    stagedCount: staged,
    modifiedCount: modified,
    untrackedCount: untracked,
    changedFiles,
    recentCommits,
  };
}

function collectTasks(cwd) {
  const candidates = [
    "TODO.md",
    "todo.md",
    "TASKS.md",
    "tasks.md",
    "PLAN.md",
    "plan.md",
  ].map((rel) => path.join(cwd, rel));

  const items = [];
  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const matchCheckbox = line.match(/^\s*[-*]\s+\[\s\]\s+(.+)$/);
      if (matchCheckbox) {
        items.push({ source: relativePath(cwd, filePath), text: compact(matchCheckbox[1]) });
        continue;
      }
      const matchTodo = line.match(/\bTODO[:\s-]+(.+)/i);
      if (matchTodo) {
        items.push({ source: relativePath(cwd, filePath), text: compact(matchTodo[1]) });
      }
    }
  }

  return {
    count: items.length,
    open: items.slice(0, 30),
  };
}

function collectExecutionSummary(cwd) {
  const candidates = [
    "execution.log",
    "logs/execution.log",
    ".agent/execution.log",
    ".agent-lifeline/execution.log",
  ];

  let logPath = "";
  for (const rel of candidates) {
    const abs = path.join(cwd, rel);
    if (fs.existsSync(abs)) {
      logPath = abs;
      break;
    }
  }
  if (!logPath) {
    return { available: false, source: null, lastLines: [] };
  }
  const lines = tailLines(logPath, 30).map((line) => compact(line)).filter(Boolean);
  return {
    available: true,
    source: relativePath(cwd, logPath),
    lastLines: lines.slice(-15),
  };
}

function collectClaudeContext(cwd) {
  const home = os.homedir();
  const claudeDir = path.join(home, ".claude");
  const historyPath = path.join(claudeDir, "history.jsonl");
  const projectsDir = path.join(claudeDir, "projects");

  const historyPrompts = [];
  if (fs.existsSync(historyPath)) {
    const lines = tailLines(historyPath, 400);
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        const project = typeof entry.project === "string" ? entry.project : "";
        if (!project) continue;
        if (!sameProject(project, cwd)) continue;
        const display = typeof entry.display === "string" ? compact(entry.display) : "";
        const timestamp = typeof entry.timestamp === "number" ? new Date(entry.timestamp).toISOString() : null;
        if (display) historyPrompts.push({ display, timestamp, sessionId: entry.sessionId ?? null });
      } catch {
        // skip malformed lines
      }
    }
  }

  const transcript = findRecentTranscript(projectsDir, cwd);

  return {
    historyPrompts: historyPrompts.slice(-8).reverse(),
    transcript,
  };
}

function findRecentTranscript(projectsDir, cwd) {
  if (!fs.existsSync(projectsDir)) return null;

  const dirs = safeReadDirs(projectsDir)
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(projectsDir, entry.name));

  // Prefer directories that hint current project name, then by mtime.
  const cwdBase = path.basename(cwd).toLowerCase();
  dirs.sort((a, b) => {
    const aHint = path.basename(a).toLowerCase().includes(cwdBase) ? 1 : 0;
    const bHint = path.basename(b).toLowerCase().includes(cwdBase) ? 1 : 0;
    if (aHint !== bHint) return bHint - aHint;
    return safeMtimeMs(b) - safeMtimeMs(a);
  });

  const candidateFiles = [];
  for (const dir of dirs.slice(0, 40)) {
    const files = safeReadFiles(dir)
      .filter((file) => file.endsWith(".jsonl"))
      .map((file) => path.join(dir, file));
    files.sort((a, b) => safeMtimeMs(b) - safeMtimeMs(a));
    candidateFiles.push(...files.slice(0, 12));
  }

  candidateFiles.sort((a, b) => safeMtimeMs(b) - safeMtimeMs(a));

  for (const filePath of candidateFiles.slice(0, 80)) {
    const firstLines = tailLines(filePath, 80);
    let isMatch = false;
    for (const line of firstLines) {
      try {
        const obj = JSON.parse(line);
        if (typeof obj.cwd === "string" && sameProject(obj.cwd, cwd)) {
          isMatch = true;
          break;
        }
      } catch {
        // skip
      }
    }
    if (!isMatch) continue;

    const tail = tailLines(filePath, 500);
    const prompts = [];
    const toolCounts = new Map();

    for (const line of tail) {
      try {
        const msg = JSON.parse(line);
        if (msg.type === "user") {
          const text = extractText(msg);
          if (text) prompts.push(compact(text));
        }
        if (msg.type === "assistant") {
          const content = msg.message?.content;
          if (Array.isArray(content)) {
            for (const block of content) {
              if (block && block.type === "tool_use" && typeof block.name === "string") {
                toolCounts.set(block.name, (toolCounts.get(block.name) ?? 0) + 1);
              }
            }
          }
        }
      } catch {
        // skip
      }
    }

    const topTools = [...toolCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    return {
      file: filePath,
      modifiedAt: new Date(safeMtimeMs(filePath)).toISOString(),
      lastUserPrompts: prompts.slice(-5).reverse(),
      topTools,
    };
  }

  return null;
}

function extractText(msg) {
  const content = msg?.message?.content;
  if (!Array.isArray(content)) return "";
  const chunks = [];
  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    if (typeof block.text === "string") chunks.push(block.text);
  }
  return chunks.join(" ").trim();
}

function readLatestSnapshot(latestPath) {
  if (!fs.existsSync(latestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(latestPath, "utf8"));
  } catch {
    return null;
  }
}

function renderSnapshot(snapshot, options = { brief: false }) {
  const lines = [];
  lines.push("Agent Lifeline Snapshot");
  lines.push(`- created: ${snapshot.createdAt}`);
  lines.push(`- cwd: ${snapshot.cwd}`);
  if (snapshot.focus) lines.push(`- focus: ${snapshot.focus}`);

  if (snapshot.git) {
    lines.push(
      `- git: ${snapshot.git.branch} | dirty=${snapshot.git.dirty} | changed=${snapshot.git.changedCount} | ahead=${snapshot.git.ahead} | behind=${snapshot.git.behind}`,
    );
    if (!options.brief && snapshot.git.changedFiles.length > 0) {
      lines.push("- changed files:");
      for (const f of snapshot.git.changedFiles.slice(0, 10)) {
        lines.push(`  - [${f.status}] ${f.path}`);
      }
    }
  } else {
    lines.push("- git: not detected");
  }

  lines.push(`- open tasks: ${snapshot.tasks.count}`);
  if (!options.brief && snapshot.tasks.open.length > 0) {
    for (const t of snapshot.tasks.open.slice(0, 8)) {
      lines.push(`  - (${t.source}) ${t.text}`);
    }
  }

  if (snapshot.execution?.available) {
    const source = snapshot.execution.source ? ` (${snapshot.execution.source})` : "";
    lines.push(`- execution.log${source}: ${snapshot.execution.lastLines.length} recent lines`);
  } else {
    lines.push("- execution.log: not found");
  }

  const promptCount = snapshot.claude?.historyPrompts?.length ?? 0;
  lines.push(`- claude history prompts: ${promptCount}`);

  if (snapshot.claude?.transcript) {
    const t = snapshot.claude.transcript;
    lines.push(`- transcript: ${t.file}`);
    if (!options.brief && t.lastUserPrompts?.length) {
      lines.push("- last prompts:");
      for (const p of t.lastUserPrompts.slice(0, 4)) {
        lines.push(`  - ${p}`);
      }
    }
  } else {
    lines.push("- transcript: not found");
  }

  return lines.join("\n");
}

function renderExport(snapshot) {
  const lines = [];
  lines.push("# Agent Handoff");
  lines.push(`Generated: ${snapshot.createdAt}`);
  lines.push(`Project: ${snapshot.cwd}`);
  if (snapshot.focus) lines.push(`Focus: ${snapshot.focus}`);
  lines.push("");

  if (snapshot.git) {
    lines.push("## Git");
    lines.push(`Branch: ${snapshot.git.branch}`);
    lines.push(`Dirty: ${snapshot.git.dirty}`);
    lines.push(`Changed: ${snapshot.git.changedCount}`);
    lines.push(`Ahead/Behind: ${snapshot.git.ahead}/${snapshot.git.behind}`);
    if (snapshot.git.changedFiles.length > 0) {
      lines.push("Top changed files:");
      for (const f of snapshot.git.changedFiles.slice(0, 12)) {
        lines.push(`- [${f.status}] ${f.path}`);
      }
    }
    lines.push("");
  }

  lines.push("## Open Tasks");
  if (snapshot.tasks.open.length === 0) {
    lines.push("- No parsed tasks found.");
  } else {
    for (const t of snapshot.tasks.open.slice(0, 15)) {
      lines.push(`- (${t.source}) ${t.text}`);
    }
  }
  lines.push("");

  if (snapshot.execution?.available && snapshot.execution.lastLines.length > 0) {
    lines.push("## Recent Execution Log");
    for (const line of snapshot.execution.lastLines.slice(-10)) {
      lines.push(`- ${line}`);
    }
    lines.push("");
  }

  if (snapshot.claude?.historyPrompts?.length) {
    lines.push("## Recent Prompts (history.jsonl)");
    for (const p of snapshot.claude.historyPrompts.slice(0, 8)) {
      lines.push(`- ${p.display}`);
    }
    lines.push("");
  }

  if (snapshot.claude?.transcript?.lastUserPrompts?.length) {
    lines.push("## Latest Session Prompts");
    for (const p of snapshot.claude.transcript.lastUserPrompts.slice(0, 5)) {
      lines.push(`- ${p}`);
    }
    lines.push("");
  }

  lines.push("## Next Agent Instructions");
  lines.push("- Continue from open tasks in priority order.");
  lines.push("- Verify changed files and run relevant tests.");
  lines.push("- Keep this handoff updated with `agent-lifeline save --focus \"...\"`.");

  return lines.join("\n");
}

function ensureStore(paths) {
  if (!fs.existsSync(paths.storeDir)) fs.mkdirSync(paths.storeDir, { recursive: true });
  if (!fs.existsSync(paths.snapshotsDir)) fs.mkdirSync(paths.snapshotsDir, { recursive: true });
}

function canWrite(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    const testPath = path.join(dirPath, ".write-test");
    fs.writeFileSync(testPath, "ok", "utf8");
    fs.unlinkSync(testPath);
    return true;
  } catch {
    return false;
  }
}

function failNoSnapshot(latestPath) {
  console.error(`No snapshot found at ${latestPath}. Run: agent-lifeline save`);
  process.exit(1);
}

function printHelp() {
  console.log(`agent-lifeline v${VERSION}

Usage:
  agent-lifeline save [--focus "what to continue"] [--cwd path] [--json]
  agent-lifeline show [--cwd path] [--json]
  agent-lifeline export [--cwd path] [--json]
  agent-lifeline doctor [--cwd path] [--json]

Why:
  Agents lose context after /clear, compaction, or handoffs.
  agent-lifeline creates a portable snapshot in .agent-lifeline/latest.json.`);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") {
      out.help = true;
      continue;
    }
    if (token === "--json") {
      out.json = true;
      continue;
    }
    if (token === "--cwd") {
      out.cwd = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--focus") {
      out.focus = argv[i + 1];
      i += 1;
      continue;
    }
  }
  return out;
}

function run(cmd, args, cwd) {
  const res = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    ok: res.status === 0,
    status: res.status ?? 1,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
  };
}

function tailLines(filePath, limit = 200) {
  try {
    const fd = fs.openSync(filePath, "r");
    const stat = fs.fstatSync(fd);
    const chunkSize = 64 * 1024;
    let pos = stat.size;
    let text = "";
    let lines = [];

    while (pos > 0 && lines.length <= limit + 1) {
      const readSize = Math.min(chunkSize, pos);
      pos -= readSize;
      const buff = Buffer.alloc(readSize);
      fs.readSync(fd, buff, 0, readSize, pos);
      text = buff.toString("utf8") + text;
      lines = text.split(/\r?\n/);
    }
    fs.closeSync(fd);
    return lines.filter(Boolean).slice(-limit);
  } catch {
    return [];
  }
}

function safeReadDirs(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

function safeReadFiles(dirPath) {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
}

function safeMtimeMs(filePath) {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
}

function compact(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function sameProject(a, b) {
  const pa = path.resolve(a);
  const pb = path.resolve(b);
  return pa === pb || pa.startsWith(`${pb}${path.sep}`) || pb.startsWith(`${pa}${path.sep}`);
}

function relativePath(from, to) {
  return path.relative(from, to) || ".";
}

function buildStorePaths(baseDir) {
  const storeDir = path.join(baseDir, ".agent-lifeline");
  return {
    baseDir,
    storeDir,
    latestPath: path.join(storeDir, "latest.json"),
    snapshotsDir: path.join(storeDir, "snapshots"),
  };
}

function formatDateCompact(date) {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}
