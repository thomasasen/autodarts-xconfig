export const STYLE_ID = "ad-ext-checkout-suggestion-style";
export const BASE_CLASS = "ad-ext-checkout-suggestion";
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
.${BASE_CLASS} {
  position: relative;
  isolation: isolate;
  overflow: visible;
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

.${STYLE_CLASSES.badge} {
  outline: 2px dashed var(--ad-ext-accent);
  outline-offset: -6px;
  background: var(--ad-ext-accent-soft);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.${STYLE_CLASSES.ribbon} {
  background: linear-gradient(135deg, var(--ad-ext-accent-soft), rgba(255, 255, 255, 0));
  box-shadow:
    0 0 0 2px var(--ad-ext-accent) inset,
    0 0 18px var(--ad-ext-accent-strong);
}

.${STYLE_CLASSES.ribbon}::before {
  top: 6px;
  left: 8px;
  transform: rotate(-6deg);
  transform-origin: left center;
}

.${STYLE_CLASSES.ribbon}::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  box-shadow: 0 0 24px var(--ad-ext-accent-strong);
  opacity: 0.35;
  pointer-events: none;
  z-index: 0;
}

.${STYLE_CLASSES.stripe} {
  background: var(--ad-ext-accent-soft);
  box-shadow:
    0 0 0 2px var(--ad-ext-accent) inset,
    0 12px 22px rgba(0, 0, 0, 0.22);
}

.${STYLE_CLASSES.stripe}::after {
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

.${STYLE_CLASSES.ticket} {
  background: linear-gradient(135deg, var(--ad-ext-accent-soft), rgba(255, 255, 255, 0.08));
  box-shadow:
    0 0 0 2px var(--ad-ext-accent) inset,
    0 14px 26px rgba(0, 0, 0, 0.24);
}

.${STYLE_CLASSES.ticket}::before {
  top: 4px;
  left: 12px;
}

.${STYLE_CLASSES.ticket}::after {
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

.${STYLE_CLASSES.outline} {
  outline: 3px solid var(--ad-ext-accent);
  outline-offset: -6px;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.25) inset,
    0 12px 24px rgba(0, 0, 0, 0.2);
}

.${STYLE_CLASSES.outline}::after {
  content: "";
  position: absolute;
  top: -6px;
  right: -6px;
  width: 12px;
  height: 12px;
  background: var(--ad-ext-accent);
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.7);
  pointer-events: none;
  z-index: 2;
}
`;
}
