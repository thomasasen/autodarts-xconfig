import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { XCONFIG_PREVIEW_SCREENSHOTS } from "../../src/shared/xconfig-preview-assets.manifest.js";
import { xconfigDescriptors } from "../../src/features/xconfig-ui/descriptors.js";
import {
  buildRecommendedDefaultsSection,
  buildXConfigOverviewSection,
  buildFeaturesDocSection,
  buildReadmeFeatureSection,
} from "../../src/features/xconfig-ui/copy.js";
import { createRecommendedFeatureConfig } from "../../src/config/feature-config-spec.js";
import { defaultFeatureDefinitions } from "../../src/features/feature-registry.js";

const readmePath = path.resolve(process.cwd(), "README.md");
const featuresDocPath = path.resolve(process.cwd(), "docs", "FEATURES.md");
const dartRuleModulesDocPath = path.resolve(process.cwd(), "docs", "DART-RULE-MODULES.md");
const dartRulesReferenceDocPath = path.resolve(process.cwd(), "docs", "DART-RULES-REFERENCE.md");
const dartRuleAuditDocPath = path.resolve(process.cwd(), "docs", "DART-RULE-AUDIT.md");
const architectureDocPath = path.resolve(process.cwd(), "docs", "TECHNICAL-ARCHITECTURE.md");
const migrationStatusDocPath = path.resolve(
  process.cwd(),
  "docs",
  "archive",
  "migration-v1",
  "MIGRATION-STATUS.md"
);
const releaseQaDocPath = path.resolve(
  process.cwd(),
  "docs",
  "archive",
  "migration-v1",
  "RELEASE-QA-REPORT.md"
);
const runtimeEntrypointsDocPath = path.resolve(process.cwd(), "docs", "RUNTIME-ENTRYPOINTS.md");
const performanceAuditDocPath = path.resolve(process.cwd(), "docs", "PERFORMANCE-AUDIT.md");
const deprecatedOverviewScreenshotPattern = /ad-xconfig\.png/;
const requiredReadmeOverviewScreenshots = [
  "docs/screenshots/ad-xconfig-themen.png",
  "docs/screenshots/ad-xconfig-animationen.png",
  "docs/screenshots/ad-xconfig-header.png",
  "docs/screenshots/ad-xconfig-kachel.png",
  "docs/screenshots/ad-xconfig-einstellungen.png",
  "docs/screenshots/ad-xconfig-theme-background.png",
];
const requiredFeaturesOverviewScreenshots = [
  "screenshots/ad-xconfig-themen.png",
  "screenshots/ad-xconfig-animationen.png",
];
const mojibakePattern =
  /\u00C3\u00A4|\u00C3\u00B6|\u00C3\u00BC|\u00C3\u009F|\u00C3\u0084|\u00C3\u0096|\u00C3\u009C/;
const featureDefinitionByKey = new Map(
  defaultFeatureDefinitions.map((definition) => [definition.featureKey, definition])
);
function resolveRecommendedConfig(featureKey) {
  const definition = featureDefinitionByKey.get(String(featureKey || "").trim());
  return definition?.configKey ? createRecommendedFeatureConfig(definition.configKey) : null;
}
const overviewCounts = {
  totalModules: xconfigDescriptors.length,
  animationModules: xconfigDescriptors.filter((descriptor) => descriptor.tab !== "themes").length,
  themeModules: xconfigDescriptors.filter((descriptor) => descriptor.tab === "themes").length,
  themeImageLimit: "1,5 MiB",
};

function readText(filePath) {
  return readFileSync(filePath, "utf8").replaceAll("\r\n", "\n");
}

function escapeRegExp(text) {
  return String(text || "").replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

test("README references the canonical userscript install target", () => {
  const readme = readText(readmePath);

  assert.match(readme, /dist\/autodarts-xconfig\.user\.js/);
  assert.match(
    readme,
    /https:\/\/raw\.githubusercontent\.com\/thomasasen\/autodarts-xconfig\/main\/dist\/autodarts-xconfig\.user\.js/
  );
  assert.doesNotMatch(readme, /dist\/autodarts-xconfig-loader\.user\.js/);
});

test("README screenshot paths exist in docs/screenshots", () => {
  const readme = readText(readmePath);
  const imageMatches = Array.from(readme.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g));

  assert.ok(imageMatches.length >= 8);

  imageMatches.forEach((match) => {
    if (/^(https?:|data:)/.test(match[1])) {
      return;
    }
    const screenshotPath = path.resolve(process.cwd(), match[1]);
    assert.equal(
      existsSync(screenshotPath),
      true,
      `missing screenshot: ${match[1]}`
    );
  });
});

test("README uses the current AD xConfig overview screenshots", () => {
  const readme = readText(readmePath);

  requiredReadmeOverviewScreenshots.forEach((screenshotPath) => {
    assert.match(readme, new RegExp(escapeRegExp(screenshotPath)));
  });
});

test("README and FEATURES no longer reference the deprecated AD xConfig overview screenshot", () => {
  const readme = readText(readmePath);
  const featuresDoc = readText(featuresDocPath);

  assert.doesNotMatch(readme, deprecatedOverviewScreenshotPattern);
  assert.doesNotMatch(featuresDoc, deprecatedOverviewScreenshotPattern);
});

test("xConfig module counts derive from the current registry descriptors", () => {
  assert.equal(overviewCounts.totalModules, 26);
  assert.equal(overviewCounts.animationModules, 17);
  assert.equal(overviewCounts.themeModules, 9);
});

test("README and FEATURES share the generated xConfig overview copy", () => {
  const readme = readText(readmePath);
  const featuresDoc = readText(featuresDocPath);
  const readmeOverviewCopy = buildXConfigOverviewSection("Im Überblick", overviewCounts).trim();
  const featuresOverviewCopy = buildXConfigOverviewSection(
    "Hinweise zur Konfiguration",
    overviewCounts
  ).trim();

  assert.match(readme, new RegExp(escapeRegExp(readmeOverviewCopy)));
  assert.match(featuresDoc, new RegExp(escapeRegExp(featuresOverviewCopy)));
});

test("README and FEATURES share the generated recommended defaults profile", () => {
  const readme = readText(readmePath);
  const featuresDoc = readText(featuresDocPath);
  const recommendedDefaultsCopy = buildRecommendedDefaultsSection(
    "Empfohlene Standards",
    xconfigDescriptors,
    resolveRecommendedConfig
  ).trim();

  assert.match(readme, new RegExp(escapeRegExp(recommendedDefaultsCopy)));
  assert.match(featuresDoc, new RegExp(escapeRegExp(recommendedDefaultsCopy)));
});

test("README and FEATURES keep beginner-facing German text free of mojibake", () => {
  const readme = readText(readmePath);
  const featuresDoc = readText(featuresDocPath);

  assert.doesNotMatch(readme, mojibakePattern);
  assert.doesNotMatch(featuresDoc, mojibakePattern);
  assert.match(readme, /Zurücksetzen/);
  assert.match(readme, /Neu prüfen/);
  assert.match(readme, /Änderungen/);
  assert.match(readme, /öffnest du/);
  assert.match(readme, /für/);
});

test("README contains a visible install badge", () => {
  const readme = readText(readmePath);

  assert.match(readme, /!\[Installieren\]\(https:\/\/img\.shields\.io\/badge\//);
});

test("README contains stable anchors for every xConfig module entry", () => {
  const readme = readText(readmePath);

  xconfigDescriptors.forEach((descriptor) => {
    assert.match(
      readme,
      new RegExp(`<a id="${descriptor.readmeAnchor}"></a>`),
      `missing README anchor for ${descriptor.featureKey}`
    );
  });
});

test("every xConfig field carries UI and docs descriptions", () => {
  xconfigDescriptors.forEach((descriptor) => {
    assert.ok(descriptor.description, `missing card description for ${descriptor.featureKey}`);
    descriptor.fields.forEach((field) => {
      const fieldId = field.key || field.action;
      assert.ok(field.description, `missing UI description for ${descriptor.featureKey}.${fieldId}`);
      assert.ok(
        field.docsDescription,
        `missing README description for ${descriptor.featureKey}.${fieldId}`
      );
      assert.ok(
        field.featuresDescription,
        `missing FEATURES description for ${descriptor.featureKey}.${fieldId}`
      );
    });
  });
});

test("every xConfig select option carries UI and docs descriptions", () => {
  xconfigDescriptors.forEach((descriptor) => {
    descriptor.fields
      .filter((field) => field.control === "select")
      .forEach((field) => {
        assert.ok(Array.isArray(field.options) && field.options.length > 0);
        field.options.forEach((option) => {
          const optionValue = String(option.value ?? "");
          const optionId = `${descriptor.featureKey}.${field.key}.${optionValue || "<empty>"}`;
          assert.ok(option.description, `missing UI option description for ${optionId}`);
          assert.ok(option.docsDescription, `missing README option description for ${optionId}`);
          assert.ok(option.featuresDescription, `missing FEATURES option description for ${optionId}`);
        });
      });
  });
});

test("README contains the generated xConfig feature sections and all setting explanations", () => {
  const readme = readText(readmePath);

  xconfigDescriptors.forEach((descriptor) => {
    const definition = featureDefinitionByKey.get(descriptor.featureKey);
    assert.ok(definition, `missing feature definition for ${descriptor.featureKey}`);
    const expectedSection = buildReadmeFeatureSection(descriptor, definition).trim();
    assert.match(
      readme,
      new RegExp(escapeRegExp(expectedSection)),
      `README drift for ${descriptor.featureKey}`
    );
  });
});

test("Templates Global README renders font names as preview labels instead of repeated option copy", () => {
  const descriptor = xconfigDescriptors.find(
    (entry) => entry.featureKey === "theme-global-typography"
  );
  assert.ok(descriptor);
  const definition = featureDefinitionByKey.get("theme-global-typography");
  assert.ok(definition);

  const section = buildReadmeFeatureSection(descriptor, definition);
  assert.match(section, /<span style="font-family: .*">Aldrich<\/span>/);
  assert.match(section, /<span style="font-family: .*">Inconsolata<\/span>/);
  assert.doesNotMatch(section, /\s{2}- `Aldrich`:/);
  assert.doesNotMatch(section, /\s{2}- `Inconsolata`:/);
});

test("FEATURES doc screenshot paths exist in docs/screenshots", () => {
  const featuresDoc = readText(featuresDocPath);
  const imageMatches = Array.from(featuresDoc.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g));

  assert.ok(imageMatches.length >= 16);

  imageMatches.forEach((match) => {
    const screenshotPath = path.resolve(process.cwd(), "docs", match[1]);
    assert.equal(
      existsSync(screenshotPath),
      true,
      `missing screenshot in FEATURES.md: ${match[1]}`
    );
  });
});

test("FEATURES uses the current AD xConfig overview screenshots", () => {
  const featuresDoc = readText(featuresDocPath);

  requiredFeaturesOverviewScreenshots.forEach((screenshotPath) => {
    assert.match(featuresDoc, new RegExp(escapeRegExp(screenshotPath)));
  });
});

test("FEATURES doc contains the generated xConfig feature sections and all setting explanations", () => {
  const featuresDoc = readText(featuresDocPath);

  xconfigDescriptors.forEach((descriptor) => {
    const definition = featureDefinitionByKey.get(descriptor.featureKey);
    assert.ok(definition, `missing feature definition for ${descriptor.featureKey}`);
    const expectedSection = buildFeaturesDocSection(descriptor, definition).trim();
    assert.match(
      featuresDoc,
      new RegExp(escapeRegExp(expectedSection)),
      `FEATURES drift for ${descriptor.featureKey}`
    );
  });
});

test("docs/screenshots contains no duplicate files by content hash", () => {
  const screenshotsDir = path.resolve(process.cwd(), "docs", "screenshots");
  const screenshotFiles = readdirSync(screenshotsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.resolve(screenshotsDir, entry.name));

  const filesByHash = new Map();
  screenshotFiles.forEach((filePath) => {
    const hash = crypto
      .createHash("sha256")
      .update(readFileSync(filePath))
      .digest("hex");
    const list = filesByHash.get(hash) || [];
    list.push(path.basename(filePath));
    filesByHash.set(hash, list);
  });

  const duplicates = Array.from(filesByHash.values()).filter((group) => group.length > 1);
  assert.equal(duplicates.length, 0, `duplicate screenshots found: ${JSON.stringify(duplicates)}`);
});

test("xConfig preview screenshot manifest points only to existing canonical screenshots", () => {
  Object.entries(XCONFIG_PREVIEW_SCREENSHOTS).forEach(([featureKey, fileName]) => {
    const screenshotPath = path.resolve(process.cwd(), "docs", "screenshots", fileName);
    assert.equal(
      existsSync(screenshotPath),
      true,
      `missing preview screenshot for ${featureKey}: ${fileName}`
    );
  });
});

test("xConfig preview manifest covers the key animation/theme cards with visual backgrounds", () => {
  const requiredPreviewFeatureKeys = [
    "theme-global-typography",
    "theme-x01",
    "theme-gotcha",
    "theme-x01-2player",
    "theme-shanghai",
    "theme-bermuda",
    "theme-cricket",
    "theme-bull-off",
    "checkout-score-highlight",
    "x01-bust-active-player-highlight",
    "checkout-target-highlights",
    "tv-board-zoom",
    "checkout-suggestion-styles",
    "avg-trend-arrow",
    "active-player-sweep",
    "special-hit-highlights",
    "cricket-target-highlighter",
    "cricket-grid-status-effects",
    "dartboard-marker-highlight",
    "dart-marker-replacer",
    "take-out-darts-alert",
    "single-bull-hit-sound",
    "turn-score-counter",
    "winner-celebration-effect",
  ];

  requiredPreviewFeatureKeys.forEach((featureKey) => {
    assert.equal(
      Object.hasOwn(XCONFIG_PREVIEW_SCREENSHOTS, featureKey),
      true,
      `missing preview mapping for ${featureKey}`
    );
  });
});

test("dart rule audit documents exist", () => {
  [dartRuleModulesDocPath, dartRulesReferenceDocPath, dartRuleAuditDocPath].forEach((filePath) => {
    assert.equal(existsSync(filePath), true, `missing dart rule doc: ${path.basename(filePath)}`);
  });
});

test("dart rule docs mention the audited core modules and rule topics", () => {
  const modulesDoc = readText(dartRuleModulesDocPath);
  const referenceDoc = readText(dartRulesReferenceDocPath);
  const auditDoc = readText(dartRuleAuditDocPath);

  assert.match(modulesDoc, /src\/domain\/x01-rules\.js/);
  assert.match(modulesDoc, /src\/domain\/cricket-rules\.js/);
  assert.match(referenceDoc, /Double-Out|Double Out/);
  assert.match(referenceDoc, /Cut-Throat|Cut Throat/);
  assert.match(auditDoc, /checkout-score-highlight/);
  assert.match(auditDoc, /tv-board-zoom/);
});

test("release architecture and QA docs mention public action API and release status", () => {
  const architectureDoc = readText(architectureDocPath);
  const migrationDoc = readText(migrationStatusDocPath);
  const releaseQaDoc = readText(releaseQaDocPath);

  assert.match(architectureDoc, /runFeatureAction\(featureKey, actionId\)/);
  assert.match(architectureDoc, /applyRecommendedDefaults\(\)/);
  assert.match(architectureDoc, /v1\.1\.0/);
  assert.match(migrationDoc, /v1\.1\.0/);
  assert.match(releaseQaDoc, /Winner Celebration Effect/);
  assert.match(releaseQaDoc, /Release-QA-Report/);
});

test("runtime audit docs exist and cover entry points plus findings", () => {
  [runtimeEntrypointsDocPath, performanceAuditDocPath].forEach((filePath) => {
    assert.equal(existsSync(filePath), true, `missing runtime audit doc: ${path.basename(filePath)}`);
  });

  const runtimeEntrypointsDoc = readText(runtimeEntrypointsDocPath);
  const performanceAuditDoc = readText(performanceAuditDocPath);

  assert.match(runtimeEntrypointsDoc, /Bootstrap/i);
  assert.match(runtimeEntrypointsDoc, /Mutation Observer/i);
  assert.match(runtimeEntrypointsDoc, /Game State/i);
  assert.match(runtimeEntrypointsDoc, /winner-celebration-effect/);

  assert.match(performanceAuditDoc, /Findings/i);
  assert.match(performanceAuditDoc, /Changes Applied/i);
  assert.match(performanceAuditDoc, /Verification/i);
  assert.match(performanceAuditDoc, /duplicate game-state wakeups/i);
});
