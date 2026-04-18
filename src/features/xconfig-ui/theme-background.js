import { resolveThemePresetAsset } from "#theme-preset-assets";
import { getThemeGlobalTemplatePreset } from "../../shared/theme-global-template-presets.js";

function estimateBase64ByteSize(rawPayload) {
  const payload = String(rawPayload || "").replaceAll(/\s+/g, "");
  if (!payload) {
    return 0;
  }
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((payload.length * 3) / 4) - padding);
}

function formatByteSize(byteSize) {
  const bytes = Number(byteSize) || 0;
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kiloBytes = bytes / 1024;
  if (kiloBytes < 1024) {
    const fixed = kiloBytes < 10 ? 1 : 0;
    return `${kiloBytes.toFixed(fixed)} KB`;
  }

  return `${(kiloBytes / 1024).toFixed(1)} MB`;
}

const THEME_BACKGROUND_MAX_WIDTH = 1920;
const THEME_BACKGROUND_MAX_HEIGHT = 1080;
const THEME_BACKGROUND_MAX_BYTES = Math.floor(1.5 * 1024 * 1024);
const THEME_BACKGROUND_WEBP_QUALITY = 0.86;
const THEME_BACKGROUND_JPEG_QUALITY = 0.88;

function parseDataUrlInfo(dataUrl) {
  const normalizedDataUrl = String(dataUrl || "").trim();
  if (!normalizedDataUrl.startsWith("data:image/")) {
    return {
      hasImage: false,
      mimeType: "",
      byteSize: 0,
      dataUrl: "",
    };
  }

  const separatorIndex = normalizedDataUrl.indexOf(",");
  if (separatorIndex <= 0 || separatorIndex >= normalizedDataUrl.length - 1) {
    return {
      hasImage: false,
      mimeType: "",
      byteSize: 0,
      dataUrl: "",
    };
  }

  const header = normalizedDataUrl.slice(0, separatorIndex);
  const payload = normalizedDataUrl.slice(separatorIndex + 1);
  const mimeTypeMatch = header.match(/^data:([^;,]+)(?:;.*)?$/i);
  const mimeType = String(mimeTypeMatch?.[1] || "image/*").toLowerCase();
  const isBase64 = /;base64/i.test(header);

  return {
    hasImage: true,
    mimeType,
    byteSize: isBase64 ? estimateBase64ByteSize(payload) : payload.length,
    dataUrl: normalizedDataUrl,
  };
}

function isSupportedThemeBackgroundMimeType(mimeType) {
  const normalizedMimeType = String(mimeType || "").trim().toLowerCase();
  return (
    normalizedMimeType === "image/png" ||
    normalizedMimeType === "image/jpeg" ||
    normalizedMimeType === "image/webp"
  );
}

function createThemeBackgroundError(message) {
  const error = new Error(String(message || "Theme background normalization failed."));
  error.name = "ThemeBackgroundNormalizationError";
  return error;
}

async function readFileAsDataUrl(windowRef, file) {
  if (typeof windowRef?.FileReader !== "function") {
    throw createThemeBackgroundError("Bild-Upload wird in dieser Umgebung nicht unterstützt.");
  }

  return await new Promise((resolve, reject) => {
    const reader = new windowRef.FileReader();
    reader.onload = () => resolve(String(reader.result || "").trim());
    reader.onerror = () => reject(createThemeBackgroundError("Bild konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}

async function loadImageElement(windowRef, dataUrl) {
  if (typeof windowRef?.Image !== "function") {
    throw createThemeBackgroundError("Bild-Upload wird in dieser Umgebung nicht unterstützt.");
  }

  return await new Promise((resolve, reject) => {
    const image = new windowRef.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(createThemeBackgroundError("Bild konnte nicht geladen werden."));
    image.src = dataUrl;
  });
}

async function loadThemeBackgroundSource(windowRef, file) {
  const sourceLoaders = [];

  if (typeof windowRef?.createImageBitmap === "function") {
    sourceLoaders.push(async () => {
      const bitmap = await windowRef.createImageBitmap(file);
      return {
        source: bitmap,
        width: Number(bitmap?.width || 0),
        height: Number(bitmap?.height || 0),
        release() {
          if (typeof bitmap?.close === "function") {
            bitmap.close();
          }
        },
      };
    });
  }

  if (typeof windowRef?.FileReader === "function" && typeof windowRef?.Image === "function") {
    sourceLoaders.push(async () => {
      const dataUrl = await readFileAsDataUrl(windowRef, file);
      const image = await loadImageElement(windowRef, dataUrl);
      return {
        source: image,
        width: Number(image?.naturalWidth || image?.width || 0),
        height: Number(image?.naturalHeight || image?.height || 0),
        release() {},
      };
    });
  }

  let lastError = null;
  for (const loadSource of sourceLoaders) {
    try {
      const source = await loadSource();
      if (source?.width > 0 && source?.height > 0) {
        return source;
      }
      lastError = createThemeBackgroundError("Bild konnte nicht normalisiert werden.");
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw createThemeBackgroundError("Bild-Upload wird in dieser Umgebung nicht unterstützt.");
}

function createThemeBackgroundCanvas(documentRef, width, height) {
  if (typeof documentRef?.createElement !== "function") {
    throw createThemeBackgroundError("Bild-Upload wird in dieser Umgebung nicht unterstützt.");
  }

  const canvas = documentRef.createElement("canvas");
  if (!canvas || typeof canvas.getContext !== "function" || typeof canvas.toDataURL !== "function") {
    throw createThemeBackgroundError("Bild-Upload wird in dieser Umgebung nicht unterstützt.");
  }

  canvas.width = Math.max(1, Math.round(Number(width) || 0));
  canvas.height = Math.max(1, Math.round(Number(height) || 0));
  const context = canvas.getContext("2d");
  if (!context || typeof context.drawImage !== "function") {
    throw createThemeBackgroundError("Bild-Upload wird in dieser Umgebung nicht unterstützt.");
  }

  return { canvas, context };
}

function readCanvasDataUrl(canvas, mimeType, quality) {
  try {
    return String(canvas.toDataURL(mimeType, quality) || "").trim();
  } catch (_) {
    return "";
  }
}

function resolveThemeBackgroundOutputCandidates(sourceMimeType) {
  const normalizedSourceMimeType = String(sourceMimeType || "").trim().toLowerCase();
  const candidates = [
    { mimeType: "image/webp", quality: THEME_BACKGROUND_WEBP_QUALITY },
  ];

  if (
    isSupportedThemeBackgroundMimeType(normalizedSourceMimeType) &&
    normalizedSourceMimeType !== "image/webp"
  ) {
    candidates.push({
      mimeType: normalizedSourceMimeType,
      quality: normalizedSourceMimeType === "image/jpeg" ? THEME_BACKGROUND_JPEG_QUALITY : undefined,
    });
  }

  if (normalizedSourceMimeType !== "image/jpeg") {
    candidates.push({
      mimeType: "image/jpeg",
      quality: THEME_BACKGROUND_JPEG_QUALITY,
    });
  }

  if (normalizedSourceMimeType !== "image/png") {
    candidates.push({
      mimeType: "image/png",
      quality: undefined,
    });
  }

  return candidates;
}

export async function normalizeThemeBackgroundUpload(options = {}) {
  const windowRef = options.windowRef || null;
  const documentRef = options.documentRef || null;
  const file = options.file || null;
  const maxWidth = Math.max(1, Number(options.maxWidth) || THEME_BACKGROUND_MAX_WIDTH);
  const maxHeight = Math.max(1, Number(options.maxHeight) || THEME_BACKGROUND_MAX_HEIGHT);
  const maxBytes = Math.max(1, Number(options.maxBytes) || THEME_BACKGROUND_MAX_BYTES);

  if (!file || typeof file !== "object") {
    throw createThemeBackgroundError("Bitte eine Bilddatei auswählen.");
  }

  const fileType = String(file.type || "").trim().toLowerCase();
  if (!fileType.startsWith("image/")) {
    throw createThemeBackgroundError("Die ausgewählte Datei ist kein unterstütztes Bild.");
  }

  const source = await loadThemeBackgroundSource(windowRef, file);
  const sourceWidth = Math.max(1, Number(source.width) || 0);
  const sourceHeight = Math.max(1, Number(source.height) || 0);
  const resizeScale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight, 1);
  const targetWidth = Math.max(1, Math.round(sourceWidth * resizeScale));
  const targetHeight = Math.max(1, Math.round(sourceHeight * resizeScale));
  const resized = targetWidth !== sourceWidth || targetHeight !== sourceHeight;
  const { canvas, context } = createThemeBackgroundCanvas(documentRef, targetWidth, targetHeight);

  try {
    context.drawImage(source.source, 0, 0, targetWidth, targetHeight);

    const outputCandidates = resolveThemeBackgroundOutputCandidates(fileType);
    let lastCandidate = null;

    for (const candidate of outputCandidates) {
      const dataUrl = readCanvasDataUrl(canvas, candidate.mimeType, candidate.quality);
      const info = parseDataUrlInfo(dataUrl);
      if (!info.hasImage) {
        continue;
      }

      const nextCandidate = {
        ...info,
        resized,
      };
      lastCandidate = nextCandidate;

      if (nextCandidate.byteSize <= maxBytes) {
        return nextCandidate;
      }
    }

    if (lastCandidate && lastCandidate.byteSize > maxBytes) {
      throw createThemeBackgroundError(
        `Das Bild ist nach der Optimierung größer als ${formatByteSize(maxBytes)}.`
      );
    }

    throw createThemeBackgroundError("Bild konnte nicht normalisiert werden.");
  } finally {
    if (typeof source.release === "function") {
      source.release();
    }
  }
}

export function readThemeBackgroundImageInfo(feature) {
  return parseDataUrlInfo(feature?.config?.backgroundImageDataUrl || "");
}

export function readThemeBackgroundPreviewInfo(feature) {
  const uploadedImageInfo = readThemeBackgroundImageInfo(feature);
  if (uploadedImageInfo.hasImage) {
    return {
      ...uploadedImageInfo,
      sourceType: "upload",
      previewUrl: uploadedImageInfo.dataUrl,
      presetLabel: "",
    };
  }

  const isGlobalBackgroundFallback = String(feature?.configKey || "").trim() === "themes.globalTypography";
  if (!isGlobalBackgroundFallback) {
    return {
      hasImage: false,
      mimeType: "",
      byteSize: 0,
      dataUrl: "",
      sourceType: "",
      previewUrl: "",
      presetLabel: "",
    };
  }

  const assetKey = String(feature?.config?.backgroundAssetKey || "").trim();
  const presetLabel = getThemeGlobalTemplatePreset(assetKey)?.label || "";
  const assetUrl = resolveThemePresetAsset(assetKey);
  if (!assetUrl) {
    return {
      hasImage: false,
      mimeType: "",
      byteSize: 0,
      dataUrl: "",
      sourceType: "",
      previewUrl: "",
      presetLabel: "",
    };
  }

  return {
    hasImage: true,
    mimeType: "preset-asset",
    byteSize: 0,
    dataUrl: "",
    sourceType: "preset-asset",
    previewUrl: assetUrl,
    presetLabel,
  };
}

export function resolveThemeBackgroundPreviewUrl(feature) {
  return String(readThemeBackgroundPreviewInfo(feature).previewUrl || "").trim();
}

export function formatThemeBackgroundSummary(feature) {
  const imageInfo = readThemeBackgroundPreviewInfo(feature);
  const isGlobalBackgroundFallback = String(feature?.configKey || "").trim() === "themes.globalTypography";
  if (!imageInfo.hasImage) {
    return isGlobalBackgroundFallback
      ? "Kein globales Fallback-Hintergrundbild gespeichert."
      : "Kein eigenes Hintergrundbild gespeichert.";
  }

  if (imageInfo.sourceType === "preset-asset") {
    return isGlobalBackgroundFallback
      ? `Globales Preset-Wallpaper: ${imageInfo.presetLabel || "aktiv"}.`
      : "Preset-Wallpaper aktiv.";
  }

  const sizeText = formatByteSize(imageInfo.byteSize);
  const detailText = sizeText ? `${imageInfo.mimeType}, ${sizeText}` : imageInfo.mimeType;
  return isGlobalBackgroundFallback
    ? `Globales Fallback-Bild: ${detailText}.`
    : `Eigenes Hintergrundbild: ${detailText}.`;
}

export function applyThemeBackgroundStatusNode(documentRef, statusNode, feature) {
  if (!statusNode) {
    return;
  }

  const imageInfo = readThemeBackgroundPreviewInfo(feature);
  statusNode.setAttribute(
    "class",
    imageInfo.hasImage
      ? "ad-xconfig-theme-image-status"
      : "ad-xconfig-theme-image-status ad-xconfig-theme-image-status--empty"
  );
  statusNode.setAttribute("data-theme-image-state", imageInfo.hasImage ? "present" : "empty");
  statusNode.setAttribute("data-theme-image-type", imageInfo.sourceType || imageInfo.mimeType || "");
  statusNode.setAttribute(
    "data-theme-image-size",
    imageInfo.byteSize > 0 ? String(imageInfo.byteSize) : ""
  );

  const summaryText = imageInfo.hasImage
    ? imageInfo.sourceType === "preset-asset"
      ? `Aktuelles Bild: Preset ${imageInfo.presetLabel || "aktiv"}.`
      : `Aktuelles Bild: ${imageInfo.mimeType}${imageInfo.byteSize > 0 ? `, ${formatByteSize(imageInfo.byteSize)}` : ""}.`
    : "Aktuelles Bild: keines.";

  let summaryNode = statusNode.querySelector?.(".ad-xconfig-theme-image-status-summary") || null;
  if (!summaryNode && typeof documentRef?.createElement === "function") {
    summaryNode = documentRef.createElement("p");
    summaryNode.setAttribute("class", "ad-xconfig-theme-image-status-summary");
    statusNode.appendChild(summaryNode);
  }
  if (summaryNode) {
    summaryNode.textContent = summaryText;
  }

  const existingPreview = statusNode.querySelector?.(".ad-xconfig-theme-image-preview") || null;
  if (imageInfo.hasImage) {
    if (existingPreview) {
      existingPreview.setAttribute("src", imageInfo.previewUrl);
      existingPreview.setAttribute("alt", `${feature.title} Hintergrundbild`);
      return;
    }
    if (typeof documentRef?.createElement === "function") {
      const preview = documentRef.createElement("img");
      preview.setAttribute("class", "ad-xconfig-theme-image-preview");
      preview.setAttribute("src", imageInfo.previewUrl);
      preview.setAttribute("alt", `${feature.title} Hintergrundbild`);
      preview.setAttribute("loading", "lazy");
      preview.setAttribute("decoding", "async");
      statusNode.appendChild(preview);
    }
    return;
  }

  existingPreview?.remove?.();
}

export function buildThemeBackgroundStatus(documentRef, feature) {
  const status = documentRef.createElement("div");
  status.setAttribute("class", "ad-xconfig-theme-image-status ad-xconfig-theme-image-status--empty");
  status.setAttribute("data-adxconfig-theme-image-status", "true");
  status.setAttribute("data-feature-key", feature.featureKey);
  applyThemeBackgroundStatusNode(documentRef, status, feature);
  return status;
}

export function uploadThemeBackgroundImage(options = {}) {
  const {
    feature,
    themeKey,
    documentRef,
    windowRef,
    runtimeApi,
    setNotice,
    setThemeActionFeedback,
    syncThemeBackgroundIndicators,
    queueSync,
  } = options;
  if (!themeKey || typeof runtimeApi?.setThemeBackgroundImage !== "function") {
    return;
  }

  const featureKey = String(feature?.featureKey || "").trim();
  if (typeof documentRef?.createElement !== "function") {
    setNotice?.("error", "Bild-Upload wird in dieser Umgebung nicht unterstützt.");
    setThemeActionFeedback?.(
      featureKey,
      "error",
      "Upload fehlgeschlagen: Diese Umgebung unterstützt keinen Bild-Upload."
    );
    return;
  }

  const input = documentRef.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.tabIndex = -1;
  if (typeof input.setAttribute === "function") {
    input.setAttribute("aria-hidden", "true");
  }
  input.style.position = "fixed";
  input.style.top = "0";
  input.style.left = "-9999px";
  input.style.width = "1px";
  input.style.height = "1px";
  input.style.opacity = "0";
  input.style.pointerEvents = "none";
  input.onchange = () => {
    const file = input.files && input.files[0];
    if (!file) {
      input.onchange = null;
      input.remove?.();
      return;
    }

    const cleanup = () => {
      input.onchange = null;
      input.remove?.();
    };

    Promise.resolve(
      normalizeThemeBackgroundUpload({
        file,
        windowRef,
        documentRef,
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight,
        maxBytes: options.maxBytes,
      })
    )
      .then((normalizedImage) => {
        const fileName = String(file.name || "").trim();
        const successMessage = normalizedImage.resized
          ? fileName
            ? `Hintergrundbild optimiert gespeichert: ${fileName}.`
            : "Hintergrundbild optimiert gespeichert."
          : fileName
            ? `Hintergrundbild gespeichert: ${fileName}.`
            : "Hintergrundbild gespeichert.";

        return Promise.resolve(runtimeApi.setThemeBackgroundImage(themeKey, normalizedImage.dataUrl))
          .then(() => {
            setNotice?.("success", successMessage);
            setThemeActionFeedback?.(featureKey, "success", successMessage);
            syncThemeBackgroundIndicators?.(featureKey);
          });
      })
      .catch((error) => {
        const errorMessage = String(
          error?.message || "Hintergrundbild konnte nicht gespeichert werden."
        ).trim();
        setNotice?.("error", errorMessage);
        setThemeActionFeedback?.(featureKey, "error", errorMessage);
      })
      .finally(() => {
        cleanup();
        queueSync?.();
      });
  };

  (documentRef.body || documentRef.documentElement).appendChild(input);
  input.click?.();
}

export function clearThemeBackgroundImage(options = {}) {
  const {
    feature,
    themeKey,
    runtimeApi,
    setNotice,
    setThemeActionFeedback,
    syncThemeBackgroundIndicators,
    queueSync,
  } = options;
  if (!themeKey || typeof runtimeApi?.clearThemeBackgroundImage !== "function") {
    return;
  }

  const successMessage = "Hintergrundbild entfernt.";
  const errorMessage = "Hintergrundbild konnte nicht entfernt werden.";
  Promise.resolve(runtimeApi.clearThemeBackgroundImage(themeKey))
    .then(() => {
      setNotice?.("info", successMessage);
      setThemeActionFeedback?.(feature?.featureKey, "info", successMessage);
      syncThemeBackgroundIndicators?.(feature?.featureKey);
    })
    .catch(() => {
      setNotice?.("error", errorMessage);
      setThemeActionFeedback?.(feature?.featureKey, "error", errorMessage);
    })
    .finally(() => queueSync?.());
}
