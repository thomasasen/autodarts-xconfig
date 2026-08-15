import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildUserscriptHeader } from "./userscript-build-config.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");

export const RELEASE_ASSET_NAMES = Object.freeze([
  "autodarts-xconfig.user.js",
  "autodarts-xconfig.meta.js",
]);
export const RAW_META_URL =
  "https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.meta.js";
export const RAW_USER_URL =
  "https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.user.js";
export const RELEASE_USER_URL =
  "https://github.com/thomasasen/autodarts-xconfig/releases/latest/download/autodarts-xconfig.user.js";
export const RELEASE_META_URL =
  "https://github.com/thomasasen/autodarts-xconfig/releases/latest/download/autodarts-xconfig.meta.js";

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;
const RELEASE_CHANNEL_FLOOR = "2.9.2";

export function resolveExpectedDownloadUrl(version) {
  return compareSemver(version, RELEASE_CHANNEL_FLOOR) >= 0 ? RELEASE_USER_URL : RAW_USER_URL;
}

function normalizeNewlines(value) {
  return String(value || "").replaceAll("\r\n", "\n");
}

function readText(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function extractVersion(text, pattern) {
  return String(pattern.exec(String(text || ""))?.[1] || "").trim();
}

function compareSemver(left, right) {
  const leftParts = String(left || "").split(".").map(Number);
  const rightParts = String(right || "").split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (difference !== 0) {
      return difference;
    }
  }
  return 0;
}

function extractHeader(text) {
  return /\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==\n?/.exec(normalizeNewlines(text))?.[0] || "";
}

function escapeRegExp(value) {
  return String(value || "").replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function requireMatch(errors, text, pattern, message) {
  if (!pattern.test(text)) {
    errors.push(message);
  }
}

function validateVersionContract(errors, context) {
  const { packageVersion, packageLock, bootstrap, loader, meta, bundle, tag } = context;
  if (!SEMVER_PATTERN.test(packageVersion)) {
    errors.push(`package.json version is not SemVer: ${packageVersion || "<empty>"}`);
  }

  const versions = new Map([
    ["package-lock root", String(packageLock.version || "").trim()],
    ["package-lock packages['']", String(packageLock.packages?.[""]?.version || "").trim()],
    ["API_VERSION", extractVersion(bootstrap, /export const API_VERSION = "([^"]+)";/)],
    ["loader metadata", extractVersion(loader, /@version\s+([^\s]+)/)],
    ["meta metadata", extractVersion(meta, /@version\s+([^\s]+)/)],
    ["bundle metadata", extractVersion(bundle, /@version\s+([^\s]+)/)],
    ["bundle API_VERSION", extractVersion(bundle, /(?:var|const) API_VERSION = "([^"]+)";/)],
  ]);
  for (const [label, version] of versions) {
    if (version !== packageVersion) {
      errors.push(`${label} version ${version || "<missing>"} does not match ${packageVersion}`);
    }
  }

  if (tag && tag !== `v${packageVersion}`) {
    errors.push(`tag ${tag} does not match package version v${packageVersion}`);
  }
  if (tag && !/^v\d+\.\d+\.\d+$/.test(tag)) {
    errors.push(`tag is not in vX.Y.Z format: ${tag}`);
  }
}

function validateMetadataContract(errors, context) {
  const { packageVersion, expectedDownloadUrl, expectedHeader, loader, meta, bundle } = context;
  for (const [label, contents] of [
    ["loader", loader],
    ["meta", meta],
    ["bundle", bundle],
  ]) {
    requireMatch(
      errors,
      contents,
      new RegExp(String.raw`@updateURL\s+${escapeRegExp(RAW_META_URL)}`),
      `${label} does not use the permanent Raw metadata endpoint`
    );
    requireMatch(
      errors,
      contents,
      new RegExp(String.raw`@downloadURL\s+${escapeRegExp(expectedDownloadUrl)}`),
      `${label} does not use the expected payload endpoint for ${packageVersion}`
    );
    if (extractHeader(contents) !== expectedHeader) {
      errors.push(`${label} header differs from the central userscript build header`);
    }
  }
}

function validateArtifactContract(errors, meta, bundle) {
  if (!normalizeNewlines(meta).trimEnd().endsWith("// ==/UserScript==")) {
    errors.push("dist meta contains payload content instead of metadata only");
  }
  if (!bundle.includes("initializeTampermonkeyRuntime")) {
    errors.push("dist user is not a complete runtime bundle");
  }

  for (const assetName of RELEASE_ASSET_NAMES) {
    const assetPath = path.join(repositoryRoot, "dist", assetName);
    if (!existsSync(assetPath) || !statSync(assetPath).isFile()) {
      errors.push(`release asset is missing: dist/${assetName}`);
    }
  }
}

function validateUpdateCheckContract(errors, updateCheck) {
  if (!updateCheck.includes(RAW_META_URL)) {
    errors.push("update check does not use the permanent Raw metadata endpoint");
  }
  if (!updateCheck.includes(RELEASE_META_URL)) {
    errors.push("update check does not provide the release metadata fallback");
  }
  if (updateCheck.includes(RELEASE_USER_URL)) {
    errors.push("update check source must never reference the release user payload");
  }
}

function validateWorkflowContract(errors, workflowPath) {
  if (!existsSync(workflowPath)) {
    errors.push(".github/workflows/release.yml is missing");
    return;
  }

  const workflow = readFileSync(workflowPath, "utf8");
  const workflowContracts = [
    ["workflow_dispatch", "release workflow has no dry-run trigger"],
    ['tags:\n      - "v*.*.*"', "release workflow has no stable SemVer tag trigger"],
    [
      "concurrency:\n  group: userscript-stable-release\n  cancel-in-progress: false",
      "release workflow does not serialize stable releases",
    ],
    ["contents: write", "release workflow cannot create a draft release"],
    ["--draft", "release workflow does not stage a draft release"],
    ["git diff --exit-code -- dist", "release workflow does not verify reproducible dist output"],
  ];
  for (const [needle, message] of workflowContracts) {
    if (!normalizeNewlines(workflow).includes(needle)) {
      errors.push(message);
    }
  }
  requireMatch(
    errors,
    workflow,
    /validate:[\s\S]*?permissions:\s*\n\s+contents: read[\s\S]*?draft-release:/,
    "release validation job does not use read-only repository permissions"
  );
  requireMatch(
    errors,
    workflow,
    /draft-release:[\s\S]*?permissions:\s*\n\s+contents: write/,
    "draft release job does not have scoped write permission"
  );
  for (const assetName of RELEASE_ASSET_NAMES) {
    if (!workflow.includes(assetName)) {
      errors.push(`release workflow does not reference required asset ${assetName}`);
    }
  }
}

export function validateReleaseContract(options = {}) {
  const errors = [];
  const tag = String(options.tag || "").trim();
  const packageJson = readJson("package.json");
  const packageLock = readJson("package-lock.json");
  const packageVersion = String(packageJson.version || "").trim();
  const bootstrap = readText("src/core/bootstrap.js");
  const loader = readText("loader/autodarts-xconfig.user.js");
  const meta = readText("dist/autodarts-xconfig.meta.js");
  const bundle = readText("dist/autodarts-xconfig.user.js");
  const updateCheck = readText("src/features/xconfig-ui/update-check.js");
  const workflowPath = path.join(repositoryRoot, ".github", "workflows", "release.yml");
  const expectedDownloadUrl = resolveExpectedDownloadUrl(packageVersion);
  const expectedHeader = normalizeNewlines(buildUserscriptHeader(packageVersion));

  const context = {
    packageVersion,
    packageLock,
    bootstrap,
    loader,
    meta,
    bundle,
    tag,
    expectedDownloadUrl,
    expectedHeader,
  };
  validateVersionContract(errors, context);
  validateMetadataContract(errors, context);
  validateArtifactContract(errors, meta, bundle);
  validateUpdateCheckContract(errors, updateCheck);
  validateWorkflowContract(errors, workflowPath);

  return { errors, packageVersion, expectedDownloadUrl };
}

function readCliTag() {
  const tagIndex = process.argv.indexOf("--tag");
  return tagIndex >= 0 ? process.argv[tagIndex + 1] || "" : "";
}

function isCliEntry() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isCliEntry()) {
  const result = validateReleaseContract({ tag: readCliTag() });
  if (result.errors.length) {
    console.error("Release contract check failed:");
    result.errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }
  console.log(
    `Release contract check passed: version=${result.packageVersion}, assets=${RELEASE_ASSET_NAMES.join(",")}.`
  );
}
