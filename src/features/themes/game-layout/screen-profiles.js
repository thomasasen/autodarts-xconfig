import { findBoardPresentationSurface } from "../../../shared/board-presentation-surface.js";
import { normalizePresentationLayout, resolveScreenProfile } from "../../../shared/presentation-config.js";
import { readModernCricketGrid } from "../../cricket-surface/modern-grid.js";
import { resolveGameLayoutPlayerOrder, resolveLegStarterSeat } from "./logic.js";
import { createGameLayoutPlayerTransitionController } from "./player-transition.js";
import { resolveModernX01GameLayoutSurface } from "./surface.js";
import { readCricketPlayerStatistics } from "../../cricket-surface/player-statistics.js";

export const SCREEN_STYLE_ID = "ad-xconfig-screen-profile-style";
const ROOT = "data-adx-screen-profile";
const PART = "data-adx-screen-part";

function branch(parent, node) {
  let current = node;
  while (current?.parentElement && current.parentElement !== parent) current = current.parentElement;
  return current?.parentElement === parent ? current : null;
}

export function resolveScreenSurface(documentRef) {
  const board = findBoardPresentationSurface(documentRef);
  if (!board) return null;
  const cricketGrid = readModernCricketGrid(documentRef);
  const grid = cricketGrid?.root;
  const x01Surface = resolveModernX01GameLayoutSurface(documentRef);
  const players = Array.from(documentRef.querySelectorAll("main .overflow-clip, .ad-ext-player"))
    .filter((node) => node.querySelector?.(".font-display, .ad-ext-player-name"));
  const panels = grid ? [grid] : players;
  for (let root = board.host.parentElement; root && root !== documentRef.body; root = root.parentElement) {
    const boardPart = branch(root, board.host);
    const parts = panels.map((node) => branch(root, node));
    if (boardPart && parts.length && parts.every((part) => part && part !== boardPart)) {
      const playerItems = grid ? [] : players.map((card, index) =>
        parts[index] === card ? card : branch(parts[index], card));
      // A shared wrapper cannot represent several independent grid rows. Leave
      // unfamiliar structures native rather than flattening their contents.
      if (!grid && (playerItems.some((item) => !item) || new Set(playerItems).size !== players.length)) return null;
      return { root, board, boardPart, panels: [...new Set(parts)], players, playerItems, x01Surface, cricketGrid, cricket: Boolean(grid) };
    }
  }
  return null;
}

export function buildScreenProfileStyle() {
  return `
[${ROOT}] {display:grid!important;grid-template-columns:minmax(0,calc(100% - var(--adx-board-share) - 16px)) minmax(0,var(--adx-board-share))!important;gap:16px!important;min-height:0!important;height:auto!important;max-block-size:calc(100dvh - 100px);overflow:auto!important;align-items:start!important}
[${ROOT}]>[${PART}="board"] {grid-column:2!important;grid-row:1 / span var(--adx-player-rows,1)!important;min-width:0!important;min-height:0!important;max-width:100%!important}
[${ROOT}] [data-adx-screen-frame] {width:100%!important;height:auto!important;aspect-ratio:1;box-sizing:border-box;min-height:0!important}
[${ROOT}]>[${PART}="column"] {display:contents!important}
[${ROOT}] [${PART}="player"] {grid-column:1!important;grid-row:var(--adx-player-row)!important;min-height:112px!important;max-height:none!important;min-width:0!important;order:var(--adx-player-row)!important}
[${ROOT}]>[${PART}="players"] {grid-column:1!important;min-width:0!important;max-height:none!important;overflow:visible!important}
[${ROOT}="portrait"] {grid-template-columns:minmax(0,1fr)!important}
[${ROOT}="portrait"]>[${PART}="board"] {grid-column:1!important;grid-row:auto!important;order:2!important}
[${ROOT}="portrait"]>[${PART}="players"] {grid-column:1!important;order:1!important}
[${ROOT}="portrait"] [data-adx-screen-frame] {max-inline-size:calc(100dvh * var(--adx-board-share-ratio));margin-inline:auto}
main [${ROOT}] .grid[data-ad-cricket-layout="true"] [data-ad-cricket-name="true"] {font-size:calc(var(--ad-cricket-name-size) * var(--adx-text-scale))!important}
main [${ROOT}] .grid[data-ad-cricket-layout="true"] [data-ad-cricket-score="true"] {font-size:calc(var(--ad-cricket-score-size) * var(--adx-text-scale))!important}
[${ROOT}] [data-adx-leg-starter="true"]::before {content:"START";font-size:10px;position:absolute;inset:2px auto auto 2px;z-index:2}
[${ROOT}] :is(.font-display,.ad-ext-player-name) {font-size:calc(1.25rem * var(--adx-text-scale))!important;overflow-wrap:anywhere}
[${ROOT}] :is(.font-number.overflow-hidden,.ad-ext-player-score) {font-size:calc(var(--ad-ext-theme-remaining-score-font-size,3.5rem) * var(--adx-text-scale))!important;max-width:100%;overflow-wrap:anywhere}
[${ROOT}][data-adx-show-averages="false"] [data-adx-stat="average"],
[${ROOT}][data-adx-show-statistics="false"] [data-adx-stat="secondary"] {display:none!important}
`;
}

function restoreProperty(node, key, value) {
  if (key.startsWith("--")) {
    if (value) node.style.setProperty(key, value); else node.style.removeProperty(key);
  } else if (value === null) node.removeAttribute(key); else node.setAttribute(key, value);
}

export function createScreenProfileController(context) {
  const { documentRef, windowRef, domGuards } = context;
  let nodes = [];
  let root = null;
  let resizeObserver = null;
  let lastActive = null;
  const transition = createGameLayoutPlayerTransitionController({ windowRef });
  const restore = new Map();
  const expected = new Map();
  function mark(node, key, value) {
    if (!restore.has(node)) restore.set(node, new Map());
    const previous = restore.get(node);
    if (!expected.has(node)) expected.set(node, new Map());
    expected.get(node).set(key, value);
    if (!previous.has(key)) previous.set(key, key.startsWith("--") ? node.style.getPropertyValue(key) : node.getAttribute(key));
    if (key.startsWith("--")) {
      if (node.style.getPropertyValue(key) !== value) node.style.setProperty(key, value);
    } else if (node.getAttribute(key) !== value) node.setAttribute(key, value);
  }
  function clear() {
    resizeObserver?.disconnect();
    resizeObserver = null;
    transition.cancel();
    lastActive = null;
    for (const [node, properties] of restore) for (const [key, value] of properties) {
      restoreProperty(node, key, value);
    }
    restore.clear();
    expected.clear();
    nodes = [];
    root = null;
    domGuards.removeNodeById(SCREEN_STYLE_ID);
  }
  function bindSurface(surface) {
    const structure = [surface.root, surface.board.host, surface.boardPart, ...surface.panels, ...surface.players, ...surface.playerItems];
    if (structure.length !== nodes.length || structure.some((node, i) => node !== nodes[i])) clear();
    expected.clear();
    nodes = structure;
    root = surface.root;
    if (!resizeObserver && windowRef?.ResizeObserver && context.schedule) {
      resizeObserver = new windowRef.ResizeObserver(() => context.schedule());
      resizeObserver.observe(root);
    }
  }
  function markScreenSurface(surface, settings) {
    const rect = root.getBoundingClientRect();
    const profile = resolveScreenProfile(settings.screenProfile, rect.width || windowRef.innerWidth, windowRef.innerHeight);
    mark(root, ROOT, profile);
    mark(root, "--adx-board-share", `${settings.boardShare}%`);
    mark(root, "--adx-board-share-ratio", String(settings.boardShare / 100));
    mark(root, "--adx-text-scale", String(settings.textScale / 100 * (profile === "tv" ? 1.25 : 1)));
    mark(root, "data-adx-show-averages", String(settings.showAverages));
    mark(root, "data-adx-show-statistics", String(settings.showStatistics));
    mark(surface.boardPart, PART, "board");
    if (surface.board.frame) mark(surface.board.frame, "data-adx-screen-frame", "true");
    surface.panels.filter((node) => surface.cricket || !surface.playerItems.includes(node))
      .forEach((node) => mark(node, PART, surface.cricket ? "players" : "column"));
    for (const header of surface.cricketGrid?.headers || []) {
      for (const mpr of readCricketPlayerStatistics(header).mprNodes) mark(mpr, "data-adx-stat", "average");
    }
  }
  function markPlayerRows(surface, raw) {
    const players = surface.players.map((card, index) => ({
      cardNode: card, item: surface.playerItems[index],
      active: card.classList.contains("bg-raspberry-slush-diagonal") || card.classList.contains("bg-grey-slush-diagonal") || card.classList.contains("ad-ext-player-active"),
      seatIndex: index,
    })).filter((player) => player.item);
    const snapshot = context.gameState?.getSnapshot?.();
    const variant = String(snapshot?.variant || snapshot?.match?.variant || snapshot?.match?.settings?.variant || "");
    const x01 = variant ? /^(?:x01|\d+01)$/i.test(variant) : Boolean(surface.x01Surface);
    const ordered = resolveGameLayoutPlayerOrder(players, x01 ? raw.playerOrder : "fixed");
    const active = players.findIndex((player) => player.active);
    const before = x01 && raw.playerOrder === "active-first" && lastActive !== null && active !== lastActive
      ? transition.capture(root, players) : null;
    ordered.forEach((player, index) => {
      mark(player.item, PART, "player");
      mark(player.item, "--adx-player-row", String(index + 1));
    });
    const names = players.map((player) => player.cardNode.querySelector(".font-display,.ad-ext-player-name")?.textContent || "");
    const starter = x01 && raw.showLegStarter ? resolveLegStarterSeat(snapshot, players.length, names) : null;
    players.forEach((player, index) => mark(player.cardNode, "data-adx-leg-starter", String(index === starter)));
    mark(root, "--adx-player-rows", String(Math.max(1, players.length)));
    if (before) transition.animate({ root, players, before, effect: raw.playerTransitionEffect });
    lastActive = active;
    for (const player of surface.x01Surface?.players || []) {
      if (player.statRegions?.[0]) mark(player.statRegions[0], "data-adx-stat", "average");
    }
  }
  function markSemanticStatistics() {
    // Label statistics semantically; never classify a score or target by its value.
    for (const label of root.querySelectorAll("[data-stat], [aria-label], .text-xs, .text-sm")) {
      const text = `${label.getAttribute("data-stat") || ""} ${label.getAttribute("aria-label") || ""} ${label.textContent || ""}`.trim();
      if (/^(?:AVG|MPR|Average)\b/i.test(text)) mark(label, "data-adx-stat", "average");
      else if (/^(?:First 9|F9|Checkout %|Doubles %)\b/i.test(text)) mark(label, "data-adx-stat", "secondary");
    }
  }
  function restoreUnusedProperties() {
    // Statistics and inner board wrappers can be replaced without changing the
    // player/root identity. Stop monitoring removed or no-longer-used output.
    for (const [node, properties] of restore) {
      for (const [key, value] of properties) if (!expected.get(node)?.has(key)) {
        restoreProperty(node, key, value);
        properties.delete(key);
      }
      if (!properties.size) restore.delete(node);
    }
  }
  function update(raw) {
    const settings = normalizePresentationLayout(raw);
    if (settings.screenProfile === "legacy") { clear(); return false; }
    const surface = resolveScreenSurface(documentRef);
    if (!surface) { clear(); return true; }
    bindSurface(surface);
    markScreenSurface(surface, settings);
    if (!surface.cricket) markPlayerRows(surface, raw);
    markSemanticStatistics();
    restoreUnusedProperties();
    domGuards.ensureStyle(SCREEN_STYLE_ID, buildScreenProfileStyle());
    return true;
  }
  return { update, clear, checkHealth: () => !root || (root.isConnected && Boolean(documentRef.getElementById(SCREEN_STYLE_ID)) && [...expected].every(([node, properties]) => node.isConnected && [...properties].every(([key, value]) => (key.startsWith("--") ? node.style.getPropertyValue(key) : node.getAttribute(key)) === value))) };
}
