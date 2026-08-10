import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildUserscriptHeader,
  USERSCRIPT_ASSET_LOADERS,
  USERSCRIPT_BROWSER_TARGETS,
} from "./userscript-build-config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const entryFile = path.join(repoRoot, "loader", "autodarts-xconfig.user.js");
const outDir = path.join(repoRoot, "dist");
const outFile = path.join(outDir, "autodarts-xconfig.user.js");
const outMetaFile = path.join(outDir, "autodarts-xconfig.meta.js");
const packageJson = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
const packageVersion = String(packageJson.version || "").trim() || "0.0.0";

const userscriptHeader = buildUserscriptHeader(packageVersion);

await mkdir(outDir, { recursive: true });

await build({
  entryPoints: [entryFile],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: USERSCRIPT_BROWSER_TARGETS,
  outfile: outFile,
  charset: "utf8",
  legalComments: "none",
  loader: USERSCRIPT_ASSET_LOADERS,
  banner: {
    js: userscriptHeader,
  },
});

await writeFile(outMetaFile, `${userscriptHeader}\n`, "utf8");
