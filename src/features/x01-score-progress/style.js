export const STYLE_ID = "ad-ext-x01-score-progress-style";
export const HOST_ATTRIBUTE = "data-ad-ext-x01-score-progress";
export const HOST_SELECTOR = `[${HOST_ATTRIBUTE}='true']`;
export const TRACK_CLASS = "ad-ext-x01-score-progress__track";
export const FILL_CLASS = "ad-ext-x01-score-progress__fill";
export const ACTIVE_CLASS = "ad-ext-x01-score-progress--active";
export const INACTIVE_CLASS = "ad-ext-x01-score-progress--inactive";
export const PRESET_CLASS_PREFIX = "ad-ext-x01-score-progress--preset-";
export const SIZE_CLASS_PREFIX = "ad-ext-x01-score-progress--size-";
export const EFFECT_FILL_CLASS_PREFIX = "ad-ext-x01-score-progress__fill--effect-";

export const DESIGN_PRESETS = Object.freeze(["signal", "glass", "minimal"]);
export const COLOR_THEMES = Object.freeze([
  "checkout-focus",
  "traffic-light",
  "danger-endgame",
  "gradient-by-progress",
  "autodarts",
  "signal-lime",
  "glass-mint",
  "ember-rush",
  "ice-circuit",
  "neon-violet",
  "sunset-amber",
  "monochrome-steel",
]);
export const BAR_SIZES = Object.freeze(["schmal", "standard", "breit", "extrabreit"]);
export const EFFECTS = Object.freeze([
  "off",
  "pulse-on-change",
  "sheen-sweep",
  "charge-release",
  "burn-down",
  "spark-trail",
  "heat-edge",
  "segment-pop",
  "danger-flicker",
  "checkout-glow",
]);

const DESIGN_PRESET_SET = new Set(DESIGN_PRESETS);
const COLOR_THEME_SET = new Set(COLOR_THEMES);
const BAR_SIZE_SET = new Set(BAR_SIZES);
const EFFECT_SET = new Set(EFFECTS);

function normalizeChoice(value, fallbackValue, allowedSet) {
  const normalized = String(value || "").trim().toLowerCase();
  return allowedSet.has(normalized) ? normalized : fallbackValue;
}

export function normalizeDesignPreset(value) {
  return normalizeChoice(value, "signal", DESIGN_PRESET_SET);
}

export function getPresetClass(value) {
  return `${PRESET_CLASS_PREFIX}${normalizeDesignPreset(value)}`;
}

export function getPresetClassList() {
  return DESIGN_PRESETS.map((value) => getPresetClass(value));
}

export function normalizeColorTheme(value) {
  return normalizeChoice(value, "checkout-focus", COLOR_THEME_SET);
}

export function normalizeBarSize(value) {
  return normalizeChoice(value, "standard", BAR_SIZE_SET);
}

export function getSizeClass(value) {
  return `${SIZE_CLASS_PREFIX}${normalizeBarSize(value)}`;
}

export function getSizeClassList() {
  return BAR_SIZES.map((value) => getSizeClass(value));
}

export function normalizeEffect(value) {
  return normalizeChoice(value, "charge-release", EFFECT_SET);
}

export function getEffectFillClass(value) {
  return `${EFFECT_FILL_CLASS_PREFIX}${normalizeEffect(value)}`;
}

export function getEffectFillClassList() {
  return EFFECTS.map((value) => getEffectFillClass(value));
}

export function buildStyleText() {
  return `
${HOST_SELECTOR}{
  --ad-ext-x01-score-progress-width:0%;
  --ad-ext-x01-score-progress-height-active:clamp(.72rem,1.35vw,1.02rem);
  --ad-ext-x01-score-progress-height-inactive:clamp(.3rem,.72vw,.52rem);
  --ad-ext-x01-score-progress-margin-top:clamp(.3rem,.95vw,.6rem);
  --ad-ext-x01-score-progress-track-bg-active:linear-gradient(90deg,rgba(34,84,18,.42) 0%,rgba(56,94,22,.18) 100%);
  --ad-ext-x01-score-progress-fill-bg-active:linear-gradient(90deg,rgba(132,204,22,.98) 0%,rgba(163,230,53,.98) 42%,rgba(190,242,100,.98) 100%);
  --ad-ext-x01-score-progress-fill-shadow-active:0 0 18px rgba(132,204,22,.3);
  --ad-ext-x01-score-progress-sheen-active:rgba(255,255,255,.16);
  --ad-ext-x01-score-progress-track-bg:var(--ad-ext-x01-score-progress-track-bg-active);
  --ad-ext-x01-score-progress-fill-bg:var(--ad-ext-x01-score-progress-fill-bg-active);
  --ad-ext-x01-score-progress-fill-shadow:var(--ad-ext-x01-score-progress-fill-shadow-active);
  --ad-ext-x01-score-progress-sheen:var(--ad-ext-x01-score-progress-sheen-active);
  display:block;
  width:100%;
  min-width:0;
  margin-top:var(--ad-ext-x01-score-progress-margin-top);
  grid-column:1 / -1;
  grid-row:3;
  justify-self:stretch;
  align-self:end;
  order:99;
  flex:0 0 100%;
  opacity:1;
}

${HOST_SELECTOR}.${ACTIVE_CLASS}{
  --ad-ext-x01-score-progress-height:var(--ad-ext-x01-score-progress-height-active);
  --ad-ext-x01-score-progress-track-bg:var(--ad-ext-x01-score-progress-track-bg-active);
  --ad-ext-x01-score-progress-fill-bg:var(--ad-ext-x01-score-progress-fill-bg-active);
  --ad-ext-x01-score-progress-fill-shadow:var(--ad-ext-x01-score-progress-fill-shadow-active);
  --ad-ext-x01-score-progress-sheen:var(--ad-ext-x01-score-progress-sheen-active);
}

${HOST_SELECTOR}.${INACTIVE_CLASS}{
  --ad-ext-x01-score-progress-height:var(--ad-ext-x01-score-progress-height-inactive);
  --ad-ext-x01-score-progress-track-bg:rgba(148,163,184,.12);
  --ad-ext-x01-score-progress-fill-bg:linear-gradient(90deg,rgba(148,163,184,.72) 0%,rgba(203,213,225,.78) 100%);
  --ad-ext-x01-score-progress-fill-shadow:none;
  --ad-ext-x01-score-progress-sheen:rgba(255,255,255,.08);
  opacity:.88;
}

${HOST_SELECTOR} .${TRACK_CLASS}{
  position:relative;
  width:100%;
  height:var(--ad-ext-x01-score-progress-height,var(--ad-ext-x01-score-progress-height-active));
  min-height:2px;
  overflow:hidden;
  border-radius:999px;
  background:var(--ad-ext-x01-score-progress-track-bg);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);
  backdrop-filter:blur(8px);
}

${HOST_SELECTOR} .${TRACK_CLASS}::after{
  content:"";
  position:absolute;
  inset:0;
  background:linear-gradient(180deg,var(--ad-ext-x01-score-progress-sheen) 0%,rgba(255,255,255,0) 70%);
  pointer-events:none;
}

${HOST_SELECTOR} .${FILL_CLASS}{
  position:relative;
  height:100%;
  width:var(--ad-ext-x01-score-progress-width);
  max-width:100%;
  min-width:0;
  border-radius:inherit;
  background:var(--ad-ext-x01-score-progress-fill-bg);
  box-shadow:var(--ad-ext-x01-score-progress-fill-shadow);
  transition:width 180ms ease-out,opacity 180ms ease-out,filter 180ms ease-out;
  transform-origin:left center;
}

${HOST_SELECTOR}.${ACTIVE_CLASS}.ad-ext-x01-score-progress--preset-signal{
  --ad-ext-x01-score-progress-sheen-active:rgba(255,255,255,.16);
}

${HOST_SELECTOR}.ad-ext-x01-score-progress--preset-glass{
  --ad-ext-x01-score-progress-track-bg-active:linear-gradient(180deg,rgba(255,255,255,.2) 0%,rgba(148,163,184,.08) 100%);
  --ad-ext-x01-score-progress-fill-shadow-active:0 0 16px rgba(148,163,184,.22);
  --ad-ext-x01-score-progress-sheen-active:rgba(255,255,255,.26);
}

${HOST_SELECTOR}.${INACTIVE_CLASS}.ad-ext-x01-score-progress--preset-glass{
  --ad-ext-x01-score-progress-track-bg:linear-gradient(180deg,rgba(255,255,255,.12) 0%,rgba(100,116,139,.06) 100%);
  --ad-ext-x01-score-progress-fill-bg:linear-gradient(90deg,rgba(148,163,184,.46) 0%,rgba(203,213,225,.58) 100%);
}

${HOST_SELECTOR}.ad-ext-x01-score-progress--preset-minimal{
  --ad-ext-x01-score-progress-track-bg-active:rgba(148,163,184,.12);
  --ad-ext-x01-score-progress-fill-shadow-active:none;
  --ad-ext-x01-score-progress-sheen-active:rgba(255,255,255,.08);
}

${HOST_SELECTOR}.${INACTIVE_CLASS}.ad-ext-x01-score-progress--preset-minimal{
  --ad-ext-x01-score-progress-track-bg:rgba(148,163,184,.08);
  --ad-ext-x01-score-progress-fill-bg:linear-gradient(90deg,rgba(148,163,184,.62) 0%,rgba(203,213,225,.66) 100%);
}

${HOST_SELECTOR}.${ACTIVE_CLASS}.ad-ext-x01-score-progress--size-schmal{
  --ad-ext-x01-score-progress-height-active:clamp(.52rem,1.02vw,.78rem);
}

${HOST_SELECTOR}.${ACTIVE_CLASS}.ad-ext-x01-score-progress--size-standard{
  --ad-ext-x01-score-progress-height-active:clamp(.72rem,1.35vw,1.02rem);
}

${HOST_SELECTOR}.${ACTIVE_CLASS}.ad-ext-x01-score-progress--size-breit{
  --ad-ext-x01-score-progress-height-active:clamp(.92rem,1.68vw,1.24rem);
}

${HOST_SELECTOR}.${ACTIVE_CLASS}.ad-ext-x01-score-progress--size-extrabreit{
  --ad-ext-x01-score-progress-height-active:clamp(1.12rem,2.02vw,1.46rem);
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-score-progress__fill--effect-heat-edge{
  filter:saturate(1.08) contrast(1.04);
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-score-progress__fill--effect-segment-pop{
  transform-origin:left center;
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-score-progress__fill--effect-danger-flicker{
  animation:ad-ext-x01-score-progress-danger-flicker 1.05s steps(2,end) infinite;
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-score-progress__fill--effect-checkout-glow{
  animation:ad-ext-x01-score-progress-checkout-glow 1.6s ease-in-out infinite;
}

@keyframes ad-ext-x01-score-progress-danger-flicker{
  0%,23%,41%,100%{filter:brightness(1)}
  28%{filter:brightness(1.22)}
  35%{filter:brightness(.84)}
}

@keyframes ad-ext-x01-score-progress-checkout-glow{
  0%,100%{filter:brightness(1)}
  50%{filter:brightness(1.18)}
}
`;
}
