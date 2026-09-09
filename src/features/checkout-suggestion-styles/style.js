export const STYLE_ID = "ad-ext-checkout-suggestion-style";
export const BASE_CLASS = "ad-ext-checkout-suggestion";
export const LAYOUT_CLASS = "ad-ext-checkout-suggestion-layout";
export const MODERN_CLASS = "ad-ext-checkout-suggestion--modern";
export const NO_LABEL_CLASS = "ad-ext-checkout-suggestion--no-label";
export const STYLE_CLASSES = Object.freeze({
  badge: "ad-ext-checkout-suggestion--badge",
  ribbon: "ad-ext-checkout-suggestion--ribbon",
  stripe: "ad-ext-checkout-suggestion--stripe",
  ticket: "ad-ext-checkout-suggestion--ticket",
  outline: "ad-ext-checkout-suggestion--outline",
});

export const STYLE_CLASS_LIST = Object.freeze(Object.values(STYLE_CLASSES));

export function buildStyleText() {
  return `
.${LAYOUT_CLASS} {
  position: relative;
  left: 50%;
  flex: 0 0 444px;
  width: 444px;
  max-width: calc(100vw - 24px);
  min-height: 80px;
  transform: translateX(-50%);
}

.${LAYOUT_CLASS} > :first-child {
  gap: 8px;
  padding-left: 8px;
}

.${LAYOUT_CLASS} > :first-child > .font-number {
  flex: 1 1 0;
  max-width: none;
  height: 80px;
  padding-top: 10px;
}

.${LAYOUT_CLASS} > :first-child > .font-number > span:not([aria-hidden="true"]) {
  font-size: clamp(2.625rem, 42cqw, 3rem);
}

.${LAYOUT_CLASS} > .font-number {
  height: 80px;
}

@media (max-width: 900px) {
  .${LAYOUT_CLASS} {
    left: auto;
    flex: 1 1 0;
    width: 100%;
    max-width: 100%;
    transform: none;
  }

  .${LAYOUT_CLASS},
  .${LAYOUT_CLASS} > :first-child > .font-number,
  .${LAYOUT_CLASS} > .font-number {
    height: 72px;
    min-height: 72px;
  }

  .${LAYOUT_CLASS} > :first-child > .font-number {
    padding-top: 6px;
  }

  .${LAYOUT_CLASS} > :first-child > .font-number > span:not([aria-hidden="true"]) {
    font-size: min(2.5rem, 40cqw);
  }
}

.${BASE_CLASS} {
  position: relative;
  isolation: isolate;
  overflow: visible;
  box-sizing: border-box;
  border-radius: var(--ad-ext-radius, 14px);
  transition: transform 120ms ease, box-shadow 160ms ease;
}

.${BASE_CLASS} > * {
  position: relative;
  z-index: 1;
}

.${BASE_CLASS}::before {
  content: attr(data-ad-ext-label);
  position: absolute;
  top: 6px;
  left: 8px;
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--ad-ext-label-bg);
  color: var(--ad-ext-label-color);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid rgba(15, 12, 5, 0.55);
  box-shadow:
    0 2px 10px rgba(0, 0, 0, 0.45),
    0 0 0 2px rgba(15, 12, 5, 0.6);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.35);
  pointer-events: none;
  z-index: 2;
}

.${NO_LABEL_CLASS}::before {
  display: none;
}

.${MODERN_CLASS} {
  border-radius: 12px;
  overflow: hidden;
  outline: none;
  box-shadow: none;
}

.${LAYOUT_CLASS}:has(.${MODERN_CLASS}:not(.${NO_LABEL_CLASS})),
.${LAYOUT_CLASS}:has(.${MODERN_CLASS}:not(.${NO_LABEL_CLASS})) > :first-child,
.${MODERN_CLASS}:not(.${NO_LABEL_CLASS}) {
  overflow: visible;
}

.${MODERN_CLASS}::before {
  top: -6px;
  left: 6px;
  padding: 3px 7px;
  color: var(--ad-ext-label-color) !important;
  -webkit-text-fill-color: currentColor !important;
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.05em;
  transform: none;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.45);
  text-shadow: none !important;
}

.${LAYOUT_CLASS} > :first-child > .${MODERN_CLASS} > span:not([aria-hidden="true"]),
.${LAYOUT_CLASS} > :first-child > .${MODERN_CLASS} > span:not([aria-hidden="true"]) * {
  color: color-mix(
    in srgb,
    var(--ad-ext-theme-throw-label-color, #f2f5f8) 25%,
    #ffffff 75%
  ) !important;
  -webkit-text-fill-color: currentColor !important;
  text-shadow:
    0 2px 2px rgba(0, 0, 0, 0.82),
    0 0 7px color-mix(
      in srgb,
      var(--ad-ext-theme-throw-label-color, #f2f5f8) 45%,
      transparent
    ) !important;
}

.${STYLE_CLASSES.badge}:not(.${MODERN_CLASS}) {
  outline: 2px dashed var(--ad-ext-accent);
  outline-offset: -6px;
  background: var(--ad-ext-accent-soft);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.${STYLE_CLASSES.ribbon}:not(.${MODERN_CLASS}) {
  background: linear-gradient(135deg, var(--ad-ext-accent-soft), rgba(255, 255, 255, 0));
  box-shadow:
    0 0 0 2px var(--ad-ext-accent) inset,
    0 0 18px var(--ad-ext-accent-strong);
}

.${STYLE_CLASSES.ribbon}:not(.${MODERN_CLASS})::before {
  top: 6px;
  left: 8px;
  transform: rotate(-6deg);
  transform-origin: left center;
}

.${STYLE_CLASSES.ribbon}:not(.${MODERN_CLASS})::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  box-shadow: 0 0 24px var(--ad-ext-accent-strong);
  opacity: 0.35;
  pointer-events: none;
  z-index: 0;
}

.${STYLE_CLASSES.stripe}:not(.${MODERN_CLASS}) {
  background: var(--ad-ext-accent-soft);
  box-shadow:
    0 0 0 2px var(--ad-ext-accent) inset,
    0 12px 22px rgba(0, 0, 0, 0.22);
}

.${STYLE_CLASSES.stripe}:not(.${MODERN_CLASS})::after {
  content: "";
  position: absolute;
  inset: 2px;
  border-radius: inherit;
  background: repeating-linear-gradient(
    45deg,
    var(--ad-ext-accent-strong),
    var(--ad-ext-accent-strong) 6px,
    transparent 6px,
    transparent 12px
  );
  opacity: var(--ad-ext-stripe-opacity, 0.35);
  pointer-events: none;
  z-index: 0;
}

.${STYLE_CLASSES.ticket}:not(.${MODERN_CLASS}) {
  background: linear-gradient(135deg, var(--ad-ext-accent-soft), rgba(255, 255, 255, 0.08));
  box-shadow:
    0 0 0 2px var(--ad-ext-accent) inset,
    0 14px 26px rgba(0, 0, 0, 0.24);
}

.${STYLE_CLASSES.ticket}:not(.${MODERN_CLASS})::before {
  top: 4px;
  left: 12px;
}

.${STYLE_CLASSES.ticket}:not(.${MODERN_CLASS})::after {
  content: "";
  position: absolute;
  left: 14px;
  right: 14px;
  top: 50%;
  border-top: 2px dashed rgba(255, 255, 255, 0.55);
  opacity: 0.6;
  pointer-events: none;
  z-index: 0;
}

.${STYLE_CLASSES.outline}:not(.${MODERN_CLASS}) {
  outline: 3px solid var(--ad-ext-accent);
  outline-offset: -6px;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.25) inset,
    0 12px 24px rgba(0, 0, 0, 0.2);
}

.${MODERN_CLASS}::after {
  content: "";
  position: absolute;
  inset: 3px;
  border-radius: 9px;
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.07),
    rgba(3, 7, 14, 0.34)
  );
  border: 1px solid color-mix(in srgb, var(--ad-ext-accent) 42%, rgba(255, 255, 255, 0.2));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  pointer-events: none;
  z-index: 0;
}

.${MODERN_CLASS}.${STYLE_CLASSES.badge}::after {
  border-style: dashed;
  background: linear-gradient(160deg, rgba(3, 7, 14, 0.74), var(--ad-ext-accent-soft));
}

.${MODERN_CLASS}.${STYLE_CLASSES.ribbon}::after {
  border-top: 4px solid var(--ad-ext-accent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 0 14px var(--ad-ext-accent-strong);
}

.${MODERN_CLASS}.${STYLE_CLASSES.stripe}::after {
  border-left: 6px solid var(--ad-ext-accent);
  background: linear-gradient(100deg, var(--ad-ext-accent-soft), rgba(3, 7, 14, 0.76) 42%);
}

.${MODERN_CLASS}.${STYLE_CLASSES.ticket}::after {
  border: 2px dashed color-mix(in srgb, var(--ad-ext-accent) 76%, rgba(255, 255, 255, 0.28));
}

.${MODERN_CLASS}.${STYLE_CLASSES.outline}::after {
  border: 2px solid var(--ad-ext-accent);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.24),
    0 0 12px color-mix(in srgb, var(--ad-ext-accent-strong) 58%, transparent);
}
`;
}
