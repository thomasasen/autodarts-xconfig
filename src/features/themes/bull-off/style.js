import { buildThemeCssBundle } from "../shared/theme-style-builder.js";
import { normalizeBoolean } from "../shared/theme-utils.js";

export const STYLE_ID = "ad-ext-theme-bull-off-style";

const PREVIEW_PLACEMENT = Object.freeze({
  mode: "standard",
  previewHeightPx: 128,
  previewGapPx: 8,
});

const ALLOWED_CONTRAST_PRESETS = new Set(["soft", "standard", "high"]);

function resolveThemeBullOffConfig(rawConfig = {}) {
  const rawPreset = String(rawConfig.contrastPreset || "").trim().toLowerCase();
  const contrastPreset = ALLOWED_CONTRAST_PRESETS.has(rawPreset) ? rawPreset : "standard";

  return {
    contrastPreset,
    debug: normalizeBoolean(rawConfig.debug, false),
  };
}

const KONTRAST_PRESET = Object.freeze({
  soft: {
    variantBorderAlpha: 0.12,
    turnBorderAlpha: 0.1,
    turnGradientAlpha: 0.1,
    activeBorderAlpha: 0.72,
    activeShadowAlpha: 0.24,
    activeInsetAlpha: 0.16,
    activeOverlayAlpha: 0.76,
    inactiveBorderAlpha: 0.26,
    scoreShadowAlpha: 0.42,
    panelBorderAlpha: 0.09,
    panelInsetAlpha: 0.03,
    buttonBorderAlpha: 0.11,
  },
  standard: {
    variantBorderAlpha: 0.18,
    turnBorderAlpha: 0.13,
    turnGradientAlpha: 0.14,
    activeBorderAlpha: 0.9,
    activeShadowAlpha: 0.36,
    activeInsetAlpha: 0.24,
    activeOverlayAlpha: 0.88,
    inactiveBorderAlpha: 0.36,
    scoreShadowAlpha: 0.55,
    panelBorderAlpha: 0.12,
    panelInsetAlpha: 0.04,
    buttonBorderAlpha: 0.15,
  },
  high: {
    variantBorderAlpha: 0.26,
    turnBorderAlpha: 0.22,
    turnGradientAlpha: 0.22,
    activeBorderAlpha: 1,
    activeShadowAlpha: 0.48,
    activeInsetAlpha: 0.34,
    activeOverlayAlpha: 0.94,
    inactiveBorderAlpha: 0.52,
    scoreShadowAlpha: 0.72,
    panelBorderAlpha: 0.22,
    panelInsetAlpha: 0.1,
    buttonBorderAlpha: 0.24,
  },
});

function buildBullOffCss(config = {}) {
  const contrast = KONTRAST_PRESET[config.contrastPreset] || KONTRAST_PRESET.standard;
  return `
:root{
  --theme-bg: #050607;
  --theme-background: #050607;
  --theme-text-highlight-color: #f2f5ff;
  --theme-navigation-bg: #272b32;
  --theme-navigation-item-color: #535c68;
  --theme-player-badge-bg: #66bb6a;
  --theme-player-name-bg: #66bb6a;
  --theme-current-bg: #4d2020;
  --theme-border-color: #3a4049;
  --theme-alt-bg: #1f2e25;
  --bull-green: #66bb6a;
  --bull-red: #ef5350;
  --bull-variant-border-alpha: ${contrast.variantBorderAlpha};
  --bull-turn-border-alpha: ${contrast.turnBorderAlpha};
  --bull-turn-gradient-alpha: ${contrast.turnGradientAlpha};
  --bull-active-border-alpha: ${contrast.activeBorderAlpha};
  --bull-active-shadow-alpha: ${contrast.activeShadowAlpha};
  --bull-active-inset-alpha: ${contrast.activeInsetAlpha};
  --bull-active-overlay-alpha: ${contrast.activeOverlayAlpha};
  --bull-inactive-border-alpha: ${contrast.inactiveBorderAlpha};
  --bull-score-shadow-alpha: ${contrast.scoreShadowAlpha};
  --bull-panel-border-alpha: ${contrast.panelBorderAlpha};
  --bull-panel-inset-alpha: ${contrast.panelInsetAlpha};
  --bull-button-border-alpha: ${contrast.buttonBorderAlpha};
}

div.css-gmuwbf,
div.css-tkevr6,
div.css-nfhdnc {
  background:
    radial-gradient(circle at 20% 15%, rgba(102, 187, 106, 0.12), transparent 38%),
    radial-gradient(circle at 82% 85%, rgba(239, 83, 80, 0.16), transparent 44%),
    #06080c;
}

#ad-ext-game-variant{
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid rgba(255, 255, 255, var(--bull-variant-border-alpha));
  border-radius: 999px;
  padding: 0.1rem 0.75rem;
  background: linear-gradient(90deg, rgba(102, 187, 106, 0.26), rgba(239, 83, 80, 0.24));
}

#ad-ext-turn > .score,
#ad-ext-turn > .ad-ext-turn-throw,
#ad-ext-turn > .suggestion{
  border: 1px solid rgba(255, 255, 255, var(--bull-turn-border-alpha));
  border-radius: 12px;
  background: linear-gradient(90deg, rgba(102, 187, 106, var(--bull-turn-gradient-alpha)), rgba(239, 83, 80, var(--bull-turn-gradient-alpha)));
}

#ad-ext-player-display .ad-ext-player{
  border-radius: 14px;
  overflow: hidden;
  backdrop-filter: blur(1px);
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active{
  border: 2px solid rgba(102, 187, 106, var(--bull-active-border-alpha)) !important;
  box-shadow:
    0 10px 26px rgba(0, 0, 0, var(--bull-active-shadow-alpha)),
    inset 0 0 0 1px rgba(102, 187, 106, var(--bull-active-inset-alpha));
  background:
    linear-gradient(135deg, rgba(102, 187, 106, 0.12), rgba(239, 83, 80, 0.16)),
    rgba(12, 16, 21, var(--bull-active-overlay-alpha));
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive{
  border-color: rgba(239, 83, 80, var(--bull-inactive-border-alpha)) !important;
}

#ad-ext-player-display .ad-ext-player .ad-ext-player-score{
  font-size: 7.2em !important;
  letter-spacing: 0.03em;
  text-shadow: 0 0 18px rgba(0, 0, 0, var(--bull-score-shadow-alpha));
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active .ad-ext-player-score{
  color: #ffffff !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive .ad-ext-player-score{
  color: #9ca8b9 !important;
}

span.css-3fr5p8{
  background: linear-gradient(90deg, var(--bull-green), var(--bull-red));
  color: #101215;
}

.css-1kejrvi .css-tqsk66,
.css-14xtjvc .css-tqsk66{
  border: 1px solid rgba(255, 255, 255, var(--bull-panel-border-alpha));
  border-radius: 16px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, var(--bull-panel-inset-alpha));
}

.css-7bjx6y .chakra-button{
  border: 1px solid rgba(255, 255, 255, var(--bull-button-border-alpha));
  background-color: rgba(23, 28, 35, 0.82);
}

.css-7bjx6y .chakra-button:hover{
  background-color: rgba(40, 48, 60, 0.92);
}

.css-tkevr6 > .chakra-stack{
  grid-template-areas:
    "header header"
    "footer board"
    "players board" !important;
  grid-template-columns: 0.94fr 1.06fr !important;
  grid-template-rows: max-content 96px 1fr !important;
}

#ad-ext-turn{
  grid-column-start: 1 !important;
  grid-column-end: 2 !important;
  grid-row-start: 2 !important;
  grid-row-end: 3 !important;
  grid-area: footer !important;
  width: 100% !important;
  padding-right: 0.5rem !important;
}

#ad-ext-turn > .score,
#ad-ext-turn > .ad-ext-turn-throw,
#ad-ext-turn > .suggestion{
  width: 100% !important;
  min-height: 84px;
}

#ad-ext-turn > .score > img{
  width: 100% !important;
  max-width: none !important;
  height: 68px;
  object-fit: contain;
}

.css-1kejrvi,
.css-14xtjvc{
  grid-column-start: 2 !important;
  grid-column-end: 3 !important;
  grid-row-start: 2 !important;
  grid-row-end: 4 !important;
  grid-area: board !important;
  height: 100% !important;
  align-self: stretch !important;
}

.css-14xtjvc .css-tqsk66,
.css-1kejrvi .css-tqsk66{
  padding-bottom: 0 !important;
  height: calc(100% - 52px) !important;
}

.css-14xtjvc svg[viewBox="0 0 1000 1000"],
.css-1kejrvi svg[viewBox="0 0 1000 1000"]{
  width: min(100%, 92vh) !important;
  height: min(100%, 92vh) !important;
}

@media (max-width: 1200px){
  #ad-ext-player-display .ad-ext-player .ad-ext-player-score{
    font-size: 6.2em !important;
  }
}

@media (max-width: 900px){
  #ad-ext-player-display .ad-ext-player .ad-ext-player-score{
    font-size: 5.2em !important;
  }
}
`;
}

export function buildBullOffThemeCss(featureConfig = {}) {
  const resolved = resolveThemeBullOffConfig(featureConfig);
  return buildThemeCssBundle(featureConfig, buildBullOffCss(resolved));
}

export { PREVIEW_PLACEMENT };

