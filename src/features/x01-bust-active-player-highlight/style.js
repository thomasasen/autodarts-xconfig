export const STYLE_ID = "ad-ext-x01-bust-active-player-highlight-style";
export const BUST_ACTIVE_CLASS = "ad-ext-x01-bust-active-player-highlight";
export const BUST_SHAKE_CLASS = "ad-ext-x01-bust-active-player-highlight--shake";
export const BUST_CRACK_OVERLAY_CLASS = "ad-ext-x01-bust-active-player-cracks";
export const BUST_CRACK_CLASS = "ad-ext-x01-bust-active-player-crack";
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
  background: "rgba(255, 0, 0, 0.15)",
  backgroundColor: "rgba(255, 0, 0, 0.15)",
  border: "0.8px solid rgb(207, 52, 52)",
  boxShadow: "none",
});

export function buildStyleText() {
  return `
#ad-ext-player-display .ad-ext-player.${BUST_ACTIVE_CLASS},
.ad-ext-player.ad-ext-player-active.${BUST_ACTIVE_CLASS},
.ad-ext-player.${BUST_ACTIVE_CLASS} {
  position: relative !important;
  border: var(--ad-ext-x01-bust-active-player-border, 0.8px solid rgb(207, 52, 52)) !important;
  box-shadow: var(--ad-ext-x01-bust-active-player-box-shadow, none) !important;
}

#ad-ext-player-display .ad-ext-player.${BUST_ACTIVE_CLASS}:not(:has(> .chakra-stack)),
.ad-ext-player.${BUST_ACTIVE_CLASS}:not(:has(> .chakra-stack)) {
  background: var(--ad-ext-x01-bust-active-player-background, rgba(255, 0, 0, 0.15)) !important;
  background-color: var(--ad-ext-x01-bust-active-player-background-color, rgba(255, 0, 0, 0.15)) !important;
}

#ad-ext-player-display .ad-ext-player.${BUST_ACTIVE_CLASS} > .chakra-stack,
.ad-ext-player.${BUST_ACTIVE_CLASS} > .chakra-stack {
  background: var(--ad-ext-x01-bust-active-player-background, rgba(255, 0, 0, 0.15)) !important;
  background-color: var(--ad-ext-x01-bust-active-player-background-color, rgba(255, 0, 0, 0.15)) !important;
}

.${BUST_ACTIVE_CLASS}.${BUST_SHAKE_CLASS} {
  animation: ad-ext-x01-bust-active-player-shake 150ms linear 20;
  transform-origin: center center;
  will-change: transform;
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
  stroke: rgba(255, 255, 255, 0.92);
  stroke-linecap: round;
  stroke-linejoin: round;
  animation: ad-ext-x01-bust-crack-appear 180ms ease-out both;
}

.${BUST_CRACK_CLASS} .ad-ext-x01-bust-crack-main {
  stroke: rgba(255, 255, 255, 0.78);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.${BUST_CRACK_CLASS} .ad-ext-x01-bust-crack-reflection {
  stroke: rgba(255, 255, 255, ${DEMO_CRACK_SETTINGS.reflectAlpha * 0.5});
  stroke-width: ${DEMO_CRACK_SETTINGS.refractWidth};
  vector-effect: non-scaling-stroke;
}

.${BUST_CRACK_CLASS} .ad-ext-x01-bust-crack-web {
  stroke: rgba(255, 255, 255, 0.58);
  stroke-width: 0.8;
  vector-effect: non-scaling-stroke;
}

.${BUST_CRACK_CLASS} .ad-ext-x01-bust-crack-splinters {
  stroke: rgba(255, 255, 255, 0.78);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.${BUST_CRACK_CLASS} .ad-ext-x01-bust-crack-noise {
  stroke: rgba(255, 255, 255, ${DEMO_CRACK_SETTINGS.noiseAlpha * 0.24});
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.${BUST_CRACK_CLASS} .ad-ext-x01-bust-crack-shards {
  fill: rgba(255, 255, 255, ${DEMO_CRACK_SETTINGS.fractureAlpha * 0.6});
  stroke: none;
  vector-effect: non-scaling-stroke;
}

@keyframes ad-ext-x01-bust-crack-appear {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes ad-ext-x01-bust-active-player-shake {
  0% { transform: translate(1px, 1px) rotate(0deg); }
  10% { transform: translate(-1px, -2px) rotate(-1deg); }
  20% { transform: translate(-3px, 0px) rotate(1deg); }
  30% { transform: translate(3px, 2px) rotate(0deg); }
  40% { transform: translate(1px, -1px) rotate(1deg); }
  50% { transform: translate(-1px, 2px) rotate(-1deg); }
  60% { transform: translate(-3px, 1px) rotate(0deg); }
  70% { transform: translate(3px, 1px) rotate(-1deg); }
  80% { transform: translate(-1px, -1px) rotate(1deg); }
  90% { transform: translate(1px, 2px) rotate(0deg); }
  100% { transform: translate(1px, -2px) rotate(-1deg); }
}
`;
}
