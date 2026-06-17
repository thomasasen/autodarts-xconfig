export const DART_IMPACT_EASING = "cubic-bezier(0.16, 0.74, 0.2, 1)";
export const DART_IMPACT_WOBBLE_DURATION_MS = 420;
export const DART_IMPACT_SHADOW_DURATION_MS = 240;
export const DART_IMPACT_SHADOW_OPACITY_BOOST = 0.18;

const DART_IMPACT_WOBBLE_KEYFRAMES = Object.freeze([
  Object.freeze({ offset: 0, transform: "rotate(0deg) scaleX(1) translateX(0px)" }),
  Object.freeze({ offset: 0.16, transform: "rotate(-7.5deg) scaleX(0.982) translateX(-0.8px)" }),
  Object.freeze({ offset: 0.34, transform: "rotate(4.5deg) scaleX(1.012) translateX(0.45px)" }),
  Object.freeze({ offset: 0.55, transform: "rotate(-2.4deg) scaleX(0.996) translateX(-0.22px)" }),
  Object.freeze({ offset: 0.76, transform: "rotate(1.1deg) scaleX(1.002) translateX(0.1px)" }),
  Object.freeze({ offset: 1, transform: "rotate(0deg) scaleX(1) translateX(0px)" }),
]);

export function createDartImpactWobbleKeyframes() {
  return DART_IMPACT_WOBBLE_KEYFRAMES;
}

export function createDartImpactWobbleOptions(delayMs = 0) {
  return {
    duration: DART_IMPACT_WOBBLE_DURATION_MS,
    delay: Math.max(0, Number(delayMs) || 0),
    easing: DART_IMPACT_EASING,
    fill: "both",
  };
}

export function createDartImpactShadowKeyframes(baseOpacity, maxOpacity) {
  const base = Math.min(1, Math.max(0, Number(baseOpacity) || 0));
  const peak = Math.min(1, Math.max(base, Number(maxOpacity) || base));
  const settle = Math.min(1, base + (peak - base) * 0.36);
  return [
    { offset: 0, opacity: base },
    { offset: 0.22, opacity: peak },
    { offset: 0.58, opacity: settle },
    { offset: 1, opacity: base },
  ];
}

export function createDartImpactShadowOptions(delayMs = 0) {
  return {
    duration: DART_IMPACT_SHADOW_DURATION_MS,
    delay: Math.max(0, Number(delayMs) || 0),
    easing: DART_IMPACT_EASING,
  };
}
