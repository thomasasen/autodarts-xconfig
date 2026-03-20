export const STYLE_ID = "ad-ext-x01-score-progress-style";
export const HOST_ATTRIBUTE = "data-ad-ext-x01-score-progress";
export const HOST_SELECTOR = `[${HOST_ATTRIBUTE}='true']`;
export const TRACK_CLASS = "ad-ext-x01-score-progress__track";
export const TRAIL_CLASS = "ad-ext-x01-score-progress__trail";
export const FILL_CLASS = "ad-ext-x01-score-progress__fill";
export const ACTIVE_CLASS = "ad-ext-x01-score-progress--active";
export const INACTIVE_CLASS = "ad-ext-x01-score-progress--inactive";
export const SIZE_CLASS_PREFIX = "ad-ext-x01-score-progress--size-";
export const EFFECT_FILL_CLASS_PREFIX = "ad-ext-x01-score-progress__fill--effect-";

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
  "pulse-core",
  "glass-charge",
  "segment-drain",
  "ghost-trail",
  "signal-sweep",
  "electric-surge",
  "off",
]);

const COLOR_THEME_SET = new Set(COLOR_THEMES);
const BAR_SIZE_SET = new Set(BAR_SIZES);
const EFFECT_SET = new Set(EFFECTS);

function normalizeChoice(value, fallbackValue, allowedSet) {
  const normalized = String(value || "").trim().toLowerCase();
  return allowedSet.has(normalized) ? normalized : fallbackValue;
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
  return normalizeChoice(value, "pulse-core", EFFECT_SET);
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
  --ad-ext-x01-score-progress-trail-width:0%;
  --ad-ext-x01-score-progress-height-active:clamp(.72rem,1.35vw,1.02rem);
  --ad-ext-x01-score-progress-height-inactive:clamp(.3rem,.72vw,.52rem);
  --ad-ext-x01-score-progress-margin-top:clamp(.3rem,.95vw,.6rem);
  --ad-ext-x01-score-progress-track-base-active:linear-gradient(90deg,rgba(34,84,18,.42) 0%,rgba(56,94,22,.18) 100%);
  --ad-ext-x01-score-progress-fill-base-active:linear-gradient(90deg,rgba(132,204,22,.98) 0%,rgba(163,230,53,.98) 42%,rgba(190,242,100,.98) 100%);
  --ad-ext-x01-score-progress-track-solid-active:rgba(56,94,22,.28);
  --ad-ext-x01-score-progress-fill-solid-active:rgba(163,230,53,.96);
  --ad-ext-x01-score-progress-fill-outline-active:rgba(190,242,100,.32);
  --ad-ext-x01-score-progress-fill-ambient-active:rgba(163,230,53,.24);
  --ad-ext-x01-score-progress-track-border-active:rgba(255,255,255,.08);
  --ad-ext-x01-score-progress-track-bg-active:var(--ad-ext-x01-score-progress-track-base-active);
  --ad-ext-x01-score-progress-fill-bg-active:var(--ad-ext-x01-score-progress-fill-base-active);
  --ad-ext-x01-score-progress-fill-shadow-active:0 0 18px rgba(132,204,22,.3);
  --ad-ext-x01-score-progress-track-overlay-active:linear-gradient(180deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,0) 70%);
  --ad-ext-x01-score-progress-track-overlay-opacity-active:1;
  --ad-ext-x01-score-progress-track-inner-shadow-active:inset 0 0 0 1px rgba(255,255,255,.06);
  --ad-ext-x01-score-progress-track-backdrop-filter-active:blur(8px) saturate(115%);
  --ad-ext-x01-score-progress-fill-overlay-image-active:none;
  --ad-ext-x01-score-progress-fill-overlay-size-active:auto;
  --ad-ext-x01-score-progress-fill-overlay-position-active:0 0;
  --ad-ext-x01-score-progress-fill-overlay-repeat-active:repeat;
  --ad-ext-x01-score-progress-fill-overlay-blend-active:screen;
  --ad-ext-x01-score-progress-fill-overlay-opacity-active:0;
  --ad-ext-x01-score-progress-track-bg:var(--ad-ext-x01-score-progress-track-bg-active);
  --ad-ext-x01-score-progress-fill-bg:var(--ad-ext-x01-score-progress-fill-bg-active);
  --ad-ext-x01-score-progress-fill-shadow:var(--ad-ext-x01-score-progress-fill-shadow-active);
  --ad-ext-x01-score-progress-track-overlay:var(--ad-ext-x01-score-progress-track-overlay-active);
  --ad-ext-x01-score-progress-track-overlay-opacity:var(--ad-ext-x01-score-progress-track-overlay-opacity-active);
  --ad-ext-x01-score-progress-track-inner-shadow:var(--ad-ext-x01-score-progress-track-inner-shadow-active);
  --ad-ext-x01-score-progress-track-border-color:var(--ad-ext-x01-score-progress-track-border-active);
  --ad-ext-x01-score-progress-track-backdrop-filter:var(--ad-ext-x01-score-progress-track-backdrop-filter-active);
  --ad-ext-x01-score-progress-fill-overlay-image:var(--ad-ext-x01-score-progress-fill-overlay-image-active);
  --ad-ext-x01-score-progress-fill-overlay-size:var(--ad-ext-x01-score-progress-fill-overlay-size-active);
  --ad-ext-x01-score-progress-fill-overlay-position:var(--ad-ext-x01-score-progress-fill-overlay-position-active);
  --ad-ext-x01-score-progress-fill-overlay-repeat:var(--ad-ext-x01-score-progress-fill-overlay-repeat-active);
  --ad-ext-x01-score-progress-fill-overlay-blend:var(--ad-ext-x01-score-progress-fill-overlay-blend-active);
  --ad-ext-x01-score-progress-fill-overlay-opacity:var(--ad-ext-x01-score-progress-fill-overlay-opacity-active);
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
  --ad-ext-x01-score-progress-track-overlay:var(--ad-ext-x01-score-progress-track-overlay-active);
  --ad-ext-x01-score-progress-track-overlay-opacity:var(--ad-ext-x01-score-progress-track-overlay-opacity-active);
  --ad-ext-x01-score-progress-track-inner-shadow:var(--ad-ext-x01-score-progress-track-inner-shadow-active);
  --ad-ext-x01-score-progress-track-border-color:var(--ad-ext-x01-score-progress-track-border-active);
  --ad-ext-x01-score-progress-track-backdrop-filter:var(--ad-ext-x01-score-progress-track-backdrop-filter-active);
  --ad-ext-x01-score-progress-fill-overlay-image:var(--ad-ext-x01-score-progress-fill-overlay-image-active);
  --ad-ext-x01-score-progress-fill-overlay-size:var(--ad-ext-x01-score-progress-fill-overlay-size-active);
  --ad-ext-x01-score-progress-fill-overlay-position:var(--ad-ext-x01-score-progress-fill-overlay-position-active);
  --ad-ext-x01-score-progress-fill-overlay-repeat:var(--ad-ext-x01-score-progress-fill-overlay-repeat-active);
  --ad-ext-x01-score-progress-fill-overlay-blend:var(--ad-ext-x01-score-progress-fill-overlay-blend-active);
  --ad-ext-x01-score-progress-fill-overlay-opacity:var(--ad-ext-x01-score-progress-fill-overlay-opacity-active);
}

${HOST_SELECTOR}.${INACTIVE_CLASS}{
  --ad-ext-x01-score-progress-height:var(--ad-ext-x01-score-progress-height-inactive);
  --ad-ext-x01-score-progress-track-bg:rgba(148,163,184,.12);
  --ad-ext-x01-score-progress-fill-bg:linear-gradient(90deg,rgba(148,163,184,.72) 0%,rgba(203,213,225,.78) 100%);
  --ad-ext-x01-score-progress-fill-shadow:none;
  --ad-ext-x01-score-progress-track-overlay:linear-gradient(180deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,0) 70%);
  --ad-ext-x01-score-progress-track-overlay-opacity:1;
  --ad-ext-x01-score-progress-track-inner-shadow:inset 0 0 0 1px rgba(255,255,255,.06);
  --ad-ext-x01-score-progress-track-border-color:rgba(255,255,255,.06);
  --ad-ext-x01-score-progress-track-backdrop-filter:blur(8px) saturate(105%);
  --ad-ext-x01-score-progress-fill-overlay-image:none;
  --ad-ext-x01-score-progress-fill-overlay-size:auto;
  --ad-ext-x01-score-progress-fill-overlay-position:0 0;
  --ad-ext-x01-score-progress-fill-overlay-repeat:repeat;
  --ad-ext-x01-score-progress-fill-overlay-blend:screen;
  --ad-ext-x01-score-progress-fill-overlay-opacity:0;
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
  border:1px solid var(--ad-ext-x01-score-progress-track-border-color);
  box-shadow:var(--ad-ext-x01-score-progress-track-inner-shadow);
  backdrop-filter:var(--ad-ext-x01-score-progress-track-backdrop-filter);
}

${HOST_SELECTOR} .${TRACK_CLASS}::after{
  content:"";
  position:absolute;
  inset:0;
  background:var(--ad-ext-x01-score-progress-track-overlay);
  opacity:var(--ad-ext-x01-score-progress-track-overlay-opacity);
  pointer-events:none;
}

${HOST_SELECTOR} .${TRAIL_CLASS}{
  position:absolute;
  left:0;
  top:0;
  bottom:0;
  width:var(--ad-ext-x01-score-progress-trail-width);
  opacity:0;
  border-radius:inherit;
  background:var(--ad-ext-x01-score-progress-fill-bg);
  filter:blur(7px) brightness(1.18);
  box-shadow:var(--ad-ext-x01-score-progress-fill-shadow);
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
  overflow:hidden;
}

${HOST_SELECTOR} .${FILL_CLASS}::before,
${HOST_SELECTOR} .${FILL_CLASS}::after{
  content:"";
  position:absolute;
  inset:0;
  border-radius:inherit;
  pointer-events:none;
}

${HOST_SELECTOR} .${FILL_CLASS}::before{
  background-image:var(--ad-ext-x01-score-progress-fill-overlay-image);
  background-size:var(--ad-ext-x01-score-progress-fill-overlay-size);
  background-position:var(--ad-ext-x01-score-progress-fill-overlay-position);
  background-repeat:var(--ad-ext-x01-score-progress-fill-overlay-repeat);
  mix-blend-mode:var(--ad-ext-x01-score-progress-fill-overlay-blend);
  opacity:var(--ad-ext-x01-score-progress-fill-overlay-opacity);
}

${HOST_SELECTOR} .${FILL_CLASS}::after{
  opacity:0;
}

${HOST_SELECTOR}.${ACTIVE_CLASS}.ad-ext-x01-score-progress--size-schmal{
  --ad-ext-x01-score-progress-height-active:clamp(.3rem,.62vw,.46rem);
}

${HOST_SELECTOR}.${ACTIVE_CLASS}.ad-ext-x01-score-progress--size-standard{
  --ad-ext-x01-score-progress-height-active:clamp(.72rem,1.35vw,1.02rem);
}

${HOST_SELECTOR}.${ACTIVE_CLASS}.ad-ext-x01-score-progress--size-breit{
  --ad-ext-x01-score-progress-height-active:clamp(1.08rem,1.9vw,1.4rem);
}

${HOST_SELECTOR}.${ACTIVE_CLASS}.ad-ext-x01-score-progress--size-extrabreit{
  --ad-ext-x01-score-progress-height-active:clamp(1.48rem,2.52vw,1.92rem);
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-score-progress__fill--effect-pulse-core{
  animation:ad-ext-x01-score-progress-pulse-core 1.32s ease-in-out infinite;
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-score-progress__fill--effect-glass-charge{
  animation:ad-ext-x01-score-progress-glass-charge-core 1.74s ease-in-out infinite;
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-score-progress__fill--effect-glass-charge::after{
  opacity:1;
  background:linear-gradient(115deg,rgba(255,255,255,0) 18%,rgba(255,255,255,.12) 36%,rgba(255,255,255,.66) 50%,rgba(255,255,255,.12) 64%,rgba(255,255,255,0) 82%);
  transform:translateX(-150%);
  animation:ad-ext-x01-score-progress-glass-charge-sweep 1.74s cubic-bezier(.22,.9,.18,1) infinite;
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-score-progress__fill--effect-segment-drain{
  background-image:
    repeating-linear-gradient(90deg,rgba(255,255,255,.04) 0 14px,rgba(255,255,255,.32) 14px 16px),
    var(--ad-ext-x01-score-progress-fill-bg);
  background-size:16px 100%,100% 100%;
  animation:ad-ext-x01-score-progress-segment-drain 1.08s steps(4,end) infinite;
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-score-progress__fill--effect-ghost-trail{
  filter:brightness(1.08) saturate(1.08);
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-score-progress__fill--effect-ghost-trail::after{
  opacity:.55;
  background:linear-gradient(90deg,rgba(255,255,255,.24) 0%,rgba(255,255,255,0) 22%,rgba(255,255,255,0) 100%);
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-score-progress__fill--effect-signal-sweep{
  animation:ad-ext-x01-score-progress-signal-sweep-core 1.04s ease-in-out infinite;
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-score-progress__fill--effect-signal-sweep::after{
  opacity:1;
  background:linear-gradient(112deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.08) 34%,rgba(255,255,255,.72) 50%,rgba(255,255,255,.08) 66%,rgba(255,255,255,0) 100%);
  transform:translateX(-155%);
  animation:ad-ext-x01-score-progress-signal-sweep 1.04s linear infinite;
}

${HOST_SELECTOR}.${ACTIVE_CLASS}[data-ad-ext-x01-score-progress-effect='electric-surge'] .${TRACK_CLASS}{
  border-color:color-mix(in srgb,var(--ad-ext-x01-score-progress-track-border-color) 40%,rgba(138,231,255,.92) 60%);
  box-shadow:
    var(--ad-ext-x01-score-progress-track-inner-shadow),
    0 0 16px rgba(77,217,255,.24),
    inset 0 0 0 1px rgba(153,239,255,.2);
  animation:ad-ext-x01-score-progress-electric-track 1.32s ease-in-out infinite;
}

${HOST_SELECTOR}.${ACTIVE_CLASS}[data-ad-ext-x01-score-progress-effect='electric-surge'] .${TRACK_CLASS}::before{
  content:"";
  position:absolute;
  inset:0;
  border-radius:inherit;
  pointer-events:none;
  opacity:.66;
  background:
    linear-gradient(110deg,rgba(255,255,255,0) 0%,rgba(208,248,255,.66) 48%,rgba(255,255,255,0) 100%);
  transform:translateX(-140%);
  animation:ad-ext-x01-score-progress-electric-track-scan 1.32s linear infinite;
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-score-progress__fill--effect-electric-surge{
  animation:ad-ext-x01-score-progress-electric-surge-core 1.08s ease-in-out infinite;
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-score-progress__fill--effect-electric-surge::after{
  opacity:.82;
  background:
    linear-gradient(112deg,rgba(255,255,255,0) 0%,rgba(204,244,255,.14) 34%,rgba(210,249,255,.86) 50%,rgba(204,244,255,.14) 66%,rgba(255,255,255,0) 100%);
  transform:translateX(-160%);
  animation:ad-ext-x01-score-progress-electric-surge-scan 1.08s linear infinite;
}

@keyframes ad-ext-x01-score-progress-pulse-core{
  0%,100%{transform:scaleY(1);filter:brightness(1) saturate(1.02)}
  50%{transform:scaleY(1.18);filter:brightness(1.2) saturate(1.18)}
}

@keyframes ad-ext-x01-score-progress-glass-charge-core{
  0%,100%{filter:brightness(1.02) saturate(1.03)}
  45%{filter:brightness(1.18) saturate(1.12)}
}

@keyframes ad-ext-x01-score-progress-glass-charge-sweep{
  0%{transform:translateX(-150%)}
  68%,100%{transform:translateX(155%)}
}

@keyframes ad-ext-x01-score-progress-segment-drain{
  0%{background-position:0 0,0 0;filter:brightness(1.02)}
  100%{background-position:16px 0,0 0;filter:brightness(1.18)}
}

@keyframes ad-ext-x01-score-progress-signal-sweep-core{
  0%,100%{filter:brightness(1.02) saturate(1.06)}
  42%{filter:brightness(1.24) saturate(1.18)}
}

@keyframes ad-ext-x01-score-progress-signal-sweep{
  0%{transform:translateX(-155%)}
  100%{transform:translateX(155%)}
}

@keyframes ad-ext-x01-score-progress-electric-track{
  0%,100%{filter:brightness(1.02) saturate(1.04)}
  46%{filter:brightness(1.2) saturate(1.2)}
}

@keyframes ad-ext-x01-score-progress-electric-track-scan{
  0%{transform:translateX(-140%);opacity:.42}
  62%{transform:translateX(146%);opacity:.9}
  100%{transform:translateX(146%);opacity:.42}
}

@keyframes ad-ext-x01-score-progress-electric-surge-core{
  0%,100%{filter:brightness(1.04) saturate(1.06)}
  38%{filter:brightness(1.28) saturate(1.24)}
}

@keyframes ad-ext-x01-score-progress-electric-surge-scan{
  0%{transform:translateX(-160%);opacity:.5}
  100%{transform:translateX(162%);opacity:.9}
}
`;
}
