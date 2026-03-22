function estimateBase64ByteSize(rawPayload) {
  const payload = String(rawPayload || "").replace(/\s+/g, "");
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

export function readThemeBackgroundImageInfo(feature) {
  const dataUrl = String(feature?.config?.backgroundImageDataUrl || "").trim();
  if (!dataUrl.startsWith("data:image/")) {
    return {
      hasImage: false,
      mimeType: "",
      byteSize: 0,
      dataUrl: "",
    };
  }

  const separatorIndex = dataUrl.indexOf(",");
  if (separatorIndex <= 0 || separatorIndex >= dataUrl.length - 1) {
    return {
      hasImage: false,
      mimeType: "",
      byteSize: 0,
      dataUrl: "",
    };
  }

  const header = dataUrl.slice(0, separatorIndex);
  const payload = dataUrl.slice(separatorIndex + 1);
  const mimeTypeMatch = header.match(/^data:([^;,]+)(?:;.*)?$/i);
  const mimeType = String(mimeTypeMatch?.[1] || "image/*").toLowerCase();
  const isBase64 = /;base64/i.test(header);

  return {
    hasImage: true,
    mimeType,
    byteSize: isBase64 ? estimateBase64ByteSize(payload) : payload.length,
    dataUrl,
  };
}

export function formatThemeBackgroundSummary(feature) {
  const imageInfo = readThemeBackgroundImageInfo(feature);
  if (!imageInfo.hasImage) {
    return "Kein eigenes Hintergrundbild gespeichert.";
  }

  const sizeText = formatByteSize(imageInfo.byteSize);
  const detailText = sizeText ? `${imageInfo.mimeType}, ${sizeText}` : imageInfo.mimeType;
  return `Eigenes Hintergrundbild: ${detailText}.`;
}

export function applyThemeBackgroundStatusNode(documentRef, statusNode, feature) {
  if (!statusNode) {
    return;
  }

  const imageInfo = readThemeBackgroundImageInfo(feature);
  statusNode.setAttribute(
    "class",
    imageInfo.hasImage
      ? "ad-xconfig-theme-image-status"
      : "ad-xconfig-theme-image-status ad-xconfig-theme-image-status--empty"
  );
  statusNode.setAttribute("data-theme-image-state", imageInfo.hasImage ? "present" : "empty");
  statusNode.setAttribute("data-theme-image-type", imageInfo.mimeType || "");
  statusNode.setAttribute("data-theme-image-size", imageInfo.byteSize > 0 ? String(imageInfo.byteSize) : "");

  const summaryText = imageInfo.hasImage
    ? `Aktuelles Bild: ${imageInfo.mimeType}${imageInfo.byteSize > 0 ? `, ${formatByteSize(imageInfo.byteSize)}` : ""}.`
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
      existingPreview.setAttribute("src", imageInfo.dataUrl);
      existingPreview.setAttribute("alt", `${feature.title} Hintergrundbild`);
      return;
    }
    if (typeof documentRef?.createElement === "function") {
      const preview = documentRef.createElement("img");
      preview.setAttribute("class", "ad-xconfig-theme-image-preview");
      preview.setAttribute("src", imageInfo.dataUrl);
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
  if (typeof documentRef?.createElement !== "function" || typeof windowRef?.FileReader !== "function") {
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
  input.style.display = "none";
  input.onchange = () => {
    const file = input.files && input.files[0];
    if (!file) {
      input.onchange = null;
      input.remove?.();
      return;
    }

    const reader = new windowRef.FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "").trim();
      if (!dataUrl.startsWith("data:image/")) {
        const errorMessage = "Upload fehlgeschlagen: Die ausgewählte Datei ist kein unterstütztes Bild.";
        setNotice?.("error", errorMessage);
        setThemeActionFeedback?.(featureKey, "error", errorMessage);
        input.onchange = null;
        input.remove?.();
        return;
      }

      const fileName = String(file.name || "").trim();
      const successMessage = fileName
        ? `Hintergrundbild gespeichert: ${fileName}.`
        : "Hintergrundbild gespeichert.";
      const errorMessage = "Hintergrundbild konnte nicht gespeichert werden.";
      Promise.resolve(runtimeApi.setThemeBackgroundImage(themeKey, dataUrl))
        .then(() => {
          setNotice?.("success", successMessage);
          setThemeActionFeedback?.(featureKey, "success", successMessage);
          syncThemeBackgroundIndicators?.(featureKey);
        })
        .catch(() => {
          setNotice?.("error", errorMessage);
          setThemeActionFeedback?.(featureKey, "error", errorMessage);
        })
        .finally(() => queueSync?.());

      input.onchange = null;
      input.remove?.();
    };
    reader.onerror = () => {
      const errorMessage = "Upload fehlgeschlagen: Bild konnte nicht gelesen werden.";
      setNotice?.("error", errorMessage);
      setThemeActionFeedback?.(featureKey, "error", errorMessage);
      input.onchange = null;
      input.remove?.();
    };
    reader.readAsDataURL(file);
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
