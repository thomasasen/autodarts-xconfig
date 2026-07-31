import britishFlagJpg from "../assets/theme-presets/british-flag.jpg";
import cyberpunkJpg from "../assets/theme-presets/cyberpunk.jpg";
import matrixPng from "../assets/theme-presets/matrix.png";
import fireJpg from "../assets/theme-presets/fire.jpg";
import iceJpg from "../assets/theme-presets/ice.jpg";
import spiderManWebp from "../assets/theme-presets/spider-man.webp";
import neonSplashWebp from "../assets/theme-presets/neon-splash.webp";
import johnWickWebp from "../assets/theme-presets/john-wick.webp";
import solarPulseWebp from "../assets/theme-presets/solar-pulse.webp";
import crimsonFacetsWebp from "../assets/theme-presets/crimson-facets.webp";
import aquaFluxWebp from "../assets/theme-presets/aqua-flux.webp";
import endgameWebp from "../assets/theme-presets/endgame.webp";
import gladiatorWebp from "../assets/theme-presets/gladiator.webp";
import deutschlandWebp from "../assets/theme-presets/deutschland.webp";
import darkSideWebp from "../assets/theme-presets/dark-side.webp";
import dartsArenaWebp from "../assets/theme-presets/darts-arena.webp";
import bayernWebp from "../assets/theme-presets/bayern.webp";

export { THEME_PRESET_ASSET_KEYS } from "./theme-preset-assets.manifest.js";

export const THEME_PRESET_ASSETS = Object.freeze({
  "british-flag": britishFlagJpg,
  cyberpunk: cyberpunkJpg,
  matrix: matrixPng,
  fire: fireJpg,
  ice: iceJpg,
  "spider-man": spiderManWebp,
  "neon-splash": neonSplashWebp,
  "john-wick": johnWickWebp,
  "solar-pulse": solarPulseWebp,
  "crimson-facets": crimsonFacetsWebp,
  "aqua-flux": aquaFluxWebp,
  endgame: endgameWebp,
  gladiator: gladiatorWebp,
  deutschland: deutschlandWebp,
  "dark-side": darkSideWebp,
  "darts-arena": dartsArenaWebp,
  bayern: bayernWebp,
});

export function resolveThemePresetAsset(assetKey) {
  const key = String(assetKey || "").trim().toLowerCase();
  return THEME_PRESET_ASSETS[key] || "";
}
