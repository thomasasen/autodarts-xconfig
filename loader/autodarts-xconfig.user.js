// ==UserScript==
// @name         autodarts-xconfig
// @namespace    https://github.com/thomasasen/autodarts-xconfig
// @version      3.7.0
// @description  Modular, side-effect resistant Tampermonkey runtime for Autodarts enhancements.
// @author       Thomas Asen
// @license      MIT
// @match        https://play.autodarts.com/*
// @exclude      https://play.autodarts.com/boards
// @exclude      https://play.autodarts.com/boards/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM.getValue
// @grant        GM.setValue
// @connect      raw.githubusercontent.com
// @downloadURL  https://github.com/thomasasen/autodarts-xconfig/releases/latest/download/autodarts-xconfig.user.js
// @updateURL    https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.meta.js
// ==/UserScript==

import { initializeTampermonkeyRuntime } from "../src/runtime/bootstrap-runtime.js";

(async function bootstrapUserscript() {
  "use strict";

  const windowRef = globalThis.window !== undefined ? globalThis.window : null;
  if (!windowRef) {
    return;
  }

  const documentRef = windowRef.document || null;
  try {
    await initializeTampermonkeyRuntime({
      windowRef,
      documentRef,
      gmRequest: typeof GM_xmlhttpRequest === "function" ? GM_xmlhttpRequest : null,
    });
  } catch (error) {
    console.error("[autodarts-xconfig] userscript bootstrap failed", error);
  }
})();

