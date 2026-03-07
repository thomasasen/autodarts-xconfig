import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const bundlePath = path.resolve(
  process.cwd(),
  "dist",
  "autodarts-xconfig.user.js"
);

test("checked-in userscript bundle contains metadata header and runtime bootstrap entry", () => {
  const text = readFileSync(bundlePath, "utf8");

  assert.match(text, /\/\/ ==UserScript==/);
  assert.match(text, /@match\s+https:\/\/play\.autodarts\.io\/\*/);
  assert.match(text, /@grant\s+none/);
  assert.doesNotMatch(text, /@grant\s+GM_getValue/);
  assert.match(
    text,
    /@downloadURL\s+https:\/\/raw\.githubusercontent\.com\/thomasasen\/autodarts-xconfig\/main\/dist\/autodarts-xconfig\.user\.js/
  );
  assert.match(text, /initializeTampermonkeyRuntime/);
  assert.match(text, /windowRef\.__adXConfig/);
});
