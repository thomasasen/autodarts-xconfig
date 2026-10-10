import { TOOLS_ANIMATION_ACTIVE_ATTRIBUTE } from "../shared/tools-animation-layer-controller.js";

export const STYLE_ID = "ad-ext-x01-bust-active-player-highlight-style";
export const BUST_ACTIVE_CLASS = "ad-ext-x01-bust-active-player-highlight";
export const BUST_SURFACE_CLASS = "ad-ext-x01-bust-surface-highlight";
export const BUST_IMPACT_SURFACE_CLASS = "ad-ext-x01-bust-impact-highlight";
export const BUST_CRACK_OVERLAY_CLASS = "ad-ext-x01-bust-active-player-cracks";
export const BUST_CRACK_CLASS = "ad-ext-x01-bust-active-player-crack";
export const BUST_IMPACT_HOLE_CLASS = "ad-ext-x01-bust-impact-hole";
export const NATIVE_BUST_EFFECT_HIDDEN_CLASS = "ad-ext-x01-bust-native-effect-hidden";
export const DEMO_CRACK_SETTINGS = Object.freeze({
  rays: 20,
  initialRadius: 5,
  radiusStart: 15,
  densityPercent: 50,
  curvaturePercent: 30,
  ringConnectionPercent: 60,
  diagonalConnectionPercent: 30,
  refractWidth: 3,
  refractShift: 6,
  reflectAlpha: 0.3,
  fractureSize: 33,
  fractureAlpha: 0.4,
  mainlineOffset: 0.03,
  mainlineStrength: 0.14,
  mainlineHighlight: 0.2,
  mainlineAlpha: 65,
  noiseFrequency: 0.4,
  noiseAlpha: 1,
});

export const BUST_CARD_STYLE_PROPERTIES = Object.freeze([
  "--ad-ext-x01-bust-active-player-background",
  "--ad-ext-x01-bust-active-player-background-color",
  "--ad-ext-x01-bust-active-player-border",
  "--ad-ext-x01-bust-active-player-box-shadow",
]);

export const FALLBACK_BUST_CARD_VISUALS = Object.freeze({
  background: "linear-gradient(145deg, rgba(48, 10, 20, 0.97), rgba(18, 20, 27, 0.96))",
  backgroundColor: "rgb(31, 13, 19)",
  border: "2px solid rgb(217, 31, 62)",
  boxShadow:
    "rgba(217, 31, 62, 0.16) 0 0 0 9999px inset, rgba(217, 31, 62, 0.32) 0 0 18px 0",
});

export function buildStyleText() {
  return `
.${NATIVE_BUST_EFFECT_HIDDEN_CLASS} {
  display: none !important;
}

.${BUST_ACTIVE_CLASS} {
  position: relative !important;
  isolation: isolate;
  border: var(--ad-ext-x01-bust-active-player-border, 2px solid rgb(217, 31, 62)) !important;
  box-shadow: var(--ad-ext-x01-bust-active-player-box-shadow, rgba(217, 31, 62, 0.16) 0 0 0 9999px inset, rgba(217, 31, 62, 0.32) 0 0 18px 0) !important;
}

.${BUST_SURFACE_CLASS} {
  position: relative !important;
  isolation: isolate;
}

.${BUST_SURFACE_CLASS}::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2147483000;
  border-radius: inherit;
  background: rgba(217, 31, 62, 0.2);
  box-shadow: inset 0 0 0 3px rgba(217, 31, 62, 0.95), inset 0 0 84px rgba(217, 31, 62, 0.42);
  pointer-events: auto;
}

.${BUST_SURFACE_CLASS} > .${BUST_CRACK_OVERLAY_CLASS} {
  z-index: 2147483001;
  pointer-events: auto;
}

html:has(.${BUST_IMPACT_SURFACE_CLASS}) #ad-ext-dart-image-overlay {
  z-index: 2147483002 !important;
  clip-path: none !important;
  overflow: visible !important;
}

html:has(.${BUST_IMPACT_SURFACE_CLASS}) #ad-ext-dart-image-overlay .ad-ext-dart-flight-group:not(:last-of-type) {
  visibility: hidden !important;
}

.${BUST_ACTIVE_CLASS}:not(:has(> .chakra-stack)) {
  background: var(--ad-ext-x01-bust-active-player-background, linear-gradient(145deg, rgba(48, 10, 20, 0.97), rgba(18, 20, 27, 0.96))) !important;
  background-color: var(--ad-ext-x01-bust-active-player-background-color, rgb(31, 13, 19)) !important;
}

#ad-ext-player-display .ad-ext-player.${BUST_ACTIVE_CLASS} > .chakra-stack,
.ad-ext-player.${BUST_ACTIVE_CLASS} > .chakra-stack {
  background: var(--ad-ext-x01-bust-active-player-background, linear-gradient(145deg, rgba(48, 10, 20, 0.97), rgba(18, 20, 27, 0.96))) !important;
  background-color: var(--ad-ext-x01-bust-active-player-background-color, rgb(31, 13, 19)) !important;
}

.${BUST_CRACK_OVERLAY_CLASS} {
  position: absolute;
  inset: 0;
  z-index: 3;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.${BUST_CRACK_CLASS} {
  fill: none;
  stroke: rgba(255, 236, 240, 0.92);
  stroke-linecap: round;
  stroke-linejoin: round;
  animation: ad-ext-x01-bust-crack-appear 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.${BUST_CRACK_CLASS} .ad-ext-x01-bust-crack-main {
  stroke: rgba(255, 226, 232, 0.82);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.${BUST_CRACK_CLASS} .ad-ext-x01-bust-crack-reflection {
  stroke: rgba(255, 112, 136, ${DEMO_CRACK_SETTINGS.reflectAlpha * 0.72});
  stroke-width: ${DEMO_CRACK_SETTINGS.refractWidth};
  vector-effect: non-scaling-stroke;
}

.${BUST_CRACK_CLASS} .ad-ext-x01-bust-crack-web {
  stroke: rgba(255, 151, 168, 0.58);
  stroke-width: 0.8;
  vector-effect: non-scaling-stroke;
}

.${BUST_CRACK_CLASS} .ad-ext-x01-bust-crack-splinters {
  stroke: rgba(255, 218, 225, 0.76);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.${BUST_CRACK_CLASS} .ad-ext-x01-bust-crack-noise {
  stroke: rgba(217, 31, 62, ${DEMO_CRACK_SETTINGS.noiseAlpha * 0.34});
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.${BUST_CRACK_CLASS} .ad-ext-x01-bust-crack-shards {
  fill: rgba(217, 31, 62, ${DEMO_CRACK_SETTINGS.fractureAlpha * 0.52});
  stroke: none;
  vector-effect: non-scaling-stroke;
}

.${BUST_IMPACT_HOLE_CLASS} {
  fill: rgba(5, 7, 12, 0.96);
  stroke: rgba(255, 218, 225, 0.9);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
  filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 7px rgba(217, 31, 62, 0.9));
}

html[${TOOLS_ANIMATION_ACTIVE_ATTRIBUTE}="true"] .${BUST_SURFACE_CLASS}::before,
html[${TOOLS_ANIMATION_ACTIVE_ATTRIBUTE}="true"] .${BUST_CRACK_OVERLAY_CLASS},
html[${TOOLS_ANIMATION_ACTIVE_ATTRIBUTE}="true"] .${BUST_CRACK_OVERLAY_CLASS} * {
  visibility: hidden !important;
  pointer-events: none !important;
}

@keyframes ad-ext-x01-bust-crack-appear {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .${BUST_CRACK_CLASS} {
    animation: none;
  }
}
`;
}
