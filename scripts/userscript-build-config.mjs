export const USERSCRIPT_ASSET_LOADERS = Object.freeze({
  ".png": "dataurl",
  ".jpg": "dataurl",
  ".jpeg": "dataurl",
  ".gif": "dataurl",
  ".webp": "dataurl",
  ".mp3": "dataurl",
});

export const USERSCRIPT_BROWSER_TARGETS = Object.freeze(["chrome100", "firefox100"]);

export const USERSCRIPT_UPDATE_URL =
  "https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.meta.js";
export const USERSCRIPT_LEGACY_DOWNLOAD_URL =
  "https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.user.js";
export const USERSCRIPT_RELEASE_DOWNLOAD_URL =
  "https://github.com/thomasasen/autodarts-xconfig/releases/latest/download/autodarts-xconfig.user.js";

function compareSemver(left, right) {
  const leftParts = String(left || "").split(".").map(Number);
  const rightParts = String(right || "").split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (difference !== 0) {
      return difference;
    }
  }
  return 0;
}

export function resolveUserscriptDownloadUrl(version) {
  return compareSemver(version, "2.9.2") >= 0
    ? USERSCRIPT_RELEASE_DOWNLOAD_URL
    : USERSCRIPT_LEGACY_DOWNLOAD_URL;
}

export function buildUserscriptHeader(packageVersion) {
  const version = String(packageVersion || "").trim() || "0.0.0";
  const downloadUrl = resolveUserscriptDownloadUrl(version);
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
// @downloadURL  ${downloadUrl}
// @updateURL    ${USERSCRIPT_UPDATE_URL}
// ==/UserScript==
`;
}
