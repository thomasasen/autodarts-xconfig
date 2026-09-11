import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { xconfigDescriptors } from "../src/features/xconfig-ui/descriptors.js";
import {
  buildModuleFinderSection,
  buildRecommendedDefaultsSection,
  buildXConfigOverviewSection,
  buildFeaturesDocSection,
  buildReadmeFeatureSection,
} from "../src/features/xconfig-ui/copy.js";
import { createRecommendedFeatureConfig } from "../src/config/feature-config-spec.js";
import { defaultFeatureDefinitions } from "../src/features/feature-registry.js";
import { getXConfigSectionMeta, XCONFIG_SECTION_DEFINITIONS } from "../src/features/xconfig-ui/sections.js";

const repoRoot = process.cwd();
const readmePath = path.resolve(repoRoot, "README.md");
const featuresDocPath = path.resolve(repoRoot, "docs", "FEATURES.md");
const GENERATED_SECTION_START_MARKER = "<!-- xconfig-generated:start -->";
const GENERATED_SECTION_END_MARKER = "<!-- xconfig-generated:end -->";

const definitionByFeatureKey = new Map(
  defaultFeatureDefinitions.map((definition) => [definition.featureKey, definition])
);

function resolveRecommendedConfig(featureKey) {
  const definition = definitionByFeatureKey.get(String(featureKey || "").trim());
  return definition?.configKey ? createRecommendedFeatureConfig(definition.configKey) : null;
}

const orderedEntries = xconfigDescriptors
  .map((descriptor) => ({
    descriptor,
    definition: definitionByFeatureKey.get(descriptor.featureKey) || null,
  }))
  .filter((entry) => entry.definition);

const overviewCounts = Object.freeze({
  totalModules: orderedEntries.length,
  animationModules: orderedEntries.filter(
    (entry) => getXConfigSectionMeta(entry.descriptor.featureKey).sectionId !== "template"
  ).length,
  themeModules: orderedEntries.filter(
    (entry) => getXConfigSectionMeta(entry.descriptor.featureKey).sectionId === "template"
  ).length,
  themeImageLimit: "1,5 MiB",
});

function entriesForSection(sectionId) {
  return orderedEntries.filter(
    (entry) => getXConfigSectionMeta(entry.descriptor.featureKey).sectionId === sectionId
  );
}

function buildRecommendedDefaultsSummary() {
  return [
    "## Empfohlene Standards",
    "",
    "Die Aktion `Empfohlene Standards` übernimmt ausgewogene Presets, schaltet alle Module aus und lässt globales Wallpaper sowie Dart-Upload unangetastet.",
    "",
    "[Vollständiges Profil der empfohlenen Standards](docs/FEATURES.md#empfohlene-standards)",
  ].join("\n");
}

function buildReadmeFeatureDocs() {
  const sectionDocs = XCONFIG_SECTION_DEFINITIONS.flatMap((section) => {
    const entries = entriesForSection(section.id);
    const featureSections = entries
      .map(({ descriptor, definition }) => buildReadmeFeatureSection(descriptor, definition).trim())
      .join("\n\n");
    return [`## ${section.title}`, "", featureSections, ""];
  });

  return [
    buildModuleFinderSection("Modul-Finder", orderedEntries).trim(),
    "",
    buildRecommendedDefaultsSummary(),
    "",
    ...sectionDocs,
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
    "Die gesamte Steuerung läuft über **AD xConfig** direkt im Spiel. Alle Kacheln stehen gemeinsam auf einer Seite in den Bereichen **Design**, **Alle Modi**, **X01** und **Cricket / Tactics**. Die schnelle Benutzer-Einführung findest du in der [README](../README.md).",
    "",
    "![Aktuelle AD xConfig Übersicht](screenshots/ad-xconfig-overview-v3.png)",
    "",
    buildXConfigOverviewSection("Hinweise zur Konfiguration", overviewCounts).trim(),
  ].join("\n");

  return [
    introSection.trim(),
    "",
    '<a id="empfohlene-standards"></a>',
    "",
    buildRecommendedDefaultsSection(
      "Empfohlene Standards",
      xconfigDescriptors,
      resolveRecommendedConfig
    ).trim(),
    "",
    ...XCONFIG_SECTION_DEFINITIONS.flatMap((section) => [
      buildFeaturesDocGroup(section.title, entriesForSection(section.id)).trim(),
      "",
    ]),
    "",
  ].join("\n");
}

function replaceMarkedSection(documentText, replacement) {
  const startIndex = documentText.indexOf(GENERATED_SECTION_START_MARKER);
  const endIndex = documentText.indexOf(GENERATED_SECTION_END_MARKER);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error("Unable to replace generated section between sync markers.");
  }

  const before = documentText.slice(0, startIndex + GENERATED_SECTION_START_MARKER.length);
  const after = documentText.slice(endIndex);
  return `${before}\n${replacement.trim()}\n${after}`;
}

function syncReadme() {
  const current = readFileSync(readmePath, "utf8");
  const replacement = buildReadmeFeatureDocs();
  const next = replaceMarkedSection(current, replacement);
  writeFileSync(readmePath, next, "utf8");
}

function syncFeaturesDoc() {
  const current = readFileSync(featuresDocPath, "utf8");
  const replacement = buildFeaturesDocSections();
  const next = replaceMarkedSection(current, replacement);
  writeFileSync(featuresDocPath, next, "utf8");
}

syncReadme();
syncFeaturesDoc();

