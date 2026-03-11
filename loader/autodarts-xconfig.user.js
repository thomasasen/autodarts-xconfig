// ==UserScript==
// @name         autodarts-xconfig
// @namespace    https://github.com/thomasasen/autodarts-xconfig
// @version      1.1.39
// @description  Modular, side-effect resistant Tampermonkey runtime for Autodarts enhancements.
// @author       Thomas Asen
// @license      MIT
// @match        https://play.autodarts.io/*
// @run-at       document-start
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.user.js
// @updateURL    https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.user.js
// ==/UserScript==

import { initializeTampermonkeyRuntime } from "../src/runtime/bootstrap-runtime.js";

(async function bootstrapUserscript() {
  "use strict";

  const windowRef = typeof window !== "undefined" ? window : null;
  if (!windowRef) {
    return;
  }

  const documentRef = windowRef.document || null;
  const loaderGuardAttribute = "data-adxconfig-loader-started";
  const rootNode = documentRef?.documentElement || null;
  if (rootNode && rootNode.getAttribute(loaderGuardAttribute) === "1") {
    if (windowRef.__adXConfig && typeof windowRef.__adXConfig.start === "function") {
      windowRef.__adXConfig.start();
      return;
    }
  }
  if (rootNode) {
    rootNode.setAttribute(loaderGuardAttribute, "1");
  }

  if (windowRef.__adXConfig && typeof windowRef.__adXConfig.start === "function") {
    windowRef.__adXConfig.start();
    return;
  }

  try {
    await initializeTampermonkeyRuntime({
      windowRef,
      documentRef,
      gmGetValue: typeof GM_getValue === "function" ? GM_getValue : null,
      gmSetValue: typeof GM_setValue === "function" ? GM_setValue : null,
    });
  } catch (error) {
    console.error("[autodarts-xconfig] userscript bootstrap failed", error);
  }
})();

