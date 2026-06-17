import {
  ELECTRIC_FILTER_SOFT_ID,
  ELECTRIC_FILTER_STRONG_ID,
} from "../../shared/electric-border-engine.js";

export const STYLE_ID = "ad-ext-turn-score-counter-style";
export const SCORE_SELECTOR = ".ad-ext-turn-points";
export const SCORE_FLASH_CLASS = "ad-ext-turn-score-counter--flash";
export const SCORE_FRAME_CLASS = "ad-ext-turn-score-counter--frame";
export const SCORE_FLASH_SEQUENCE_ATTRIBUTE = "data-ad-ext-turn-points-flash-seq";
export const SCORE_FRAME_SEQUENCE_ATTRIBUTE = "data-ad-ext-turn-points-frame-seq";

export function buildStyleText() {
  return `
${SCORE_SELECTOR}.${SCORE_FLASH_CLASS}[${SCORE_FLASH_SEQUENCE_ATTRIBUTE}="0"]{
  animation:ad-ext-turn-score-counter-flash-a 390ms cubic-bezier(.16,.92,.24,1) both;
  will-change:transform,filter,text-shadow,opacity;
}

${SCORE_SELECTOR}.${SCORE_FLASH_CLASS}[${SCORE_FLASH_SEQUENCE_ATTRIBUTE}="1"]{
  animation:ad-ext-turn-score-counter-flash-b 390ms cubic-bezier(.16,.92,.24,1) both;
  will-change:transform,filter,text-shadow,opacity;
}

.${SCORE_FRAME_CLASS}{
  --ad-ext-turn-score-electric-filter-soft:url(#${ELECTRIC_FILTER_SOFT_ID});
  --ad-ext-turn-score-electric-filter-strong:url(#${ELECTRIC_FILTER_STRONG_ID});
  position:relative;
  isolation:isolate;
  z-index:0;
}

.${SCORE_FRAME_CLASS}::before,
.${SCORE_FRAME_CLASS}::after{
  content:"";
  position:absolute;
  pointer-events:none;
  z-index:-1;
}

.${SCORE_FRAME_CLASS}[${SCORE_FRAME_SEQUENCE_ATTRIBUTE}="0"]::before{
  inset:-5px;
  border-radius:10px;
  border:1px solid color-mix(in srgb,rgba(255,204,132,.92) 76%,white 24%);
  background:
    linear-gradient(110deg,rgba(255,255,255,.14) 0%,rgba(255,255,255,0) 34%,rgba(255,255,255,0) 66%,rgba(255,255,255,.14) 100%);
  mix-blend-mode:screen;
  opacity:.96;
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.1),
    inset 0 0 12px rgba(255,212,148,.18),
    0 0 18px rgba(255,180,101,.34),
    0 0 38px rgba(255,152,72,.2);
  filter:var(--ad-ext-turn-score-electric-filter-strong);
  animation:
    ad-ext-turn-score-counter-frame-electric-a 840ms steps(4,end) infinite,
    ad-ext-turn-score-counter-frame-glow-a 840ms ease-in-out infinite;
}

.${SCORE_FRAME_CLASS}[${SCORE_FRAME_SEQUENCE_ATTRIBUTE}="1"]::before{
  inset:-5px;
  border-radius:10px;
  border:1px solid color-mix(in srgb,rgba(255,204,132,.92) 76%,white 24%);
  background:
    linear-gradient(110deg,rgba(255,255,255,.14) 0%,rgba(255,255,255,0) 34%,rgba(255,255,255,0) 66%,rgba(255,255,255,.14) 100%);
  mix-blend-mode:screen;
  opacity:.96;
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.1),
    inset 0 0 12px rgba(255,212,148,.18),
    0 0 18px rgba(255,180,101,.34),
    0 0 38px rgba(255,152,72,.2);
  filter:var(--ad-ext-turn-score-electric-filter-strong);
  animation:
    ad-ext-turn-score-counter-frame-electric-b 840ms steps(4,end) infinite,
    ad-ext-turn-score-counter-frame-glow-b 840ms ease-in-out infinite;
}

.${SCORE_FRAME_CLASS}[${SCORE_FRAME_SEQUENCE_ATTRIBUTE}="0"]::after{
  inset:-7px;
  border-radius:12px;
  opacity:.58;
  background:
    radial-gradient(65% 150% at 50% 0%,rgba(255,224,180,.34),rgba(255,224,180,0) 72%),
    radial-gradient(65% 150% at 50% 100%,rgba(255,180,109,.3),rgba(255,180,109,0) 72%);
  filter:var(--ad-ext-turn-score-electric-filter-soft) blur(4px);
  animation:ad-ext-turn-score-counter-frame-aura-a 840ms ease-out infinite;
}

.${SCORE_FRAME_CLASS}[${SCORE_FRAME_SEQUENCE_ATTRIBUTE}="1"]::after{
  inset:-7px;
  border-radius:12px;
  opacity:.58;
  background:
    radial-gradient(65% 150% at 50% 0%,rgba(255,224,180,.34),rgba(255,224,180,0) 72%),
    radial-gradient(65% 150% at 50% 100%,rgba(255,180,109,.3),rgba(255,180,109,0) 72%);
  filter:var(--ad-ext-turn-score-electric-filter-soft) blur(4px);
  animation:ad-ext-turn-score-counter-frame-aura-b 840ms ease-out infinite;
}

@keyframes ad-ext-turn-score-counter-flash-a{
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

@keyframes ad-ext-turn-score-counter-flash-b{
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

@keyframes ad-ext-turn-score-counter-frame-electric-a{
  0%,100%{
    transform:translate(0,0);
    filter:var(--ad-ext-turn-score-electric-filter-strong);
  }
  38%{
    transform:translate(-1px,.5px);
    filter:var(--ad-ext-turn-score-electric-filter-strong) brightness(1.22) saturate(1.16);
  }
  72%{
    transform:translate(1.2px,-.8px);
    filter:var(--ad-ext-turn-score-electric-filter-strong) brightness(1.12) saturate(1.08);
  }
}

@keyframes ad-ext-turn-score-counter-frame-electric-b{
  0%,100%{
    transform:translate(0,0);
    filter:var(--ad-ext-turn-score-electric-filter-strong);
  }
  38%{
    transform:translate(-1px,.5px);
    filter:var(--ad-ext-turn-score-electric-filter-strong) brightness(1.22) saturate(1.16);
  }
  72%{
    transform:translate(1.2px,-.8px);
    filter:var(--ad-ext-turn-score-electric-filter-strong) brightness(1.12) saturate(1.08);
  }
}

@keyframes ad-ext-turn-score-counter-frame-glow-a{
  0%,100%{
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,.1),
      inset 0 0 12px rgba(255,212,148,.18),
      0 0 18px rgba(255,180,101,.32),
      0 0 34px rgba(255,152,72,.18);
    opacity:.84;
  }
  42%{
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,.22),
      inset 0 0 18px rgba(255,227,178,.28),
      0 0 28px rgba(255,203,138,.46),
      0 0 52px rgba(255,153,75,.28);
    opacity:1;
  }
}

@keyframes ad-ext-turn-score-counter-frame-glow-b{
  0%,100%{
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,.1),
      inset 0 0 12px rgba(255,212,148,.18),
      0 0 18px rgba(255,180,101,.32),
      0 0 34px rgba(255,152,72,.18);
    opacity:.84;
  }
  42%{
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,.22),
      inset 0 0 18px rgba(255,227,178,.28),
      0 0 28px rgba(255,203,138,.46),
      0 0 52px rgba(255,153,75,.28);
    opacity:1;
  }
}

@keyframes ad-ext-turn-score-counter-frame-aura-a{
  0%,100%{
    opacity:.52;
    transform:scale(1);
  }
  45%{
    opacity:.86;
    transform:scale(1.02);
  }
}

@keyframes ad-ext-turn-score-counter-frame-aura-b{
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
