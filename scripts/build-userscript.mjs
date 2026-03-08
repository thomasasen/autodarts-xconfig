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
const packageJson = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
const packageVersion = String(packageJson.version || "").trim() || "0.0.0";

const userscriptHeader = `// ==UserScript==
// @name         autodarts-xconfig
// @namespace    https://github.com/thomasasen/autodarts-xconfig
// @version      ${packageVersion}
// @description  Modular, side-effect resistant Tampermonkey runtime for Autodarts enhancements.
// @author       Thomas Asen
// @license      MIT
// @match        https://play.autodarts.io/*
// @run-at       document-start
// @grant        none
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
    ".gif": "dataurl",
    ".mp3": "dataurl",
  },
  banner: {
    js: userscriptHeader,
  },
});

const builtText = await readFile(outFile, "utf8");
await writeFile(outFile, `${userscriptHeader}\n${builtText.replace(userscriptHeader, "").trimStart()}\n`, "utf8");
