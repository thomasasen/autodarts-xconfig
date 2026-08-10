export const USERSCRIPT_ASSET_LOADERS = Object.freeze({
  ".png": "dataurl",
  ".jpg": "dataurl",
  ".jpeg": "dataurl",
  ".gif": "dataurl",
  ".webp": "dataurl",
  ".mp3": "dataurl",
});

export const USERSCRIPT_BROWSER_TARGETS = Object.freeze(["chrome100", "firefox100"]);

export function buildUserscriptHeader(packageVersion) {
  const version = String(packageVersion || "").trim() || "0.0.0";
  return `// ==UserScript==
// @name         autodarts-xconfig
// @namespace    https://github.com/thomasasen/autodarts-xconfig
// @version      ${version}
// @description  Modular, side-effect resistant Tampermonkey runtime for Autodarts enhancements.
// @author       Thomas Asen
// @license      MIT
// @match        https://play.autodarts.io/*
// @match        https://play.autodarts.com/*
// @exclude      https://play.autodarts.io/boards
// @exclude      https://play.autodarts.io/boards/*
// @exclude      https://play.autodarts.com/boards
// @exclude      https://play.autodarts.com/boards/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @downloadURL  https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.user.js
// @updateURL    https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.meta.js
// ==/UserScript==
`;
}
