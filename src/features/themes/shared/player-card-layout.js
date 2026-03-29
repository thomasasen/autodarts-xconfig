export function buildCenteredPlayerCardLayoutCss() {
  const stackSelector = "#ad-ext-player-display .ad-ext-player > .chakra-stack";
  return `
${stackSelector}{
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) max-content !important;
  gap: 0px !important;
  min-width: 0 !important;
}

${stackSelector} > .chakra-stack {
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

#ad-ext-player-display .ad-ext-player.ad-ext-player-active > .chakra-stack,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner > .chakra-stack {
  grid-template-rows: max-content max-content !important;
  align-content: center !important;
}
`;
}
