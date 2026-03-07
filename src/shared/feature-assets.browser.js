import dartAutodartsPng from "../assets/darts/Dart_autodarts.png";
import dartBlackbluePng from "../assets/darts/Dart_blackblue.png";
import dartBlackgreenPng from "../assets/darts/Dart_blackgreen.png";
import dartBlackredPng from "../assets/darts/Dart_blackred.png";
import dartBluePng from "../assets/darts/Dart_blue.png";
import dartCamouflagePng from "../assets/darts/Dart_camoflage.png";
import dartGreenPng from "../assets/darts/Dart_green.png";
import dartPridePng from "../assets/darts/Dart_pride.png";
import dartRedPng from "../assets/darts/Dart_red.png";
import dartWhitePng from "../assets/darts/Dart_white.png";
import dartWhiteTriplePng from "../assets/darts/Dart_whitetrible.png";
import dartYellowPng from "../assets/darts/Dart_yellow.png";
import dartYellowSkullPng from "../assets/darts/Dart_yellowscull.png";
import takeOutPng from "../assets/TakeOut.png";
import singleBullMp3 from "../assets/singlebull.mp3";

import { DART_DESIGN_KEYS } from "./feature-assets.manifest.js";

export const DART_DESIGNS = Object.freeze({
  autodarts: dartAutodartsPng,
  blackblue: dartBlackbluePng,
  blackgreen: dartBlackgreenPng,
  blackred: dartBlackredPng,
  blue: dartBluePng,
  camoflage: dartCamouflagePng,
  green: dartGreenPng,
  pride: dartPridePng,
  red: dartRedPng,
  white: dartWhitePng,
  whitetrible: dartWhiteTriplePng,
  yellow: dartYellowPng,
  yellowscull: dartYellowSkullPng,
});

export { DART_DESIGN_KEYS };

export function resolveDartDesignAsset(designKey) {
  const key = String(designKey || "").trim().toLowerCase();
  return DART_DESIGNS[key] || DART_DESIGNS.autodarts;
}

export const TAKEOUT_IMAGE_ASSET = takeOutPng;
export const SINGLE_BULL_SOUND_ASSET = singleBullMp3;
