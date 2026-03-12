export const STYLE_ID = "ad-ext-triple-double-bull-hits-style";
export const HIT_BASE_CLASS = "ad-ext-hit-highlight";
export const HIT_KIND_CLASS = Object.freeze({
  triple: "ad-ext-hit-highlight--triple",
  double: "ad-ext-hit-highlight--double",
  bullInner: "ad-ext-hit-highlight--bull-inner",
  bullOuter: "ad-ext-hit-highlight--bull-outer",
});
export const HIT_THEME_CLASS = Object.freeze({
  "ember-rush": "ad-ext-hit-theme--ember-rush",
  "ice-circuit": "ad-ext-hit-theme--ice-circuit",
  "volt-lime": "ad-ext-hit-theme--volt-lime",
  "crimson-steel": "ad-ext-hit-theme--crimson-steel",
  "arctic-mint": "ad-ext-hit-theme--arctic-mint",
  "champagne-night": "ad-ext-hit-theme--champagne-night",
});
export const HIT_ANIMATION_CLASS = Object.freeze({
  "impact-pop": "ad-ext-hit-animation--impact-pop",
  shockwave: "ad-ext-hit-animation--shockwave",
  "sweep-shine": "ad-ext-hit-animation--sweep-shine",
  "neon-pulse": "ad-ext-hit-animation--neon-pulse",
  "snap-bounce": "ad-ext-hit-animation--snap-bounce",
  "card-slam": "ad-ext-hit-animation--card-slam",
  "signal-blink": "ad-ext-hit-animation--signal-blink",
  "stagger-wave": "ad-ext-hit-animation--stagger-wave",
  "flip-edge": "ad-ext-hit-animation--flip-edge",
  "outline-trace": "ad-ext-hit-animation--outline-trace",
  "charge-release": "ad-ext-hit-animation--charge-release",
  "alternate-flick": "ad-ext-hit-animation--alternate-flick",
});
export const HIT_ANIMATION_TRIGGER_CLASS = "ad-ext-hit-highlight--animate";

export function buildStyleText() {
  return `
.ad-ext-turn-throw.${HIT_BASE_CLASS} {
  --ad-ext-hit-color-a: #a3e635;
  --ad-ext-hit-color-b: #84cc16;
  --ad-ext-hit-color-c: #4ade80;
  --ad-ext-hit-glow: rgba(132, 204, 22, 0.48);
  --ad-ext-hit-text: #f8fafc;
  --ad-ext-hit-kind-boost: 1;
  --ad-ext-hit-delay-ms: 0ms;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  isolation: isolate;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 8px 24px rgba(0, 0, 0, 0.22);
  transform-origin: 50% 50%;
  transition:
    box-shadow 160ms ease-out,
    border-color 160ms ease-out;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}::before,
.ad-ext-turn-throw.${HIT_BASE_CLASS}::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}::before {
  background: linear-gradient(
    130deg,
    var(--ad-ext-hit-color-a) 0%,
    var(--ad-ext-hit-color-b) 56%,
    var(--ad-ext-hit-color-c) 100%
  );
  opacity: calc(0.23 * var(--ad-ext-hit-kind-boost));
  box-shadow: 0 0 24px var(--ad-ext-hit-glow);
  z-index: 0;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}::after {
  background: linear-gradient(
    100deg,
    transparent 0%,
    rgba(255, 255, 255, 0.12) 34%,
    rgba(255, 255, 255, 0.22) 50%,
    rgba(255, 255, 255, 0.08) 67%,
    transparent 100%
  );
  opacity: 0;
  z-index: 1;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} p,
.ad-ext-turn-throw.${HIT_BASE_CLASS} .chakra-text,
.ad-ext-turn-throw.${HIT_BASE_CLASS} > div {
  position: relative;
  z-index: 2;
  color: var(--ad-ext-hit-text);
  text-shadow:
    0 0 12px rgba(0, 0, 0, 0.5),
    0 0 4px rgba(255, 255, 255, 0.16);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_KIND_CLASS.triple} {
  --ad-ext-hit-kind-boost: 1.08;
  border-color: rgba(255, 157, 0, 0.55);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_KIND_CLASS.double} {
  --ad-ext-hit-kind-boost: 1.04;
  border-color: rgba(76, 184, 255, 0.52);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_KIND_CLASS.bullOuter} {
  --ad-ext-hit-kind-boost: 0.9;
  border-color: rgba(158, 255, 126, 0.46);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_KIND_CLASS.bullInner} {
  --ad-ext-hit-kind-boost: 1.22;
  border-color: rgba(255, 247, 125, 0.68);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.14) inset,
    0 0 26px rgba(255, 247, 125, 0.38),
    0 10px 28px rgba(0, 0, 0, 0.3);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["ember-rush"]} {
  --ad-ext-hit-color-a: #ef4444;
  --ad-ext-hit-color-b: #f97316;
  --ad-ext-hit-color-c: #fbbf24;
  --ad-ext-hit-glow: rgba(249, 115, 22, 0.46);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["ice-circuit"]} {
  --ad-ext-hit-color-a: #0ea5e9;
  --ad-ext-hit-color-b: #38bdf8;
  --ad-ext-hit-color-c: #60a5fa;
  --ad-ext-hit-glow: rgba(56, 189, 248, 0.44);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["volt-lime"]} {
  --ad-ext-hit-color-a: #84cc16;
  --ad-ext-hit-color-b: #a3e635;
  --ad-ext-hit-color-c: #bef264;
  --ad-ext-hit-glow: rgba(163, 230, 53, 0.45);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["crimson-steel"]} {
  --ad-ext-hit-color-a: #dc2626;
  --ad-ext-hit-color-b: #9f1239;
  --ad-ext-hit-color-c: #64748b;
  --ad-ext-hit-glow: rgba(220, 38, 38, 0.4);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["arctic-mint"]} {
  --ad-ext-hit-color-a: #5eead4;
  --ad-ext-hit-color-b: #2dd4bf;
  --ad-ext-hit-color-c: #67e8f9;
  --ad-ext-hit-glow: rgba(45, 212, 191, 0.42);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["champagne-night"]} {
  --ad-ext-hit-color-a: #facc15;
  --ad-ext-hit-color-b: #fde68a;
  --ad-ext-hit-color-c: #fef3c7;
  --ad-ext-hit-glow: rgba(250, 204, 21, 0.38);
  --ad-ext-hit-text: #fffdf3;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["impact-pop"]}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation: ad-ext-hit-impact-pop 420ms cubic-bezier(0.22, 0.8, 0.22, 1);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS.shockwave}.${HIT_ANIMATION_TRIGGER_CLASS}::before {
  animation: ad-ext-hit-shockwave 560ms ease-out;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["sweep-shine"]}.${HIT_ANIMATION_TRIGGER_CLASS}::after {
  animation: ad-ext-hit-sweep-shine 620ms ease-out;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["neon-pulse"]}.${HIT_ANIMATION_TRIGGER_CLASS}::before {
  animation: ad-ext-hit-neon-pulse 560ms ease-in-out;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["snap-bounce"]}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation: ad-ext-hit-snap-bounce 520ms cubic-bezier(0.16, 1, 0.3, 1);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["card-slam"]}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation: ad-ext-hit-card-slam 460ms cubic-bezier(0.24, 0.9, 0.32, 1);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["signal-blink"]}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation: ad-ext-hit-signal-blink 520ms ease-out;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["stagger-wave"]}.${HIT_ANIMATION_TRIGGER_CLASS}::before {
  animation: ad-ext-hit-stagger-wave 700ms ease-out var(--ad-ext-hit-delay-ms);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["flip-edge"]}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation: ad-ext-hit-flip-edge 560ms cubic-bezier(0.22, 0.82, 0.28, 1);
  transform-style: preserve-3d;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["outline-trace"]}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation: ad-ext-hit-outline-trace 580ms ease-out;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["charge-release"]}.${HIT_ANIMATION_TRIGGER_CLASS}::before {
  animation: ad-ext-hit-charge-release 680ms cubic-bezier(0.2, 0.95, 0.2, 1);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["alternate-flick"]}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation: ad-ext-hit-alternate-flick 640ms ease-in-out;
}

@keyframes ad-ext-hit-impact-pop {
  0% { transform: scale(1); }
  28% { transform: scale(1.065); }
  100% { transform: scale(1); }
}

@keyframes ad-ext-hit-shockwave {
  0% { transform: scale(0.92); opacity: 0.18; }
  55% { transform: scale(1.06); opacity: 0.46; }
  100% { transform: scale(1); opacity: 0.25; }
}

@keyframes ad-ext-hit-sweep-shine {
  0% { transform: translateX(-115%); opacity: 0; }
  22% { opacity: 0.26; }
  68% { opacity: 0.26; }
  100% { transform: translateX(115%); opacity: 0; }
}

@keyframes ad-ext-hit-neon-pulse {
  0% { opacity: 0.18; filter: saturate(0.92); }
  45% { opacity: 0.45; filter: saturate(1.2); }
  100% { opacity: 0.24; filter: saturate(1); }
}

@keyframes ad-ext-hit-snap-bounce {
  0% { transform: translateY(0) scale(1); }
  25% { transform: translateY(-2px) scale(1.05); }
  58% { transform: translateY(1px) scale(0.985); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes ad-ext-hit-card-slam {
  0% { transform: translateY(-3px) scale(1.02); }
  46% { transform: translateY(1px) scale(0.995); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes ad-ext-hit-signal-blink {
  0%, 100% { opacity: 1; }
  22% { opacity: 0.52; }
  45% { opacity: 1; }
  70% { opacity: 0.62; }
}

@keyframes ad-ext-hit-stagger-wave {
  0% { opacity: 0.2; transform: translateY(2px); }
  45% { opacity: 0.44; transform: translateY(-1px); }
  100% { opacity: 0.25; transform: translateY(0); }
}

@keyframes ad-ext-hit-flip-edge {
  0% { transform: perspective(850px) rotateX(0deg) scale(1); }
  36% { transform: perspective(850px) rotateX(7deg) scale(1.015); }
  100% { transform: perspective(850px) rotateX(0deg) scale(1); }
}

@keyframes ad-ext-hit-outline-trace {
  0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.05) inset, 0 8px 24px rgba(0, 0, 0, 0.22); }
  42% { box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.44) inset, 0 0 18px var(--ad-ext-hit-glow); }
  100% { box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 8px 24px rgba(0, 0, 0, 0.22); }
}

@keyframes ad-ext-hit-charge-release {
  0% { opacity: 0.12; transform: scale(0.98); filter: blur(1px); }
  55% { opacity: 0.52; transform: scale(1.03); filter: blur(0); }
  100% { opacity: 0.24; transform: scale(1); filter: blur(0); }
}

@keyframes ad-ext-hit-alternate-flick {
  0% { transform: translateX(0) scale(1); }
  24% { transform: translateX(-1px) scale(1.02); }
  48% { transform: translateX(1px) scale(0.996); }
  72% { transform: translateX(-1px) scale(1.01); }
  100% { transform: translateX(0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_TRIGGER_CLASS},
  .ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_TRIGGER_CLASS}::before,
  .ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_TRIGGER_CLASS}::after {
    animation: none !important;
  }
  .ad-ext-turn-throw.${HIT_BASE_CLASS} {
    transition: none !important;
  }
}
`;
}
