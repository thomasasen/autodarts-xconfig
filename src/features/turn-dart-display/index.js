import { mountGlobalMatchStyle } from "../themes/shared/mount-global-match-style.js";
import {
  TURN_DART_DISPLAY_STYLE_ID,
  buildTurnDartDisplayStyleText,
} from "./style.js";

const FEATURE_KEY = "turn-dart-display";
const CONFIG_KEY = "turnDartDisplay";

export function mountTurnDartDisplay(context = {}) {
  return mountGlobalMatchStyle(context, {
    featureKey: FEATURE_KEY,
    configKey: CONFIG_KEY,
    styleId: TURN_DART_DISPLAY_STYLE_ID,
    buildStyleText: buildTurnDartDisplayStyleText,
  });
}

export const initializeTurnDartDisplay = mountTurnDartDisplay;
export const initialize = mountTurnDartDisplay;
export const mount = mountTurnDartDisplay;
