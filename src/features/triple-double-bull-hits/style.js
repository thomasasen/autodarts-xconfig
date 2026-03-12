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
  --ad-ext-hit-theme-a: rgba(186, 255, 76, 0.78);
  --ad-ext-hit-theme-b: rgba(132, 255, 54, 0.74);
  --ad-ext-hit-theme-c: rgba(46, 217, 122, 0.72);
  --ad-ext-hit-theme-d: rgba(248, 255, 158, 0.62);
  --ad-ext-hit-border: rgba(186, 255, 76, 0.88);
  --ad-ext-hit-glow: rgba(166, 255, 83, 0.56);
  --ad-ext-hit-soft-glow: rgba(166, 255, 83, 0.28);
  --ad-ext-hit-text-main: #f8fff0;
  --ad-ext-hit-text-sub: rgba(242, 255, 223, 0.92);
  --ad-ext-hit-bg-opacity: 0.78;
  --ad-ext-hit-ring-opacity: 0.92;
  --ad-ext-hit-shadow-spread: 28px;
  --ad-ext-hit-delay-ms: 0ms;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  border-radius: 14px;
  background:
    linear-gradient(160deg, rgba(5, 8, 14, 0.96) 0%, rgba(11, 14, 23, 0.94) 48%, rgba(18, 24, 39, 0.88) 100%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 12px 34px rgba(0, 0, 0, 0.34),
    inset 0 0 0 1px rgba(255, 255, 255, 0.03),
    inset 0 18px 30px rgba(255, 255, 255, 0.02);
  transform-origin: center center;
  transform-style: preserve-3d;
  will-change: transform, box-shadow, filter;
  transition:
    box-shadow 180ms ease-out,
    border-color 180ms ease-out,
    filter 180ms ease-out;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} > * {
  position: relative;
  z-index: 3;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}::before,
.ad-ext-turn-throw.${HIT_BASE_CLASS}::after {
  content: "";
  position: absolute;
  pointer-events: none;
  border-radius: inherit;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}::before {
  inset: -18%;
  z-index: 0;
  background:
    radial-gradient(circle at 14% 22%, rgba(255, 255, 255, 0.18), transparent 24%),
    linear-gradient(118deg, var(--ad-ext-hit-theme-a) 0%, var(--ad-ext-hit-theme-b) 30%, var(--ad-ext-hit-theme-c) 62%, var(--ad-ext-hit-theme-d) 100%);
  background-size: 235% 235%;
  opacity: var(--ad-ext-hit-bg-opacity);
  filter: saturate(1.14) brightness(1);
  transform: scale(1.08) translate3d(0, 0, 0);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}::after {
  inset: 0;
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.05), transparent 34%, transparent 66%, rgba(255, 255, 255, 0.06));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 0 var(--ad-ext-hit-shadow-spread) var(--ad-ext-hit-glow),
    0 0 0 1px var(--ad-ext-hit-border);
  opacity: var(--ad-ext-hit-ring-opacity);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} p,
.ad-ext-turn-throw.${HIT_BASE_CLASS} .chakra-text,
.ad-ext-turn-throw.${HIT_BASE_CLASS} > div {
  color: var(--ad-ext-hit-text-main);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} .${HIT_SCORE_CLASS},
.ad-ext-turn-throw.${HIT_BASE_CLASS} .${HIT_SEGMENT_CLASS} {
  position: relative;
  display: inline-block;
  will-change: transform, opacity, filter, letter-spacing;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} .${HIT_SCORE_CLASS} {
  color: var(--ad-ext-hit-text-main) !important;
  text-shadow:
    0 0 14px rgba(0, 0, 0, 0.58),
    0 0 22px var(--ad-ext-hit-soft-glow),
    0 0 34px var(--ad-ext-hit-glow);
  filter: saturate(1.08) brightness(1.02);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS} .${HIT_SEGMENT_CLASS} {
  color: var(--ad-ext-hit-text-sub) !important;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-shadow:
    0 0 12px rgba(0, 0, 0, 0.48),
    0 0 14px var(--ad-ext-hit-soft-glow);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_KIND_CLASS.triple} {
  --ad-ext-hit-bg-opacity: 0.9;
  --ad-ext-hit-ring-opacity: 1;
  --ad-ext-hit-shadow-spread: 34px;
  border-color: rgba(255, 195, 93, 0.62);
  box-shadow:
    0 14px 38px rgba(0, 0, 0, 0.38),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    inset 0 20px 34px rgba(255, 255, 255, 0.03);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_KIND_CLASS.double} {
  --ad-ext-hit-bg-opacity: 0.84;
  --ad-ext-hit-ring-opacity: 0.96;
  --ad-ext-hit-shadow-spread: 30px;
  border-color: rgba(132, 219, 255, 0.62);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_KIND_CLASS.bullOuter} {
  --ad-ext-hit-bg-opacity: 0.64;
  --ad-ext-hit-ring-opacity: 0.8;
  --ad-ext-hit-shadow-spread: 22px;
  filter: saturate(0.96);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_KIND_CLASS.bullInner} {
  --ad-ext-hit-bg-opacity: 0.98;
  --ad-ext-hit-ring-opacity: 1.04;
  --ad-ext-hit-shadow-spread: 38px;
  border-color: rgba(255, 245, 179, 0.82);
  box-shadow:
    0 16px 42px rgba(0, 0, 0, 0.38),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    inset 0 20px 40px rgba(255, 255, 255, 0.05);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["ember-rush"]} {
  --ad-ext-hit-theme-a: rgba(255, 120, 58, 0.84);
  --ad-ext-hit-theme-b: rgba(255, 76, 76, 0.82);
  --ad-ext-hit-theme-c: rgba(255, 54, 137, 0.74);
  --ad-ext-hit-theme-d: rgba(255, 216, 102, 0.66);
  --ad-ext-hit-border: rgba(255, 191, 88, 0.92);
  --ad-ext-hit-glow: rgba(255, 109, 58, 0.56);
  --ad-ext-hit-soft-glow: rgba(255, 109, 58, 0.3);
  --ad-ext-hit-text-main: #fff6eb;
  --ad-ext-hit-text-sub: rgba(255, 234, 210, 0.92);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["ice-circuit"]} {
  --ad-ext-hit-theme-a: rgba(66, 211, 255, 0.82);
  --ad-ext-hit-theme-b: rgba(52, 170, 255, 0.78);
  --ad-ext-hit-theme-c: rgba(97, 126, 255, 0.72);
  --ad-ext-hit-theme-d: rgba(183, 237, 255, 0.58);
  --ad-ext-hit-border: rgba(132, 227, 255, 0.9);
  --ad-ext-hit-glow: rgba(84, 200, 255, 0.54);
  --ad-ext-hit-soft-glow: rgba(84, 200, 255, 0.26);
  --ad-ext-hit-text-main: #eefaff;
  --ad-ext-hit-text-sub: rgba(222, 244, 255, 0.9);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["volt-lime"]} {
  --ad-ext-hit-theme-a: rgba(186, 255, 76, 0.82);
  --ad-ext-hit-theme-b: rgba(132, 255, 54, 0.78);
  --ad-ext-hit-theme-c: rgba(46, 217, 122, 0.72);
  --ad-ext-hit-theme-d: rgba(248, 255, 158, 0.62);
  --ad-ext-hit-border: rgba(203, 255, 94, 0.94);
  --ad-ext-hit-glow: rgba(166, 255, 83, 0.56);
  --ad-ext-hit-soft-glow: rgba(166, 255, 83, 0.28);
  --ad-ext-hit-text-main: #f8fff0;
  --ad-ext-hit-text-sub: rgba(242, 255, 223, 0.92);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["crimson-steel"]} {
  --ad-ext-hit-theme-a: rgba(255, 92, 92, 0.84);
  --ad-ext-hit-theme-b: rgba(220, 39, 95, 0.8);
  --ad-ext-hit-theme-c: rgba(103, 136, 168, 0.68);
  --ad-ext-hit-theme-d: rgba(255, 181, 122, 0.58);
  --ad-ext-hit-border: rgba(255, 132, 132, 0.88);
  --ad-ext-hit-glow: rgba(238, 81, 93, 0.54);
  --ad-ext-hit-soft-glow: rgba(238, 81, 93, 0.28);
  --ad-ext-hit-text-main: #fff1f2;
  --ad-ext-hit-text-sub: rgba(255, 221, 228, 0.9);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["arctic-mint"]} {
  --ad-ext-hit-theme-a: rgba(107, 255, 222, 0.8);
  --ad-ext-hit-theme-b: rgba(59, 232, 216, 0.78);
  --ad-ext-hit-theme-c: rgba(71, 215, 255, 0.72);
  --ad-ext-hit-theme-d: rgba(214, 255, 247, 0.6);
  --ad-ext-hit-border: rgba(139, 255, 228, 0.88);
  --ad-ext-hit-glow: rgba(73, 242, 218, 0.5);
  --ad-ext-hit-soft-glow: rgba(73, 242, 218, 0.26);
  --ad-ext-hit-text-main: #effffb;
  --ad-ext-hit-text-sub: rgba(223, 255, 246, 0.9);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_THEME_CLASS["champagne-night"]} {
  --ad-ext-hit-theme-a: rgba(255, 215, 120, 0.82);
  --ad-ext-hit-theme-b: rgba(255, 191, 94, 0.76);
  --ad-ext-hit-theme-c: rgba(255, 238, 192, 0.72);
  --ad-ext-hit-theme-d: rgba(255, 247, 226, 0.6);
  --ad-ext-hit-border: rgba(255, 223, 148, 0.92);
  --ad-ext-hit-glow: rgba(255, 199, 96, 0.52);
  --ad-ext-hit-soft-glow: rgba(255, 199, 96, 0.24);
  --ad-ext-hit-text-main: #fffdf6;
  --ad-ext-hit-text-sub: rgba(255, 245, 218, 0.92);
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["neon-pulse"]}::before {
  animation: ad-ext-hit-reactor-drift 2600ms ease-in-out infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["outline-trace"]}::after {
  animation: ad-ext-hit-edge-runner 2200ms linear infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["charge-release"]}::before {
  animation: ad-ext-hit-charge-breathe 3000ms cubic-bezier(0.32, 0.04, 0.18, 0.98) infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["alternate-flick"]} .${HIT_SCORE_CLASS} {
  animation: ad-ext-hit-beacon-score 1800ms steps(1, end) infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_IDLE_LOOP_CLASS}.${HIT_ANIMATION_CLASS["alternate-flick"]} .${HIT_SEGMENT_CLASS} {
  animation: ad-ext-hit-beacon-segment 1800ms steps(1, end) infinite;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_TRIGGER_CLASS}::before {
  animation: ad-ext-hit-burst-gradient 820ms cubic-bezier(0.18, 0.9, 0.24, 1) both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_TRIGGER_CLASS}::after {
  animation: ad-ext-hit-burst-rim 760ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_TRIGGER_CLASS} .${HIT_SCORE_CLASS} {
  animation: ad-ext-hit-score-flare 640ms cubic-bezier(0.18, 0.9, 0.24, 1) both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_TRIGGER_CLASS} .${HIT_SEGMENT_CLASS} {
  animation: ad-ext-hit-segment-follow 560ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["impact-pop"]}.${HIT_ANIMATION_TRIGGER_CLASS}::after {
  animation: ad-ext-hit-burst-rim 760ms ease-out both, ad-ext-hit-impact-rim 520ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS.shockwave}.${HIT_ANIMATION_TRIGGER_CLASS}::after {
  animation: ad-ext-hit-burst-rim 760ms ease-out both, ad-ext-hit-shock-ring 820ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["sweep-shine"]}.${HIT_ANIMATION_TRIGGER_CLASS}::before {
  animation: ad-ext-hit-burst-gradient 820ms cubic-bezier(0.18, 0.9, 0.24, 1) both, ad-ext-hit-laser-sweep 840ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["neon-pulse"]}.${HIT_ANIMATION_TRIGGER_CLASS}::before {
  animation: ad-ext-hit-burst-gradient 820ms cubic-bezier(0.18, 0.9, 0.24, 1) both, ad-ext-hit-neon-burst 760ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["snap-bounce"]}.${HIT_ANIMATION_TRIGGER_CLASS}::after {
  animation: ad-ext-hit-burst-rim 760ms ease-out both, ad-ext-hit-bounce-rim 640ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["card-slam"]}.${HIT_ANIMATION_TRIGGER_CLASS}::before {
  animation: ad-ext-hit-burst-gradient 820ms cubic-bezier(0.18, 0.9, 0.24, 1) both, ad-ext-hit-slam-flash 620ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["signal-blink"]}.${HIT_ANIMATION_TRIGGER_CLASS} .${HIT_SCORE_CLASS} {
  animation: ad-ext-hit-score-flare 640ms cubic-bezier(0.18, 0.9, 0.24, 1) both, ad-ext-hit-signal-score 620ms linear both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["stagger-wave"]}.${HIT_ANIMATION_TRIGGER_CLASS}::after {
  animation: ad-ext-hit-burst-rim 760ms ease-out both, ad-ext-hit-stagger-rim 760ms ease-out var(--ad-ext-hit-delay-ms) both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["flip-edge"]}.${HIT_ANIMATION_TRIGGER_CLASS}::after {
  animation: ad-ext-hit-burst-rim 760ms ease-out both, ad-ext-hit-flip-rim 720ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["outline-trace"]}.${HIT_ANIMATION_TRIGGER_CLASS}::after {
  animation: ad-ext-hit-burst-rim 760ms ease-out both, ad-ext-hit-outline-burst 780ms ease-out both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["charge-release"]}.${HIT_ANIMATION_TRIGGER_CLASS}::before {
  animation: ad-ext-hit-burst-gradient 820ms cubic-bezier(0.18, 0.9, 0.24, 1) both, ad-ext-hit-charge-burst 900ms cubic-bezier(0.18, 0.9, 0.24, 1) both;
}

.ad-ext-turn-throw.${HIT_BASE_CLASS}.${HIT_ANIMATION_CLASS["alternate-flick"]}.${HIT_ANIMATION_TRIGGER_CLASS}::before {
  animation: ad-ext-hit-burst-gradient 820ms cubic-bezier(0.18, 0.9, 0.24, 1) both, ad-ext-hit-flick-flash 760ms linear both;
}

@keyframes ad-ext-hit-burst-gradient {
  0% { opacity: 0.36; background-position: 0% 50%; filter: saturate(0.94) brightness(0.94); }
  34% { opacity: 1; background-position: 72% 50%; filter: saturate(1.34) brightness(1.2); }
  100% { opacity: var(--ad-ext-hit-bg-opacity); background-position: 100% 50%; filter: saturate(1.08) brightness(1); }
}

@keyframes ad-ext-hit-burst-rim {
  0% { opacity: 0.42; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 0 rgba(0,0,0,0), 0 0 0 1px rgba(255,255,255,0.04); }
  38% { opacity: 1; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.18), 0 0 42px var(--ad-ext-hit-glow), 0 0 0 1px var(--ad-ext-hit-border); }
  100% { opacity: var(--ad-ext-hit-ring-opacity); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 var(--ad-ext-hit-shadow-spread) var(--ad-ext-hit-glow), 0 0 0 1px var(--ad-ext-hit-border); }
}

@keyframes ad-ext-hit-score-flare {
  0% { filter: saturate(0.95) brightness(0.98); }
  28% { filter: saturate(1.22) brightness(1.2); }
  100% { filter: saturate(1.08) brightness(1.02); }
}

@keyframes ad-ext-hit-segment-follow {
  0% { opacity: 0.76; letter-spacing: 0.06em; }
  36% { opacity: 1; letter-spacing: 0.12em; }
  100% { opacity: 1; letter-spacing: 0.08em; }
}

@keyframes ad-ext-hit-reactor-drift {
  0% { background-position: 0% 46%; filter: saturate(1.06) brightness(0.98); }
  50% { background-position: 100% 54%; filter: saturate(1.22) brightness(1.08); }
  100% { background-position: 0% 46%; filter: saturate(1.06) brightness(0.98); }
}

@keyframes ad-ext-hit-edge-runner {
  0% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), 0 0 18px var(--ad-ext-hit-soft-glow), 0 0 0 1px var(--ad-ext-hit-border); }
  50% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12), 0 0 30px var(--ad-ext-hit-glow), 0 0 0 1px rgba(255,255,255,0.18); }
  100% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), 0 0 18px var(--ad-ext-hit-soft-glow), 0 0 0 1px var(--ad-ext-hit-border); }
}

@keyframes ad-ext-hit-charge-breathe {
  0% { opacity: var(--ad-ext-hit-bg-opacity); transform: scale(1.08); }
  46% { opacity: 0.96; transform: scale(1.11); }
  100% { opacity: var(--ad-ext-hit-bg-opacity); transform: scale(1.08); }
}

@keyframes ad-ext-hit-beacon-score {
  0%, 100% { text-shadow: 0 0 14px rgba(0,0,0,0.58), 0 0 22px var(--ad-ext-hit-soft-glow), 0 0 34px var(--ad-ext-hit-glow); }
  50% { text-shadow: 0 0 14px rgba(0,0,0,0.58), 0 0 12px rgba(255,255,255,0.08), 0 0 10px var(--ad-ext-hit-soft-glow); }
}

@keyframes ad-ext-hit-beacon-segment {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.72; }
}

@keyframes ad-ext-hit-impact-rim {
  0% { transform: scale(0.985); }
  45% { transform: scale(1.015); }
  100% { transform: scale(1); }
}

@keyframes ad-ext-hit-shock-ring {
  0% { opacity: 0.48; box-shadow: inset 0 0 0 0 rgba(255,255,255,0), 0 0 0 rgba(0,0,0,0), 0 0 0 1px rgba(255,255,255,0.04); }
  48% { opacity: 1; box-shadow: inset 0 0 0 2px rgba(255,255,255,0.16), 0 0 54px var(--ad-ext-hit-glow), 0 0 0 1px var(--ad-ext-hit-border); }
  100% { opacity: var(--ad-ext-hit-ring-opacity); }
}

@keyframes ad-ext-hit-laser-sweep {
  0% { background-position: -20% 50%; }
  55% { background-position: 120% 50%; }
  100% { background-position: 100% 50%; }
}

@keyframes ad-ext-hit-neon-burst {
  0% { filter: saturate(1) brightness(1); }
  40% { filter: saturate(1.45) brightness(1.28); }
  100% { filter: saturate(1.1) brightness(1); }
}

@keyframes ad-ext-hit-bounce-rim {
  0% { opacity: 0.62; }
  30% { opacity: 1; }
  60% { opacity: 0.74; }
  100% { opacity: var(--ad-ext-hit-ring-opacity); }
}

@keyframes ad-ext-hit-slam-flash {
  0% { filter: brightness(0.94); }
  32% { filter: brightness(1.34); }
  100% { filter: brightness(1); }
}

@keyframes ad-ext-hit-signal-score {
  0%, 100% { opacity: 1; }
  18% { opacity: 0.62; }
  36% { opacity: 1; }
  58% { opacity: 0.76; }
}

@keyframes ad-ext-hit-stagger-rim {
  0% { opacity: 0.48; }
  40% { opacity: 1; }
  100% { opacity: var(--ad-ext-hit-ring-opacity); }
}

@keyframes ad-ext-hit-flip-rim {
  0% { transform: perspective(900px) rotateX(0deg); }
  42% { transform: perspective(900px) rotateX(8deg); }
  100% { transform: perspective(900px) rotateX(0deg); }
}

@keyframes ad-ext-hit-outline-burst {
  0% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 10px rgba(255,255,255,0.02), 0 0 0 1px var(--ad-ext-hit-border); }
  36% { box-shadow: inset 0 0 0 2px rgba(255,255,255,0.24), 0 0 32px var(--ad-ext-hit-glow), 0 0 0 1px rgba(255,255,255,0.28); }
  100% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 var(--ad-ext-hit-shadow-spread) var(--ad-ext-hit-glow), 0 0 0 1px var(--ad-ext-hit-border); }
}

@keyframes ad-ext-hit-charge-burst {
  0% { opacity: 0.34; transform: scale(1.02); }
  46% { opacity: 1; transform: scale(1.14); }
  100% { opacity: var(--ad-ext-hit-bg-opacity); transform: scale(1.08); }
}

@keyframes ad-ext-hit-flick-flash {
  0%, 100% { filter: saturate(1.06) brightness(1); }
  22% { filter: saturate(1.38) brightness(1.24); }
  44% { filter: saturate(1.02) brightness(0.98); }
  70% { filter: saturate(1.3) brightness(1.18); }
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
