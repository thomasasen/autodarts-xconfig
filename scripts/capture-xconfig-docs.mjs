/**
 * Reproducible README captures from the actual xConfig shell renderer.
 *
 * Run: node scripts/capture-xconfig-docs.mjs
 * Requires: npm ci, npx playwright install chromium, ffmpeg
 *
 * These are isolated UI fixtures, not screenshots of a live Autodarts account.
 * No user data, private browser session or invented controls are involved.
 */
import { build } from "esbuild";
import { chromium } from "@playwright/test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { USERSCRIPT_ASSET_LOADERS } from "./userscript-build-config.mjs";

const outputDirectory = path.resolve("docs/screenshots");
const fixtures = [
  ["xconfig-overview-design", '[data-adxconfig-section="template"]'],
  ["xconfig-overview-allmodes", '[data-adxconfig-section="all-modes"]'],
  ["xconfig-overview-x01", '[data-adxconfig-section="x01"]'],
  ["xconfig-overview-cricket", '[data-adxconfig-section="cricket-tactics"]'],
  ["xconfig-card-wurfanzeige", '.ad-xconfig-card[data-feature-key="turn-score-counter"]'],
  ["xconfig-card-board-markers", '.ad-xconfig-card[data-feature-key="dartboard-marker-highlight"]'],
  ["xconfig-card-x01-score", '.ad-xconfig-card[data-feature-key="checkout-score-highlight"]'],
  ["xconfig-card-cricket-table", '.ad-xconfig-card[data-feature-key="cricket-layout"]'],
];
const dialogs = [
  ["xconfig-settings-wurfanzeige", "turn-score-counter"],
  ["xconfig-settings-board-markers", "dartboard-marker-highlight"],
  ["xconfig-settings-x01-score", "checkout-score-highlight"],
  ["xconfig-settings-cricket-table", "cricket-layout"],
  ["xconfig-settings-design-gallery", "theme-global-presets"],
  ["xconfig-settings-background", "theme-global-background"],
  ["xconfig-settings-typography", "theme-global-typography"],
  ["xconfig-settings-screen-profiles", "theme-game-layout"],
  ["xconfig-settings-surround", "board-surround"],
  ["xconfig-settings-live-picture", "live-board-enhancement"],
  ["xconfig-settings-dartboard-design", "bot-board-style"],
];

const bundle = await build({
  stdin: {
    contents: `
      import { buildShellContent } from "./src/features/xconfig-ui/shell-view.js";
      import { styleText } from "./src/features/xconfig-ui/shell-style.js";
      import { featureCatalog } from "./src/shared/feature-catalog.js";
      import { getFeatureConfigSpec } from "./src/config/feature-config-spec.js";
      window.docsCapture = { buildShellContent, styleText,
        features: featureCatalog.map((feature) => ({
          ...feature, enabled: false, mounted: false,
          config: getFeatureConfigSpec(feature.configKey)?.normalizeConfig() || {}
        })) };
    `,
    resolveDir: process.cwd(),
  },
  bundle: true, write: false, format: "iife",
  platform: "browser", target: "chrome111",
  loader: USERSCRIPT_ASSET_LOADERS,
});
const temporary = await mkdtemp(path.join(tmpdir(), "xconfig-doc-images-"));
const browser = await chromium.launch({ headless: true });
try {
  await mkdir(outputDirectory, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1250 }, deviceScaleFactor: 1 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.route("**/*", (route) => route.abort());
  await page.setContent('<!doctype html><html lang="de"><head><meta charset="utf-8"></head><body><section id="ad-xconfig-panel-host"></section></body></html>');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.evaluate(() => {
    const api = window.docsCapture;
    const css = document.createElement("style");
    css.textContent = api.styleText + `
      html,body{margin:0;padding:0;background:#0e1420;color:#f4f6fa;}
      #ad-xconfig-panel-host{display:block!important;position:relative!important;}
    `;
    document.head.append(css);
    api.render = (key = "") => {
      document.getElementById("ad-xconfig-panel-host").replaceChildren(
        api.buildShellContent(document, {
          activeSettingsFeatureKey: key,
          updateStatus: {},
          settingsTransfer: {},
        }, api.features)
      );
    };
    api.render();
  });

  const numberOfCards = await page.locator(".ad-xconfig-card").count();
  if (numberOfCards !== 19) throw new Error(`Expected 19 current UI cards, found ${numberOfCards}`);

  async function capture(fileName, selector) {
    const locator = page.locator(selector).first();
    await locator.waitFor({ state: "visible" });
    const pngPath = path.join(temporary, `${fileName}.png`);
    const webpPath = path.join(outputDirectory, `${fileName}.webp`);
    await locator.screenshot({ path: pngPath, animations: "disabled", timeout: 15000 });
    const result = spawnSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y", "-i", pngPath,
      "-frames:v", "1", "-c:v", "libwebp", "-quality", "79",
      "-compression_level", "6", "-preset", "picture", webpPath,
    ], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
    if (result.error || result.status !== 0) {
      throw new Error(`WebP conversion failed for ${fileName}: ${result.error || result.stderr}`);
    }
    const bytes = (await readFile(webpPath)).byteLength;
    console.log(`${fileName}.webp: ${Math.round(bytes / 1024)} KiB`);
  }

  for (const [fileName, selector] of fixtures) await capture(fileName, selector);
  for (const [fileName, featureKey] of dialogs) {
    await page.evaluate((key) => window.docsCapture.render(key), featureKey);
    await capture(fileName, ".ad-xconfig-modal");
  }

  // The narrow view is validated, but intentionally not committed as a second
  // large duplicate screenshot set.
  await page.setViewportSize({ width: 390, height: 980 });
  await page.evaluate(() => window.docsCapture.render("dartboard-marker-highlight"));
  const modal = page.locator(".ad-xconfig-modal");
  await modal.waitFor({ state: "visible" });
  const overflow = await modal.evaluate((node) => node.scrollWidth - node.clientWidth);
  if (overflow > 2) throw new Error(`Narrow grouped modal overflows horizontally by ${overflow}px`);
  console.log("Mobile 390px grouped-dialog horizontal overflow: none");
} finally {
  await browser.close();
  await rm(temporary, { recursive: true, force: true });
}
