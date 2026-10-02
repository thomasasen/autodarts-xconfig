import { createFeatureMountHarness } from "../shared/feature-mount-harness.js";
import { readModernCricketGrid } from "../cricket-surface/modern-grid.js";
import { findBoardSvgRoot, NATIVE_BOARD_SELECTOR } from "../../shared/dartboard-svg.js";
import { resolveCricketLayoutSettings } from "../../shared/cricket-layout-config.js";
import { calculateCricketLayout } from "./logic.js";
import { STYLE_ID, buildCricketLayoutStyleText } from "./style.js";

const FEATURE_KEY = "cricket-layout";

function isCricketScoreNode(node, mprNodes) {
  return !mprNodes.some((mpr) => mpr === node || mpr.contains(node)) &&
    /^[\d\s.,+-]+$/.test(String(node.textContent || "").trim());
}

function resolvePanels(grid, documentRef) {
  const svg = findBoardSvgRoot(documentRef);
  const board = svg?.closest?.(NATIVE_BOARD_SELECTOR);
  if (!board) return null;
  let root = grid.parentElement;
  for (let depth = 0; root && depth < 5; depth += 1, root = root.parentElement) {
    if (["MAIN", "BODY", "HTML"].includes(root.tagName)) return null;
    if (!root.contains(board)) continue;
    const children = Array.from(root.children || []);
    const tablePanel = children.find((node) => node === grid || node.contains(grid));
    const boardPanel = children.find((node) => node === board || node.contains(board));
    return children.length === 2 && tablePanel && boardPanel && tablePanel !== boardPanel
      ? { root, tablePanel, boardPanel } : null;
  }
  return null;
}

// Own only attributes and custom properties; adopt concurrent host edits as the next baseline.
function createDecorationState() {
  const nodes = new Map();
  function set(node, key, value, style = false) {
    if (!node) return;
    if (!nodes.has(node)) nodes.set(node, new Map());
    const values = nodes.get(node);
    const identity = `${style ? "style" : "attr"}:${key}`;
    const read = () => style ? node.style.getPropertyValue(key) : node.getAttribute(key);
    let entry = values.get(identity);
    if (!entry) {
      entry = { original: read(), applied: null, style, key };
      values.set(identity, entry);
    } else if (read() !== entry.applied) {
      entry.original = read();
    }
    const next = String(value);
    if (read() !== next) {
      if (style) node.style.setProperty(key, next);
      else node.setAttribute(key, next);
    }
    entry.applied = next;
  }
  function clear() {
    nodes.forEach((values, node) => values.forEach((entry) => {
      const current = entry.style ? node.style.getPropertyValue(entry.key) : node.getAttribute(entry.key);
      if (current !== entry.applied) return;
      if (entry.style) {
        if (entry.original) node.style.setProperty(entry.key, entry.original);
        else node.style.removeProperty(entry.key);
      } else if (entry.original === null) node.removeAttribute(entry.key);
      else node.setAttribute(entry.key, entry.original);
    }));
    nodes.clear();
  }
  return { set, clear };
}

export function mountCricketLayout(context = {}) {
  const decorations = createDecorationState();
  let lastGrid = null;
  let lastStructure = [];
  let resizeObserver = null;
  let observedRoot = null;
  const harness = createFeatureMountHarness(context, { update });
  if (!harness || !context.domGuards) return () => {};
  const { documentRef, windowRef } = harness;

  function clear() {
    decorations.clear();
    lastGrid = null;
    lastStructure = [];
    observedRoot = null;
    resizeObserver?.disconnect();
    context.domGuards.removeNodeById(STYLE_ID);
  }

  function update() {
    const grid = readModernCricketGrid(documentRef);
    const raw = context.config?.getFeatureConfig?.("cricketLayout") || {};
    if (!grid || raw.enabled === false) { clear(); return; }
    const panels = resolvePanels(grid.root, documentRef);
    const structure = [grid.root, ...grid.headers, ...grid.headers.flatMap((header) => Array.from(header.querySelectorAll('span,div,p,svg[data-slot="nametag-shape"]'))), ...grid.labels.map((entry) => entry.node), ...Array.from(grid.cellsByLabel.values()).flat(), ...(panels ? [panels.root, panels.tablePanel, panels.boardPanel] : [])];
    if (lastGrid !== grid.root || structure.some((node, index) => node !== lastStructure[index]) || structure.length !== lastStructure.length) {
      clear();
      lastGrid = grid.root;
      lastStructure = structure;
    }
    const settings = resolveCricketLayoutSettings(raw, grid.labels.length === 12);
    const rect = grid.root.getBoundingClientRect();
    const panelRect = panels?.root.getBoundingClientRect();
    const share = calculateCricketLayout({ playerCount: grid.headers.length, targetCount: grid.labels.length, settings }).tableShare;
    const width = panelRect?.width > 0 ? panelRect.width * share : rect.width;
    const height = rect.height > 0 ? rect.height : Math.max(120, (windowRef?.innerHeight || 600) - Math.max(0, rect.top));
    const geometry = calculateCricketLayout({ width, height, playerCount: grid.headers.length, targetCount: grid.labels.length, settings });
    context.domGuards.ensureStyle(STYLE_ID, buildCricketLayoutStyleText());
    const set = decorations.set;
    set(grid.root, "data-ad-cricket-layout", "true");
    for (const [key, value] of Object.entries({
      "--ad-cricket-players": grid.headers.length, "--ad-cricket-targets": grid.labels.length,
      "--ad-cricket-label-width": `${geometry.labelWidth}px`, "--ad-cricket-header-height": `${geometry.headerHeight}px`,
      "--ad-cricket-gap": `${geometry.gap}px`, "--ad-cricket-mark-size": `${geometry.markSize}px`,
      "--ad-cricket-target-size": `${geometry.targetSize}px`, "--ad-cricket-name-size": `${geometry.nameSize}px`,
      "--ad-cricket-score-size": `${geometry.scoreSize}px`, "--ad-cricket-name-lines": settings.names === "single" ? 1 : 2,
      "--ad-cricket-nameplate-height": `${geometry.nameSize * (settings.names === "single" ? 1 : 2) * 1.15 + 8}px`,
    })) set(grid.root, key, value, true);
    for (const [key, value] of Object.entries({ "mark-size": settings.markSize, names: settings.names, mpr: settings.mpr, indicator: settings.activeIndicator })) {
      set(grid.root, `data-ad-cricket-${key}`, value);
    }
    function place(node, kind, row, column, active = false) {
      set(node, "data-ad-cricket-layout-node", kind);
      set(node, "--ad-cricket-row", row, true);
      set(node, "--ad-cricket-column", column, true);
      set(node, "data-ad-cricket-active", active && settings.activeIndicator !== "native" ? "true" : "false");
    }
    const corner = Array.from(grid.root.children || []).find((node) =>
      node.getAttribute("data-ad-ext-cricket-surface-overlay") !== "true" &&
      !grid.headers.includes(node) && !grid.labels.some((entry) => entry.node === node) &&
      !Array.from(grid.cellsByLabel.values()).some((cells) => cells.includes(node)));
    if (corner) place(corner, "corner", 1, 1);
    grid.headers.forEach((header, index) => {
      place(header, "header", 1, index + 2, index === grid.activePlayerIndex);
      const name = header.querySelector(".font-display");
      if (name) {
        set(name, "data-ad-cricket-name", "true");
        set(name, "title", name.textContent || "");
        const plate = name.parentElement;
        const shape = plate?.parentElement?.querySelector('[data-slot="nametag-shape"]');
        if (shape && plate !== header) {
          set(plate, "data-ad-cricket-nameplate", "true");
          set(shape, "data-ad-cricket-nameplate-shape", "true");
        }
      }
      const isMpr = (node) => /^MPR\s*(?::\s*)?[\d.,]*$/i.test(String(node?.textContent || "").trim());
      const mprNodes = Array.from(header.querySelectorAll("span,div,p")).filter((node) =>
        isMpr(node) && !isMpr(node.parentElement));
      const numericNodes = Array.from(header.querySelectorAll(".font-number")).filter((node) =>
        isCricketScoreNode(node, mprNodes));
      const boldScores = numericNodes.filter((node) => node.classList.contains("font-bold"));
      let score = null;
      if (boldScores.length === 1) score = boldScores[0];
      else if (numericNodes.length === 1) score = numericNodes[0];
      if (score) {
        set(score, "data-ad-cricket-score", "true");
        // Current native heads render unlabeled statistic badges beside the main score.
        Array.from(score.parentElement.children).filter((node) =>
          node !== score && node.matches(".flex.flex-col") && node.querySelector(".rounded-sm.size-8 .font-number"))
          .forEach((node) => mprNodes.push(node));
      }
      mprNodes.forEach((node) => set(node, "data-ad-cricket-mpr-value", "true"));
    });
    grid.labels.forEach(({ node, label }, index) => {
      place(node, "label", index + 2, 1);
      grid.cellsByLabel.get(label).forEach((cell, player) => place(cell, "cell", index + 2, player + 2, player === grid.activePlayerIndex));
    });
    if (panels) {
      set(panels.root, "data-ad-cricket-layout-stage", "true");
      set(panels.root, "--ad-cricket-table-share", `${geometry.tableShare * 100}%`, true);
      set(panels.tablePanel, "data-ad-cricket-layout-panel", "table");
      set(panels.boardPanel, "data-ad-cricket-layout-panel", "board");
    }
    const nextObservedRoot = panels?.root || grid.root;
    if (resizeObserver && observedRoot !== nextObservedRoot) {
      resizeObserver.disconnect();
      resizeObserver.observe(nextObservedRoot);
      observedRoot = nextObservedRoot;
    }
  }

  if (typeof windowRef?.ResizeObserver === "function") resizeObserver = new windowRef.ResizeObserver(() => harness.schedule());
  harness.registerObserver({ key: `${FEATURE_KEY}:dom-observer`, observeOptions: { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class", "src", "alt", "data-marks"] }, callback(mutations) {
    const external = mutations.some((mutation) => !mutation.target?.closest?.(`#${STYLE_ID},#ad-xconfig-panel-host,[data-ad-ext-cricket-surface-overlay="true"]`));
    if (external) harness.schedule();
  } });
  harness.registerListeners(["resize", "popstate", "hashchange"].map((type) => ({ key: `${FEATURE_KEY}:${type}`, target: windowRef, type, handler: () => harness.schedule() })));
  harness.subscribeToGameState();
  update();
  return harness.createCleanup(clear);
}
