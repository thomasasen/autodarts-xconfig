import { buildX01ThemeCss } from "../x01/style.js";
import { normalizeBoolean } from "../shared/theme-utils.js";

export const STYLE_ID = "ad-ext-theme-gotcha-style";
const STACK_SELECTOR = "#ad-ext-player-display .ad-ext-player > .chakra-stack";
const IDENTITY_SELECTOR = `${STACK_SELECTOR} > .css-37hv00`;
const META_SELECTOR = `${STACK_SELECTOR} > .css-1igwmid`;
const SCORE_PROGRESS_SELECTOR = [
  `${STACK_SELECTOR} > [data-ad-ext-x01-remaining-score-bar='true']`,
  `${STACK_SELECTOR} > .ad-ext-x01-remaining-score-bar--active`,
  `${STACK_SELECTOR} > .ad-ext-x01-remaining-score-bar--inactive`,
].join(",\n");
const INLINE_FLEX_CSS = `
  align-items:center !important;
  gap:0 !important;
`;
const INLINE_STACK_CSS = `
  align-items:start !important;
  align-content:center !important;
  column-gap:clamp(0.36rem,0.8vw,0.6rem) !important;
  row-gap:clamp(0.08rem,0.18vh,0.16rem) !important;
`;
const INLINE_LAYOUT_CSS = `

${IDENTITY_SELECTOR}{
  grid-column:1 / 2 !important;
  grid-row:1 / 2 !important;
  align-self:end !important;
  min-width:0 !important;
}

${META_SELECTOR}{
  grid-column:1 / 2 !important;
  grid-row:2 / 3 !important;
  align-self:start !important;
  min-width:0 !important;
  padding-left:0 !important;
  margin-top:0 !important;
}

${SCORE_PROGRESS_SELECTOR}{
  grid-column:1 / -1 !important;
  grid-row:3 / 4 !important;
  align-self:start !important;
}
`;

function resolveGotchaThemeStyleConfig(rawConfig = {}) {
  const normalizedPlacement = String(rawConfig.deltaPlacement || "")
    .trim()
    .toLowerCase();
  const normalizedAlignment = String(rawConfig.deltaAlignment || "")
    .trim()
    .toLowerCase();
  const deltaPlacement = normalizedPlacement === "inline-divider" ? "inline-divider" : "below";
  const deltaAlignment = normalizedAlignment === "left" ? "left" : "right";
  return {
    deltaPlacement,
    deltaAlignment,
    deltaItalic: normalizeBoolean(rawConfig.deltaItalic, true),
  };
}

function resolveBelowDeltaLayout(deltaAlignment) {
  const isLeftAligned = deltaAlignment === "left";
  return {
    justifySelf: isLeftAligned ? "start" : "end",
    textAlign: isLeftAligned ? "left" : "right",
    displayMode: "block",
    gridColumn: "2",
    scoreGridColumn: "2",
    gridRow: "2",
    alignSelf: "start",
    scoreAlignSelf: "auto",
    minInlineSize: "max-content",
    marginBlockStart: "clamp(0.12rem,0.28vh,0.22rem) !important",
    fontSize: "clamp(0.9rem,min(2.1vw,4.2cqi,4.8cqb),1.3rem)",
    lineHeight: "1",
    opacity: "0.65",
    inlineFlexCss: "",
    stackGridColumns: "minmax(0, 1fr) max-content",
    stackGridRows: "grid-template-rows:max-content max-content !important;",
    stackInlineCss: "",
    inlineLayoutCss: "",
    separatorCss: "",
  };
}

function buildSeparatorCss(pseudoElement) {
  return `

#ad-ext-player-display .ad-ext-player autodarts-tools-gotcha::${pseudoElement}{
  content:"|" !important;
  display:inline-block !important;
  margin-inline:clamp(0.24rem,0.56vw,0.4rem) !important;
  opacity:0.56 !important;
  font-style:normal !important;
}
`;
}

function resolveInlineDeltaLayout(deltaAlignment) {
  const isLeftAligned = deltaAlignment === "left";
  return {
    justifySelf: "start",
    textAlign: isLeftAligned ? "right" : "left",
    displayMode: "inline-flex",
    gridColumn: isLeftAligned ? "2" : "3",
    scoreGridColumn: isLeftAligned ? "3" : "2",
    gridRow: "1",
    alignSelf: "center",
    scoreAlignSelf: "end",
    minInlineSize: "auto",
    marginBlockStart: "0 !important",
    fontSize: "clamp(1rem,min(2.25vw,4.8cqi,5.4cqb),1.42rem)",
    lineHeight: "0.94",
    opacity: "0.70",
    inlineFlexCss: INLINE_FLEX_CSS,
    stackGridColumns: "minmax(0, 1fr) max-content max-content",
    stackGridRows: "grid-template-rows:max-content max-content max-content !important;",
    stackInlineCss: INLINE_STACK_CSS,
    inlineLayoutCss: INLINE_LAYOUT_CSS,
    separatorCss: buildSeparatorCss(isLeftAligned ? "after" : "before"),
  };
}

function buildGotchaDeltaCss(featureConfig = {}) {
  const resolved = resolveGotchaThemeStyleConfig(featureConfig);
  const fontStyle = resolved.deltaItalic ? "italic" : "normal";
  const layout =
    resolved.deltaPlacement === "inline-divider"
      ? resolveInlineDeltaLayout(resolved.deltaAlignment)
      : resolveBelowDeltaLayout(resolved.deltaAlignment);
  const whiteSpace = "nowrap";

  return `
#ad-ext-player-display .ad-ext-player autodarts-tools-gotcha{
  --chakra-colors-chakra-body-text:var(--ad-ext-theme-text-secondary-color);
  display:${layout.displayMode} !important;
  grid-column:${layout.gridColumn} !important;
  grid-row:${layout.gridRow} !important;
  justify-self:${layout.justifySelf} !important;
  align-self:${layout.alignSelf} !important;
  min-inline-size:${layout.minInlineSize} !important;
  margin-block-start:${layout.marginBlockStart};
  font-size:${layout.fontSize} !important;
  font-style:${fontStyle} !important;
  font-weight:600 !important;
  letter-spacing:0.01em !important;
  line-height:${layout.lineHeight} !important;
  text-align:${layout.textAlign} !important;
  opacity:${layout.opacity} !important;
  font-family:inherit !important;
  font-variant-numeric:tabular-nums !important;
  text-shadow:0 0 12px rgba(0,0,0,0.32) !important;
  white-space:${whiteSpace} !important;
  ${layout.inlineFlexCss}
}

#ad-ext-player-display .ad-ext-player .ad-ext-player-score{
  grid-column:${layout.scoreGridColumn} !important;
  grid-row:1 / 2 !important;
  align-self:${layout.scoreAlignSelf} !important;
  white-space:nowrap !important;
}

#ad-ext-player-display .ad-ext-player > .chakra-stack{
  grid-template-columns:${layout.stackGridColumns} !important;
  ${layout.stackGridRows}
  ${layout.stackInlineCss}
}

${layout.inlineLayoutCss}

${layout.separatorCss}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active autodarts-tools-gotcha,
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner autodarts-tools-gotcha{
  --chakra-colors-chakra-body-text:var(--ad-ext-theme-score-active-color);
}
`;
}

export function buildGotchaThemeCss(featureConfig = {}, options = {}) {
  return `${buildX01ThemeCss(featureConfig, options)}${buildGotchaDeltaCss(featureConfig)}`;
}

export { PREVIEW_PLACEMENT } from "../x01/style.js";
