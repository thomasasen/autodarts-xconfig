import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { checkThemeLibrary } from "../../scripts/check-theme-library.mjs";
import { THEME_ASSET_RELEASE_TAG } from "../../src/shared/theme-asset-source.js";

test("the image library is pinned to the package release, never to main or latest", async () => {
  const pkg = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));
  assert.equal(THEME_ASSET_RELEASE_TAG, "v" + pkg.version);
  await assert.rejects(checkThemeLibrary({ catalog: {}, tag: "main" }), /immutable/);
  await assert.rejects(checkThemeLibrary({ catalog: {}, tag: "latest" }), /immutable/);
});

test("release validation checks the actual tagged bytes and rejects absent or changed files", async () => {
  const bytes = Buffer.from("image bytes");
  const catalog = { a: { file: "community/image.webp", sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length } };
  const calls = [];
  const result = await checkThemeLibrary({ catalog, tag: "v4.0.0", remote: true, fetchImpl: async (url) => { calls.push(url); return new Response(bytes); } });
  assert.equal(result.images, 1);
  assert.deepEqual(calls, ["https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/v4.0.0/src/assets/theme-presets/community/image.webp"]);
  await assert.rejects(checkThemeLibrary({ catalog, remote: true, fetchImpl: async () => new Response("missing", { status: 404 }) }), /unavailable.*HTTP 404/);
  await assert.rejects(checkThemeLibrary({ catalog, remote: true, fetchImpl: async () => new Response("bad") }), /checksum mismatch/);
});

test("the checked-in full image files match every generated checksum", async () => {
  const result = await checkThemeLibrary();
  assert.equal(result.images, 279);
});
