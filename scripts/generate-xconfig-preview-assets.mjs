import { mkdir } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  XCONFIG_ANIMATED_PREVIEW_FEATURE_KEYS,
  XCONFIG_PREVIEW_ASSET_FILES,
} from "../src/shared/xconfig-preview-assets.manifest.js";
import { checkXConfigPreviewAssets } from "./check-xconfig-preview-assets.mjs";
import {
  XCONFIG_PREVIEW_SOURCE_FILES,
  XCONFIG_PREVIEW_SOURCE_START_SECONDS,
} from "./xconfig-preview-sources.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const screenshotDirectory = path.join(repositoryRoot, "docs", "screenshots");
const previewDirectory = path.join(repositoryRoot, "src", "assets", "xconfig-previews");
const animatedKeys = new Set(XCONFIG_ANIMATED_PREVIEW_FEATURE_KEYS);

function buildFfmpegArgs(inputPath, outputPath, animated, startSeconds = 0) {
  const scale = animated
    ? "fps=6,scale=w=400:h=225:force_original_aspect_ratio=decrease:flags=lanczos"
    : "scale=w=640:h=360:force_original_aspect_ratio=decrease:flags=lanczos";
  return [
    "-hide_banner",
    "-loglevel", "error",
    "-y",
    "-i", inputPath,
    ...(startSeconds > 0 ? ["-ss", String(startSeconds)] : []),
    "-vf", scale,
    ...(animated ? [] : ["-frames:v", "1"]),
    "-an",
    "-c:v", "libwebp",
    "-quality", animated ? "45" : "72",
    "-compression_level", "6",
    "-preset", "picture",
    ...(animated ? ["-loop", "0"] : []),
    outputPath,
  ];
}

const compareKeys = (left, right) => left.localeCompare(right);
const runtimeKeys = Object.keys(XCONFIG_PREVIEW_ASSET_FILES).sort(compareKeys);
const sourceKeys = Object.keys(XCONFIG_PREVIEW_SOURCE_FILES).sort(compareKeys);
if (JSON.stringify(runtimeKeys) !== JSON.stringify(sourceKeys)) {
  throw new Error("Runtime preview manifest and source preview manifest are out of sync");
}

await mkdir(previewDirectory, { recursive: true });
for (const featureKey of runtimeKeys) {
  const inputPath = path.join(screenshotDirectory, XCONFIG_PREVIEW_SOURCE_FILES[featureKey]);
  const outputPath = path.join(previewDirectory, XCONFIG_PREVIEW_ASSET_FILES[featureKey]);
  const result = spawnSync(
    "ffmpeg",
    buildFfmpegArgs(
      inputPath,
      outputPath,
      animatedKeys.has(featureKey),
      Number(XCONFIG_PREVIEW_SOURCE_START_SECONDS[featureKey]) || 0
    ),
    { cwd: repositoryRoot, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
  );
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed for ${featureKey}: ${String(result.stderr || "").trim()}`);
  }
}

const checkResult = await checkXConfigPreviewAssets();
console.log(`Generated ${checkResult.entries.length} previews (${checkResult.totalBytes} bytes).`);
