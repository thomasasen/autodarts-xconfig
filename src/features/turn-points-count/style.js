import {
  ELECTRIC_FILTER_SOFT_ID,
  ELECTRIC_FILTER_STRONG_ID,
} from "../../shared/electric-border-engine.js";

export const STYLE_ID = "ad-ext-turn-points-count-style";
export const SCORE_SELECTOR = ".ad-ext-turn-points";
export const SCORE_FLASH_CLASS = "ad-ext-turn-points-count--flash";
export const SCORE_FRAME_CLASS = "ad-ext-turn-points-count--frame";

export function buildStyleText() {
  return `
${SCORE_SELECTOR}.${SCORE_FLASH_CLASS}{
  animation:ad-ext-turn-points-count-flash 220ms cubic-bezier(.16,.92,.24,1) infinite;
  will-change:transform,filter,text-shadow,opacity;
}

.${SCORE_FRAME_CLASS}{
  --ad-ext-turn-points-electric-filter-soft:url(#${ELECTRIC_FILTER_SOFT_ID});
  --ad-ext-turn-points-electric-filter-strong:url(#${ELECTRIC_FILTER_STRONG_ID});
  position:relative;
  isolation:isolate;
}

.${SCORE_FRAME_CLASS}::before,
.${SCORE_FRAME_CLASS}::after{
  content:"";
  position:absolute;
  pointer-events:none;
}

.${SCORE_FRAME_CLASS}::before{
  inset:-7px;
  border-radius:12px;
  border:1px solid color-mix(in srgb,rgba(255,204,132,.92) 76%,white 24%);
  background:
    linear-gradient(110deg,rgba(255,255,255,.14) 0%,rgba(255,255,255,0) 34%,rgba(255,255,255,0) 66%,rgba(255,255,255,.14) 100%);
  mix-blend-mode:screen;
  opacity:.96;
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.1),
    inset 0 0 16px rgba(255,212,148,.24),
    0 0 26px rgba(255,180,101,.48),
    0 0 54px rgba(255,152,72,.28);
  filter:var(--ad-ext-turn-points-electric-filter-strong);
  animation:
    ad-ext-turn-points-count-frame-electric 560ms steps(4,end) infinite,
    ad-ext-turn-points-count-frame-glow 560ms ease-in-out infinite;
}

.${SCORE_FRAME_CLASS}::after{
  inset:-12px;
  border-radius:15px;
  opacity:.72;
  background:
    radial-gradient(65% 150% at 50% 0%,rgba(255,224,180,.34),rgba(255,224,180,0) 72%),
    radial-gradient(65% 150% at 50% 100%,rgba(255,180,109,.3),rgba(255,180,109,0) 72%);
  filter:var(--ad-ext-turn-points-electric-filter-soft) blur(6px);
  animation:ad-ext-turn-points-count-frame-aura 560ms ease-out infinite;
}

@keyframes ad-ext-turn-points-count-flash{
  0%{
    transform:translateY(0) scale(1);
    filter:brightness(1) saturate(1);
    text-shadow:none;
    opacity:1;
  }
  36%{
    transform:translateY(-2px) scale(1.16);
    filter:brightness(1.62) saturate(1.55);
    text-shadow:
      0 0 7px rgba(255,255,255,.82),
      0 0 18px rgba(147,231,255,.9),
      0 0 30px rgba(140,255,200,.74);
    opacity:1;
  }
  72%{
    transform:translateY(0) scale(1.05);
    filter:brightness(1.24) saturate(1.28);
    text-shadow:
      0 0 8px rgba(164,246,255,.56),
      0 0 16px rgba(120,255,182,.42);
    opacity:1;
  }
  100%{
    transform:translateY(0) scale(1);
    filter:brightness(1) saturate(1);
    text-shadow:none;
    opacity:1;
  }
}

@keyframes ad-ext-turn-points-count-frame-electric{
  0%,100%{
    transform:translate(0,0);
    filter:var(--ad-ext-turn-points-electric-filter-strong);
  }
  38%{
    transform:translate(-1px,.5px);
    filter:var(--ad-ext-turn-points-electric-filter-strong) brightness(1.22) saturate(1.16);
  }
  72%{
    transform:translate(1.2px,-.8px);
    filter:var(--ad-ext-turn-points-electric-filter-strong) brightness(1.12) saturate(1.08);
  }
}

@keyframes ad-ext-turn-points-count-frame-glow{
  0%,100%{
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,.1),
      inset 0 0 16px rgba(255,212,148,.24),
      0 0 24px rgba(255,180,101,.42),
      0 0 46px rgba(255,152,72,.24);
    opacity:.84;
  }
  42%{
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,.22),
      inset 0 0 24px rgba(255,227,178,.34),
      0 0 36px rgba(255,203,138,.62),
      0 0 72px rgba(255,153,75,.4);
    opacity:1;
  }
}

@keyframes ad-ext-turn-points-count-frame-aura{
  0%,100%{
    opacity:.52;
    transform:scale(1);
  }
  45%{
    opacity:.86;
    transform:scale(1.02);
  }
}
`;
}
