import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CLI = path.join(ROOT, "bin", "agent-lifeline.js");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "agent-lifeline-"));

try {
  run("git", ["init"], tmp);
  fs.writeFileSync(path.join(tmp, "TODO.md"), "- [ ] ship standalone release\n", "utf8");
  fs.writeFileSync(
    path.join(tmp, "execution.log"),
    "[2026-02-23T12:00:00Z] START task-1\n[2026-02-23T12:01:00Z] DONE task-1\n",
    "utf8",
  );

  run("node", [CLI, "save", "--cwd", tmp, "--focus", "prepare publish"], ROOT);
  const latestPath = path.join(tmp, ".agent-lifeline", "latest.json");
  assert.equal(fs.existsSync(latestPath), true, "latest snapshot should exist");

  const showJson = run("node", [CLI, "show", "--cwd", tmp, "--json"], ROOT).stdout;
  const snapshot = JSON.parse(showJson);
  assert.equal(snapshot.tool, "agent-lifeline");
  assert.equal(snapshot.tasks.count >= 1, true, "tasks should be collected");
  assert.equal(snapshot.execution.available, true, "execution log should be detected");

  const exportMd = run("node", [CLI, "export", "--cwd", tmp], ROOT).stdout;
  assert.equal(exportMd.includes("# Agent Handoff"), true, "markdown export should render");
  assert.equal(exportMd.includes("ship standalone release"), true, "task text should be present");

  const doctorJson = run("node", [CLI, "doctor", "--cwd", tmp, "--json"], ROOT).stdout;
  const doctor = JSON.parse(doctorJson);
  assert.equal(doctor.version, "0.2.0");
  assert.equal(typeof doctor.git.available, "boolean");

  process.stdout.write("smoke-test: ok\n");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    const output = [
      `${cmd} ${args.join(" ")}`,
      `exit: ${result.status}`,
      result.stdout.trim(),
      result.stderr.trim(),
    ]
      .filter(Boolean)
      .join("\n");
    throw new Error(output);
  }
  return {
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
