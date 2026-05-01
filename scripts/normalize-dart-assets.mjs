#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { deflateSync, inflateSync } from "node:zlib";

import {
  DART_IMAGE_SOURCE_HEIGHT,
  DART_IMAGE_SOURCE_WIDTH,
  DART_IMAGE_TIP_Y,
} from "../src/features/dart-marker-darts/logic.js";

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const targetDirectory = path.resolve(process.cwd(), "src", "assets", "darts");
const alphaThreshold = 40;
const tipBandWidth = 4;
const tipTolerancePx = 0.5;

function parseArgs(argv) {
  const args = new Set(argv);
  if (args.has("--help") || args.has("-h")) {
    return { mode: "help" };
  }
  if (args.has("--write") && args.has("--check")) {
    throw new Error("Use either --check or --write, not both.");
  }
  return {
    mode: args.has("--write") ? "write" : "check",
  };
}

function printHelp() {
  console.log(`Usage: node scripts/normalize-dart-assets.mjs [--check|--write]

Checks or normalizes PNG dart images in src/assets/darts.

--check  Verify that every Dart_*.png uses ${DART_IMAGE_SOURCE_WIDTH}x${DART_IMAGE_SOURCE_HEIGHT}
         and has its tip at x=0, y=${DART_IMAGE_TIP_Y}. This is the default.
--write  Move visible pixels onto the shared transparent canvas and rewrite only
         images that are not already normalized.
`);
}

function paethPredictor(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);

  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) {
    return left;
  }
  return upDistance <= upLeftDistance ? up : upLeft;
}

function readChunk(buffer, offset) {
  const length = buffer.readUInt32BE(offset);
  const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
  const dataStart = offset + 8;
  const dataEnd = dataStart + length;
  return {
    length,
    type,
    data: buffer.subarray(dataStart, dataEnd),
    nextOffset: dataEnd + 4,
  };
}

function parseRgbaPng(buffer, fileName) {
  if (!buffer.subarray(0, 8).equals(pngSignature)) {
    throw new Error(`${fileName}: not a PNG file.`);
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const chunk = readChunk(buffer, offset);
    if (chunk.type === "IHDR") {
      width = chunk.data.readUInt32BE(0);
      height = chunk.data.readUInt32BE(4);
      bitDepth = chunk.data.readUInt8(8);
      colorType = chunk.data.readUInt8(9);
    } else if (chunk.type === "IDAT") {
      idatChunks.push(chunk.data);
    } else if (chunk.type === "IEND") {
      break;
    }
    offset = chunk.nextOffset;
  }

  if (bitDepth !== 8 || colorType !== 6) {
    throw new Error(`${fileName}: expected 8-bit RGBA PNG, got bitDepth=${bitDepth}, colorType=${colorType}.`);
  }

  const stride = width * 4;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  const pixels = new Uint8Array(height * stride);
  let sourceOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    const rowOffset = y * stride;
    const previousRowOffset = rowOffset - stride;

    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[sourceOffset];
      sourceOffset += 1;
      const left = x >= 4 ? pixels[rowOffset + x - 4] : 0;
      const up = y > 0 ? pixels[previousRowOffset + x] : 0;
      const upLeft = y > 0 && x >= 4 ? pixels[previousRowOffset + x - 4] : 0;

      if (filter === 0) {
        pixels[rowOffset + x] = raw;
      } else if (filter === 1) {
        pixels[rowOffset + x] = (raw + left) & 0xff;
      } else if (filter === 2) {
        pixels[rowOffset + x] = (raw + up) & 0xff;
      } else if (filter === 3) {
        pixels[rowOffset + x] = (raw + Math.floor((left + up) / 2)) & 0xff;
      } else if (filter === 4) {
        pixels[rowOffset + x] = (raw + paethPredictor(left, up, upLeft)) & 0xff;
      } else {
        throw new Error(`${fileName}: unsupported PNG filter ${filter}.`);
      }
    }
  }

  return { width, height, pixels };
}

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < table.length; i += 1) {
    let value = i;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[i] = value >>> 0;
  }
  return table;
}

const crcTable = makeCrcTable();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return chunk;
}

function encodeRgbaPng(image) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(image.width, 0);
  header.writeUInt32BE(image.height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const stride = image.width * 4;
  const scanlines = Buffer.alloc(image.height * (stride + 1));
  for (let y = 0; y < image.height; y += 1) {
    const targetOffset = y * (stride + 1);
    scanlines[targetOffset] = 0;
    scanlines.set(image.pixels.subarray(y * stride, (y + 1) * stride), targetOffset + 1);
  }

  return Buffer.concat([
    pngSignature,
    createChunk("IHDR", header),
    createChunk("IDAT", deflateSync(scanlines, { level: 9 })),
    createChunk("IEND", Buffer.alloc(0)),
  ]);
}

function estimateTip(image, fileName) {
  let minX = Number.POSITIVE_INFINITY;
  const visiblePixels = [];

  for (let y = 0; y < image.height; y += 1) {
    const rowOffset = y * image.width * 4;
    for (let x = 0; x < image.width; x += 1) {
      const alpha = image.pixels[rowOffset + x * 4 + 3];
      if (alpha > alphaThreshold) {
        minX = Math.min(minX, x);
        visiblePixels.push({ x, y, alpha });
      }
    }
  }

  if (!Number.isFinite(minX)) {
    throw new Error(`${fileName}: no visible dart pixels found.`);
  }

  const tipPixels = visiblePixels.filter((pixel) => pixel.x <= minX + tipBandWidth - 1);
  const alphaTotal = tipPixels.reduce((total, pixel) => total + pixel.alpha, 0);
  if (alphaTotal <= 0) {
    throw new Error(`${fileName}: no visible tip pixels found.`);
  }

  return {
    x: minX,
    y: tipPixels.reduce((total, pixel) => total + pixel.y * pixel.alpha, 0) / alphaTotal,
  };
}

function getVisibleBounds(image, fileName) {
  const bounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  for (let y = 0; y < image.height; y += 1) {
    const rowOffset = y * image.width * 4;
    for (let x = 0; x < image.width; x += 1) {
      if (image.pixels[rowOffset + x * 4 + 3] === 0) {
        continue;
      }
      bounds.minX = Math.min(bounds.minX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
  }

  if (!Number.isFinite(bounds.minX)) {
    throw new Error(`${fileName}: no non-transparent pixels found.`);
  }

  return bounds;
}

function needsNormalization(image, tip) {
  return (
    image.width !== DART_IMAGE_SOURCE_WIDTH ||
    image.height !== DART_IMAGE_SOURCE_HEIGHT ||
    tip.x !== 0 ||
    Math.abs(tip.y - DART_IMAGE_TIP_Y) > tipTolerancePx
  );
}

function normalizeImage(image, fileName) {
  const tip = estimateTip(image, fileName);
  const bounds = getVisibleBounds(image, fileName);
  const shiftX = -tip.x;
  const shiftY = Math.round(DART_IMAGE_TIP_Y - tip.y);

  if (
    bounds.minX + shiftX < 0 ||
    bounds.minY + shiftY < 0 ||
    bounds.maxX + shiftX >= DART_IMAGE_SOURCE_WIDTH ||
    bounds.maxY + shiftY >= DART_IMAGE_SOURCE_HEIGHT
  ) {
    throw new Error(
      `${fileName}: normalization would clip visible pixels. ` +
        `Bounds ${JSON.stringify(bounds)}, shift x=${shiftX}, y=${shiftY}.`
    );
  }

  const pixels = new Uint8Array(DART_IMAGE_SOURCE_WIDTH * DART_IMAGE_SOURCE_HEIGHT * 4);
  for (let y = 0; y < image.height; y += 1) {
    const targetY = y + shiftY;
    if (targetY < 0 || targetY >= DART_IMAGE_SOURCE_HEIGHT) {
      continue;
    }
    for (let x = 0; x < image.width; x += 1) {
      const targetX = x + shiftX;
      if (targetX < 0 || targetX >= DART_IMAGE_SOURCE_WIDTH) {
        continue;
      }
      const sourceOffset = (y * image.width + x) * 4;
      const targetOffset = (targetY * DART_IMAGE_SOURCE_WIDTH + targetX) * 4;
      pixels[targetOffset] = image.pixels[sourceOffset];
      pixels[targetOffset + 1] = image.pixels[sourceOffset + 1];
      pixels[targetOffset + 2] = image.pixels[sourceOffset + 2];
      pixels[targetOffset + 3] = image.pixels[sourceOffset + 3];
    }
  }

  return {
    width: DART_IMAGE_SOURCE_WIDTH,
    height: DART_IMAGE_SOURCE_HEIGHT,
    pixels,
  };
}

function collectDartAssetFiles() {
  return readdirSync(targetDirectory)
    .filter((fileName) => /^Dart_.*\.png$/i.test(fileName))
    .sort();
}

function formatTip(tip) {
  return `x=${tip.x}, y=${tip.y.toFixed(2)}`;
}

function main() {
  const { mode } = parseArgs(process.argv.slice(2));
  if (mode === "help") {
    printHelp();
    return;
  }

  let failureCount = 0;
  let rewriteCount = 0;
  const fileNames = collectDartAssetFiles();

  for (const fileName of fileNames) {
    const filePath = path.join(targetDirectory, fileName);
    try {
      const original = readFileSync(filePath);
      const image = parseRgbaPng(original, fileName);
      const tip = estimateTip(image, fileName);

      if (!needsNormalization(image, tip)) {
        console.log(`${fileName}: ok (${image.width}x${image.height}, ${formatTip(tip)})`);
        continue;
      }

      if (mode === "check") {
        failureCount += 1;
        console.error(`${fileName}: needs normalization (${image.width}x${image.height}, ${formatTip(tip)})`);
        continue;
      }

      const normalizedImage = normalizeImage(image, fileName);
      const normalizedTip = estimateTip(normalizedImage, fileName);
      if (needsNormalization(normalizedImage, normalizedTip)) {
        throw new Error(`${fileName}: normalization failed (${formatTip(normalizedTip)}).`);
      }

      const normalizedPng = encodeRgbaPng(normalizedImage);
      if (!normalizedPng.equals(original)) {
        writeFileSync(filePath, normalizedPng);
        rewriteCount += 1;
      }
      console.log(`${fileName}: normalized (${formatTip(tip)} -> ${formatTip(normalizedTip)})`);
    } catch (error) {
      failureCount += 1;
      console.error(error.message);
    }
  }

  if (failureCount > 0) {
    console.error(`Dart asset normalization failed for ${failureCount} file(s).`);
    process.exit(1);
  }

  if (mode === "write") {
    console.log(`Dart asset normalization complete; rewrote ${rewriteCount} file(s).`);
  } else {
    console.log(`Dart asset normalization check passed for ${fileNames.length} file(s).`);
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
