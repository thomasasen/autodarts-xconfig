import {
  AUTODARTS_DART_DESIGNER_PARTS,
  AUTODARTS_DART_DESIGNER_PATH,
  normalizeAutodartsDartDesignerConfig,
} from "../../shared/autodarts-dart-designer.js";

export const AUTODARTS_DART_DESIGNER_PANEL_ID = "ad-xconfig-dart-designer-panel";
export const AUTODARTS_DART_DESIGNER_IMPORT_ACTION = "import-autodarts-dart-designer";
export const AUTODARTS_DART_DESIGNER_RESTORE_ACTION = "restore-autodarts-dart-designer";

const DESIGNER_PREVIEW_VIEWBOX = "0 0 475 101";
const DESIGNER_IMAGE_MAX_BYTES = 350 * 1024;
const DESIGNER_IMAGE_WIDTHS = Object.freeze([960, 720, 560]);

function normalizeText(value) {
  return String(value || "").replaceAll(/\s+/g, " ").trim();
}

function getDesignerTabs(tabList) {
  return Array.from(tabList?.querySelectorAll?.("[role='tab']") || []).slice(
    0,
    AUTODARTS_DART_DESIGNER_PARTS.length
  );
}

export function findAutodartsDartDesignerSurface(documentRef) {
  const tabLists = Array.from(documentRef?.querySelectorAll?.("[role='tablist']") || []);
  for (const tabList of tabLists) {
    const tabs = getDesignerTabs(tabList);
    if (tabs.length !== AUTODARTS_DART_DESIGNER_PARTS.length) {
      continue;
    }
    const root = tabList.closest?.("main") || tabList.parentElement || tabList.parentNode || null;
    if (!root) {
      continue;
    }
    const preview = Array.from(root.querySelectorAll?.("svg") || []).find(
      (node) => normalizeText(node.getAttribute?.("viewBox")) === DESIGNER_PREVIEW_VIEWBOX
    );
    if (preview) {
      return { root, tabList, tabs, preview };
    }
  }
  return null;
}

function getActiveTabIndex(tabs = []) {
  const activeIndex = tabs.findIndex(
    (tab) => String(tab?.getAttribute?.("aria-selected") || "").toLowerCase() === "true"
  );
  return Math.max(activeIndex, 0);
}

function waitForNextFrame(windowRef) {
  return new Promise((resolve) => {
    if (typeof windowRef?.requestAnimationFrame === "function") {
      windowRef.requestAnimationFrame(() => resolve());
      return;
    }
    if (typeof windowRef?.setTimeout === "function") {
      windowRef.setTimeout(resolve, 0);
      return;
    }
    resolve();
  });
}

async function waitForActiveDesignerTab(documentRef, windowRef, expectedIndex) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await waitForNextFrame(windowRef);
    const surface = findAutodartsDartDesignerSurface(documentRef);
    if (surface && getActiveTabIndex(surface.tabs) === expectedIndex) {
      return surface;
    }
  }
  return findAutodartsDartDesignerSurface(documentRef);
}

async function activateDesignerTab(documentRef, windowRef, tabIndex) {
  const surface = findAutodartsDartDesignerSurface(documentRef);
  const tab = surface?.tabs?.[tabIndex] || null;
  if (!tab || typeof tab.click !== "function") {
    throw new Error("Der Autodarts-Dartdesigner ist noch nicht vollständig geladen.");
  }
  if (getActiveTabIndex(surface.tabs) !== tabIndex) {
    tab.click();
  }
  const updatedSurface = await waitForActiveDesignerTab(documentRef, windowRef, tabIndex);
  if (!updatedSurface || getActiveTabIndex(updatedSurface.tabs) !== tabIndex) {
    throw new Error("Der Autodarts-Dartdesigner konnte nicht umgeschaltet werden.");
  }
  return updatedSurface;
}

function readActiveDesignerSelection(surface, part) {
  const panel = surface?.root?.querySelector?.("[role='tabpanel']") || null;
  const optionButtons = Array.from(
    panel?.querySelectorAll?.("button[aria-pressed]") || []
  );
  const optionIndex = optionButtons.findIndex(
    (button) => String(button?.getAttribute?.("aria-pressed") || "").toLowerCase() === "true"
  );
  const selectedOption = optionIndex >= 0 ? optionButtons[optionIndex] : null;
  if (!selectedOption) {
    throw new Error(`Bitte wähle zuerst eine Option für „${part.fallbackLabel}“ aus.`);
  }
  return {
    tabIndex: part.tabIndex,
    tabLabel: normalizeText(surface.tabs[part.tabIndex]?.textContent) || part.fallbackLabel,
    optionIndex,
    optionLabel: normalizeText(selectedOption.textContent),
  };
}

export async function captureAutodartsDartDesignerConfig(options = {}) {
  const documentRef = options.documentRef || null;
  const windowRef = options.windowRef || null;
  const initialSurface = findAutodartsDartDesignerSurface(documentRef);
  if (!initialSurface) {
    throw new Error("Der Autodarts-Dartdesigner ist noch nicht vollständig geladen.");
  }

  const originalTabIndex = getActiveTabIndex(initialSurface.tabs);
  const parts = {};
  try {
    for (const part of AUTODARTS_DART_DESIGNER_PARTS) {
      const surface = await activateDesignerTab(documentRef, windowRef, part.tabIndex);
      parts[part.key] = readActiveDesignerSelection(surface, part);
    }
  } finally {
    if (originalTabIndex >= 0) {
      await activateDesignerTab(documentRef, windowRef, originalTabIndex).catch(() => {});
    }
  }

  return normalizeAutodartsDartDesignerConfig({ version: 1, parts });
}

function findSavedOption(optionButtons, savedSelection) {
  const savedLabel = normalizeText(savedSelection?.optionLabel);
  const labelMatch = optionButtons.find(
    (button) => normalizeText(button?.textContent) === savedLabel
  );
  if (labelMatch) {
    return labelMatch;
  }
  return optionButtons[savedSelection?.optionIndex] || null;
}

export async function restoreAutodartsDartDesignerConfig(rawConfig, options = {}) {
  const config = normalizeAutodartsDartDesignerConfig(rawConfig);
  const documentRef = options.documentRef || null;
  const windowRef = options.windowRef || null;
  const initialSurface = findAutodartsDartDesignerSurface(documentRef);
  if (!config || !initialSurface) {
    throw new Error("Es ist keine vollständige xConfig-Dartkonfiguration gespeichert.");
  }

  const originalTabIndex = getActiveTabIndex(initialSurface.tabs);
  try {
    for (const part of AUTODARTS_DART_DESIGNER_PARTS) {
      const surface = await activateDesignerTab(documentRef, windowRef, part.tabIndex);
      const panel = surface.root.querySelector?.("[role='tabpanel']") || null;
      const optionButtons = Array.from(
        panel?.querySelectorAll?.("button[aria-pressed]") || []
      );
      const savedSelection = config.parts[part.key];
      const optionButton = findSavedOption(optionButtons, savedSelection);
      if (!optionButton || typeof optionButton.click !== "function") {
        throw new Error(`Die gespeicherte Option für „${part.fallbackLabel}“ ist nicht mehr verfügbar.`);
      }
      optionButton.click();
      await waitForNextFrame(windowRef);
    }
  } finally {
    if (originalTabIndex >= 0) {
      await activateDesignerTab(documentRef, windowRef, originalTabIndex).catch(() => {});
    }
  }

  return config;
}

function removeUnsafeSvgContent(svgNode) {
  Array.from(svgNode?.querySelectorAll?.("script,foreignObject,style") || []).forEach((node) => {
    node.remove?.();
  });
  [svgNode, ...Array.from(svgNode?.querySelectorAll?.("*") || [])].forEach((node) => {
    Array.from(node?.attributes || []).forEach((attribute) => {
      const attributeName = String(attribute?.name || "").toLowerCase();
      if (attributeName.startsWith("on")) {
        node.removeAttribute?.(attribute.name);
      }
    });
  });
  Array.from(svgNode?.querySelectorAll?.("image") || []).forEach((node) => {
    const href = String(
      node.getAttribute?.("href") || node.getAttribute?.("xlink:href") || ""
    ).trim();
    if (!href.startsWith("data:image/")) {
      node.remove?.();
    }
  });
}

function getDataUrlByteSize(dataUrl) {
  const value = String(dataUrl || "");
  const separatorIndex = value.indexOf(",");
  if (separatorIndex < 0) {
    return 0;
  }
  const payload = value.slice(separatorIndex + 1).replaceAll(/\s+/g, "");
  if (!value.slice(0, separatorIndex).toLowerCase().includes(";base64")) {
    return payload.length;
  }
  let padding = 0;
  if (payload.endsWith("==")) {
    padding = 2;
  } else if (payload.endsWith("=")) {
    padding = 1;
  }
  return Math.max(0, Math.floor((payload.length * 3) / 4) - padding);
}

function loadImage(windowRef, sourceUrl) {
  return new Promise((resolve, reject) => {
    const ImageRef = windowRef?.Image || globalThis.Image;
    if (typeof ImageRef !== "function") {
      reject(new Error("Die Bildvorschau kann in diesem Browser nicht verarbeitet werden."));
      return;
    }
    const image = new ImageRef();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Die Autodarts-Dartvorschau konnte nicht geladen werden."));
    image.src = sourceUrl;
  });
}

export async function rasterizeAutodartsDartDesignerPreview(options = {}) {
  const documentRef = options.documentRef || null;
  const windowRef = options.windowRef || null;
  const surface = findAutodartsDartDesignerSurface(documentRef);
  const preview = surface?.preview || null;
  if (!preview || typeof preview.cloneNode !== "function") {
    throw new Error("Die Autodarts-Dartvorschau wurde nicht gefunden.");
  }

  const BlobRef = windowRef?.Blob || globalThis.Blob;
  const SerializerRef = windowRef?.XMLSerializer || globalThis.XMLSerializer;
  const urlApi = windowRef?.URL || globalThis.URL;
  if (
    typeof BlobRef !== "function" ||
    typeof SerializerRef !== "function" ||
    typeof urlApi?.createObjectURL !== "function"
  ) {
    throw new TypeError("Die Dartvorschau kann in diesem Browser nicht als Bild gespeichert werden.");
  }

  const svgClone = preview.cloneNode(true);
  removeUnsafeSvgContent(svgClone);
  svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svgClone.setAttribute("width", "960");
  svgClone.setAttribute("height", "204");
  const source = new SerializerRef().serializeToString(svgClone);
  const objectUrl = urlApi.createObjectURL(new BlobRef([source], { type: "image/svg+xml" }));

  try {
    const image = await loadImage(windowRef, objectUrl);
    let smallestDataUrl = "";
    for (const width of DESIGNER_IMAGE_WIDTHS) {
      const height = Math.max(1, Math.round((width * 101) / 475));
      const canvas = documentRef.createElement?.("canvas") || null;
      const context = canvas?.getContext?.("2d") || null;
      if (!canvas || !context) {
        throw new Error("Die Dartvorschau kann in diesem Browser nicht gerastert werden.");
      }
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      const candidates = [
        canvas.toDataURL("image/webp", 0.95),
        canvas.toDataURL("image/webp", 0.86),
        canvas.toDataURL("image/png"),
      ].filter((value, index, values) => value && values.indexOf(value) === index);
      for (const dataUrl of candidates) {
        if (!smallestDataUrl || getDataUrlByteSize(dataUrl) < getDataUrlByteSize(smallestDataUrl)) {
          smallestDataUrl = dataUrl;
        }
        if (getDataUrlByteSize(dataUrl) <= DESIGNER_IMAGE_MAX_BYTES) {
          return dataUrl;
        }
      }
    }
    if (smallestDataUrl) {
      throw new Error("Das erzeugte Dart-Bild ist größer als 350 KB.");
    }
    throw new Error("Das Dart-Bild konnte nicht erzeugt werden.");
  } finally {
    urlApi.revokeObjectURL?.(objectUrl);
  }
}

function createElement(documentRef, tagName, options = {}) {
  const node = documentRef.createElement(tagName);
  if (options.id) {
    node.id = options.id;
  }
  if (options.className) {
    node.className = options.className;
  }
  if (options.text) {
    node.textContent = options.text;
  }
  Object.entries(options.attributes || {}).forEach(([name, value]) => {
    if (value !== undefined && value !== null) {
      node.setAttribute(name, String(value));
    }
  });
  return node;
}

function getDesignerFeature(runtimeApi) {
  const features = typeof runtimeApi?.listFeatures === "function"
    ? runtimeApi.listFeatures()
    : [];
  return Array.isArray(features)
    ? features.find((feature) => feature?.featureKey === "turn-dart-display") || null
    : null;
}

function getSavedDesignerConfig(runtimeApi) {
  return normalizeAutodartsDartDesignerConfig(
    getDesignerFeature(runtimeApi)?.config?.turnDartDesignerConfig
  );
}

function setPanelStatus(panel, type, message) {
  const status = panel?.querySelector?.("[data-adxconfig-dart-designer-status='true']") || null;
  if (!status) {
    return;
  }
  status.dataset.state = String(type || "");
  status.textContent = String(message || "");
}

function setPanelBusy(panel, busy) {
  Array.from(panel?.querySelectorAll?.("button") || []).forEach((button) => {
    button.disabled = Boolean(busy);
  });
  panel?.setAttribute?.("aria-busy", busy ? "true" : "false");
}

export function createAutodartsDartDesignerController(options = {}) {
  const windowRef = options.windowRef || null;
  const documentRef = options.documentRef || windowRef?.document || null;
  const runtimeApi = options.runtimeApi || null;
  const rasterizePreview =
    typeof options.rasterizePreview === "function"
      ? options.rasterizePreview
      : rasterizeAutodartsDartDesignerPreview;

  function updateRestoreButton(panel) {
    const restoreButton = panel?.querySelector?.(
      `[data-adxconfig-action='${AUTODARTS_DART_DESIGNER_RESTORE_ACTION}']`
    ) || null;
    if (restoreButton) {
      restoreButton.disabled = !getSavedDesignerConfig(runtimeApi);
    }
  }

  async function importCurrentDart(panel) {
    if (typeof runtimeApi?.saveConfig !== "function") {
      setPanelStatus(panel, "error", "xConfig-Speicher ist nicht verfügbar.");
      return;
    }
    setPanelBusy(panel, true);
    setPanelStatus(panel, "busy", "Dart wird für xConfig vorbereitet …");
    try {
      const designerConfig = await captureAutodartsDartDesignerConfig({
        documentRef,
        windowRef,
      });
      const dataUrl = await rasterizePreview({ documentRef, windowRef });
      await runtimeApi.saveConfig({
        features: {
          turnDartDisplay: {
            turnDartStyle: "designer",
            turnDartDesignerImageDataUrl: dataUrl,
            turnDartDesignerConfig: designerConfig,
          },
        },
      });
      setPanelStatus(
        panel,
        "success",
        "Dart gespeichert und in xConfig als aktuelle Auswahl übernommen."
      );
    } catch (error) {
      setPanelStatus(panel, "error", String(error?.message || "Dart konnte nicht übernommen werden."));
    } finally {
      setPanelBusy(panel, false);
      updateRestoreButton(panel);
    }
  }

  async function restoreSavedDart(panel) {
    const config = getSavedDesignerConfig(runtimeApi);
    if (!config) {
      setPanelStatus(panel, "error", "Es ist noch keine Dartdesigner-Konfiguration gespeichert.");
      return;
    }
    setPanelBusy(panel, true);
    setPanelStatus(panel, "busy", "Gespeicherte Auswahl wird geladen …");
    try {
      await restoreAutodartsDartDesignerConfig(config, { documentRef, windowRef });
      setPanelStatus(
        panel,
        "success",
        "Gespeicherte xConfig-Auswahl geladen. Du kannst sie jetzt weiter anpassen."
      );
    } catch (error) {
      setPanelStatus(panel, "error", String(error?.message || "Auswahl konnte nicht geladen werden."));
    } finally {
      setPanelBusy(panel, false);
      updateRestoreButton(panel);
    }
  }

  function buildPanel() {
    const panel = createElement(documentRef, "section", {
      id: AUTODARTS_DART_DESIGNER_PANEL_ID,
      className: "ad-xconfig-dart-designer-panel",
      attributes: {
        "aria-label": "xConfig Dartdesigner",
        "data-adxconfig-dart-designer-panel": "true",
      },
    });
    const heading = createElement(documentRef, "div", {
      className: "ad-xconfig-dart-designer-heading",
      text: "xConfig",
    });
    const description = createElement(documentRef, "p", {
      className: "ad-xconfig-dart-designer-description",
      text: "Speichert diesen Dart lokal und verwendet ihn bei „Darts in der Wurfanzeige“.",
    });
    const actions = createElement(documentRef, "div", {
      className: "ad-xconfig-dart-designer-actions",
    });
    const importButton = createElement(documentRef, "button", {
      className: "ad-xconfig-dart-designer-button ad-xconfig-dart-designer-button--primary",
      text: "Nach xConfig übernehmen",
      attributes: {
        type: "button",
        "data-adxconfig-action": AUTODARTS_DART_DESIGNER_IMPORT_ACTION,
      },
    });
    const restoreButton = createElement(documentRef, "button", {
      className: "ad-xconfig-dart-designer-button",
      text: "Gespeicherten Dart laden",
      attributes: {
        type: "button",
        "data-adxconfig-action": AUTODARTS_DART_DESIGNER_RESTORE_ACTION,
      },
    });
    const status = createElement(documentRef, "p", {
      className: "ad-xconfig-dart-designer-status",
      attributes: {
        role: "status",
        "aria-live": "polite",
        "data-adxconfig-dart-designer-status": "true",
      },
    });
    importButton.addEventListener?.("click", () => importCurrentDart(panel));
    restoreButton.addEventListener?.("click", () => restoreSavedDart(panel));
    actions.appendChild(importButton);
    actions.appendChild(restoreButton);
    panel.appendChild(heading);
    panel.appendChild(description);
    panel.appendChild(actions);
    panel.appendChild(status);
    updateRestoreButton(panel);
    return panel;
  }

  function sync() {
    const pathname = String(windowRef?.location?.pathname || "");
    const existingPanel = documentRef?.getElementById?.(AUTODARTS_DART_DESIGNER_PANEL_ID) || null;
    if (pathname !== AUTODARTS_DART_DESIGNER_PATH) {
      existingPanel?.remove?.();
      return null;
    }
    if (existingPanel) {
      updateRestoreButton(existingPanel);
      return existingPanel;
    }
    const surface = findAutodartsDartDesignerSurface(documentRef);
    if (!surface) {
      return null;
    }
    const panel = buildPanel();
    if (typeof surface.preview.before === "function") {
      surface.preview.before(panel);
    } else {
      surface.tabList.before?.(panel);
    }
    return panel;
  }

  function teardown() {
    documentRef?.getElementById?.(AUTODARTS_DART_DESIGNER_PANEL_ID)?.remove?.();
  }

  return {
    sync,
    teardown,
    importCurrentDart: () => {
      const panel = sync();
      return panel ? importCurrentDart(panel) : Promise.resolve();
    },
    restoreSavedDart: () => {
      const panel = sync();
      return panel ? restoreSavedDart(panel) : Promise.resolve();
    },
  };
}
