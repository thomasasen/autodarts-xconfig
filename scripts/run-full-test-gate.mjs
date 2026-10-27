import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const reportDirectory = resolve(repositoryRoot, "reports", "test-quality");
const timestamp = new Date().toISOString().replaceAll(":", "-");
const errorReportPath = resolve(reportDirectory, `quality-error-${timestamp}.log`);
const maximumErrorOutputLength = 6_000;
const progressBarWidth = 24;
const heartbeatIntervalMs = 30_000;
const npmCliPath = process.env.npm_execpath;
const scripts = [
  "lint",
  "check:agents",
  "check:darts",
  "test:local",
  "test:coverage:domain",
  "test:e2e",
  "test:mutation:domain",
  "sonar",
];

function output(message) {
  process.stdout.write(message);
}

function showProgress(completedSteps, status) {
  const fraction = completedSteps / scripts.length;
  const filled = Math.round(fraction * progressBarWidth);
  const percentage = Math.round(fraction * 100);
  const bar = `${"█".repeat(filled)}${"░".repeat(progressBarWidth - filled)}`;
  output(`[${bar}] ${completedSteps}/${scripts.length} ${percentage}% | ${status}\n`);
}

function formatDuration(durationMs) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function runScript(scriptName, stepIndex) {
  return new Promise((resolveRun, rejectRun) => {
    const startedAt = Date.now();
    let lastOutputAt = startedAt;
    let recentOutput = "";
    let outputWasTruncated = false;
    const captureOutput = (chunk) => {
      const message = chunk.toString();
      output(message);
      lastOutputAt = Date.now();
      recentOutput += message;
      if (recentOutput.length > maximumErrorOutputLength) {
        outputWasTruncated = true;
        recentOutput = recentOutput.slice(-maximumErrorOutputLength);
      }
    };

    const progress = `[${stepIndex + 1}/${scripts.length}]`;
    output(`\n${progress} RUNNING npm run ${scriptName}\n`);
    showProgress(stepIndex, `RUNNING ${scriptName}`);
    if (!npmCliPath) {
      rejectRun(new Error("npm_execpath is unavailable; start this runner through npm."));
      return;
    }
    const child = spawn(process.execPath, [npmCliPath, "run", scriptName], {
      cwd: repositoryRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    const heartbeat = setInterval(() => {
      const now = Date.now();
      const silentForMs = now - lastOutputAt;
      if (silentForMs >= heartbeatIntervalMs) {
        output(
          `${progress} STILL RUNNING ${scriptName} | elapsed ${formatDuration(now - startedAt)} | ` +
            `no output for ${formatDuration(silentForMs)}\n`
        );
      }
    }, heartbeatIntervalMs);
    heartbeat.unref();

    child.stdout.on("data", captureOutput);
    child.stderr.on("data", captureOutput);
    child.on("error", (error) => {
      clearInterval(heartbeat);
      rejectRun(error);
    });
    child.on("close", (exitCode) => {
      clearInterval(heartbeat);
      const normalizedExitCode = exitCode ?? 1;
      const status = normalizedExitCode === 0 ? "PASSED" : "FAILED";
      output(`${progress} ${status} npm run ${scriptName} (exit ${normalizedExitCode})\n`);
      showProgress(stepIndex + 1, `${status} ${scriptName}`);
      resolveRun({
        scriptName,
        exitCode: normalizedExitCode,
        durationMs: Date.now() - startedAt,
        recentOutput,
        outputWasTruncated,
      });
    });
  });
}

function writeErrorReport(results) {
  mkdirSync(reportDirectory, { recursive: true });
  const failures = results.filter((result) => result.exitCode !== 0);
  const sections = failures.map((result) => {
    const truncationNote = result.outputWasTruncated
      ? `Only the final ${maximumErrorOutputLength} characters are included.\n\n`
      : "";
    return [
      `FAILED: npm run ${result.scriptName}`,
      `Exit code: ${result.exitCode}`,
      "",
      truncationNote + result.recentOutput,
    ].join("\n");
  });
  writeFileSync(
    errorReportPath,
    [`Quality gate failures: ${failures.length}`, `Finished: ${new Date().toISOString()}`, "", ...sections].join(
      "\n\n"
    ),
    "utf8"
  );
}

let exitCode = 0;
const results = [];
for (const [stepIndex, scriptName] of scripts.entries()) {
  try {
    const result = await runScript(scriptName, stepIndex);
    results.push(result);
    if (result.exitCode !== 0) {
      exitCode = 1;
    }
  } catch (error) {
    exitCode = 1;
    const errorText = error instanceof Error ? error.stack : String(error);
    output(`\n[${stepIndex + 1}/${scripts.length}] FAILED npm run ${scriptName}\n${errorText}\n`);
    showProgress(stepIndex + 1, `FAILED ${scriptName}`);
    results.push({
      scriptName,
      exitCode: 1,
      durationMs: 0,
      recentOutput: errorText,
      outputWasTruncated: false,
    });
  }
}

output("\nQuality gate summary:\n");
results.forEach((result) => {
  const status = result.exitCode === 0 ? "PASSED" : "FAILED";
  output(`- ${result.scriptName}: ${status} (${(result.durationMs / 1000).toFixed(1)}s)\n`);
});
if (exitCode === 0) {
  output("\nFULL QUALITY GATE PASSED\nNo error log was created.\n");
} else {
  writeErrorReport(results);
  output(`\nFULL QUALITY GATE FAILED\nError log: ${errorReportPath}\n`);
}
process.exitCode = exitCode;
