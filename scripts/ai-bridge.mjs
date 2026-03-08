#!/usr/bin/env node

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const root = process.cwd();
const configPath = path.join(root, "scripts", "ai-bridge.config.json");
const MODES = new Set(["auto", "codex-only", "claude-only", "manual-pause"]);

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeSlug(value) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "next-task";
}

function normalizeReportText(taskBase, text) {
  const trimmed = (text || "").trim();
  if (!trimmed) {
    return [
      `# Raport: ${taskBase}`,
      "",
      "Status: PYTANIE",
      "",
      "## Wynik weryfikacji",
      "- Bridge nie otrzymal tresci raportu od Codexa. Wymagana reczna weryfikacja.",
      "",
      "## Lista zmian w plikach",
      "- Do ustalenia recznie.",
      "",
      "## Problemy napotkane",
      "- Codex nie zapisal raportu .done.md i nie zwrocil uzytecznej tresci raportowej.",
      "",
    ].join("\n");
  }

  if (trimmed.includes("# Raport:") && trimmed.includes("Status:")) {
    return `${trimmed}\n`;
  }

  return [
    `# Raport: ${taskBase}`,
    "",
    "Status: PYTANIE",
    "",
    "## Wynik weryfikacji",
    "- Raport wygenerowany awaryjnie z ostatniej wiadomosci Codexa. Wymagana reczna weryfikacja.",
    "",
    "## Lista zmian w plikach",
    "- Do odczytu z ponizszej tresci.",
    "",
    "## Problemy napotkane",
    "```text",
    trimmed,
    "```",
    "",
  ].join("\n");
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fsp.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function exists(file) {
  try {
    await fsp.access(file, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function parseJsonLoose(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function runProcess(command, args, options = {}) {
  const { cwd = root, timeoutMs = 300000, env = process.env } = options;

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 3000);
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({ code: code ?? 1, stdout, stderr, timedOut });
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      resolve({ code: 1, stdout, stderr: `${stderr}\n${String(err)}`, timedOut });
    });
  });
}

function runShell(command, options = {}) {
  return runProcess("/bin/zsh", ["-lc", command], options);
}

async function loadContext() {
  const config = JSON.parse(await fsp.readFile(configPath, "utf8"));
  const tasksDir = path.join(root, config.paths.tasksDir);
  const reportsDir = path.join(root, config.paths.reportsDir);
  const archivedDir = path.join(root, config.paths.archivedDir);
  const stateDir = path.join(root, config.paths.stateDir);
  const logsDir = path.join(root, config.paths.logsDir);

  await Promise.all([
    ensureDir(tasksDir),
    ensureDir(reportsDir),
    ensureDir(archivedDir),
    ensureDir(stateDir),
    ensureDir(logsDir),
  ]);

  return {
    config,
    tasksDir,
    reportsDir,
    archivedDir,
    stateDir,
    logsDir,
    protocolPath: path.join(root, config.paths.protocol),
    lockPath: path.join(stateDir, "bridge.lock.json"),
    completedPath: path.join(stateDir, "completed-tasks.json"),
    lastRunPath: path.join(stateDir, "last-run.json"),
    modePath: path.join(stateDir, "mode.json"),
    healthPath: path.join(stateDir, "health.json"),
    codexOutputDir: path.join(stateDir, "codex-output"),
    logPath: path.join(logsDir, "bridge.log"),
  };
}

async function appendLog(ctx, event, data = {}) {
  await fsp.appendFile(
    ctx.logPath,
    `${JSON.stringify({ ts: nowIso(), event, ...data })}\n`,
    "utf8",
  );
}

async function acquireLock(ctx) {
  const payload = { pid: process.pid, startedAt: nowIso(), cwd: root };
  try {
    const fd = await fsp.open(ctx.lockPath, "wx");
    await fd.writeFile(JSON.stringify(payload, null, 2), "utf8");
    await fd.close();
    return true;
  } catch {
    return false;
  }
}

async function releaseLock(ctx) {
  if (await exists(ctx.lockPath)) {
    await fsp.rm(ctx.lockPath, { force: true });
  }
}

async function readCompleted(ctx) {
  return readJson(ctx.completedPath, { completed: [] });
}

async function writeCompleted(ctx, payload) {
  await fsp.writeFile(ctx.completedPath, JSON.stringify(payload, null, 2), "utf8");
}

function parseTaskNumber(fileName) {
  const match = fileName.match(/^(\d+)-/);
  return match ? Number(match[1]) : 0;
}

async function listTaskFiles(ctx) {
  const entries = await fsp.readdir(ctx.tasksDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name)
    .sort((a, b) => parseTaskNumber(a) - parseTaskNumber(b) || a.localeCompare(b));
}

async function isTaskArchived(ctx, base) {
  return exists(path.join(ctx.archivedDir, `${base}.done.md`));
}

async function pickPendingTask(ctx) {
  const completed = await readCompleted(ctx);
  const done = new Set(completed.completed || []);
  for (const file of await listTaskFiles(ctx)) {
    const base = file.replace(/\.md$/, "");
    if (done.has(base)) continue;
    if (await isTaskArchived(ctx, base)) continue;
    return {
      file,
      base,
      taskPath: path.join(ctx.tasksDir, file),
      reportPath: path.join(ctx.reportsDir, `${base}.done.md`),
      verifyPath: path.join(ctx.reportsDir, `${base}.verify.md`),
      verifyJsonPath: path.join(ctx.reportsDir, `${base}.verify.json`),
    };
  }
  return null;
}

async function getMode(ctx) {
  const state = await readJson(ctx.modePath, null);
  const mode = state?.mode || ctx.config.mode.default || "auto";
  if (!MODES.has(mode)) {
    return { mode: "auto", source: "fallback", updatedAt: nowIso() };
  }
  return { mode, source: state?.source || "state", updatedAt: state?.updatedAt || null };
}

async function setMode(ctx, mode, reason, source = "system") {
  if (!MODES.has(mode)) {
    throw new Error(`Unsupported mode: ${mode}`);
  }
  const payload = { mode, reason: reason || "", source, updatedAt: nowIso() };
  await fsp.writeFile(ctx.modePath, JSON.stringify(payload, null, 2), "utf8");
  await appendLog(ctx, "mode_changed", payload);
  return payload;
}

async function probeHealth(ctx) {
  const codex = await runProcess(ctx.config.commands.codexBin, ["--version"], {
    timeoutMs: ctx.config.timeouts.healthSeconds * 1000,
  });
  const claude = await runProcess(ctx.config.commands.claudeBin, ["--version"], {
    timeoutMs: ctx.config.timeouts.healthSeconds * 1000,
  });

  const health = {
    timestamp: nowIso(),
    codex: codex.code === 0,
    claude: claude.code === 0,
    codexExit: codex.code,
    claudeExit: claude.code,
  };

  await fsp.writeFile(ctx.healthPath, JSON.stringify(health, null, 2), "utf8");
  await appendLog(ctx, "health_probe", health);
  return health;
}

async function resolveEffectiveMode(ctx) {
  const current = await getMode(ctx);
  const health = await probeHealth(ctx);

  if (current.mode === "manual-pause") {
    return { mode: "manual-pause", health };
  }

  if (current.mode === "auto") {
    if (health.codex && health.claude) return { mode: "auto", health };
    if (health.codex && !health.claude) {
      await setMode(ctx, "codex-only", "Claude unavailable, fallback from auto");
      return { mode: "codex-only", health };
    }
    if (!health.codex && health.claude) {
      await setMode(ctx, "claude-only", "Codex unavailable, fallback from auto");
      return { mode: "claude-only", health };
    }
    await setMode(ctx, "manual-pause", "Both agents unavailable");
    return { mode: "manual-pause", health };
  }

  if (ctx.config.mode.recoverToAuto && health.codex && health.claude) {
    await setMode(ctx, "auto", "Recovered both agents");
    return { mode: "auto", health };
  }

  if (current.mode === "codex-only" && !health.codex) {
    if (health.claude) {
      await setMode(ctx, "claude-only", "Codex-only failed, switch to Claude-only");
      return { mode: "claude-only", health };
    }
    await setMode(ctx, "manual-pause", "Codex and Claude unavailable");
    return { mode: "manual-pause", health };
  }

  if (current.mode === "claude-only" && !health.claude) {
    if (health.codex) {
      await setMode(ctx, "codex-only", "Claude-only failed, switch to Codex-only");
      return { mode: "codex-only", health };
    }
    await setMode(ctx, "manual-pause", "Claude and Codex unavailable");
    return { mode: "manual-pause", health };
  }

  return { mode: current.mode, health };
}

function codexExecutePrompt(taskPath, reportPath, protocolPath) {
  return [
    "You are Codex execution agent for this repository.",
    `Read protocol: ${protocolPath}`,
    `Read task: ${taskPath}`,
    "",
    "Do only this task scope and produce code changes if needed.",
    "When done, write report ONLY to:",
    reportPath,
    "",
    "Report template:",
    "# Raport: <task-id>",
    "",
    "Status: OK | PYTANIE | BLOKADA",
    "",
    "## Wynik weryfikacji",
    "- npm run build: OK/BLOKADA/NIEDOTYCZY",
    "- npm run lint: OK/BLOKADA/NIEDOTYCZY",
    "",
    "## Lista zmian w plikach",
    "",
    "## Problemy napotkane",
  ].join("\n");
}

function claudeExecutePrompt(taskPath, reportPath, protocolPath, gsd) {
  const lines = [
    "You are Cloud Code execution agent for this repository.",
    `Read protocol: ${protocolPath}`,
    `Read task: ${taskPath}`,
  ];
  if (gsd?.useInClaudePrompt && gsd?.instruction) {
    lines.push(gsd.instruction);
  }
  lines.push(
    "",
    "Implement the task scope and write report ONLY to:",
    reportPath,
    "",
    "Report template:",
    "# Raport: <task-id>",
    "",
    "Status: OK | PYTANIE | BLOKADA",
    "",
    "## Wynik weryfikacji",
    "- npm run build: OK/BLOKADA/NIEDOTYCZY",
    "- npm run lint: OK/BLOKADA/NIEDOTYCZY",
    "",
    "## Lista zmian w plikach",
    "",
    "## Problemy napotkane",
  );
  return lines.join("\n");
}

function claudeVerifyPrompt(taskPath, reportPath, checksSummary, gsd) {
  const lines = [
    "You are Cloud Code verification agent.",
    `Read task: ${taskPath}`,
    `Read implementation report: ${reportPath}`,
  ];
  if (gsd?.useInClaudePrompt && gsd?.instruction) {
    lines.push(gsd.instruction);
  }
  lines.push(
    "",
    "Local checks:",
    checksSummary,
    "",
    "Return ONLY JSON with this schema:",
    "{",
    '  "verdict": "accept" | "reject" | "needs_human",',
    '  "reason": "short reason",',
    '  "next_task_title": "optional",',
    '  "next_task_slug": "optional",',
    '  "next_task_markdown": "optional full markdown"',
    "}",
  );
  return lines.join("\n");
}

async function runCodex(ctx, task) {
  const args = ["exec", "--sandbox", "workspace-write", "--cd", root];
  const lastMessagePath = path.join(ctx.codexOutputDir, `${task.base}.last-message.md`);
  await ensureDir(ctx.codexOutputDir);
  if (ctx.config.models.codex) args.push("--model", ctx.config.models.codex);
  args.push("--output-last-message", lastMessagePath);
  args.push(codexExecutePrompt(task.taskPath, task.reportPath, ctx.protocolPath));

  await appendLog(ctx, "codex_start", { task: task.base });
  const out = await runProcess(ctx.config.commands.codexBin, args, {
    timeoutMs: ctx.config.timeouts.codexSeconds * 1000,
    env: { ...process.env, FORCE_COLOR: "0" },
  });
  await appendLog(ctx, "codex_end", { task: task.base, exitCode: out.code, timedOut: out.timedOut });
  return { ...out, lastMessagePath };
}

async function runClaudeExecute(ctx, task) {
  const args = ["-p", "--output-format", "text"];
  if (ctx.config.models.claude) args.push("--model", ctx.config.models.claude);
  args.push(claudeExecutePrompt(task.taskPath, task.reportPath, ctx.protocolPath, ctx.config.gsd));

  await appendLog(ctx, "claude_execute_start", { task: task.base });
  const out = await runProcess(ctx.config.commands.claudeBin, args, {
    timeoutMs: ctx.config.timeouts.claudeSeconds * 1000,
    env: { ...process.env, FORCE_COLOR: "0" },
  });
  await appendLog(ctx, "claude_execute_end", { task: task.base, exitCode: out.code, timedOut: out.timedOut });
  return out;
}

async function runChecks(ctx) {
  const checks = [];
  for (const command of ctx.config.checks) {
    const out = await runShell(command, {
      timeoutMs: ctx.config.timeouts.checkSeconds * 1000,
    });
    checks.push({ command, ...out });
    await appendLog(ctx, "check_result", { command, exitCode: out.code, timedOut: out.timedOut });
  }
  return checks;
}

function checksSummary(checks) {
  if (!checks.length) return "- no checks configured";
  return checks.map((c) => `- ${c.command}: ${c.code === 0 ? "OK" : "FAIL"} (exit ${c.code})`).join("\n");
}

async function runClaudeVerify(ctx, task, checks) {
  const args = ["-p", "--output-format", "text"];
  if (ctx.config.models.claude) args.push("--model", ctx.config.models.claude);
  args.push(claudeVerifyPrompt(task.taskPath, task.reportPath, checksSummary(checks), ctx.config.gsd));

  await appendLog(ctx, "claude_verify_start", { task: task.base });
  const out = await runProcess(ctx.config.commands.claudeBin, args, {
    timeoutMs: ctx.config.timeouts.claudeSeconds * 1000,
    env: { ...process.env, FORCE_COLOR: "0" },
  });
  await appendLog(ctx, "claude_verify_end", { task: task.base, exitCode: out.code, timedOut: out.timedOut });
  return { ...out, parsed: parseJsonLoose(out.stdout) };
}

async function writeVerifyArtifacts(ctx, task, checks, verifyResult, mode) {
  const lines = [];
  lines.push(`# Verify: ${task.base}`);
  lines.push("");
  lines.push(`Timestamp: ${nowIso()}`);
  lines.push(`Mode: ${mode}`);
  lines.push("");
  lines.push("## Checks");
  for (const c of checks) {
    lines.push(`- ${c.command}: ${c.code === 0 ? "OK" : "FAIL"} (exit ${c.code})`);
  }
  lines.push("");
  lines.push("## Claude verdict");
  lines.push(`- verdict: ${verifyResult.parsed?.verdict || "needs_human"}`);
  lines.push(`- reason: ${verifyResult.parsed?.reason || "missing or invalid JSON output"}`);
  lines.push("");
  lines.push("## Raw output");
  lines.push("```text");
  lines.push((verifyResult.stdout || "").trim() || "(empty)");
  lines.push("```");

  await fsp.writeFile(task.verifyPath, `${lines.join("\n")}\n`, "utf8");
  await fsp.writeFile(
    task.verifyJsonPath,
    JSON.stringify(
      {
        timestamp: nowIso(),
        task: task.base,
        mode,
        checks: checks.map((c) => ({ command: c.command, code: c.code, timedOut: c.timedOut })),
        claude: {
          code: verifyResult.code,
          timedOut: verifyResult.timedOut,
          parsed: verifyResult.parsed,
          raw: verifyResult.stdout,
        },
      },
      null,
      2,
    ),
    "utf8",
  );
}

async function maybeCreateNextTask(ctx, parsed) {
  if (!ctx.config.safety.autoCreateNextTask) return null;
  if (!parsed?.next_task_markdown) return null;

  const files = await listTaskFiles(ctx);
  const maxNumber = files.reduce((acc, file) => Math.max(acc, parseTaskNumber(file)), 0);
  const nextNo = String(maxNumber + 1).padStart(3, "0");
  const slug = sanitizeSlug(parsed.next_task_slug || parsed.next_task_title || "next-task");
  const name = `${nextNo}-${slug}.md`;
  await fsp.writeFile(path.join(ctx.tasksDir, name), `${parsed.next_task_markdown.trim()}\n`, "utf8");
  return name;
}

async function markCompleted(ctx, task) {
  const current = await readCompleted(ctx);
  const set = new Set(current.completed || []);
  set.add(task.base);
  await writeCompleted(ctx, { completed: [...set].sort() });
}

async function archiveArtifacts(ctx, task) {
  const targets = [
    [task.reportPath, path.join(ctx.archivedDir, `${task.base}.done.md`)],
    [task.verifyPath, path.join(ctx.archivedDir, `${task.base}.verify.md`)],
    [task.verifyJsonPath, path.join(ctx.archivedDir, `${task.base}.verify.json`)],
  ];

  for (const [from, to] of targets) {
    if (await exists(from)) {
      await fsp.rename(from, to);
    }
  }
}

async function writeLastRun(ctx, payload) {
  await fsp.writeFile(ctx.lastRunPath, JSON.stringify(payload, null, 2), "utf8");
}

async function executeTaskInMode(ctx, task, mode) {
  if (mode === "manual-pause") {
    return { status: "paused", reason: "manual pause mode" };
  }

  if (!(await exists(task.reportPath))) {
    if (mode === "auto" || mode === "codex-only") {
      const out = await runCodex(ctx, task);
      if (!(await exists(task.reportPath)) && await exists(out.lastMessagePath)) {
        const lastMessage = await fsp.readFile(out.lastMessagePath, "utf8");
        const normalized = normalizeReportText(task.base, lastMessage);
        await fsp.writeFile(task.reportPath, normalized, "utf8");
        await appendLog(ctx, "codex_report_fallback_written", {
          task: task.base,
          source: out.lastMessagePath,
        });
      }
      if (out.code !== 0) return { status: "codex_failed", exitCode: out.code };
    } else if (mode === "claude-only") {
      const out = await runClaudeExecute(ctx, task);
      if (out.code !== 0) return { status: "claude_execute_failed", exitCode: out.code };
    }
  }

  if (!(await exists(task.reportPath))) {
    return { status: "missing_report" };
  }

  return { status: "executed" };
}

async function runOne(ctx) {
  const effective = await resolveEffectiveMode(ctx);
  const mode = effective.mode;

  if (mode === "manual-pause") {
    await writeLastRun(ctx, {
      timestamp: nowIso(),
      status: "paused",
      reason: "manual-pause mode",
      health: effective.health,
    });
    return { status: "paused", mode };
  }

  const task = await pickPendingTask(ctx);
  if (!task) {
    await writeLastRun(ctx, {
      timestamp: nowIso(),
      status: "idle",
      message: "No pending tasks",
      mode,
      health: effective.health,
    });
    return { status: "idle", mode };
  }

  await appendLog(ctx, "task_picked", { task: task.base, mode });

  const execute = await executeTaskInMode(ctx, task, mode);
  if (execute.status !== "executed") {
    await writeLastRun(ctx, {
      timestamp: nowIso(),
      status: execute.status,
      task: task.base,
      mode,
      health: effective.health,
    });
    return { ...execute, task: task.base, mode };
  }

  const checks = await runChecks(ctx);
  const checksFailed = checks.some((c) => c.code !== 0);

  if (mode === "codex-only") {
    await writeLastRun(ctx, {
      timestamp: nowIso(),
      status: checksFailed ? "needs_human" : "needs_claude_verify",
      task: task.base,
      mode,
      checksFailed,
    });
    return {
      status: checksFailed ? "needs_human" : "needs_claude_verify",
      task: task.base,
      mode,
    };
  }

  const verify = await runClaudeVerify(ctx, task, checks);
  await writeVerifyArtifacts(ctx, task, checks, verify, mode);

  const verdict = verify.parsed?.verdict || "needs_human";
  const acceptedByClaude = verdict === "accept";
  const accepted = ctx.config.safety.requireClaudeAcceptance ? acceptedByClaude && !checksFailed : !checksFailed;

  if (!accepted) {
    await writeLastRun(ctx, {
      timestamp: nowIso(),
      status: "needs_human",
      task: task.base,
      mode,
      verdict,
      checksFailed,
    });
    return { status: "needs_human", task: task.base, mode, verdict };
  }

  const nextTask = await maybeCreateNextTask(ctx, verify.parsed);
  await archiveArtifacts(ctx, task);
  await markCompleted(ctx, task);

  await writeLastRun(ctx, {
    timestamp: nowIso(),
    status: "completed",
    task: task.base,
    mode,
    verdict,
    nextTask: nextTask || null,
  });

  return { status: "completed", task: task.base, mode, nextTask: nextTask || null };
}

async function printStatus(ctx) {
  const taskFiles = await listTaskFiles(ctx);
  const completed = await readCompleted(ctx);
  const completedSet = new Set(completed.completed || []);
  let pending = 0;
  for (const file of taskFiles) {
    const base = file.replace(/\.md$/, "");
    if (completedSet.has(base)) continue;
    if (await isTaskArchived(ctx, base)) continue;
    pending += 1;
  }

  const reports = (await fsp.readdir(ctx.reportsDir, { withFileTypes: true }))
    .filter((e) => e.isFile())
    .map((e) => e.name);

  const lastRun = await readJson(ctx.lastRunPath, null);
  const lock = await readJson(ctx.lockPath, null);
  const mode = await getMode(ctx);
  const health = await readJson(ctx.healthPath, null);

  process.stdout.write(
    `${JSON.stringify(
      {
        timestamp: nowIso(),
        mode,
        pending,
        completed: completedSet.size,
        reportsInQueue: reports.length,
        lock,
        health,
        lastRun,
      },
      null,
      2,
    )}\n`,
  );
}

async function bootstrapStateNotes(ctx) {
  const readmePath = path.join(ctx.stateDir, "README.md");
  if (await exists(readmePath)) return;

  const content = [
    "# AI Bridge State",
    "",
    "- `mode.json` - current orchestration mode.",
    "- `bridge.lock.json` - active lock for loop/run-once.",
    "- `completed-tasks.json` - completed task ids.",
    "- `last-run.json` - last execution summary.",
    "- `health.json` - latest CLI health probe.",
  ].join("\n");

  await fsp.writeFile(readmePath, `${content}\n`, "utf8");
}

async function runWithLock(ctx, fn) {
  const locked = await acquireLock(ctx);
  if (!locked) {
    process.stderr.write("Bridge is locked. Use ai:unlock if this is a stale lock.\n");
    process.exit(2);
  }

  try {
    return await fn();
  } finally {
    await releaseLock(ctx);
  }
}

async function main() {
  const cmd = process.argv[2] || "status";
  const modeArg = process.argv[3];
  const ctx = await loadContext();

  await bootstrapStateNotes(ctx);

  if (cmd === "status") {
    await printStatus(ctx);
    return;
  }

  if (cmd === "unlock") {
    await releaseLock(ctx);
    await appendLog(ctx, "manual_unlock", { byPid: process.pid });
    process.stdout.write("Lock removed.\n");
    return;
  }

  if (cmd === "health") {
    const health = await probeHealth(ctx);
    process.stdout.write(`${JSON.stringify(health, null, 2)}\n`);
    return;
  }

  if (cmd === "mode") {
    if (!modeArg) {
      process.stdout.write(`${JSON.stringify(await getMode(ctx), null, 2)}\n`);
      return;
    }
    const next = await setMode(ctx, modeArg, "manual mode change", "user");
    process.stdout.write(`${JSON.stringify(next, null, 2)}\n`);
    return;
  }

  if (cmd === "run-once") {
    const result = await runWithLock(ctx, () => runOne(ctx));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  if (cmd === "loop") {
    await runWithLock(ctx, async () => {
      let iteration = 0;
      while (true) {
        iteration += 1;
        const result = await runOne(ctx);
        await appendLog(ctx, "loop_iteration", { iteration, result });

        if (iteration >= ctx.config.safety.maxAutoTasksPerRun) {
          process.stdout.write("Loop finished by maxAutoTasksPerRun.\n");
          break;
        }

        await sleep(ctx.config.pollIntervalSeconds * 1000);
      }
    });
    return;
  }

  process.stderr.write("Unknown command. Use: status | run-once | loop | unlock | mode [value] | health\n");
  process.exit(1);
}

main().catch((err) => {
  process.stderr.write(`${String(err?.stack || err)}\n`);
  process.exit(1);
});
