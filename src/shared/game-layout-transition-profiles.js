export const DEFAULT_GAME_LAYOUT_PLAYER_TRANSITION_EFFECT = "flip-resize";

export const GAME_LAYOUT_PLAYER_TRANSITION_PROFILES = Object.freeze({
  "flip-resize": Object.freeze({
    value: "flip-resize",
    label: "FLIP + Resize",
    durationMs: 340,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    laneOffsetPx: 0,
  }),
  "smooth-flip": Object.freeze({
    value: "smooth-flip",
    label: "Smooth FLIP",
    durationMs: 460,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    laneOffsetPx: 0,
  }),
  "lane-flip": Object.freeze({
    value: "lane-flip",
    label: "Lane FLIP",
    durationMs: 380,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    laneOffsetPx: -12,
  }),
});

export const GAME_LAYOUT_PLAYER_TRANSITION_EFFECT_OPTIONS = Object.freeze(
  Object.values(GAME_LAYOUT_PLAYER_TRANSITION_PROFILES).map((profile) =>
    Object.freeze({
      value: profile.value,
      label: profile.label,
    })
  )
);

const GAME_LAYOUT_PLAYER_TRANSITION_EFFECT_VALUES = new Set(
  GAME_LAYOUT_PLAYER_TRANSITION_EFFECT_OPTIONS.map((option) => option.value)
);

export function normalizeGameLayoutPlayerTransitionEffect(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return GAME_LAYOUT_PLAYER_TRANSITION_EFFECT_VALUES.has(normalized)
    ? normalized
    : DEFAULT_GAME_LAYOUT_PLAYER_TRANSITION_EFFECT;
}

export function getGameLayoutPlayerTransitionProfile(value) {
  const normalized = normalizeGameLayoutPlayerTransitionEffect(value);
  return GAME_LAYOUT_PLAYER_TRANSITION_PROFILES[normalized];
}

export function listGameLayoutPlayerTransitionEffects() {
  return GAME_LAYOUT_PLAYER_TRANSITION_EFFECT_OPTIONS.slice();
}
