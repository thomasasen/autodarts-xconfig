import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { USERSCRIPT_ASSET_LOADERS } from "../scripts/userscript-build-config.mjs";

let bundle;
test.beforeAll(async () => {
  const result = await build({ stdin: { contents: `
    import { buildShellContent } from "./src/features/xconfig-ui/shell-view.js";
    import { styleText } from "./src/features/xconfig-ui/shell-style.js";
    import { featureCatalog } from "./src/shared/feature-catalog.js";
    import { getFeatureConfigSpec } from "./src/config/feature-config-spec.js";
    window.uiComparison = { buildShellContent, styleText,
      features: featureCatalog.map(feature => ({ ...feature, enabled: false, mounted: false,
        config: getFeatureConfigSpec(feature.configKey)?.normalizeConfig() || {} })) };
  `, resolveDir: process.cwd() }, bundle: true, write: false, format: "iife",
    platform: "browser", target: "chrome100", loader: USERSCRIPT_ASSET_LOADERS });
  bundle = result.outputFiles[0].text;
});

test("all option layouts and field controls retain their isolated browser DOM and appearance", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/*", (route) => route.abort());
  await page.setContent('<!doctype html><section id="ad-xconfig-panel-host"></section>');
  await page.addScriptTag({ content: bundle });
  await page.evaluate(() => {
    const style = document.createElement("style");
    style.textContent = window.uiComparison.styleText;
    document.head.appendChild(style);
    document.getElementById("ad-xconfig-panel-host").style.display = "block";
  });
  const auditDir = process.env.XCONFIG_AUDIT_DIR;
  const phase = process.env.XCONFIG_AUDIT_PHASE || "current";
  if (auditDir) await mkdir(auditDir, { recursive: true });
  for (const featureKey of ["theme-global-typography", "dart-marker-replacer", "turn-score-counter", "avg-trend-arrow",
    "dartboard-marker-highlight", "checkout-score-highlight", "checkout-target-highlights", "x01-remaining-score-bar",
    "checkout-suggestion-styles", "tv-board-zoom", "theme-global-background"]) {
    await page.evaluate((key) => {
      const ui = window.uiComparison;
      const host = document.getElementById("ad-xconfig-panel-host");
      host.replaceChildren(ui.buildShellContent(document, { activeSettingsFeatureKey: key, updateStatus: {}, settingsTransfer: {} }, ui.features));
    }, featureKey);
    const modal = page.locator(".ad-xconfig-modal");
    await expect(modal).toBeVisible();
    const image = await modal.screenshot({ animations: "disabled" });
    const dom = await modal.evaluate((node) => node.outerHTML);
    const hash = createHash("sha256").update(dom).digest("hex");
    if (auditDir) {
      await writeFile(path.join(auditDir, `${phase}-${featureKey}.png`), image);
      await writeFile(path.join(auditDir, `${phase}-${featureKey}.sha256`), hash);
      if (phase === "after") {
        expect(hash).toBe(await readFile(path.join(auditDir, `before-${featureKey}.sha256`), "utf8"));
        expect(image.equals(await readFile(path.join(auditDir, `before-${featureKey}.png`)))).toBe(true);
      }
    }
    await testInfo.attach(featureKey, { body: image, contentType: "image/png" });
  }
});
