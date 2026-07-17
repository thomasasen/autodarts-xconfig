import { SETTINGS_IMPORT_MAX_FILE_BYTES } from "../../config/config-transfer.js";

function readFileText(windowRef, file) {
  if (file && typeof file.text === "function") {
    return Promise.resolve(file.text()).then((value) => String(value || ""));
  }
  if (typeof windowRef?.FileReader !== "function") {
    return Promise.reject(new Error("Dateien können in dieser Umgebung nicht gelesen werden."));
  }
  return new Promise((resolve, reject) => {
    const reader = new windowRef.FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Die ausgewählte Datei konnte nicht gelesen werden."));
    reader.readAsText(file, "utf-8");
  });
}

function createHiddenFileInput(documentRef) {
  const input = documentRef.createElement("input");
  input.type = "file";
  input.accept = ".json,.adxconfig.json,application/json";
  input.tabIndex = -1;
  input.setAttribute?.("aria-hidden", "true");
  input.style.position = "fixed";
  input.style.left = "-9999px";
  input.style.opacity = "0";
  return input;
}

export function selectSettingsImportFile(options = {}) {
  const documentRef = options.documentRef || null;
  const windowRef = options.windowRef || null;
  if (typeof documentRef?.createElement !== "function") {
    options.onError?.(new Error("Dateiauswahl wird in dieser Umgebung nicht unterstützt."));
    return;
  }

  const input = createHiddenFileInput(documentRef);
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) {
      input.remove?.();
      return;
    }
    const size = Math.max(0, Number(file.size) || 0);
    if (size > SETTINGS_IMPORT_MAX_FILE_BYTES) {
      input.remove?.();
      options.onError?.(new Error("Die Importdatei ist größer als 32 MiB."));
      return;
    }
    readFileText(windowRef, file)
      .then((text) => options.onSuccess?.({
        fileName: String(file.name || "Einstellungen.json"),
        fileSize: size,
        payload: text,
      }))
      .catch((error) => options.onError?.(error))
      .finally(() => {
        input.onchange = null;
        input.remove?.();
      });
  };
  (documentRef.body || documentRef.documentElement).appendChild(input);
  input.click?.();
}

export function downloadSettingsExport(options = {}) {
  const documentRef = options.documentRef || null;
  const windowRef = options.windowRef || null;
  const exportResult = options.exportResult || null;
  const BlobRef = windowRef?.Blob || globalThis.Blob;
  const urlApi = windowRef?.URL || globalThis.URL;
  if (
    !exportResult?.payload ||
    typeof BlobRef !== "function" ||
    typeof urlApi?.createObjectURL !== "function" ||
    typeof documentRef?.createElement !== "function"
  ) {
    throw new Error("Download wird in dieser Umgebung nicht unterstützt.");
  }

  const blob = new BlobRef([`${JSON.stringify(exportResult.payload, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const objectUrl = urlApi.createObjectURL(blob);
  const anchor = documentRef.createElement("a");
  anchor.href = objectUrl;
  anchor.download = String(exportResult.fileName || "autodarts-xconfig-backup.json");
  anchor.style.display = "none";
  (documentRef.body || documentRef.documentElement).appendChild(anchor);
  try {
    anchor.click?.();
  } finally {
    anchor.remove?.();
    const revoke = () => urlApi.revokeObjectURL?.(objectUrl);
    if (typeof windowRef?.setTimeout === "function") {
      windowRef.setTimeout(revoke, 0);
    } else {
      revoke();
    }
  }
  return exportResult.fileName;
}
