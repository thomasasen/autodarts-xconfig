import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const entryFile = path.join(repoRoot, "loader", "autodarts-xconfig.user.js");
const outDir = path.join(repoRoot, "dist");
const outFile = path.join(outDir, "autodarts-xconfig.user.js");

const userscriptHeader = `// ==UserScript==
// @name         autodarts-xconfig
// @namespace    https://github.com/thomasasen/autodarts-xconfig
// @version      1.0.0
// @description  Modular, side-effect resistant Tampermonkey runtime for Autodarts enhancements.
// @author       Thomas Asen
// @license      MIT
// @match        *://play.autodarts.io/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @downloadURL  https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.user.js
// @updateURL    https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.user.js
// ==/UserScript==
`;

await mkdir(outDir, { recursive: true });

await build({
  entryPoints: [entryFile],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["chrome100", "firefox100"],
  outfile: outFile,
  charset: "utf8",
  legalComments: "none",
  loader: {
    ".png": "dataurl",
    ".mp3": "dataurl",
  },
  banner: {
    js: userscriptHeader,
  },
});

const builtText = await readFile(outFile, "utf8");
await writeFile(outFile, `${userscriptHeader}\n${builtText.replace(userscriptHeader, "").trimStart()}\n`, "utf8");
