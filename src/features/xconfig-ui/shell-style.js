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
@media(max-width:640px){#${PANEL_HOST_ID} .ad-xconfig-color-controls{grid-template-columns:auto auto minmax(0,1fr);grid-template-areas:"swatch picker reset" "code code code"}#${PANEL_HOST_ID} .ad-xconfig-color-swatch{grid-area:swatch}#${PANEL_HOST_ID} .ad-xconfig-color-picker{grid-area:picker}#${PANEL_HOST_ID} .ad-xconfig-color-code{grid-area:code}#${PANEL_HOST_ID} .ad-xconfig-mini-btn--color-reset{grid-area:reset;justify-self:end}}
`;


