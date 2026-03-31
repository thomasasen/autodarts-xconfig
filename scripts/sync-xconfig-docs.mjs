import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { xconfigDescriptors } from "../src/features/xconfig-ui/descriptors.js";
import {
  buildXConfigOverviewSection,
  buildFeaturesDocSection,
  buildReadmeFeatureSection,
} from "../src/features/xconfig-ui/copy.js";
import { defaultFeatureDefinitions } from "../src/features/feature-registry.js";

const repoRoot = process.cwd();
const readmePath = path.resolve(repoRoot, "README.md");
const featuresDocPath = path.resolve(repoRoot, "docs", "FEATURES.md");

const definitionByFeatureKey = new Map(
  defaultFeatureDefinitions.map((definition) => [definition.featureKey, definition])
);

const orderedEntries = xconfigDescriptors
  .map((descriptor) => ({
    descriptor,
    definition: definitionByFeatureKey.get(descriptor.featureKey) || null,
  }))
  .filter((entry) => entry.definition);

const overviewCounts = Object.freeze({
  totalModules: orderedEntries.length,
  animationModules: orderedEntries.filter((entry) => entry.descriptor.tab !== "themes").length,
  themeModules: orderedEntries.filter((entry) => entry.descriptor.tab === "themes").length,
  themeImageLimit: "1,5 MiB",
});

function buildQuickNavigation() {
  const themeEntries = orderedEntries.filter((entry) => entry.descriptor.tab === "themes");
  const animationEntries = orderedEntries.filter((entry) => entry.descriptor.tab !== "themes");

  const lines = ["## Schnellnavigation", "", "### Themen", ""];

  themeEntries.forEach(({ descriptor, definition }) => {
    lines.push(`- [${definition.title}](#${descriptor.readmeAnchor})`);
  });

  lines.push("", "### Animationen und Komfort", "");

  animationEntries.forEach(({ descriptor, definition }) => {
    lines.push(`- [${definition.title}](#${descriptor.readmeAnchor})`);
  });

  return `${lines.join("\n")}\n`;
}

function buildReadmeFeatureDocs() {
  const themeSections = orderedEntries
    .filter((entry) => entry.descriptor.tab === "themes")
    .map(({ descriptor, definition }) => buildReadmeFeatureSection(descriptor, definition).trim())
    .join("\n\n");
  const animationSections = orderedEntries
    .filter((entry) => entry.descriptor.tab !== "themes")
    .map(({ descriptor, definition }) => buildReadmeFeatureSection(descriptor, definition).trim())
    .join("\n\n");

  return [
    buildQuickNavigation().trim(),
    "",
    "## Themen",
    "",
    themeSections,
    "",
    "## Animationen und Komfort",
    "",
    animationSections,
    "",
  ].join("\n");
}

function buildFeaturesDocGroup(title, entries) {
  const sections = entries
    .map(({ descriptor, definition }) => buildFeaturesDocSection(descriptor, definition).trim())
    .join("\n\n");
  return [`## ${title}`, "", sections, ""].join("\n");
}

function buildFeaturesDocSections() {
  const introSection = [
    "# Feature-Übersicht",
    "",
    `\`autodarts-xconfig\` bündelt \`${overviewCounts.totalModules}\` Module in einem Userscript:`,
    "",
    `- \`${overviewCounts.animationModules}\` Animationen und Komfortfunktionen`,
    `- \`${overviewCounts.themeModules}\` Themes`,
    "",
    "Die gesamte Steuerung läuft über **AD xConfig** direkt im Spiel. Die schnelle Benutzer-Einführung findest du in der [README](../README.md).",
    "",
    buildXConfigOverviewSection("Hinweise zur Konfiguration", overviewCounts).trim(),
    "",
    "![AD xConfig Themenübersicht](screenshots/ad-xconfig-themen.png)",
    "![AD xConfig Animationenübersicht](screenshots/ad-xconfig-animationen.png)",
  ].join("\n");
  const themeEntries = orderedEntries.filter((entry) => entry.descriptor.tab === "themes");
  const x01Entries = orderedEntries.filter(
    (entry) => entry.descriptor.tab !== "themes" && entry.definition.variants.includes("x01")
  );
  const cricketEntries = orderedEntries.filter(
    (entry) =>
      entry.descriptor.tab !== "themes" &&
      entry.definition.variants.includes("cricket") &&
      entry.definition.variants.includes("tactics")
  );
  const allModeEntries = orderedEntries.filter(
    (entry) => entry.descriptor.tab !== "themes" && entry.definition.variants.includes("all")
  );

  return [
    introSection.trim(),
    "",
    buildFeaturesDocGroup("Themes", themeEntries).trim(),
    "",
    buildFeaturesDocGroup("Animationen für X01", x01Entries).trim(),
    "",
    buildFeaturesDocGroup("Animationen für Cricket und Tactics", cricketEntries).trim(),
    "",
    buildFeaturesDocGroup("Animationen für alle Modi", allModeEntries).trim(),
    "",
  ].join("\n");
}

function replaceSection(documentText, startHeading, endHeading, replacement) {
  const startIndex = documentText.indexOf(startHeading);
  const endIndex = documentText.lastIndexOf(endHeading);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error(`Unable to replace section between "${startHeading}" and "${endHeading}".`);
  }

  return `${documentText.slice(0, startIndex)}${replacement}\n${documentText.slice(endIndex)}`;
}

function syncReadme() {
  const current = readFileSync(readmePath, "utf8");
  const replacement = buildReadmeFeatureDocs();
  const next = replaceSection(
    current,
    "## Schnellnavigation",
    "## Weitere Dokumentation",
    replacement
  );
  writeFileSync(readmePath, next, "utf8");
}

function syncFeaturesDoc() {
  const current = readFileSync(featuresDocPath, "utf8");
  const replacement = buildFeaturesDocSections();
  const next = replaceSection(
    current,
    '# Feature-Übersicht',
    '## Hinweise zur Konfiguration',
    replacement
  );
  writeFileSync(featuresDocPath, next, "utf8");
}

syncReadme();
syncFeaturesDoc();

