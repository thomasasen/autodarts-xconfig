export const STYLE_ID = "ad-ext-turn-points-count-style";
export const SCORE_SELECTOR = "p.ad-ext-turn-points";
export const SCORE_FLASH_CLASS = "ad-ext-turn-points-count--flash";

export function buildStyleText() {
  return `
${SCORE_SELECTOR}.${SCORE_FLASH_CLASS}{
  animation:ad-ext-turn-points-count-flash 190ms cubic-bezier(.12,.88,.34,1) 1;
  will-change:transform,filter,text-shadow,opacity;
}

@keyframes ad-ext-turn-points-count-flash{
  0%{
    transform:translateY(0) scale(1);
    filter:brightness(1) saturate(1);
    text-shadow:none;
    opacity:1;
  }
  34%{
    transform:translateY(-1px) scale(1.08);
    filter:brightness(1.38) saturate(1.32);
    text-shadow:0 0 12px rgba(255,248,198,.62);
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
