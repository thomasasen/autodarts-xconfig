import {
  BOARD_INPUT_MODE_CONTROL_SELECTOR,
  BOARD_CONTROLS_SOURCE_MIRRORED_ATTRIBUTE,
  getBoardInputModeLabelCandidates,
} from "../../../shared/board-input-mode.js";

export const BOARD_CONTROLS_PORTAL_CLASS = "ad-ext-theme-board-controls-portal";
export const BOARD_CONTROLS_PORTAL_ATTRIBUTE = "data-ad-ext-theme-board-controls-portal";
export const BOARD_CONTROLS_MIRROR_GROUP_CLASS = "ad-ext-theme-board-controls-mirror-group";

const PORTAL_SELECTOR = `[${BOARD_CONTROLS_PORTAL_ATTRIBUTE}="true"]`;
const portalStatesByDocument = new WeakMap();
const STATE_ATTRIBUTES = Object.freeze([
  "class",
  "role",
  "type",
  "value",
  "checked",
  "selected",
  "hidden",
  "disabled",
  "aria-label",
  "aria-labelledby",
  "aria-describedby",
  "title",
  "aria-description",
  "aria-checked",
  "aria-selected",
  "aria-pressed",
  "aria-hidden",
  "aria-disabled",
  "data-active",
  "data-disabled",
  "data-hidden",
  "data-label",
  "data-selected",
  "data-checked",
  "data-pressed",
  "data-state",
  "data-status",
  "data-tooltip",
]);
const STATE_PROPERTIES = Object.freeze(["checked", "selected", "hidden", "disabled", "value"]);

function queryAll(rootNode, selector) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return [];
  }
  try {
    return Array.from(rootNode.querySelectorAll(selector));
  } catch (_) {
    return [];
  }
}

function getElementChildren(node) {
  return Array.from(node?.children || []).filter((child) => Number(child?.nodeType) === 1);
}

function getElementTree(rootNode) {
  if (!rootNode) {
    return [];
  }
  const result = [];
  const queue = [{ node: rootNode, path: [] }];
  while (queue.length) {
    const current = queue.shift();
    result.push(current);
    getElementChildren(current.node).forEach((child, index) => {
      queue.push({ node: child, path: [...current.path, index] });
    });
  }
  return result;
}

function getNodeAtPath(rootNode, path = []) {
  return path.reduce((node, index) => getElementChildren(node)[index] || null, rootNode);
}

function getNodePath(rootNode, targetNode) {
  if (!rootNode || !targetNode) {
    return null;
  }
  if (rootNode === targetNode) {
    return [];
  }

  const parentPath = [];
  let current = targetNode;
  while (current && current !== rootNode) {
    const parentNode = current.parentElement || current.parentNode || null;
    const index = getElementChildren(parentNode).indexOf(current);
    if (!parentNode || index < 0) {
      return null;
    }
    parentPath.unshift(index);
    current = parentNode;
  }
  return current === rootNode ? parentPath : null;
}

function serializeAttribute(node, name, override = null) {
  if (override && Object.hasOwn(override, name)) {
    return override[name] === null ? "0" : `1:${override[name]}`;
  }
  const value = node?.getAttribute?.(name);
  return value === null || value === undefined ? "0" : `1:${String(value)}`;
}

function buildStructureSignature(group) {
  const actionPaths = (group.actionNodes || [])
    .map((node) => getNodePath(group.sourceRoot, node)?.join("."))
    .join(",");
  const tree = getElementTree(group.sourceRoot).map(({ node, path }) => {
    return [
      path.join("."),
      String(node.tagName || node.nodeName || "").toLowerCase(),
    ].join(":");
  });
  return `${group.kind || "primary"}|${actionPaths}|${tree.join("|")}`;
}

function captureAttribute(node, name) {
  const value = node?.getAttribute?.(name);
  return {
    name,
    present: value !== null && value !== undefined,
    value: value === null || value === undefined ? "" : String(value),
  };
}

function restoreAttribute(node, record) {
  if (!node || !record) {
    return;
  }
  if (record.present) {
    node.setAttribute?.(record.name, record.value);
  } else {
    node.removeAttribute?.(record.name);
  }
}

function setAttributeIfChanged(node, name, value) {
  if (!node || !name) {
    return;
  }
  if (value === null || value === undefined) {
    if (node.getAttribute?.(name) !== null) {
      node.removeAttribute?.(name);
    }
    return;
  }
  const normalized = String(value);
  if (node.getAttribute?.(name) !== normalized) {
    node.setAttribute?.(name, normalized);
  }
}

function captureSourceAccessibility(sourceRoot, actionNodes) {
  return {
    rootAriaHidden: captureAttribute(sourceRoot, "aria-hidden"),
    rootMirrored: captureAttribute(sourceRoot, BOARD_CONTROLS_SOURCE_MIRRORED_ATTRIBUTE),
    actions: actionNodes.map((node) => ({
      node,
      ariaHidden: captureAttribute(node, "aria-hidden"),
      tabIndex: captureAttribute(node, "tabindex"),
    })),
  };
}

function hideSourceFromAccessibility(sourceRoot, record) {
  sourceRoot?.setAttribute?.(BOARD_CONTROLS_SOURCE_MIRRORED_ATTRIBUTE, "true");
  sourceRoot?.setAttribute?.("aria-hidden", "true");
  (record?.actions || []).forEach(({ node }) => node?.setAttribute?.("tabindex", "-1"));
}

function restoreSourceAccessibility(sourceRoot, record) {
  restoreAttribute(sourceRoot, record?.rootAriaHidden);
  restoreAttribute(sourceRoot, record?.rootMirrored);
  (record?.actions || []).forEach((actionRecord) => {
    restoreAttribute(actionRecord.node, actionRecord.ariaHidden);
    restoreAttribute(actionRecord.node, actionRecord.tabIndex);
  });
}

function getAccessibilityOverrides(entry, sourceNode) {
  const overrides = {};
  if (sourceNode === entry.sourceRoot) {
    overrides["aria-hidden"] = entry.accessibility.rootAriaHidden.present
      ? entry.accessibility.rootAriaHidden.value
      : null;
  }
  const actionRecord = entry.accessibility.actions.find((record) => record.node === sourceNode);
  if (actionRecord) {
    overrides["aria-hidden"] = actionRecord.ariaHidden.present
      ? actionRecord.ariaHidden.value
      : null;
  }
  return overrides;
}

function buildStateSignature(entry) {
  return getElementTree(entry.sourceRoot).map(({ node, path }) => {
    const overrides = getAccessibilityOverrides(entry, node);
    const attributes = STATE_ATTRIBUTES.map((name) => serializeAttribute(node, name, overrides));
    const properties = STATE_PROPERTIES.map((name) => `${name}=${String(node?.[name] ?? "")}`);
    const leafText = getElementChildren(node).length ? "" : String(node.textContent || "");
    return `${path.join(".")}:${attributes.join(";")}:${properties.join(";")}:text=${leafText}`;
  }).join("|");
}

function syncElementState(sourceNode, mirrorNode, entry) {
  const overrides = getAccessibilityOverrides(entry, sourceNode);
  STATE_ATTRIBUTES.forEach((name) => {
    const value = Object.hasOwn(overrides, name)
      ? overrides[name]
      : sourceNode?.getAttribute?.(name);
    setAttributeIfChanged(mirrorNode, name, value);
  });
  STATE_PROPERTIES.forEach((name) => {
    if (name in mirrorNode && mirrorNode[name] !== sourceNode?.[name]) {
      mirrorNode[name] = sourceNode?.[name];
    }
  });
  if (getElementChildren(sourceNode).length === 0) {
    const textContent = String(sourceNode?.textContent || "");
    if (mirrorNode.textContent !== textContent) {
      mirrorNode.textContent = textContent;
    }
  }
}

function syncActionAccessibility(entry) {
  entry.actionPairs.forEach(({ sourceNode, mirrorNode }, index) => {
    const sourceRecord = entry.accessibility.actions[index];
    restoreAttribute(mirrorNode, sourceRecord?.ariaHidden);
    restoreAttribute(mirrorNode, sourceRecord?.tabIndex);

    const role = String(mirrorNode.getAttribute?.("role") || "").trim().toLowerCase();
    const tagName = String(mirrorNode.tagName || "").trim().toLowerCase();
    if (!sourceRecord?.tabIndex?.present && !["button", "input", "select", "textarea", "a"].includes(tagName) && role) {
      mirrorNode.setAttribute?.("tabindex", "0");
    }

    if (!mirrorNode.getAttribute?.("aria-label") && sourceNode.getAttribute?.("aria-labelledby")) {
      const accessibleLabel = getBoardInputModeLabelCandidates(sourceNode)[0] || "";
      if (accessibleLabel) {
        mirrorNode.setAttribute?.("aria-label", accessibleLabel);
        mirrorNode.removeAttribute?.("aria-labelledby");
      }
    }
  });
}

function hideUnmappedMirrorActions(entry) {
  const mappedActions = new Set(entry.actionPairs.map((pair) => pair.mirrorNode));
  const candidates = queryAll(entry.mirrorRoot, BOARD_INPUT_MODE_CONTROL_SELECTOR);
  if (entry.mirrorRoot?.matches?.(BOARD_INPUT_MODE_CONTROL_SELECTOR)) {
    candidates.unshift(entry.mirrorRoot);
  }
  candidates.forEach((node) => {
    if (mappedActions.has(node)) {
      return;
    }
    node.setAttribute?.("hidden", "");
    node.setAttribute?.("aria-hidden", "true");
    node.setAttribute?.("tabindex", "-1");
    if ("disabled" in node) {
      node.disabled = true;
    }
  });
}

function syncEntryState(entry) {
  const nextSignature = buildStateSignature(entry);
  if (entry.stateSignature === nextSignature) {
    return false;
  }
  getElementTree(entry.sourceRoot).forEach(({ node, path }) => {
    const mirrorNode = getNodeAtPath(entry.mirrorRoot, path);
    if (mirrorNode) {
      syncElementState(node, mirrorNode, entry);
    }
  });
  syncActionAccessibility(entry);
  hideUnmappedMirrorActions(entry);
  entry.stateSignature = nextSignature;
  return true;
}

function isSourceActionEnabled(node) {
  return !(
    node?.disabled === true ||
    node?.hidden === true ||
    String(node?.getAttribute?.("aria-disabled") || "").trim().toLowerCase() === "true" ||
    String(node?.getAttribute?.("aria-hidden") || "").trim().toLowerCase() === "true"
  );
}

function isNativeKeyboardControl(node) {
  return ["button", "input", "select", "textarea", "a"].includes(
    String(node?.tagName || "").trim().toLowerCase()
  );
}

function bindActionPair(sourceNode, mirrorNode) {
  const clickHandler = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (isSourceActionEnabled(sourceNode)) {
      sourceNode.click?.();
    }
  };
  mirrorNode.addEventListener?.("click", clickHandler);

  let keyHandler = null;
  if (!isNativeKeyboardControl(mirrorNode)) {
    keyHandler = (event) => {
      if (event?.key !== "Enter" && event?.key !== " " && event?.key !== "Spacebar") {
        return;
      }
      event.preventDefault?.();
      event.stopPropagation?.();
      if (isSourceActionEnabled(sourceNode)) {
        sourceNode.click?.();
      }
    };
    mirrorNode.addEventListener?.("keydown", keyHandler);
  }
  return { clickHandler, keyHandler, mirrorNode, sourceNode };
}

function removeDuplicateIds(entry, sequence) {
  const idMap = new Map();
  getElementTree(entry.sourceRoot).forEach(({ node, path }) => {
    const sourceId = node.getAttribute?.("id");
    const mirrorNode = getNodeAtPath(entry.mirrorRoot, path);
    if (!sourceId || !mirrorNode) {
      return;
    }
    const mirrorId = `ad-ext-board-control-mirror-${sequence}-${sourceId}`;
    idMap.set(sourceId, mirrorId);
    mirrorNode.setAttribute?.("id", mirrorId);
  });
  getElementTree(entry.mirrorRoot).forEach(({ node }) => {
    ["aria-labelledby", "aria-describedby"].forEach((name) => {
      const value = node.getAttribute?.(name);
      if (!value) {
        return;
      }
      node.setAttribute?.(
        name,
        String(value).split(/\s+/).map((id) => idMap.get(id) || id).join(" ")
      );
    });
  });
}

function createMirrorEntry(documentRef, group, sequence) {
  const mirrorRoot = group.sourceRoot?.cloneNode?.(true) || null;
  const wrapperNode = documentRef?.createElement?.("div") || null;
  if (!mirrorRoot || !wrapperNode) {
    return null;
  }

  const actionPairs = (group.actionNodes || []).map((sourceNode) => {
    const path = getNodePath(group.sourceRoot, sourceNode);
    const mirrorNode = path !== null ? getNodeAtPath(mirrorRoot, path) : null;
    return mirrorNode ? { mirrorNode, sourceNode } : null;
  }).filter(Boolean);
  if (actionPairs.length !== group.actionNodes.length) {
    return null;
  }

  wrapperNode.classList?.add?.(BOARD_CONTROLS_MIRROR_GROUP_CLASS);
  wrapperNode.setAttribute?.("data-ad-ext-board-controls-kind", group.kind || "primary");
  wrapperNode.appendChild?.(mirrorRoot);

  const entry = {
    accessibility: captureSourceAccessibility(group.sourceRoot, group.actionNodes),
    actionBindings: [],
    actionPairs,
    kind: group.kind || "primary",
    mirrorRoot,
    sourceRoot: group.sourceRoot,
    stateSignature: "",
    structureSignature: buildStructureSignature(group),
    wrapperNode,
  };
  removeDuplicateIds(entry, sequence);
  hideSourceFromAccessibility(entry.sourceRoot, entry.accessibility);
  entry.actionBindings = actionPairs.map(({ sourceNode, mirrorNode }) => bindActionPair(sourceNode, mirrorNode));
  syncEntryState(entry);
  return entry;
}

function cleanupEntry(entry) {
  (entry?.actionBindings || []).forEach(({ mirrorNode, clickHandler, keyHandler }) => {
    mirrorNode?.removeEventListener?.("click", clickHandler);
    if (keyHandler) {
      mirrorNode?.removeEventListener?.("keydown", keyHandler);
    }
  });
  restoreSourceAccessibility(entry?.sourceRoot, entry?.accessibility);
  entry?.wrapperNode?.remove?.();
}

function syncEntryPosition(entry, windowRef = null) {
  const rect = entry?.sourceRoot?.getBoundingClientRect?.();
  const wrapperNode = entry?.wrapperNode;
  if (!rect || !wrapperNode?.style) {
    return;
  }
  const viewportMargin = 4;
  const viewportWidth = Number(windowRef?.innerWidth) || 0;
  const viewportHeight = Number(windowRef?.innerHeight) || 0;
  const sourceWidth = Math.max(0, Number(rect.width) || 0);
  const sourceHeight = Math.max(0, Number(rect.height) || 0);
  const width = viewportWidth > 0
    ? Math.min(sourceWidth, Math.max(0, viewportWidth - viewportMargin * 2))
    : sourceWidth;
  if (sourceWidth > 0) {
    wrapperNode.style.setProperty?.("width", `${width.toFixed(1)}px`);
  }
  const renderedHeight = Math.max(
    0,
    Number(wrapperNode.getBoundingClientRect?.()?.height) || sourceHeight
  );
  const leftLimit = viewportWidth > 0
    ? Math.max(viewportMargin, viewportWidth - width - viewportMargin)
    : Number.POSITIVE_INFINITY;
  const topLimit = viewportHeight > 0
    ? Math.max(viewportMargin, viewportHeight - renderedHeight - viewportMargin)
    : Number.POSITIVE_INFINITY;
  const left = Math.min(Math.max(viewportMargin, Number(rect.left) || 0), leftLimit);
  const top = Math.min(Math.max(viewportMargin, Number(rect.top) || 0), topLimit);
  wrapperNode.style.setProperty?.("top", `${top.toFixed(1)}px`);
  wrapperNode.style.setProperty?.("left", `${left.toFixed(1)}px`);
}

function createPortalNode(documentRef) {
  const portalNode = documentRef?.createElement?.("div") || null;
  const rootNode = documentRef?.getElementById?.("root") || documentRef?.body || null;
  if (!portalNode || !rootNode?.appendChild) {
    return null;
  }
  portalNode.classList?.add?.(BOARD_CONTROLS_PORTAL_CLASS);
  portalNode.setAttribute?.(BOARD_CONTROLS_PORTAL_ATTRIBUTE, "true");
  rootNode.appendChild(portalNode);
  return portalNode;
}

function getPortalState(themeState = {}) {
  const state = themeState.boardControlsPortal;
  return state && typeof state === "object" ? state : null;
}

function sameStructure(entries, groups) {
  return entries.length === groups.length && entries.every((entry, index) => {
    const group = groups[index];
    const actionNodes = group.actionNodes || [];
    return (
      entry.sourceRoot === group.sourceRoot &&
      entry.structureSignature === buildStructureSignature(group) &&
      entry.actionPairs.length === actionNodes.length &&
      entry.actionPairs.every((pair, actionIndex) => pair.sourceNode === actionNodes[actionIndex])
    );
  });
}

function resetResizeObserver(state, context) {
  try {
    state.resizeObserver?.disconnect?.();
  } catch (_) {
    // Keep observer cleanup fail-soft.
  }
  state.resizeObserver = null;
  const ResizeObserverRef = context.windowRef?.ResizeObserver;
  if (typeof ResizeObserverRef !== "function") {
    return;
  }
  state.resizeObserver = new ResizeObserverRef(() => {
    state.owners.forEach((scheduler) => scheduler?.schedule?.());
  });
  state.entries.forEach((entry) => {
    try {
      state.resizeObserver.observe?.(entry.sourceRoot);
    } catch (_) {
      // Keep observer registration fail-soft.
    }
  });
}

function destroyPortalState(state) {
  try {
    state.resizeObserver?.disconnect?.();
  } catch (_) {
    // Keep portal cleanup fail-soft.
  }
  state.entries.forEach(cleanupEntry);
  state.portalNode?.remove?.();
  state.owners.forEach((_, ownerState) => {
    if (ownerState.boardControlsPortal === state) {
      ownerState.boardControlsPortal = null;
    }
  });
  state.owners.clear();
  if (portalStatesByDocument.get(state.documentRef) === state) {
    portalStatesByDocument.delete(state.documentRef);
  }
}

export function cleanupBoardControlsPortal(themeState = {}) {
  const state = getPortalState(themeState);
  if (!state) {
    return false;
  }
  state.owners.delete(themeState);
  themeState.boardControlsPortal = null;
  if (state.owners.size === 0) {
    destroyPortalState(state);
  }
  return true;
}

export function syncBoardControlsPortal(context = {}) {
  const { documentRef, themeState = {} } = context;
  const groups = (themeState.layoutHookTargets?.boardControlGroups || []).filter((group) => {
    return group?.sourceRoot?.isConnected !== false && (group.actionNodes || []).length > 0;
  });
  if (!documentRef || !groups.length) {
    cleanupBoardControlsPortal(themeState);
    return false;
  }

  let state = portalStatesByDocument.get(documentRef) || null;
  if (state && (!state.portalNode || state.portalNode.isConnected === false)) {
    destroyPortalState(state);
    state = null;
  }
  if (!state) {
    queryAll(documentRef, PORTAL_SELECTOR).forEach((node) => node.remove?.());
    const portalNode = createPortalNode(documentRef);
    if (!portalNode) {
      return false;
    }
    state = {
      documentRef,
      entries: [],
      owners: new Map(),
      portalNode,
      resizeObserver: null,
    };
    portalStatesByDocument.set(documentRef, state);
  }
  state.owners.set(themeState, context.scheduler || null);
  themeState.boardControlsPortal = state;

  if (!sameStructure(state.entries, groups)) {
    state.entries.forEach(cleanupEntry);
    state.entries = groups.map((group, index) => createMirrorEntry(documentRef, group, index + 1)).filter(Boolean);
    state.portalNode.replaceChildren?.(...state.entries.map((entry) => entry.wrapperNode));
    resetResizeObserver(state, context);
  } else {
    state.entries.forEach(syncEntryState);
  }
  state.entries.forEach((entry) => syncEntryPosition(entry, context.windowRef));
  return state.entries.length > 0;
}
