import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  DART_IMAGE_SOURCE_HEIGHT,
  DART_IMAGE_SOURCE_WIDTH,
} from "../../src/features/dart-marker-replacer/logic.js";
import { DART_DESIGN_FILES } from "../../src/shared/feature-assets.manifest.js";
import { TURN_DART_ASSET_FILES } from "../../src/shared/turn-dart-assets.manifest.js";

const takeOutAssetPath = path.resolve(process.cwd(), "src", "assets", "TakeOut.png");
const dartAssetsPath = path.resolve(process.cwd(), "src", "assets", "darts");
const turnDartAssetsPath = path.resolve(process.cwd(), "src", "assets", "turn-darts");
const dartAssetHashes = new Map(
  "Dart_aIreplicant.png=ba30da31879aaca18c816acc025dd463425d4837655ed14caa68903e4fc22e0b|Dart_autodarts.png=a1895fc0afb4ba249344f2c40d7becb4b2b647dcc75add27ada193ad1303f538|Dart_blackblue.png=437e52d9c692748b24c63cd08d9d9e3bf9e7322c0213746bc4eac15bec41021c|Dart_blackgreen.png=72371603375c8a184c79f2296a6c3e793f4a02928a8f0e663c696776a9c0f86b|Dart_blackred.png=b39c53fb5bdfca4eedd663c04953b936b2bb68b8adfc36aac48e574f8d703d23|Dart_blue.png=78177ef6fddba29a9a54ced14fee365414c38662429babbd917e9d024d6951c7|Dart_bullet.png=965ab71abf694fca0df0304b6194283690c6c8a03ec50fc7ae4c4d8a1013fd80|Dart_camoflage.png=af429d5b72baebcbfd44ba9f05d05c2627f97a7a90ca269991aa7bffae307796|Dart_germangiant.png=143e63736341e4bfef257056afc81d6a62a51d24ff68b761bf50f122f1b9125d|Dart_green.png=bf2a4de193fe189ae5cf6b0582ea97306e7a4c7732498b02277706e8394d1693|Dart_mandalorian.png=9c752006707bc0740046c55ee75d2589e73d66d8a800aef87a9f50efcbb5c96b|Dart_nuke.png=c1af45ee4e69ead15ec577044bfcffaae62d1d03b35bc10b56a5c0b1ca6fad3f|Dart_philtaylor.png=cf9b9ee7b5977d08a120ce2d4c85acfa08576b5ee5de0f229af67ef63bceba6f|Dart_pride.png=17e48b9d9b8ea29f6da3f273348ac1412daea222b16e53ac45c4b32f0b45348e|Dart_red.png=2ce6c18e0880f4f1bf9cba6036070c42c7e77d23e34fecfa9e9bab8808f68fc2|Dart_snakebite.png=0a28aa22443d667c297e911e67334698ed4c8b4d18f042bdd2897584b78cb7a3|Dart_standard.png=2883e33f3c1705e137fb61a78b478566a83a943b70f0b8bf32ef5a98b5b9845b|Dart_stdyellow.png=339ba884ee241500ad80a534d5f6f5c7ae5d413cff6a2c327f743d462ad21676|Dart_stdyellow2.png=87c46925610e14ff288fda05afee032e636074d5be1dafdb0fce931557a3f01a|Dart_ultramarine.png=56959396286be12e42764d5dcca649a6e8ba320e6ca68ef688a748817ae3e548|Dart_white.png=86da1486d6fde51ae789dcab46cf224de4a95bb82933f64e7e2532c6e6a29f6e|Dart_whitetrible.png=5b4626acd3f7b35a179575e04ef23c92bb0cf9f6284d089e4841b180539ca9f3|Dart_yellow.png=ae819b03bc2abe41b93e7047832ef6461db1ec8af0260d15a208c31145c8e88f|Dart_yellowscull.png=357cdc514cafb25015594bf930cc5fc7e045fcae52c2b446ca7520c1624838de"
    .split("|")
    .map((entry) => entry.split("="))
);
const turnDartAssetMetadata = new Map([
  ["turn-dart-blue-lightning.png", { width: 2098, height: 471, sha256: "38df34e30d477ceeb66c9851d6785a42c4257ba30789ee6dec04b5d1421369e0" }],
  ["turn-dart-bullet-red.png", { width: 1700, height: 500, sha256: "fb6cfe07b37c3f343d457a68db43a820619066fd5722a069768be5d10d6f0213" }],
  ["turn-dart-carbon-gold.png", { width: 2062, height: 457, sha256: "0a648f0b47fc8e5c5355ae9a7f00953df165b1090c82d2814765b375cf958a4c" }],
  ["turn-dart-cool-hand-luke.png", { width: 2066, height: 511, sha256: "1a9c081f31eb049d36b9229b4a04ecafbb1ec78de43ef1fc2560c8999833350f" }],
  ["turn-dart-copper-grid.png", { width: 2169, height: 487, sha256: "f61c4d2fbbffe979c6b66a066b1286273440f9d8d327262f5a098f05b39b6853" }],
  ["turn-dart-german-giant.png", { width: 2170, height: 725, sha256: "31058daaa30102d6b092187472310a863cb0d31b6d722fd09f08f4292c182673" }],
  ["turn-dart-gvv-blue.png", { width: 1993, height: 466, sha256: "6181e904df762886c092282af0ae914fcd09b17935f53071582537442d8345b2" }],
  ["turn-dart-iceman-blue.png", { width: 2041, height: 443, sha256: "791dc9c13aaf51e94df34b263397ba9c3dc0f5c3b2bf85edd666628159966ace" }],
  ["turn-dart-snakebite-purple.png", { width: 2095, height: 456, sha256: "dce2ac90aac64859076a8ddb6ffd620468e38bc4bac939fc4fa309a6e7ab8122" }],
  ["turn-dart-target-neon.png", { width: 1939, height: 454, sha256: "985833cf6b152a071bd29efff247ddbdad71be03b9bcaabb30fa1316bbc88289" }],
  ["turn-dart-vecta-gold.png", { width: 1938, height: 463, sha256: "5e8e31fcf9ddeabfac8ede51cb9e0ad4b6237bf6fa09b150a6f33fcf85b9d988" }],
]);

function sha256Hex(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

test("takeout asset stays a PNG with RGBA color type", () => {
  const png = readFileSync(takeOutAssetPath);

  assert.equal(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), true);
  assert.equal(png.subarray(12, 16).toString("ascii"), "IHDR");
  assert.equal(png.readUInt32BE(16), 508);
  assert.equal(png.readUInt32BE(20), 682);
  assert.equal(png.readUInt8(24), 8);
  assert.equal(png.readUInt8(25), 6);
});

test("dart design manifest references every bundled dart image", () => {
  const manifestFiles = Object.values(DART_DESIGN_FILES).sort();
  const assetFiles = readdirSync(dartAssetsPath)
    .filter((fileName) => /^Dart_.*\.png$/i.test(fileName))
    .sort();

  assert.deepEqual(manifestFiles, assetFiles);
});

test("turn dart asset manifest references every complete transparent turn dart image", () => {
  const manifestFiles = Object.values(TURN_DART_ASSET_FILES).sort();
  const assetFiles = readdirSync(turnDartAssetsPath)
    .filter((fileName) => /\.png$/i.test(fileName))
    .sort();

  assert.deepEqual(manifestFiles, assetFiles);
  assert.equal(turnDartAssetMetadata.size, manifestFiles.length);
  manifestFiles.forEach((fileName) => {
    const png = readFileSync(path.join(turnDartAssetsPath, fileName));
    const metadata = turnDartAssetMetadata.get(fileName);

    assert.ok(metadata, fileName);
    assert.equal(png.subarray(12, 16).toString("ascii"), "IHDR", fileName);
    assert.equal(png.readUInt32BE(16), metadata.width, fileName);
    assert.equal(png.readUInt32BE(20), metadata.height, fileName);
    assert.equal(png.readUInt8(25), 6, fileName);
    assert.equal(sha256Hex(png), metadata.sha256, fileName);
  });
});

test("dart design images stay normalized for the runtime dart tip hotspot", () => {
  Object.values(DART_DESIGN_FILES).forEach((fileName) => {
    const png = readFileSync(path.join(dartAssetsPath, fileName));

    assert.equal(png.readUInt32BE(16), DART_IMAGE_SOURCE_WIDTH, fileName);
    assert.equal(png.readUInt32BE(20), DART_IMAGE_SOURCE_HEIGHT, fileName);
    assert.equal(sha256Hex(png), dartAssetHashes.get(fileName), fileName);
  });
});

test("dart asset normalizer check accepts bundled dart images", () => {
  const result = spawnSync(process.execPath, ["scripts/normalize-dart-assets.mjs", "--check"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
});
