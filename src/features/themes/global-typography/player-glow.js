import { normalizeHexColor } from "../../../shared/hex-color-utils.js";
import { readModernCricketGrid } from "../../cricket-surface/modern-grid.js";

export function buildPlayerGlowStyle(config = {}, scope = "") {
  if (!["steady", "pulse"].includes(config.glowMode)) return "";
  const color = normalizeHexColor(config.glowColor, "") || normalizeHexColor(config.accentColor, "") || "#38bdf8";
  const intensity = Math.min(100, Math.max(0, Number(config.glowIntensity) || 0)) / 100;
  if (!intensity) return "";
  const prefix = scope ? scope + " " : "";
  // Independent owned child: preserve both native pseudo-elements and animations.
  const targets = [
    "main .overflow-clip.bg-raspberry-slush-diagonal",
    "main .overflow-clip.bg-grey-slush-diagonal",
    ".ad-ext-player.ad-ext-player-active",
    '[data-ad-cricket-layout-node="header"][data-ad-cricket-active="true"]',
    '[data-ad-ext-theme-cricket-active="true"]',
    '[data-adx-player-glow="true"]',
  ].map((selector) => `${prefix}${selector}:not(.ad-ext-x01-bust-active-player-highlight):not(.ad-ext-player-winner):not([data-state="won"]):not([data-winner="true"]):not([data-adx-glow-suppressed="true"]):not(:has(.ad-ext-x01-bust-surface-highlight))`);
  return `
${targets.join(",")} {--adx-player-glow-color:${color};--adx-player-glow-opacity:${intensity};position:relative}
${targets.map((selector) => `${selector}>.ad-xconfig-player-glow`).join(",")} {position:absolute;inset:1px;pointer-events:none;z-index:1;border-radius:inherit;box-shadow:inset 0 0 12px 3px var(--adx-player-glow-color);opacity:var(--adx-player-glow-opacity);${config.glowMode === "pulse" ? "animation:adx-player-glow 2.6s ease-in-out infinite;" : ""}}
@keyframes adx-player-glow {50% {opacity:calc(var(--adx-player-glow-opacity) * .4)}}
@media (prefers-reduced-motion:reduce) {${targets.map((selector) => `${selector}>.ad-xconfig-player-glow`).join(",")} {animation:none}}
`;
}

export function createPlayerGlowLayer(documentRef) {
  const layer = documentRef.createElement("span");
  layer.className = "ad-xconfig-player-glow";
  layer.setAttribute("aria-hidden", "true");
  layer.setAttribute("data-adx-decoration", "player-glow");
  return layer;
}

export function createPlayerGlowController(documentRef) {
  const layers = new Map();
  const selectors = 'main .overflow-clip.bg-raspberry-slush-diagonal,main .overflow-clip.bg-grey-slush-diagonal,.ad-ext-player.ad-ext-player-active,[data-ad-cricket-layout-node="header"][data-ad-cricket-active="true"],[data-ad-ext-theme-cricket-active="true"]';
  const suppressed = '.ad-ext-x01-bust-active-player-highlight,.ad-ext-player-winner,[data-state="won"],[data-winner="true"]';
  function clear() { active = false; for (const [node, layer] of layers) { layer.remove(); node.removeAttribute("data-adx-player-glow"); } layers.clear(); }
  let active = false;
  function targets() {
    const grid = readModernCricketGrid(documentRef);
    const header = grid?.activePlayerIndex !== null ? grid?.headers[grid?.activePlayerIndex] : null;
    return [...new Set([...documentRef.querySelectorAll(selectors), ...(header ? [header] : [])])].filter((node) => !node.matches(suppressed));
  }
  function update(enabled) {
    active = Boolean(enabled);
    if (!enabled) { clear(); return; }
    const selected = targets();
    for (const [node, layer] of layers) if (!selected.includes(node) || !node.isConnected || !layer.isConnected) { layer.remove(); node.removeAttribute("data-adx-player-glow"); layers.delete(node); }
    for (const node of selected) if (!layers.has(node)) {
      const layer = createPlayerGlowLayer(documentRef);
      node.appendChild(layer);
      node.setAttribute("data-adx-player-glow", "true");
      layers.set(node, layer);
    }
  }
  return { update, clear, checkHealth: () => !active || (targets().length === layers.size && [...layers].every(([node, layer]) => node.isConnected && layer.parentElement === node && node.getAttribute("data-adx-player-glow") === "true")) };
}
