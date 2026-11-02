import { findModernTurnSurface } from "./x01-match-surface.js";
import { readSharedFeatureSurface } from "./feature-surface-group.js";

// Retain the established class and sizing while giving turn geometry one owner.
export const TURN_DISPLAY_LAYOUT_CLASS = "ad-ext-checkout-suggestion-layout";

export function findTurnDisplayLayoutNode(documentRef, windowRef, context = {}) {
  return readSharedFeatureSurface(context, "turn:surface", () => findModernTurnSurface(documentRef, windowRef))?.turnContainer || null;
}

export function applyTurnDisplayLayout(node) { node?.classList?.add(TURN_DISPLAY_LAYOUT_CLASS); }
export function resetTurnDisplayLayout(node) { node?.classList?.remove(TURN_DISPLAY_LAYOUT_CLASS); }

export function buildTurnDisplayLayoutStyleText() {
  return `
.${TURN_DISPLAY_LAYOUT_CLASS} {
  --ad-ext-checkout-turn-value-font-size: var(--ad-game-layout-turn-value-font-size, clamp(2.625rem, 3.35vw, 3rem));
  position: relative;
  left: 50%;
  flex: 0 0 444px;
  width: 444px;
  max-width: calc(100vw - 24px);
  min-height: 80px;
  transform: translateX(-50%);
}

.${TURN_DISPLAY_LAYOUT_CLASS} > :first-child {
  gap: 8px;
  padding-left: 8px;
}

.${TURN_DISPLAY_LAYOUT_CLASS} > :first-child > .font-number {
  flex: 1 1 0;
  max-width: none;
  height: 80px;
  padding-top: 10px;
}

.${TURN_DISPLAY_LAYOUT_CLASS} > :first-child > .font-number > span:not([aria-hidden="true"]),
.${TURN_DISPLAY_LAYOUT_CLASS} > .font-number,
.${TURN_DISPLAY_LAYOUT_CLASS} > .font-number > span {
  font-size: var(--ad-ext-checkout-turn-value-font-size);
}

.${TURN_DISPLAY_LAYOUT_CLASS} > .font-number {
  height: 80px;
}

@media (max-width: 900px) {
  .${TURN_DISPLAY_LAYOUT_CLASS} {
    --ad-ext-checkout-turn-value-font-size: var(--ad-game-layout-turn-value-font-size, min(2.5rem, 6vw));
    left: auto;
    flex: 1 1 0;
    width: 100%;
    max-width: 100%;
    transform: none;
  }

  .${TURN_DISPLAY_LAYOUT_CLASS},
  .${TURN_DISPLAY_LAYOUT_CLASS} > :first-child > .font-number,
  .${TURN_DISPLAY_LAYOUT_CLASS} > .font-number {
    height: 72px;
    min-height: 72px;
  }

  .${TURN_DISPLAY_LAYOUT_CLASS} > :first-child > .font-number {
    padding-top: 6px;
  }

  .${TURN_DISPLAY_LAYOUT_CLASS} > :first-child > .font-number > span:not([aria-hidden="true"]),
  .${TURN_DISPLAY_LAYOUT_CLASS} > .font-number,
  .${TURN_DISPLAY_LAYOUT_CLASS} > .font-number > span {
    font-size: var(--ad-ext-checkout-turn-value-font-size);
  }
}

`;
}
