export const STYLE_ID = "ad-ext-turn-points-count-style";
export const SCORE_SELECTOR = ".ad-ext-turn-points";
export const SCORE_FLASH_CLASS = "ad-ext-turn-points-count--flash";

export function buildStyleText() {
  return `
${SCORE_SELECTOR}.${SCORE_FLASH_CLASS}{
  animation:ad-ext-turn-points-count-flash 220ms cubic-bezier(.16,.92,.24,1) infinite;
  will-change:transform,filter,text-shadow,opacity;
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
`;
}
