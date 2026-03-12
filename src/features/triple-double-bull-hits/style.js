export const STYLE_ID = "ad-ext-triple-double-bull-hits-style";
export const HIT_BASE_CLASS = "ad-ext-hit-highlight";
export const HIT_IDLE_LOOP_CLASS = "ad-ext-hit-highlight--idle";
export const HIT_SCORE_CLASS = "ad-ext-hit-score";
export const HIT_SEGMENT_CLASS = "ad-ext-hit-segment";
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
  --ad-ext-hit-theme-a: #31f7a0;
  --ad-ext-hit-theme-b: #8cf34a;
  --ad-ext-hit-theme-c: #a0ffd0;
  --ad-ext-hit-theme-d: #f5ffbb;
  --ad-ext-hit-edge: rgba(170, 255, 115, 0.9);
  --ad-ext-hit-glow: rgba(117, 255, 145, 0.6);
  --ad-ext-hit-soft-glow: rgba(117, 255, 145, 0.28);
  --ad-ext-hit-text-main: #f8fcff;
  --ad-ext-hit-text-sub: rgba(231, 251, 255, 0.92);
  --ad-ext-hit-surface-a: rgba(8, 12, 22, 0.98);
  --ad-ext-hit-surface-b: rgba(12, 18, 32, 0.96);
  --ad-ext-hit-surface-c: rgba(6, 10, 18, 0.98);
  --ad-ext-hit-stripe-alpha: 0;
  --ad-ext-hit-gradient-opacity: 0.88;
  --ad-ext-hit-border-opacity: 0.92;
  --ad-ext-hit-shadow-size: 34px;
  --ad-ext-hit-delay-ms: 0ms;
  --ad-ext-hit-img-opacity: 0.15;
  --ad-ext-hit-img-filter: grayscale(1) brightness(0.24) contrast(1.56);
  position: relative;
  overflow: hidden;
  isolation: isolate;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background:
    linear-gradient(165deg, var(--ad-ext-hit-surface-a) 0%, var(--ad-ext-hit-surface-b) 48%, var(--ad-ext-hit-surface-c) 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    inset 0 -12px 30px rgba(0, 0, 0, 0.36),
    0 16px 30px rgba(0, 0, 0, 0.42),
    0 0 0 1px rgba(0, 0, 0, 0.28);
  transform-origin: center center;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  perspective: 1100px;
  will-change: transform, filter, box-shadow, border-color;
  transition: box-shadow 180ms ease-out, border-color 180ms ease-out, filter 180ms ease-out;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} > * {
  position: relative;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} img {
  z-index: 2 !important;
  opacity: var(--ad-ext-hit-img-opacity) !important;
  filter: var(--ad-ext-hit-img-filter) !important;
  transform: scale(1.02);
  transition: opacity 180ms ease-out, filter 180ms ease-out;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} > p,
.ad-ext-turn-throw.${HIT_BASE_CLASS} > .chakra-text {
  position: absolute !important;
  inset: 0 !important;
  margin: 0 !important;
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  z-index: 8 !important;
  pointer-events: none;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} > p > div,
.ad-ext-turn-throw.${HIT_BASE_CLASS} > .chakra-text > div,
.ad-ext-turn-throw.${HIT_BASE_CLASS} [style*="flex-direction: column"][style*="align-items: center"] {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1 !important;
  text-align: center !important;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}::before,
.ad-ext-turn-throw.${HIT_BASE_CLASS}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}::before {
  z-index: 3;
  inset: -14%;
  opacity: var(--ad-ext-hit-gradient-opacity);
  background-image:
    radial-gradient(circle at 18% 16%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 38%),
    radial-gradient(circle at 82% 84%, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 42%),
    repeating-linear-gradient(130deg, rgba(255, 255, 255, var(--ad-ext-hit-stripe-alpha)) 0 10px, rgba(255, 255, 255, 0) 10px 28px),
    conic-gradient(from 190deg at 50% 50%, rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.42)),
    linear-gradient(116deg, var(--ad-ext-hit-theme-a) 0%, var(--ad-ext-hit-theme-b) 34%, var(--ad-ext-hit-theme-c) 67%, var(--ad-ext-hit-theme-d) 100%);
  background-size: 120% 120%, 120% 120%, 240px 240px, 220% 220%, 220% 220%;
  background-position: 14% 22%, 78% 74%, 0 0, 0% 50%, 0% 50%;
  background-blend-mode: screen, screen, normal, overlay, normal;
  filter: saturate(1.22) contrast(1.08) brightness(0.92);
  transform: translate3d(0, 0, 0) scale(1.03);
  animation: ad-ext-hit-gradient-flow 9s linear infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}::after {
  z-index: 6;
  opacity: var(--ad-ext-hit-border-opacity);
  border: 1px solid color-mix(in srgb, var(--ad-ext-hit-edge) 72%, white 28%);
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0) 28%, rgba(255, 255, 255, 0) 72%, rgba(255, 255, 255, 0.09));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.06),
    inset 0 0 24px rgba(255, 255, 255, 0.03),
    0 0 var(--ad-ext-hit-shadow-size) var(--ad-ext-hit-glow),
    0 0 0 1px color-mix(in srgb, var(--ad-ext-hit-edge) 82%, white 18%);
  animation: ad-ext-hit-border-sweep 5.2s linear infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} .${HIT_SCORE_CLASS},
.ad-ext-turn-throw.${HIT_BASE_CLASS} .${HIT_SEGMENT_CLASS} {
  position: relative;
  z-index: 9;
  display: inline-block;
  transform-origin: center center;
  will-change: transform, filter, letter-spacing, text-shadow, opacity;
  text-align: center !important;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} .${HIT_SCORE_CLASS} {
  color: var(--ad-ext-hit-text-main) !important;
  font-weight: 900;
  text-shadow:
    0 2px 0 rgba(0, 0, 0, 0.3),
    0 0 14px rgba(0, 0, 0, 0.6),
    0 0 24px var(--ad-ext-hit-soft-glow),
    0 0 42px var(--ad-ext-hit-glow);
  -webkit-text-stroke: 0.45px rgba(0, 0, 0, 0.38);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} .${HIT_SEGMENT_CLASS} {
  color: var(--ad-ext-hit-text-sub) !important;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  text-shadow:
    0 0 10px rgba(0, 0, 0, 0.54),
    0 0 16px var(--ad-ext-hit-soft-glow);
  -webkit-text-stroke: 0.35px rgba(0, 0, 0, 0.3);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_KIND_CLASS.triple} {
  --ad-ext-hit-gradient-opacity: 0.96;
  --ad-ext-hit-border-opacity: 1;
  --ad-ext-hit-shadow-size: 46px;
  filter: saturate(1.14);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_KIND_CLASS.double} {
  --ad-ext-hit-gradient-opacity: 0.9;
  --ad-ext-hit-border-opacity: 0.97;
  --ad-ext-hit-shadow-size: 38px;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_KIND_CLASS.bullOuter} {
  --ad-ext-hit-gradient-opacity: 0.74;
  --ad-ext-hit-border-opacity: 0.84;
  --ad-ext-hit-shadow-size: 26px;
  --ad-ext-hit-img-opacity: 0.11;
  filter: saturate(0.98);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_KIND_CLASS.bullInner} {
  --ad-ext-hit-gradient-opacity: 1;
  --ad-ext-hit-border-opacity: 1;
  --ad-ext-hit-shadow-size: 52px;
  --ad-ext-hit-img-opacity: 0.19;
  --ad-ext-hit-soft-glow: color-mix(in srgb, var(--ad-ext-hit-glow) 70%, white 30%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    inset 0 -12px 30px rgba(0, 0, 0, 0.34),
    0 18px 34px rgba(0, 0, 0, 0.46),
    0 0 30px color-mix(in srgb, var(--ad-ext-hit-glow) 58%, white 42%);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["ember-rush"]} {
  --ad-ext-hit-theme-a: #4e0f19;
  --ad-ext-hit-theme-b: #8f1e2a;
  --ad-ext-hit-theme-c: #c94d1f;
  --ad-ext-hit-theme-d: #f5a53f;
  --ad-ext-hit-edge: rgba(255, 156, 77, 0.94);
  --ad-ext-hit-glow: rgba(255, 123, 59, 0.66);
  --ad-ext-hit-soft-glow: rgba(255, 123, 59, 0.3);
  --ad-ext-hit-surface-a: rgba(10, 8, 14, 0.98);
  --ad-ext-hit-surface-b: rgba(20, 11, 15, 0.96);
  --ad-ext-hit-surface-c: rgba(9, 7, 10, 0.99);
  --ad-ext-hit-stripe-alpha: 0.05;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["ice-circuit"]} {
  --ad-ext-hit-theme-a: #0f2948;
  --ad-ext-hit-theme-b: #0f4c73;
  --ad-ext-hit-theme-c: #1487b6;
  --ad-ext-hit-theme-d: #45d6ff;
  --ad-ext-hit-edge: rgba(107, 214, 255, 0.94);
  --ad-ext-hit-glow: rgba(89, 189, 255, 0.64);
  --ad-ext-hit-soft-glow: rgba(89, 189, 255, 0.28);
  --ad-ext-hit-surface-a: rgba(5, 11, 22, 0.98);
  --ad-ext-hit-surface-b: rgba(8, 17, 30, 0.96);
  --ad-ext-hit-surface-c: rgba(4, 9, 19, 0.99);
  --ad-ext-hit-stripe-alpha: 0.02;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["volt-lime"]} {
  --ad-ext-hit-theme-a: #1a3410;
  --ad-ext-hit-theme-b: #2f5f13;
  --ad-ext-hit-theme-c: #57a61d;
  --ad-ext-hit-theme-d: #b3f249;
  --ad-ext-hit-edge: rgba(186, 255, 83, 0.95);
  --ad-ext-hit-glow: rgba(150, 255, 79, 0.67);
  --ad-ext-hit-soft-glow: rgba(150, 255, 79, 0.3);
  --ad-ext-hit-surface-a: rgba(8, 12, 12, 0.98);
  --ad-ext-hit-surface-b: rgba(11, 19, 12, 0.96);
  --ad-ext-hit-surface-c: rgba(6, 11, 8, 0.99);
  --ad-ext-hit-stripe-alpha: 0.03;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["crimson-steel"]} {
  --ad-ext-hit-theme-a: #3d1028;
  --ad-ext-hit-theme-b: #661436;
  --ad-ext-hit-theme-c: #8e2a4f;
  --ad-ext-hit-theme-d: #7796bd;
  --ad-ext-hit-edge: rgba(255, 126, 166, 0.92);
  --ad-ext-hit-glow: rgba(244, 90, 145, 0.64);
  --ad-ext-hit-soft-glow: rgba(244, 90, 145, 0.3);
  --ad-ext-hit-surface-a: rgba(9, 10, 18, 0.98);
  --ad-ext-hit-surface-b: rgba(16, 13, 24, 0.96);
  --ad-ext-hit-surface-c: rgba(8, 9, 16, 0.99);
  --ad-ext-hit-stripe-alpha: 0.07;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["arctic-mint"]} {
  --ad-ext-hit-theme-a: #103241;
  --ad-ext-hit-theme-b: #145266;
  --ad-ext-hit-theme-c: #1e9387;
  --ad-ext-hit-theme-d: #65f3d3;
  --ad-ext-hit-edge: rgba(143, 252, 235, 0.93);
  --ad-ext-hit-glow: rgba(102, 246, 218, 0.62);
  --ad-ext-hit-soft-glow: rgba(102, 246, 218, 0.26);
  --ad-ext-hit-surface-a: rgba(6, 13, 20, 0.98);
  --ad-ext-hit-surface-b: rgba(10, 18, 28, 0.96);
  --ad-ext-hit-surface-c: rgba(5, 11, 18, 0.99);
  --ad-ext-hit-stripe-alpha: 0.02;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["champagne-night"]} {
  --ad-ext-hit-theme-a: #2e2512;
  --ad-ext-hit-theme-b: #5f4a1a;
  --ad-ext-hit-theme-c: #9a7a2e;
  --ad-ext-hit-theme-d: #f1d788;
  --ad-ext-hit-edge: rgba(255, 212, 130, 0.94);
  --ad-ext-hit-glow: rgba(255, 196, 99, 0.64);
  --ad-ext-hit-soft-glow: rgba(255, 196, 99, 0.28);
  --ad-ext-hit-surface-a: rgba(8, 10, 16, 0.98);
  --ad-ext-hit-surface-b: rgba(13, 14, 22, 0.96);
  --ad-ext-hit-surface-c: rgba(7, 8, 14, 0.99);
  --ad-ext-hit-stripe-alpha: 0.015;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation: ad-ext-hit-row-impact-pop 780ms cubic-bezier(0.14, 0.92, 0.24, 1);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_TRIGGER_CLASS}::before {
  animation: ad-ext-hit-gradient-flow 9s linear infinite, ad-ext-hit-burst-surface 900ms cubic-bezier(0.12, 0.9, 0.2, 1);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_TRIGGER_CLASS}::after {
  animation: ad-ext-hit-border-sweep 5.2s linear infinite, ad-ext-hit-burst-border 860ms ease-out;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_TRIGGER_CLASS} .${HIT_SCORE_CLASS} {
  animation: ad-ext-hit-score-burst 760ms cubic-bezier(0.14, 0.92, 0.24, 1);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_TRIGGER_CLASS} .${HIT_SEGMENT_CLASS} {
  animation: ad-ext-hit-segment-burst 620ms ease-out;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["impact-pop"]}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation-name: ad-ext-hit-row-impact-pop;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS.shockwave}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation-name: ad-ext-hit-row-shockwave;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["sweep-shine"]}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation-name: ad-ext-hit-row-sweep-shine;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["neon-pulse"]}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation-name: ad-ext-hit-row-neon-pulse;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["snap-bounce"]}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation-name: ad-ext-hit-row-snap-bounce;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["card-slam"]}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation-name: ad-ext-hit-row-card-slam;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["signal-blink"]}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation-name: ad-ext-hit-row-signal-blink;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["signal-blink"]}.${HIT_ANIMATION_TRIGGER_CLASS} .${HIT_SCORE_CLASS} {
  animation: ad-ext-hit-score-burst 760ms cubic-bezier(0.14, 0.92, 0.24, 1), ad-ext-hit-score-glitch 760ms linear;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["stagger-wave"]}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation-name: ad-ext-hit-row-stagger-wave;
  animation-delay: var(--ad-ext-hit-delay-ms);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["flip-edge"]}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation-name: ad-ext-hit-row-flip-edge;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["outline-trace"]}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation-name: ad-ext-hit-row-outline-trace;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["charge-release"]}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation-name: ad-ext-hit-row-charge-release;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["alternate-flick"]}.${HIT_ANIMATION_TRIGGER_CLASS} {
  animation-name: ad-ext-hit-row-alternate-flick;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["neon-pulse"]} {
  animation: ad-ext-hit-idle-row-neon 2100ms ease-in-out infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["neon-pulse"]}::before {
  animation: ad-ext-hit-gradient-flow 7.4s linear infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["outline-trace"]} {
  animation: ad-ext-hit-idle-row-outline 2500ms ease-in-out infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["outline-trace"]}::after {
  animation: ad-ext-hit-border-sweep 2.8s linear infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["charge-release"]} {
  animation: ad-ext-hit-idle-row-charge 2050ms cubic-bezier(0.32, 0.04, 0.18, 0.98) infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["charge-release"]} .${HIT_SCORE_CLASS} {
  animation: ad-ext-hit-idle-score-charge 1850ms ease-in-out infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["alternate-flick"]} {
  animation: ad-ext-hit-idle-row-beacon 1600ms steps(1, end) infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["alternate-flick"]}::before {
  animation: ad-ext-hit-gradient-flow 11s linear infinite, ad-ext-hit-idle-surface-beacon 1600ms steps(1, end) infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["alternate-flick"]} .${HIT_SEGMENT_CLASS} {
  animation: ad-ext-hit-idle-segment-beacon 1300ms steps(1, end) infinite;
}

@keyframes ad-ext-hit-gradient-flow {
  0% { background-position: 14% 22%, 78% 74%, 0 0, 0% 50%, 0% 50%; }
  50% { background-position: 24% 28%, 74% 68%, 120px -38px, 100% 50%, 100% 50%; }
  100% { background-position: 14% 22%, 78% 74%, 240px -76px, 0% 50%, 0% 50%; }
}

@keyframes ad-ext-hit-border-sweep {
  0% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 0 22px rgba(255,255,255,0.03), 0 0 22px var(--ad-ext-hit-soft-glow), 0 0 0 1px color-mix(in srgb, var(--ad-ext-hit-edge) 70%, white 30%); }
  50% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.16), inset 0 0 30px rgba(255,255,255,0.05), 0 0 48px var(--ad-ext-hit-glow), 0 0 0 1px color-mix(in srgb, var(--ad-ext-hit-edge) 88%, white 12%); }
  100% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 0 22px rgba(255,255,255,0.03), 0 0 22px var(--ad-ext-hit-soft-glow), 0 0 0 1px color-mix(in srgb, var(--ad-ext-hit-edge) 70%, white 30%); }
}

@keyframes ad-ext-hit-burst-surface {
  0% { opacity: 0.48; filter: saturate(0.9) brightness(0.75); }
  34% { opacity: 1; filter: saturate(1.42) brightness(1.12); }
  100% { opacity: var(--ad-ext-hit-gradient-opacity); filter: saturate(1.22) brightness(0.92); }
}

@keyframes ad-ext-hit-burst-border {
  0% { opacity: 0.36; }
  34% { opacity: 1; }
  100% { opacity: var(--ad-ext-hit-border-opacity); }
}

@keyframes ad-ext-hit-score-burst {
  0% { transform: translateY(0) scale(1); letter-spacing: 0.01em; }
  28% { transform: translateY(-5px) scale(1.24); letter-spacing: 0.08em; }
  56% { transform: translateY(2px) scale(0.97); letter-spacing: 0.02em; }
  100% { transform: translateY(0) scale(1); letter-spacing: 0.01em; }
}

@keyframes ad-ext-hit-segment-burst {
  0% { opacity: 0.72; letter-spacing: 0.1em; transform: translateY(0); }
  40% { opacity: 1; letter-spacing: 0.2em; transform: translateY(-2px); }
  100% { opacity: 1; letter-spacing: 0.11em; transform: translateY(0); }
}

@keyframes ad-ext-hit-score-glitch {
  0%, 100% { transform: translateX(0) scale(1); }
  18% { transform: translateX(3px) scale(1.16); }
  32% { transform: translateX(-4px) scale(0.98); }
  48% { transform: translateX(5px) scale(1.08); }
  64% { transform: translateX(-2px) scale(1.02); }
}

@keyframes ad-ext-hit-row-impact-pop {
  0% { transform: translateY(3px) scale(0.95) rotateZ(-0.6deg); }
  34% { transform: translateY(-9px) scale(1.11) rotateZ(0.9deg); }
  68% { transform: translateY(2px) scale(1.02) rotateZ(-0.2deg); }
  100% { transform: translateY(0) scale(1) rotateZ(0deg); }
}

@keyframes ad-ext-hit-row-shockwave {
  0% { transform: scale(0.94) rotateX(0deg); }
  32% { transform: scale(1.12) rotateX(6deg); }
  58% { transform: scale(1.01) rotateX(-2deg); }
  100% { transform: scale(1) rotateX(0deg); }
}

@keyframes ad-ext-hit-row-sweep-shine {
  0% { transform: translateX(-18px) skewX(-5deg) rotateY(-10deg); }
  46% { transform: translateX(14px) skewX(3deg) rotateY(12deg); }
  100% { transform: translateX(0) skewX(0deg) rotateY(0deg); }
}

@keyframes ad-ext-hit-row-neon-pulse {
  0% { transform: scale(0.96) rotateZ(-0.3deg); }
  40% { transform: scale(1.1) rotateZ(0.8deg); }
  70% { transform: scale(1.02) rotateZ(-0.15deg); }
  100% { transform: scale(1) rotateZ(0deg); }
}

@keyframes ad-ext-hit-row-snap-bounce {
  0% { transform: translateY(0) scale(1) rotateZ(0deg); }
  22% { transform: translateY(-16px) scale(1.09) rotateZ(-1.6deg); }
  48% { transform: translateY(7px) scale(0.97) rotateZ(1deg); }
  100% { transform: translateY(0) scale(1) rotateZ(0deg); }
}

@keyframes ad-ext-hit-row-card-slam {
  0% { transform: perspective(1200px) rotateX(0deg) translateY(0) scale(1); }
  35% { transform: perspective(1200px) rotateX(-360deg) translateY(-10px) scale(1.08); }
  64% { transform: perspective(1200px) rotateX(-150deg) translateY(8px) scale(0.97); }
  100% { transform: perspective(1200px) rotateX(0deg) translateY(0) scale(1); }
}

@keyframes ad-ext-hit-row-signal-blink {
  0%, 100% { transform: translateX(0); opacity: 1; }
  14% { transform: translateX(-6px); opacity: 0.74; }
  26% { transform: translateX(7px); opacity: 1; }
  48% { transform: translateX(-4px); opacity: 0.82; }
  66% { transform: translateX(5px); opacity: 1; }
}

@keyframes ad-ext-hit-row-stagger-wave {
  0% { transform: translateX(-15px) rotateZ(-1deg) scale(1.02); }
  38% { transform: translateX(10px) rotateZ(0.8deg) scale(1.05); }
  100% { transform: translateX(0) rotateZ(0deg) scale(1); }
}

@keyframes ad-ext-hit-row-flip-edge {
  0% { transform: perspective(1200px) rotateY(0deg) translateZ(0); }
  38% { transform: perspective(1200px) rotateY(360deg) translateZ(6px); }
  70% { transform: perspective(1200px) rotateY(-30deg) translateZ(0); }
  100% { transform: perspective(1200px) rotateY(0deg) translateZ(0); }
}

@keyframes ad-ext-hit-row-outline-trace {
  0% { transform: scale(1) rotateZ(0deg); }
  34% { transform: scale(1.06) rotateZ(-0.7deg); }
  68% { transform: scale(0.99) rotateZ(0.4deg); }
  100% { transform: scale(1) rotateZ(0deg); }
}

@keyframes ad-ext-hit-row-charge-release {
  0% { transform: scale(0.93) translateY(12px); }
  42% { transform: scale(1.12) translateY(-12px); }
  70% { transform: scale(1.02) translateY(2px); }
  100% { transform: scale(1) translateY(0); }
}

@keyframes ad-ext-hit-row-alternate-flick {
  0%, 100% { transform: translateX(0) rotateZ(0deg); opacity: 1; }
  18% { transform: translateX(-9px) rotateZ(-1.2deg); opacity: 0.72; }
  36% { transform: translateX(11px) rotateZ(1deg); opacity: 1; }
  60% { transform: translateX(-6px) rotateZ(-0.7deg); opacity: 0.86; }
  78% { transform: translateX(4px) rotateZ(0.5deg); opacity: 1; }
}

@keyframes ad-ext-hit-idle-row-neon {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

@keyframes ad-ext-hit-idle-row-outline {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.013); }
}

@keyframes ad-ext-hit-idle-row-charge {
  0%, 100% { transform: scale(1) translateY(0); }
  46% { transform: scale(1.03) translateY(-1px); }
}

@keyframes ad-ext-hit-idle-row-beacon {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.82; }
}

@keyframes ad-ext-hit-idle-score-charge {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-2px) scale(1.04); }
}

@keyframes ad-ext-hit-idle-surface-beacon {
  0%, 100% { filter: saturate(1.18) brightness(0.94); }
  50% { filter: saturate(0.98) brightness(0.82); }
}

@keyframes ad-ext-hit-idle-segment-beacon {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.72; }
}

@media (prefers-reduced-motion: reduce) {
  .ad-ext-turn-throw.${HIT_BASE_CLASS},
  .ad-ext-turn-throw.${HIT_BASE_CLASS}::before,
  .ad-ext-turn-throw.${HIT_BASE_CLASS}::after,
  .ad-ext-turn-throw.${HIT_BASE_CLASS} .${HIT_SCORE_CLASS},
  .ad-ext-turn-throw.${HIT_BASE_CLASS} .${HIT_SEGMENT_CLASS} {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
}
`;
}
