import { getXConfigDescriptor, xconfigDescriptors } from "./descriptors.js";
import { resolveDartDesignAsset } from "#feature-assets";
import { resolveXConfigPreviewAsset } from "#xconfig-preview-assets";
import {
  openUserscriptInstall,
  readStoredUpdateStatus,
  resolveLatestUpdateStatus,
  shouldRefreshUpdateStatus,
} from "./update-check.js";
import { createManagedNodeMatcher, hasExternalDomMutation } from "../../core/dom-mutation-filter.js";

const CONFIG_PATH = "/ad-xconfig";
const CONFIG_HASH = "#ad-xconfig";
const MENU_LABEL = "AD xConfig";
const MENU_LABEL_COLLAPSE_WIDTH = 120;
const MENU_ITEM_ID = "ad-xconfig-menu-item";
const PANEL_HOST_ID = "ad-xconfig-panel-host";
const STYLE_ID = "ad-xconfig-shell-style";
const README_URL = "https://github.com/thomasasen/autodarts-xconfig/blob/main/README.md";
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
const descriptorOrder = new Map(
  xconfigDescriptors.map((descriptor, index) => [descriptor.featureKey, index])
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

function splitFeaturePath(featureKey) {
  return String(featureKey || "")
    .split(".")
    .map((part) => String(part || "").trim())
    .filter(Boolean);
}

function setNestedValue(rootValue, pathParts = [], value) {
  if (!isObjectLike(rootValue) || !Array.isArray(pathParts) || !pathParts.length) {
    return;
  }

  let current = rootValue;
  for (let index = 0; index < pathParts.length - 1; index += 1) {
    const part = pathParts[index];
    if (!isObjectLike(current[part])) {
      current[part] = {};
    }
    current = current[part];
  }

  current[pathParts[pathParts.length - 1]] = value;
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

function isThemeFeature(feature) {
  return String(feature?.configKey || "").startsWith("themes.");
}

function estimateBase64ByteSize(rawPayload) {
  const payload = String(rawPayload || "").replace(/\s+/g, "");
  if (!payload) {
    return 0;
  }
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((payload.length * 3) / 4) - padding);
}

function formatByteSize(byteSize) {
  const bytes = Number(byteSize) || 0;
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kiloBytes = bytes / 1024;
  if (kiloBytes < 1024) {
    const fixed = kiloBytes < 10 ? 1 : 0;
    return `${kiloBytes.toFixed(fixed)} KB`;
  }

  return `${(kiloBytes / 1024).toFixed(1)} MB`;
}

function readThemeBackgroundImageInfo(feature) {
  const dataUrl = String(feature?.config?.backgroundImageDataUrl || "").trim();
  if (!dataUrl.startsWith("data:image/")) {
    return {
      hasImage: false,
      mimeType: "",
      byteSize: 0,
      dataUrl: "",
    };
  }

  const separatorIndex = dataUrl.indexOf(",");
  if (separatorIndex <= 0 || separatorIndex >= dataUrl.length - 1) {
    return {
      hasImage: false,
      mimeType: "",
      byteSize: 0,
      dataUrl: "",
    };
  }

  const header = dataUrl.slice(0, separatorIndex);
  const payload = dataUrl.slice(separatorIndex + 1);
  const mimeTypeMatch = header.match(/^data:([^;,]+)(?:;.*)?$/i);
  const mimeType = String(mimeTypeMatch?.[1] || "image/*").toLowerCase();
  const isBase64 = /;base64/i.test(header);

  return {
    hasImage: true,
    mimeType,
    byteSize: isBase64 ? estimateBase64ByteSize(payload) : payload.length,
    dataUrl,
  };
}

function formatThemeBackgroundSummary(feature) {
  const imageInfo = readThemeBackgroundImageInfo(feature);
  if (!imageInfo.hasImage) {
    return "Kein eigenes Hintergrundbild gespeichert.";
  }

  const sizeText = formatByteSize(imageInfo.byteSize);
  const detailText = sizeText ? `${imageInfo.mimeType}, ${sizeText}` : imageInfo.mimeType;
  return `Eigenes Hintergrundbild: ${detailText}.`;
}

function applyThemeBackgroundStatusNode(documentRef, statusNode, feature) {
  if (!statusNode) {
    return;
  }

  const imageInfo = readThemeBackgroundImageInfo(feature);
  statusNode.setAttribute(
    "class",
    imageInfo.hasImage
      ? "ad-xconfig-theme-image-status"
      : "ad-xconfig-theme-image-status ad-xconfig-theme-image-status--empty"
  );
  statusNode.setAttribute("data-theme-image-state", imageInfo.hasImage ? "present" : "empty");
  statusNode.setAttribute("data-theme-image-type", imageInfo.mimeType || "");
  statusNode.setAttribute("data-theme-image-size", imageInfo.byteSize > 0 ? String(imageInfo.byteSize) : "");

  const summaryText = imageInfo.hasImage
    ? `Aktuelles Bild: ${imageInfo.mimeType}${imageInfo.byteSize > 0 ? `, ${formatByteSize(imageInfo.byteSize)}` : ""}.`
    : "Aktuelles Bild: keines.";

  let summaryNode = statusNode.querySelector?.(".ad-xconfig-theme-image-status-summary") || null;
  if (!summaryNode) {
    summaryNode = createElement(documentRef, "p", {
      className: "ad-xconfig-theme-image-status-summary",
    });
    statusNode.appendChild(summaryNode);
  }
  summaryNode.textContent = summaryText;

  const existingPreview = statusNode.querySelector?.(".ad-xconfig-theme-image-preview") || null;
  if (imageInfo.hasImage) {
    if (existingPreview) {
      existingPreview.setAttribute("src", imageInfo.dataUrl);
      existingPreview.setAttribute("alt", `${feature.title} Hintergrundbild`);
      return;
    }
    statusNode.appendChild(createElement(documentRef, "img", {
      className: "ad-xconfig-theme-image-preview",
      attributes: {
        src: imageInfo.dataUrl,
        alt: `${feature.title} Hintergrundbild`,
        loading: "lazy",
        decoding: "async",
      },
    }));
    return;
  }

  existingPreview?.remove?.();
}

function buildThemeBackgroundStatus(documentRef, feature) {
  const status = createElement(documentRef, "div", {
    className: "ad-xconfig-theme-image-status ad-xconfig-theme-image-status--empty",
    attributes: {
      "data-adxconfig-theme-image-status": "true",
      "data-feature-key": feature.featureKey,
    },
  });
  applyThemeBackgroundStatusNode(documentRef, status, feature);
  return status;
}

function createElement(documentRef, tagName, options = {}) {
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

function normalizeRoutePath(pathValue) {
  let normalized = String(pathValue || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/[?#].*$/, "").replace(/\/{2,}/g, "/");
  if (normalized.length > 1) {
    normalized = normalized.replace(/\/+$/, "");
  }
  return normalized;
}

function toRoutePathname(windowRef, hrefValue) {
  const href = String(hrefValue || "").trim();
  if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
    return "";
  }

  try {
    const parsed = new URL(href, windowRef?.location?.origin || "https://play.autodarts.io");
    return normalizeRoutePath(parsed.pathname);
  } catch (_) {
    return normalizeRoutePath(href);
  }
}

function currentRoute(windowRef) {
  const locationRef = windowRef?.location;
  return `${locationRef?.pathname || ""}${locationRef?.search || ""}${locationRef?.hash || ""}`;
}

function normalizeHashValue(hashValue) {
  const normalized = String(hashValue || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }
  return normalized.startsWith("#") ? normalized : `#${normalized}`;
}

function isLegacyConfigPath(pathValue) {
  return normalizeRoutePath(pathValue) === CONFIG_PATH;
}

function isConfigHash(hashValue) {
  return normalizeHashValue(hashValue) === CONFIG_HASH;
}

function scoreSidebarCandidate(windowRef, candidate) {
  if (!candidate || typeof candidate.querySelectorAll !== "function") {
    return -1;
  }

  const anchors = Array.from(candidate.querySelectorAll("a[href]"));
  const routeMatches = anchors.reduce((count, anchor) => {
    return count + (SIDEBAR_ROUTE_HINTS.has(toRoutePathname(windowRef, anchor.getAttribute("href"))) ? 1 : 0);
  }, 0);

  let score = routeMatches * 20 + Math.min(anchors.length, 8);
  if (candidate.classList?.contains("navigation")) {
    score += 10;
  }
  if (candidate.matches?.("nav") || candidate.getAttribute?.("role") === "navigation") {
    score += 12;
  }

  const width = Number(candidate.getBoundingClientRect?.().width || 0);
  if (width > 0 && width < 520) {
    score += 6;
  }

  return score;
}

function getSidebarElement(windowRef, documentRef) {
  const root = documentRef?.getElementById?.("root");
  if (!root) {
    return null;
  }

  const candidates = [
    root.querySelector?.(".navigation"),
    root.querySelector?.("nav"),
    root.querySelector?.("[role='navigation']"),
    ...Array.from(root.querySelectorAll?.(".navigation") || []),
    ...Array.from(root.querySelectorAll?.("nav") || []),
    ...Array.from(root.querySelectorAll?.("[role='navigation']") || []),
  ].filter(Boolean);

  let best = null;
  let bestScore = -1;
  candidates.forEach((candidate) => {
    const score = scoreSidebarCandidate(windowRef, candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  });

  return bestScore >= 12 ? best : null;
}

function isNavigationElement(node) {
  if (!node) {
    return false;
  }

  if (node.classList?.contains("navigation")) {
    return true;
  }

  if (node.matches?.("nav") || node.getAttribute?.("role") === "navigation") {
    return true;
  }

  return false;
}

function isPanelHostElement(node) {
  return Boolean(node) && node.id === PANEL_HOST_ID;
}

function isVisibleElement(node) {
  if (!node || !node.style) {
    return true;
  }
  return String(node.style.display || "").toLowerCase() !== "none";
}

function scoreContentCandidate(node) {
  if (!node || isNavigationElement(node) || isPanelHostElement(node)) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 0;
  if (node.matches?.("main")) {
    score += 100;
  }
  if (isVisibleElement(node)) {
    score += 20;
  }

  const rect = node.getBoundingClientRect?.();
  const width = Number(rect?.width || 0);
  const height = Number(rect?.height || 0);
  score += Math.min(width, 2000) / 10;
  score += Math.min(height, 2000) / 20;

  return score;
}

function findBestContentCandidate(candidates = []) {
  let best = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  candidates.forEach((candidate) => {
    const score = scoreContentCandidate(candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  });

  return best;
}

function getContentElement(windowRef, documentRef, sidebarElement) {
  const root = documentRef?.getElementById?.("root");
  if (!root) {
    return null;
  }

  const main = root.querySelector?.("main");
  if (main) {
    return main;
  }

  const sidebar = sidebarElement || getSidebarElement(windowRef, documentRef);
  const siblingCandidates = Array.from(sidebar?.parentNode?.children || []).filter((child) => child !== sidebar);
  const contentSibling = findBestContentCandidate(siblingCandidates);
  if (contentSibling) {
    return contentSibling;
  }

  const directChildren = Array.from(root.children || []);
  return findBestContentCandidate(directChildren);
}

function removeNodeById(documentRef, nodeId) {
  const node = documentRef?.getElementById?.(nodeId);
  if (node?.parentNode?.removeChild) {
    node.parentNode.removeChild(node);
  }
}

function buildFeatureSettingPatch(configKey, settingKey, value) {
  const patch = { features: {} };
  const path = splitFeaturePath(configKey);
  if (!path.length) {
    return patch;
  }

  const featurePatch = {};
  featurePatch[settingKey] = value;
  setNestedValue(patch.features, path, featurePatch);
  return patch;
}

function parseFieldValue(field, rawValue, checked) {
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

function themeKeyFromConfigKey(configKey) {
  const path = splitFeaturePath(configKey);
  return path.length === 2 && path[0] === "themes" ? path[1] : "";
}

function sortFeatures(left, right) {
  const leftOrder = descriptorOrder.has(left.featureKey) ? descriptorOrder.get(left.featureKey) : Number.MAX_SAFE_INTEGER;
  const rightOrder = descriptorOrder.has(right.featureKey) ? descriptorOrder.get(right.featureKey) : Number.MAX_SAFE_INTEGER;
  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }
  return String(left.title || "").localeCompare(String(right.title || ""));
}

function getFeatureReadmeHref(featureKey) {
  const descriptor = getXConfigDescriptor(featureKey);
  const anchor = String(descriptor?.readmeAnchor || "").trim();
  return anchor ? `${README_URL}#${anchor}` : README_URL;
}

function openReadme(windowRef, featureKey) {
  const href = getFeatureReadmeHref(featureKey);
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
      copyText: "Vergleicht installierte Version und GitHub-Metadatei.",
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

function buildMenuIconElement(documentRef, template) {
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

function syncSelectOptionButtons(documentRef, actionNode, selectedValue) {
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

function buildShellContent(documentRef, state, features) {
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
    })
    .sort(sortFeatures);

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
    contentHead.appendChild(createElement(documentRef, "button", {
      type: "button",
      className: "ad-xconfig-btn ad-xconfig-btn--compact",
      text: "Alle aktivieren",
      attributes: {
        "data-adxconfig-action": "enable-all-themes",
        "aria-label": "Alle Themen aktivieren",
      },
    }));
    content.appendChild(contentHead);
  }
  const grid = createElement(documentRef, "div", {
    className: "ad-xconfig-grid",
  });
  activeTabFeatures.forEach((feature) => {
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
  shell.appendChild(content);

  const modal = buildSettingsModal(documentRef, state, features);
  if (modal) {
    shell.appendChild(modal);
  }

  page.appendChild(shell);
  return page;
}

function buildShellRenderSignature(state, features, routeActive) {
  const normalizedFeatures = Array.isArray(features)
    ? features.map((feature) => {
      return {
        featureKey: feature.featureKey || "",
        enabled: Boolean(feature.enabled),
        mounted: Boolean(feature.mounted),
        config: feature.config || null,
      };
    })
    : [];

  return JSON.stringify({
    routeActive: Boolean(routeActive),
    activeTab: String(state?.activeTab || ""),
    activeSettingsFeatureKey: String(state?.activeSettingsFeatureKey || ""),
    noticeType: String(state?.notice?.type || ""),
    noticeMessage: String(state?.notice?.message || ""),
    updateStatus: {
      capable: Boolean(state?.updateStatus?.capable),
      status: String(state?.updateStatus?.status || ""),
      installedVersion: String(state?.updateStatus?.installedVersion || ""),
      remoteVersion: String(state?.updateStatus?.remoteVersion || ""),
      available: Boolean(state?.updateStatus?.available),
      checkedAt: Number(state?.updateStatus?.checkedAt || 0),
      stale: Boolean(state?.updateStatus?.stale),
      error: String(state?.updateStatus?.error || ""),
    },
    features: normalizedFeatures,
  });
}

function parseShellRenderSignature(signature) {
  if (!signature) {
    return null;
  }

  try {
    const parsed = JSON.parse(signature);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_) {
    return null;
  }
}

function ensureXConfigShell(options = {}) {
  const windowRef = options.windowRef || (typeof window !== "undefined" ? window : null);
  if (!windowRef) {
    return null;
  }

  if (shellByWindow.has(windowRef)) {
    return shellByWindow.get(windowRef);
  }

  const documentRef = options.documentRef || windowRef.document || null;
  const runtime = options.runtime || null;
  const runtimeApi = options.runtimeApi || windowRef.__adXConfig || null;
  const domGuards = runtime?.context?.domGuards || null;
  const observerRegistry = runtime?.context?.registries?.observers || null;
  const listenerRegistry = runtime?.context?.registries?.listeners || null;
  const eventBus = runtime?.context?.eventBus || null;

  if (!documentRef || !runtimeApi || !runtime || !domGuards) {
    return null;
  }

  const installedVersion = String(runtimeApi.apiVersion || "").trim();
  const initialRoutePath = normalizeRoutePath(windowRef?.location?.pathname || "");
  const initialLastNonConfigRoute =
    initialRoutePath && initialRoutePath !== CONFIG_PATH ? initialRoutePath : "/lobbies";

  const state = {
    activeTab: "themes",
    activeSettingsFeatureKey: "",
    hiddenDisplays: new Map(),
    contentHidden: false,
    lastNonConfigRoute: initialLastNonConfigRoute,
    started: false,
    historyRestore: null,
    syncScheduled: false,
    notice: { type: "", message: "" },
    noticeTimer: null,
    shellNode: null,
    renderSignature: "",
    updateStatus: readStoredUpdateStatus({
      windowRef,
      installedVersion,
    }),
    updateCheckPromise: null,
    updateCheckIntervalHandle: null,
  };

  function isConfigRoute() {
    const locationRef = windowRef?.location || null;
    return (
      isLegacyConfigPath(locationRef?.pathname || "") ||
      isConfigHash(locationRef?.hash || "")
    );
  }

  function resolveBaseRouteForConfigHash() {
    const currentPath = normalizeRoutePath(windowRef?.location?.pathname || "");
    if (currentPath && currentPath !== CONFIG_PATH) {
      return currentPath;
    }
    if (state.lastNonConfigRoute && state.lastNonConfigRoute !== CONFIG_PATH) {
      return state.lastNonConfigRoute;
    }
    return "/lobbies";
  }

  function buildConfigHashRoute() {
    const search = String(windowRef?.location?.search || "");
    return `${resolveBaseRouteForConfigHash()}${search}${CONFIG_HASH}`;
  }

  function normalizeLegacyConfigPathIfNeeded() {
    if (!isLegacyConfigPath(windowRef?.location?.pathname || "")) {
      return false;
    }
    if (typeof windowRef?.history?.replaceState !== "function") {
      return false;
    }
    windowRef.history.replaceState({ adxconfig: true }, "", buildConfigHashRoute());
    return true;
  }

  function clearNoticeTimer() {
    if (state.noticeTimer && typeof windowRef.clearTimeout === "function") {
      windowRef.clearTimeout(state.noticeTimer);
      state.noticeTimer = null;
    }
  }

  function setUpdateStatus(nextStatus = {}) {
    state.updateStatus = {
      ...state.updateStatus,
      ...nextStatus,
      installedVersion,
    };
    queueSync();
  }

  function refreshUpdateStatus(options = {}) {
    const force = Boolean(options.force);
    const announce = Boolean(options.announce);

    if (!state.updateStatus.capable) {
      return Promise.resolve(state.updateStatus);
    }
    if (state.updateCheckPromise) {
      return state.updateCheckPromise;
    }
    if (!force && !shouldRefreshUpdateStatus(state.updateStatus)) {
      return Promise.resolve(state.updateStatus);
    }

    setUpdateStatus({
      status: "checking",
      error: "",
      stale: Boolean(state.updateStatus.stale && state.updateStatus.checkedAt > 0),
    });

    const updatePromise = resolveLatestUpdateStatus({
      windowRef,
      installedVersion,
      force,
    })
      .then((nextStatus) => {
        setUpdateStatus(nextStatus);
        if (announce) {
          if (nextStatus.status === "available") {
            setNotice(
              "info",
              `Update gefunden: ${installedVersion} -> ${nextStatus.remoteVersion}.`
            );
          } else if (nextStatus.status === "current") {
            setNotice("success", `Kein neueres Update gefunden. Aktuell installiert: ${installedVersion}.`);
          } else if (nextStatus.status === "error" || nextStatus.error) {
            setNotice("error", nextStatus.error || "Update-Prüfung fehlgeschlagen.");
          }
        }
        return nextStatus;
      })
      .finally(() => {
        state.updateCheckPromise = null;
      });

    state.updateCheckPromise = updatePromise;
    return updatePromise;
  }

  function stopAutoUpdateChecks() {
    if (state.updateCheckIntervalHandle && typeof windowRef.clearInterval === "function") {
      windowRef.clearInterval(state.updateCheckIntervalHandle);
    }
    state.updateCheckIntervalHandle = null;
  }

  function startAutoUpdateChecks() {
    stopAutoUpdateChecks();
    if (!state.updateStatus.capable || typeof windowRef.setInterval !== "function") {
      return;
    }
    state.updateCheckIntervalHandle = windowRef.setInterval(() => {
      if (!state.started || documentRef?.visibilityState === "hidden") {
        return;
      }
      refreshUpdateStatus({
        force: false,
        announce: false,
      });
    }, UPDATE_AUTO_CHECK_INTERVAL_MS);
  }

  function onVisibilityChange() {
    if (!state.started || documentRef?.visibilityState === "hidden") {
      return;
    }
    refreshUpdateStatus({
      force: false,
      announce: false,
    });
  }

  function setNotice(type, message) {
    state.notice = { type: String(type || ""), message: String(message || "").trim() };
    clearNoticeTimer();
    if (state.notice.message && typeof windowRef.setTimeout === "function") {
      state.noticeTimer = windowRef.setTimeout(() => {
        state.notice = { type: "", message: "" };
        state.noticeTimer = null;
        queueSync();
      }, NOTICE_TIMEOUT_MS);
    }
    queueSync();
  }

  function getFeatures() {
    const features = typeof runtimeApi.listFeatures === "function"
      ? runtimeApi.listFeatures()
      : [];
    return Array.isArray(features) ? features : [];
  }

  function setThemeActionFeedback(featureKey, type, message) {
    const normalizedFeatureKey = String(featureKey || "").trim();
    if (!normalizedFeatureKey) {
      return;
    }

    const feedbackNodes = Array.from(documentRef.querySelectorAll(
      `[data-adxconfig-theme-action-feedback='true'][data-feature-key='${normalizedFeatureKey}']`
    ));
    if (!feedbackNodes.length) {
      return;
    }

    const normalizedMessage = String(message || "").trim();
    const normalizedType = String(type || "info").trim() || "info";
    const feedbackClassName =
      `ad-xconfig-note ad-xconfig-theme-action-feedback ad-xconfig-theme-action-feedback--${normalizedType}`;

    feedbackNodes.forEach((node) => {
      node.setAttribute("class", feedbackClassName);
      node.textContent = normalizedMessage;
    });
  }

  function syncThemeBackgroundIndicators(featureKey) {
    const normalizedFeatureKey = String(featureKey || "").trim();
    if (!normalizedFeatureKey) {
      return;
    }

    const feature = getFeatures().find((entry) => entry?.featureKey === normalizedFeatureKey) || null;
    if (!feature || !isThemeFeature(feature)) {
      return;
    }

    const cardStatusNodes = Array.from(documentRef.querySelectorAll(
      `[data-adxconfig-theme-card-status='true'][data-feature-key='${normalizedFeatureKey}']`
    ));
    const cardStatusText = formatThemeBackgroundSummary(feature);
    cardStatusNodes.forEach((node) => {
      node.textContent = cardStatusText;
    });

    const modalStatusNodes = Array.from(documentRef.querySelectorAll(
      `[data-adxconfig-theme-image-status='true'][data-feature-key='${normalizedFeatureKey}']`
    ));
    modalStatusNodes.forEach((node) => {
      applyThemeBackgroundStatusNode(documentRef, node, feature);
    });
  }

  function restoreContent() {
    state.hiddenDisplays.forEach((displayValue, node) => {
      if (node && node.isConnected) {
        node.style.display = displayValue;
      }
    });
    state.hiddenDisplays.clear();
    state.contentHidden = false;
  }

  function hideContent(content, host) {
    Array.from(content?.children || []).forEach((child) => {
      if (child === host || isNavigationElement(child)) {
        return;
      }

      if (!state.hiddenDisplays.has(child)) {
        state.hiddenDisplays.set(child, child.style.display || "");
      }
      child.style.display = "none";
    });
    state.contentHidden = true;
  }

  function syncMenuButtonState() {
    const button = documentRef.getElementById?.(MENU_ITEM_ID);
    if (!button) {
      return;
    }
    if (isConfigRoute()) {
      button.setAttribute("data-active", "true");
    } else {
      button.removeAttribute("data-active");
    }
  }

  function syncMenuUpdateState(item) {
    const button = item || documentRef.getElementById?.(MENU_ITEM_ID);
    if (!button) {
      return;
    }

    const hasUpdate = Boolean(state.updateStatus?.available);
    const remoteVersion = String(state.updateStatus?.remoteVersion || "").trim();
    const title = hasUpdate && remoteVersion
      ? `${MENU_LABEL} - Update verfügbar (${installedVersion} -> ${remoteVersion})`
      : MENU_LABEL;

    if (hasUpdate) {
      button.setAttribute("data-update-available", "true");
    } else {
      button.removeAttribute("data-update-available");
    }

    button.setAttribute("data-update-state", String(state.updateStatus?.status || ""));
    button.setAttribute("title", title);
    button.setAttribute("aria-label", title);
  }

  function syncMenuLabelForWidth(sidebar, item) {
    const menuItem = item || documentRef.getElementById?.(MENU_ITEM_ID);
    const sidebarElement = sidebar || getSidebarElement(windowRef, documentRef);
    if (!menuItem || !sidebarElement) {
      return;
    }
    const label = menuItem.querySelector?.(".ad-xconfig-menu-label");
    if (!label) {
      return;
    }
    const width = Number(sidebarElement.getBoundingClientRect?.().width || 0);
    label.style.display = width > 0 && width < MENU_LABEL_COLLAPSE_WIDTH ? "none" : "inline";
  }

  function ensureMenuButton() {
    const sidebar = getSidebarElement(windowRef, documentRef);
    if (!sidebar) {
      return null;
    }

    const sidebarLinks = Array.from(sidebar.querySelectorAll("a[href]"));
    const boardsAnchor =
      sidebarLinks.find((link) => toRoutePathname(windowRef, link.getAttribute("href")) === "/boards") ||
      sidebarLinks.find((link) => String(link.textContent || "").trim().toLowerCase() === "meine boards") ||
      null;
    const insertionAnchor =
      boardsAnchor ||
      sidebarLinks.find((link) => SIDEBAR_ROUTE_HINTS.has(toRoutePathname(windowRef, link.getAttribute("href")))) ||
      null;

    let item = documentRef.getElementById?.(MENU_ITEM_ID);
    if (!item) {
      const template =
        insertionAnchor ||
        sidebar.querySelector?.("a[href], button, [role='button']") ||
        sidebar.lastElementChild ||
        null;
      item = template ? template.cloneNode(true) : createElement(documentRef, "button", { type: "button" });
      item.id = MENU_ITEM_ID;
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.setAttribute("aria-label", MENU_LABEL);
      item.setAttribute("title", MENU_LABEL);
      item.setAttribute("data-adxconfig-action", "open");
      item.style.cursor = "pointer";

      if (String(item.tagName || "").toLowerCase() === "a") {
        item.removeAttribute("href");
      } else if (String(item.tagName || "").toLowerCase() === "button") {
        item.setAttribute("type", "button");
      }

      const icon = buildMenuIconElement(documentRef, template);
      const label = createElement(documentRef, "span", {
        className: "ad-xconfig-menu-label",
        text: MENU_LABEL,
      });
      item.replaceChildren(icon, label);
    }

    if (insertionAnchor) {
      if (insertionAnchor.nextElementSibling !== item) {
        insertionAnchor.insertAdjacentElement("afterend", item);
      }
    } else if (item.parentNode !== sidebar) {
      sidebar.appendChild(item);
    }

    syncMenuButtonState();
    syncMenuUpdateState(item);
    syncMenuLabelForWidth(sidebar, item);
    return item;
  }

  function ensurePanelHost() {
    const sidebar = getSidebarElement(windowRef, documentRef);
    const content = getContentElement(windowRef, documentRef, sidebar);
    if (!content) {
      return null;
    }

    let host = documentRef.getElementById?.(PANEL_HOST_ID);
    if (!host) {
      host = createElement(documentRef, "section", {
        id: PANEL_HOST_ID,
      });
    }

    if (content === host || host.contains?.(content)) {
      return host;
    }

    if (host.parentNode !== content) {
      content.appendChild(host);
    }

    return host;
  }

  function render() {
    if (!state.started) {
      return;
    }

    const host = ensurePanelHost();
    if (!host) {
      return;
    }
    const features = getFeatures();
    const routeActive = isConfigRoute();
    const nextSignature = buildShellRenderSignature(state, features, routeActive);
    const previousSignaturePayload = parseShellRenderSignature(state.renderSignature);
    const keepModalStable =
      Boolean(previousSignaturePayload?.routeActive) &&
      String(previousSignaturePayload?.activeSettingsFeatureKey || "") !== "" &&
      String(previousSignaturePayload?.activeSettingsFeatureKey || "") === String(state.activeSettingsFeatureKey || "") &&
      Boolean(routeActive);

    if (
      state.shellNode &&
      state.shellNode.parentNode === host &&
      state.renderSignature === nextSignature
    ) {
      return;
    }

    const previousShellNode =
      state.shellNode && state.shellNode.parentNode === host ? state.shellNode : null;
    const hostScrollTop = Number(host.scrollTop || 0);
    const previousModal = previousShellNode?.querySelector?.(".ad-xconfig-modal") || null;
    const previousModalBody = previousShellNode?.querySelector?.(".ad-xconfig-modal-body") || null;
    const previousModalScrollTop = Number(previousModal?.scrollTop || 0);
    const previousModalBodyScrollTop = Number(previousModalBody?.scrollTop || 0);

    const nextShellNode = buildShellContent(documentRef, state, features);

    if (!previousShellNode) {
      host.appendChild(nextShellNode);
      state.shellNode = nextShellNode;
    } else if (keepModalStable) {
      state.renderSignature = nextSignature;
      host.scrollTop = hostScrollTop;
      const stableModal = previousShellNode?.querySelector?.(".ad-xconfig-modal") || null;
      const stableModalBody = previousShellNode?.querySelector?.(".ad-xconfig-modal-body") || null;
      if (stableModal) {
        stableModal.scrollTop = previousModalScrollTop;
      }
      if (stableModalBody) {
        stableModalBody.scrollTop = previousModalBodyScrollTop;
      }
      return;
    } else {
      while (previousShellNode.firstChild) {
        previousShellNode.removeChild(previousShellNode.firstChild);
      }
      Array.from(nextShellNode.children).forEach((child) => {
        previousShellNode.appendChild(child);
      });
      state.shellNode = previousShellNode;
    }

    state.renderSignature = nextSignature;
    host.scrollTop = hostScrollTop;

    const nextModal = state.shellNode?.querySelector?.(".ad-xconfig-modal") || null;
    const nextModalBody = state.shellNode?.querySelector?.(".ad-xconfig-modal-body") || null;
    if (nextModal) {
      nextModal.scrollTop = previousModalScrollTop;
    }
    if (nextModalBody) {
      nextModalBody.scrollTop = previousModalBodyScrollTop;
    }
  }

  function syncVisibility() {
    const sidebar = getSidebarElement(windowRef, documentRef);
    const content = getContentElement(windowRef, documentRef, sidebar);
    const host = ensurePanelHost();

    if (!content || !host) {
      return;
    }

    if (isConfigRoute()) {
      render();
      hideContent(content, host);
      host.style.display = "block";
    } else {
      if (state.contentHidden) {
        restoreContent();
      }
      state.activeSettingsFeatureKey = "";
      host.style.display = "none";
    }

    syncMenuButtonState();
    syncMenuUpdateState();
  }

  function queueSync() {
    if (!state.started || state.syncScheduled) {
      return;
    }

    state.syncScheduled = true;
    const raf =
      typeof windowRef.requestAnimationFrame === "function"
        ? windowRef.requestAnimationFrame.bind(windowRef)
        : (callback) => windowRef.setTimeout(callback, 0);

    raf(() => {
      state.syncScheduled = false;
      domGuards.ensureStyle(STYLE_ID, styleText);
      ensureMenuButton();
      syncVisibility();
    });
  }

  const isManagedNode = createManagedNodeMatcher({
    ids: [MENU_ITEM_ID, PANEL_HOST_ID, STYLE_ID],
  });

  function observeRoot() {
    const target =
      documentRef.getElementById?.("root") ||
      documentRef.documentElement ||
      documentRef.body ||
      null;

    if (!target || typeof observerRegistry?.registerMutationObserver !== "function") {
      return;
    }

    observerRegistry.registerMutationObserver({
      key: ROOT_OBSERVER_KEY,
      target,
      callback: (mutations = []) => {
        if (!hasExternalDomMutation(mutations, isManagedNode)) {
          return;
        }
        queueSync();
      },
      observeOptions: {
        childList: true,
        subtree: true,
      },
      MutationObserverRef: windowRef.MutationObserver,
    });
  }

  function patchHistory() {
    if (state.historyRestore || !windowRef.history) {
      return;
    }

    const originalPushState = windowRef.history.pushState?.bind(windowRef.history);
    const originalReplaceState = windowRef.history.replaceState?.bind(windowRef.history);

    if (typeof originalPushState !== "function" || typeof originalReplaceState !== "function") {
      return;
    }

    windowRef.history.pushState = function patchedPushState(...args) {
      const result = originalPushState(...args);
      queueSync();
      return result;
    };

    windowRef.history.replaceState = function patchedReplaceState(...args) {
      const result = originalReplaceState(...args);
      queueSync();
      return result;
    };

    state.historyRestore = () => {
      windowRef.history.pushState = originalPushState;
      windowRef.history.replaceState = originalReplaceState;
      state.historyRestore = null;
    };
  }

  function navigateToConfigRoute() {
    if (!isConfigRoute()) {
      state.lastNonConfigRoute = normalizeRoutePath(currentRoute(windowRef)) || "/lobbies";
      windowRef.history.pushState({ adxconfig: true }, "", buildConfigHashRoute());
    } else if (normalizeLegacyConfigPathIfNeeded()) {
      // Legacy /ad-xconfig URLs should be normalized once to avoid 404 on hard reload.
    }
    queueSync();
  }

  function navigateBack() {
    const target = state.lastNonConfigRoute && state.lastNonConfigRoute !== CONFIG_PATH
      ? state.lastNonConfigRoute
      : "/lobbies";
    windowRef.history.pushState({}, "", target);
    queueSync();
  }

  function withRuntimeCall(promiseLike, successMessage, errorMessage, successType = "success") {
    Promise.resolve(promiseLike)
      .then(() => {
        if (successMessage) {
          setNotice(successType, successMessage);
        }
      })
      .catch(() => {
        if (errorMessage) {
          setNotice("error", errorMessage);
        }
      })
      .finally(() => queueSync());
  }

  function handleThemeBackgroundUpload(feature) {
    const themeKey = themeKeyFromConfigKey(feature?.configKey);
    if (!themeKey || typeof runtimeApi.setThemeBackgroundImage !== "function") {
      return;
    }
    const featureKey = String(feature?.featureKey || "").trim();
    if (typeof documentRef.createElement !== "function" || typeof windowRef.FileReader !== "function") {
      setNotice("error", "Bild-Upload wird in dieser Umgebung nicht unterstützt.");
      setThemeActionFeedback(featureKey, "error", "Upload fehlgeschlagen: Diese Umgebung unterstützt keinen Bild-Upload.");
      return;
    }

    const input = documentRef.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) {
        input.onchange = null;
        input.remove?.();
        return;
      }

      const reader = new windowRef.FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "").trim();
        if (!dataUrl.startsWith("data:image/")) {
          const errorMessage = "Upload fehlgeschlagen: Die ausgewählte Datei ist kein unterstütztes Bild.";
          setNotice("error", errorMessage);
          setThemeActionFeedback(featureKey, "error", errorMessage);
          input.onchange = null;
          input.remove?.();
          return;
        }
        const fileName = String(file.name || "").trim();
        const successMessage = fileName
          ? `Hintergrundbild gespeichert: ${fileName}.`
          : "Hintergrundbild gespeichert.";
        const errorMessage = "Hintergrundbild konnte nicht gespeichert werden.";
        Promise.resolve(runtimeApi.setThemeBackgroundImage(themeKey, dataUrl))
          .then(() => {
            setNotice("success", successMessage);
            setThemeActionFeedback(featureKey, "success", successMessage);
            syncThemeBackgroundIndicators(featureKey);
          })
          .catch(() => {
            setNotice("error", errorMessage);
            setThemeActionFeedback(featureKey, "error", errorMessage);
          })
          .finally(() => queueSync());
        input.onchange = null;
        input.remove?.();
      };
      reader.onerror = () => {
        const errorMessage = "Upload fehlgeschlagen: Bild konnte nicht gelesen werden.";
        setNotice("error", errorMessage);
        setThemeActionFeedback(featureKey, "error", errorMessage);
        input.onchange = null;
        input.remove?.();
      };
      reader.readAsDataURL(file);
    };

    (documentRef.body || documentRef.documentElement).appendChild(input);
    input.click?.();
  }

  function handleAction(action, actionNode, feature) {
    if (!action) {
      return;
    }

    if (action === "open") {
      navigateToConfigRoute();
      return;
    }
    if (action === "close") {
      navigateBack();
      return;
    }
    if (action === "open-settings" && feature) {
      state.activeSettingsFeatureKey = feature.featureKey;
      queueSync();
      return;
    }
    if (action === "close-settings") {
      state.activeSettingsFeatureKey = "";
      queueSync();
      return;
    }
    if (action === "close-settings-backdrop") {
      state.activeSettingsFeatureKey = "";
      queueSync();
      return;
    }
    if (action === "open-readme") {
      openReadme(windowRef, feature?.featureKey || "");
      return;
    }
    if (action === "check-update") {
      refreshUpdateStatus({
        force: true,
        announce: true,
      });
      return;
    }
    if (action === "install-update") {
      const opened = openUserscriptInstall(windowRef);
      setNotice(
        opened ? "info" : "error",
        opened
          ? "Installations-Tab geöffnet. Bestätige das Update in Tampermonkey."
          : "Installations-Tab konnte nicht geöffnet werden."
      );
      return;
    }

    if (action === "reset" && typeof runtimeApi.resetConfig === "function") {
      const confirmed = typeof windowRef.confirm === "function"
        ? windowRef.confirm("Bist du sicher? Damit werden alle Einstellungen auf Default gesetzt und alle Module deaktiviert.")
        : true;
      if (!confirmed) {
        return;
      }
      withRuntimeCall(runtimeApi.resetConfig(), "Konfiguration wurde zurückgesetzt.", "Zurücksetzen fehlgeschlagen.", "info");
      return;
    }

    if (action === "set-feature" && feature && typeof runtimeApi.setFeatureEnabled === "function") {
      const enabled = String(actionNode?.getAttribute?.("data-feature-enabled")) === "true";
      withRuntimeCall(
        runtimeApi.setFeatureEnabled(feature.featureKey, enabled),
        `${feature.title}: ${enabled ? "An" : "Aus"}`,
        `${feature.title}: Status konnte nicht gespeichert werden.`
      );
      return;
    }

    if (action === "enable-all-themes" && typeof runtimeApi.setFeatureEnabled === "function") {
      const disabledThemeFeatures = getFeatures().filter(
        (entry) => isThemeFeature(entry) && !entry.enabled
      );
      if (!disabledThemeFeatures.length) {
        setNotice("info", "Alle Themen sind bereits aktiviert.");
        return;
      }
      const enableThemesPromise = disabledThemeFeatures.reduce((chain, entry) => {
        return chain.then(() => runtimeApi.setFeatureEnabled(entry.featureKey, true));
      }, Promise.resolve());
      withRuntimeCall(
        enableThemesPromise,
        "Alle Themen aktiviert.",
        "Themen konnten nicht vollständig aktiviert werden."
      );
      return;
    }

    if (action === "set-setting-toggle" && feature && typeof runtimeApi.saveConfig === "function") {
      const configKey = actionNode?.getAttribute?.("data-config-key") || feature.configKey;
      const settingKey = actionNode?.getAttribute?.("data-setting-key");
      const settingValue = String(actionNode?.getAttribute?.("data-setting-value")) === "true";
      if (!configKey || !settingKey) {
        return;
      }
      const toggleButtons = Array.from(
        actionNode?.parentElement?.querySelectorAll?.(
          `[data-adxconfig-action='set-setting-toggle'][data-setting-key='${settingKey}']`
        ) || []
      );
      toggleButtons.forEach((buttonNode) => {
        buttonNode.setAttribute("data-active", buttonNode === actionNode ? "true" : "false");
      });
      const hiddenInput = actionNode?.parentElement?.querySelector?.(
        `input[data-adxconfig-setting='true'][data-setting-key='${settingKey}']`
      );
      if (hiddenInput) {
        hiddenInput.checked = settingValue;
      }
      withRuntimeCall(
        runtimeApi.saveConfig(buildFeatureSettingPatch(configKey, settingKey, settingValue)),
        "Einstellung gespeichert.",
        "Einstellung konnte nicht gespeichert werden."
      );
      return;
    }

    if (action === "set-setting-select-option" && feature && typeof runtimeApi.saveConfig === "function") {
      const configKey = actionNode?.getAttribute?.("data-config-key") || feature.configKey;
      const settingKey = String(actionNode?.getAttribute?.("data-setting-key") || "").trim();
      const settingRawValue = String(actionNode?.getAttribute?.("data-setting-value") ?? "");
      if (!configKey || !settingKey) {
        return;
      }

      const descriptor = getXConfigDescriptor(feature.featureKey);
      const field = descriptor?.fields?.find(
        (entry) => entry.control === "select" && entry.key === settingKey
      ) || null;
      if (!field) {
        return;
      }

      syncSelectOptionButtons(documentRef, actionNode, settingRawValue);
      const nextValue = parseFieldValue(field, settingRawValue, false);
      withRuntimeCall(
        runtimeApi.saveConfig(buildFeatureSettingPatch(configKey, settingKey, nextValue)),
        "Einstellung gespeichert.",
        "Einstellung konnte nicht gespeichert werden."
      );
      return;
    }

    if (!feature) {
      return;
    }

    if (action === "run-feature-action" && typeof runtimeApi.runFeatureAction === "function") {
      const descriptor = getXConfigDescriptor(feature.featureKey);
      const actionId = String(actionNode?.getAttribute?.("data-feature-action-id") || "").trim();
      const actionField =
        descriptor?.fields?.find(
          (field) =>
            field.control === "action" &&
            field.action === action &&
            String(field.actionId || "").trim() === actionId
        ) || null;
      withRuntimeCall(
        runtimeApi.runFeatureAction(feature.featureKey, actionId),
        actionField?.successMessage || "Aktion ausgeführt.",
        actionField?.errorMessage || "Aktion konnte nicht ausgeführt werden.",
        "info"
      );
      return;
    }

    const themeKey = themeKeyFromConfigKey(feature.configKey);
    if (action === "clearThemeBackground" && themeKey && typeof runtimeApi.clearThemeBackgroundImage === "function") {
      const successMessage = "Hintergrundbild entfernt.";
      const errorMessage = "Hintergrundbild konnte nicht entfernt werden.";
      Promise.resolve(runtimeApi.clearThemeBackgroundImage(themeKey))
        .then(() => {
          setNotice("info", successMessage);
          setThemeActionFeedback(feature.featureKey, "info", successMessage);
          syncThemeBackgroundIndicators(feature.featureKey);
        })
        .catch(() => {
          setNotice("error", errorMessage);
          setThemeActionFeedback(feature.featureKey, "error", errorMessage);
        })
        .finally(() => queueSync());
      return;
    }

    if (action === "uploadThemeBackground" && themeKey) {
      handleThemeBackgroundUpload(feature);
    }
  }

  function onDocumentClick(event) {
    const target = event?.target;
    if (!target || typeof target.closest !== "function") {
      return;
    }

    const tabNode = target.closest("[data-adxconfig-tab]");
    if (tabNode) {
      const tabId = tabNode.getAttribute("data-adxconfig-tab") || "themes";
      if (TAB_DEFINITIONS.some((tab) => tab.id === tabId)) {
        state.activeTab = tabId;
        state.activeSettingsFeatureKey = "";
        queueSync();
      }
      return;
    }

    const actionNode = target.closest("[data-adxconfig-action]");
    if (!actionNode) {
      return;
    }
    const insideMenuButton = actionNode.id === MENU_ITEM_ID || Boolean(actionNode.closest(`#${MENU_ITEM_ID}`));
    const insidePanelHost = Boolean(actionNode.closest(`#${PANEL_HOST_ID}`));
    if (!insideMenuButton && !insidePanelHost) {
      return;
    }

    const action = actionNode.getAttribute("data-adxconfig-action");

    if (action === "close-settings-backdrop") {
      const insideModal = target.closest("[data-adxconfig-modal='true']");
      if (insideModal) {
        return;
      }
    }

    event.preventDefault?.();
    const featureKey = actionNode.getAttribute("data-feature-key");
    const feature = getFeatures().find((entry) => entry.featureKey === featureKey) || null;
    handleAction(action, actionNode, feature);
  }

  function onDocumentChange(event) {
    const target = event?.target;
    if (!target || typeof target.getAttribute !== "function") {
      return;
    }

    if (target.getAttribute("data-adxconfig-feature-toggle") === "true") {
      const featureKey = target.getAttribute("data-feature-key");
      if (featureKey && typeof runtimeApi.setFeatureEnabled === "function") {
        withRuntimeCall(
          runtimeApi.setFeatureEnabled(featureKey, Boolean(target.checked)),
          "Modulstatus gespeichert.",
          "Modulstatus konnte nicht gespeichert werden."
        );
      }
      return;
    }

    if (target.getAttribute("data-adxconfig-setting") !== "true") {
      return;
    }

    const featureKey = target.getAttribute("data-feature-key");
    const configKey = target.getAttribute("data-config-key");
    const settingKey = target.getAttribute("data-setting-key");
    if (!featureKey || !configKey || !settingKey || typeof runtimeApi.saveConfig !== "function") {
      return;
    }

    const descriptor = getXConfigDescriptor(featureKey);
    const field = descriptor?.fields?.find((entry) => entry.key === settingKey) || null;
    const nextValue = parseFieldValue(field, target.value, target.checked);
    withRuntimeCall(
      runtimeApi.saveConfig(buildFeatureSettingPatch(configKey, settingKey, nextValue)),
      "Einstellung gespeichert.",
      "Einstellung konnte nicht gespeichert werden."
    );
  }

  function onDocumentKeydown(event) {
    if (event?.key === "Escape" && state.activeSettingsFeatureKey) {
      state.activeSettingsFeatureKey = "";
      queueSync();
      return;
    }

    const target = event?.target;
    if (!target || typeof target.closest !== "function") {
      return;
    }

    const menuNode = target.closest(`#${MENU_ITEM_ID}`);
    if (!menuNode) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault?.();
      navigateToConfigRoute();
    }
  }

  function mount() {
    if (state.started) {
      queueSync();
      return;
    }

    state.started = true;
    domGuards.ensureStyle(STYLE_ID, styleText);
    patchHistory();
    normalizeLegacyConfigPathIfNeeded();

    if (typeof listenerRegistry?.register === "function") {
      listenerRegistry.register({
        key: LISTENER_KEYS.popstate,
        target: windowRef,
        type: "popstate",
        handler: () => queueSync(),
      });
      listenerRegistry.register({
        key: LISTENER_KEYS.click,
        target: documentRef,
        type: "click",
        handler: onDocumentClick,
      });
      listenerRegistry.register({
        key: LISTENER_KEYS.change,
        target: documentRef,
        type: "change",
        handler: onDocumentChange,
      });
      listenerRegistry.register({
        key: LISTENER_KEYS.keydown,
        target: documentRef,
        type: "keydown",
        handler: onDocumentKeydown,
      });
      listenerRegistry.register({
        key: LISTENER_KEYS.visibilitychange,
        target: documentRef,
        type: "visibilitychange",
        handler: onVisibilityChange,
      });
    }

    observeRoot();
    queueSync();
    startAutoUpdateChecks();
    refreshUpdateStatus({
      force: false,
      announce: false,
    });
  }

  function teardown() {
    state.started = false;
    state.activeSettingsFeatureKey = "";
    state.shellNode = null;
    state.renderSignature = "";
    clearNoticeTimer();
    stopAutoUpdateChecks();
    state.notice = { type: "", message: "" };
    restoreContent();

    if (typeof observerRegistry?.disconnect === "function") {
      observerRegistry.disconnect(ROOT_OBSERVER_KEY);
    }
    if (typeof listenerRegistry?.remove === "function") {
      Object.values(LISTENER_KEYS).forEach((key) => listenerRegistry.remove(key));
    }

    if (typeof state.historyRestore === "function") {
      state.historyRestore();
    }

    removeNodeById(documentRef, MENU_ITEM_ID);
    removeNodeById(documentRef, PANEL_HOST_ID);
    removeNodeById(documentRef, STYLE_ID);
  }

  const offStarted =
    typeof eventBus?.on === "function"
      ? eventBus.on("runtime:started", () => mount())
      : () => {};
  const offStopped =
    typeof eventBus?.on === "function"
      ? eventBus.on("runtime:stopped", () => teardown())
      : () => {};
  const offConfigUpdated =
    typeof eventBus?.on === "function"
      ? eventBus.on("runtime:config-updated", () => {
        if (state.started) {
          queueSync();
        }
      })
      : () => {};
  const offFeatureToggled =
    typeof eventBus?.on === "function"
      ? eventBus.on("runtime:feature-toggled", () => {
        if (state.started) {
          queueSync();
        }
      })
      : () => {};

  if (runtime.getSnapshot?.().started) {
    mount();
  }

  const shell = {
    mount,
    teardown,
    dispose() {
      teardown();
      offStarted();
      offStopped();
      offConfigUpdated();
      offFeatureToggled();
      shellByWindow.delete(windowRef);
    },
  };

  shellByWindow.set(windowRef, shell);
  return shell;
}

export function ensureXConfigUi(options = {}) {
  return ensureXConfigShell(options);
}

export { ensureXConfigShell };




