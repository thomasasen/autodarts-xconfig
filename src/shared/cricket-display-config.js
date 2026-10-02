export const CRICKET_STATUS_STYLE_OPTIONS = Object.freeze([
  { value: "legacy", label: "Bisheriger Stil" },
  { value: "color", label: "Farbe" },
  { value: "pattern", label: "Farbe und Muster" },
]);
export const CRICKET_STATUS_EMPHASIS_OPTIONS = Object.freeze([
  { value: "legacy", label: "Bisheriger Stil" }, { value: "off", label: "Aus" },
  { value: "edge", label: "Rand" }, { value: "surface", label: "Rand und dezente Fläche" },
]);
export const CRICKET_FEEDBACK_OPTIONS = Object.freeze([
  { value: "off", label: "Aus" }, { value: "impulse", label: "Kurzer Impuls" },
  { value: "changes", label: "Impuls mit Änderungsanzeige" }, { value: "custom", label: "Benutzerdefiniert", disabled: true },
]);
export const CRICKET_GRID_PROFILES = Object.freeze({
  calm: Object.freeze({ rowWave: false, badgeBeacon: false, markProgress: false, pressureEdge: true, scoringStripe: true, deadRowMuted: true, deltaChips: false, hitSpark: true, roundTransitionWipe: false, pressureOverlay: false, statusStyle: "pattern", scoringStyle: "edge", pressureStyle: "edge", intensity: "subtle" }),
  animated: Object.freeze({ rowWave: true, badgeBeacon: true, markProgress: true, pressureEdge: true, scoringStripe: true, deadRowMuted: true, deltaChips: true, hitSpark: true, roundTransitionWipe: true, pressureOverlay: true, statusStyle: "legacy", scoringStyle: "legacy", pressureStyle: "legacy", intensity: "normal" }),
});
export const CRICKET_BOARD_PROFILES = Object.freeze({
  calm: Object.freeze({ showOpenObjectives: false, showDeadObjectives: true, irrelevantBoardDimStyle: "smoke", statusStyle: "pattern", intensity: "subtle" }),
  learning: Object.freeze({ showOpenObjectives: true, showDeadObjectives: true, irrelevantBoardDimStyle: "smoke", statusStyle: "pattern", intensity: "normal" }),
});

export function resolveCricketDisplayProfile(values, profiles) {
  return Object.keys(profiles).find((key) => Object.entries(profiles[key]).every(([setting, value]) => values[setting] === value)) || "custom";
}

export function resolveCricketFeedback(values) {
  if (values.hitSpark && values.deltaChips) return "changes";
  if (values.hitSpark) return "impulse";
  return values.deltaChips ? "custom" : "off";
}

export function buildCricketDisplaySettingValues(configKey, key, value) {
  const profiles = configKey === "cricketGridStatusEffects" ? CRICKET_GRID_PROFILES : CRICKET_BOARD_PROFILES;
  if (key === "displayProfile" && profiles[value]) {
    const values = profiles[value];
    const aliases = configKey === "cricketGridStatusEffects"
      ? { threatEdge: values.pressureEdge, scoringLane: values.scoringStripe, deadRowCollapse: values.deadRowMuted, opponentPressureOverlay: values.pressureOverlay }
      : { showOpenTargets: values.showOpenObjectives, showDeadTargets: values.showDeadObjectives, dimIrrelevantBoardTargets: values.irrelevantBoardDimStyle !== "off" };
    return { ...values, ...aliases, displayProfile: value };
  }
  if (configKey === "cricketGridStatusEffects") {
    if (key === "feedback" && value !== "custom") return { hitSpark: value !== "off", deltaChips: value === "changes" };
    if (key === "scoringStyle" && value !== "legacy") return { scoringStyle: value, scoringStripe: value !== "off", scoringLane: value !== "off" };
    if (key === "pressureStyle" && value !== "legacy") return { pressureStyle: value, pressureEdge: value !== "off", threatEdge: value !== "off", pressureOverlay: value === "surface", opponentPressureOverlay: value === "surface" };
    const aliases = { pressureEdge: "threatEdge", scoringStripe: "scoringLane", deadRowMuted: "deadRowCollapse", pressureOverlay: "opponentPressureOverlay" };
    if (aliases[key]) {
      // Advanced switches take over their presentation so an earlier "off" preset cannot mask them.
      const style = key === "scoringStripe" ? { scoringStyle: "legacy" }
        : ["pressureEdge", "pressureOverlay"].includes(key) ? { pressureStyle: "legacy" } : {};
      return { [key]: value, [aliases[key]]: value, ...style };
    }
  } else {
    if (key === "irrelevantBoardDimStyle") return { [key]: value, dimIrrelevantBoardTargets: value !== "off" };
    const aliases = { showOpenObjectives: "showOpenTargets", showDeadObjectives: "showDeadTargets" };
    if (aliases[key]) return { [key]: value, [aliases[key]]: value };
  }
  return { [key]: value };
}
