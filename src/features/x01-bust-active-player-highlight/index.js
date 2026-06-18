import {
  clearBustActivePlayerHighlightState,
  createBustActivePlayerHighlightState,
  syncBustActivePlayerHighlight,
} from "./logic.js";
import { STYLE_ID, buildStyleText } from "./style.js";
import { createFeatureMountHarness } from "../shared/feature-mount-harness.js";

const FEATURE_KEY = "x01-bust-active-player-highlight";
const OBSERVER_KEY = `${FEATURE_KEY}:dom-observer`;

export function mountX01BustActivePlayerHighlight(context = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const domGuards = context.domGuards;

  if (!documentRef || !domGuards) {
    return () => {};
  }

  domGuards.ensureStyle(STYLE_ID, buildStyleText());

  const state = createBustActivePlayerHighlightState();
  const update = () => {
    syncBustActivePlayerHighlight(
      {
        ...context,
        documentRef,
        windowRef,
      },
      state
    );
  };

  const harness = createFeatureMountHarness(context, {
    isSupported: ({ documentRef: nextDocumentRef }) => Boolean(nextDocumentRef && domGuards),
    update,
  });
  if (!harness) {
    domGuards.removeNodeById(STYLE_ID);
    return () => {};
  }

  harness.registerObserver({
    key: OBSERVER_KEY,
    callback: () => harness.schedule(),
    observeOptions: {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class"],
    },
  });
  harness.subscribeToGameState();
  harness.schedule();

  return harness.createCleanup(() => {
    clearBustActivePlayerHighlightState(state, windowRef);
    domGuards.removeNodeById(STYLE_ID);
  });
}

export const initializeX01BustActivePlayerHighlight = mountX01BustActivePlayerHighlight;
export const initialize = mountX01BustActivePlayerHighlight;
export const mount = mountX01BustActivePlayerHighlight;
