export const STYLE_ID = "ad-ext-bot-board-style-style";
export const BOARD_STYLE_IMAGE_ID = "ad-ext-bot-board-style-image";
export const BOARD_STYLE_IMAGE_CLASS = "ad-ext-bot-board-style-image";
export const BOARD_STYLE_HIDDEN_NATIVE_LAYER_CLASS =
  "ad-ext-bot-board-style-hidden-native-layer";

export function buildStyleText() {
  return `
#${BOARD_STYLE_IMAGE_ID} {
  pointer-events: none;
  filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.6));
}

.${BOARD_STYLE_HIDDEN_NATIVE_LAYER_CLASS} {
  visibility: hidden !important;
}
`;
}
