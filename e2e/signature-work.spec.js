import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { writeFile } from "node:fs/promises";
import path from "node:path";

test("measure unchanged UI signatures with supported large image configurations", async ({ page }, testInfo) => {
  const bundle = await build({ stdin: { contents: `
    import * as signatures from "./src/features/xconfig-ui/render-signature.js";
    window.signatureWork = signatures;
  `, resolveDir: process.cwd() }, bundle: true, write: false, format: "iife", platform: "browser" });
  await page.setContent("<!doctype html><main></main>");
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const metrics = await page.evaluate(async () => {
    const api = window.signatureWork;
    const plain = api.buildShellRenderSignature;
    const local = api.createShellRenderSignatureBuilder?.() || plain;
    const state = { activeSettingsFeatureKey: "theme-global-background" };
    const features = [
      { featureKey: "theme-global-background", config: { backgroundImageDataUrl: `data:image/png;base64,${"A".repeat(2 * 1024 * 1024)}`, opacity: 85 } },
      { featureKey: "turn-dart-display", config: { turnDartImageDataUrl: `data:image/png;base64,${"B".repeat(466 * 1024)}`, style: "image" } },
    ];
    function sample(builder) {
      const start = performance.now();
      let signature;
      for (let iteration = 0; iteration < 100; iteration++) signature = builder(state, features, true);
      return { elapsedMs: performance.now() - start, serializedCharacters: signature.length, calls: 100 };
    }
    plain(state, features, true); local(state, features, true);
    const legacy = sample(plain);
    const current = sample(local);
    async function frames(builder) {
      const intervals = [];
      let previous;
      for (let frame = 0; frame < 30; frame++) {
        const now = await new Promise(requestAnimationFrame);
        if (previous !== undefined) intervals.push(now - previous);
        previous = now;
        builder(state, features, true);
      }
      return intervals;
    }
    const reference = local(state, features, true);
    const retained = local(state, features.map((feature) => ({ ...feature, config: { ...feature.config } })), true) === reference;
    features[1].config.turnDartImageDataUrl += "C";
    const detectsExactAssetChange = local(state, features, true) !== reference;
    return { legacy, current, retained, detectsExactAssetChange,
      legacyFrameIntervals: await frames(plain), currentFrameIntervals: await frames(local),
      configStillContainsImage: features[0].config.backgroundImageDataUrl.startsWith("data:image/png;base64,") };
  });
  expect(metrics.retained).toBe(true);
  expect(metrics.detectsExactAssetChange).toBe(true);
  expect(metrics.configStillContainsImage).toBe(true);
  if (process.env.XCONFIG_AUDIT_DIR) {
    await writeFile(path.join(process.env.XCONFIG_AUDIT_DIR, `${process.env.XCONFIG_AUDIT_PHASE || "current"}-signature-work.json`), JSON.stringify(metrics, null, 2));
  }
  await testInfo.attach("signature-work-and-frame-intervals", { body: JSON.stringify(metrics), contentType: "application/json" });
});
