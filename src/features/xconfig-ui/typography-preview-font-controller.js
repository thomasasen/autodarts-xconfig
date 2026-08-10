import {
  buildThemeGlobalTypographyPreviewImports,
  getThemeGlobalTypographyPreset,
} from "../../shared/theme-global-typography-presets.js";

function readPreviewFontValue(event) {
  const target = event?.target;
  if (!target || typeof target.closest !== "function") {
    return "";
  }
  return String(
    target.closest("[data-adxconfig-preview-font]")?.dataset?.adxconfigPreviewFont || ""
  ).trim();
}

export function createTypographyPreviewFontController(options = {}) {
  const domGuards = options.domGuards;
  const panelHostId = String(options.panelHostId || "").trim();
  const styleId = String(options.styleId || "").trim();
  const loadedPresetValues = new Set();
  let active = false;

  function render() {
    if (!active || !styleId) {
      domGuards?.removeNodeById?.(styleId);
      return;
    }
    const imports = buildThemeGlobalTypographyPreviewImports([...loadedPresetValues]);
    const scopeRule = panelHostId
      ? `#${panelHostId} [data-adxconfig-preview-font]{font-kerning:normal;}`
      : "";
    domGuards?.ensureStyle?.(styleId, [imports, scopeRule].filter(Boolean).join("\n"));
  }

  function requestPreset(presetValue) {
    if (!active) {
      return false;
    }
    const preset = getThemeGlobalTypographyPreset(presetValue);
    if (!preset?.remote || loadedPresetValues.has(preset.value)) {
      return false;
    }
    loadedPresetValues.add(preset.value);
    render();
    return true;
  }

  function activate(selectedPresetValue) {
    if (!active) {
      loadedPresetValues.clear();
      active = true;
    }
    requestPreset(selectedPresetValue);
    render();
  }

  function deactivate() {
    active = false;
    loadedPresetValues.clear();
    domGuards?.removeNodeById?.(styleId);
  }

  return Object.freeze({
    activate,
    deactivate,
    handlePreviewRequest(event) {
      return requestPreset(readPreviewFontValue(event));
    },
  });
}
