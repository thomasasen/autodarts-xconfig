import { getXConfigDescriptor } from "./descriptors.js";
import { getCricketTableFields, groupCricketTableDocumentation } from "./cricket-table-settings.js";

export const PRESENTATION_GROUPS = Object.freeze([
  { key: "cricket-layout", title: "Cricket-/Tactics-Tabelle", kind: "cricket-table", members: [
    ["cricket-layout", "Layout anpassen"], ["cricket-grid-status-effects", "Status und Effekte anzeigen"],
  ] },
  { key: "dartboard-marker-highlight", title: "Board-Treffermarkierungen", members: [
    ["dartboard-marker-highlight", "Native Marker hervorheben"], ["dart-marker-replacer", "Dart-Bilder anzeigen"],
  ] },
  { key: "checkout-score-highlight", title: "X01-Restscore", members: [
    ["checkout-score-highlight", "Finishbaren Restscore hervorheben"], ["x01-remaining-score-bar", "Restscore-Balken anzeigen"],
  ] },
  { key: "turn-score-counter", title: "Wurfanzeige", members: [
    ["turn-dart-display", "Dart-Symbole gestalten"], ["special-hit-highlights", "Treffer hervorheben"], ["turn-score-counter", "Wurfsumme animieren"],
  ] },
]);

export function getPresentationGroup(featureKey) {
  return PRESENTATION_GROUPS.find((group) => group.members.some(([key]) => key === featureKey)) || null;
}

export function groupPresentationFeatures(features) {
  const result = features.filter((feature) => !getPresentationGroup(feature.featureKey));
  PRESENTATION_GROUPS.forEach((group) => {
    const members = group.members.map(([key, label]) => {
      const feature = features.find((entry) => entry.featureKey === key);
      return feature ? { ...feature, groupLabel: label } : null;
    }).filter(Boolean);
    if (!members.length) return;
    const primary = members.find((entry) => entry.featureKey === group.key) || members[0];
    result.push({ ...primary, featureKey: group.key, title: group.title,
      enabled: members.some((entry) => entry.enabled), presentationMembers: members, presentationGroup: group });
  });
  return result;
}

export function getPresentationFields(members) {
  if (members.some((entry) => ["cricket-layout", "cricket-grid-status-effects"].includes(entry.featureKey))) return getCricketTableFields(members);
  return members.flatMap((member) => (getXConfigDescriptor(member.featureKey)?.fields || []).map((field) => ({
    ...field, sourceFeatureKey: member.featureKey,
    label: field.key === "debug" ? `Diagnose: ${member.groupLabel}` : field.label,
    section: field.key === "debug" ? "Erweitert" : field.section || member.groupLabel,
  }))).sort((left, right) => Number(left.section === "Erweitert") - Number(right.section === "Erweitert"));
}

export function groupPresentationDocumentation(entries) {
  let result = groupCricketTableDocumentation(entries);
  PRESENTATION_GROUPS.filter((group) => group.key !== "cricket-layout").forEach((group) => {
    const members = group.members.map(([key, groupLabel]) => {
      const entry = result.find(({ descriptor }) => descriptor.featureKey === key);
      return entry ? { ...entry, featureKey: key, groupLabel } : null;
    }).filter(Boolean);
    const primary = members.find((entry) => entry.featureKey === group.key);
    if (!primary) return;
    const aliases = members.flatMap(({ descriptor }) => [descriptor.readmeAnchor, ...descriptor.readmeAnchorAliases]);
    result = result.filter(({ descriptor }) => !group.members.some(([key]) => key === descriptor.featureKey) || descriptor.featureKey === group.key)
      .map((entry) => entry.descriptor.featureKey !== group.key ? entry : {
        descriptor: { ...primary.descriptor, fields: getPresentationFields(members),
          settingsDetails: [...new Set(members.flatMap(({ descriptor }) => descriptor.settingsDetails || []))],
          readmeAnchorAliases: [...new Set(aliases)].filter((alias) => alias !== primary.descriptor.readmeAnchor) },
        definition: { ...primary.definition, title: group.title },
      });
  });
  return result;
}
