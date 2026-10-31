import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { THEME_ASSET_CATALOG } from "../src/shared/theme-asset-catalog.js";
import { THEME_ASSET_RELEASE_TAG } from "../src/shared/theme-asset-source.js";

export async function checkThemeLibrary({ catalog = THEME_ASSET_CATALOG, tag = THEME_ASSET_RELEASE_TAG, remote = false, fetchImpl = globalThis.fetch } = {}) {
  if (!/^v\d+\.\d+\.\d+$/.test(tag)) throw new Error("Theme images require an immutable stable release tag");
  const assets = [...new Map(Object.values(catalog).map((asset) => [asset.file, asset])).values()];
  const base = `https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/${tag}/src/assets/theme-presets/`;
  for (const asset of assets) {
    let bytes;
    if (remote) {
      const response = await fetchImpl(base + asset.file, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`Release image unavailable: ${asset.file} (HTTP ${response.status})`);
      bytes = Buffer.from(await response.arrayBuffer());
    } else {
      bytes = await readFile(new URL("../src/assets/theme-presets/" + asset.file, import.meta.url));
    }
    if (bytes.length !== asset.bytes || createHash("sha256").update(bytes).digest("hex") !== asset.sha256) {
      throw new Error(`Release image checksum mismatch: ${asset.file}`);
    }
  }
  return { tag, images: assets.length, remote };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const index = process.argv.indexOf("--tag");
  console.log(JSON.stringify(await checkThemeLibrary({ remote: process.argv.includes("--remote"), tag: index < 0 ? THEME_ASSET_RELEASE_TAG : process.argv[index + 1] })));
}
