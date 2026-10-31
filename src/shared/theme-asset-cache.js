export const THEME_ASSET_STORAGE_PREFIX = "autodarts-xconfig:theme-image:v1:";

function encodeBytes(bytes) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 32768) {
    binary += String.fromCodePoint(...bytes.subarray(offset, offset + 32768));
  }
  return btoa(binary);
}

async function sha256(bytes) {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function downloadThemeAsset(url, request, { timeoutMs = 30000 } = {}) {
  if (typeof request !== "function") return Promise.reject(new Error("Bild-Download ist nicht verfügbar."));
  return new Promise((resolve, reject) => {
    let handle;
    const finish = (callback, value) => { clearTimeout(timer); callback(value); };
    const timeoutError = () => new Error("Zeitüberschreitung beim Bild-Download. Bitte erneut versuchen.");
    // Anonymous GM requests may use fetch, whose native timeout is ignored in Chrome.
    const timer = setTimeout(() => { reject(timeoutError()); handle?.abort?.(); }, timeoutMs);
    try { handle = request({ method: "GET", url, anonymous: true, responseType: "arraybuffer", timeout: timeoutMs,
      onload(response) {
        if (response.status !== 200) { finish(reject, new Error(`Bild-Download fehlgeschlagen (HTTP ${response.status}).`)); return; }
        finish(resolve, new Uint8Array(response.response));
      },
      onerror: () => finish(reject, new Error("Bild-Download fehlgeschlagen. Bitte erneut versuchen.")),
      ontimeout: () => finish(reject, timeoutError()),
      onabort: () => finish(reject, new Error("Bild-Download wurde abgebrochen.")),
    }); } catch (error) { finish(reject, error); }
  });
}

export function createThemeAssetCache({ catalog, releaseTag, getValue, setValue, download, digest = sha256 }) {
  const memory = new Map();
  const pending = new Map();
  const listeners = new Set();
  const baseUrl = `https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/${releaseTag}/src/assets/theme-presets/`;
  function descriptor(key) { return Object.hasOwn(catalog, key) ? catalog[key] : null; }
  function notify(event) {
    for (const listener of listeners) {
      try { listener(event); } catch { /* A view must not interrupt image persistence. */ }
    }
  }
  async function validate(record, asset) {
    const prefix = `data:${asset.mime};base64,`;
    if (record?.sha256 !== asset.sha256 || typeof record?.dataUrl !== "string" ||
        !record.dataUrl.startsWith(prefix) || record.dataUrl.length > asset.bytes * 2 + 128) return "";
    try {
      const bytes = Uint8Array.from(atob(record.dataUrl.slice(prefix.length)), (char) => char.codePointAt(0));
      return bytes.length === asset.bytes && await digest(bytes) === asset.sha256 ? record.dataUrl : "";
    } catch { return ""; }
  }
  async function read(key) {
    const asset = descriptor(key);
    if (!asset) throw new Error("Unbekanntes Design-Bild.");
    if (memory.has(asset.sha256)) return memory.get(asset.sha256);
    if (typeof getValue !== "function" || typeof setValue !== "function") throw new Error("Der dauerhafte Bildspeicher ist nicht verfügbar.");
    let stored;
    try { stored = await getValue(THEME_ASSET_STORAGE_PREFIX + asset.sha256, null); }
    catch { throw new Error("Der Bildspeicher konnte nicht gelesen werden. Bitte erneut versuchen."); }
    const value = await validate(stored, asset);
    if (value) memory.set(asset.sha256, value);
    return value;
  }
  async function load(key) {
    const cached = await read(key);
    if (cached) return cached;
    const asset = descriptor(key);
    notify({ key, state: "loading" });
    const bytes = await download(baseUrl + asset.file);
    if (bytes.length !== asset.bytes || await digest(bytes) !== asset.sha256) throw new Error("Das geladene Bild hat eine ungültige Prüfsumme.");
    const record = { sha256: asset.sha256, dataUrl: `data:${asset.mime};base64,${encodeBytes(bytes)}` };
    try {
      await setValue(THEME_ASSET_STORAGE_PREFIX + asset.sha256, record);
      const persisted = await getValue(THEME_ASSET_STORAGE_PREFIX + asset.sha256, null);
      if (!await validate(persisted, asset)) throw new Error("Image was not persisted");
    } catch { throw new Error("Das Bild konnte nicht dauerhaft gespeichert werden. Bitte erneut versuchen."); }
    memory.set(asset.sha256, record.dataUrl);
    return record.dataUrl;
  }
  function ensure(key) {
    const asset = descriptor(key);
    if (!asset) return Promise.reject(new Error("Unbekanntes Design-Bild."));
    if (pending.has(asset.sha256)) return pending.get(asset.sha256);
    const operation = load(key).then((value) => { notify({ key, state: "ready" }); return value; })
      .catch((cause) => {
        const error = new Error(cause?.message || "Das Design-Bild konnte nicht geladen werden.", { cause });
        error.code = "THEME_ASSET_FAILED";
        notify({ key, state: "error", error });
        throw error;
      })
      .finally(() => pending.delete(asset.sha256));
    pending.set(asset.sha256, operation);
    return operation;
  }
  return {
    resolve: (key) => memory.get(descriptor(key)?.sha256) || "",
    ensure,
    hydrate: (keys) => Promise.all([...new Set(keys)].map(read)),
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}
