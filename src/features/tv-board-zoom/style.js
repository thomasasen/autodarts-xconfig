export const STYLE_ID = "ad-ext-tv-board-zoom-style";
export const ZOOM_CLASS = "ad-ext-tv-board-zoom";
export const ZOOM_HOST_CLASS = "ad-ext-tv-board-zoom-host";

const SPEED_PRESETS = Object.freeze({
  schnell: {
    zoomInMs: 140,
    zoomOutMs: 180,
    easingIn: "cubic-bezier(0.22, 1, 0.36, 1)",
    easingOut: "cubic-bezier(0.33, 1, 0.68, 1)",
  },
  mittel: {
    zoomInMs: 180,
    zoomOutMs: 220,
    easingIn: "cubic-bezier(0.22, 1, 0.36, 1)",
    easingOut: "cubic-bezier(0.33, 1, 0.68, 1)",
  },
  langsam: {
    zoomInMs: 240,
    zoomOutMs: 300,
    easingIn: "cubic-bezier(0.2, 0.9, 0.25, 1)",
    easingOut: "cubic-bezier(0.25, 1, 0.5, 1)",
  },
});

export function resolveZoomSpeedConfig(speed) {
  const normalized = String(speed || "").trim().toLowerCase();
  return SPEED_PRESETS[normalized] || SPEED_PRESETS.mittel;
}

export function buildStyleText() {
  return `
.${ZOOM_HOST_CLASS},
.ad-ext-theme-board-viewport.${ZOOM_HOST_CLASS},
.css-tqsk66.${ZOOM_HOST_CLASS} {
  overflow: hidden !important;
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}

.${ZOOM_CLASS} {
  will-change: transform;
  backface-visibility: hidden;
}
`;
}
