import { getXConfigDescriptor, xconfigDescriptorOrder } from "./descriptors.js";
import { resolveDartDesignAsset } from "#feature-assets";
import { resolveXConfigPreviewAsset } from "#xconfig-preview-assets";
import {
  openUserscriptInstall,
  readStoredUpdateStatus,
} from "./update-check.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";
import {
  currentRoute,
  getContentElement,
  getSidebarElement,
  isConfigHash,
  isLegacyConfigPath,
  isNavigationElement,
  normalizeRoutePath,
  removeNodeById,
  toRoutePathname,
} from "./layout-utils.js";
import {
  buildFeatureSettingPatch,
  isThemeFeature,
  themeKeyFromConfigKey,
} from "./path-utils.js";
import { cancelWindowSync, queueWindowSync } from "./sync-scheduler.js";
import {
  buildShellRenderSignature,
  parseShellRenderSignature,
} from "./render-signature.js";
import { createShellRenderController } from "./render-controller.js";
import { createShellRouteController } from "./route-controller.js";
import {
  applyThemeBackgroundStatusNode,
  buildThemeBackgroundStatus,
  clearThemeBackgroundImage,
  formatThemeBackgroundSummary,
  uploadThemeBackgroundImage,
} from "./theme-background.js";
import { createShellActionController } from "./action-controller.js";
import { createUpdateStatusController } from "./update-controller.js";
import { createShellLifecycleController } from "./lifecycle-controller.js";

const CONFIG_PATH = "/ad-xconfig";
const CONFIG_HASH = "#ad-xconfig";
const MENU_LABEL = "AD xConfig";
const MENU_LABEL_COLLAPSE_WIDTH = 120;
const MENU_ITEM_ID = "ad-xconfig-menu-item";
const PANEL_HOST_ID = "ad-xconfig-panel-host";
const STYLE_ID = "ad-xconfig-shell-style";
const README_URL = "https://github.com/thomasasen/autodarts-xconfig/blob/main/README.md";
const CHANGELOG_URL = "https://github.com/thomasasen/autodarts-xconfig/blob/main/CHANGELOG.md";
const ROOT_OBSERVER_KEY = "xconfig-shell:root-observer";
const NOTICE_TIMEOUT_MS = 3200;
const UPDATE_AUTO_CHECK_INTERVAL_MS = 15 * 60 * 1000;
const DART_MARKER_DARTS_FEATURE_KEY = "dart-marker-darts";
const DART_MARKER_DARTS_DESIGN_SETTING_KEY = "design";
const LISTENER_KEYS = Object.freeze({
  popstate: "xconfig-shell:popstate",
  click: "xconfig-shell:document-click",
  change: "xconfig-shell:document-change",
  keydown: "xconfig-shell:document-keydown",
  visibilitychange: "xconfig-shell:document-visibilitychange",
});
const TAB_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "themes",
    icon: "🎨",
    label: "Themen",
    description: "Farben, Layout und Hintergründe",
  }),
  Object.freeze({
    id: "animations",
    icon: "✨",
    label: "Animationen",
    description: "Effekte und Komfortfunktionen",
  }),
]);
const SIDEBAR_ROUTE_HINTS = new Set([
  "/lobbies",
  "/boards",
  "/matches",
  "/tournaments",
  "/statistics",
  "/plus",
  "/settings",
]);
const descriptorOrder = xconfigDescriptorOrder;
const ANIMATION_GROUP_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "all-modes",
    title: "Gilt für: Alle Modi",
    featureKeys: Object.freeze([
      "turn-start-sweep",
      "turn-points-count",
      "average-trend-arrow",
      "triple-double-bull-hits",
      "dart-marker-darts",
      "dart-marker-emphasis",
      "remove-darts-notification",
      "single-bull-sound",
      "winner-fireworks",
    ]),
  }),
  Object.freeze({
    id: "x01",
    title: "Gilt für: X01",
    featureKeys: Object.freeze([
      "style-checkout-suggestions",
      "checkout-score-pulse",
      "x01-score-progress",
      "checkout-board-targets",
      "tv-board-zoom",
    ]),
  }),
  Object.freeze({
    id: "cricket-tactics",
    title: "Gilt für: Cricket / Tactics",
    featureKeys: Object.freeze([
      "cricket-highlighter",
      "cricket-grid-fx",
    ]),
  }),
]);
const animationGroupOrder = new Map(
  ANIMATION_GROUP_DEFINITIONS.map((group, index) => [group.id, index])
);
const animationFeatureOrder = new Map(
  ANIMATION_GROUP_DEFINITIONS.flatMap((group) =>
    group.featureKeys.map((featureKey, index) => [featureKey, [group.id, index]])
  )
);
const shellByWindow = new WeakMap();

const styleText = `
#${MENU_ITEM_ID}{cursor:pointer;min-height:2.5rem}
#${MENU_ITEM_ID}[data-active="true"]{background:rgba(32,111,185,.28)!important;border-color:rgba(255,255,255,.16)!important}
#${MENU_ITEM_ID}[data-update-available="true"]{position:relative}
#${MENU_ITEM_ID}[data-update-available="true"]::after{content:"";position:absolute;top:.52rem;right:.6rem;width:.62rem;height:.62rem;border-radius:999px;background:#ff8370;box-shadow:0 0 0 2px rgba(12,22,54,.92),0 0 0 4px rgba(255,131,112,.18)}
#${MENU_ITEM_ID} .ad-xconfig-menu-icon{display:inline-flex;align-items:center;flex-shrink:0;margin-inline-end:.5rem}
#${MENU_ITEM_ID} .ad-xconfig-menu-label{white-space:nowrap}
#${PANEL_HOST_ID}{display:none;width:100%;position:relative;z-index:2147480000}
#${PANEL_HOST_ID} .ad-xconfig-page{margin:0 auto;width:100%;padding:1rem;color:#fff;font-family:"Open Sans","Segoe UI",Tahoma,sans-serif}
#${PANEL_HOST_ID} .ad-xconfig-shell{max-width:1366px;margin:0 auto;padding:1rem;border-radius:14px;border:1px solid rgba(255,255,255,.12);box-shadow:0 8px 30px rgba(0,0,0,.28);background:rgba(25,32,71,.95);background-image:radial-gradient(50% 30% at 86% 0%,rgba(49,51,112,.89) 0%,rgba(64,52,134,0) 100%),radial-gradient(50% 70% at 70% 22%,rgba(38,89,154,.9) 0%,rgba(64,52,134,0) 100%),radial-gradient(50% 70% at -2% 53%,rgba(52,32,95,.89) 0%,rgba(64,52,134,0) 100%),radial-gradient(50% 40% at 66% 59%,rgba(32,111,185,.87) 7%,rgba(32,111,185,0) 100%)}
#${PANEL_HOST_ID} .ad-xconfig-shell,#${PANEL_HOST_ID} .ad-xconfig-shell *{pointer-events:auto}
#${PANEL_HOST_ID} .ad-xconfig-header{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:.75rem}
#${PANEL_HOST_ID} .ad-xconfig-header-main{display:flex;align-items:center;gap:.75rem}
#${PANEL_HOST_ID} .ad-xconfig-title{margin:0;font-size:1.65rem;line-height:1.2}
#${PANEL_HOST_ID} .ad-xconfig-subtitle{margin:.45rem 0 0;font-size:.95rem;color:rgba(255,255,255,.72)}
#${PANEL_HOST_ID} .ad-xconfig-notice{margin-top:.85rem;border-radius:8px;padding:.62rem .8rem;font-size:.85rem;border:1px solid transparent}
#${PANEL_HOST_ID} .ad-xconfig-notice--success{background:rgba(58,180,122,.17);border-color:rgba(58,180,122,.52)}
#${PANEL_HOST_ID} .ad-xconfig-notice--error{background:rgba(255,84,84,.15);border-color:rgba(255,84,84,.5)}
#${PANEL_HOST_ID} .ad-xconfig-notice--info{background:rgba(74,178,255,.18);border-color:rgba(74,178,255,.5)}
#${PANEL_HOST_ID} .ad-xconfig-header-actions{display:flex;flex-wrap:wrap;gap:.65rem}
#${PANEL_HOST_ID} .ad-xconfig-update-panel{margin-top:1rem;padding:.85rem 1rem;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(7,13,33,.34);display:grid;gap:.55rem}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="available"]{border-color:rgba(255,146,120,.72);background:linear-gradient(145deg,rgba(255,116,86,.18),rgba(255,196,118,.12));box-shadow:inset 0 0 0 1px rgba(255,191,149,.12)}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="current"]{border-color:rgba(126,216,255,.42);background:linear-gradient(145deg,rgba(58,148,255,.14),rgba(69,201,255,.08))}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="checking"]{border-color:rgba(255,255,255,.24);background:rgba(255,255,255,.07)}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="error"]{border-color:rgba(255,112,112,.48);background:linear-gradient(145deg,rgba(255,96,96,.14),rgba(255,120,120,.07))}
#${PANEL_HOST_ID} .ad-xconfig-update-head{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem;flex-wrap:wrap}
#${PANEL_HOST_ID} .ad-xconfig-update-summary{display:grid;gap:.18rem}
#${PANEL_HOST_ID} .ad-xconfig-update-title-row{display:flex;align-items:center;gap:.55rem;flex-wrap:wrap}
#${PANEL_HOST_ID} .ad-xconfig-update-dot{width:.68rem;height:.68rem;border-radius:999px;background:rgba(164,190,255,.96);box-shadow:0 0 0 3px rgba(164,190,255,.16)}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="available"] .ad-xconfig-update-dot{background:#ff8b73;box-shadow:0 0 0 3px rgba(255,139,115,.18)}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="current"] .ad-xconfig-update-dot{background:#6ce0a3;box-shadow:0 0 0 3px rgba(108,224,163,.18)}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="error"] .ad-xconfig-update-dot{background:#ff8a8a;box-shadow:0 0 0 3px rgba(255,138,138,.18)}
#${PANEL_HOST_ID} .ad-xconfig-update-title{margin:0;font-size:1rem;font-weight:800;line-height:1.2}
#${PANEL_HOST_ID} .ad-xconfig-update-copy{margin:0;font-size:.8rem;line-height:1.35;color:rgba(235,243,255,.88)}
#${PANEL_HOST_ID} .ad-xconfig-update-actions{display:flex;flex-wrap:wrap;gap:.55rem}
#${PANEL_HOST_ID} .ad-xconfig-update-link{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-weight:700}
#${PANEL_HOST_ID} .ad-xconfig-update-link .ad-xconfig-update-link-copy{display:inline-flex;align-items:center;gap:.38rem}
#${PANEL_HOST_ID} .ad-xconfig-update-link .ad-xconfig-update-link-kicker{display:inline-flex;padding:.14rem .42rem;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.14);font-size:.64rem;letter-spacing:.06em;text-transform:uppercase;color:rgba(240,246,255,.82)}
#${PANEL_HOST_ID} .ad-xconfig-update-link .ad-xconfig-update-link-label{color:rgba(248,251,255,.96)}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="available"] .ad-xconfig-update-link{border-color:rgba(255,214,164,.54);background:linear-gradient(145deg,rgba(255,244,224,.12),rgba(255,196,118,.12));box-shadow:0 0 0 1px rgba(255,214,164,.08),0 6px 18px rgba(18,12,8,.12)}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="available"] .ad-xconfig-update-link:hover{background:linear-gradient(145deg,rgba(255,248,232,.18),rgba(255,205,132,.18))}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="current"] .ad-xconfig-update-link{border-color:rgba(170,224,255,.42);background:linear-gradient(145deg,rgba(201,234,255,.12),rgba(74,178,255,.14))}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="error"] .ad-xconfig-update-link{border-color:rgba(255,176,176,.38);background:linear-gradient(145deg,rgba(255,218,218,.08),rgba(255,120,120,.1))}
#${PANEL_HOST_ID} .ad-xconfig-update-panel[data-update-state="checking"] .ad-xconfig-update-link{border-color:rgba(255,255,255,.22);background:rgba(255,255,255,.08)}
#${PANEL_HOST_ID} .ad-xconfig-btn--primary{border-color:rgba(255,166,132,.72);background:linear-gradient(145deg,rgba(255,126,92,.34),rgba(255,196,118,.22));box-shadow:0 0 0 1px rgba(255,186,144,.12),0 5px 16px rgba(255,126,92,.12)}
#${PANEL_HOST_ID} .ad-xconfig-btn--primary:hover{background:linear-gradient(145deg,rgba(255,141,104,.42),rgba(255,203,128,.28))}
#${PANEL_HOST_ID} .ad-xconfig-tabs{margin-top:1rem;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem}
#${PANEL_HOST_ID} .ad-xconfig-btn,#${PANEL_HOST_ID} .ad-xconfig-tab{border:1px solid rgba(255,255,255,.24);border-radius:8px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer;font:inherit}
#${PANEL_HOST_ID} .ad-xconfig-btn,#${PANEL_HOST_ID} .ad-xconfig-tab{padding:.55rem .85rem}
#${PANEL_HOST_ID} .ad-xconfig-btn:hover,#${PANEL_HOST_ID} .ad-xconfig-tab:hover{background:rgba(255,255,255,.16)}
#${PANEL_HOST_ID} .ad-xconfig-btn--square{width:2.15rem;min-width:2.15rem;height:2.15rem;padding:0;display:inline-flex;align-items:center;justify-content:center;line-height:1}
#${PANEL_HOST_ID} .ad-xconfig-btn--danger{border-color:rgba(255,84,84,.42);background:rgba(255,84,84,.17)}
#${PANEL_HOST_ID} .ad-xconfig-tab{border-color:rgba(166,196,255,.52);border-radius:11px;background:linear-gradient(145deg,rgba(255,255,255,.16),rgba(74,178,255,.14));padding:.86rem .82rem;min-height:4.1rem;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:.22rem;text-align:left;box-shadow:0 6px 18px rgba(12,31,72,.28),inset 0 0 0 1px rgba(255,255,255,.06);transition:background-color .2s ease,border-color .2s ease,box-shadow .2s ease,transform .2s ease}
#${PANEL_HOST_ID} .ad-xconfig-tab:hover{border-color:rgba(173,214,255,.82);background:linear-gradient(145deg,rgba(255,255,255,.24),rgba(74,178,255,.18));transform:translateY(-1px)}
#${PANEL_HOST_ID} .ad-xconfig-tab:focus-visible{outline:none;border-color:rgba(154,227,255,.98);box-shadow:0 0 0 2px rgba(112,196,255,.52),0 10px 24px rgba(12,31,72,.36)}
#${PANEL_HOST_ID} .ad-xconfig-tab[data-active="true"]{border-color:rgba(112,196,255,.95);background:linear-gradient(145deg,rgba(138,204,255,.35),rgba(74,178,255,.28));box-shadow:0 10px 26px rgba(39,108,199,.28),inset 0 0 0 1px rgba(195,235,255,.24)}
#${PANEL_HOST_ID} .ad-xconfig-tab-title{display:block;font-size:1rem;font-weight:800;line-height:1.2;letter-spacing:.01em}
#${PANEL_HOST_ID} .ad-xconfig-tab-desc{display:block;font-size:.76rem;line-height:1.2;color:rgba(232,243,255,.92);font-weight:500}
#${PANEL_HOST_ID} .ad-xconfig-content{margin-top:1rem}
#${PANEL_HOST_ID} .ad-xconfig-content-head{display:flex;align-items:center;justify-content:space-between;gap:.55rem;flex-wrap:wrap}
#${PANEL_HOST_ID} .ad-xconfig-content-title{margin:0;font-size:.9rem;font-weight:700;letter-spacing:.01em;color:rgba(232,243,255,.92)}
#${PANEL_HOST_ID} .ad-xconfig-group{display:grid;gap:.6rem}
#${PANEL_HOST_ID} .ad-xconfig-group + .ad-xconfig-group{margin-top:1.1rem}
#${PANEL_HOST_ID} .ad-xconfig-group-divider{height:1px;background:linear-gradient(90deg,rgba(126,216,255,.04),rgba(126,216,255,.68),rgba(126,216,255,.04));border:0;margin:1.15rem 0 .3rem}
#${PANEL_HOST_ID} .ad-xconfig-group-title{margin:0;font-size:.82rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:rgba(196,230,255,.96)}
#${PANEL_HOST_ID} .ad-xconfig-btn--compact{padding:.38rem .62rem;font-size:.74rem;line-height:1.12}
#${PANEL_HOST_ID} .ad-xconfig-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;margin-top:1rem}
#${PANEL_HOST_ID} .ad-xconfig-card{position:relative;overflow:hidden;min-height:14rem;padding:.9rem;border-radius:11px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.2);transition:transform .2s ease}
#${PANEL_HOST_ID} .ad-xconfig-card:hover{transform:translateY(-2px)}
#${PANEL_HOST_ID} .ad-xconfig-card-bg{position:absolute;inset:0;pointer-events:none}
#${PANEL_HOST_ID} .ad-xconfig-card-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(15,27,67,.88) 0%,rgba(15,27,67,.84) 40%,rgba(15,27,67,.36) 70%,rgba(15,27,67,.2) 100%),radial-gradient(100% 100% at 90% 10%,rgba(45,108,198,.35) 0%,rgba(45,108,198,0) 70%)}
#${PANEL_HOST_ID} .ad-xconfig-card-bg img{position:absolute;top:0;right:0;width:72%;height:100%;object-fit:cover;opacity:.5;filter:saturate(.85)}
#${PANEL_HOST_ID} .ad-xconfig-card-content{position:relative;z-index:1}
#${PANEL_HOST_ID} .ad-xconfig-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:.8rem;margin-bottom:.85rem}
#${PANEL_HOST_ID} .ad-xconfig-card-title{margin:0;font-size:.98rem}
#${PANEL_HOST_ID} .ad-xconfig-card-copy{margin:.4rem 0 0;color:rgba(255,255,255,.76);font-size:.84rem;line-height:1.35}
#${PANEL_HOST_ID} .ad-xconfig-card-badges{margin-top:.75rem;display:flex;gap:.5rem;flex-wrap:wrap}
#${PANEL_HOST_ID} .ad-xconfig-card-actions{margin-top:.75rem;display:flex;gap:.5rem;flex-wrap:wrap}
#${PANEL_HOST_ID} .ad-xconfig-variant{display:inline-flex;margin-top:.55rem;padding:.2rem .55rem;border-radius:999px;background:rgba(163,191,250,.2);border:1px solid rgba(163,191,250,.7);font-size:.72rem}
#${PANEL_HOST_ID} .ad-xconfig-mini-btn{border:1px solid rgba(255,255,255,.24);border-radius:7px;padding:.35rem .55rem;background:rgba(255,255,255,.08);color:#fff;font-size:.73rem;line-height:1;cursor:pointer}
#${PANEL_HOST_ID} .ad-xconfig-mini-btn:hover{background:rgba(255,255,255,.16)}
#${PANEL_HOST_ID} .ad-xconfig-mini-btn--settings{border-color:rgba(126,216,255,.92);background:rgba(58,148,255,.34);font-weight:700;box-shadow:0 0 0 1px rgba(126,216,255,.24),0 2px 10px rgba(58,148,255,.26)}
#${PANEL_HOST_ID} .ad-xconfig-mini-btn--settings:hover{background:rgba(72,170,255,.48)}
#${PANEL_HOST_ID} .ad-xconfig-mini-btn--readme{border-color:rgba(201,219,255,.56);background:rgba(32,55,116,.48)}
#${PANEL_HOST_ID} .ad-xconfig-mini-btn--readme:hover{background:rgba(46,72,146,.58)}
#${PANEL_HOST_ID} .ad-xconfig-fields{display:grid;gap:.65rem}
#${PANEL_HOST_ID} .ad-xconfig-field{display:grid;gap:.32rem}
#${PANEL_HOST_ID} .ad-xconfig-field label{font-weight:600;font-size:.86rem}
#${PANEL_HOST_ID} .ad-xconfig-field--checkbox{display:flex;align-items:center;gap:.55rem}
#${PANEL_HOST_ID} .ad-xconfig-onoff{position:relative;display:inline-flex;align-self:flex-start;flex:0 0 auto;width:5.2rem;min-width:5.2rem;max-width:5.2rem;height:2.2rem;min-height:2.2rem;overflow:hidden;border-radius:8px;border:1px solid rgba(255,255,255,.18);background:rgba(10,14,32,.45)}
#${PANEL_HOST_ID} .ad-xconfig-onoff-btn{appearance:none;border:none;background:transparent;color:rgba(230,240,255,.84);width:50%;min-width:2.6rem;height:100%;padding:0 .45rem;cursor:pointer;font-weight:700;font-size:.86rem;line-height:1;white-space:nowrap;text-align:center;display:flex;align-items:center;justify-content:center;flex:1 1 50%}
#${PANEL_HOST_ID} .ad-xconfig-onoff-btn + .ad-xconfig-onoff-btn{box-shadow:inset 1px 0 0 rgba(255,255,255,.14)}
#${PANEL_HOST_ID} .ad-xconfig-onoff-btn:hover{background:rgba(255,255,255,.16)}
#${PANEL_HOST_ID} .ad-xconfig-onoff-btn[data-active="false"]{color:rgba(210,224,244,.62)}
#${PANEL_HOST_ID} .ad-xconfig-onoff-btn--on[data-active="true"]{background:rgba(44,170,90,.44);color:#fff}
#${PANEL_HOST_ID} .ad-xconfig-onoff-btn--off[data-active="true"]{background:rgba(199,63,63,.42);color:#fff}
#${PANEL_HOST_ID} .ad-xconfig-note{margin:.5rem 0 0;color:rgba(234,244,255,.9);font-size:.82rem}
#${PANEL_HOST_ID} .ad-xconfig-option-list{margin:.55rem 0 0;padding:0;list-style:none;display:grid;gap:.4rem}
#${PANEL_HOST_ID} .ad-xconfig-option-item{appearance:none;display:block;width:100%;text-align:left;padding:.42rem .5rem;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035);color:#fff;cursor:pointer;font:inherit}
#${PANEL_HOST_ID} .ad-xconfig-option-item:hover{border-color:rgba(154,227,255,.56);background:rgba(74,178,255,.16)}
#${PANEL_HOST_ID} .ad-xconfig-option-item:focus-visible{outline:none;border-color:rgba(154,227,255,.95);box-shadow:0 0 0 2px rgba(112,196,255,.4)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-active="true"]{border-color:rgba(126,216,255,.56);background:rgba(58,148,255,.16);box-shadow:0 0 0 1px rgba(126,216,255,.16) inset}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-active="false"] .ad-xconfig-option-label{color:rgba(232,244,255,.92)}
#${PANEL_HOST_ID} .ad-xconfig-option-head{display:flex;align-items:center;justify-content:space-between;gap:.5rem}
#${PANEL_HOST_ID} .ad-xconfig-option-label{font-size:.75rem;font-weight:700;color:#fff}
#${PANEL_HOST_ID} .ad-xconfig-option-active{display:inline-flex;align-items:center;padding:.12rem .38rem;border-radius:999px;background:rgba(126,216,255,.22);border:1px solid rgba(126,216,255,.48);font-size:.66rem;font-weight:700;letter-spacing:.01em;color:#eef8ff}
#${PANEL_HOST_ID} .ad-xconfig-option-copy{display:block;margin-top:.18rem;color:rgba(228,240,255,.88);font-size:.74rem;line-height:1.34}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--dart-design{display:grid;grid-template-columns:minmax(0,1fr) 4.2rem auto;grid-template-rows:auto auto;align-items:center;column-gap:.5rem;row-gap:.14rem}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--dart-design .ad-xconfig-option-text{grid-column:1;grid-row:1/span 2;min-width:0}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--dart-design .ad-xconfig-option-head{display:block}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--dart-design .ad-xconfig-option-copy{margin-top:.12rem}
#${PANEL_HOST_ID} .ad-xconfig-option-preview{grid-column:2;grid-row:1/span 2;width:3.9rem;height:1.62rem;object-fit:contain;justify-self:center;align-self:center;opacity:.96;filter:drop-shadow(0 2px 3px rgba(4,10,26,.35))}
#${PANEL_HOST_ID} .ad-xconfig-option-active-slot{grid-column:3;grid-row:1;display:flex;justify-content:flex-end;align-self:start;min-height:1rem}
#${PANEL_HOST_ID} .ad-xconfig-option-layout--dart-design .ad-xconfig-option-active{margin-left:.2rem;white-space:nowrap}
#${PANEL_HOST_ID} .ad-xconfig-empty{border-radius:10px;border:1px dashed rgba(255,255,255,.3);background:rgba(255,255,255,.03);padding:1rem;color:rgba(255,255,255,.75);font-size:.88rem}
#${PANEL_HOST_ID} .ad-xconfig-modal-backdrop{position:fixed;inset:0;z-index:2147483000;background:rgba(5,11,29,.74);display:flex;align-items:center;justify-content:center;padding:1rem}
#${PANEL_HOST_ID} .ad-xconfig-modal{width:min(44rem,100%);max-height:calc(100vh - 2rem);overflow:auto;border-radius:12px;border:1px solid rgba(255,255,255,.22);background:linear-gradient(160deg,rgba(15,27,67,.97) 0%,rgba(25,32,71,.98) 75%);padding:1rem}
#${PANEL_HOST_ID} .ad-xconfig-modal-header{display:flex;justify-content:space-between;gap:.8rem}
#${PANEL_HOST_ID} .ad-xconfig-modal-actions{display:flex;align-items:flex-start;gap:.55rem}
#${PANEL_HOST_ID} .ad-xconfig-modal-title{margin:0;font-size:1.05rem;line-height:1.3}
#${PANEL_HOST_ID} .ad-xconfig-modal-subtitle{margin:.35rem 0 0;color:rgba(255,255,255,.75);font-size:.82rem}
#${PANEL_HOST_ID} .ad-xconfig-modal-body{margin-top:.95rem;display:grid;gap:.65rem}
#${PANEL_HOST_ID} .ad-xconfig-setting-row{border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);padding:.75rem}
#${PANEL_HOST_ID} .ad-xconfig-setting-row--debug{border-color:rgba(255,128,128,.36);background:linear-gradient(145deg,rgba(255,96,96,.14),rgba(255,120,120,.07))}
#${PANEL_HOST_ID} .ad-xconfig-setting-label{display:block;font-weight:700;font-size:.86rem}
#${PANEL_HOST_ID} .ad-xconfig-setting-input{margin-top:.58rem}
#${PANEL_HOST_ID} .ad-xconfig-setting-action{display:grid;gap:.45rem}
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
#${PANEL_HOST_ID} .ad-xconfig-theme-action-feedback{margin:.15rem 0 0;font-size:.75rem;line-height:1.35}
#${PANEL_HOST_ID} .ad-xconfig-theme-action-feedback--success{color:rgba(152,244,195,.98)}
#${PANEL_HOST_ID} .ad-xconfig-theme-action-feedback--error{color:rgba(255,198,198,.98)}
#${PANEL_HOST_ID} .ad-xconfig-theme-action-feedback--info{color:rgba(187,232,255,.98)}
#${PANEL_HOST_ID} .ad-xconfig-hidden-input{position:absolute;opacity:0;pointer-events:none;width:0;height:0}
@media(max-width:1180px){#${PANEL_HOST_ID} .ad-xconfig-grid{grid-template-columns:1fr}}
@media(max-width:880px){#${PANEL_HOST_ID} .ad-xconfig-tabs{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;

function isObjectLike(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toTitleCase(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  if (raw.toLowerCase() === "x01") {
    return "X01";
  }

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatVariantLabel(variants = []) {
  if (!Array.isArray(variants) || !variants.length) {
    return "";
  }

  if (variants.includes("all")) {
    return "Alle Modi";
  }

  return variants.map((variant) => toTitleCase(variant)).join(" / ");
}

export function createElement(documentRef, tagName, options = {}) {
  const element = documentRef.createElement(tagName);
  if (options.id) {
    element.id = options.id;
  }
  if (options.className) {
    element.setAttribute("class", options.className);
  }
  if (typeof options.text === "string") {
    element.textContent = options.text;
  }
  if (options.type) {
    element.setAttribute("type", options.type);
  }
  if (options.attributes && isObjectLike(options.attributes)) {
    Object.keys(options.attributes).forEach((key) => {
      const value = options.attributes[key];
      if (typeof value !== "undefined" && value !== null) {
        element.setAttribute(key, value);
      }
    });
  }
  return element;
}

export function parseFieldValue(field, rawValue, checked) {
  if (!field) {
    return rawValue;
  }

  if (field.control === "checkbox") {
    return Boolean(checked);
  }

  const matchingOption = Array.isArray(field.options)
    ? field.options.find((option) => String(option.value) === String(rawValue))
    : null;

  return matchingOption ? matchingOption.value : rawValue;
}

function sortFeatures(left, right) {
  const leftOrder = descriptorOrder.has(left.featureKey) ? descriptorOrder.get(left.featureKey) : Number.MAX_SAFE_INTEGER;
  const rightOrder = descriptorOrder.has(right.featureKey) ? descriptorOrder.get(right.featureKey) : Number.MAX_SAFE_INTEGER;
  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }
  return String(left.title || "").localeCompare(String(right.title || ""));
}

function getAnimationGroupMeta(featureKey) {
  const groupMeta = animationFeatureOrder.get(String(featureKey || "").trim());
  if (!groupMeta) {
    return {
      groupId: "other",
      groupOrder: Number.MAX_SAFE_INTEGER,
      featureOrder: Number.MAX_SAFE_INTEGER,
    };
  }
  const [groupId, featureOrder] = groupMeta;
  return {
    groupId,
    groupOrder: animationGroupOrder.has(groupId)
      ? animationGroupOrder.get(groupId)
      : Number.MAX_SAFE_INTEGER,
    featureOrder,
  };
}

function sortAnimationFeatures(left, right) {
  const leftMeta = getAnimationGroupMeta(left?.featureKey);
  const rightMeta = getAnimationGroupMeta(right?.featureKey);
  if (leftMeta.groupOrder !== rightMeta.groupOrder) {
    return leftMeta.groupOrder - rightMeta.groupOrder;
  }
  if (leftMeta.featureOrder !== rightMeta.featureOrder) {
    return leftMeta.featureOrder - rightMeta.featureOrder;
  }
  return sortFeatures(left, right);
}

function getFeatureReadmeHref(featureKey) {
  const descriptor = getXConfigDescriptor(featureKey);
  const anchor = String(descriptor?.readmeAnchor || "").trim();
  return anchor ? `${README_URL}#${anchor}` : README_URL;
}

function openExternalHref(windowRef, href) {
  if (typeof windowRef?.open === "function") {
    const openedWindow = windowRef.open(href, "_blank", "noopener,noreferrer");
    if (openedWindow && typeof openedWindow.focus === "function") {
      openedWindow.focus();
    }
    return;
  }

  if (windowRef?.location) {
    windowRef.location.href = href;
  }
}

export function openReadme(windowRef, featureKey) {
  openExternalHref(windowRef, getFeatureReadmeHref(featureKey));
}

export function openChangelog(windowRef) {
  openExternalHref(windowRef, CHANGELOG_URL);
}

function formatUpdateCheckedAt(checkedAt) {
  const timestamp = Number(checkedAt || 0);
  if (timestamp <= 0 || !Number.isFinite(timestamp)) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(timestamp));
  } catch (_) {
    return "";
  }
}

const UPDATE_PANEL_STATE_BY_STATUS = Object.freeze({
  checking: "checking",
  available: "available",
  error: "error",
});

function buildUpdateVersionCopy(installedVersion, remoteVersion) {
  let copyText = `Installiert ${installedVersion}`;
  if (remoteVersion) {
    copyText += ` • GitHub ${remoteVersion}`;
  }
  return copyText;
}

const UPDATE_PANEL_TEXT_RESOLVERS = Object.freeze({
  checking() {
    return {
      titleText: "Versionsstatus wird geprüft",
      copyText: "Vergleicht installierte Version mit den veröffentlichten GitHub-Dateien.",
    };
  },
  available({ installedVersion, remoteVersion }) {
    return {
      titleText: "Update verfügbar",
      copyText: `${buildUpdateVersionCopy(installedVersion, remoteVersion)} • Öffnet Tampermonkey im neuen Tab`,
    };
  },
  current({ installedVersion, remoteVersion }) {
    return {
      titleText: "Version ist aktuell",
      copyText: buildUpdateVersionCopy(installedVersion, remoteVersion),
    };
  },
  error({ updateStatus }) {
    return {
      titleText: "Update-Prüfung fehlgeschlagen",
      copyText: String(updateStatus.error || "Die GitHub-Version konnte nicht gelesen werden.").trim(),
    };
  },
});

function resolveUpdatePanelText(panelState, context) {
  const resolver = UPDATE_PANEL_TEXT_RESOLVERS[panelState] || UPDATE_PANEL_TEXT_RESOLVERS.checking;
  return resolver(context);
}

function getUpdatePanelState(updateStatus) {
  if (!updateStatus?.capable) {
    return "";
  }

  const normalizedStatus = String(updateStatus.status || "").trim().toLowerCase();
  const mappedState = UPDATE_PANEL_STATE_BY_STATUS[normalizedStatus];
  if (mappedState) {
    return mappedState;
  }

  return updateStatus.remoteVersion ? "current" : "checking";
}

function buildUpdatePanel(documentRef, updateStatus) {
  if (!updateStatus?.capable) {
    return null;
  }

  const panelState = getUpdatePanelState(updateStatus);
  const installedVersion = String(updateStatus.installedVersion || "unbekannt").trim() || "unbekannt";
  const remoteVersion = String(updateStatus.remoteVersion || "").trim();
  const checkedAtText = formatUpdateCheckedAt(updateStatus.checkedAt);
  let { titleText, copyText } = resolveUpdatePanelText(panelState, {
    updateStatus,
    installedVersion,
    remoteVersion,
  });

  if (checkedAtText) {
    copyText = `${copyText} • ${updateStatus.stale ? "letzter erfolgreicher Stand" : "geprüft"} ${checkedAtText}`;
  }

  const panel = createElement(documentRef, "section", {
    className: "ad-xconfig-update-panel",
    attributes: {
      "data-adxconfig-update-panel": "true",
      "data-update-state": panelState,
    },
  });

  const head = createElement(documentRef, "div", {
    className: "ad-xconfig-update-head",
  });
  const summary = createElement(documentRef, "div", {
    className: "ad-xconfig-update-summary",
  });
  const titleRow = createElement(documentRef, "div", {
    className: "ad-xconfig-update-title-row",
  });
  titleRow.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-update-dot",
    attributes: {
      "aria-hidden": "true",
    },
  }));
  titleRow.appendChild(createElement(documentRef, "h2", {
    className: "ad-xconfig-update-title",
    text: titleText,
  }));
  summary.appendChild(titleRow);
  summary.appendChild(createElement(documentRef, "p", {
    className: "ad-xconfig-update-copy",
    text: copyText,
  }));
  head.appendChild(summary);

  const actions = createElement(documentRef, "div", {
    className: "ad-xconfig-update-actions",
  });
  const changelogLink = createElement(documentRef, "a", {
    className: "ad-xconfig-btn ad-xconfig-update-link",
    attributes: {
      href: CHANGELOG_URL,
      target: "_blank",
      rel: "noopener noreferrer",
      "data-adxconfig-action": "open-changelog",
      "aria-label": "Changelog in neuem Tab öffnen",
    },
  });
  changelogLink.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-update-link-copy",
  }));
  const changelogLinkCopy = changelogLink.firstElementChild;
  changelogLinkCopy?.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-update-link-kicker",
    text: panelState === "available" ? "Neu" : "Info",
  }));
  changelogLinkCopy?.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-update-link-label",
    text: panelState === "available" ? "Was ist neu?" : "Changelog",
  }));
  actions.appendChild(changelogLink);
  actions.appendChild(createElement(documentRef, "button", {
    type: "button",
    className: "ad-xconfig-btn",
    text: panelState === "checking" ? "Prüfe..." : "Neu prüfen",
    attributes: {
      "data-adxconfig-action": "check-update",
      "aria-label": "Update erneut prüfen",
      disabled: panelState === "checking" ? "disabled" : null,
    },
  }));
  if (panelState === "available") {
    actions.appendChild(createElement(documentRef, "button", {
      type: "button",
      className: "ad-xconfig-btn ad-xconfig-btn--primary",
      text: "Update installieren",
      attributes: {
        "data-adxconfig-action": "install-update",
      },
    }));
  }
  head.appendChild(actions);

  panel.appendChild(head);
  return panel;
}

function menuIconMarkup() {
  return "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M3 6.5A1.5 1.5 0 0 1 4.5 5h10A1.5 1.5 0 0 1 16 6.5v1A1.5 1.5 0 0 1 14.5 9h-10A1.5 1.5 0 0 1 3 7.5zm0 10A1.5 1.5 0 0 1 4.5 15h6A1.5 1.5 0 0 1 12 16.5v1a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 3 17.5zM18 4a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3m0 10a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3\"/></svg>";
}

export function buildMenuIconElement(documentRef, template) {
  const icon = createElement(documentRef, "span");
  const templateIcon =
    template && typeof template.querySelector === "function"
      ? template.querySelector(".chakra-button__icon")
      : null;
  icon.className = templateIcon?.className
    ? `${templateIcon.className} ad-xconfig-menu-icon`
    : "ad-xconfig-menu-icon";
  icon.innerHTML = menuIconMarkup();
  return icon;
}

function buildFeatureToggle(documentRef, feature) {
  const wrapper = createElement(documentRef, "div", {
    className: "ad-xconfig-onoff",
  });
  const checkbox = createElement(documentRef, "input", {
    id: `ad-xconfig-toggle-${feature.featureKey}`,
    type: "checkbox",
    className: "ad-xconfig-hidden-input",
    attributes: {
      "data-adxconfig-feature-toggle": "true",
      "data-feature-key": feature.featureKey,
    },
  });
  checkbox.checked = Boolean(feature.enabled);
  wrapper.appendChild(checkbox);
  wrapper.appendChild(createElement(documentRef, "button", {
    type: "button",
    className: "ad-xconfig-onoff-btn ad-xconfig-onoff-btn--on",
    text: "An",
    attributes: {
      "data-adxconfig-action": "set-feature",
      "data-feature-key": feature.featureKey,
      "data-feature-enabled": "true",
      "data-active": feature.enabled ? "true" : "false",
    },
  }));
  wrapper.appendChild(createElement(documentRef, "button", {
    type: "button",
    className: "ad-xconfig-onoff-btn ad-xconfig-onoff-btn--off",
    text: "Aus",
    attributes: {
      "data-adxconfig-action": "set-feature",
      "data-feature-key": feature.featureKey,
      "data-feature-enabled": "false",
      "data-active": feature.enabled ? "false" : "true",
    },
  }));
  return wrapper;
}

function isDartDesignSelectField(feature, field) {
  if (field?.control !== "select") {
    return false;
  }
  return feature?.featureKey === DART_MARKER_DARTS_FEATURE_KEY &&
    String(field?.key || "").trim() === DART_MARKER_DARTS_DESIGN_SETTING_KEY;
}

function buildOptionActiveBadge(documentRef) {
  return createElement(documentRef, "span", {
    className: "ad-xconfig-option-active",
    text: "Aktuell",
  });
}

function resolveFieldOptionPreview(feature, field, optionValue) {
  if (!isDartDesignSelectField(feature, field)) {
    return "";
  }
  return resolveDartDesignAsset(optionValue);
}

function buildDartDesignOptionLayout(
  documentRef,
  optionLabel,
  optionDescription,
  optionPreviewUrl,
  isActive
) {
  const layout = createElement(documentRef, "div", {
    className: "ad-xconfig-option-layout ad-xconfig-option-layout--dart-design",
  });

  const optionText = createElement(documentRef, "div", {
    className: "ad-xconfig-option-text",
  });
  const head = createElement(documentRef, "div", {
    className: "ad-xconfig-option-head",
  });
  head.appendChild(createElement(documentRef, "span", {
    className: "ad-xconfig-option-label",
    text: optionLabel,
  }));
  optionText.appendChild(head);

  if (optionDescription) {
    optionText.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-option-copy",
      text: optionDescription,
    }));
  }
  layout.appendChild(optionText);

  layout.appendChild(createElement(documentRef, "img", {
    className: "ad-xconfig-option-preview",
    attributes: {
      src: optionPreviewUrl,
      alt: `${optionLabel} Dart-Vorschau`,
      loading: "lazy",
      decoding: "async",
    },
  }));

  const activeSlot = createElement(documentRef, "div", {
    className: "ad-xconfig-option-active-slot",
    attributes: {
      "data-option-active-slot": "true",
    },
  });
  if (isActive) {
    activeSlot.appendChild(buildOptionActiveBadge(documentRef));
  }
  layout.appendChild(activeSlot);

  return layout;
}

function buildFeatureField(documentRef, feature, field) {
  const fieldId = `ad-xconfig-field-${feature.featureKey}-${field.key || field.action}`;

  if (field.control === "action") {
    const wrapper = createElement(documentRef, "div", {
      className: "ad-xconfig-setting-action",
    });
    const button = createElement(documentRef, "button", {
      id: fieldId,
      type: "button",
      className: field.prominent
        ? "ad-xconfig-setting-action-btn ad-xconfig-setting-action-btn--primary"
        : "ad-xconfig-setting-action-btn",
      text: field.buttonLabel || field.label,
      attributes: {
        "data-adxconfig-action": field.action,
        "data-feature-key": feature.featureKey,
        "data-config-key": feature.configKey,
        "data-feature-action-id": field.actionId || "",
      },
    });
    wrapper.appendChild(button);
    const noteText = String(
      field.description ||
        (field.action === "clearThemeBackground"
          ? "Entfernt das gespeicherte Bild für dieses Theme."
          : field.action === "uploadThemeBackground"
            ? "Öffnet die Dateiauswahl und speichert das Bild für dieses Theme."
            : "")
    ).trim();
    if (noteText) {
      wrapper.appendChild(createElement(documentRef, "p", {
        className: "ad-xconfig-note",
        text: noteText,
      }));
    }
    if (isThemeFeature(feature) && field.action === "uploadThemeBackground") {
      wrapper.appendChild(buildThemeBackgroundStatus(documentRef, feature));
      wrapper.appendChild(createElement(documentRef, "p", {
        className: "ad-xconfig-note ad-xconfig-theme-action-feedback",
        attributes: {
          "data-adxconfig-theme-action-feedback": "true",
          "data-feature-key": feature.featureKey,
        },
      }));
    }
    return wrapper;
  }

  if (field.control === "checkbox") {
    const wrapper = createElement(documentRef, "div", {
      className: "ad-xconfig-onoff",
    });
    const input = createElement(documentRef, "input", {
      id: fieldId,
      type: "checkbox",
      className: "ad-xconfig-hidden-input",
      attributes: {
        "data-adxconfig-setting": "true",
        "data-feature-key": feature.featureKey,
        "data-config-key": feature.configKey,
        "data-setting-key": field.key,
        "data-setting-control": field.control,
      },
    });
    input.checked = Boolean(feature.config?.[field.key]);
    wrapper.appendChild(input);
    wrapper.appendChild(createElement(documentRef, "button", {
      type: "button",
      className: "ad-xconfig-onoff-btn ad-xconfig-onoff-btn--on",
      text: "An",
      attributes: {
        "data-adxconfig-action": "set-setting-toggle",
        "data-feature-key": feature.featureKey,
        "data-config-key": feature.configKey,
        "data-setting-key": field.key,
        "data-setting-value": "true",
        "data-active": input.checked ? "true" : "false",
      },
    }));
    wrapper.appendChild(createElement(documentRef, "button", {
      type: "button",
      className: "ad-xconfig-onoff-btn ad-xconfig-onoff-btn--off",
      text: "Aus",
      attributes: {
        "data-adxconfig-action": "set-setting-toggle",
        "data-feature-key": feature.featureKey,
        "data-config-key": feature.configKey,
        "data-setting-key": field.key,
        "data-setting-value": "false",
        "data-active": input.checked ? "false" : "true",
      },
    }));
    return wrapper;
  }

  const selectedOptionValue = resolveSelectFieldValue(feature, field);
  const list = createElement(documentRef, "div", {
    id: fieldId,
    className: "ad-xconfig-option-list",
    attributes: {
      "data-adxconfig-setting": "true",
      "data-feature-key": feature.featureKey,
      "data-config-key": feature.configKey,
      "data-setting-key": field.key,
      "data-setting-control": "select",
      "data-selected-value": selectedOptionValue,
    },
  });

  field.options.forEach((option) => {
    const optionValue = String(option?.value ?? "");
    const isActive = optionValue === selectedOptionValue;
    const isDartDesignField = isDartDesignSelectField(feature, field);
    const optionButton = createElement(documentRef, "button", {
      type: "button",
      className: isDartDesignField
        ? "ad-xconfig-option-item ad-xconfig-option-item--dart-design"
        : "ad-xconfig-option-item",
      attributes: {
        "data-adxconfig-action": "set-setting-select-option",
        "data-adxconfig-option-note": "true",
        "data-feature-key": feature.featureKey,
        "data-config-key": feature.configKey,
        "data-setting-key": field.key,
        "data-setting-value": optionValue,
        "data-option-value": optionValue,
        "data-option-description": String(option?.description || "").trim(),
        "data-active": isActive ? "true" : "false",
        "aria-pressed": isActive ? "true" : "false",
      },
    });
    const optionDescription = String(option?.description || "").trim();

    if (isDartDesignField) {
      const optionPreviewUrl = resolveFieldOptionPreview(feature, field, optionValue);
      optionButton.appendChild(
        buildDartDesignOptionLayout(
          documentRef,
          option.label,
          optionDescription,
          optionPreviewUrl,
          isActive
        )
      );
    } else {
      const head = createElement(documentRef, "div", {
        className: "ad-xconfig-option-head",
      });
      head.appendChild(createElement(documentRef, "span", {
        className: "ad-xconfig-option-label",
        text: option.label,
      }));
      if (isActive) {
        head.appendChild(buildOptionActiveBadge(documentRef));
      }
      optionButton.appendChild(head);

      if (optionDescription) {
        optionButton.appendChild(createElement(documentRef, "span", {
          className: "ad-xconfig-option-copy",
          text: optionDescription,
        }));
      }
    }

    list.appendChild(optionButton);
  });

  return list;
}

function getFieldNoteText(field) {
  return String(field?.description || "").trim();
}

function resolveSelectFieldValue(feature, field) {
  const options = Array.isArray(field?.options) ? field.options : [];
  if (!options.length) {
    return "";
  }

  const configuredValue = String(feature?.config?.[field.key] ?? "");
  const hasConfiguredValue = options.some(
    (option) => String(option?.value ?? "") === configuredValue
  );
  if (hasConfiguredValue) {
    return configuredValue;
  }

  return String(options[0]?.value ?? "");
}

function setSelectOptionActiveState(documentRef, optionNode, isActive) {
  if (!optionNode || typeof optionNode.setAttribute !== "function") {
    return;
  }

  optionNode.setAttribute("data-active", isActive ? "true" : "false");
  optionNode.setAttribute("aria-pressed", isActive ? "true" : "false");

  const activeContainer =
    optionNode.querySelector?.("[data-option-active-slot='true']") ||
    optionNode.querySelector?.(".ad-xconfig-option-head") ||
    null;
  if (!activeContainer) {
    return;
  }

  const activeBadge = activeContainer.querySelector?.(".ad-xconfig-option-active") || null;
  if (isActive) {
    if (!activeBadge) {
      activeContainer.appendChild(buildOptionActiveBadge(documentRef));
    }
    return;
  }

  activeBadge?.remove?.();
}

export function syncSelectOptionButtons(documentRef, actionNode, selectedValue) {
  if (!actionNode || typeof actionNode.getAttribute !== "function") {
    return;
  }

  const settingKey = String(actionNode.getAttribute("data-setting-key") || "").trim();
  if (!settingKey) {
    return;
  }

  const inputWrap =
    actionNode.closest?.(".ad-xconfig-setting-input") ||
    actionNode.parentElement ||
    null;
  if (!inputWrap || typeof inputWrap.querySelectorAll !== "function") {
    return;
  }

  const optionButtons = Array.from(
    inputWrap.querySelectorAll(
      `[data-adxconfig-action='set-setting-select-option'][data-setting-key='${settingKey}']`
    )
  );

  optionButtons.forEach((optionNode) => {
    const optionValue = String(optionNode.getAttribute("data-setting-value") ?? "");
    setSelectOptionActiveState(documentRef, optionNode, optionValue === selectedValue);
  });

  const optionList = inputWrap.querySelector?.(
    `[data-adxconfig-setting='true'][data-setting-control='select'][data-setting-key='${settingKey}']`
  );
  if (optionList) {
    optionList.setAttribute("data-selected-value", selectedValue);
  }
}

function buildFeatureCard(documentRef, feature) {
  const descriptor = getXConfigDescriptor(feature.featureKey);
  const card = createElement(documentRef, "article", {
    className: "ad-xconfig-card",
    attributes: {
      "data-feature-key": feature.featureKey,
    },
  });
  const previewUrl =
    String(feature.config?.backgroundImageDataUrl || "").trim() ||
    resolveXConfigPreviewAsset(feature.featureKey);
  if (previewUrl) {
    const bg = createElement(documentRef, "div", {
      className: "ad-xconfig-card-bg",
    });
    bg.appendChild(createElement(documentRef, "img", {
      attributes: {
        src: previewUrl,
        alt: `${feature.title} Vorschau`,
        loading: "lazy",
        decoding: "async",
      },
    }));
    card.appendChild(bg);
  }

  const cardContent = createElement(documentRef, "div", {
    className: "ad-xconfig-card-content",
  });
  const head = createElement(documentRef, "div", {
    className: "ad-xconfig-card-head",
  });
  const copy = createElement(documentRef, "div");
  copy.appendChild(createElement(documentRef, "h3", {
    className: "ad-xconfig-card-title",
    text: feature.title,
  }));
  copy.appendChild(createElement(documentRef, "p", {
    className: "ad-xconfig-card-copy",
    text: descriptor?.description || "Modulares Feature für Autodarts xConfig.",
  }));
  head.appendChild(copy);
  head.appendChild(buildFeatureToggle(documentRef, feature));
  cardContent.appendChild(head);

  const badges = createElement(documentRef, "div", {
    className: "ad-xconfig-card-badges",
  });
  const variantLabel = formatVariantLabel(feature.variants);
  if (variantLabel) {
    badges.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-variant",
      text: `Gilt für: ${variantLabel}`,
    }));
  }
  const fieldCount = Array.isArray(descriptor?.fields) ? descriptor.fields.length : 0;
  if (fieldCount > 0) {
    badges.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-variant",
      text: fieldCount === 1 ? "1 Einstellung" : `${fieldCount} Einstellungen`,
    }));
  }
  cardContent.appendChild(badges);

  if (fieldCount > 0) {
    const actions = createElement(documentRef, "div", {
      className: "ad-xconfig-card-actions",
    });
    actions.appendChild(createElement(documentRef, "button", {
      type: "button",
      className: "ad-xconfig-mini-btn ad-xconfig-mini-btn--settings",
      text: "⚙ Einstellungen",
      attributes: {
        "data-adxconfig-action": "open-settings",
        "data-feature-key": feature.featureKey,
      },
    }));
    actions.appendChild(createElement(documentRef, "button", {
      type: "button",
      className: "ad-xconfig-mini-btn ad-xconfig-mini-btn--readme",
      text: "📖 README",
      attributes: {
        "data-adxconfig-action": "open-readme",
        "data-feature-key": feature.featureKey,
      },
    }));
    cardContent.appendChild(actions);
  } else {
    const actions = createElement(documentRef, "div", {
      className: "ad-xconfig-card-actions",
    });
    actions.appendChild(createElement(documentRef, "button", {
      type: "button",
      className: "ad-xconfig-mini-btn ad-xconfig-mini-btn--readme",
      text: "📖 README",
      attributes: {
        "data-adxconfig-action": "open-readme",
        "data-feature-key": feature.featureKey,
      },
    }));
    cardContent.appendChild(actions);
  }

  cardContent.appendChild(createElement(documentRef, "p", {
    className: "ad-xconfig-note",
    attributes: isThemeFeature(feature)
      ? {
          "data-adxconfig-theme-card-status": "true",
          "data-feature-key": feature.featureKey,
        }
      : {},
    text: isThemeFeature(feature)
      ? formatThemeBackgroundSummary(feature)
      : "Änderungen werden sofort gespeichert und direkt angewendet.",
  }));

  card.appendChild(cardContent);
  return card;
}
function buildSettingsModal(documentRef, state, features) {
  if (!state.activeSettingsFeatureKey) {
    return null;
  }
  const feature = features.find((entry) => entry.featureKey === state.activeSettingsFeatureKey) || null;
  const descriptor = feature ? getXConfigDescriptor(feature.featureKey) : null;
  const fields = Array.isArray(descriptor?.fields) ? descriptor.fields : [];
  if (!feature || !fields.length) {
    return null;
  }

  const backdrop = createElement(documentRef, "div", {
    className: "ad-xconfig-modal-backdrop",
    attributes: {
      "data-adxconfig-action": "close-settings-backdrop",
    },
  });
  const modal = createElement(documentRef, "section", {
    className: "ad-xconfig-modal",
    attributes: {
      role: "dialog",
      "aria-modal": "true",
      "data-adxconfig-modal": "true",
    },
  });

  const modalHeader = createElement(documentRef, "header", {
    className: "ad-xconfig-modal-header",
  });
  const heading = createElement(documentRef, "div");
  heading.appendChild(createElement(documentRef, "h3", {
    className: "ad-xconfig-modal-title",
    text: `${feature.title} - Einstellungen`,
  }));
  heading.appendChild(createElement(documentRef, "p", {
    className: "ad-xconfig-modal-subtitle",
    text: "Änderungen werden sofort gespeichert.",
  }));
  modalHeader.appendChild(heading);
  const modalActions = createElement(documentRef, "div", {
    className: "ad-xconfig-modal-actions",
  });
  modalActions.appendChild(createElement(documentRef, "button", {
    type: "button",
    className: "ad-xconfig-mini-btn ad-xconfig-mini-btn--readme",
    text: "📖 README",
    attributes: {
      "data-adxconfig-action": "open-readme",
      "data-feature-key": feature.featureKey,
    },
  }));
  modalActions.appendChild(createElement(documentRef, "button", {
    type: "button",
    className: "ad-xconfig-btn ad-xconfig-btn--square",
    text: "✖",
    attributes: {
      "data-adxconfig-action": "close-settings",
      "aria-label": "Einstellungen schließen",
    },
  }));
  modalHeader.appendChild(modalActions);
  modal.appendChild(modalHeader);

  const body = createElement(documentRef, "div", {
    className: "ad-xconfig-modal-body",
  });
  fields.forEach((field) => {
    const row = createElement(documentRef, "div", {
      className: String(field.key || field.action || "").toLowerCase() === "debug"
        ? "ad-xconfig-setting-row ad-xconfig-setting-row--debug"
        : "ad-xconfig-setting-row",
    });
    const inputWrap = createElement(documentRef, "div", {
      className: "ad-xconfig-setting-input",
    });
    if (field.control !== "action") {
      row.appendChild(createElement(documentRef, "label", {
        className: "ad-xconfig-setting-label",
        text: field.label,
      }));
      const noteText = getFieldNoteText(field);
      if (noteText) {
        inputWrap.appendChild(createElement(documentRef, "p", {
          className: "ad-xconfig-note",
          text: noteText,
        }));
      }
    }
    inputWrap.appendChild(buildFeatureField(documentRef, feature, field));
    row.appendChild(inputWrap);
    body.appendChild(row);
  });
  modal.appendChild(body);

  backdrop.appendChild(modal);
  return backdrop;
}

function buildAnimationGroups(documentRef, features = []) {
  const sortedFeatures = Array.isArray(features)
    ? features.slice().sort(sortAnimationFeatures)
    : [];
  if (!sortedFeatures.length) {
    return [];
  }

  const groupedFeatures = new Map();
  sortedFeatures.forEach((feature) => {
    const { groupId } = getAnimationGroupMeta(feature?.featureKey);
    const list = groupedFeatures.get(groupId) || [];
    list.push(feature);
    groupedFeatures.set(groupId, list);
  });

  const sections = [];
  ANIMATION_GROUP_DEFINITIONS.forEach((group) => {
    const entries = groupedFeatures.get(group.id) || [];
    if (!entries.length) {
      return;
    }
    const section = createElement(documentRef, "section", {
      className: "ad-xconfig-group",
      attributes: {
        "data-adxconfig-animation-group": group.id,
      },
    });
    section.appendChild(createElement(documentRef, "h2", {
      className: "ad-xconfig-group-title",
      text: group.title,
    }));
    const grid = createElement(documentRef, "div", {
      className: "ad-xconfig-grid",
    });
    entries.forEach((feature) => {
      grid.appendChild(buildFeatureCard(documentRef, feature));
    });
    section.appendChild(grid);
    sections.push(section);
    groupedFeatures.delete(group.id);
  });

  const remainingFeatures = groupedFeatures.get("other") || [];
  if (remainingFeatures.length) {
    const fallbackSection = createElement(documentRef, "section", {
      className: "ad-xconfig-group",
      attributes: {
        "data-adxconfig-animation-group": "other",
      },
    });
    fallbackSection.appendChild(createElement(documentRef, "h2", {
      className: "ad-xconfig-group-title",
      text: "Weitere",
    }));
    const fallbackGrid = createElement(documentRef, "div", {
      className: "ad-xconfig-grid",
    });
    remainingFeatures.forEach((feature) => {
      fallbackGrid.appendChild(buildFeatureCard(documentRef, feature));
    });
    fallbackSection.appendChild(fallbackGrid);
    sections.push(fallbackSection);
  }

  return sections;
}

export function buildShellContent(documentRef, state, features) {
  const page = createElement(documentRef, "div", {
    className: "ad-xconfig-page",
  });
  const shell = createElement(documentRef, "div", {
    className: "ad-xconfig-shell",
  });

  const header = createElement(documentRef, "header", {
    className: "ad-xconfig-header",
  });
  const heading = createElement(documentRef, "div");
  const headingMain = createElement(documentRef, "div", {
    className: "ad-xconfig-header-main",
  });
  headingMain.appendChild(createElement(documentRef, "h1", {
    className: "ad-xconfig-title",
    text: MENU_LABEL,
  }));
  heading.appendChild(headingMain);
  heading.appendChild(createElement(documentRef, "p", {
    className: "ad-xconfig-subtitle",
    text: "Modulverwaltung für Themen und Animationen.",
  }));
  header.appendChild(heading);

  const headerActions = createElement(documentRef, "div", {
    className: "ad-xconfig-header-actions",
  });
  headerActions.appendChild(createElement(documentRef, "button", {
    className: "ad-xconfig-btn ad-xconfig-btn--danger",
    text: "↺ Zurücksetzen",
    type: "button",
    attributes: {
      "data-adxconfig-action": "reset",
      "aria-label": "Hard Reset ausführen",
    },
  }));
  headerActions.appendChild(createElement(documentRef, "button", {
    className: "ad-xconfig-btn ad-xconfig-btn--primary",
    text: "Empfohlene Standards",
    type: "button",
    attributes: {
      "data-adxconfig-action": "apply-recommended-defaults",
      "aria-label": "Empfohlene Standards anwenden",
    },
  }));
  header.appendChild(headerActions);
  shell.appendChild(header);

  const updatePanel = buildUpdatePanel(documentRef, state.updateStatus);
  if (updatePanel) {
    shell.appendChild(updatePanel);
  }

  if (state.notice?.type && state.notice?.message) {
    shell.appendChild(createElement(documentRef, "div", {
      className: `ad-xconfig-notice ad-xconfig-notice--${state.notice.type}`,
      text: state.notice.message,
    }));
  }

  const tabs = createElement(documentRef, "nav", {
    className: "ad-xconfig-tabs",
  });
  TAB_DEFINITIONS.forEach((tab) => {
    const button = createElement(documentRef, "button", {
      id: `ad-xconfig-tab-${tab.id}`,
      className: "ad-xconfig-tab",
      type: "button",
      attributes: {
        "data-adxconfig-tab": tab.id,
        "data-active": state.activeTab === tab.id ? "true" : "false",
      },
    });
    button.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-tab-title",
      text: `${tab.icon} ${tab.label}`,
    }));
    button.appendChild(createElement(documentRef, "span", {
      className: "ad-xconfig-tab-desc",
      text: tab.description,
    }));
    tabs.appendChild(button);
  });
  shell.appendChild(tabs);

  const activeTabFeatures = features
    .filter((feature) => {
      const descriptor = getXConfigDescriptor(feature.featureKey);
      return (descriptor?.tab || "animations") === state.activeTab;
    });

  const content = createElement(documentRef, "div", {
    className: "ad-xconfig-content",
  });
  if (state.activeTab === "themes" && activeTabFeatures.some((feature) => isThemeFeature(feature))) {
    const contentHead = createElement(documentRef, "div", {
      className: "ad-xconfig-content-head",
    });
    contentHead.appendChild(createElement(documentRef, "h2", {
      className: "ad-xconfig-content-title",
      text: "Themen",
    }));
    content.appendChild(contentHead);
  }
  if (state.activeTab === "animations") {
    const groups = buildAnimationGroups(documentRef, activeTabFeatures);
    if (groups.length) {
      groups.forEach((groupNode, index) => {
        if (index > 0) {
          content.appendChild(createElement(documentRef, "hr", {
            className: "ad-xconfig-group-divider",
            attributes: {
              "aria-hidden": "true",
              "data-adxconfig-animation-divider": "true",
            },
          }));
        }
        content.appendChild(groupNode);
      });
    } else {
      content.appendChild(createElement(documentRef, "div", {
        className: "ad-xconfig-empty",
        text: "Für diesen Bereich wurden keine Module gefunden.",
      }));
    }
  } else {
    const grid = createElement(documentRef, "div", {
      className: "ad-xconfig-grid",
    });
    activeTabFeatures
      .slice()
      .sort(sortFeatures)
      .forEach((feature) => {
        grid.appendChild(buildFeatureCard(documentRef, feature));
      });
    if (grid.children.length) {
      content.appendChild(grid);
    } else {
      content.appendChild(createElement(documentRef, "div", {
        className: "ad-xconfig-empty",
        text: "Für diesen Bereich wurden keine Module gefunden.",
      }));
    }
  }
  shell.appendChild(content);

  const modal = buildSettingsModal(documentRef, state, features);
  if (modal) {
    shell.appendChild(modal);
  }

  page.appendChild(shell);
  return page;
}

