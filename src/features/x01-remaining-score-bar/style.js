export const STYLE_ID = "ad-ext-x01-remaining-score-bar-style";
export const HOST_ATTRIBUTE = "data-ad-ext-x01-remaining-score-bar";
export const HOST_SELECTOR = `[${HOST_ATTRIBUTE}='true']`;
export const STACK_ATTRIBUTE = "data-ad-ext-x01-remaining-score-bar-stack";
export const STACK_SELECTOR = `.chakra-stack[${STACK_ATTRIBUTE}='true']`;
export const TRACK_CLASS = "ad-ext-x01-remaining-score-bar__track";
export const TRAIL_CLASS = "ad-ext-x01-remaining-score-bar__trail";
export const FILL_CLASS = "ad-ext-x01-remaining-score-bar__fill";
export const ACTIVE_CLASS = "ad-ext-x01-remaining-score-bar--active";
export const INACTIVE_CLASS = "ad-ext-x01-remaining-score-bar--inactive";
export const SIZE_CLASS_PREFIX = "ad-ext-x01-remaining-score-bar--size-";
export const EFFECT_FILL_CLASS_PREFIX = "ad-ext-x01-remaining-score-bar__fill--effect-";

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
  "bar-pulse",
  "glass-light-sweep",
  "moving-segments",
  "previous-score-trail",
  "fast-signal-sweep",
  "off",
]);

const COLOR_THEME_SET = new Set(COLOR_THEMES);
const BAR_SIZE_SET = new Set(BAR_SIZES);
const EFFECT_SET = new Set(EFFECTS);
const EFFECT_ALIASES = Object.freeze({
  "electric-surge": "fast-signal-sweep",
  "electric-border": "fast-signal-sweep",
  "arc-burst": "fast-signal-sweep",
});

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
  const normalized = String(value || "").trim().toLowerCase();
  if (EFFECT_SET.has(normalized)) {
    return normalized;
  }
  if (Object.hasOwn(EFFECT_ALIASES, normalized)) {
    return EFFECT_ALIASES[normalized];
  }
  return "bar-pulse";
}

export function getEffectFillClass(value) {
  return `${EFFECT_FILL_CLASS_PREFIX}${normalizeEffect(value)}`;
}

export function getEffectFillClassList() {
  return EFFECTS.map((value) => getEffectFillClass(value));
}

export function buildStyleText() {
  return `
${STACK_SELECTOR}{
  display:grid !important;
  grid-template-columns:1fr auto !important;
  grid-template-rows:max-content max-content auto !important;
  align-content:start !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-active > ${STACK_SELECTOR},
#ad-ext-player-display .ad-ext-player.ad-ext-player-winner > ${STACK_SELECTOR}{
  grid-template-rows:max-content max-content auto !important;
  align-content:center !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive > ${STACK_SELECTOR}{
  grid-template-rows:max-content max-content max-content !important;
  min-height:79px !important;
  height:auto !important;
  padding-top:6px !important;
  padding-bottom:4px !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive > ${STACK_SELECTOR} > .ad-ext-player-score{
  line-height:1 !important;
  align-self:center !important;
}

#ad-ext-player-display .ad-ext-player.ad-ext-player-inactive > ${STACK_SELECTOR} > ${HOST_SELECTOR}{
  margin-top:1px !important;
}

${HOST_SELECTOR}{
  --ad-ext-x01-remaining-score-bar-width:0%;
  --ad-ext-x01-remaining-score-bar-trail-width:0%;
  --ad-ext-x01-remaining-score-bar-height-active:clamp(.72rem,1.35vw,1.02rem);
  --ad-ext-x01-remaining-score-bar-height-inactive:clamp(.3rem,.72vw,.52rem);
  --ad-ext-x01-remaining-score-bar-margin-top-active:2em;
  --ad-ext-x01-remaining-score-bar-margin-top-inactive:clamp(.16rem,.45vw,.32rem);
  --ad-ext-x01-remaining-score-bar-margin-top:var(--ad-ext-x01-remaining-score-bar-margin-top-inactive);
  --ad-ext-x01-remaining-score-bar-track-base-active:linear-gradient(90deg,rgba(34,84,18,.42) 0%,rgba(56,94,22,.18) 100%);
  --ad-ext-x01-remaining-score-bar-fill-base-active:linear-gradient(90deg,rgba(132,204,22,.98) 0%,rgba(163,230,53,.98) 42%,rgba(190,242,100,.98) 100%);
  --ad-ext-x01-remaining-score-bar-track-solid-active:rgba(56,94,22,.28);
  --ad-ext-x01-remaining-score-bar-fill-solid-active:rgba(163,230,53,.96);
  --ad-ext-x01-remaining-score-bar-fill-outline-active:rgba(190,242,100,.32);
  --ad-ext-x01-remaining-score-bar-fill-ambient-active:rgba(163,230,53,.24);
  --ad-ext-x01-remaining-score-bar-track-border-active:rgba(255,255,255,.08);
  --ad-ext-x01-remaining-score-bar-track-bg-active:var(--ad-ext-x01-remaining-score-bar-track-base-active);
  --ad-ext-x01-remaining-score-bar-fill-bg-active:var(--ad-ext-x01-remaining-score-bar-fill-base-active);
  --ad-ext-x01-remaining-score-bar-fill-shadow-active:0 0 18px rgba(132,204,22,.3);
  --ad-ext-x01-remaining-score-bar-track-overlay-active:linear-gradient(180deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,0) 70%);
  --ad-ext-x01-remaining-score-bar-track-overlay-opacity-active:1;
  --ad-ext-x01-remaining-score-bar-track-inner-shadow-active:inset 0 0 0 1px rgba(255,255,255,.06);
  --ad-ext-x01-remaining-score-bar-track-backdrop-filter-active:blur(8px) saturate(115%);
  --ad-ext-x01-remaining-score-bar-fill-overlay-image-active:none;
  --ad-ext-x01-remaining-score-bar-fill-overlay-size-active:auto;
  --ad-ext-x01-remaining-score-bar-fill-overlay-position-active:0 0;
  --ad-ext-x01-remaining-score-bar-fill-overlay-repeat-active:repeat;
  --ad-ext-x01-remaining-score-bar-fill-overlay-blend-active:screen;
  --ad-ext-x01-remaining-score-bar-fill-overlay-opacity-active:0;
  --ad-ext-x01-remaining-score-bar-track-bg:var(--ad-ext-x01-remaining-score-bar-track-bg-active);
  --ad-ext-x01-remaining-score-bar-fill-bg:var(--ad-ext-x01-remaining-score-bar-fill-bg-active);
  --ad-ext-x01-remaining-score-bar-fill-shadow:var(--ad-ext-x01-remaining-score-bar-fill-shadow-active);
  --ad-ext-x01-remaining-score-bar-track-overlay:var(--ad-ext-x01-remaining-score-bar-track-overlay-active);
  --ad-ext-x01-remaining-score-bar-track-overlay-opacity:var(--ad-ext-x01-remaining-score-bar-track-overlay-opacity-active);
  --ad-ext-x01-remaining-score-bar-track-inner-shadow:var(--ad-ext-x01-remaining-score-bar-track-inner-shadow-active);
  --ad-ext-x01-remaining-score-bar-track-border-color:var(--ad-ext-x01-remaining-score-bar-track-border-active);
  --ad-ext-x01-remaining-score-bar-track-backdrop-filter:var(--ad-ext-x01-remaining-score-bar-track-backdrop-filter-active);
  --ad-ext-x01-remaining-score-bar-fill-overlay-image:var(--ad-ext-x01-remaining-score-bar-fill-overlay-image-active);
  --ad-ext-x01-remaining-score-bar-fill-overlay-size:var(--ad-ext-x01-remaining-score-bar-fill-overlay-size-active);
  --ad-ext-x01-remaining-score-bar-fill-overlay-position:var(--ad-ext-x01-remaining-score-bar-fill-overlay-position-active);
  --ad-ext-x01-remaining-score-bar-fill-overlay-repeat:var(--ad-ext-x01-remaining-score-bar-fill-overlay-repeat-active);
  --ad-ext-x01-remaining-score-bar-fill-overlay-blend:var(--ad-ext-x01-remaining-score-bar-fill-overlay-blend-active);
  --ad-ext-x01-remaining-score-bar-fill-overlay-opacity:var(--ad-ext-x01-remaining-score-bar-fill-overlay-opacity-active);
  display:block;
  width:100%;
  min-width:0;
  margin-top:var(--ad-ext-x01-remaining-score-bar-margin-top);
  grid-column:1 / -1;
  grid-row:3;
  justify-self:stretch;
  align-self:start;
  order:99;
  flex:0 0 100%;
  opacity:1;
}

${HOST_SELECTOR}.${ACTIVE_CLASS}{
  --ad-ext-x01-remaining-score-bar-height:var(--ad-ext-x01-remaining-score-bar-height-active);
  --ad-ext-x01-remaining-score-bar-margin-top:var(--ad-ext-x01-remaining-score-bar-margin-top-active);
  --ad-ext-x01-remaining-score-bar-track-bg:var(--ad-ext-x01-remaining-score-bar-track-bg-active);
  --ad-ext-x01-remaining-score-bar-fill-bg:var(--ad-ext-x01-remaining-score-bar-fill-bg-active);
  --ad-ext-x01-remaining-score-bar-fill-shadow:var(--ad-ext-x01-remaining-score-bar-fill-shadow-active);
  --ad-ext-x01-remaining-score-bar-track-overlay:var(--ad-ext-x01-remaining-score-bar-track-overlay-active);
  --ad-ext-x01-remaining-score-bar-track-overlay-opacity:var(--ad-ext-x01-remaining-score-bar-track-overlay-opacity-active);
  --ad-ext-x01-remaining-score-bar-track-inner-shadow:var(--ad-ext-x01-remaining-score-bar-track-inner-shadow-active);
  --ad-ext-x01-remaining-score-bar-track-border-color:var(--ad-ext-x01-remaining-score-bar-track-border-active);
  --ad-ext-x01-remaining-score-bar-track-backdrop-filter:var(--ad-ext-x01-remaining-score-bar-track-backdrop-filter-active);
  --ad-ext-x01-remaining-score-bar-fill-overlay-image:var(--ad-ext-x01-remaining-score-bar-fill-overlay-image-active);
  --ad-ext-x01-remaining-score-bar-fill-overlay-size:var(--ad-ext-x01-remaining-score-bar-fill-overlay-size-active);
  --ad-ext-x01-remaining-score-bar-fill-overlay-position:var(--ad-ext-x01-remaining-score-bar-fill-overlay-position-active);
  --ad-ext-x01-remaining-score-bar-fill-overlay-repeat:var(--ad-ext-x01-remaining-score-bar-fill-overlay-repeat-active);
  --ad-ext-x01-remaining-score-bar-fill-overlay-blend:var(--ad-ext-x01-remaining-score-bar-fill-overlay-blend-active);
  --ad-ext-x01-remaining-score-bar-fill-overlay-opacity:var(--ad-ext-x01-remaining-score-bar-fill-overlay-opacity-active);
}

${HOST_SELECTOR}.${INACTIVE_CLASS}{
  --ad-ext-x01-remaining-score-bar-height:var(--ad-ext-x01-remaining-score-bar-height-inactive);
  --ad-ext-x01-remaining-score-bar-margin-top:var(--ad-ext-x01-remaining-score-bar-margin-top-inactive);
  --ad-ext-x01-remaining-score-bar-track-bg:rgba(148,163,184,.12);
  --ad-ext-x01-remaining-score-bar-fill-bg:linear-gradient(90deg,rgba(148,163,184,.72) 0%,rgba(203,213,225,.78) 100%);
  --ad-ext-x01-remaining-score-bar-fill-shadow:none;
  --ad-ext-x01-remaining-score-bar-track-overlay:linear-gradient(180deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,0) 70%);
  --ad-ext-x01-remaining-score-bar-track-overlay-opacity:1;
  --ad-ext-x01-remaining-score-bar-track-inner-shadow:inset 0 0 0 1px rgba(255,255,255,.06);
  --ad-ext-x01-remaining-score-bar-track-border-color:rgba(255,255,255,.06);
  --ad-ext-x01-remaining-score-bar-track-backdrop-filter:blur(8px) saturate(105%);
  --ad-ext-x01-remaining-score-bar-fill-overlay-image:none;
  --ad-ext-x01-remaining-score-bar-fill-overlay-size:auto;
  --ad-ext-x01-remaining-score-bar-fill-overlay-position:0 0;
  --ad-ext-x01-remaining-score-bar-fill-overlay-repeat:repeat;
  --ad-ext-x01-remaining-score-bar-fill-overlay-blend:screen;
  --ad-ext-x01-remaining-score-bar-fill-overlay-opacity:0;
  opacity:.88;
}

${HOST_SELECTOR} .${TRACK_CLASS}{
  position:relative;
  width:100%;
  height:var(--ad-ext-x01-remaining-score-bar-height,var(--ad-ext-x01-remaining-score-bar-height-active));
  min-height:2px;
  overflow:hidden;
  border-radius:999px;
  background:var(--ad-ext-x01-remaining-score-bar-track-bg);
  border:1px solid var(--ad-ext-x01-remaining-score-bar-track-border-color);
  box-shadow:var(--ad-ext-x01-remaining-score-bar-track-inner-shadow);
  backdrop-filter:var(--ad-ext-x01-remaining-score-bar-track-backdrop-filter);
}

${HOST_SELECTOR} .${TRACK_CLASS}::after{
  content:"";
  position:absolute;
  inset:0;
  background:var(--ad-ext-x01-remaining-score-bar-track-overlay);
  opacity:var(--ad-ext-x01-remaining-score-bar-track-overlay-opacity);
  pointer-events:none;
}

${HOST_SELECTOR} .${TRAIL_CLASS}{
  position:absolute;
  left:0;
  top:0;
  bottom:0;
  width:var(--ad-ext-x01-remaining-score-bar-trail-width);
  opacity:0;
  border-radius:inherit;
  background:
    linear-gradient(90deg,rgba(255,255,255,.38) 0%,rgba(255,255,255,.18) 42%,rgba(255,255,255,0) 100%),
    var(--ad-ext-x01-remaining-score-bar-fill-bg);
  filter:blur(7px) brightness(1.24) saturate(1.12);
  box-shadow:
    var(--ad-ext-x01-remaining-score-bar-fill-shadow),
    0 0 16px var(--ad-ext-x01-remaining-score-bar-fill-outline-active),
    0 0 26px var(--ad-ext-x01-remaining-score-bar-fill-ambient-active);
  pointer-events:none;
}

${HOST_SELECTOR} .${FILL_CLASS}{
  position:relative;
  height:100%;
  width:var(--ad-ext-x01-remaining-score-bar-width);
  max-width:100%;
  min-width:0;
  border-radius:inherit;
  background:var(--ad-ext-x01-remaining-score-bar-fill-bg);
  box-shadow:var(--ad-ext-x01-remaining-score-bar-fill-shadow);
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
  background-image:var(--ad-ext-x01-remaining-score-bar-fill-overlay-image);
  background-size:var(--ad-ext-x01-remaining-score-bar-fill-overlay-size);
  background-position:var(--ad-ext-x01-remaining-score-bar-fill-overlay-position);
  background-repeat:var(--ad-ext-x01-remaining-score-bar-fill-overlay-repeat);
  mix-blend-mode:var(--ad-ext-x01-remaining-score-bar-fill-overlay-blend);
  opacity:var(--ad-ext-x01-remaining-score-bar-fill-overlay-opacity);
}

${HOST_SELECTOR} .${FILL_CLASS}::after{
  opacity:0;
}

${HOST_SELECTOR}.${ACTIVE_CLASS}.ad-ext-x01-remaining-score-bar--size-schmal{
  --ad-ext-x01-remaining-score-bar-height-active:clamp(.3rem,.62vw,.46rem);
}

${HOST_SELECTOR}.${ACTIVE_CLASS}.ad-ext-x01-remaining-score-bar--size-standard{
  --ad-ext-x01-remaining-score-bar-height-active:clamp(.72rem,1.35vw,1.02rem);
}

${HOST_SELECTOR}.${ACTIVE_CLASS}.ad-ext-x01-remaining-score-bar--size-breit{
  --ad-ext-x01-remaining-score-bar-height-active:clamp(1.08rem,1.9vw,1.4rem);
}

${HOST_SELECTOR}.${ACTIVE_CLASS}.ad-ext-x01-remaining-score-bar--size-extrabreit{
  --ad-ext-x01-remaining-score-bar-height-active:clamp(1.48rem,2.52vw,1.92rem);
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-remaining-score-bar__fill--effect-bar-pulse{
  transform-origin:center;
  animation:ad-ext-x01-remaining-score-bar-bar-pulse 1.22s cubic-bezier(.16,.9,.2,1) infinite;
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-remaining-score-bar__fill--effect-glass-light-sweep{
  animation:ad-ext-x01-remaining-score-bar-glass-light-sweep-core 2.2s cubic-bezier(.18,.82,.18,1) infinite;
  box-shadow:
    var(--ad-ext-x01-remaining-score-bar-fill-shadow),
    inset 0 1px 2px rgba(255,255,255,.34),
    inset 0 -1px 4px rgba(255,255,255,.12);
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-remaining-score-bar__fill--effect-glass-light-sweep::after{
  opacity:1;
  background:
    linear-gradient(115deg,rgba(255,255,255,0) 8%,rgba(255,255,255,.16) 27%,rgba(255,255,255,.76) 48%,rgba(255,255,255,.2) 68%,rgba(255,255,255,0) 92%),
    linear-gradient(180deg,rgba(255,255,255,.28) 0%,rgba(255,255,255,0) 46%);
  transform:translateX(-175%);
  animation:ad-ext-x01-remaining-score-bar-glass-light-sweep-sweep 2.2s cubic-bezier(.18,.82,.18,1) infinite;
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-remaining-score-bar__fill--effect-moving-segments{
  background-image:
    repeating-linear-gradient(90deg,rgba(255,255,255,.04) 0 14px,rgba(255,255,255,.32) 14px 16px),
    var(--ad-ext-x01-remaining-score-bar-fill-bg);
  background-size:16px 100%,100% 100%;
  animation:ad-ext-x01-remaining-score-bar-moving-segments 1.08s steps(4,end) infinite;
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-remaining-score-bar__fill--effect-previous-score-trail{
  filter:brightness(1.08) saturate(1.08);
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-remaining-score-bar__fill--effect-previous-score-trail::after{
  opacity:.55;
  background:linear-gradient(90deg,rgba(255,255,255,.24) 0%,rgba(255,255,255,0) 22%,rgba(255,255,255,0) 100%);
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-remaining-score-bar__fill--effect-fast-signal-sweep{
  animation:ad-ext-x01-remaining-score-bar-fast-signal-sweep-core 1.04s ease-in-out infinite;
}

${HOST_SELECTOR}.${ACTIVE_CLASS} .${FILL_CLASS}.ad-ext-x01-remaining-score-bar__fill--effect-fast-signal-sweep::after{
  opacity:1;
  background:linear-gradient(112deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.08) 34%,rgba(255,255,255,.72) 50%,rgba(255,255,255,.08) 66%,rgba(255,255,255,0) 100%);
  transform:translateX(-155%);
  animation:ad-ext-x01-remaining-score-bar-fast-signal-sweep 1.04s linear infinite;
}

@keyframes ad-ext-x01-remaining-score-bar-bar-pulse{
  0%,100%{transform:scaleY(1);filter:brightness(1.02) saturate(1.05);box-shadow:var(--ad-ext-x01-remaining-score-bar-fill-shadow)}
  48%{transform:scaleY(1.34);filter:brightness(1.36) saturate(1.28);box-shadow:var(--ad-ext-x01-remaining-score-bar-fill-shadow),0 0 16px var(--ad-ext-x01-remaining-score-bar-fill-outline-active),0 0 26px var(--ad-ext-x01-remaining-score-bar-fill-ambient-active)}
}

@keyframes ad-ext-x01-remaining-score-bar-glass-light-sweep-core{
  0%,100%{filter:brightness(1.02) saturate(1.05);box-shadow:var(--ad-ext-x01-remaining-score-bar-fill-shadow),inset 0 1px 2px rgba(255,255,255,.26),inset 0 -1px 3px rgba(255,255,255,.1)}
  42%{filter:brightness(1.16) saturate(1.14);box-shadow:var(--ad-ext-x01-remaining-score-bar-fill-shadow),0 0 10px var(--ad-ext-x01-remaining-score-bar-fill-outline-active),inset 0 1px 4px rgba(255,255,255,.34),inset 0 -1px 5px rgba(255,255,255,.14)}
  62%{filter:brightness(1.34) saturate(1.26);box-shadow:var(--ad-ext-x01-remaining-score-bar-fill-shadow),0 0 18px var(--ad-ext-x01-remaining-score-bar-fill-outline-active),0 0 30px var(--ad-ext-x01-remaining-score-bar-fill-ambient-active),inset 0 1px 6px rgba(255,255,255,.46),inset 0 -1px 8px rgba(255,255,255,.18)}
}

@keyframes ad-ext-x01-remaining-score-bar-glass-light-sweep-sweep{
  0%,16%{transform:translateX(-175%);opacity:.18}
  56%{transform:translateX(-8%);opacity:1}
  78%,100%{transform:translateX(175%);opacity:.16}
}

@keyframes ad-ext-x01-remaining-score-bar-moving-segments{
  0%{background-position:0 0,0 0;filter:brightness(1.02)}
  100%{background-position:16px 0,0 0;filter:brightness(1.18)}
}

@keyframes ad-ext-x01-remaining-score-bar-fast-signal-sweep-core{
  0%,100%{filter:brightness(1.02) saturate(1.06)}
  42%{filter:brightness(1.24) saturate(1.18)}
}

@keyframes ad-ext-x01-remaining-score-bar-fast-signal-sweep{
  0%{transform:translateX(-155%)}
  100%{transform:translateX(155%)}
}

@media (prefers-reduced-motion: reduce) {
  ${HOST_SELECTOR} .${FILL_CLASS},
  ${HOST_SELECTOR} .${FILL_CLASS}::after,
  ${HOST_SELECTOR} .${TRAIL_CLASS} {
    animation: none !important;
    transition: none !important;
  }
}
`;
}
