export const STYLE_ID = "ad-ext-x01-bust-active-player-highlight-style";
export const BUST_ACTIVE_CLASS = "ad-ext-x01-bust-active-player-highlight";
export const BUST_SHAKE_CLASS = "ad-ext-x01-bust-active-player-highlight--shake";

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
