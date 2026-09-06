import { FakeDocument, createFakeWindow } from "./fake-dom.js";

// Structural fixture of the native September 2026 match, without Tools anchors.
export function createModernX01Fixture(options = {}) {
  const documentRef = new FakeDocument();
  Array.from(documentRef.main.children).forEach((node) => node.remove());
  const windowRef = createFakeWindow({ documentRef });
  windowRef.location.pathname = "/matches/modern-match";
  function node(parent, tag, classes = "", text = "") {
    const element = documentRef.createElement(tag);
    element.setAttribute("class", classes);
    element.textContent = text;
    element.__rect = { left: 20, top: 20, width: 100, height: 30 };
    parent.appendChild(element);
    return element;
  }
  const header = node(documentRef.main, "div", "flex flex-wrap top-(--gameplay-bar-height)");
  const variant = node(header, "div", "rounded-full", String(options.base || 121));
  node(header, "div", "rounded-full", "First to 1 Leg");
  node(header, "div", "rounded-full", "SI-DO");
  const card = node(documentRef.main, "div", "relative isolate overflow-clip");
  const marker = node(card, "div", "size-2 rounded-full bg-mono-white");
  const player = node(card, "div", "", "Player 1");
  player.setAttribute("role", "button");
  const score = node(card, "div", "font-number font-bold overflow-hidden", String(options.score ?? 36));
  const cardRoute = node(card, "div", "text-checkout-suggestion", (options.route || ["D18"]).join(" "));
  const turn = node(documentRef.main, "div", "flex bg-surface-surface");
  const slots = node(turn, "div", "flex items-stretch justify-evenly");
  const rows = Array.from({ length: 3 }, () => {
    const row = node(slots, "div", "font-number");
    const placeholder = node(row, "span", "", "");
    placeholder.setAttribute("aria-hidden", "true");
    const label = node(row, "span");
    return { row, label };
  });
  const total = node(turn, "div", "font-number", "85");
  function setVisit(throws = [], route = []) {
    rows.forEach(({ row, label }, index) => {
      row.classList.toggle("cursor-pointer", index < throws.length);
      row.classList.toggle("text-checkout-suggestion", index >= throws.length && index < throws.length + route.length);
      label.textContent = throws[index] || route[index - throws.length] || "";
    });
    cardRoute.textContent = route.join(" ");
  }
  setVisit(options.throws || ["T20", "25"], options.route || ["D18"]);
  const host = node(documentRef.main, "div", "relative");
  const board = node(host, "div", "relative w-full h-full rounded-full overflow-hidden");
  board.setAttribute("role", "img");
  board.setAttribute("aria-label", "Dartboard");
  host.__rect = board.__rect = { left: 718, top: 136, width: 549, height: 549 };
  board.offsetWidth = board.offsetHeight = 549;
  board.offsetLeft = board.offsetTop = 0;
  board.offsetParent = host;
  const layers = Array.from({ length: 4 }, (_, index) => {
    const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", index === 1 || index === 2 ? "0 0 1281.3 1281.3" : "0 0 1000 1000");
    svg.__rect = { ...board.__rect };
    board.appendChild(svg);
    return svg;
  });
  const circle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("r", "500");
  layers[0].appendChild(circle);
  for (let i = 0; i < 80; i += 1) {
    const path = documentRef.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M 0 0 L 20 0 L 0 20 Z");
    layers[0].appendChild(path);
  }
  return { documentRef, windowRef, header, variant, card, marker, player, score, cardRoute,
    turn, slots, rows, total, host, board, layers, setVisit, node };
}
