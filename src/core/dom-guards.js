function isObjectLike(value) {
  return Boolean(value) && typeof value === "object";
}

function getDocument(docRef) {
  if (docRef && typeof docRef === "object") {
    return docRef;
  }
  if (typeof document !== "undefined") {
    return document;
  }
  return null;
}

export function safeQuery(selector, options = {}) {
  const doc = getDocument(options.documentRef);
  const root = options.root || doc;
  if (!root || typeof root.querySelector !== "function") {
    return null;
  }

  try {
    return root.querySelector(String(selector || ""));
  } catch (_) {
    return null;
  }
}

export function safeQueryAll(selector, options = {}) {
  const doc = getDocument(options.documentRef);
  const root = options.root || doc;
  if (!root || typeof root.querySelectorAll !== "function") {
    return [];
  }

  try {
    return Array.from(root.querySelectorAll(String(selector || "")));
  } catch (_) {
    return [];
  }
}

export function ensureStyle(styleId, cssText, options = {}) {
  const doc = getDocument(options.documentRef);
  if (!doc || !styleId || typeof doc.createElement !== "function") {
    return null;
  }

  const target =
    options.target ||
    doc.head ||
    doc.documentElement ||
    (typeof doc.querySelector === "function" ? doc.querySelector("head") : null);

  let styleNode =
    typeof doc.getElementById === "function" ? doc.getElementById(styleId) : null;

  if (!styleNode) {
    styleNode = doc.createElement("style");
    styleNode.id = styleId;
  }

  const normalizedCss = String(cssText || "");
  if (styleNode.textContent !== normalizedCss) {
    styleNode.textContent = normalizedCss;
  }

  if (target && styleNode.parentNode !== target && typeof target.appendChild === "function") {
    target.appendChild(styleNode);
  }

  return styleNode;
}

export function removeNodeById(nodeId, options = {}) {
  const doc = getDocument(options.documentRef);
  if (!doc || !nodeId || typeof doc.getElementById !== "function") {
    return false;
  }

  const existing = doc.getElementById(nodeId);
  if (!existing || !existing.parentNode || typeof existing.parentNode.removeChild !== "function") {
    return false;
  }

  existing.parentNode.removeChild(existing);
  return true;
}

export function ensureSingleNode(options = {}) {
  const doc = getDocument(options.documentRef);
  const root = options.root || doc;
  if (!root) {
    return null;
  }

  const selector = options.selector || (options.id ? `#${options.id}` : "");
  if (!selector) {
    return null;
  }

  let existing = null;
  if (typeof root.querySelector === "function") {
    try {
      existing = root.querySelector(selector);
    } catch (_) {
      existing = null;
    }
  }

  if (existing) {
    return existing;
  }

  if (typeof options.create !== "function") {
    return null;
  }

  const created = options.create(doc);
  if (!created) {
    return null;
  }

  if (options.id && typeof created === "object") {
    created.id = options.id;
  }

  if (isObjectLike(options.parent) && typeof options.parent.appendChild === "function") {
    options.parent.appendChild(created);
    return created;
  }

  if (root && typeof root.appendChild === "function") {
    root.appendChild(created);
    return created;
  }

  return created;
}

export function createDomGuards(options = {}) {
  const documentRef = options.documentRef;

  return {
    safeQuery: (selector, localOptions = {}) =>
      safeQuery(selector, { ...localOptions, documentRef }),
    safeQueryAll: (selector, localOptions = {}) =>
      safeQueryAll(selector, { ...localOptions, documentRef }),
    ensureStyle: (styleId, cssText, localOptions = {}) =>
      ensureStyle(styleId, cssText, { ...localOptions, documentRef }),
    removeNodeById: (nodeId, localOptions = {}) =>
      removeNodeById(nodeId, { ...localOptions, documentRef }),
    ensureSingleNode: (localOptions = {}) =>
      ensureSingleNode({ ...localOptions, documentRef }),
  };
}