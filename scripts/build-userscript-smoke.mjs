import { build } from "esbuild";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildUserscriptHeader,
  USERSCRIPT_ASSET_LOADERS,
  USERSCRIPT_BROWSER_TARGETS,
} from "./userscript-build-config.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const entryFile = path.join(repositoryRoot, "loader", "autodarts-xconfig.user.js");
const packageJson = JSON.parse(await readFile(path.join(repositoryRoot, "package.json"), "utf8"));
const outputDirectory = await mkdtemp(path.join(tmpdir(), "autodarts-xconfig-smoke-"));
const outputFile = path.join(outputDirectory, "autodarts-xconfig-smoke.user.js");

await build({
  entryPoints: [entryFile],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: USERSCRIPT_BROWSER_TARGETS,
  outfile: outputFile,
  charset: "utf8",
  legalComments: "none",
  loader: USERSCRIPT_ASSET_LOADERS,
  banner: {
    js: buildUserscriptHeader(packageJson.version),
  },
});

const outputStats = await stat(outputFile);
console.log(`${outputFile}\n${outputStats.size} bytes`);
