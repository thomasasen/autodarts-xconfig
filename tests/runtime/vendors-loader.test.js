import test from "node:test";
import assert from "node:assert/strict";

import { ensureAnimeLoaded, getAnime } from "../../src/vendors/index.js";

test("ensureAnimeLoaded resolves anime function for a window-like reference", async () => {
  const windowRef = {};
  const loadedAnime = await ensureAnimeLoaded(windowRef);

  assert.equal(typeof loadedAnime, "function");
  assert.equal(typeof getAnime(windowRef), "function");
});

test("ensureAnimeLoaded returns null without a window reference", async () => {
  const loadedAnime = await ensureAnimeLoaded(null);
  assert.equal(loadedAnime, null);
});

test("getAnime prefers an explicit window anime binding", () => {
  const explicitAnime = () => {};
  const resolvedAnime = getAnime({ anime: explicitAnime });

  assert.equal(resolvedAnime, explicitAnime);
});
