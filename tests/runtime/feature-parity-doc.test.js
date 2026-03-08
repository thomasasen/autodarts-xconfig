import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const matrixPath = path.resolve(process.cwd(), "docs", "LEGACY-PARITY-MATRIX.md");
const matrixText = readFileSync(matrixPath, "utf8");

const featureParityPath = path.resolve(process.cwd(), "docs", "FEATURE-PARITY.md");
const featureParityText = readFileSync(featureParityPath, "utf8");

const LEGACY_USER_SCRIPTS = Object.freeze([
  "Animation/Autodarts Animate Average Trend Arrow.user.js",
  "Animation/Autodarts Animate Checkout Board Targets.user.js",
  "Animation/Autodarts Animate Checkout Score Pulse.user.js",
  "Animation/Autodarts Animate Cricket Grid FX.user.js",
  "Animation/Autodarts Animate Cricket Target Highlighter.user.js",
  "Animation/Autodarts Animate Dart Marker Darts.user.js",
  "Animation/Autodarts Animate Dart Marker Emphasis.user.js",
  "Animation/Autodarts Animate Remove Darts Notification.user.js",
  "Animation/Autodarts Animate Single Bull Sound.user.js",
  "Animation/Autodarts Animate Triple Double Bull Hits.user.js",
  "Animation/Autodarts Animate Turn Points Count.user.js",
  "Animation/Autodarts Animate Turn Start Sweep.user.js",
  "Animation/Autodarts Animate TV Board Zoom.user.js",
  "Animation/Autodarts Animate Winner Fireworks.user.js",
  "Animation/Autodarts Style Checkout Suggestions.user.js",
  "Template/Autodarts Theme Bermuda.user.js",
  "Template/Autodarts Theme Bull-off.user.js",
  "Template/Autodarts Theme Cricket.user.js",
  "Template/Autodarts Theme Shanghai.user.js",
  "Template/Autodarts Theme X01.user.js",
  "Config/AD xConfig.user.js",
  "Config/AD xConfig Auto Loader.user.js",
]);

test("LEGACY-PARITY-MATRIX uses required columns", () => {
  assert.match(matrixText, /\|\s*legacy source file\s*\|/i);
  assert.match(matrixText, /\|\s*new counterpart\s*\|/i);
  assert.match(matrixText, /\|\s*migrated \(yes\/no\/partial\)\s*\|/i);
  assert.match(matrixText, /\|\s*remaining gap\s*\|/i);
  assert.match(matrixText, /\|\s*user-visible difference\s*\|/i);
});

test("LEGACY-PARITY-MATRIX covers all legacy user scripts", () => {
  LEGACY_USER_SCRIPTS.forEach((scriptPath) => {
    assert.match(
      matrixText,
      new RegExp(scriptPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    );
  });
});

test("LEGACY-PARITY-MATRIX includes explicit no/partial statuses", () => {
  assert.match(matrixText, /\|\s*partial\s*\|/i);
  assert.match(matrixText, /\|\s*no\s*\|/i);
});

test("FEATURE-PARITY points to LEGACY-PARITY-MATRIX", () => {
  assert.match(featureParityText, /LEGACY-PARITY-MATRIX\.md/);
});
