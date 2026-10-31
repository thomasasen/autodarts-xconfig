// One-time, reproducible source import. Never executes or injects upstream CSS.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeCommunityDesigns } from "./write-community-designs.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = "https://github.com/jumbo1250/Autodarts-Webinterface-Installation/blob/main/latest/theme.zip";
const expectedHash = "cb0b48e28416dc150470993b01445c751df029666cb21befa99e4b05ce2436d4";
const digest = (data) => createHash("sha256").update(data).digest("hex");
export function readZip(bytes) {
  let end = bytes.length - 22;
  while (end >= 0 && bytes.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw new Error("ZIP directory missing");
  let offset = bytes.readUInt32LE(end + 16);
  const entries = new Map();
  for (let i = 0; i < bytes.readUInt16LE(end + 10); i++) {
    if (bytes.readUInt32LE(offset) !== 0x02014b50) throw new Error("Invalid ZIP directory");
    const method = bytes.readUInt16LE(offset + 10);
    const size = bytes.readUInt32LE(offset + 20);
    const nameLength = bytes.readUInt16LE(offset + 28);
    const name = bytes.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    const local = bytes.readUInt32LE(offset + 42);
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    const compressed = bytes.subarray(start, start + size);
    if (method !== 0 && method !== 8) throw new Error(`Unsupported compression: ${name}`);
    entries.set(name, method === 8 ? inflateRawSync(compressed) : compressed);
    offset += 46 + nameLength + bytes.readUInt16LE(offset + 30) + bytes.readUInt16LE(offset + 32);
  }
  return entries;
}

// Metadata lives in comments, but declarations in examples must never shadow CSS.
export function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

const variable = (css, name) => new RegExp(String.raw`--${name}\s*:\s*([^;]+);`).exec(css)?.[1].trim().replace(/\s*!important$/, "") || "";
function resolveValue(css, value, seen = new Set()) {
  return value.replace(/var\(--([\w-]+)\)/g, (_, key) => {
    if (seen.has(key)) return "";
    return resolveValue(css, variable(css, key), new Set([...seen, key]));
  });
}
function resolvedVariable(css, name) {
  return resolveValue(css, variable(css, name), new Set([name]));
}
function normalizeColor(value, fallback) {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(value)) return `#${Array.from(value.slice(1), (channel) => channel.repeat(2)).join("")}`.toLowerCase();
  const rgb = value.match(/^(?:rgba?\()?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return rgb ? `#${rgb.slice(1, 4).map((n) => Math.min(255, Number(n)).toString(16).padStart(2, "0")).join("")}` : fallback;
}
const imageUrl = (css, key) => resolvedVariable(css, key).match(/url\(["']?(https?:\/\/[^"')]+)["']?\)/)?.[1] || "";

export function parseCommunityDesignCss(originalCss) {
  const css = stripCssComments(originalCss);
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selectors: selector.split(",").map((entry) => entry.trim()), body }));
  const ruleValue = (matches, property) => {
    for (const rule of rules) {
      if (!rule.selectors.some(matches)) continue;
      const value = new RegExp(String.raw`(?:^|;)\s*${property}\s*:\s*([^;]+)`).exec(rule.body)?.[1];
      if (value) return resolveValue(css, value.trim().replace(/\s*!important$/, ""));
    }
    return "";
  };
  const scoreRule = (selector) => /^(?:div|span)\.font-number\.font-bold(?:\.leading-none)?$/.test(selector);
  const nameRule = (selector) => /^(?:div|span)\.font-display$/.test(selector);
  const checkoutRule = (selector) => selector.includes(".font-number") && selector.includes(".text-checkout-suggestion");
  const color = (name, rule, fallback) => normalizeColor(resolvedVariable(css, name) || rule, fallback);
  return {
    backgroundUrls: Object.fromEntries(Object.entries({ game: ["background-game", "background-game-multi"], cricket: ["background-cricket"], portrait: ["background-portrait"], menu: ["background-menu"] }).map(([context, keys]) => [context, keys.map((key) => imageUrl(css, key)).find(Boolean) || ""])),
    surroundUrl: imageUrl(css, "dartboard-surround-image"),
    fontFamily: ruleValue(scoreRule, "font-family") || /font-family\s*:\s*([^;{}]+)/i.exec(css)?.[1].trim() || "system-ui, sans-serif",
    accentColor: color("theme-accent-color", "", "#22c55e"),
    scoreColor: color("text-score", ruleValue(scoreRule, "color"), "#ffffff"),
    secondaryTextColor: color("text-primary", ruleValue(nameRule, "color"), "#eeeeee"),
    throwLabelColor: color("text-checkout", ruleValue(checkoutRule, "-webkit-text-fill-color") || ruleValue(checkoutRule, "color"), "#ffffff"),
    surfaceStyle: { player: resolvedVariable(css, "surface-player"), active: resolvedVariable(css, "surface-active-player") || resolvedVariable(css, "surface-player"), panel: resolvedVariable(css, "surface-score-table"), border: resolvedVariable(css, "border-inactive-player"), radius: resolvedVariable(css, "radius-player") },
    glowColor: color("player-glow-soft", "", "#22c55e"),
  };
}

export async function main(archivePath) {
  if (!archivePath) throw new Error("Usage: node scripts/import-community-designs.mjs <theme.zip>");
  const zip = await readFile(archivePath);
  if (digest(zip) !== expectedHash) throw new Error("Unexpected upstream archive; review the new source before importing.");
  const entries = readZip(zip);
  const assets = {};
  const assetSources = {};
  const failures = [];
  const corrections = { "https://rottmanninfo.at/autodarts/Bilder/Adrian_Lewis_criket.webp": "https://rottmanninfo.at/autodarts/Bilder/Adrian_Lewis_Cricket.webp" };
  const directory = path.join(root, "src/assets/theme-presets/community");
  await mkdir(directory, { recursive: true });
  let previousAssets = {};
  try {
    const previous = JSON.parse(await readFile(path.join(directory, "provenance.json"), "utf8"));
    previousAssets = previous.imageProcessing ? {} : previous.assets;
  } catch { /* First import. */ }
  const urlCache = new Map();

  function imageExtension(bytes) {
    if (bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return "jpg";
    if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
    if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
    throw new Error("Response is not a PNG, JPEG or WebP image");
  }

  async function saveImage(bytes, origin) {
    const hash = digest(bytes);
    const key = `community-${hash.slice(0, 20)}`;
    const file = `${hash}.${imageExtension(bytes)}`;
    await writeFile(path.join(directory, file), bytes);
    assets[key] = `community/${file}`;
    assetSources[origin] = { assetKey: key, sha256: hash, bytes: bytes.length };
    return key;
  }

  async function download(url) {
    if (!url || url.includes("!GALERIE!")) return "";
    if (urlCache.has(url)) return urlCache.get(url);
    const task = (async () => {
      try {
        try {
          const cached = previousAssets[url];
          const files = await import("node:fs/promises").then((fs) => fs.readdir(directory));
          const file = files.find((name) => name.startsWith(cached.sha256 + "."));
          const bytes = await readFile(path.join(directory, file));
          return await saveImage(bytes, url);
        } catch { /* Fetch missing cache entries. */ }
        const response = await fetch(corrections[url] || url, { signal: AbortSignal.timeout(30000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const bytes = Buffer.from(await response.arrayBuffer());
        const key = await saveImage(bytes, url);
        return key;
      } catch (error) {
        failures.push({ url, error: error.message });
        return "";
      }
    })();
    urlCache.set(url, task);
    return task;
  }

  const slug = (name) => name.toLowerCase().replace(/\.css$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const definitions = [];
  for (const [name, bytes] of entries) {
    if (!name.endsWith(".css") || name.includes("/X_old.") || name.endsWith("/$$customer.css")) continue;
    const css = bytes.toString("utf8");
    if (/(?:Passwort|Password|Kennwort)\s*:\s*[^*\s]/i.test(css.slice(0, 4500))) continue;
    definitions.push({ name, css });
  }
  if (definitions.length !== 78) throw new Error(`Expected 78 public designs, found ${definitions.length}`);

  const presets = [];
  // Limit outstanding image requests; each source image is fetched only once.
  for (const { name, css } of definitions) {
    const parsed = parseCommunityDesignCss(css);
    const backgrounds = {};
    for (const [context, url] of Object.entries(parsed.backgroundUrls)) {
      backgrounds[context] = await download(url);
    }
    const stem = name.replace(/\.css$/, "");
    const preview = [...entries.keys()].find((entry) => entry.replace(/\.(jpe?g|webp|png)$/i, "").toLowerCase() === stem.toLowerCase() && /\.(jpe?g|webp|png)$/i.test(entry));
    const previewAssetKey = preview ? await saveImage(entries.get(preview), `archive:${preview}`) : backgrounds.game;
    presets.push({
      key: `community-${slug(name.split("/").pop())}`,
      label: /\/\*\s*Layout:\s*([^*\r\n]+)/i.exec(css)?.[1].trim() || name.split("/").pop().replace(/\.css$/, "").replaceAll("_", " "),
      author: /Autor:\s*([^*\r\n]+)/i.exec(css)?.[1].trim() || "Autodarts Layouts",
      sourceFile: name, source, formats: [css.includes("$Horizontal") && "landscape", css.includes("$Vertical") && "portrait"].filter(Boolean),
      description: "Übernommenes Community-Design mit lokal gespeicherten Bildern.",
      fontPreset: "system", applyTo: ["scores", "throws", "names"],
      fontFamily: parsed.fontFamily,
      accentColor: parsed.accentColor, scoreColor: parsed.scoreColor,
      secondaryTextColor: parsed.secondaryTextColor, throwLabelColor: parsed.throwLabelColor,
      backgroundOpacity: 70, playerFieldTransparency: 10, activePlayerTintIntensity: 10,
      backgroundAssetKey: backgrounds.game || backgrounds.cricket, backgroundAssets: backgrounds, previewAssetKey,
      surfaceStyle: parsed.surfaceStyle,
      glowColor: parsed.glowColor, glowMode: "pulse",
      surroundAssetKey: await download(parsed.surroundUrl),
    });
    console.log(`Imported ${presets.length}/78: ${presets.at(-1).label}`);
  }
  const surrounds = [];
  for (const entry of JSON.parse(entries.get("theme/$$surrounds.json").toString("utf8"))) {
    surrounds.push({ key: slug(entry.name), label: entry.name, assetKey: await download(entry.url), sourceUrl: entry.url });
  }
  if (surrounds.length !== 34) throw new Error("Unexpected surround catalogue");
  const provenance = { source, archiveSha256: expectedHash, upstreamBlob: "1f816310302980702bec3edcbfa5bce1b4b0304d", permission: "User confirmed author permission for adaptation and redistribution in this task; retain each author's attribution. No independent licence grant is inferred.", corrections, assets: assetSources, failures };
  const generated = "// Generated by scripts/import-community-designs.mjs. Do not edit by hand.\n";
  await writeCommunityDesigns({ presets, surrounds, assets });
  const browserImports = Object.values(assets).map((file, i) => `import image${i} from ${JSON.stringify("../assets/theme-presets/" + file)};`).join("\n");
  const browserProperties = Object.keys(assets).map((key, i) => `${JSON.stringify(key)}: image${i}`).join(",\n");
  await writeFile(path.join(root, "src/shared/community-assets.browser.js"), generated + browserImports + `\nexport const COMMUNITY_ASSETS = Object.freeze({\n${browserProperties}\n});\n`);
  await writeFile(path.join(directory, "provenance.json"), JSON.stringify(provenance, null, 2) + "\n");
  console.log(JSON.stringify({ presets: presets.length, surrounds: surrounds.length, uniqueAssets: Object.keys(assets).length, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv[2]);
}
