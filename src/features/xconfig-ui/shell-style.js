import {
  ELECTRIC_FILTER_SOFT_ID,
  ELECTRIC_FILTER_STRONG_ID,
} from "../../shared/electric-border-engine.js";

const MENU_ITEM_ID = "ad-xconfig-menu-item";
const PANEL_HOST_ID = "ad-xconfig-panel-host";

export const styleText = `
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
#${PANEL_HOST_ID} .ad-xconfig-tabs-intro{margin-top:1rem;display:grid;gap:.2rem}
#${PANEL_HOST_ID} .ad-xconfig-tabs-title{margin:0;font-size:1rem;font-weight:800;line-height:1.25;color:rgba(245,249,255,.98)}
#${PANEL_HOST_ID} .ad-xconfig-tabs-copy{margin:0;font-size:.82rem;line-height:1.35;color:rgba(222,236,252,.82)}
#${PANEL_HOST_ID} .ad-xconfig-tabs{margin-top:1rem;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem;padding:.28rem;border-radius:14px;border:1px solid rgba(168,204,255,.2);background:rgba(5,13,33,.28);box-shadow:inset 0 0 0 1px rgba(255,255,255,.03)}
#${PANEL_HOST_ID} .ad-xconfig-btn,#${PANEL_HOST_ID} .ad-xconfig-tab{border:1px solid rgba(255,255,255,.24);border-radius:8px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer;font:inherit}
#${PANEL_HOST_ID} .ad-xconfig-btn,#${PANEL_HOST_ID} .ad-xconfig-tab{padding:.55rem .85rem}
#${PANEL_HOST_ID} .ad-xconfig-btn:hover,#${PANEL_HOST_ID} .ad-xconfig-tab:hover{background:rgba(255,255,255,.16)}
#${PANEL_HOST_ID} .ad-xconfig-btn--square{width:2.15rem;min-width:2.15rem;height:2.15rem;padding:0;display:inline-flex;align-items:center;justify-content:center;line-height:1}
#${PANEL_HOST_ID} .ad-xconfig-btn--danger{border-color:rgba(255,84,84,.42);background:rgba(255,84,84,.17)}
#${PANEL_HOST_ID} .ad-xconfig-tab{position:relative;overflow:hidden;border-color:rgba(166,196,255,.42);border-radius:12px;background:linear-gradient(160deg,rgba(255,255,255,.08),rgba(38,82,146,.14));padding:.9rem .92rem;min-height:4.2rem;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:.3rem;text-align:left;box-shadow:0 6px 16px rgba(8,20,48,.18),inset 0 0 0 1px rgba(255,255,255,.04);transition:background-color .2s ease,border-color .2s ease,box-shadow .2s ease,transform .2s ease}
#${PANEL_HOST_ID} .ad-xconfig-tab::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 1px rgba(255,255,255,.04);pointer-events:none}
#${PANEL_HOST_ID} .ad-xconfig-tab:hover{border-color:rgba(188,224,255,.82);background:linear-gradient(160deg,rgba(255,255,255,.16),rgba(55,125,195,.18));box-shadow:0 10px 22px rgba(8,20,48,.26),inset 0 0 0 1px rgba(224,241,255,.08);transform:translateY(-1px)}
#${PANEL_HOST_ID} .ad-xconfig-tab:focus-visible{outline:none;border-color:rgba(154,227,255,.98);box-shadow:0 0 0 2px rgba(112,196,255,.52),0 12px 28px rgba(12,31,72,.38)}
#${PANEL_HOST_ID} .ad-xconfig-tab[data-active="true"]{border-color:rgba(126,220,255,.98);background:linear-gradient(160deg,rgba(150,230,255,.24),rgba(41,118,215,.3));box-shadow:0 12px 28px rgba(24,96,183,.24),inset 0 0 0 1px rgba(224,245,255,.16);transform:translateY(-1px)}
#${PANEL_HOST_ID} .ad-xconfig-tab[data-active="true"]::before{content:"";position:absolute;left:.7rem;right:.7rem;bottom:0;height:.2rem;border-radius:999px;background:linear-gradient(90deg,rgba(174,247,255,.98),rgba(95,198,255,.98));box-shadow:0 0 0 1px rgba(198,245,255,.08)}
#${PANEL_HOST_ID} .ad-xconfig-tab-title{display:flex;align-items:center;gap:.45rem;font-size:1rem;font-weight:800;line-height:1.2;letter-spacing:.01em}
#${PANEL_HOST_ID} .ad-xconfig-tab[data-active="true"] .ad-xconfig-tab-title{color:rgba(248,252,255,.99)}
#${PANEL_HOST_ID} .ad-xconfig-tab-desc{display:block;font-size:.76rem;line-height:1.25;color:rgba(223,236,252,.88);font-weight:500}
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
#${PANEL_HOST_ID} .ad-xconfig-card--theme-global{grid-column:1/-1;min-height:16.5rem;padding:1.05rem 1.1rem 1rem;border-color:rgba(116,229,255,.58);background:linear-gradient(160deg,rgba(11,30,60,.9) 0%,rgba(18,49,91,.88) 58%,rgba(16,37,70,.92) 100%);box-shadow:inset 0 0 0 1px rgba(120,230,255,.12),0 10px 28px rgba(6,18,38,.28)}
#${PANEL_HOST_ID} .ad-xconfig-card-bg{position:absolute;inset:0;pointer-events:none}
#${PANEL_HOST_ID} .ad-xconfig-card-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(15,27,67,.88) 0%,rgba(15,27,67,.84) 40%,rgba(15,27,67,.36) 70%,rgba(15,27,67,.2) 100%),radial-gradient(100% 100% at 90% 10%,rgba(45,108,198,.35) 0%,rgba(45,108,198,0) 70%)}
#${PANEL_HOST_ID} .ad-xconfig-card-bg img{position:absolute;top:0;right:0;width:72%;height:100%;object-fit:cover;opacity:.5;filter:saturate(.85)}
#${PANEL_HOST_ID} .ad-xconfig-card--theme-global .ad-xconfig-card-bg::before{content:"";position:absolute;inset:0;background:linear-gradient(125deg,rgba(126,216,255,.16),rgba(126,216,255,0) 38%),repeating-linear-gradient(135deg,rgba(126,216,255,.08) 0 2px,transparent 2px 14px),repeating-linear-gradient(90deg,rgba(255,255,255,.04) 0 1px,transparent 1px 56px);opacity:.9}
#${PANEL_HOST_ID} .ad-xconfig-card--theme-global .ad-xconfig-card-bg::after{background:linear-gradient(90deg,rgba(8,20,42,.94) 0%,rgba(8,20,42,.88) 42%,rgba(8,20,42,.48) 70%,rgba(8,20,42,.24) 100%),radial-gradient(90% 90% at 92% 8%,rgba(60,207,255,.28) 0%,rgba(60,207,255,0) 72%)}
#${PANEL_HOST_ID} .ad-xconfig-card--theme-global .ad-xconfig-card-bg img{width:48%;opacity:.24;filter:saturate(1.05) contrast(1.05)}
#${PANEL_HOST_ID} .ad-xconfig-card--theme-global .ad-xconfig-card-content{max-width:min(60rem,100%)}
#${PANEL_HOST_ID} .ad-xconfig-card--theme-global .ad-xconfig-card-copy{max-width:48rem}
#${PANEL_HOST_ID} .ad-xconfig-card-content{position:relative;z-index:1}
#${PANEL_HOST_ID} .ad-xconfig-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:.8rem;margin-bottom:.85rem}
#${PANEL_HOST_ID} .ad-xconfig-card-title{margin:0;font-size:.98rem}
#${PANEL_HOST_ID} .ad-xconfig-card-copy{margin:.4rem 0 0;color:rgba(255,255,255,.76);font-size:.84rem;line-height:1.35}
#${PANEL_HOST_ID} .ad-xconfig-card-badges{margin-top:.75rem;display:flex;gap:.5rem;flex-wrap:wrap}
#${PANEL_HOST_ID} .ad-xconfig-card-global-summary{margin-top:.85rem;display:grid;gap:.58rem}
#${PANEL_HOST_ID} .ad-xconfig-card-global-badges{display:flex;gap:.45rem;flex-wrap:wrap}
#${PANEL_HOST_ID} .ad-xconfig-card-global-badge{display:inline-flex;align-items:center;padding:.22rem .62rem;border-radius:999px;font-size:.67rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase}
#${PANEL_HOST_ID} .ad-xconfig-card-global-badge--primary{background:rgba(86,219,255,.18);border:1px solid rgba(132,231,255,.5);color:rgba(235,250,255,.98)}
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
#${PANEL_HOST_ID} .ad-xconfig-option-item--effect-preview{position:relative;overflow:hidden;transform-origin:center;will-change:transform,filter,box-shadow}
#${PANEL_HOST_ID} .ad-xconfig-option-item--effect-preview>*{position:relative;z-index:1}
#${PANEL_HOST_ID} .ad-xconfig-option-item--effect-preview::before,#${PANEL_HOST_ID} .ad-xconfig-option-item--effect-preview::after{content:"";position:absolute;z-index:0;pointer-events:none;opacity:0}
#${PANEL_HOST_ID} .ad-xconfig-option-item--effect-preview::before{inset:-35%;background:linear-gradient(115deg,transparent 0%,rgba(255,255,255,.08) 36%,rgba(181,234,255,.38) 50%,rgba(255,255,255,.08) 64%,transparent 100%);transform:translateX(-78%) skewX(-14deg)}
#${PANEL_HOST_ID} .ad-xconfig-option-item--effect-preview::after{inset:-2px;border-radius:inherit}
#${PANEL_HOST_ID} .ad-xconfig-option-item:hover{border-color:rgba(154,227,255,.56);background:rgba(74,178,255,.16)}
#${PANEL_HOST_ID} .ad-xconfig-option-item:focus-visible{outline:none;border-color:rgba(154,227,255,.95);box-shadow:0 0 0 2px rgba(112,196,255,.4)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="emphasis"]:hover,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="emphasis"]:focus-visible{animation:ad-xconfig-effect-preview-emphasis 680ms cubic-bezier(.14,.92,.24,1)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="shake"]:hover,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="shake"]:focus-visible{animation:ad-xconfig-effect-preview-shake 520ms ease-out}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="pulse"]:hover,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="pulse"]:focus-visible{animation:ad-xconfig-effect-preview-pulse 700ms ease-out}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="turn"]:hover,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="turn"]:focus-visible{animation:ad-xconfig-effect-preview-turn 860ms ease-out}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="sheen"]:hover,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="sheen"]:focus-visible{animation:ad-xconfig-effect-preview-sheen 680ms ease-out}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="sheen"]:hover::before,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="sheen"]:focus-visible::before{animation:ad-xconfig-effect-preview-sheen-light 680ms ease-out}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="shockwave"]:hover,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="shockwave"]:focus-visible{animation:ad-xconfig-effect-preview-shockwave 720ms ease-out}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-arc"]{--ad-ext-hit-edge:rgba(126,200,255,.94);--ad-ext-hit-glow:rgba(33,150,243,.64);--ad-ext-hit-soft-glow:rgba(33,150,243,.3);--ad-ext-hit-electric-filter-soft:url(#${ELECTRIC_FILTER_SOFT_ID});--ad-ext-hit-electric-filter-strong:url(#${ELECTRIC_FILTER_STRONG_ID})}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-arc"]:hover,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-arc"]:focus-visible{overflow:visible;z-index:2;animation:ad-xconfig-hit-row-electric-arc 780ms cubic-bezier(.14,.92,.24,1)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-arc"]:hover::before,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-arc"]:focus-visible::before{inset:-7px;border-radius:calc(8px + 3px);border:1.1px solid color-mix(in srgb,var(--ad-ext-hit-edge) 74%,white 26%);background:linear-gradient(112deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,0) 34%,rgba(255,255,255,0) 66%,rgba(255,255,255,.22) 100%);mix-blend-mode:screen;opacity:.9;transform:translate3d(0,0,0);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),inset 0 0 8px color-mix(in srgb,var(--ad-ext-hit-edge) 18%,transparent),0 0 12px color-mix(in srgb,var(--ad-ext-hit-glow) 42%,white 58%),0 0 24px color-mix(in srgb,var(--ad-ext-hit-soft-glow) 46%,white 54%);filter:var(--ad-ext-hit-electric-filter-strong);animation:ad-xconfig-hit-electric-arc-frame-electric 760ms steps(4,end),ad-xconfig-hit-electric-arc-frame-glow 760ms ease-in-out}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-arc"]:hover::after,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-arc"]:focus-visible::after{inset:-12px;border-radius:calc(8px + 6px);border:none;opacity:.62;background:radial-gradient(66% 150% at 50% 0%,color-mix(in srgb,var(--ad-ext-hit-edge) 52%,white 48%),transparent 74%),radial-gradient(66% 150% at 50% 100%,color-mix(in srgb,var(--ad-ext-hit-glow) 62%,white 38%),transparent 76%);box-shadow:none;filter:var(--ad-ext-hit-electric-filter-soft) brightness(1.02);animation:ad-xconfig-hit-electric-arc-frame-aura 760ms ease-out}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-arc"]:hover .ad-xconfig-option-label,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-arc"]:focus-visible .ad-xconfig-option-label{display:inline-block;animation:ad-xconfig-hit-score-electric-arc 760ms cubic-bezier(.14,.92,.24,1)}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-arc"]:hover .ad-xconfig-option-copy,#${PANEL_HOST_ID} .ad-xconfig-option-item[data-preview-effect="electric-arc"]:focus-visible .ad-xconfig-option-copy{animation:ad-xconfig-hit-segment-electric-arc 620ms linear}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-active="true"]{border-color:rgba(126,216,255,.56);background:rgba(58,148,255,.16);box-shadow:0 0 0 1px rgba(126,216,255,.16) inset}
#${PANEL_HOST_ID} .ad-xconfig-option-item[data-active="false"] .ad-xconfig-option-label{color:rgba(232,244,255,.92)}
#${PANEL_HOST_ID} .ad-xconfig-option-head{display:flex;align-items:center;justify-content:space-between;gap:.5rem}
#${PANEL_HOST_ID} .ad-xconfig-option-label{font-size:.75rem;font-weight:700;color:#fff}
#${PANEL_HOST_ID} .ad-xconfig-option-item--typography-font{padding:.79rem .9rem;min-height:4.51rem;border-radius:11px}
#${PANEL_HOST_ID} .ad-xconfig-option-item--typography-font .ad-xconfig-option-head{align-items:flex-start}
#${PANEL_HOST_ID} .ad-xconfig-option-item--typography-font .ad-xconfig-option-label{font-size:1.19rem;line-height:1.2;font-weight:600;letter-spacing:.01em}
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
#${PANEL_HOST_ID} .ad-xconfig-settings-section{display:grid;gap:.65rem}
#${PANEL_HOST_ID} .ad-xconfig-settings-section + .ad-xconfig-settings-section{margin-top:.15rem}
#${PANEL_HOST_ID} .ad-xconfig-settings-section-title{margin:0;font-size:.76rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:rgba(196,230,255,.96)}
#${PANEL_HOST_ID} .ad-xconfig-settings-section-body{display:grid;gap:.65rem}
#${PANEL_HOST_ID} .ad-xconfig-setting-row{border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);padding:.75rem}
#${PANEL_HOST_ID} .ad-xconfig-setting-row--debug{border-color:rgba(255,128,128,.36);background:linear-gradient(145deg,rgba(255,96,96,.14),rgba(255,120,120,.07))}
#${PANEL_HOST_ID} .ad-xconfig-setting-label{display:block;font-weight:700;font-size:.86rem}
#${PANEL_HOST_ID} .ad-xconfig-setting-input{margin-top:.58rem}
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
#${PANEL_HOST_ID} .ad-xconfig-turn-dart-image-preview{height:3.4rem;object-fit:cover;object-position:center center}
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
@keyframes ad-xconfig-effect-preview-shockwave{0%{transform:scale(.98);box-shadow:0 0 0 0 rgba(126,216,255,.26)}34%{transform:scale(1.055);box-shadow:0 0 0 4px rgba(126,216,255,.22),0 0 20px rgba(126,216,255,.18)}62%{transform:scale(1.005);box-shadow:0 0 0 8px rgba(126,216,255,0)}100%{transform:scale(1);box-shadow:0 0 0 1px rgba(126,216,255,.16) inset}}
@keyframes ad-xconfig-hit-row-electric-arc{0%{transform:translate(0,0) scale(.992);filter:saturate(1.04) brightness(.98)}36%{transform:translate(-1px,.6px) scale(1.012);filter:saturate(1.14) brightness(1.1)}68%{transform:translate(1px,-.7px) scale(1.006);filter:saturate(1.08) brightness(1.04)}100%{transform:translate(0,0) scale(1);filter:saturate(1.06) brightness(1.02)}}
@keyframes ad-xconfig-hit-score-electric-arc{0%{transform:translateX(0) scale(1);letter-spacing:.01em;filter:brightness(1.02)}24%{transform:translateX(1.8px) scale(1.16);letter-spacing:.07em;filter:brightness(1.24) drop-shadow(0 0 7px rgba(221,249,255,.56))}48%{transform:translateX(-1.6px) scale(1.06);letter-spacing:.05em;filter:brightness(1.14) drop-shadow(0 0 5px rgba(180,250,255,.38))}70%{transform:translateX(1px) scale(1.03);letter-spacing:.04em;filter:brightness(1.14)}100%{transform:translateX(0) scale(1);letter-spacing:.01em;filter:brightness(1.03)}}
@keyframes ad-xconfig-hit-segment-electric-arc{0%{transform:translateX(0) translateY(0);letter-spacing:.1em;opacity:1;filter:brightness(1.02)}42%{transform:translateX(-1.4px) translateY(-.4px);letter-spacing:.13em;filter:brightness(1.22)}68%{transform:translateX(1px) translateY(.4px);letter-spacing:.11em;filter:brightness(1.14)}100%{transform:translateX(0) translateY(0);letter-spacing:.1em;opacity:1;filter:brightness(1.02)}}
@keyframes ad-xconfig-hit-electric-arc-frame-electric{0%,100%{transform:translate(0,0);filter:var(--ad-ext-hit-electric-filter-strong)}38%{transform:translate(-1px,.5px);filter:var(--ad-ext-hit-electric-filter-strong) brightness(1.12) saturate(1.08)}72%{transform:translate(1.1px,-.8px);filter:var(--ad-ext-hit-electric-filter-strong) brightness(1.06) saturate(1.04)}}
@keyframes ad-xconfig-hit-electric-arc-frame-glow{0%,100%{box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),inset 0 0 12px color-mix(in srgb,var(--ad-ext-hit-edge) 24%,transparent),0 0 18px color-mix(in srgb,var(--ad-ext-hit-soft-glow) 58%,white 42%),0 0 34px color-mix(in srgb,var(--ad-ext-hit-glow) 46%,white 54%);opacity:.82}44%{box-shadow:inset 0 0 0 1px rgba(255,255,255,.16),inset 0 0 18px color-mix(in srgb,var(--ad-ext-hit-edge) 34%,transparent),0 0 24px color-mix(in srgb,var(--ad-ext-hit-soft-glow) 64%,white 36%),0 0 48px color-mix(in srgb,var(--ad-ext-hit-glow) 54%,white 46%);opacity:1}}
@keyframes ad-xconfig-hit-electric-arc-frame-aura{0%,100%{opacity:.52;transform:scale(1)}46%{opacity:.84;transform:scale(1.02)}}
@media(max-width:1180px){#${PANEL_HOST_ID} .ad-xconfig-grid{grid-template-columns:1fr}#${PANEL_HOST_ID} .ad-xconfig-card--theme-global{grid-column:auto}}
@media(max-width:880px){#${PANEL_HOST_ID} .ad-xconfig-tabs{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:640px){#${PANEL_HOST_ID} .ad-xconfig-color-controls{grid-template-columns:auto auto minmax(0,1fr);grid-template-areas:"swatch picker reset" "code code code"}#${PANEL_HOST_ID} .ad-xconfig-color-swatch{grid-area:swatch}#${PANEL_HOST_ID} .ad-xconfig-color-picker{grid-area:picker}#${PANEL_HOST_ID} .ad-xconfig-color-code{grid-area:code}#${PANEL_HOST_ID} .ad-xconfig-mini-btn--color-reset{grid-area:reset;justify-self:end}}
@media(prefers-reduced-motion:reduce){#${PANEL_HOST_ID} .ad-xconfig-option-item--effect-preview,#${PANEL_HOST_ID} .ad-xconfig-option-item--effect-preview::before,#${PANEL_HOST_ID} .ad-xconfig-option-item--effect-preview::after{animation:none!important;transform:none!important;transition:none!important}}
`;


