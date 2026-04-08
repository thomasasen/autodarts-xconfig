const DEFAULT_SANS_STACK = '"Open Sans", "Segoe UI", Tahoma, sans-serif';
const DEFAULT_MONO_STACK = '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';
const DEFAULT_SERIF_STACK = 'Georgia, "Times New Roman", serif';
const DEFAULT_SCRIPT_STACK = '"Segoe Print", "Bradley Hand", cursive';

function buildFamilyStack(familyName, fallbackStack) {
  const normalizedFamilyName = String(familyName || "").trim();
  const normalizedFallbackStack = String(fallbackStack || "").trim();
  if (!normalizedFamilyName) {
    return normalizedFallbackStack || DEFAULT_SANS_STACK;
  }
  return `"${normalizedFamilyName}", ${normalizedFallbackStack || DEFAULT_SANS_STACK}`;
}

function createFontPreset(value, label, familyName, fallbackStack) {
  return Object.freeze({
    value: String(value || "").trim(),
    label: String(label || "").trim(),
    familyName: String(familyName || "").trim(),
    fontFamily: buildFamilyStack(familyName, fallbackStack),
    previewFontFamily: buildFamilyStack(familyName, fallbackStack),
    remote: true,
  });
}

const REMOTE_FONT_PRESET_DEFINITIONS = Object.freeze([
  Object.freeze({ value: "aldrich", label: "Aldrich", familyName: "Aldrich", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "allerta", label: "Allerta", familyName: "Allerta", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "alumni-sans", label: "Alumni Sans", familyName: "Alumni Sans", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "alumni-sans-inline-one", label: "Alumni Sans Inline One", familyName: "Alumni Sans Inline One", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "anton", label: "Anton", familyName: "Anton", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "anybody", label: "Anybody", familyName: "Anybody", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "archivo-black", label: "Archivo Black", familyName: "Archivo Black", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "armata", label: "Armata", familyName: "Armata", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "audiowide", label: "Audiowide", familyName: "Audiowide", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "averia-libre", label: "Averia Libre", familyName: "Averia Libre", fallbackStack: DEFAULT_SERIF_STACK }),
  Object.freeze({ value: "averia-sans-libre", label: "Averia Sans Libre", familyName: "Averia Sans Libre", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "bai-jamjuree", label: "Bai Jamjuree", familyName: "Bai Jamjuree", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "big-shoulders-stencil", label: "Big Shoulders Stencil", familyName: "Big Shoulders Stencil", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "black-ops-one", label: "Black Ops One", familyName: "Black Ops One", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "bruno-ace", label: "Bruno Ace", familyName: "Bruno Ace", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "bungee", label: "Bungee", familyName: "Bungee", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "bungee-inline", label: "Bungee Inline", familyName: "Bungee Inline", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "bungee-shade", label: "Bungee Shade", familyName: "Bungee Shade", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "cairo-play", label: "Cairo Play", familyName: "Cairo Play", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "caramel", label: "Caramel", familyName: "Caramel", fallbackStack: DEFAULT_SCRIPT_STACK }),
  Object.freeze({ value: "caveat", label: "Caveat", familyName: "Caveat", fallbackStack: DEFAULT_SCRIPT_STACK }),
  Object.freeze({ value: "caveat-brush", label: "Caveat Brush", familyName: "Caveat Brush", fallbackStack: DEFAULT_SCRIPT_STACK }),
  Object.freeze({ value: "chakra-petch", label: "Chakra Petch", familyName: "Chakra Petch", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "chilanka", label: "Chilanka", familyName: "Chilanka", fallbackStack: DEFAULT_SCRIPT_STACK }),
  Object.freeze({ value: "courier-prime", label: "Courier Prime", familyName: "Courier Prime", fallbackStack: DEFAULT_MONO_STACK }),
  Object.freeze({ value: "cute-font", label: "Cute Font", familyName: "Cute Font", fallbackStack: DEFAULT_SCRIPT_STACK }),
  Object.freeze({ value: "dangrek", label: "Dangrek", familyName: "Dangrek", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "days-one", label: "Days One", familyName: "Days One", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "ewert", label: "Ewert", familyName: "Ewert", fallbackStack: DEFAULT_SERIF_STACK }),
  Object.freeze({ value: "faster-one", label: "Faster One", familyName: "Faster One", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "finger-paint", label: "Finger Paint", familyName: "Finger Paint", fallbackStack: DEFAULT_SCRIPT_STACK }),
  Object.freeze({ value: "foldit", label: "Foldit", familyName: "Foldit", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "fredericka-the-great", label: "Fredericka the Great", familyName: "Fredericka the Great", fallbackStack: DEFAULT_SERIF_STACK }),
  Object.freeze({ value: "fragment-mono", label: "Fragment Mono", familyName: "Fragment Mono", fallbackStack: DEFAULT_MONO_STACK }),
  Object.freeze({ value: "frijole", label: "Frijole", familyName: "Frijole", fallbackStack: DEFAULT_SERIF_STACK }),
  Object.freeze({ value: "fugaz-one", label: "Fugaz One", familyName: "Fugaz One", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "goldman", label: "Goldman", familyName: "Goldman", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "inconsolata", label: "Inconsolata", familyName: "Inconsolata", fallbackStack: DEFAULT_MONO_STACK }),
  Object.freeze({ value: "indie-flower", label: "Indie Flower", familyName: "Indie Flower", fallbackStack: DEFAULT_SCRIPT_STACK }),
  Object.freeze({ value: "inria-sans", label: "Inria Sans", familyName: "Inria Sans", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "jersey-15", label: "Jersey 15", familyName: "Jersey 15", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "keania-one", label: "Keania One", familyName: "Keania One", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "permanent-marker", label: "Permanent Marker", familyName: "Permanent Marker", fallbackStack: DEFAULT_SCRIPT_STACK }),
  Object.freeze({ value: "plaster", label: "Plaster", familyName: "Plaster", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "saira-stencil-one", label: "Saira Stencil One", familyName: "Saira Stencil One", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "share-tech-mono", label: "Share Tech Mono", familyName: "Share Tech Mono", fallbackStack: DEFAULT_MONO_STACK }),
  Object.freeze({ value: "stardos-stencil", label: "Stardos Stencil", familyName: "Stardos Stencil", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "wallpoet", label: "Wallpoet", familyName: "Wallpoet", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "zen-dots", label: "Zen Dots", familyName: "Zen Dots", fallbackStack: DEFAULT_SANS_STACK }),
  Object.freeze({ value: "zilla-slab-highlight", label: "Zilla Slab Highlight", familyName: "Zilla Slab Highlight", fallbackStack: DEFAULT_SERIF_STACK }),
]);

export const THEME_GLOBAL_TYPOGRAPHY_SCOPE_OPTIONS = Object.freeze([
  Object.freeze({
    value: "scores",
    label: "Scores",
  }),
  Object.freeze({
    value: "throws",
    label: "Würfe",
  }),
  Object.freeze({
    value: "names",
    label: "Namen",
  }),
]);

export const THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS = Object.freeze([
  Object.freeze({
    value: "system",
    label: "Standard (deaktiviert)",
    familyName: "",
    fontFamily: DEFAULT_SANS_STACK,
    previewFontFamily: DEFAULT_SANS_STACK,
    remote: false,
  }),
  ...REMOTE_FONT_PRESET_DEFINITIONS
    .slice()
    .sort((left, right) => left.label.localeCompare(right.label, "de", { sensitivity: "base" }))
    .map((preset) =>
      createFontPreset(
        preset.value,
        preset.label,
        preset.familyName,
        preset.fallbackStack
      )
    ),
]);

const presetsByValue = new Map(
  THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS.map((preset) => [preset.value, preset])
);
const scopeOptionsByValue = new Map(
  THEME_GLOBAL_TYPOGRAPHY_SCOPE_OPTIONS.map((option) => [option.value, option])
);
const LEGACY_SCOPE_VALUE_MAP = Object.freeze({
  "scores-only": Object.freeze(["scores"]),
  "scores-and-throws": Object.freeze(["scores", "throws"]),
  "scores-and-names": Object.freeze(["scores", "names"]),
});

function encodeBunnyFamilyName(familyName) {
  return String(familyName || "")
    .trim()
    .split(/\s+/)
    .map((part) => encodeURIComponent(part))
    .join("+");
}

export function getThemeGlobalTypographyPreset(value) {
  return presetsByValue.get(String(value || "").trim()) || presetsByValue.get("system") || null;
}

export function getThemeGlobalTypographyScopeOption(value) {
  return scopeOptionsByValue.get(String(value || "").trim()) || scopeOptionsByValue.get("scores") || null;
}

export function getThemeGlobalTypographyScopeValues(value) {
  const rawValues = Array.isArray(value) ? value : [value];
  const normalizedValues = rawValues.flatMap((entry) => {
    const normalized = String(entry || "").trim().toLowerCase();
    if (!normalized) {
      return [];
    }
    if (scopeOptionsByValue.has(normalized)) {
      return [normalized];
    }
    if (Object.prototype.hasOwnProperty.call(LEGACY_SCOPE_VALUE_MAP, normalized)) {
      return [...LEGACY_SCOPE_VALUE_MAP[normalized]];
    }
    return [];
  });

  const uniqueValues = Array.from(new Set(normalizedValues));
  return uniqueValues.length ? uniqueValues : ["scores"];
}

export function buildThemeGlobalTypographyBunnyUrl(familyName) {
  const encodedFamilyName = encodeBunnyFamilyName(familyName);
  return encodedFamilyName ? `https://fonts.bunny.net/css?family=${encodedFamilyName}` : "";
}

export function buildThemeGlobalTypographyPreviewImports() {
  return Array.from(
    new Set(
      THEME_GLOBAL_TYPOGRAPHY_FONT_PRESETS
        .filter((preset) => preset.remote)
        .map((preset) => buildThemeGlobalTypographyBunnyUrl(preset.familyName))
        .filter(Boolean)
    )
  )
    .map((url) => `@import url("${url}");`)
    .join("\n");
}
