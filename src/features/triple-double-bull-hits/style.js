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
  --ad-ext-hit-theme-a: rgba(154, 255, 77, 0.96);
  --ad-ext-hit-theme-b: rgba(104, 247, 34, 0.92);
  --ad-ext-hit-theme-c: rgba(31, 207, 122, 0.88);
  --ad-ext-hit-theme-d: rgba(223, 255, 125, 0.82);
  --ad-ext-hit-border: rgba(191, 255, 92, 0.98);
  --ad-ext-hit-glow: rgba(163, 255, 90, 0.7);
  --ad-ext-hit-soft-glow: rgba(163, 255, 90, 0.34);
  --ad-ext-hit-text-main: #fbfff4;
  --ad-ext-hit-text-sub: rgba(239, 255, 214, 0.94);
  --ad-ext-hit-surface-a: rgba(3, 5, 12, 0.98);
  --ad-ext-hit-surface-b: rgba(8, 11, 19, 0.96);
  --ad-ext-hit-surface-c: rgba(13, 19, 30, 0.94);
  --ad-ext-hit-bg-opacity: 0.96;
  --ad-ext-hit-ring-opacity: 0.96;
  --ad-ext-hit-shadow-spread: 34px;
  --ad-ext-hit-delay-ms: 0ms;
  --ad-ext-hit-pattern-a: repeating-linear-gradient(132deg, rgba(255, 255, 255, 0.0) 0 14px, rgba(255, 255, 255, 0.12) 14px 18px, rgba(0, 0, 0, 0.0) 18px 34px);
  --ad-ext-hit-pattern-b: linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 35%, rgba(0, 0, 0, 0.22) 100%);
  --ad-ext-hit-pattern-size-a: 180px 180px;
  --ad-ext-hit-pattern-size-b: 100% 100%;
  --ad-ext-hit-pattern-shift-a: 0px 0px;
  --ad-ext-hit-pattern-shift-b: 0px 0px;
  --ad-ext-hit-img-opacity: 0.12;
  --ad-ext-hit-img-filter: grayscale(1) brightness(0.22) contrast(1.55);
  position: relative;
  overflow: hidden;
  isolation: isolate;
  border-radius: 14px;
  background:
    linear-gradient(160deg, var(--ad-ext-hit-surface-a) 0%, var(--ad-ext-hit-surface-b) 50%, var(--ad-ext-hit-surface-c) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 14px 34px rgba(0, 0, 0, 0.42),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    inset 0 18px 38px rgba(255, 255, 255, 0.015),
    0 0 0 1px rgba(0, 0, 0, 0.24);
  transform-origin: center center;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  will-change: transform, box-shadow, filter;
  transition:
    box-shadow 160ms ease-out,
    border-color 160ms ease-out,
    filter 160ms ease-out,
    opacity 160ms ease-out;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} > * {
  position: relative;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} img {
  z-index: 1 !important;
  opacity: var(--ad-ext-hit-img-opacity) !important;
  filter: var(--ad-ext-hit-img-filter) !important;
  transform: scale(1.03);
  transition: opacity 160ms ease-out, filter 160ms ease-out, transform 160ms ease-out;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} p,
.ad-ext-turn-throw.${HIT_BASE_CLASS} .chakra-text,
.ad-ext-turn-throw.${HIT_BASE_CLASS} div:not(.${HIT_SCORE_CLASS}):not(.${HIT_SEGMENT_CLASS}) {
  z-index: 4;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}::before,
.ad-ext-turn-throw.${HIT_BASE_CLASS}::after {
  content: "";
  position: absolute;
  pointer-events: none;
  border-radius: inherit;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}::before {
  inset: -8%;
  z-index: 2;
  background-image:
    radial-gradient(circle at 12% 18%, rgba(255, 255, 255, 0.18), transparent 22%),
    var(--ad-ext-hit-pattern-a),
    var(--ad-ext-hit-pattern-b),
    linear-gradient(118deg, var(--ad-ext-hit-theme-a) 0%, var(--ad-ext-hit-theme-b) 26%, var(--ad-ext-hit-theme-c) 62%, var(--ad-ext-hit-theme-d) 100%);
  background-size:
    100% 100%,
    var(--ad-ext-hit-pattern-size-a),
    var(--ad-ext-hit-pattern-size-b),
    240% 240%;
  background-position:
    center center,
    var(--ad-ext-hit-pattern-shift-a),
    var(--ad-ext-hit-pattern-shift-b),
    0% 50%;
  background-blend-mode: screen, normal, overlay, normal;
  opacity: var(--ad-ext-hit-bg-opacity);
  filter: saturate(1.24) contrast(1.1) brightness(1.04);
  transform: scale(1.05) translate3d(0, 0, 0);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}::after {
  inset: 0;
  z-index: 3;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background:
    linear-gradient(115deg, rgba(255, 255, 255, 0.06), transparent 20%, transparent 74%, rgba(255, 255, 255, 0.08));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 0 28px rgba(255, 255, 255, 0.025),
    0 0 var(--ad-ext-hit-shadow-spread) var(--ad-ext-hit-glow),
    0 0 0 1px var(--ad-ext-hit-border);
  opacity: var(--ad-ext-hit-ring-opacity);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} .${HIT_SCORE_CLASS},
.ad-ext-turn-throw.${HIT_BASE_CLASS} .${HIT_SEGMENT_CLASS} {
  position: relative;
  display: inline-block;
  z-index: 5;
  will-change: transform, opacity, filter, letter-spacing;
  transform-origin: center center;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} .${HIT_SCORE_CLASS} {
  color: var(--ad-ext-hit-text-main) !important;
  -webkit-text-stroke: 0.55px rgba(0, 0, 0, 0.32);
  text-shadow:
    0 2px 0 rgba(0, 0, 0, 0.22),
    0 0 12px rgba(0, 0, 0, 0.58),
    0 0 26px var(--ad-ext-hit-soft-glow),
    0 0 44px var(--ad-ext-hit-glow);
  filter: saturate(1.15) brightness(1.05);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} .${HIT_SEGMENT_CLASS} {
  color: var(--ad-ext-hit-text-sub) !important;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  -webkit-text-stroke: 0.35px rgba(0, 0, 0, 0.24);
  text-shadow:
    0 0 10px rgba(0, 0, 0, 0.46),
    0 0 18px var(--ad-ext-hit-soft-glow);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_KIND_CLASS.triple} {
  --ad-ext-hit-bg-opacity: 0.99;
  --ad-ext-hit-ring-opacity: 1;
  --ad-ext-hit-shadow-spread: 42px;
  border-color: rgba(255, 211, 106, 0.72);
  filter: saturate(1.12);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_KIND_CLASS.double} {
  --ad-ext-hit-bg-opacity: 0.94;
  --ad-ext-hit-ring-opacity: 0.98;
  --ad-ext-hit-shadow-spread: 36px;
  border-color: rgba(154, 227, 255, 0.7);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_KIND_CLASS.bullOuter} {
  --ad-ext-hit-bg-opacity: 0.82;
  --ad-ext-hit-ring-opacity: 0.86;
  --ad-ext-hit-shadow-spread: 26px;
  --ad-ext-hit-img-opacity: 0.1;
  filter: saturate(0.96);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_KIND_CLASS.bullInner} {
  --ad-ext-hit-bg-opacity: 1;
  --ad-ext-hit-ring-opacity: 1.04;
  --ad-ext-hit-shadow-spread: 48px;
  --ad-ext-hit-img-opacity: 0.16;
  border-color: rgba(255, 243, 180, 0.88);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.44),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    inset 0 24px 46px rgba(255, 255, 255, 0.03),
    0 0 24px rgba(255, 243, 180, 0.16);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["ember-rush"]} {
  --ad-ext-hit-theme-a: rgba(255, 116, 54, 0.98);
  --ad-ext-hit-theme-b: rgba(255, 56, 83, 0.94);
  --ad-ext-hit-theme-c: rgba(255, 92, 38, 0.92);
  --ad-ext-hit-theme-d: rgba(255, 211, 104, 0.86);
  --ad-ext-hit-border: rgba(255, 196, 98, 0.98);
  --ad-ext-hit-glow: rgba(255, 112, 56, 0.74);
  --ad-ext-hit-soft-glow: rgba(255, 112, 56, 0.34);
  --ad-ext-hit-text-main: #fff7ef;
  --ad-ext-hit-text-sub: rgba(255, 227, 201, 0.94);
  --ad-ext-hit-pattern-a: repeating-linear-gradient(130deg, rgba(255, 223, 151, 0.12) 0 10px, rgba(255, 84, 84, 0.28) 10px 18px, rgba(0, 0, 0, 0) 18px 34px);
  --ad-ext-hit-pattern-b: linear-gradient(90deg, rgba(255, 255, 255, 0.07), transparent 24%, rgba(0, 0, 0, 0.2) 100%);
  --ad-ext-hit-pattern-size-a: 170px 170px;
  --ad-ext-hit-img-filter: grayscale(1) brightness(0.26) contrast(1.55) sepia(0.18);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["ice-circuit"]} {
  --ad-ext-hit-theme-a: rgba(58, 225, 255, 0.96);
  --ad-ext-hit-theme-b: rgba(68, 182, 255, 0.94);
  --ad-ext-hit-theme-c: rgba(97, 114, 255, 0.9);
  --ad-ext-hit-theme-d: rgba(214, 244, 255, 0.86);
  --ad-ext-hit-border: rgba(150, 230, 255, 0.98);
  --ad-ext-hit-glow: rgba(88, 202, 255, 0.72);
  --ad-ext-hit-soft-glow: rgba(88, 202, 255, 0.28);
  --ad-ext-hit-text-main: #eefaff;
  --ad-ext-hit-text-sub: rgba(219, 245, 255, 0.92);
  --ad-ext-hit-pattern-a: repeating-linear-gradient(0deg, rgba(181, 247, 255, 0.16) 0 2px, rgba(0, 0, 0, 0) 2px 16px);
  --ad-ext-hit-pattern-b: repeating-linear-gradient(90deg, rgba(156, 223, 255, 0.14) 0 2px, rgba(0, 0, 0, 0) 2px 26px);
  --ad-ext-hit-pattern-size-a: 100% 100%;
  --ad-ext-hit-pattern-size-b: 100% 100%;
  --ad-ext-hit-img-filter: grayscale(1) brightness(0.18) contrast(1.65) sepia(0.1);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["volt-lime"]} {
  --ad-ext-hit-theme-a: rgba(196, 255, 66, 0.98);
  --ad-ext-hit-theme-b: rgba(116, 255, 42, 0.94);
  --ad-ext-hit-theme-c: rgba(42, 225, 120, 0.9);
  --ad-ext-hit-theme-d: rgba(247, 255, 173, 0.86);
  --ad-ext-hit-border: rgba(219, 255, 88, 0.99);
  --ad-ext-hit-glow: rgba(174, 255, 70, 0.76);
  --ad-ext-hit-soft-glow: rgba(174, 255, 70, 0.32);
  --ad-ext-hit-text-main: #fbfff5;
  --ad-ext-hit-text-sub: rgba(244, 255, 214, 0.94);
  --ad-ext-hit-pattern-a: repeating-linear-gradient(135deg, rgba(8, 11, 13, 0.46) 0 13px, rgba(210, 255, 76, 0.26) 13px 24px, rgba(0, 0, 0, 0) 24px 38px);
  --ad-ext-hit-pattern-b: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.06) 0 1px, rgba(0, 0, 0, 0) 1px 16px);
  --ad-ext-hit-pattern-size-a: 180px 180px;
  --ad-ext-hit-pattern-size-b: 100% 100%;
  --ad-ext-hit-img-filter: grayscale(1) brightness(0.16) contrast(1.8);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["crimson-steel"]} {
  --ad-ext-hit-theme-a: rgba(255, 84, 98, 0.96);
  --ad-ext-hit-theme-b: rgba(218, 37, 79, 0.94);
  --ad-ext-hit-theme-c: rgba(119, 138, 162, 0.84);
  --ad-ext-hit-theme-d: rgba(255, 183, 114, 0.82);
  --ad-ext-hit-border: rgba(255, 136, 136, 0.96);
  --ad-ext-hit-glow: rgba(241, 83, 93, 0.72);
  --ad-ext-hit-soft-glow: rgba(241, 83, 93, 0.3);
  --ad-ext-hit-text-main: #fff3f4;
  --ad-ext-hit-text-sub: rgba(255, 219, 223, 0.92);
  --ad-ext-hit-pattern-a: repeating-linear-gradient(180deg, rgba(255, 136, 136, 0.12) 0 2px, rgba(0, 0, 0, 0) 2px 13px);
  --ad-ext-hit-pattern-b: linear-gradient(120deg, rgba(255, 255, 255, 0.08), transparent 24%, rgba(0, 0, 0, 0.22) 100%);
  --ad-ext-hit-pattern-size-a: 100% 100%;
  --ad-ext-hit-img-filter: grayscale(1) brightness(0.22) contrast(1.55) sepia(0.08);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["arctic-mint"]} {
  --ad-ext-hit-theme-a: rgba(112, 255, 224, 0.94);
  --ad-ext-hit-theme-b: rgba(60, 231, 214, 0.92);
  --ad-ext-hit-theme-c: rgba(83, 228, 255, 0.9);
  --ad-ext-hit-theme-d: rgba(222, 255, 244, 0.84);
  --ad-ext-hit-border: rgba(150, 255, 227, 0.96);
  --ad-ext-hit-glow: rgba(78, 243, 217, 0.66);
  --ad-ext-hit-soft-glow: rgba(78, 243, 217, 0.28);
  --ad-ext-hit-text-main: #f2fffb;
  --ad-ext-hit-text-sub: rgba(221, 255, 246, 0.92);
  --ad-ext-hit-pattern-a: repeating-linear-gradient(126deg, rgba(194, 255, 241, 0.14) 0 9px, rgba(0, 0, 0, 0) 9px 22px);
  --ad-ext-hit-pattern-b: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0 1px, rgba(0, 0, 0, 0) 1px 18px);
  --ad-ext-hit-pattern-size-a: 165px 165px;
  --ad-ext-hit-pattern-size-b: 100% 100%;
  --ad-ext-hit-img-filter: grayscale(1) brightness(0.2) contrast(1.6) sepia(0.08);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["champagne-night"]} {
  --ad-ext-hit-theme-a: rgba(255, 220, 126, 0.96);
  --ad-ext-hit-theme-b: rgba(255, 192, 92, 0.92);
  --ad-ext-hit-theme-c: rgba(255, 235, 184, 0.88);
  --ad-ext-hit-theme-d: rgba(255, 250, 233, 0.84);
  --ad-ext-hit-border: rgba(255, 225, 148, 0.98);
  --ad-ext-hit-glow: rgba(255, 199, 96, 0.7);
  --ad-ext-hit-soft-glow: rgba(255, 199, 96, 0.3);
  --ad-ext-hit-text-main: #fffdf8;
  --ad-ext-hit-text-sub: rgba(255, 243, 214, 0.94);
  --ad-ext-hit-pattern-a: repeating-linear-gradient(90deg, rgba(255, 239, 187, 0.16) 0 2px, rgba(0, 0, 0, 0) 2px 18px);
  --ad-ext-hit-pattern-b: repeating-linear-gradient(146deg, rgba(255, 213, 123, 0.1) 0 8px, rgba(0, 0, 0, 0) 8px 26px);
  --ad-ext-hit-pattern-size-a: 100% 100%;
  --ad-ext-hit-pattern-size-b: 200px 200px;
  --ad-ext-hit-img-opacity: 0.16;
  --ad-ext-hit-img-filter: grayscale(1) brightness(0.26) contrast(1.44) sepia(0.25);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["neon-pulse"]}::before {
  animation: ad-ext-hit-reactor-drift 1800ms linear infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["neon-pulse"]} .${HIT_SCORE_CLASS} {
  animation: ad-ext-hit-idle-score-pulse 1700ms ease-in-out infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["outline-trace"]}::after {
  animation: ad-ext-hit-edge-runner 1700ms linear infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["outline-trace"]} .${HIT_SEGMENT_CLASS} {
  animation: ad-ext-hit-idle-segment-scan 1900ms ease-in-out infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["charge-release"]}::before {
  animation: ad-ext-hit-charge-breathe 2100ms cubic-bezier(0.32, 0.04, 0.18, 0.98) infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["charge-release"]} .${HIT_SCORE_CLASS} {
  animation: ad-ext-hit-idle-score-charge 1850ms ease-in-out infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["alternate-flick"]}::before {
  animation: ad-ext-hit-idle-beacon-surface 1600ms steps(1, end) infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["alternate-flick"]} .${HIT_SCORE_CLASS} {
  animation: ad-ext-hit-beacon-score 1300ms steps(1, end) infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["alternate-flick"]} .${HIT_SEGMENT_CLASS} {
  animation: ad-ext-hit-beacon-segment 1300ms steps(1, end) infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_TRIGGER_CLASS}::before {
  animation: ad-ext-hit-burst-gradient 720ms cubic-bezier(0.14, 0.92, 0.24, 1) both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_TRIGGER_CLASS}::after {
  animation: ad-ext-hit-burst-rim 700ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_TRIGGER_CLASS} .${HIT_SCORE_CLASS} {
  animation: ad-ext-hit-score-flare 620ms cubic-bezier(0.18, 0.92, 0.24, 1) both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_TRIGGER_CLASS} .${HIT_SEGMENT_CLASS} {
  animation: ad-ext-hit-segment-follow 520ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["impact-pop"]}.${HIT_ANIMATION_TRIGGER_CLASS}::after {
  animation: ad-ext-hit-burst-rim 700ms ease-out both, ad-ext-hit-impact-rim 520ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS.shockwave}.${HIT_ANIMATION_TRIGGER_CLASS}::after {
  animation: ad-ext-hit-burst-rim 700ms ease-out both, ad-ext-hit-shock-ring 760ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["sweep-shine"]}.${HIT_ANIMATION_TRIGGER_CLASS}::before {
  animation: ad-ext-hit-burst-gradient 720ms cubic-bezier(0.14, 0.92, 0.24, 1) both, ad-ext-hit-laser-sweep 760ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["neon-pulse"]}.${HIT_ANIMATION_TRIGGER_CLASS}::before {
  animation: ad-ext-hit-burst-gradient 720ms cubic-bezier(0.14, 0.92, 0.24, 1) both, ad-ext-hit-neon-burst 760ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["snap-bounce"]}.${HIT_ANIMATION_TRIGGER_CLASS}::after {
  animation: ad-ext-hit-burst-rim 700ms ease-out both, ad-ext-hit-bounce-rim 620ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["card-slam"]}.${HIT_ANIMATION_TRIGGER_CLASS}::before {
  animation: ad-ext-hit-burst-gradient 720ms cubic-bezier(0.14, 0.92, 0.24, 1) both, ad-ext-hit-slam-flash 620ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["signal-blink"]}.${HIT_ANIMATION_TRIGGER_CLASS} .${HIT_SCORE_CLASS} {
  animation: ad-ext-hit-score-flare 620ms cubic-bezier(0.18, 0.92, 0.24, 1) both, ad-ext-hit-signal-score 620ms linear both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["stagger-wave"]}.${HIT_ANIMATION_TRIGGER_CLASS}::after {
  animation: ad-ext-hit-burst-rim 700ms ease-out both, ad-ext-hit-stagger-rim 720ms ease-out var(--ad-ext-hit-delay-ms) both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["flip-edge"]}.${HIT_ANIMATION_TRIGGER_CLASS}::after {
  animation: ad-ext-hit-burst-rim 700ms ease-out both, ad-ext-hit-flip-rim 780ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["outline-trace"]}.${HIT_ANIMATION_TRIGGER_CLASS}::after {
  animation: ad-ext-hit-burst-rim 700ms ease-out both, ad-ext-hit-outline-burst 760ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["charge-release"]}.${HIT_ANIMATION_TRIGGER_CLASS}::before {
  animation: ad-ext-hit-burst-gradient 720ms cubic-bezier(0.14, 0.92, 0.24, 1) both, ad-ext-hit-charge-burst 840ms cubic-bezier(0.16, 0.92, 0.2, 1) both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["alternate-flick"]}.${HIT_ANIMATION_TRIGGER_CLASS}::before {
  animation: ad-ext-hit-burst-gradient 720ms cubic-bezier(0.14, 0.92, 0.24, 1) both, ad-ext-hit-flick-flash 720ms linear both;
}

@keyframes ad-ext-hit-burst-gradient {
  0% { opacity: 0.38; background-position: center center, var(--ad-ext-hit-pattern-shift-a), var(--ad-ext-hit-pattern-shift-b), 0% 50%; filter: saturate(0.98) brightness(0.92); }
  34% { opacity: 1; background-position: center center, 68px -18px, -16px 0px, 88% 50%; filter: saturate(1.48) brightness(1.24); }
  100% { opacity: var(--ad-ext-hit-bg-opacity); background-position: center center, 94px -24px, -24px 0px, 100% 50%; filter: saturate(1.18) brightness(1.04); }
}

@keyframes ad-ext-hit-burst-rim {
  0% { opacity: 0.36; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 0 rgba(0,0,0,0), 0 0 0 1px rgba(255,255,255,0.04); }
  34% { opacity: 1; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.22), 0 0 56px var(--ad-ext-hit-glow), 0 0 0 1px var(--ad-ext-hit-border); }
  100% { opacity: var(--ad-ext-hit-ring-opacity); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), 0 0 var(--ad-ext-hit-shadow-spread) var(--ad-ext-hit-glow), 0 0 0 1px var(--ad-ext-hit-border); }
}

@keyframes ad-ext-hit-score-flare {
  0% { filter: saturate(1) brightness(1); }
  26% { filter: saturate(1.34) brightness(1.3); }
  100% { filter: saturate(1.15) brightness(1.05); }
}

@keyframes ad-ext-hit-segment-follow {
  0% { opacity: 0.72; letter-spacing: 0.08em; }
  36% { opacity: 1; letter-spacing: 0.16em; }
  100% { opacity: 1; letter-spacing: 0.1em; }
}

@keyframes ad-ext-hit-reactor-drift {
  0% { background-position: center center, 0px 0px, 0px 0px, 0% 48%; filter: saturate(1.12) brightness(0.98); }
  50% { background-position: center center, 120px -40px, 18px 0px, 100% 52%; filter: saturate(1.34) brightness(1.12); }
  100% { background-position: center center, 240px -80px, 36px 0px, 0% 48%; filter: saturate(1.12) brightness(0.98); }
}

@keyframes ad-ext-hit-edge-runner {
  0% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), 0 0 18px var(--ad-ext-hit-soft-glow), 0 0 0 1px var(--ad-ext-hit-border); }
  35% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.14), 0 0 34px var(--ad-ext-hit-glow), 0 0 0 1px rgba(255,255,255,0.22); }
  100% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), 0 0 18px var(--ad-ext-hit-soft-glow), 0 0 0 1px var(--ad-ext-hit-border); }
}

@keyframes ad-ext-hit-charge-breathe {
  0% { opacity: var(--ad-ext-hit-bg-opacity); transform: scale(1.05); }
  42% { opacity: 1; transform: scale(1.11); }
  100% { opacity: var(--ad-ext-hit-bg-opacity); transform: scale(1.05); }
}

@keyframes ad-ext-hit-idle-score-pulse {
  0%, 100% { transform: scale(1); text-shadow: 0 2px 0 rgba(0,0,0,0.22), 0 0 12px rgba(0,0,0,0.58), 0 0 26px var(--ad-ext-hit-soft-glow), 0 0 44px var(--ad-ext-hit-glow); }
  50% { transform: scale(1.06); text-shadow: 0 2px 0 rgba(0,0,0,0.22), 0 0 16px rgba(0,0,0,0.58), 0 0 34px var(--ad-ext-hit-soft-glow), 0 0 56px var(--ad-ext-hit-glow); }
}

@keyframes ad-ext-hit-idle-score-charge {
  0%, 100% { transform: scale(1) translateY(0); }
  50% { transform: scale(1.04) translateY(-2px); }
}

@keyframes ad-ext-hit-idle-segment-scan {
  0%, 100% { letter-spacing: 0.1em; opacity: 0.94; }
  50% { letter-spacing: 0.16em; opacity: 1; }
}

@keyframes ad-ext-hit-idle-beacon-surface {
  0%, 100% { filter: saturate(1.18) brightness(1.02); }
  50% { filter: saturate(0.98) brightness(0.92); }
}

@keyframes ad-ext-hit-beacon-score {
  0%, 100% { text-shadow: 0 2px 0 rgba(0,0,0,0.22), 0 0 12px rgba(0,0,0,0.58), 0 0 26px var(--ad-ext-hit-soft-glow), 0 0 44px var(--ad-ext-hit-glow); }
  50% { text-shadow: 0 2px 0 rgba(0,0,0,0.22), 0 0 10px rgba(255,255,255,0.08), 0 0 12px var(--ad-ext-hit-soft-glow), 0 0 18px var(--ad-ext-hit-glow); }
}

@keyframes ad-ext-hit-beacon-segment {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes ad-ext-hit-impact-rim {
  0% { transform: scale(0.98); }
  40% { transform: scale(1.03); }
  100% { transform: scale(1); }
}

@keyframes ad-ext-hit-shock-ring {
  0% { opacity: 0.44; }
  40% { opacity: 1; box-shadow: inset 0 0 0 2px rgba(255,255,255,0.16), 0 0 64px var(--ad-ext-hit-glow), 0 0 0 1px var(--ad-ext-hit-border); }
  100% { opacity: var(--ad-ext-hit-ring-opacity); }
}

@keyframes ad-ext-hit-laser-sweep {
  0% { background-position: center center, -18px 0px, 0px 0px, 0% 50%; }
  55% { background-position: center center, 140px -32px, 0px 0px, 120% 50%; }
  100% { background-position: center center, 160px -38px, 0px 0px, 100% 50%; }
}

@keyframes ad-ext-hit-neon-burst {
  0% { filter: saturate(1.02) brightness(1); }
  40% { filter: saturate(1.62) brightness(1.34); }
  100% { filter: saturate(1.18) brightness(1.04); }
}

@keyframes ad-ext-hit-bounce-rim {
  0% { opacity: 0.56; }
  30% { opacity: 1; }
  60% { opacity: 0.72; }
  100% { opacity: var(--ad-ext-hit-ring-opacity); }
}

@keyframes ad-ext-hit-slam-flash {
  0% { filter: brightness(0.9); }
  30% { filter: brightness(1.42); }
  100% { filter: brightness(1.02); }
}

@keyframes ad-ext-hit-signal-score {
  0%, 100% { opacity: 1; }
  16% { opacity: 0.56; }
  34% { opacity: 1; }
  58% { opacity: 0.78; }
}

@keyframes ad-ext-hit-stagger-rim {
  0% { opacity: 0.44; }
  40% { opacity: 1; }
  100% { opacity: var(--ad-ext-hit-ring-opacity); }
}

@keyframes ad-ext-hit-flip-rim {
  0% { transform: perspective(900px) rotateY(0deg); }
  42% { transform: perspective(900px) rotateY(18deg); }
  100% { transform: perspective(900px) rotateY(0deg); }
}

@keyframes ad-ext-hit-outline-burst {
  0% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 12px rgba(255,255,255,0.02), 0 0 0 1px var(--ad-ext-hit-border); }
  34% { box-shadow: inset 0 0 0 2px rgba(255,255,255,0.22), 0 0 42px var(--ad-ext-hit-glow), 0 0 0 1px rgba(255,255,255,0.3); }
  100% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), 0 0 var(--ad-ext-hit-shadow-spread) var(--ad-ext-hit-glow), 0 0 0 1px var(--ad-ext-hit-border); }
}

@keyframes ad-ext-hit-charge-burst {
  0% { opacity: 0.28; transform: scale(1.03); }
  46% { opacity: 1; transform: scale(1.14); }
  100% { opacity: var(--ad-ext-hit-bg-opacity); transform: scale(1.05); }
}

@keyframes ad-ext-hit-flick-flash {
  0%, 100% { filter: saturate(1.12) brightness(1.02); }
  22% { filter: saturate(1.46) brightness(1.3); }
  44% { filter: saturate(0.98) brightness(0.94); }
  70% { filter: saturate(1.34) brightness(1.18); }
}

@media (prefers-reduced-motion: reduce) {
  .ad-ext-turn-throw.${HIT_BASE_CLASS},
  .ad-ext-turn-throw.${HIT_BASE_CLASS}::before,
  .ad-ext-turn-throw.${HIT_BASE_CLASS}::after,
  .ad-ext-turn-throw.${HIT_BASE_CLASS} .${HIT_SCORE_CLASS},
  .ad-ext-turn-throw.${HIT_BASE_CLASS} .${HIT_SEGMENT_CLASS} {
    animation: none !important;
    transition: none !important;
  }
}
`;
}
