export const STYLE_ID = "ad-ext-x01-score-progress-style";
export const HOST_ATTRIBUTE = "data-ad-ext-x01-score-progress";
export const HOST_SELECTOR = `[${HOST_ATTRIBUTE}='true']`;
export const TRACK_CLASS = "ad-ext-x01-score-progress__track";
export const FILL_CLASS = "ad-ext-x01-score-progress__fill";
export const ACTIVE_CLASS = "ad-ext-x01-score-progress--active";
export const INACTIVE_CLASS = "ad-ext-x01-score-progress--inactive";
export const PRESET_CLASS_PREFIX = "ad-ext-x01-score-progress--preset-";

const DESIGN_PRESETS = new Set(["signal", "glass", "minimal"]);

export function normalizeDesignPreset(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return DESIGN_PRESETS.has(normalized) ? normalized : "signal";
}

export function getPresetClass(value) {
  return `${PRESET_CLASS_PREFIX}${normalizeDesignPreset(value)}`;
}

export function buildStyleText() {
  return `
${HOST_SELECTOR}{
  --ad-ext-x01-score-progress-width:0%;
  --ad-ext-x01-score-progress-height-active:clamp(.72rem,1.35vw,1.02rem);
  --ad-ext-x01-score-progress-height-inactive:clamp(.3rem,.72vw,.52rem);
  --ad-ext-x01-score-progress-margin-top:clamp(.3rem,.95vw,.6rem);
  --ad-ext-x01-score-progress-track-bg:rgba(154,163,184,.14);
  --ad-ext-x01-score-progress-fill-bg:linear-gradient(90deg,rgba(163,230,53,.96) 0%,rgba(134,239,172,.98) 100%);
  --ad-ext-x01-score-progress-fill-shadow:0 0 14px rgba(134,239,172,.24);
  --ad-ext-x01-score-progress-sheen:rgba(255,255,255,.16);
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
  height:100%;
  width:var(--ad-ext-x01-score-progress-width);
  max-width:100%;
  min-width:0;
  border-radius:inherit;
  background:var(--ad-ext-x01-score-progress-fill-bg);
  box-shadow:var(--ad-ext-x01-score-progress-fill-shadow);
  transition:width 160ms ease-out,opacity 160ms ease-out,filter 160ms ease-out;
}

${HOST_SELECTOR}.${ACTIVE_CLASS}.ad-ext-x01-score-progress--preset-signal{
  --ad-ext-x01-score-progress-track-bg:linear-gradient(90deg,rgba(34,84,18,.42) 0%,rgba(56,94,22,.18) 100%);
  --ad-ext-x01-score-progress-fill-bg:linear-gradient(90deg,rgba(132,204,22,.98) 0%,rgba(163,230,53,.98) 42%,rgba(190,242,100,.98) 100%);
  --ad-ext-x01-score-progress-fill-shadow:0 0 18px rgba(132,204,22,.3);
}

${HOST_SELECTOR}.ad-ext-x01-score-progress--preset-glass{
  --ad-ext-x01-score-progress-track-bg:linear-gradient(180deg,rgba(255,255,255,.18) 0%,rgba(148,163,184,.08) 100%);
  --ad-ext-x01-score-progress-fill-bg:linear-gradient(90deg,rgba(110,231,183,.7) 0%,rgba(74,222,128,.8) 38%,rgba(34,197,94,.92) 100%);
  --ad-ext-x01-score-progress-fill-shadow:0 0 16px rgba(74,222,128,.2);
  --ad-ext-x01-score-progress-sheen:rgba(255,255,255,.24);
}

${HOST_SELECTOR}.${INACTIVE_CLASS}.ad-ext-x01-score-progress--preset-glass{
  --ad-ext-x01-score-progress-track-bg:linear-gradient(180deg,rgba(255,255,255,.12) 0%,rgba(100,116,139,.06) 100%);
  --ad-ext-x01-score-progress-fill-bg:linear-gradient(90deg,rgba(148,163,184,.46) 0%,rgba(203,213,225,.58) 100%);
}

${HOST_SELECTOR}.ad-ext-x01-score-progress--preset-minimal{
  --ad-ext-x01-score-progress-height-active:clamp(.36rem,.75vw,.58rem);
  --ad-ext-x01-score-progress-height-inactive:clamp(.18rem,.44vw,.28rem);
  --ad-ext-x01-score-progress-track-bg:rgba(255,255,255,.08);
  --ad-ext-x01-score-progress-fill-bg:linear-gradient(90deg,rgba(134,239,172,.92) 0%,rgba(74,222,128,.96) 100%);
  --ad-ext-x01-score-progress-fill-shadow:none;
  --ad-ext-x01-score-progress-sheen:rgba(255,255,255,.05);
}

${HOST_SELECTOR}.${INACTIVE_CLASS}.ad-ext-x01-score-progress--preset-minimal{
  --ad-ext-x01-score-progress-track-bg:rgba(148,163,184,.08);
  --ad-ext-x01-score-progress-fill-bg:linear-gradient(90deg,rgba(148,163,184,.62) 0%,rgba(203,213,225,.66) 100%);
}

@media (max-width: 960px){
  ${HOST_SELECTOR}{
    --ad-ext-x01-score-progress-height-active:clamp(.56rem,1vw,.84rem);
    --ad-ext-x01-score-progress-height-inactive:clamp(.24rem,.52vw,.42rem);
  }
}
`;
}
