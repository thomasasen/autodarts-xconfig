import {
  ELECTRIC_FILTER_SOFT_ID,
  ELECTRIC_FILTER_STRONG_ID,
} from "../../shared/electric-border-engine.js";
import {
  SCORE_FLASH_CLASS,
  SCORE_FLASH_SEQUENCE_ATTRIBUTE,
  buildStyleText as buildTurnScoreCounterStyleText,
} from "../turn-score-counter/style.js";
import {
  ANIMATE_CLASS as AVG_TREND_ANIMATE_CLASS,
  ARROW_CLASS as AVG_TREND_ARROW_CLASS,
  ARROW_HALF_WIDTH_VAR as AVG_TREND_ARROW_HALF_WIDTH_VAR,
  ARROW_HEIGHT_VAR as AVG_TREND_ARROW_HEIGHT_VAR,
  ARROW_MARGIN_LEFT_VAR as AVG_TREND_ARROW_MARGIN_LEFT_VAR,
  DOWN_CLASS as AVG_TREND_DOWN_CLASS,
  UP_CLASS as AVG_TREND_UP_CLASS,
  VISIBLE_CLASS as AVG_TREND_VISIBLE_CLASS,
} from "../avg-trend-arrow/style.js";
import {
  BASE_CLASS as DARTBOARD_MARKER_HIGHLIGHT_BASE_CLASS,
  EFFECT_CLASSES as DARTBOARD_MARKER_HIGHLIGHT_EFFECT_CLASSES,
} from "../dartboard-marker-highlight/style.js";
import { buildStyleText as buildCheckoutScoreHighlightStyleText } from "../checkout-score-highlight/style.js";
import { buildStyleText as buildCheckoutTargetHighlightsStyleText } from "../checkout-target-highlights/style.js";
import { buildStyleText as buildX01RemainingScoreBarStyleText } from "../x01-remaining-score-bar/style.js";
import { TURN_SCORE_PREVIEW_SCORE_CLASS } from "./turn-score-preview-contract.js";
import { AVG_TREND_PREVIEW_CLASS } from "./avg-trend-preview-contract.js";
import { DARTBOARD_MARKER_HIGHLIGHT_PREVIEW_CLASS } from "./dartboard-marker-highlight-preview-contract.js";

const MENU_ITEM_ID = "ad-xconfig-menu-item";
const PANEL_HOST_ID = "ad-xconfig-panel-host";

const COLOR_PREVIEW_PALETTES = Object.freeze([
  ["checkout-score-autodarts-green", "#5b7d31", "#9fdb58", "#b9ef7b", "#d9ffad", "rgba(159,219,88,.94)", "rgba(159,219,88,.62)", "rgba(159,219,88,.28)"],
  ["checkout-score-cyan", "#0f5f86", "#38bdf8", "#67e8f9", "#cffafe", "rgba(103,232,249,.94)", "rgba(56,189,248,.64)", "rgba(56,189,248,.28)"],
  ["checkout-score-amber", "#7c3d05", "#f59e0b", "#fbbf24", "#fde68a", "rgba(251,191,36,.94)", "rgba(245,158,11,.64)", "rgba(245,158,11,.28)"],
  ["checkout-score-red", "#7f1d1d", "#ef4444", "#f87171", "#fecaca", "rgba(248,113,113,.94)", "rgba(248,113,113,.62)", "rgba(248,113,113,.28)"],
  ["x01-danger-endgame", "#334155", "#facc15", "#f97316", "#dc2626", "rgba(248,113,113,.94)", "rgba(249,115,22,.62)", "rgba(220,38,38,.28)"],
  ["x01-gradient-by-progress", "#ef4444", "#f97316", "#facc15", "#22c55e", "rgba(250,204,21,.94)", "rgba(34,197,94,.58)", "rgba(239,68,68,.25)"],
  ["x01-autodarts", "#1d4ed8", "#38bdf8", "#60a5fa", "#7dd3fc", "rgba(125,211,252,.94)", "rgba(96,165,250,.62)", "rgba(56,189,248,.28)"],
  ["x01-signal-lime", "#3f6212", "#84cc16", "#a3e635", "#bef264", "rgba(190,242,100,.94)", "rgba(163,230,53,.62)", "rgba(132,204,22,.28)"],
  ["x01-glass-mint", "#10b981", "#2dd4bf", "#6ee7b7", "#bbf7d0", "rgba(110,231,183,.94)", "rgba(45,212,191,.62)", "rgba(16,185,129,.28)"],
  ["x01-ember-rush", "#9a3412", "#fb923c", "#f97316", "#ef4444", "rgba(251,146,60,.94)", "rgba(249,115,22,.64)", "rgba(239,68,68,.3)"],
  ["x01-ice-circuit", "#0e7490", "#38bdf8", "#22d3ee", "#2dd4bf", "rgba(34,211,238,.94)", "rgba(56,189,248,.62)", "rgba(45,212,191,.28)"],
  ["x01-neon-violet", "#5b21b6", "#a855f7", "#818cf8", "#38bdf8", "rgba(168,85,247,.94)", "rgba(129,140,248,.62)", "rgba(56,189,248,.28)"],
  ["x01-sunset-amber", "#b45309", "#facc15", "#f97316", "#f43f5e", "rgba(250,204,21,.94)", "rgba(249,115,22,.64)", "rgba(244,63,94,.28)"],
  ["x01-monochrome-steel", "#475569", "#e2e8f0", "#94a3b8", "#64748b", "rgba(226,232,240,.92)", "rgba(148,163,184,.58)", "rgba(100,116,139,.28)"],
  ["checkout-board-violet", "#581c87", "#a855f7", "#c084fc", "#e9d5ff", "rgba(192,132,252,.96)", "rgba(168,85,247,.62)", "rgba(168,85,247,.28)"],
  ["checkout-board-cyan", "#155e75", "#38bdf8", "#67e8f9", "#cffafe", "rgba(103,232,249,.96)", "rgba(56,189,248,.62)", "rgba(56,189,248,.28)"],
  ["checkout-board-amber", "#78350f", "#f59e0b", "#fbbf24", "#fef3c7", "rgba(251,191,36,.98)", "rgba(245,158,11,.64)", "rgba(245,158,11,.28)"],
  ["checkout-board-lime", "#365314", "#84cc16", "#bef264", "#ecfccb", "rgba(190,242,100,.98)", "rgba(132,204,22,.64)", "rgba(132,204,22,.28)"],
  ["checkout-board-rose", "#881337", "#f43f5e", "#fb7185", "#ffe4e6", "rgba(251,113,133,.98)", "rgba(244,63,94,.64)", "rgba(244,63,94,.28)"],
  ["checkout-board-white", "#64748b", "#e2e8f0", "#ffffff", "#f8fafc", "rgba(255,255,255,.98)", "rgba(248,250,252,.6)", "rgba(226,232,240,.26)"],
  ["checkout-suggestion-amber", "#78350f", "#f59e0b", "#fcd34d", "#fff7c2", "rgba(252,211,77,.94)", "rgba(245,158,11,.62)", "rgba(245,158,11,.28)"],
  ["checkout-suggestion-cyan", "#164e63", "#06b6d4", "#67e8f9", "#cffafe", "rgba(103,232,249,.94)", "rgba(6,182,212,.62)", "rgba(6,182,212,.28)"],
  ["checkout-suggestion-rose", "#881337", "#f43f5e", "#fda4af", "#ffe4e6", "rgba(253,164,175,.94)", "rgba(244,63,94,.62)", "rgba(244,63,94,.28)"],
  ["dart-marker-blue", "#1e3a8a", "#3182ce", "#60a5fa", "#bfdbfe", "rgba(96,165,250,.94)", "rgba(49,130,206,.62)", "rgba(49,130,206,.28)"],
  ["dart-marker-green", "#14532d", "#22c55e", "#86efac", "#dcfce7", "rgba(134,239,172,.94)", "rgba(34,197,94,.62)", "rgba(34,197,94,.28)"],
  ["dart-marker-red", "#7f1d1d", "#f87171", "#fca5a5", "#fee2e2", "rgba(252,165,165,.94)", "rgba(248,113,113,.62)", "rgba(248,113,113,.28)"],
  ["dart-marker-yellow", "#713f12", "#facc15", "#fde047", "#fef9c3", "rgba(253,224,71,.94)", "rgba(250,204,21,.62)", "rgba(250,204,21,.28)"],
  ["dart-marker-white", "#64748b", "#f8fafc", "#ffffff", "#cbd5e1", "rgba(255,255,255,.94)", "rgba(255,255,255,.58)", "rgba(203,213,225,.28)"],
  ["dart-marker-outline-off", "#1f2937", "#334155", "#475569", "#64748b", "rgba(148,163,184,.52)", "rgba(100,116,139,.34)", "rgba(71,85,105,.18)"],
  ["dart-marker-outline-white", "#475569", "#e2e8f0", "#ffffff", "#f8fafc", "rgba(255,255,255,.95)", "rgba(255,255,255,.58)", "rgba(226,232,240,.28)"],
  ["dart-marker-outline-black", "#000000", "#111827", "#1f2937", "#4b5563", "rgba(0,0,0,.95)", "rgba(31,41,55,.5)", "rgba(0,0,0,.28)"],
  ["winner-autodarts", "#0c5b9c", "#1267ad", "#1c6fb8", "#ffffff", "rgba(255,255,255,.94)", "rgba(28,111,184,.62)", "rgba(12,91,156,.28)"],
  ["winner-redwhite", "#ffffff", "#fca5a5", "#ef4444", "#991b1b", "rgba(252,165,165,.94)", "rgba(239,68,68,.62)", "rgba(220,38,38,.28)"],
  ["winner-ice", "#ffffff", "#bae6fd", "#38bdf8", "#1d4ed8", "rgba(186,230,253,.94)", "rgba(56,189,248,.62)", "rgba(29,78,216,.28)"],
  ["winner-sunset", "#ffffff", "#fdba74", "#f97316", "#a855f7", "rgba(253,186,116,.94)", "rgba(244,63,94,.62)", "rgba(168,85,247,.28)"],
  ["winner-neon", "#ffffff", "#bef264", "#22d3ee", "#f472b6", "rgba(190,242,100,.94)", "rgba(34,211,238,.62)", "rgba(244,114,182,.28)"],
  ["winner-gold", "#ffffff", "#fde68a", "#fbbf24", "#b45309", "rgba(253,230,138,.94)", "rgba(251,191,36,.62)", "rgba(180,83,9,.28)"],
]);

const COLOR_PREVIEW_GRADIENTS = Object.freeze([
  ["x01-checkout-focus", "linear-gradient(116deg,#1e40af 0%,#38bdf8 50%,#818cf8 100%),linear-gradient(116deg,#92400e 0%,#f59e0b 50%,#facc15 100%),linear-gradient(116deg,#166534 0%,#22c55e 50%,#4ade80 100%)", "33.333% 100%,33.334% 100%,33.333% 100%", "left center,center center,right center", "rgba(250,204,21,.94)", "rgba(34,197,94,.58)", "rgba(56,189,248,.26)"],
  ["x01-traffic-light", "linear-gradient(116deg,#991b1b 0%,#ef4444 52%,#f87171 100%),linear-gradient(116deg,#92400e 0%,#f59e0b 52%,#facc15 100%),linear-gradient(116deg,#14532d 0%,#22c55e 52%,#84cc16 100%)", "33.333% 100%,33.334% 100%,33.333% 100%", "left center,center center,right center", "rgba(250,204,21,.94)", "rgba(239,68,68,.58)", "rgba(34,197,94,.26)"],
  ["cricket-standard", "linear-gradient(116deg,#064e3b 0%,#00b287 48%,#5eead4 100%),linear-gradient(116deg,#7f1d1d 0%,#ef4444 48%,#fca5a5 100%)", "50% 100%,50% 100%", "left center,right center", "rgba(94,234,212,.94)", "rgba(0,178,135,.58)", "rgba(239,68,68,.25)"],
  ["cricket-high-contrast", "linear-gradient(116deg,#14532d 0%,#22c55e 48%,#86efac 100%),linear-gradient(116deg,#7f1d1d 0%,#ef4444 48%,#fca5a5 100%)", "50% 100%,50% 100%", "left center,right center", "rgba(134,239,172,.94)", "rgba(34,197,94,.6)", "rgba(239,68,68,.25)"],
]);

function buildColorPreviewPaletteRule(definition) {
  const [key, themeA, themeB, themeC, themeD, edge, glow, softGlow] = definition;
  return `#${PANEL_HOST_ID} [data-preview-color-theme="${key}"]{--ad-xconfig-hit-theme-a:${themeA};--ad-xconfig-hit-theme-b:${themeB};--ad-xconfig-hit-theme-c:${themeC};--ad-xconfig-hit-theme-d:${themeD};--ad-xconfig-hit-edge:${edge};--ad-xconfig-hit-glow:${glow};--ad-xconfig-hit-soft-glow:${softGlow}}`;
}

function buildColorPreviewGradientRule(definition) {
  const [key, gradient, size, position, edge, glow, softGlow] = definition;
  return `#${PANEL_HOST_ID} [data-preview-color-theme="${key}"]{--ad-xconfig-hit-theme-gradient:${gradient};--ad-xconfig-hit-theme-gradient-size:${size};--ad-xconfig-hit-theme-gradient-position:${position};--ad-xconfig-hit-edge:${edge};--ad-xconfig-hit-glow:${glow};--ad-xconfig-hit-soft-glow:${softGlow}}`;
}

function buildColorPreviewRules() {
  return [
    ...COLOR_PREVIEW_PALETTES.map(buildColorPreviewPaletteRule),
    ...COLOR_PREVIEW_GRADIENTS.map(buildColorPreviewGradientRule),
  ].join("\n");
}

export const styleText = `
${buildTurnScoreCounterStyleText()}
${buildCheckoutScoreHighlightStyleText({ selectorPrefix: `#${PANEL_HOST_ID}` })}
${buildCheckoutTargetHighlightsStyleText()}
${buildX01RemainingScoreBarStyleText()}
#${MENU_ITEM_ID}{cursor:pointer}
#${MENU_ITEM_ID}[data-update-available="true"]{position:relative}
#${MENU_ITEM_ID}[data-update-available="true"]::after{content:"";position:absolute;top:.52rem;right:.6rem;width:.62rem;height:.62rem;border-radius:999px;background:#ff8370;box-shadow:0 0 0 2px rgba(12,22,54,.92),0 0 0 4px rgba(255,131,112,.18)}
#${PANEL_HOST_ID}{display:none;width:100%;height:100%;min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable;position:relative;--adx-surface:var(--color-surface-surface,#16181c);--adx-raised:var(--color-black-85,#1b1f29);--adx-secondary:var(--color-black-70,#292c33);--adx-text:#fff;--adx-muted:var(--color-black-20,#cacfd9);--adx-subtle:var(--color-black-30,#b8bcc5);--adx-primary:var(--color-brand-blue-60,#0b55df);--adx-success:var(--color-system-success,#49da9e);--adx-border:rgba(255,255,255,.12);--adx-body:var(--font-body,"Manrope Variable",sans-serif);--adx-display:var(--font-display,"Bebas Neue",sans-serif);color:var(--adx-text);font-family:var(--adx-body)}
#${PANEL_HOST_ID} .ad-xconfig-page{box-sizing:border-box;min-height:100%;margin:0 auto;width:100%;padding:24px;color:var(--adx-text);font:14px/1.5 var(--adx-body)}
#${PANEL_HOST_ID} .ad-xconfig-shell{max-width:1366px;margin:0 auto;padding:0;background:transparent}
#${PANEL_HOST_ID} .ad-xconfig-shell,#${PANEL_HOST_ID} .ad-xconfig-shell *{pointer-events:auto}
#${PANEL_HOST_ID} .ad-xconfig-header{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:16px}
#${PANEL_HOST_ID} .ad-xconfig-header-main{display:flex;align-items:center;gap:.75rem}
#${PANEL_HOST_ID} .ad-xconfig-title{margin:0;font:32px/1.2 var(--adx-display)}
#${PANEL_HOST_ID} .ad-xconfig-subtitle{margin:8px 0 0;font-size:14px;color:var(--adx-subtle)}
#${PANEL_HOST_ID} .ad-xconfig-notice{margin-top:.85rem;border-radius:8px;padding:.62rem .8rem;font-size:.85rem;border:1px solid transparent}
#${PANEL_HOST_ID} .ad-xconfig-notice--success{background:rgba(58,180,122,.17);border-color:rgba(58,180,122,.52)}
#${PANEL_HOST_ID} .ad-xconfig-notice--error{background:rgba(255,84,84,.15);border-color:rgba(255,84,84,.5)}
#${PANEL_HOST_ID} .ad-xconfig-notice--info{background:rgba(74,178,255,.18);border-color:rgba(74,178,255,.5)}
#${PANEL_HOST_ID} .ad-xconfig-header-actions{display:flex;flex-wrap:wrap;gap:8px}
#${PANEL_HOST_ID} .ad-xconfig-update-panel{margin-top:24px;padding:16px;border-radius:12px;border:1px solid var(--adx-border);background:var(--adx-surface);display:grid;gap:8px}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="available"]{border-color:var(--adx-primary);background:var(--adx-surface)}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="current"]{background:var(--adx-surface)}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="checking"]{background:var(--adx-surface)}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="error"]{border-color:#da3954;background:var(--adx-surface)}
#${PANEL_HOST_ID} .ad-xconfig-update-head{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem;flex-wrap:wrap}
#${PANEL_HOST_ID} .ad-xconfig-update-summary{display:grid;gap:.18rem}
#${PANEL_HOST_ID} .ad-xconfig-update-title-row{display:flex;align-items:center;gap:.55rem;flex-wrap:wrap}
#${PANEL_HOST_ID} .ad-xconfig-update-dot{width:8px;height:8px;border-radius:50%;background:var(--adx-subtle)}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="available"] .ad-xconfig-update-dot{background:var(--adx-primary)}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="current"] .ad-xconfig-update-dot{background:var(--adx-success)}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="error"] .ad-xconfig-update-dot{background:#da3954}
#${PANEL_HOST_ID} .ad-xconfig-update-title{margin:0;font:700 14px/1.4 var(--adx-body)}
#${PANEL_HOST_ID} .ad-xconfig-update-copy{margin:0;font-size:12px;line-height:1.5;color:var(--adx-subtle)}
#${PANEL_HOST_ID} .ad-xconfig-update-actions{display:flex;flex-wrap:wrap;gap:.55rem}
#${PANEL_HOST_ID} .ad-xconfig-update-link{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-weight:700}
#${PANEL_HOST_ID} .ad-xconfig-update-link .ad-xconfig-update-link-copy{display:inline-flex;align-items:center;gap:.38rem}
#${PANEL_HOST_ID} .ad-xconfig-update-link .ad-xconfig-update-link-kicker{display:inline-flex;padding:.14rem .42rem;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.14);font-size:.64rem;letter-spacing:.06em;text-transform:uppercase;color:rgba(240,246,255,.82)}
#${PANEL_HOST_ID} .ad-xconfig-update-link .ad-xconfig-update-link-label{color:rgba(248,251,255,.96)}
#${PANEL_HOST_ID} .ad-xconfig-tabs-label{margin:24px 0 8px;color:var(--adx-text);font:700 14px/1.5 var(--adx-body)}
#${PANEL_HOST_ID} .ad-xconfig-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:8px;border:1px solid var(--adx-border);border-radius:12px;background:var(--adx-surface)}
#${PANEL_HOST_ID} .ad-xconfig-btn{border:1px solid rgba(255,255,255,.24);border-radius:8px;background:var(--adx-secondary);color:var(--adx-text);cursor:pointer;font:inherit}
#${PANEL_HOST_ID} .ad-xconfig-btn{padding:.55rem .85rem}
#${PANEL_HOST_ID} .ad-xconfig-btn:hover{background:rgba(255,255,255,.16)}
#${PANEL_HOST_ID} .ad-xconfig-btn--square{width:2.15rem;min-width:2.15rem;height:2.15rem;padding:0;display:inline-flex;align-items:center;justify-content:center;line-height:1}
#${PANEL_HOST_ID} .ad-xconfig-btn--danger{border-color:rgba(255,84,84,.42);background:rgba(255,84,84,.17)}
#${PANEL_HOST_ID} .ad-xconfig-tab{min-width:0;min-height:48px;border:1px solid var(--adx-border);border-radius:8px;background:var(--adx-secondary);padding:12px 8px;display:flex;align-items:center;justify-content:center;color:var(--adx-text);font:700 16px/1.2 var(--adx-body);cursor:pointer}
#${PANEL_HOST_ID} .ad-xconfig-tab:hover{border-color:var(--adx-subtle);background:var(--color-black-60,#4d525d)}
#${PANEL_HOST_ID} .ad-xconfig-tab[data-active="true"]{color:var(--adx-text);border-color:var(--adx-primary);background:var(--adx-primary)}
#${PANEL_HOST_ID} .ad-xconfig-tab-title{font:inherit}
#${PANEL_HOST_ID} .ad-xconfig-tab[data-active="true"] .ad-xconfig-tab-title{color:rgba(248,252,255,.99)}
#${PANEL_HOST_ID} .ad-xconfig-content{margin-top:24px}
#${PANEL_HOST_ID} .ad-xconfig-content-head{display:flex;align-items:center;justify-content:space-between;gap:.55rem;flex-wrap:wrap}
#${PANEL_HOST_ID} .ad-xconfig-content-title{margin:0;font:24px/1.2 var(--adx-display)}
#${PANEL_HOST_ID} .ad-xconfig-group{display:grid;gap:.6rem}
#${PANEL_HOST_ID} .ad-xconfig-group + .ad-xconfig-group{margin-top:1.1rem}
#${PANEL_HOST_ID} .ad-xconfig-group-divider{height:1px;background:var(--adx-border);border:0;margin:24px 0}
#${PANEL_HOST_ID} .ad-xconfig-group-title{margin:0;font:24px/1.2 var(--adx-display);color:var(--adx-text)}
#${PANEL_HOST_ID} .ad-xconfig-btn--compact{padding:.38rem .62rem;font-size:.74rem;line-height:1.12}
#${PANEL_HOST_ID} .ad-xconfig-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;margin-top:16px}
#${PANEL_HOST_ID} .ad-xconfig-card{position:relative;overflow:hidden;min-width:0;border-radius:12px;border:1px solid var(--adx-border);background:var(--adx-surface);display:flex;flex-direction:column}
#${PANEL_HOST_ID} .ad-xconfig-card--theme-global{grid-column:1/-1}
#${PANEL_HOST_ID} .ad-xconfig-card-bg{position:relative;height:160px;flex:0 0 160px;overflow:hidden;pointer-events:none;background:var(--adx-raised);border-bottom:1px solid var(--adx-border)}
#${PANEL_HOST_ID} .ad-xconfig-card-bg img{display:block;width:100%;height:100%;object-fit:cover;object-position:center}
#${PANEL_HOST_ID} .ad-xconfig-card[data-preview-kind="avg-trend-arrow"] .ad-xconfig-card-bg img{object-fit:contain;object-position:center}
#${PANEL_HOST_ID} .ad-xconfig-card[data-preview-kind="checkout-target-highlights"] .ad-xconfig-card-bg img{object-fit:contain;object-position:center}
#${PANEL_HOST_ID} .ad-xconfig-card[data-preview-kind="checkout-suggestion-style"] .ad-xconfig-card-bg img{object-fit:contain;object-position:center}
#${PANEL_HOST_ID} .ad-xconfig-card[data-preview-kind="checkout-suggestion-style"] .ad-xconfig-feature-card-preview{position:absolute;z-index:1;top:50%;right:3%;width:min(58%,19rem);transform:translateY(-50%);filter:drop-shadow(0 12px 18px rgba(2,8,28,.55));opacity:.94}
#${PANEL_HOST_ID} .ad-xconfig-card[data-preview-kind="checkout-suggestion-style"] .ad-xconfig-feature-card-preview .ad-xconfig-checkout-suggestion-demo{width:100%}
#${PANEL_HOST_ID} .ad-xconfig-card[data-preview-kind="board"] .ad-xconfig-card-bg img{object-fit:contain;object-position:center}
#${PANEL_HOST_ID} .ad-xconfig-card[data-preview-kind="dart-marker"] .ad-xconfig-card-bg img{object-fit:contain;object-position:center}
#${PANEL_HOST_ID} .ad-xconfig-card[data-preview-kind="dart-marker"]:hover .ad-xconfig-card-bg img{object-fit:contain;object-position:center}
#${PANEL_HOST_ID} .ad-xconfig-card[data-preview-kind="take-out-darts-alert"] .ad-xconfig-card-bg img{object-fit:contain;object-position:center}
#${PANEL_HOST_ID} .ad-xconfig-card[data-preview-kind="turn-score-counter"] .ad-xconfig-card-bg img{object-fit:contain;object-position:center}
#${PANEL_HOST_ID} .ad-xconfig-card-content{position:relative;padding:16px;display:flex;flex-direction:column;flex:1;min-width:0}
#${PANEL_HOST_ID} .ad-xconfig-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:8px}
#${PANEL_HOST_ID} .ad-xconfig-card-title{margin:0;font:700 16px/1.4 var(--adx-body);overflow-wrap:anywhere}
#${PANEL_HOST_ID} .ad-xconfig-card-copy{margin:8px 0 0;color:var(--adx-muted);font-size:14px;line-height:1.5;overflow-wrap:anywhere}
#${PANEL_HOST_ID} .ad-xconfig-card-badges{margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
#${PANEL_HOST_ID} .ad-xconfig-status-badge{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;font:600 12px/1.2 var(--adx-body)}
#${PANEL_HOST_ID} .ad-xconfig-status-badge--deprecated{border:1px solid #fb8b58;background:rgba(251,139,88,.08);color:#fb8b58}
#${PANEL_HOST_ID} .ad-xconfig-card-global-summary{margin-top:.85rem;display:grid;gap:.58rem}
#${PANEL_HOST_ID} .ad-xconfig-card-global-badges{display:flex;gap:.45rem;flex-wrap:wrap}
#${PANEL_HOST_ID} .ad-xconfig-card-global-badge{display:inline-flex;align-items:center;padding:.22rem .62rem;border-radius:999px;font-size:.67rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase}
#${PANEL_HOST_ID} .ad-xconfig-card-global-badge--primary{background:var(--adx-secondary);border:1px solid var(--adx-border);color:var(--adx-muted)}
#${PANEL_HOST_ID} .ad-xconfig-card-actions{margin-top:16px;display:flex;gap:8px;flex-wrap:wrap}
#${PANEL_HOST_ID} .ad-xconfig-variant{display:inline-flex;margin-top:.55rem;padding:.2rem .55rem;border-radius:999px;background:rgba(163,191,250,.2);border:1px solid rgba(163,191,250,.7);font-size:.72rem}
#${PANEL_HOST_ID} .ad-xconfig-mini-btn{border:1px solid var(--adx-border);border-radius:8px;background:var(--adx-secondary);color:var(--adx-text);padding:8px 12px;font:600 14px/1.4 var(--adx-body);cursor:pointer}
#${PANEL_HOST_ID} .ad-xconfig-mini-btn:hover{background:var(--adx-raised)}
#${PANEL_HOST_ID} .ad-xconfig-mini-btn--settings{background:var(--adx-primary);border-color:var(--adx-primary)}
#${PANEL_HOST_ID} .ad-xconfig-mini-btn--settings:hover{background:var(--color-blue-70,#003eb3)}
#${PANEL_HOST_ID} .ad-xconfig-mini-btn--readme{background:transparent}
#${PANEL_HOST_ID} .ad-xconfig-mini-btn--readme:hover{background:var(--adx-secondary)}
#${PANEL_HOST_ID} .ad-xconfig-fields{display:grid;gap:.65rem}
#${PANEL_HOST_ID} .ad-xconfig-field{display:grid;gap:.32rem}
#${PANEL_HOST_ID} .ad-xconfig-field label{font-weight:600;font-size:.86rem}
#${PANEL_HOST_ID} .ad-xconfig-field--checkbox{display:flex;align-items:center;gap:.55rem}
#${PANEL_HOST_ID} .ad-xconfig-note{margin:8px 0 0;color:var(--adx-subtle);font-size:12px;line-height:1.5;overflow-wrap:anywhere}
#${PANEL_HOST_ID} .ad-xconfig-option-list{margin:.55rem 0 0;padding:0;list-style:none;display:grid;gap:.4rem}
#${PANEL_HOST_ID} .ad-xconfig-turn-dart-asset-option-list{grid-template-columns:repeat(2,minmax(0,1fr));max-height:min(28rem,55vh);overflow:auto;padding-right:.15rem}
#${PANEL_HOST_ID} .ad-xconfig-option-item{appearance:none;display:block;width:100%;text-align:left;padding:.42rem .5rem;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035);color:#fff;cursor:pointer;font:inherit}
#${PANEL_HOST_ID} .ad-xconfig-option-item--effect-preview{position:relative;overflow:hidden;transform-origin:center;will-change:transform,filter,box-shadow}
#${PANEL_HOST_ID} .ad-xconfig-option-item--effect-preview>*,#${PANEL_HOST_ID} .ad-xconfig-option-item--color-preview>*{position:relative;z-index:1}
#${PANEL_HOST_ID} .ad-xconfig-option-item--effect-preview::before,#${PANEL_HOST_ID} .ad-xconfig-option-item--effect-preview::after{content:"";position:absolute;z-index:0;pointer-events:none;opacity:0}
#${PANEL_HOST_ID} .ad-xconfig-option-item--effect-preview::before{inset:-35%;background:linear-gradient(115deg,transparent 0%,rgba(255,255,255,.08) 36%,rgba(181,234,255,.38) 50%,rgba(255,255,255,.08) 64%,transparent 100%);transform:translateX(-78%) skewX(-14deg)}
#${PANEL_HOST_ID} .ad-xconfig-option-item--effect-preview::after{inset:-2px;border-radius:inherit}
#${PANEL_HOST_ID} .ad-xconfig-option-item--color-preview{--ad-xconfig-hit-theme-a:#31f7a0;--ad-xconfig-hit-theme-b:#8cf34a;--ad-xconfig-hit-theme-c:#a0ffd0;--ad-xconfig-hit-theme-d:#f5ffbb;--ad-xconfig-hit-theme-gradient:linear-gradient(116deg,var(--ad-xconfig-hit-theme-a) 0%,var(--ad-xconfig-hit-theme-b) 34%,var(--ad-xconfig-hit-theme-c) 67%,var(--ad-xconfig-hit-theme-d) 100%);--ad-xconfig-hit-theme-gradient-size:220% 220%;--ad-xconfig-hit-theme-gradient-position:0% 50%;--ad-xconfig-hit-theme-gradient-blend:normal;--ad-xconfig-hit-edge:rgba(170,255,115,.9);--ad-xconfig-hit-glow:rgba(117,255,145,.6);--ad-xconfig-hit-soft-glow:rgba(117,255,145,.28);--ad-xconfig-hit-surface-a:rgba(8,12,22,.98);--ad-xconfig-hit-surface-b:rgba(12,18,32,.96);--ad-xconfig-hit-surface-c:rgba(6,10,18,.98);position:relative;overflow:hidden;isolation:isolate;background:linear-gradient(165deg,var(--ad-xconfig-hit-surface-a) 0%,var(--ad-xconfig-hit-surface-b) 48%,var(--ad-xconfig-hit-surface-c) 100%);border-color:color-mix(in srgb,var(--ad-xconfig-hit-edge) 46%,rgba(255,255,255,.16));box-shadow:inset 0 0 0 1px rgba(255,255,255,.04),inset 0 -8px 18px rgba(0,0,0,.22),0 0 16px color-mix(in srgb,var(--ad-xconfig-hit-soft-glow) 54%,transparent)}
#${PANEL_HOST_ID} .ad-xconfig-option-item--color-preview::before,#${PANEL_HOST_ID} .ad-xconfig-option-item--color-preview::after{content:"";position:absolute;border-radius:inherit;pointer-events:none}
#${PANEL_HOST_ID} .ad-xconfig-option-item--color-preview::before{z-index:0;inset:-14%;opacity:.82;background-image:radial-gradient(circle at 18% 16%,rgba(255,255,255,.18) 0%,rgba(255,255,255,0) 38%),radial-gradient(circle at 82% 84%,rgba(255,255,255,.1) 0%,rgba(255,255,255,0) 42%),conic-gradient(from 190deg at 50% 50%,rgba(0,0,0,.42),rgba(0,0,0,.08),rgba(0,0,0,.4),rgba(0,0,0,.12),rgba(0,0,0,.42)),var(--ad-xconfig-hit-theme-gradient);background-size:120% 120%,120% 120%,220% 220%,var(--ad-xconfig-hit-theme-gradient-size);background-position:14% 22%,78% 74%,0% 50%,var(--ad-xconfig-hit-theme-gradient-position);background-repeat:no-repeat;background-blend-mode:screen,screen,overlay,var(--ad-xconfig-hit-theme-gradient-blend);filter:saturate(1.08) contrast(1.02) brightness(.94);transform:translate3d(0,0,0) scale(1.03)}
#${PANEL_HOST_ID} .ad-xconfig-option-item--color-preview::after{z-index:0;inset:0;border:1px solid color-mix(in srgb,var(--ad-xconfig-hit-edge) 72%,white 28%);background:linear-gradient(120deg,rgba(255,255,255,.09),rgba(255,255,255,0) 28%,rgba(255,255,255,0) 72%,rgba(255,255,255,.09));box-shadow:inset 0 0 0 1px rgba(255,255,255,.06),inset 0 0 16px rgba(255,255,255,.02),0 0 18px var(--ad-xconfig-hit-soft-glow),0 0 0 1px color-mix(in srgb,var(--ad-xconfig-hit-edge) 82%,white 18%)}
#${PANEL_HOST_ID} .ad-xconfig-option-item--color-preview:hover{background:linear-gradient(165deg,var(--ad-xconfig-hit-surface-a) 0%,var(--ad-xconfig-hit-surface-b) 48%,var(--ad-xconfig-hit-surface-c) 100%);border-color:color-mix(in srgb,var(--ad-xconfig-hit-edge) 82%,white 18%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),inset 0 -8px 18px rgba(0,0,0,.22),0 0 24px color-mix(in srgb,var(--ad-xconfig-hit-glow) 46%,transparent)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-color-theme="kind-signal"]{--ad-xconfig-hit-theme-a:#c62828;--ad-xconfig-hit-theme-b:#1976d2;--ad-xconfig-hit-theme-c:#1b7a34;--ad-xconfig-hit-theme-d:#9ef57e;--ad-xconfig-hit-theme-gradient:linear-gradient(116deg,#3b0a11 0%,#7f1124 34%,#c62828 67%,#ff8a80 100%),linear-gradient(116deg,#0a1f45 0%,#0d4f9b 34%,#1976d2 67%,#7ec8ff 100%),linear-gradient(116deg,#0c2a14 0%,#1b7a34 34%,#2eaf50 67%,#9ef57e 100%);--ad-xconfig-hit-theme-gradient-size:33.333% 100%,33.334% 100%,33.333% 100%;--ad-xconfig-hit-theme-gradient-position:left center,center center,right center;--ad-xconfig-hit-theme-gradient-blend:normal,normal,normal;--ad-xconfig-hit-edge:rgba(170,221,255,.94);--ad-xconfig-hit-glow:rgba(126,200,255,.64);--ad-xconfig-hit-soft-glow:rgba(76,217,100,.3)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-color-theme="kind-signal"]::before{filter:saturate(1.08) brightness(1.02)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-color-theme="ember-rush"]{--ad-xconfig-hit-theme-a:#4e0f19;--ad-xconfig-hit-theme-b:#8f1e2a;--ad-xconfig-hit-theme-c:#c94d1f;--ad-xconfig-hit-theme-d:#f5a53f;--ad-xconfig-hit-edge:rgba(255,156,77,.94);--ad-xconfig-hit-glow:rgba(255,123,59,.66);--ad-xconfig-hit-soft-glow:rgba(255,123,59,.3);--ad-xconfig-hit-surface-a:rgba(10,8,14,.98);--ad-xconfig-hit-surface-b:rgba(20,11,15,.96);--ad-xconfig-hit-surface-c:rgba(9,7,10,.99)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-color-theme="ice-circuit"]{--ad-xconfig-hit-theme-a:#0f2948;--ad-xconfig-hit-theme-b:#0f4c73;--ad-xconfig-hit-theme-c:#1487b6;--ad-xconfig-hit-theme-d:#45d6ff;--ad-xconfig-hit-edge:rgba(107,214,255,.94);--ad-xconfig-hit-glow:rgba(89,189,255,.64);--ad-xconfig-hit-soft-glow:rgba(89,189,255,.28);--ad-xconfig-hit-surface-a:rgba(5,11,22,.98);--ad-xconfig-hit-surface-b:rgba(8,17,30,.96);--ad-xconfig-hit-surface-c:rgba(4,9,19,.99)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-color-theme="volt-lime"]{--ad-xconfig-hit-theme-a:#1a3410;--ad-xconfig-hit-theme-b:#2f5f13;--ad-xconfig-hit-theme-c:#57a61d;--ad-xconfig-hit-theme-d:#b3f249;--ad-xconfig-hit-edge:rgba(186,255,83,.95);--ad-xconfig-hit-glow:rgba(150,255,79,.67);--ad-xconfig-hit-soft-glow:rgba(150,255,79,.3);--ad-xconfig-hit-surface-a:rgba(8,12,12,.98);--ad-xconfig-hit-surface-b:rgba(11,19,12,.96);--ad-xconfig-hit-surface-c:rgba(6,11,8,.99)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-color-theme="crimson-steel"]{--ad-xconfig-hit-theme-a:#3d1028;--ad-xconfig-hit-theme-b:#661436;--ad-xconfig-hit-theme-c:#8e2a4f;--ad-xconfig-hit-theme-d:#7796bd;--ad-xconfig-hit-edge:rgba(255,126,166,.92);--ad-xconfig-hit-glow:rgba(244,90,145,.64);--ad-xconfig-hit-soft-glow:rgba(244,90,145,.3);--ad-xconfig-hit-surface-a:rgba(9,10,18,.98);--ad-xconfig-hit-surface-b:rgba(16,13,24,.96);--ad-xconfig-hit-surface-c:rgba(8,9,16,.99)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-color-theme="arctic-mint"]{--ad-xconfig-hit-theme-a:#103241;--ad-xconfig-hit-theme-b:#145266;--ad-xconfig-hit-theme-c:#1e9387;--ad-xconfig-hit-theme-d:#65f3d3;--ad-xconfig-hit-edge:rgba(143,252,235,.93);--ad-xconfig-hit-glow:rgba(102,246,218,.62);--ad-xconfig-hit-soft-glow:rgba(102,246,218,.26);--ad-xconfig-hit-surface-a:rgba(6,13,20,.98);--ad-xconfig-hit-surface-b:rgba(10,18,28,.96);--ad-xconfig-hit-surface-c:rgba(5,11,18,.99)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-color-theme="champagne-night"]{--ad-xconfig-hit-theme-a:#2e2512;--ad-xconfig-hit-theme-b:#5f4a1a;--ad-xconfig-hit-theme-c:#9a7a2e;--ad-xconfig-hit-theme-d:#f1d788;--ad-xconfig-hit-edge:rgba(255,212,130,.94);--ad-xconfig-hit-glow:rgba(255,196,99,.64);--ad-xconfig-hit-soft-glow:rgba(255,196,99,.28);--ad-xconfig-hit-surface-a:rgba(8,10,16,.98);--ad-xconfig-hit-surface-b:rgba(13,14,22,.96);--ad-xconfig-hit-surface-c:rgba(7,8,14,.99)}
${buildColorPreviewRules()}
#${PANEL_HOST_ID} .ad-xconfig-option-item:hover{border-color:rgba(154,227,255,.56);background:rgba(74,178,255,.16)}
#${PANEL_HOST_ID} .ad-xconfig-option-item:focus-visible{outline:none;border-color:rgba(154,227,255,.95);box-shadow:0 0 0 2px rgba(112,196,255,.4)}
#${PANEL_HOST_ID} .ad-xconfig-option-item--color-preview:hover,#${PANEL_HOST_ID} .ad-xconfig-option-item--color-preview:focus-visible{background:linear-gradient(165deg,var(--ad-xconfig-hit-surface-a) 0%,var(--ad-xconfig-hit-surface-b) 48%,var(--ad-xconfig-hit-surface-c) 100%);border-color:color-mix(in srgb,var(--ad-xconfig-hit-edge) 82%,white 18%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),inset 0 -8px 18px rgba(0,0,0,.22),0 0 24px color-mix(in srgb,var(--ad-xconfig-hit-glow) 46%,transparent)}
#${PANEL_HOST_ID} .ad-xconfig-option-item--color-preview[data-feature-key="checkout-target-highlights"][data-setting-key="colorTheme"]{overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06),inset 0 -8px 18px rgba(0,0,0,.22)}
#${PANEL_HOST_ID} .ad-xconfig-option-item--color-preview[data-feature-key="checkout-target-highlights"][data-setting-key="colorTheme"]::before{inset:1px;border-radius:6px;transform:none}
#${PANEL_HOST_ID} .ad-xconfig-option-item--color-preview[data-feature-key="checkout-target-highlights"][data-setting-key="colorTheme"]::after{inset:1px;border-radius:6px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),inset 0 0 18px color-mix(in srgb,var(--ad-xconfig-hit-soft-glow) 58%,transparent)}
#${PANEL_HOST_ID} .ad-xconfig-option-item--color-preview[data-feature-key="checkout-target-highlights"][data-setting-key="colorTheme"]:hover,#${PANEL_HOST_ID} .ad-xconfig-option-item--color-preview[data-feature-key="checkout-target-highlights"][data-setting-key="colorTheme"]:focus-visible{border-color:color-mix(in srgb,var(--ad-xconfig-hit-edge) 82%,white 18%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),inset 0 -8px 18px rgba(0,0,0,.22),inset 0 0 18px color-mix(in srgb,var(--ad-xconfig-hit-glow) 34%,transparent)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect^="active-player-sweep-"]{--ad-xconfig-active-player-sweep-duration:420ms;--ad-xconfig-active-player-sweep-width:45%;--ad-xconfig-active-player-sweep-color:rgba(255,255,255,.35);overflow:hidden}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect^="active-player-sweep-"]::before{inset:0 auto 0 0;width:var(--ad-xconfig-active-player-sweep-width);height:100%;border-radius:0;background:linear-gradient(90deg,rgba(255,255,255,0) 0%,var(--ad-xconfig-active-player-sweep-color) 50%,rgba(255,255,255,0) 100%);transform:translateX(-140%);opacity:0}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect^="active-player-sweep-"]::after{display:none}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="active-player-sweep-fast"]{--ad-xconfig-active-player-sweep-duration:300ms}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="active-player-sweep-standard-speed"]{--ad-xconfig-active-player-sweep-duration:420ms}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="active-player-sweep-slow"]{--ad-xconfig-active-player-sweep-duration:620ms}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="active-player-sweep-subtle"]{--ad-xconfig-active-player-sweep-width:36%;--ad-xconfig-active-player-sweep-color:rgba(255,255,255,.24)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="active-player-sweep-standard-style"]{--ad-xconfig-active-player-sweep-width:45%;--ad-xconfig-active-player-sweep-color:rgba(255,255,255,.35)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="active-player-sweep-strong"]{--ad-xconfig-active-player-sweep-width:58%;--ad-xconfig-active-player-sweep-color:rgba(255,255,255,.48)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect^="active-player-sweep-"]:hover::before,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect^="active-player-sweep-"]:focus-visible::before{opacity:1;animation:ad-xconfig-active-player-sweep-preview var(--ad-xconfig-active-player-sweep-duration) ease-out 1}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="pop-hit"]:hover,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="pop-hit"]:focus-visible{animation:ad-xconfig-effect-preview-emphasis 680ms cubic-bezier(.14,.92,.24,1)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="side-shake"]:hover,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="side-shake"]:focus-visible{animation:ad-xconfig-effect-preview-shake 520ms ease-out}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="glow-pop"]:hover,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="glow-pop"]:focus-visible{animation:ad-xconfig-effect-preview-pulse 700ms ease-out}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="flip-spin"]:hover,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="flip-spin"]:focus-visible{animation:ad-xconfig-effect-preview-turn 860ms ease-out}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="light-sweep"]:hover,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="light-sweep"]:focus-visible{animation:ad-xconfig-effect-preview-sheen 680ms ease-out}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="light-sweep"]:hover::before,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="light-sweep"]:focus-visible::before{animation:ad-xconfig-effect-preview-sheen-light 680ms ease-out}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="shockwave-ring"]:hover,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="shockwave-ring"]:focus-visible{animation:ad-xconfig-effect-preview-shockwave-ring 720ms ease-out}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-jolt"]{--ad-ext-hit-edge:rgba(126,200,255,.94);--ad-ext-hit-glow:rgba(33,150,243,.64);--ad-ext-hit-soft-glow:rgba(33,150,243,.3);--ad-ext-hit-electric-filter-soft:url(#${ELECTRIC_FILTER_SOFT_ID});--ad-ext-hit-electric-filter-strong:url(#${ELECTRIC_FILTER_STRONG_ID})}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-jolt"]:hover,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-jolt"]:focus-visible{overflow:visible;z-index:2;animation:ad-xconfig-hit-row-electric-jolt 780ms cubic-bezier(.14,.92,.24,1)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-jolt"]:hover::before,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-jolt"]:focus-visible::before{inset:-7px;border-radius:calc(8px + 3px);border:1.1px solid color-mix(in srgb,var(--ad-ext-hit-edge) 74%,white 26%);background:linear-gradient(112deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,0) 34%,rgba(255,255,255,0) 66%,rgba(255,255,255,.22) 100%);mix-blend-mode:screen;opacity:.9;transform:translate3d(0,0,0);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),inset 0 0 8px color-mix(in srgb,var(--ad-ext-hit-edge) 18%,transparent),0 0 12px color-mix(in srgb,var(--ad-ext-hit-glow) 42%,white 58%),0 0 24px color-mix(in srgb,var(--ad-ext-hit-soft-glow) 46%,white 54%);filter:var(--ad-ext-hit-electric-filter-strong);animation:ad-xconfig-hit-electric-jolt-frame-electric 760ms steps(4,end),ad-xconfig-hit-electric-jolt-frame-glow 760ms ease-in-out}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-jolt"]:hover::after,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-jolt"]:focus-visible::after{inset:-12px;border-radius:calc(8px + 6px);border:none;opacity:.62;background:radial-gradient(66% 150% at 50% 0%,color-mix(in srgb,var(--ad-ext-hit-edge) 52%,white 48%),transparent 74%),radial-gradient(66% 150% at 50% 100%,color-mix(in srgb,var(--ad-ext-hit-glow) 62%,white 38%),transparent 76%);box-shadow:none;filter:var(--ad-ext-hit-electric-filter-soft) brightness(1.02);animation:ad-xconfig-hit-electric-jolt-frame-aura 760ms ease-out}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-jolt"]:hover .ad-xconfig-option-label,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-jolt"]:focus-visible .ad-xconfig-option-label{display:inline-block;animation:ad-xconfig-hit-score-electric-jolt 760ms cubic-bezier(.14,.92,.24,1)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-jolt"]:hover .ad-xconfig-option-copy,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-jolt"]:focus-visible .ad-xconfig-option-copy{animation:ad-xconfig-hit-segment-electric-jolt 620ms linear}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-active="true"]{border-color:var(--adx-primary);background:var(--adx-raised)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-active="false"] .ad-xconfig-option-label{color:rgba(232,244,255,.92)}
#${PANEL_HOST_ID} .ad-xconfig-option-head{display:flex;align-items:center;justify-content:space-between;gap:.5rem}
#${PANEL_HOST_ID} .ad-xconfig-option-label{font-size:.75rem;font-weight:700;color:#fff}
#${PANEL_HOST_ID} .ad-xconfig-font-picker{margin:.55rem 0 0}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-current{list-style:none;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;min-height:64px;padding:12px;border-radius:8px;border:1px solid var(--adx-border);background:var(--adx-raised);cursor:pointer}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-current::-webkit-details-marker{display:none}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-current::marker{content:""}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-current:hover{border-color:var(--adx-primary);background:var(--adx-secondary)}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-current:focus-visible{outline:2px solid var(--adx-primary);outline-offset:3px}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-current-identity{min-width:0;display:grid;gap:.18rem}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-current-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:1.08rem;line-height:1.15;color:#f3f8ff}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-current-state{font-size:12px;font-weight:600;color:var(--adx-muted)}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-current-preview{min-width:0;grid-column:1/-1;grid-row:2;display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:end;gap:8px;color:var(--adx-text);font-weight:800}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-current-preview span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.92rem;letter-spacing:.04em}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-current-preview span:nth-child(2){font-size:1.5rem;line-height:1;font-variant-numeric:tabular-nums}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-current-preview span:last-child{font-size:.82rem;color:rgba(202,225,255,.82)}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-current-action{display:inline-flex;align-items:center;gap:.35rem;font-size:.76rem;font-weight:700;color:rgba(205,225,250,.86);white-space:nowrap}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-current-action::after{content:"⌄";font-size:1rem;line-height:1;transition:transform 140ms ease}
#${PANEL_HOST_ID} .ad-xconfig-font-picker[open] .ad-xconfig-font-picker-current-action::after{transform:rotate(180deg)}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-panel{margin-top:.5rem;padding:.85rem;border-radius:11px;border:1px solid rgba(255,255,255,.16);background:linear-gradient(155deg,rgba(31,48,91,.98),rgba(18,30,68,.98));box-shadow:0 14px 34px rgba(3,8,24,.28)}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-title{display:block;font-size:.92rem;color:#f3f8ff}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-search{width:100%;min-height:2.65rem;margin-top:.65rem;padding:.6rem .78rem;border-radius:9px;border:1px solid rgba(255,255,255,.18);background:rgba(7,15,38,.48);color:#fff;font:inherit}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-search::placeholder{color:rgba(203,220,245,.56)}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-search:focus-visible{outline:none;border-color:rgba(154,227,255,.95);box-shadow:0 0 0 2px rgba(112,196,255,.28)}
#${PANEL_HOST_ID} .ad-xconfig-font-option-list{grid-template-columns:minmax(0,1fr);max-height:min(28rem,55vh);overflow:auto;padding-right:4px}
#${PANEL_HOST_ID} .ad-xconfig-option-item--typography-font{min-width:0;min-height:3.35rem;padding:.55rem .7rem;border-radius:9px}
#${PANEL_HOST_ID} .ad-xconfig-font-option-layout{display:grid;grid-template-columns:minmax(0,1fr) auto 1rem;align-items:center;gap:.55rem;width:100%}
#${PANEL_HOST_ID} .ad-xconfig-option-item--typography-font .ad-xconfig-option-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.94rem;line-height:1.15;font-weight:600;letter-spacing:.01em}
#${PANEL_HOST_ID} .ad-xconfig-font-option-sample{font-size:1.2rem;line-height:1;font-weight:700;font-variant-numeric:tabular-nums;color:rgba(243,249,255,.96)}
#${PANEL_HOST_ID} .ad-xconfig-font-option-active-slot{display:grid;place-items:center;width:1rem;min-height:1rem}
#${PANEL_HOST_ID} .ad-xconfig-font-option-check{display:inline-grid;place-items:center;width:1rem;height:1rem;padding:0;border:0;background:transparent;color:#5cecff;font-size:1rem;line-height:1}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-empty{margin:.7rem 0 .1rem;padding:.65rem;border-radius:8px;background:rgba(255,255,255,.05);text-align:center;color:rgba(221,234,252,.76);font-size:.8rem}
#${PANEL_HOST_ID} .ad-xconfig-font-picker-empty[hidden]{display:none}
#${PANEL_HOST_ID} .ad-xconfig-option-active{display:inline-flex;align-items:center;padding:.12rem .38rem;border-radius:999px;background:rgba(126,216,255,.22);border:1px solid rgba(126,216,255,.48);font-size:.66rem;font-weight:700;letter-spacing:.01em;color:#eef8ff}
#${PANEL_HOST_ID} .ad-xconfig-option-copy{display:block;margin-top:.18rem;color:rgba(228,240,255,.88);font-size:.74rem;line-height:1.34}
#${PANEL_HOST_ID} .ad-xconfig-option-item--turn-score-counter-preview{overflow:hidden;isolation:isolate}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--turn-score-counter{display:grid;grid-template-columns:minmax(0,1fr) auto auto;grid-template-rows:auto auto;align-items:center;column-gap:.6rem;row-gap:.14rem;min-height:2.85rem}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--turn-score-counter .ad-xconfig-option-label{grid-column:1;grid-row:1;min-width:0}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--turn-score-counter .ad-xconfig-option-copy{grid-column:1;grid-row:2;min-width:0}
#${PANEL_HOST_ID} .ad-xconfig-turn-score-option-preview{grid-column:2;grid-row:1/span 2;position:relative;display:grid;place-items:center;align-self:stretch;min-width:4.55rem;min-height:2.65rem;padding:.18rem .42rem;border-radius:8px}
#${PANEL_HOST_ID} .ad-xconfig-turn-score-option-preview .${TURN_SCORE_PREVIEW_SCORE_CLASS}{display:inline-block;color:rgba(255,246,220,.98);font-weight:900;font-size:1.62rem;line-height:.95;font-variant-numeric:tabular-nums;text-shadow:0 1px 0 rgba(0,0,0,.44),0 0 12px rgba(255,190,105,.24)}
#${PANEL_HOST_ID} .${TURN_SCORE_PREVIEW_SCORE_CLASS}.${SCORE_FLASH_CLASS}[${SCORE_FLASH_SEQUENCE_ATTRIBUTE}="0"]{animation:ad-ext-turn-score-counter-flash-a 390ms cubic-bezier(.16,.92,.24,1) both;will-change:transform,filter,text-shadow,opacity}
#${PANEL_HOST_ID} .${TURN_SCORE_PREVIEW_SCORE_CLASS}.${SCORE_FLASH_CLASS}[${SCORE_FLASH_SEQUENCE_ATTRIBUTE}="1"]{animation:ad-ext-turn-score-counter-flash-b 390ms cubic-bezier(.16,.92,.24,1) both;will-change:transform,filter,text-shadow,opacity}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--turn-score-counter [data-option-active-slot='true']{grid-column:3;grid-row:1;display:flex;align-self:start;justify-content:flex-end;min-width:0;min-height:1rem}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--turn-score-counter [data-option-active-slot='true']:empty{display:none}
#${PANEL_HOST_ID} .ad-xconfig-option-item--avg-trend-arrow-preview{overflow:hidden;isolation:isolate}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--avg-trend-arrow{display:grid;grid-template-columns:minmax(0,1fr) auto auto;grid-template-rows:auto auto;align-items:center;column-gap:.68rem;row-gap:.14rem;min-height:2.85rem}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--avg-trend-arrow .ad-xconfig-option-text{grid-column:1;grid-row:1/span 2;min-width:0;display:grid;gap:.14rem}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--avg-trend-arrow .ad-xconfig-option-copy{margin-top:0}
#${PANEL_HOST_ID} .${AVG_TREND_PREVIEW_CLASS}{grid-column:2;grid-row:1/span 2;display:grid;place-items:center;min-width:3.6rem;min-height:2.4rem}
#${PANEL_HOST_ID} .${AVG_TREND_ARROW_CLASS}{${AVG_TREND_ARROW_MARGIN_LEFT_VAR}:0px;${AVG_TREND_ARROW_HALF_WIDTH_VAR}:5px;${AVG_TREND_ARROW_HEIGHT_VAR}:8px;display:inline-block;width:0;height:0;margin-left:var(${AVG_TREND_ARROW_MARGIN_LEFT_VAR});vertical-align:middle;opacity:0;transition:opacity 120ms ease-out}
#${PANEL_HOST_ID} .${AVG_TREND_VISIBLE_CLASS}{opacity:1}
#${PANEL_HOST_ID} .${AVG_TREND_UP_CLASS}{border-left:var(${AVG_TREND_ARROW_HALF_WIDTH_VAR}) solid transparent;border-right:var(${AVG_TREND_ARROW_HALF_WIDTH_VAR}) solid transparent;border-bottom:var(${AVG_TREND_ARROW_HEIGHT_VAR}) solid #9fdb58}
#${PANEL_HOST_ID} .${AVG_TREND_DOWN_CLASS}{border-left:var(${AVG_TREND_ARROW_HALF_WIDTH_VAR}) solid transparent;border-right:var(${AVG_TREND_ARROW_HALF_WIDTH_VAR}) solid transparent;border-top:var(${AVG_TREND_ARROW_HEIGHT_VAR}) solid #f87171}
#${PANEL_HOST_ID} .${AVG_TREND_ANIMATE_CLASS}{animation:ad-ext-avg-bounce var(--ad-xconfig-avg-trend-preview-duration,320ms) ease-out 1}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--avg-trend-arrow [data-option-active-slot='true']{grid-column:3;grid-row:1;display:flex;align-self:start;justify-content:flex-end;min-width:0;min-height:1rem}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--avg-trend-arrow [data-option-active-slot='true']:empty{display:none}
#${PANEL_HOST_ID} .ad-xconfig-option-item--dartboard-marker-highlight-preview{overflow:hidden;isolation:isolate}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--dartboard-marker-highlight{display:grid;grid-template-columns:minmax(0,1fr) auto auto;grid-template-rows:auto auto;align-items:center;column-gap:.68rem;row-gap:.14rem;min-height:2.85rem}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--dartboard-marker-highlight .ad-xconfig-option-text{grid-column:1;grid-row:1/span 2;min-width:0;display:grid;gap:.14rem}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--dartboard-marker-highlight .ad-xconfig-option-copy{margin-top:0}
#${PANEL_HOST_ID} .${DARTBOARD_MARKER_HIGHLIGHT_PREVIEW_CLASS}{grid-column:2;grid-row:1/span 2;display:grid;place-items:center;width:3.1rem;height:2.35rem}
#${PANEL_HOST_ID} .${DARTBOARD_MARKER_HIGHLIGHT_PREVIEW_CLASS} svg{display:block;width:2.35rem;height:2.35rem;overflow:visible}
#${PANEL_HOST_ID} .ad-xconfig-dartboard-marker-highlight-board-dot{fill:rgba(7,14,30,.66);stroke:rgba(255,255,255,.16);stroke-width:1}
#${PANEL_HOST_ID} .${DARTBOARD_MARKER_HIGHLIGHT_BASE_CLASS}{transform-box:fill-box;transform-origin:center}
#${PANEL_HOST_ID} .${DARTBOARD_MARKER_HIGHLIGHT_EFFECT_CLASSES["size-pulse"]}{animation:ad-ext-dart-marker-pulse 1600ms ease-in-out infinite}
#${PANEL_HOST_ID} .${DARTBOARD_MARKER_HIGHLIGHT_EFFECT_CLASSES["soft-glow"]}{animation:ad-ext-dart-marker-glow 1800ms ease-in-out infinite}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--dartboard-marker-highlight [data-option-active-slot='true']{grid-column:3;grid-row:1;display:flex;align-self:start;justify-content:flex-end;min-width:0;min-height:1rem}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--dartboard-marker-highlight [data-option-active-slot='true']:empty{display:none}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--dart-design{display:grid;grid-template-columns:minmax(0,1fr) 4.2rem auto;grid-template-rows:auto auto;align-items:center;column-gap:.5rem;row-gap:.14rem}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--dart-design .ad-xconfig-option-text{grid-column:1;grid-row:1/span 2;min-width:0}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--dart-design .ad-xconfig-option-head{display:block}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--dart-design .ad-xconfig-option-copy{margin-top:.12rem}
#${PANEL_HOST_ID} .ad-xconfig-option-preview{grid-column:2;grid-row:1/span 2;width:3.9rem;height:1.62rem;object-fit:contain;justify-self:center;align-self:center;opacity:.96;filter:drop-shadow(0 2px 3px rgba(4,10,26,.35))}
#${PANEL_HOST_ID} .ad-xconfig-turn-dart-asset-option-list .ad-xconfig-option-layout--dart-design{grid-template-columns:minmax(0,1fr) minmax(0,120px) auto}
#${PANEL_HOST_ID} .ad-xconfig-turn-dart-asset-option-list .ad-xconfig-option-preview{width:120px;max-width:100%;height:40px;object-fit:contain;object-position:right center;justify-self:end}
#${PANEL_HOST_ID} .ad-xconfig-option-active-slot{grid-column:3;grid-row:1;display:flex;justify-content:flex-end;align-self:start;min-height:1rem}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--dart-design .ad-xconfig-option-active{margin-left:.2rem;white-space:nowrap}
#${PANEL_HOST_ID} .ad-xconfig-setting-row--checkout-suggestion-preview{padding:.65rem}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-preview-surface{display:grid;place-items:center;min-height:7.2rem;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:radial-gradient(circle at 50% 0%,rgba(126,216,255,.14),rgba(7,14,30,.58) 58%,rgba(5,10,25,.72));padding:1rem}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo{position:relative;isolation:isolate;overflow:visible;border-radius:14px;width:min(100%,19rem);min-height:4.9rem;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:end;gap:.7rem;padding:1.9rem 1rem .8rem;color:#fff;font-family:var(--adx-body);box-sizing:border-box}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo>*{position:relative;z-index:1}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo-label{position:absolute;top:6px;left:8px;padding:5px 12px;border-radius:999px;background:var(--ad-ext-label-bg);color:var(--ad-ext-label-color);font-size:12px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;border:1px solid rgba(15,12,5,.55);box-shadow:0 2px 10px rgba(0,0,0,.45),0 0 0 2px rgba(15,12,5,.6);text-shadow:0 1px 0 rgba(255,255,255,.35);pointer-events:none;z-index:2}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo-score{font-size:1.45rem;font-weight:900;line-height:1;font-variant-numeric:tabular-nums;text-shadow:0 1px 0 rgba(0,0,0,.45)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo-route{min-width:0;font-size:.86rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:rgba(255,255,255,.88)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo--badge{outline:2px dashed var(--ad-ext-accent);outline-offset:-6px;background:var(--ad-ext-accent-soft);box-shadow:0 10px 20px rgba(0,0,0,.2)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo--ribbon{background:linear-gradient(135deg,var(--ad-ext-accent-soft),rgba(255,255,255,0));box-shadow:0 0 0 2px var(--ad-ext-accent) inset,0 0 18px var(--ad-ext-accent-strong)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo--ribbon .ad-xconfig-checkout-suggestion-demo-label{transform:rotate(-6deg);transform-origin:left center}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo--ribbon::after{content:"";position:absolute;inset:-4px;border-radius:inherit;box-shadow:0 0 24px var(--ad-ext-accent-strong);opacity:.35;pointer-events:none;z-index:0}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo--stripe{background:var(--ad-ext-accent-soft);box-shadow:0 0 0 2px var(--ad-ext-accent) inset,0 12px 22px rgba(0,0,0,.22)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo--stripe::after{content:"";position:absolute;inset:2px;border-radius:inherit;background:repeating-linear-gradient(45deg,var(--ad-ext-accent-strong),var(--ad-ext-accent-strong) 6px,transparent 6px,transparent 12px);opacity:.35;pointer-events:none;z-index:0}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo--ticket{background:linear-gradient(135deg,var(--ad-ext-accent-soft),rgba(255,255,255,.08));box-shadow:0 0 0 2px var(--ad-ext-accent) inset,0 14px 26px rgba(0,0,0,.24)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo--ticket::after{content:"";position:absolute;left:14px;right:14px;top:50%;border-top:2px dashed rgba(255,255,255,.55);opacity:.65;pointer-events:none;z-index:0}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo--outline{outline:3px solid var(--ad-ext-accent);outline-offset:-6px;background:rgba(10,18,40,.82);box-shadow:0 0 0 2px rgba(255,255,255,.25) inset,0 12px 24px rgba(0,0,0,.2)}
#${PANEL_HOST_ID} .ad-xconfig-option-item--checkout-suggestion-style{overflow:visible}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-suggestion-style{display:grid;grid-template-columns:minmax(0,1fr) minmax(7.4rem,8.6rem) auto;grid-template-rows:auto auto;align-items:center;column-gap:.62rem;row-gap:.14rem}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-suggestion-style .ad-xconfig-option-text{grid-column:1;grid-row:1/span 2;min-width:0}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-suggestion-style .ad-xconfig-option-head{display:block}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-suggestion-style .ad-xconfig-option-copy{margin-top:.12rem}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-option-preview{grid-column:2;grid-row:1/span 2;display:grid;place-items:center;min-height:3.4rem;padding:.28rem;border-radius:8px;background:rgba(7,14,30,.46)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo--mini{width:100%;min-height:2.9rem;grid-template-columns:auto minmax(0,1fr);gap:.35rem;padding:1.16rem .52rem .42rem;border-radius:9px}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo--mini .ad-xconfig-checkout-suggestion-demo-score{font-size:.92rem}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo--mini .ad-xconfig-checkout-suggestion-demo-route{font-size:.58rem;letter-spacing:.08em}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo--mini .ad-xconfig-checkout-suggestion-demo-label{top:3px;left:5px;padding:2px 6px;font-size:7px}
#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-demo--mini.ad-xconfig-checkout-suggestion-demo--ticket::after{left:8px;right:8px;border-top-width:1px}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-suggestion-style [data-option-active-slot='true']{grid-column:3;grid-row:1;display:flex;align-self:start;justify-content:flex-end;min-width:0;min-height:1rem}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-suggestion-style [data-option-active-slot='true']:empty{display:none}
#${PANEL_HOST_ID} .ad-xconfig-setting-row--checkout-score-highlight-preview{padding:.72rem}
#${PANEL_HOST_ID} .ad-xconfig-checkout-score-highlight-preview-surface{display:grid;gap:.72rem;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(135deg,rgba(7,14,30,.74),rgba(15,23,42,.58));padding:1rem}
#${PANEL_HOST_ID} .ad-xconfig-checkout-score-highlight-preview-head{display:flex;align-items:flex-end;justify-content:space-between;gap:.75rem;color:rgba(255,255,255,.92)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-score-highlight-preview-title{font-weight:900;font-size:.88rem;letter-spacing:.05em;text-transform:uppercase;color:rgba(196,230,255,.96)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-score-highlight-preview-hint{font-size:.78rem;font-weight:800;color:rgba(255,255,255,.66);white-space:nowrap}
#${PANEL_HOST_ID} .ad-xconfig-checkout-score-highlight-preview-card{display:grid;gap:.56rem;min-height:6.4rem;padding:.78rem .9rem;border-radius:9px;border:1px solid rgba(255,255,255,.13);background:linear-gradient(158deg,rgba(9,16,34,.9),rgba(18,31,56,.72));box-shadow:inset 0 0 0 1px rgba(255,255,255,.04)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-score-highlight-preview-card--mini{min-height:3.4rem;width:8.2rem;max-width:100%;gap:.28rem;padding:.45rem .5rem}
#${PANEL_HOST_ID} .ad-xconfig-checkout-score-highlight-preview-player{display:flex;align-items:center;justify-content:space-between;gap:.55rem;min-width:0}
#${PANEL_HOST_ID} .ad-xconfig-checkout-score-highlight-preview-name{font-size:.74rem;font-weight:900;letter-spacing:.05em;color:rgba(238,246,255,.92);white-space:nowrap}
#${PANEL_HOST_ID} .ad-xconfig-checkout-score-highlight-preview-context{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.68rem;font-weight:800;color:rgba(196,230,255,.82)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-score-highlight-preview-score-row{display:flex;align-items:center;justify-content:space-between;gap:.8rem;min-width:0}
#${PANEL_HOST_ID} .ad-xconfig-checkout-score-highlight-score{color:rgba(var(--ad-ext-checkout-pulse-color),1);font-size:2.35rem;font-weight:950;line-height:1;font-variant-numeric:tabular-nums;text-shadow:0 0 4px rgba(var(--ad-ext-checkout-pulse-color),.28)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-score-highlight-score--mini{font-size:1.35rem}
#${PANEL_HOST_ID} .ad-xconfig-checkout-score-highlight-preview-route{display:inline-flex;align-items:center;justify-content:center;min-width:2.8rem;min-height:1.72rem;border-radius:7px;border:1px solid rgba(var(--ad-ext-checkout-pulse-color),.5);background:rgba(var(--ad-ext-checkout-pulse-color),.14);color:rgba(244,250,255,.96);font-size:.82rem;font-weight:900;letter-spacing:.05em}
#${PANEL_HOST_ID} .ad-xconfig-checkout-score-highlight-preview-card--mini .ad-xconfig-checkout-score-highlight-preview-route{min-width:2.2rem;min-height:1.35rem;font-size:.68rem}
#${PANEL_HOST_ID} .ad-xconfig-option-item--checkout-score-highlight-preview{overflow:visible}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-score-highlight-preview{display:grid;grid-template-columns:minmax(0,1fr) minmax(7.6rem,8.4rem) auto;grid-template-rows:auto auto;align-items:center;column-gap:.62rem;row-gap:.14rem;width:100%}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-score-highlight-preview .ad-xconfig-option-text{grid-column:1;grid-row:1/span 2;min-width:0}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-score-highlight-preview .ad-xconfig-option-head{display:block}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-score-highlight-preview .ad-xconfig-option-copy{margin-top:.12rem}
#${PANEL_HOST_ID} .ad-xconfig-checkout-score-highlight-option-preview{grid-column:2;grid-row:1/span 2;display:grid;place-items:center;min-width:7.6rem;min-height:3.9rem;padding:.24rem;border-radius:8px;background:rgba(7,14,30,.46);overflow:hidden}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-score-highlight-preview [data-option-active-slot='true']{grid-column:3;grid-row:1;display:flex;align-self:start;justify-content:flex-end;min-width:0;min-height:1rem}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-score-highlight-preview [data-option-active-slot='true']:empty{display:none}
#${PANEL_HOST_ID} .ad-xconfig-setting-row--checkout-board-preview{padding:.72rem}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-surface{display:grid;gap:.72rem;min-height:12rem;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(135deg,rgba(7,14,30,.74),rgba(15,23,42,.58));padding:1rem}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-head{display:flex;align-items:flex-end;justify-content:space-between;gap:.75rem;color:rgba(255,255,255,.92)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-title{font-weight:900;font-size:.88rem;letter-spacing:.05em;text-transform:uppercase;color:rgba(196,230,255,.96)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-route{font-size:.78rem;font-weight:800;color:rgba(255,255,255,.66);white-space:nowrap}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-board-wrap{display:grid;place-items:center;min-height:12.4rem;border-radius:9px;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.08),rgba(2,6,23,.3) 42%,rgba(2,6,23,.64));overflow:hidden}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-board{width:min(100%,15.5rem);height:auto;display:block;overflow:visible}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-board--mini{width:7.2rem;max-height:7.2rem}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-sector-svg{width:7.7rem;height:auto;display:block;overflow:visible}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-sector{fill:rgba(15,23,42,.42)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-sector:nth-child(odd){fill:rgba(241,245,249,.14)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-band--red{fill:rgba(127,29,29,.52)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-band--green{fill:rgba(20,83,45,.56)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-ring{fill:none;stroke:rgba(226,232,240,.18);stroke-width:.6}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-bull--outer{fill:rgba(21,128,61,.72)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-bull--inner{fill:rgba(185,28,28,.72)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-sector-part{stroke:rgba(226,232,240,.12);stroke-width:.7}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-sector-part--single{fill:rgba(30,41,59,.72)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-sector-part--triple{fill:rgba(21,128,61,.58)}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-preview-sector-part--double{fill:rgba(127,29,29,.58)}
#${PANEL_HOST_ID} .ad-xconfig-option-item--checkout-board-preview{overflow:visible}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-board-preview{display:grid;grid-template-columns:minmax(0,1fr) minmax(7.7rem,8.3rem) auto;grid-template-rows:auto auto;align-items:center;column-gap:.62rem;row-gap:.14rem;width:100%}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-board-preview .ad-xconfig-option-text{grid-column:1;grid-row:1/span 2;min-width:0}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-board-preview .ad-xconfig-option-head{display:block}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-board-preview .ad-xconfig-option-copy{margin-top:.12rem}
#${PANEL_HOST_ID} .ad-xconfig-checkout-board-option-preview{grid-column:2;grid-row:1/span 2;display:grid;place-items:center;min-width:7.7rem;min-height:4.2rem;padding:.26rem;border-radius:8px;background:rgba(7,14,30,.46);overflow:hidden}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-board-preview [data-option-active-slot='true']{grid-column:3;grid-row:1;display:flex;align-self:start;justify-content:flex-end;min-width:0;min-height:1rem}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-board-preview [data-option-active-slot='true']:empty{display:none}
#${PANEL_HOST_ID} .ad-xconfig-setting-row--x01-remaining-score-bar-preview{padding:.72rem}
#${PANEL_HOST_ID} .ad-xconfig-x01-remaining-score-bar-preview-surface{display:grid;gap:.72rem;min-height:7rem;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(135deg,rgba(7,14,30,.74),rgba(15,23,42,.58));padding:1rem}
#${PANEL_HOST_ID} .ad-xconfig-x01-remaining-score-bar-preview-head{display:flex;align-items:flex-end;justify-content:space-between;gap:.75rem;color:rgba(255,255,255,.92)}
#${PANEL_HOST_ID} .ad-xconfig-x01-remaining-score-bar-preview-score{font-size:1.55rem;font-weight:900;line-height:1;font-variant-numeric:tabular-nums}
#${PANEL_HOST_ID} .ad-xconfig-x01-remaining-score-bar-preview-route{font-size:.78rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.7);white-space:nowrap}
#${PANEL_HOST_ID} .ad-xconfig-x01-remaining-score-bar-preview-host{margin-top:0!important;grid-column:auto!important;grid-row:auto!important;order:0!important;flex:0 0 auto!important}
#${PANEL_HOST_ID} .ad-xconfig-x01-remaining-score-bar-preview-host.ad-ext-x01-remaining-score-bar--active{--ad-ext-x01-remaining-score-bar-margin-top-active:0}
#${PANEL_HOST_ID} .ad-xconfig-x01-remaining-score-bar-preview-host--main{width:100%}
#${PANEL_HOST_ID} .ad-xconfig-x01-remaining-score-bar-preview-host--mini{width:8.6rem;max-width:100%;align-self:center}
#${PANEL_HOST_ID} .ad-xconfig-x01-remaining-score-bar-preview-host--mini.ad-ext-x01-remaining-score-bar--size-schmal{--ad-ext-x01-remaining-score-bar-height-active:5px}
#${PANEL_HOST_ID} .ad-xconfig-x01-remaining-score-bar-preview-host--mini.ad-ext-x01-remaining-score-bar--size-standard{--ad-ext-x01-remaining-score-bar-height-active:10px}
#${PANEL_HOST_ID} .ad-xconfig-x01-remaining-score-bar-preview-host--mini.ad-ext-x01-remaining-score-bar--size-breit{--ad-ext-x01-remaining-score-bar-height-active:16px}
#${PANEL_HOST_ID} .ad-xconfig-x01-remaining-score-bar-preview-host--mini.ad-ext-x01-remaining-score-bar--size-extrabreit{--ad-ext-x01-remaining-score-bar-height-active:22px}
#${PANEL_HOST_ID} .ad-xconfig-option-item--x01-remaining-score-bar-preview{overflow:visible}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--x01-remaining-score-bar-preview{display:grid;grid-template-columns:minmax(0,1fr) minmax(7.2rem,8.8rem) auto;grid-template-rows:auto auto;align-items:center;column-gap:.62rem;row-gap:.14rem}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--x01-remaining-score-bar-preview .ad-xconfig-option-text{grid-column:1;grid-row:1/span 2;min-width:0}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--x01-remaining-score-bar-preview .ad-xconfig-option-head{display:block}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--x01-remaining-score-bar-preview .ad-xconfig-option-copy{margin-top:.12rem}
#${PANEL_HOST_ID} .ad-xconfig-x01-remaining-score-bar-option-preview{grid-column:2;grid-row:1/span 2;display:grid;align-items:center;min-height:3rem;padding:.32rem;border-radius:8px;background:rgba(7,14,30,.46)}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--x01-remaining-score-bar-preview [data-option-active-slot='true']{grid-column:3;grid-row:1;display:flex;align-self:start;justify-content:flex-end;min-width:0;min-height:1rem}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--x01-remaining-score-bar-preview [data-option-active-slot='true']:empty{display:none}
#${PANEL_HOST_ID} .ad-xconfig-empty{border-radius:10px;border:1px dashed rgba(255,255,255,.3);background:rgba(255,255,255,.03);padding:1rem;color:rgba(255,255,255,.75);font-size:.88rem}
#${PANEL_HOST_ID} .ad-xconfig-modal-backdrop{position:fixed;inset:0;z-index:40;background:rgba(1,4,11,.72);display:flex;align-items:center;justify-content:center;padding:16px}
#${PANEL_HOST_ID} .ad-xconfig-modal{box-sizing:border-box;width:min(704px,100%);max-height:calc(100dvh - 32px);overflow:auto;overscroll-behavior:contain;border-radius:12px;border:1px solid var(--adx-border);background:var(--adx-surface);padding:0 24px 24px;color:var(--adx-text)}
#${PANEL_HOST_ID} .ad-xconfig-modal-header{position:sticky;top:0;z-index:3;display:flex;justify-content:space-between;gap:16px;padding:24px 0 16px;background:var(--adx-surface);border-bottom:1px solid var(--adx-border)}
#${PANEL_HOST_ID} .ad-xconfig-modal-actions{display:flex;align-items:flex-start;gap:.55rem}
#${PANEL_HOST_ID} .ad-xconfig-modal-title{margin:0;font:24px/1.2 var(--adx-display);overflow-wrap:anywhere}
#${PANEL_HOST_ID} .ad-xconfig-modal-subtitle{margin:8px 0 0;color:var(--adx-subtle);font-size:12px}
#${PANEL_HOST_ID} .ad-xconfig-transfer-dialog{width:min(704px,100%);display:grid;gap:16px;padding:24px}
#${PANEL_HOST_ID} .ad-xconfig-transfer-copy{margin:0;color:rgba(235,243,255,.88);font-size:.86rem;line-height:1.45}
#${PANEL_HOST_ID} .ad-xconfig-transfer-option{display:flex;align-items:center;gap:8px;padding:16px;border-radius:8px;border:1px solid var(--adx-border);background:var(--adx-raised);font-size:14px;font-weight:600;cursor:pointer}
#${PANEL_HOST_ID} .ad-xconfig-transfer-option input{width:18px;height:18px;accent-color:var(--adx-primary)}
#${PANEL_HOST_ID} .ad-xconfig-transfer-source{margin:0;color:rgba(220,234,250,.72);font-size:.76rem;line-height:1.4}
#${PANEL_HOST_ID} .ad-xconfig-transfer-modes{display:flex;flex-wrap:wrap;gap:.5rem}
#${PANEL_HOST_ID} .ad-xconfig-transfer-modes .ad-xconfig-btn[data-active="true"]{border-color:var(--adx-primary);background:var(--adx-primary)}
#${PANEL_HOST_ID} .ad-xconfig-transfer-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.45rem}
#${PANEL_HOST_ID} .ad-xconfig-transfer-stat{padding:.5rem .58rem;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);font-size:.78rem;font-weight:700}
#${PANEL_HOST_ID} .ad-xconfig-transfer-ok{margin:0;padding:.58rem .68rem;border-radius:8px;border:1px solid rgba(58,180,122,.5);background:rgba(58,180,122,.14);color:rgba(184,255,216,.98);font-size:.8rem}
#${PANEL_HOST_ID} .ad-xconfig-transfer-issue-groups{max-height:15rem;overflow:auto;display:grid;gap:.65rem;padding-right:.2rem}
#${PANEL_HOST_ID} .ad-xconfig-transfer-issue-group{display:grid;gap:.28rem}
#${PANEL_HOST_ID} .ad-xconfig-transfer-issue-title{margin:0;font-size:.75rem;color:rgba(235,243,255,.94)}
#${PANEL_HOST_ID} .ad-xconfig-transfer-issues{margin:0;padding:.1rem 0 .1rem 1.25rem;display:grid;gap:.42rem;font-size:.78rem;line-height:1.4}
#${PANEL_HOST_ID} .ad-xconfig-transfer-issue--fatal,#${PANEL_HOST_ID} .ad-xconfig-transfer-issue--skipped{color:rgba(255,202,202,.98)}
#${PANEL_HOST_ID} .ad-xconfig-transfer-issue--migrated,#${PANEL_HOST_ID} .ad-xconfig-transfer-issue--warning{color:rgba(187,232,255,.98)}
#${PANEL_HOST_ID} .ad-xconfig-transfer-actions{justify-content:flex-end;margin-top:.15rem}
#${PANEL_HOST_ID} .ad-xconfig-transfer-actions .ad-xconfig-btn:disabled{opacity:.5;cursor:not-allowed}
#${PANEL_HOST_ID} .ad-xconfig-modal-body{margin-top:16px;display:grid;gap:16px}
#${PANEL_HOST_ID} .ad-xconfig-settings-section{display:grid;gap:.65rem}
#${PANEL_HOST_ID} .ad-xconfig-settings-section + .ad-xconfig-settings-section{margin-top:.15rem}
#${PANEL_HOST_ID} .ad-xconfig-settings-section-title{margin:0;font:24px/1.2 var(--adx-display);color:var(--adx-text)}
#${PANEL_HOST_ID} .ad-xconfig-settings-section-body{display:grid;gap:.65rem}
#${PANEL_HOST_ID} .ad-xconfig-settings-section-body--theme-presets{grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem}
#${PANEL_HOST_ID} .ad-xconfig-setting-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);align-items:start;gap:16px;padding:16px 0;border-bottom:1px solid var(--adx-border)}
#${PANEL_HOST_ID} .ad-xconfig-setting-row--theme-preset{min-width:0;padding:0;border:0;background:transparent}
#${PANEL_HOST_ID} .ad-xconfig-setting-row--debug{background:transparent}
#${PANEL_HOST_ID} .ad-xconfig-setting-label{display:block;font:700 14px/1.5 var(--adx-body);color:var(--adx-text)}
#${PANEL_HOST_ID} .ad-xconfig-setting-input{min-width:0}
#${PANEL_HOST_ID} .ad-xconfig-color-field{display:grid;gap:.45rem}
#${PANEL_HOST_ID} .ad-xconfig-color-controls{display:grid;grid-template-columns:auto auto minmax(0,1fr) auto;align-items:center;gap:.55rem}
#${PANEL_HOST_ID} .ad-xconfig-color-swatch{width:2.35rem;height:2.35rem;border-radius:10px;border:1px solid rgba(255,255,255,.24);background:transparent;background-image:linear-gradient(45deg,rgba(255,255,255,.12) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.12) 50%,rgba(255,255,255,.12) 75%,transparent 75%,transparent);background-size:.7rem .7rem;box-shadow:inset 0 0 0 1px rgba(9,16,34,.42)}
#${PANEL_HOST_ID} .ad-xconfig-color-picker{appearance:none;width:2.6rem;min-width:2.6rem;height:2.35rem;padding:0;border-radius:10px;border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.08);cursor:pointer}
#${PANEL_HOST_ID} .ad-xconfig-color-picker::-webkit-color-swatch-wrapper{padding:.18rem}
#${PANEL_HOST_ID} .ad-xconfig-color-picker::-webkit-color-swatch{border:none;border-radius:7px}
#${PANEL_HOST_ID} .ad-xconfig-color-code{width:100%;min-height:2.35rem;padding:.58rem .72rem;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(9,16,34,.58);color:#fff;font:inherit;text-transform:uppercase}
#${PANEL_HOST_ID} .ad-xconfig-color-code::placeholder{color:rgba(214,229,245,.48);text-transform:none}
#${PANEL_HOST_ID} .ad-xconfig-color-code:focus-visible,#${PANEL_HOST_ID} .ad-xconfig-color-picker:focus-visible{outline:none;border-color:rgba(154,227,255,.95);box-shadow:0 0 0 2px rgba(112,196,255,.3)}
#${PANEL_HOST_ID} .ad-xconfig-mini-btn--color-reset:disabled{opacity:.45;cursor:not-allowed}
#${PANEL_HOST_ID} .ad-xconfig-color-field[data-invalid="true"] .ad-xconfig-color-code{border-color:rgba(255,128,128,.72);box-shadow:0 0 0 1px rgba(255,128,128,.16) inset}
#${PANEL_HOST_ID} .ad-xconfig-color-status{margin:.05rem 0 0}
#${PANEL_HOST_ID} .ad-xconfig-color-status--error{color:rgba(255,198,198,.98)}
#${PANEL_HOST_ID} .ad-xconfig-text-field{display:grid;gap:.35rem}
#${PANEL_HOST_ID} .ad-xconfig-text-input{width:100%;min-height:2.55rem;border:1px solid rgba(255,255,255,.26);border-radius:10px;padding:.5rem .7rem;background:rgba(7,14,30,.72);color:#fff;font:inherit;font-size:.86rem}
#${PANEL_HOST_ID} .ad-xconfig-text-input:focus{outline:none;border-color:rgba(154,227,255,.95);box-shadow:0 0 0 2px rgba(112,196,255,.24)}
#${PANEL_HOST_ID} .ad-xconfig-setting-action{display:grid;gap:.45rem}
#${PANEL_HOST_ID} .ad-xconfig-setting-input--theme-preset{margin-top:0}
#${PANEL_HOST_ID} .ad-xconfig-setting-action--theme-preset{height:100%}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-card{--ad-xconfig-theme-preset-accent:#69d4ff;--ad-xconfig-theme-preset-score:#fff;--ad-xconfig-theme-preset-secondary:rgba(235,243,255,.9);--ad-xconfig-theme-preset-throw:rgba(235,243,255,.72);--ad-xconfig-theme-preset-overlay-alpha:.75;--ad-xconfig-theme-preset-player-alpha:.9;--ad-xconfig-theme-preset-tint:15%;--ad-xconfig-theme-preset-font:inherit;appearance:none;position:relative;isolation:isolate;display:block;width:100%;height:100%;min-height:6rem;overflow:hidden;border:1px solid color-mix(in srgb,var(--ad-xconfig-theme-preset-accent) 76%,white 24%);border-radius:10px;padding:0;background:linear-gradient(145deg,rgba(8,13,26,.98),rgba(14,23,42,.96));color:#fff;text-align:left;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(255,255,255,.05),0 5px 14px rgba(0,0,0,.2);transition:border-color .16s ease,box-shadow .16s ease,transform .16s ease}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-card::before{content:"";position:absolute;z-index:-1;inset:0;background:linear-gradient(rgba(6,8,13,var(--ad-xconfig-theme-preset-overlay-alpha)),rgba(6,8,13,var(--ad-xconfig-theme-preset-overlay-alpha))),radial-gradient(circle at 12% 18%,color-mix(in srgb,var(--ad-xconfig-theme-preset-accent) 24%,transparent),transparent 56%)}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-card:hover{transform:translateY(-1px);border-color:color-mix(in srgb,var(--ad-xconfig-theme-preset-accent) 90%,white 10%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),0 7px 18px color-mix(in srgb,var(--ad-xconfig-theme-preset-accent) 22%,rgba(0,0,0,.28))}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-card:focus-visible{outline:none;border-color:#fff;box-shadow:0 0 0 2px color-mix(in srgb,var(--ad-xconfig-theme-preset-accent) 72%,transparent),0 7px 18px rgba(0,0,0,.28)}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-wallpaper{position:absolute;z-index:-2;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;filter:saturate(1.04) contrast(1.02)}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-card[data-theme-preset-background-mode="fit"] .ad-xconfig-theme-preset-wallpaper{object-fit:contain}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-card[data-theme-preset-background-mode="stretch"] .ad-xconfig-theme-preset-wallpaper{object-fit:fill}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-card[data-theme-preset-background-mode="center"] .ad-xconfig-theme-preset-wallpaper{width:auto;height:auto;max-width:none;max-height:none;inset:50% auto auto 50%;transform:translate(-50%,-50%)}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-card[data-theme-preset-background-mode="tile"] .ad-xconfig-theme-preset-wallpaper{width:auto;height:auto;min-width:0;min-height:0;object-fit:none;object-position:left top}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-content{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 7.3rem;align-items:stretch;gap:.55rem;min-height:6rem;padding:.58rem}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-identity{display:flex;min-width:0;flex-direction:column;align-items:flex-start;justify-content:center;gap:.22rem}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-name{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ad-xconfig-theme-preset-accent);font-family:var(--ad-xconfig-theme-preset-font);font-size:.88rem;font-weight:900;line-height:1.1;text-shadow:0 1px 5px rgba(0,0,0,.9)}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-wallpaper-state{color:rgba(235,243,255,.72);font-size:.66rem;font-weight:700;line-height:1.1}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-swatches{display:flex;gap:.2rem;margin-top:.16rem}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-swatch{display:block;width:.75rem;height:.26rem;border-radius:999px;border:1px solid rgba(255,255,255,.25);box-shadow:0 1px 3px rgba(0,0,0,.35)}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-player{position:relative;display:grid;grid-template-columns:1fr auto;grid-template-rows:auto 1fr;align-items:center;column-gap:.35rem;padding:.38rem .44rem;border:1px solid color-mix(in srgb,var(--ad-xconfig-theme-preset-accent) 58%,rgba(255,255,255,.16));border-radius:7px;background:linear-gradient(180deg,color-mix(in srgb,var(--ad-xconfig-theme-preset-accent) var(--ad-xconfig-theme-preset-tint),transparent),transparent),rgba(8,12,24,var(--ad-xconfig-theme-preset-player-alpha));box-shadow:inset 0 0 0 1px rgba(255,255,255,.04)}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-player-name{grid-column:1/-1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ad-xconfig-theme-preset-secondary);font-family:var(--ad-xconfig-theme-preset-font);font-size:.55rem;font-weight:800;letter-spacing:.04em;line-height:1}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-score{align-self:end;color:var(--ad-xconfig-theme-preset-score);font-family:var(--ad-xconfig-theme-preset-font);font-size:1.42rem;font-weight:900;line-height:.9;text-shadow:0 1px 5px rgba(0,0,0,.75)}
#${PANEL_HOST_ID} .ad-xconfig-theme-preset-throw{align-self:end;padding:.12rem .25rem;border:1px solid color-mix(in srgb,var(--ad-xconfig-theme-preset-throw) 72%,transparent);border-radius:4px;color:var(--ad-xconfig-theme-preset-throw);font-family:var(--ad-xconfig-theme-preset-font);font-size:.54rem;font-weight:800;line-height:1}
#${PANEL_HOST_ID} .ad-xconfig-setting-action-preview{display:block;width:100%;min-height:8.5rem}
#${PANEL_HOST_ID} .ad-xconfig-x01-bust-preview{display:grid;place-items:center;min-height:8.5rem;padding:.45rem;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(135deg,rgba(8,13,26,.82),rgba(30,18,25,.62))}
#${PANEL_HOST_ID} .ad-xconfig-x01-bust-preview-card{position:relative;width:min(100%,28rem);min-height:7rem;border:1px solid rgba(132,169,190,.38);border-radius:8px;overflow:hidden;background:rgba(16,24,38,.92);box-shadow:inset 0 0 0 1px rgba(255,255,255,.04)}
#${PANEL_HOST_ID} .ad-xconfig-x01-bust-preview-stack{display:grid;grid-template-rows:auto 1fr auto;gap:.72rem;min-height:7rem;padding:.78rem .92rem;background:linear-gradient(135deg,rgba(18,27,42,.94),rgba(12,20,34,.9));color:#fff}
#${PANEL_HOST_ID} .ad-xconfig-x01-bust-preview-head{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:.65rem}
#${PANEL_HOST_ID} .ad-xconfig-x01-bust-preview-leg{display:grid;place-items:center;width:2.3rem;height:2.3rem;border-radius:7px;background:#9fdb58;color:#0b1020;font-size:1.55rem;font-weight:800;line-height:1}
#${PANEL_HOST_ID} .ad-xconfig-x01-bust-preview-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:1.25rem;font-weight:900;line-height:1;letter-spacing:0;color:rgba(246,249,255,.96)}
#${PANEL_HOST_ID} .ad-xconfig-x01-bust-preview-score{font-size:2.9rem;font-weight:900;line-height:.9;font-variant-numeric:tabular-nums;color:#22d3ee;text-shadow:0 0 14px rgba(34,211,238,.32)}
#${PANEL_HOST_ID} .ad-xconfig-x01-bust-preview-meta{align-self:center;color:rgba(235,243,255,.92);font-size:1rem;font-weight:600}
#${PANEL_HOST_ID} .ad-xconfig-x01-bust-preview-bar{height:.55rem;border-radius:999px;background:linear-gradient(90deg,#f97316,#fb923c,#f97316);box-shadow:0 0 12px rgba(249,115,22,.3)}
#${PANEL_HOST_ID} .ad-xconfig-setting-action-btn{border:1px solid rgba(255,255,255,.3);border-radius:10px;min-height:2.65rem;padding:.55rem .8rem;background:rgba(22,38,82,.72);color:#fff;font-size:.85rem;font-weight:700;cursor:pointer}
#${PANEL_HOST_ID} .ad-xconfig-setting-action-btn--primary{border-color:rgba(126,216,255,.92);background:linear-gradient(145deg,rgba(58,148,255,.52),rgba(88,200,255,.34));box-shadow:0 0 0 1px rgba(126,216,255,.24),0 4px 14px rgba(58,148,255,.24)}
#${PANEL_HOST_ID} .ad-xconfig-setting-action-btn--primary:hover{background:linear-gradient(145deg,rgba(72,170,255,.62),rgba(102,214,255,.4))}
#${PANEL_HOST_ID} .ad-xconfig-setting-action-btn:disabled{opacity:.55;cursor:not-allowed}
#${PANEL_HOST_ID} .ad-xconfig-setting-action-state{margin:0;font-size:.74rem;color:rgba(234,244,255,.9)}
#${PANEL_HOST_ID} .ad-xconfig-setting-action-state--disabled{color:rgba(255,212,212,.9)}
#${PANEL_HOST_ID} .ad-xconfig-theme-image-status{margin-top:.2rem;max-width:22rem;padding:.5rem .6rem;border-radius:9px;border:1px solid rgba(126,216,255,.45);background:rgba(58,148,255,.14);display:grid;gap:.4rem}
#${PANEL_HOST_ID} .ad-xconfig-theme-image-status--empty{border-color:rgba(255,255,255,.26);background:rgba(255,255,255,.06)}
#${PANEL_HOST_ID} .ad-xconfig-theme-image-status-summary{margin:0;font-size:.75rem;line-height:1.35;color:rgba(240,248,255,.95)}
#${PANEL_HOST_ID} .ad-xconfig-theme-image-preview{width:100%;max-height:8rem;object-fit:cover;border-radius:7px;border:1px solid rgba(255,255,255,.24);background:rgba(9,16,34,.8)}
#${PANEL_HOST_ID} .ad-xconfig-turn-dart-image-preview{width:120px;max-width:100%;height:40px;object-fit:contain;object-position:right center;justify-self:start}
#${PANEL_HOST_ID} .ad-xconfig-theme-action-feedback{margin:.15rem 0 0;font-size:.75rem;line-height:1.35}
#${PANEL_HOST_ID} .ad-xconfig-theme-action-feedback--success{color:rgba(152,244,195,.98)}
#${PANEL_HOST_ID} .ad-xconfig-theme-action-feedback--error{color:rgba(255,198,198,.98)}
#${PANEL_HOST_ID} .ad-xconfig-theme-action-feedback--info{color:rgba(187,232,255,.98)}
#${PANEL_HOST_ID} .ad-xconfig-hidden-input{position:absolute;opacity:0;pointer-events:none;width:0;height:0}
@keyframes ad-xconfig-effect-preview-emphasis{0%{transform:translateY(2px) scale(.98) rotateZ(-.4deg)}34%{transform:translateY(-4px) scale(1.045) rotateZ(.6deg)}68%{transform:translateY(1px) scale(1.01) rotateZ(-.15deg)}100%{transform:translateY(0) scale(1) rotateZ(0)}}
@keyframes ad-xconfig-effect-preview-shake{0%,100%{transform:translateX(0) scale(1) rotateZ(0)}16%{transform:translateX(-5px) scale(1.015) rotateZ(-.8deg)}32%{transform:translateX(6px) scale(1.025) rotateZ(.7deg)}52%{transform:translateX(-3px) scale(1.01) rotateZ(-.35deg)}70%{transform:translateX(2px) scale(1.005) rotateZ(.2deg)}}
@keyframes ad-xconfig-effect-preview-pulse{0%{transform:scale(.985);filter:saturate(1) brightness(.98);box-shadow:0 0 0 1px rgba(126,216,255,.12) inset}40%{transform:scale(1.045);filter:saturate(1.3) brightness(1.14);box-shadow:0 0 0 1px rgba(170,235,255,.32) inset,0 0 18px rgba(126,216,255,.28)}70%{transform:scale(1.012);filter:saturate(1.12) brightness(1.04)}100%{transform:scale(1);filter:saturate(1) brightness(1);box-shadow:0 0 0 1px rgba(126,216,255,.16) inset}}
@keyframes ad-xconfig-effect-preview-turn{0%{transform:perspective(900px) rotateY(0) scale(1)}38%{transform:perspective(900px) rotateY(360deg) scale(1.035)}70%{transform:perspective(900px) rotateY(-24deg) scale(.992)}100%{transform:perspective(900px) rotateY(0) scale(1)}}
@keyframes ad-xconfig-effect-preview-sheen{0%{transform:translateX(-8px) skewX(-3deg) scale(1.005)}45%{transform:translateX(7px) skewX(2deg) scale(1.025)}100%{transform:translateX(0) skewX(0) scale(1)}}
@keyframes ad-xconfig-effect-preview-sheen-light{0%{opacity:0;transform:translateX(-78%) skewX(-14deg)}40%{opacity:1;transform:translateX(0) skewX(-14deg)}100%{opacity:0;transform:translateX(78%) skewX(-14deg)}}
@keyframes ad-xconfig-effect-preview-shockwave-ring{0%{transform:scale(.98);box-shadow:0 0 0 0 rgba(126,216,255,.26)}34%{transform:scale(1.055);box-shadow:0 0 0 4px rgba(126,216,255,.22),0 0 20px rgba(126,216,255,.18)}62%{transform:scale(1.005);box-shadow:0 0 0 8px rgba(126,216,255,0)}100%{transform:scale(1);box-shadow:0 0 0 1px rgba(126,216,255,.16) inset}}
@keyframes ad-ext-avg-bounce{0%{transform:scale(.9);opacity:.5}60%{transform:scale(1.2);opacity:1}100%{transform:scale(1);opacity:.95}}
@keyframes ad-xconfig-active-player-sweep-preview{0%{transform:translateX(-140%);opacity:0}15%{opacity:1}100%{transform:translateX(240%);opacity:0}}
@keyframes ad-xconfig-hit-row-electric-jolt{0%{transform:translate(0,0) scale(.992);filter:saturate(1.04) brightness(.98)}36%{transform:translate(-1px,.6px) scale(1.012);filter:saturate(1.14) brightness(1.1)}68%{transform:translate(1px,-.7px) scale(1.006);filter:saturate(1.08) brightness(1.04)}100%{transform:translate(0,0) scale(1);filter:saturate(1.06) brightness(1.02)}}
@keyframes ad-xconfig-hit-score-electric-jolt{0%{transform:translateX(0) scale(1);letter-spacing:.01em;filter:brightness(1.02)}24%{transform:translateX(1.8px) scale(1.16);letter-spacing:.07em;filter:brightness(1.24) drop-shadow(0 0 7px rgba(221,249,255,.56))}48%{transform:translateX(-1.6px) scale(1.06);letter-spacing:.05em;filter:brightness(1.14) drop-shadow(0 0 5px rgba(180,250,255,.38))}70%{transform:translateX(1px) scale(1.03);letter-spacing:.04em;filter:brightness(1.14)}100%{transform:translateX(0) scale(1);letter-spacing:.01em;filter:brightness(1.03)}}
@keyframes ad-xconfig-hit-segment-electric-jolt{0%{transform:translateX(0) translateY(0);letter-spacing:.1em;opacity:1;filter:brightness(1.02)}42%{transform:translateX(-1.4px) translateY(-.4px);letter-spacing:.13em;filter:brightness(1.22)}68%{transform:translateX(1px) translateY(.4px);letter-spacing:.11em;filter:brightness(1.14)}100%{transform:translateX(0) translateY(0);letter-spacing:.1em;opacity:1;filter:brightness(1.02)}}
@keyframes ad-xconfig-hit-electric-jolt-frame-electric{0%,100%{transform:translate(0,0);filter:var(--ad-ext-hit-electric-filter-strong)}38%{transform:translate(-1px,.5px);filter:var(--ad-ext-hit-electric-filter-strong) brightness(1.12) saturate(1.08)}72%{transform:translate(1.1px,-.8px);filter:var(--ad-ext-hit-electric-filter-strong) brightness(1.06) saturate(1.04)}}
@keyframes ad-xconfig-hit-electric-jolt-frame-glow{0%,100%{box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),inset 0 0 12px color-mix(in srgb,var(--ad-ext-hit-edge) 24%,transparent),0 0 18px color-mix(in srgb,var(--ad-ext-hit-soft-glow) 58%,white 42%),0 0 34px color-mix(in srgb,var(--ad-ext-hit-glow) 46%,white 54%);opacity:.82}44%{box-shadow:inset 0 0 0 1px rgba(255,255,255,.16),inset 0 0 18px color-mix(in srgb,var(--ad-ext-hit-edge) 34%,transparent),0 0 24px color-mix(in srgb,var(--ad-ext-hit-soft-glow) 64%,white 36%),0 0 48px color-mix(in srgb,var(--ad-ext-hit-glow) 54%,white 46%);opacity:1}}
@keyframes ad-xconfig-hit-electric-jolt-frame-aura{0%,100%{opacity:.52;transform:scale(1)}46%{opacity:.84;transform:scale(1.02)}}
@keyframes ad-ext-dart-marker-pulse{0%{transform:scale(1);opacity:1}50%{transform:scale(1.2);opacity:.85}100%{transform:scale(1);opacity:1}}
@keyframes ad-ext-dart-marker-glow{0%{stroke-width:2;opacity:.9}50%{stroke-width:5;opacity:1}100%{stroke-width:2;opacity:.9}}
@media(max-width:1023px){#${PANEL_HOST_ID} .ad-xconfig-grid{grid-template-columns:1fr}#${PANEL_HOST_ID} .ad-xconfig-card--theme-global{grid-column:auto}}
@media(max-width:640px){#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-suggestion-style,#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-score-highlight-preview,#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-board-preview,#${PANEL_HOST_ID} .ad-xconfig-option-layout--x01-remaining-score-bar-preview{grid-template-columns:minmax(0,1fr) auto}#${PANEL_HOST_ID} .ad-xconfig-checkout-suggestion-option-preview,#${PANEL_HOST_ID} .ad-xconfig-checkout-score-highlight-option-preview,#${PANEL_HOST_ID} .ad-xconfig-checkout-board-option-preview,#${PANEL_HOST_ID} .ad-xconfig-x01-remaining-score-bar-option-preview{grid-column:1/span 2;grid-row:2}#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-suggestion-style [data-option-active-slot='true'],#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-score-highlight-preview [data-option-active-slot='true'],#${PANEL_HOST_ID} .ad-xconfig-option-layout--checkout-board-preview [data-option-active-slot='true'],#${PANEL_HOST_ID} .ad-xconfig-option-layout--x01-remaining-score-bar-preview [data-option-active-slot='true']{grid-column:2;grid-row:1}}
@media(max-width:640px){#${PANEL_HOST_ID} .ad-xconfig-settings-section-body--theme-presets{grid-template-columns:1fr}}
@media(max-width:640px){#${PANEL_HOST_ID} .ad-xconfig-font-picker-current{grid-template-columns:minmax(0,1fr) auto;gap:8px}#${PANEL_HOST_ID} .ad-xconfig-font-picker-current-preview{gap:.45rem}#${PANEL_HOST_ID} .ad-xconfig-font-option-list,#${PANEL_HOST_ID} .ad-xconfig-turn-dart-asset-option-list{grid-template-columns:1fr;max-height:min(24rem,52vh)}}
@media(max-width:640px){#${PANEL_HOST_ID} .ad-xconfig-color-controls{grid-template-columns:auto auto minmax(0,1fr);grid-template-areas:"swatch picker reset" "code code code"}#${PANEL_HOST_ID} .ad-xconfig-color-swatch{grid-area:swatch}#${PANEL_HOST_ID} .ad-xconfig-color-picker{grid-area:picker}#${PANEL_HOST_ID} .ad-xconfig-color-code{grid-area:code}#${PANEL_HOST_ID} .ad-xconfig-mini-btn--color-reset{grid-area:reset;justify-self:end}}
@media(prefers-reduced-motion:reduce){#${PANEL_HOST_ID} .ad-xconfig-option-item--effect-preview,#${PANEL_HOST_ID} .ad-xconfig-option-item--effect-preview::before,#${PANEL_HOST_ID} .ad-xconfig-option-item--effect-preview::after{animation:none!important;transform:none!important;transition:none!important}}

#${PANEL_HOST_ID} .ad-xconfig-btn--primary{background:var(--adx-primary);border-color:var(--adx-primary)}
#${PANEL_HOST_ID} .ad-xconfig-btn--primary:hover{background:var(--color-blue-70,#003eb3)}
#${PANEL_HOST_ID} .ad-xconfig-btn--danger{background:rgba(218,57,84,.12);border-color:#da3954}
#${PANEL_HOST_ID} :is(button,input,a,[tabindex]):focus-visible{outline:2px solid var(--color-brand-blue-50,#4a89ff);outline-offset:3px}
#${PANEL_HOST_ID} .ad-xconfig-switch{position:relative;display:inline-flex;flex:0 0 51px;width:51px;height:24px;cursor:pointer;margin:0}
#${PANEL_HOST_ID} .ad-xconfig-switch-input{position:absolute;inset:0;width:100%;height:100%;opacity:0;margin:0;cursor:pointer;z-index:1}
#${PANEL_HOST_ID} .ad-xconfig-switch-track{box-sizing:border-box;position:absolute;inset:0;border:1px solid rgba(55,76,152,.6);border-radius:999px;background:var(--adx-surface);transition:background-color .15s}
#${PANEL_HOST_ID} .ad-xconfig-switch-track::after{content:"";position:absolute;top:2px;left:2px;width:28px;height:18px;border-radius:999px;background:#fff;transition:transform .15s}
#${PANEL_HOST_ID} .ad-xconfig-switch-input:checked + .ad-xconfig-switch-track{background:var(--adx-primary);border-color:var(--adx-primary)}
#${PANEL_HOST_ID} .ad-xconfig-switch-input:checked + .ad-xconfig-switch-track::after{transform:translateX(17px)}
#${PANEL_HOST_ID} .ad-xconfig-switch-input:focus-visible + .ad-xconfig-switch-track{outline:2px solid var(--color-brand-blue-50,#4a89ff);outline-offset:3px}
#${PANEL_HOST_ID} .ad-xconfig-switch-input:disabled + .ad-xconfig-switch-track{opacity:.5}
#${PANEL_HOST_ID} .ad-xconfig-setting-input > .ad-xconfig-switch{float:right}
#${PANEL_HOST_ID} .ad-xconfig-card-head > div{min-width:0}
#${PANEL_HOST_ID} .ad-xconfig-setting-row:has(> .ad-xconfig-setting-input:only-child),#${PANEL_HOST_ID} .ad-xconfig-setting-row[data-adxconfig-settings-summary]{grid-template-columns:minmax(0,1fr)}
#${PANEL_HOST_ID} .ad-xconfig-option-list{margin-top:0}
#${PANEL_HOST_ID} .ad-xconfig-option-item:not(.ad-xconfig-option-item--effect-preview):not(.ad-xconfig-option-item--color-preview){background:var(--adx-raised);box-shadow:none}
#${PANEL_HOST_ID} .ad-xconfig-variant,#${PANEL_HOST_ID} .ad-xconfig-option-active{background:var(--adx-secondary);color:var(--adx-muted);box-shadow:none}
#${PANEL_HOST_ID} :is(.ad-xconfig-text-input,.ad-xconfig-color-code){background:var(--adx-raised);color:var(--adx-text);border:1px solid var(--adx-border);border-radius:8px;min-width:0}
#${PANEL_HOST_ID} .ad-xconfig-transfer-dialog > :first-child{position:sticky;top:-24px;background:var(--adx-surface);z-index:3;padding:16px 0;margin:0}
@media(max-width:640px){#${PANEL_HOST_ID} .ad-xconfig-page{padding:16px}#${PANEL_HOST_ID} .ad-xconfig-grid{gap:16px}#${PANEL_HOST_ID} .ad-xconfig-setting-row{grid-template-columns:minmax(0,1fr)}#${PANEL_HOST_ID} .ad-xconfig-setting-input > .ad-xconfig-switch{float:none}#${PANEL_HOST_ID} .ad-xconfig-modal{padding:0 16px 16px}#${PANEL_HOST_ID} .ad-xconfig-modal-header{padding-top:16px}#${PANEL_HOST_ID} .ad-xconfig-transfer-dialog{padding:16px}#${PANEL_HOST_ID} .ad-xconfig-header-actions{width:100%}#${PANEL_HOST_ID} .ad-xconfig-modal-actions{flex-wrap:wrap;justify-content:flex-end}#${PANEL_HOST_ID} .ad-xconfig-transfer-summary{grid-template-columns:minmax(0,1fr)}}
@media(prefers-reduced-motion:reduce){#${PANEL_HOST_ID} .ad-xconfig-switch-track,#${PANEL_HOST_ID} .ad-xconfig-switch-track::after{transition:none}}
#${PANEL_HOST_ID} .ad-xconfig-card--theme-global .ad-xconfig-card-bg img{object-fit:contain}
#${PANEL_HOST_ID} .ad-xconfig-setting-row[class*="-preview"]{grid-template-columns:minmax(0,1fr)}
#${PANEL_HOST_ID} .ad-xconfig-transfer-dialog > .ad-xconfig-modal-header{top:-24px;margin:0;padding:16px 0;display:block}
@media(max-width:640px){#${PANEL_HOST_ID} .ad-xconfig-transfer-dialog > .ad-xconfig-modal-header{top:-16px}}
`;


