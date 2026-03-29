export function buildCenteredPlayerCardLayoutCss() {
  return `
div.css-y3hfdd{
  grid-template-columns: minmax(0, 1fr) max-content !important;
  gap: 0px !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack.css-y3hfdd {
  min-width: 0 !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack.css-y3hfdd > .chakra-stack.css-37hv00 {
  min-width: 0 !important;
  max-width: 100% !important;
  overflow: hidden !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-player-name,
#ad-ext-player-display .ad-ext-player .ad-ext-player-name > p {
  min-width: 0 !important;
  max-width: 100% !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-player-score {
  justify-self: end !important;
  min-width: max-content !important;
  white-space: nowrap !important;
}

div.ad-ext-player.ad-ext-player-active div.css-y3hfdd {
  grid-template-rows: max-content max-content !important;
  align-content: center !important;
}
`;
}
