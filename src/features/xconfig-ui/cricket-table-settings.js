import { getXConfigDescriptor } from "./descriptors.js";

export const CRICKET_TABLE_FEATURE_KEYS = Object.freeze(["cricket-layout", "cricket-grid-status-effects"]);
export const CRICKET_TABLE_TITLE = "Cricket-/Tactics-Tabelle";

export function groupCricketTableFeatures(features) {
  const members = CRICKET_TABLE_FEATURE_KEYS.map((key) => features.find((feature) => feature.featureKey === key)).filter(Boolean);
  if (!members.length) return features;
  const primary = members.find((feature) => feature.featureKey === "cricket-layout") || members[0];
  return features.filter((feature) => !CRICKET_TABLE_FEATURE_KEYS.includes(feature.featureKey)).concat({
    ...primary,
    featureKey: "cricket-layout",
    title: CRICKET_TABLE_TITLE,
    enabled: members.some((feature) => feature.enabled),
    tableMembers: members,
  });
}

const legacyConditions = Object.freeze({
  pressureEdge: { key: "pressureStyle", value: "legacy" },
  pressureOverlay: { key: "pressureStyle", value: "legacy" },
  scoringStripe: { key: "scoringStyle", value: "legacy" },
  hitSpark: { key: "feedback", value: "custom" },
  deltaChips: { key: "feedback", value: "custom" },
});

// Keep source feature identities on every field, including duplicate keys such as debug.
export function getCricketTableFields(members) {
  const sections = ["Layout", "Status und Trefferfeedback", "Tactics", "Erweitert"];
  return members.flatMap((feature) => (getXConfigDescriptor(feature.featureKey)?.fields || []).map((field) => {
    const effects = feature.featureKey === "cricket-grid-status-effects";
    return {
      ...field,
      sourceFeatureKey: feature.featureKey,
      label: field.key === "debug" ? `Diagnose: ${effects ? "Status und Effekte" : "Layout"}` : field.label,
      section: field.key === "debug" ? "Erweitert" : field.section || (effects ? "Status und Trefferfeedback" : "Layout"),
      visibleWhen: effects ? legacyConditions[field.key] || field.visibleWhen : field.visibleWhen,
    };
  })).sort((left, right) => sections.indexOf(left.section) - sections.indexOf(right.section));
}

export function groupCricketTableDocumentation(entries) {
  const layout = entries.find(({ descriptor }) => descriptor.featureKey === "cricket-layout");
  const effects = entries.find(({ descriptor }) => descriptor.featureKey === "cricket-grid-status-effects");
  if (!layout || !effects) return entries;
  return entries.filter((entry) => entry !== effects).map((entry) => entry !== layout ? entry : {
    ...entry,
    descriptor: {
      ...layout.descriptor,
      fields: getCricketTableFields(CRICKET_TABLE_FEATURE_KEYS.map((featureKey) => ({ featureKey }))),
      readmeAnchorAliases: [...layout.descriptor.readmeAnchorAliases, effects.descriptor.readmeAnchor, ...effects.descriptor.readmeAnchorAliases],
    },
  });
}
