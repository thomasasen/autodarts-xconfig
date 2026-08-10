import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  XCONFIG_ANIMATED_PREVIEW_FEATURE_KEYS,
  XCONFIG_PREVIEW_ASSET_FILES,
} from "../src/shared/xconfig-preview-assets.manifest.js";

export const XCONFIG_PREVIEW_MAX_WIDTH = 640;
export const XCONFIG_PREVIEW_MAX_HEIGHT = 360;
export const XCONFIG_PREVIEW_TOTAL_BYTE_BUDGET = 4 * 1024 * 1024;

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const previewDirectory = path.join(repositoryRoot, "src", "assets", "xconfig-previews");

function readUint24Le(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function parseWebp(buffer) {
  if (
    buffer.length < 20 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    throw new Error("invalid WebP RIFF header");
  }

  let width = 0;
  let height = 0;
  let frameCount = 0;
  let animated = false;
  let offset = 12;

  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const payloadOffset = offset + 8;
    if (payloadOffset + chunkSize > buffer.length) {
      throw new Error(`truncated ${chunkType} chunk`);
    }

    if (chunkType === "VP8X" && chunkSize >= 10) {
      animated = Boolean(buffer[payloadOffset] & 0x02);
      width = readUint24Le(buffer, payloadOffset + 4) + 1;
      height = readUint24Le(buffer, payloadOffset + 7) + 1;
    } else if (chunkType === "VP8 " && chunkSize >= 10 && !width && !height) {
      width = buffer.readUInt16LE(payloadOffset + 6) & 0x3fff;
      height = buffer.readUInt16LE(payloadOffset + 8) & 0x3fff;
    } else if (chunkType === "VP8L" && chunkSize >= 5 && !width && !height) {
      const dimensions = buffer.readUInt32LE(payloadOffset + 1);
      width = (dimensions & 0x3fff) + 1;
      height = ((dimensions >>> 14) & 0x3fff) + 1;
    } else if (chunkType === "ANIM") {
      animated = true;
    } else if (chunkType === "ANMF") {
      frameCount += 1;
    }

    offset = payloadOffset + chunkSize + (chunkSize % 2);
  }

  if (!width || !height) {
    throw new Error("missing WebP canvas dimensions");
  }
  return { animated, frameCount: animated ? frameCount : 1, height, width };
}

export async function checkXConfigPreviewAssets() {
  const animatedKeys = new Set(XCONFIG_ANIMATED_PREVIEW_FEATURE_KEYS);
  const entries = [];
  let totalBytes = 0;

  for (const [featureKey, fileName] of Object.entries(XCONFIG_PREVIEW_ASSET_FILES)) {
    const filePath = path.join(previewDirectory, fileName);
    const [buffer, fileStats] = await Promise.all([readFile(filePath), stat(filePath)]);
    const metadata = parseWebp(buffer);
    const shouldAnimate = animatedKeys.has(featureKey);

    if (metadata.width > XCONFIG_PREVIEW_MAX_WIDTH || metadata.height > XCONFIG_PREVIEW_MAX_HEIGHT) {
      throw new Error(`${featureKey}: ${metadata.width}x${metadata.height} exceeds preview bounds`);
    }
    if (shouldAnimate && (!metadata.animated || metadata.frameCount < 2)) {
      throw new Error(`${featureKey}: expected an animated WebP`);
    }
    if (!shouldAnimate && metadata.animated) {
      throw new Error(`${featureKey}: expected a static WebP`);
    }

    totalBytes += fileStats.size;
    entries.push({ featureKey, fileName, ...metadata, bytes: fileStats.size });
  }

  if (totalBytes > XCONFIG_PREVIEW_TOTAL_BYTE_BUDGET) {
    throw new Error(
      `xConfig previews use ${totalBytes} bytes; budget is ${XCONFIG_PREVIEW_TOTAL_BYTE_BUDGET}`
    );
  }

  return Object.freeze({ entries: Object.freeze(entries), totalBytes });
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  const result = await checkXConfigPreviewAssets();
  console.log(`xConfig preview assets: ${result.entries.length} files, ${result.totalBytes} bytes`);
}
