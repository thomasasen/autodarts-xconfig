const PREVIEW_OPTION_SELECTOR = ".ad-xconfig-option-item--effect-preview";

function resolveOptionalFunction(value, fallback) {
  return typeof value === "function" ? value : fallback;
}

function findPreviewOptionNode(target, panelHostId) {
  if (!target || typeof target.closest !== "function") {
    return null;
  }
  const optionNode = target.closest(PREVIEW_OPTION_SELECTOR);
  if (!optionNode) {
    return null;
  }
  if (panelHostId && !optionNode.closest?.(`#${panelHostId}`)) {
    return null;
  }
  return optionNode;
}

function findAdapter(adapters, previewEffect) {
  return adapters.find((adapter) => {
    if (!adapter || typeof adapter.start !== "function") {
      return false;
    }
    if (typeof adapter.matches === "function") {
      return adapter.matches(previewEffect);
    }
    const prefix = String(adapter.prefix || "").trim();
    return Boolean(prefix) && previewEffect.startsWith(prefix);
  }) || null;
}

export function createXConfigEffectPreviewController(options = {}) {
  const panelHostId = String(options.panelHostId || "").trim();
  const adapters = Array.isArray(options.adapters) ? options.adapters : [];
  const getFeatures = resolveOptionalFunction(options.getFeatures, () => []);
  let activePreview = null;

  function resolveFeature(optionNode) {
    const featureKey = String(optionNode?.getAttribute?.("data-feature-key") || "").trim();
    return getFeatures().find((feature) => feature?.featureKey === featureKey) || null;
  }

  function stopActivePreview(optionNode = null) {
    if (!activePreview) {
      return;
    }
    if (optionNode && activePreview.optionNode !== optionNode) {
      return;
    }

    const cleanup = activePreview.cleanup;
    activePreview = null;
    if (typeof cleanup === "function") {
      cleanup();
    }
  }

  function startPreview(optionNode) {
    const previewEffect = String(optionNode?.getAttribute?.("data-preview-effect") || "").trim();
    const adapter = findAdapter(adapters, previewEffect);
    if (!adapter) {
      stopActivePreview();
      return;
    }
    if (activePreview?.optionNode === optionNode) {
      return;
    }

    stopActivePreview();
    const cleanup = adapter.start({
      optionNode,
      previewEffect,
      feature: resolveFeature(optionNode),
      settingKey: String(optionNode.getAttribute?.("data-setting-key") || "").trim(),
      settingValue: String(optionNode.getAttribute?.("data-setting-value") || "").trim(),
    });
    activePreview = {
      optionNode,
      cleanup: typeof cleanup === "function" ? cleanup : () => {},
    };
  }

  function handlePreviewStartEvent(event) {
    const optionNode = findPreviewOptionNode(event?.target, panelHostId);
    if (!optionNode) {
      stopActivePreview();
      return;
    }
    if (optionNode.contains?.(event.relatedTarget || null)) {
      return;
    }

    startPreview(optionNode);
  }

  function handlePreviewEndEvent(event) {
    const optionNode = findPreviewOptionNode(event?.target, panelHostId);
    if (!optionNode) {
      return;
    }
    if (optionNode.contains?.(event.relatedTarget || null)) {
      return;
    }

    stopActivePreview(optionNode);
  }

  return {
    handlePreviewStartEvent,
    handlePreviewEndEvent,
    stopActivePreview: () => stopActivePreview(),
  };
}
