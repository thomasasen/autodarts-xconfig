function freezeOptions(options) {
  return Object.freeze(options.map((option) => Object.freeze(option)));
}

export const CHECKOUT_SCORE_OPTIONS = Object.freeze({
  effect: freezeOptions([
    ["grow-glow", "Vergrößern & leuchten"], ["glow-only", "Nur leuchten"],
    ["grow-only", "Nur vergrößern"], ["fade-blink", "Sanft blinken"],
  ]),
  intensity: freezeOptions([["dezent", "Dezent"], ["standard", "Standard"], ["stark", "Stark"]]),
  triggerSource: freezeOptions([
    ["suggestion-first", "Vorschlag zuerst"], ["score-only", "Nur Score"], ["suggestion-only", "Nur Vorschlag"],
  ]),
});

export const CHECKOUT_EFFECT_ALIASES = Object.freeze({
  "": "grow-only", pulse: "grow-glow", glow: "glow-only", scale: "grow-only", blink: "fade-blink",
  ...Object.fromEntries(CHECKOUT_SCORE_OPTIONS.effect.map(([value]) => [value, value])),
});

export const TV_ZOOM_OPTIONS = Object.freeze({
  zoomLevel: freezeOptions([[2.35, "Leicht"], [2.75, "Mittel"], [3.15, "Stark"]]),
  zoomStyle: freezeOptions([["standard", "Standard"], ["cinematic", "Cinematic"]]),
  zoomSpeed: freezeOptions([["schnell", "Schnell"], ["mittel", "Mittel"], ["langsam", "Langsam"]]),
  checkoutZoomTarget: freezeOptions([["finish-only", "Nur Finish-Feld"], ["route-first", "Erstes Routenfeld"]]),
});
