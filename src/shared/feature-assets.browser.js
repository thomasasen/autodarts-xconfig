import dartAIReplicantPng from "../assets/darts/Dart_aIreplicant.png";
import dartAutodartsPng from "../assets/darts/Dart_autodarts.png";
import dartBlackbluePng from "../assets/darts/Dart_blackblue.png";
import dartBlackgreenPng from "../assets/darts/Dart_blackgreen.png";
import dartBlackredPng from "../assets/darts/Dart_blackred.png";
import dartBluePng from "../assets/darts/Dart_blue.png";
import dartBulletPng from "../assets/darts/Dart_bullet.png";
import dartCamouflagePng from "../assets/darts/Dart_camoflage.png";
import dartGermanGiantPng from "../assets/darts/Dart_germangiant.png";
import dartGreenPng from "../assets/darts/Dart_green.png";
import dartMandalorianPng from "../assets/darts/Dart_mandalorian.png";
import dartNukePng from "../assets/darts/Dart_nuke.png";
import dartPhilTaylorPng from "../assets/darts/Dart_philtaylor.png";
import dartPridePng from "../assets/darts/Dart_pride.png";
import dartRedPng from "../assets/darts/Dart_red.png";
import dartSnakebitePng from "../assets/darts/Dart_snakebite.png";
import dartStandardPng from "../assets/darts/Dart_standard.png";
import dartStandardYellowPng from "../assets/darts/Dart_stdyellow.png";
import dartStandardYellow2Png from "../assets/darts/Dart_stdyellow2.png";
import dartUltramarinePng from "../assets/darts/Dart_ultramarine.png";
import dartWhitePng from "../assets/darts/Dart_white.png";
import dartWhiteTriplePng from "../assets/darts/Dart_whitetrible.png";
import dartYellowPng from "../assets/darts/Dart_yellow.png";
import dartYellowSkullPng from "../assets/darts/Dart_yellowscull.png";
export { DART_DESIGN_KEYS } from "./feature-assets.manifest.js";
export { default as TAKEOUT_IMAGE_ASSET } from "../assets/TakeOut.png";
export { default as SINGLE_BULL_SOUND_ASSET } from "../assets/singlebull.mp3";
export { default as X01_BUST_GLASS_CRACK_SOUND_ASSET } from "../assets/glasscrack.mp3";

export const DART_DESIGNS = Object.freeze({
  aireplicant: dartAIReplicantPng,
  bullet: dartBulletPng,
  germangiant: dartGermanGiantPng,
  mandalorian: dartMandalorianPng,
  nuke: dartNukePng,
  philtaylor: dartPhilTaylorPng,
  snakebite: dartSnakebitePng,
  standard: dartStandardPng,
  stdyellow: dartStandardYellowPng,
  stdyellow2: dartStandardYellow2Png,
  ultramarine: dartUltramarinePng,
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

export function resolveDartDesignAsset(designKey) {
  const key = String(designKey || "").trim().toLowerCase();
  return DART_DESIGNS[key] || DART_DESIGNS.autodarts;
}

