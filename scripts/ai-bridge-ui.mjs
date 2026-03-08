#!/usr/bin/env node

import fsp from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { spawn } from "node:child_process";

const root = process.cwd();
const configPath = path.join(root, "scripts", "ai-bridge.config.json");
const modePath = path.join(root, ".codex", "state", "mode.json");
const validModes = ["auto", "codex-only", "claude-only", "manual-pause"];

function modeLabel(mode) {
  switch (mode) {
    case "auto":
      return "AUTO (Codex execute + Cloud verify)";
    case "codex-only":
      return "CODEX-ONLY (bez Claude verify)";
    case "claude-only":
      return "CLAUDE-ONLY (Cloud execute + verify)";
    case "manual-pause":
      return "PAUSE (wstrzymany bridge)";
    default:
      return mode;
  }
}

function mark(checked) {
  return checked ? "[x]" : "[ ]";
}

async function readJson(file, fallback) {
  try {
    const raw = await fsp.readFile(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(file, value) {
  await fsp.writeFile(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function runCommand(command) {
  return new Promise((resolve) => {
    const child = spawn("/bin/zsh", ["-lc", command], {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });

    child.on("error", (err) => {
      resolve({ code: 1, stdout, stderr: `${stderr}\n${String(err)}` });
    });
  });
}

async function saveState(state) {
  const cfg = await readJson(configPath, null);
  if (!cfg) {
    throw new Error("Brak pliku scripts/ai-bridge.config.json");
  }

  cfg.gsd = cfg.gsd || {};
  cfg.safety = cfg.safety || {};

  cfg.gsd.useInClaudePrompt = state.useGsd;
  cfg.safety.requireClaudeAcceptance = state.requireClaudeAcceptance;
  cfg.safety.autoCreateNextTask = state.autoCreateNextTask;

  await writeJson(configPath, cfg);
  return runCommand(`node scripts/ai-bridge.mjs mode ${state.mode}`);
}

function printHelp() {
  const lines = [
    "AI Bridge UI",
    "",
    "Uruchomienie:",
    "  npm run ai:ui",
    "",
    "Opcje:",
    "  1-4  wybierz tryb (radio)",
    "  5    toggle GSD prompt",
    "  6    toggle require Claude acceptance",
    "  7    toggle auto create next task",
    "  8    zapisz ustawienia",
    "  9    status",
    "  10   health",
    "  11   run once",
    "  12   unlock",
    "  0    wyjscie",
  ];
  process.stdout.write(lines.join("\n") + "\n");
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    return;
  }

  const cfg = await readJson(configPath, null);
  if (!cfg) {
    throw new Error("Nie znaleziono scripts/ai-bridge.config.json");
  }

  const modeState = await readJson(modePath, { mode: cfg.mode?.default || "auto" });
  const state = {
    mode: validModes.includes(modeState.mode) ? modeState.mode : "auto",
    useGsd: Boolean(cfg.gsd?.useInClaudePrompt),
    requireClaudeAcceptance: cfg.safety?.requireClaudeAcceptance !== false,
    autoCreateNextTask: Boolean(cfg.safety?.autoCreateNextTask),
  };

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  async function pause() {
    await rl.question("\nWcisnij Enter, aby kontynuowac...");
  }

  async function runAndShow(cmd) {
    process.stdout.write(`\n$ ${cmd}\n\n`);
    const out = await runCommand(cmd);
    if (out.stdout.trim()) process.stdout.write(out.stdout + "\n");
    if (out.stderr.trim()) process.stdout.write("[stderr]\n" + out.stderr + "\n");
    process.stdout.write(`\nExit code: ${out.code}\n`);
  }

  while (true) {
    process.stdout.write("\n========================================\n");
    process.stdout.write(" AI Bridge UI (terminal)\n");
    process.stdout.write("========================================\n");
    process.stdout.write("Tryb (wybierz jedna opcje):\n");
    process.stdout.write(`1. ${mark(state.mode === "auto")} ${modeLabel("auto")}\n`);
    process.stdout.write(`2. ${mark(state.mode === "codex-only")} ${modeLabel("codex-only")}\n`);
    process.stdout.write(`3. ${mark(state.mode === "claude-only")} ${modeLabel("claude-only")}\n`);
    process.stdout.write(`4. ${mark(state.mode === "manual-pause")} ${modeLabel("manual-pause")}\n`);
    process.stdout.write("\nUstawienia (checkbox):\n");
    process.stdout.write(`5. ${mark(state.useGsd)} Uzyj GSD prompt dla Cloud Code (opcjonalne)\n`);
    process.stdout.write(`6. ${mark(state.requireClaudeAcceptance)} Wymagaj akceptacji Cloud Code\n`);
    process.stdout.write(`7. ${mark(state.autoCreateNextTask)} Auto tworz kolejny task\n`);
    process.stdout.write("\nAkcje:\n");
    process.stdout.write("8. Zapisz ustawienia\n");
    process.stdout.write("9. Pokaz status\n");
    process.stdout.write("10. Health check CLI\n");
    process.stdout.write("11. Wykonaj jeden cykl (ai:run)\n");
    process.stdout.write("12. Usun lock (ai:unlock)\n");
    process.stdout.write("0. Wyjdz\n");

    const answer = (await rl.question("\nWybierz numer: ")).trim();

    if (answer === "0") break;
    if (answer === "1") state.mode = "auto";
    else if (answer === "2") state.mode = "codex-only";
    else if (answer === "3") state.mode = "claude-only";
    else if (answer === "4") state.mode = "manual-pause";
    else if (answer === "5") state.useGsd = !state.useGsd;
    else if (answer === "6") state.requireClaudeAcceptance = !state.requireClaudeAcceptance;
    else if (answer === "7") state.autoCreateNextTask = !state.autoCreateNextTask;
    else if (answer === "8") {
      const setModeOut = await saveState(state);
      process.stdout.write("\nZapisano ustawienia do config + mode.\n");
      if (setModeOut.stdout.trim()) process.stdout.write(setModeOut.stdout + "\n");
      if (setModeOut.stderr.trim()) process.stdout.write("[stderr]\n" + setModeOut.stderr + "\n");
      process.stdout.write(`Exit code: ${setModeOut.code}\n`);
      await pause();
    } else if (answer === "9") {
      await runAndShow("npm run ai:status");
      await pause();
    } else if (answer === "10") {
      await runAndShow("npm run ai:health");
      await pause();
    } else if (answer === "11") {
      await runAndShow("npm run ai:run");
      await pause();
    } else if (answer === "12") {
      await runAndShow("npm run ai:unlock");
      await pause();
    } else {
      process.stdout.write("\nNieznana opcja.\n");
      await pause();
    }
  }

  rl.close();
  process.stdout.write("\nKoniec AI Bridge UI.\n");
}

main().catch((err) => {
  process.stderr.write(String(err?.stack || err) + "\n");
  process.exit(1);
});
