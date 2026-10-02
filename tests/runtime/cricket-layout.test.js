import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCricketLayoutConfig, resolveCricketLayoutSettings } from "../../src/shared/cricket-layout-config.js";
import { calculateCricketLayout } from "../../src/features/cricket-layout/logic.js";
import { mountCricketLayout } from "../../src/features/cricket-layout/index.js";
import { buildFeatureSettingPatch } from "../../src/features/xconfig-ui/path-utils.js";
import { getFeatureConfigSpec, createRecommendedFeatureConfig } from "../../src/config/feature-config-spec.js";
import { readModernCricketGrid } from "../../src/features/cricket-surface/modern-grid.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { createListenerRegistry } from "../../src/core/listener-registry.js";

function fixture(players = 4, tactics = false, columnMajor = false) {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const grid = documentRef.createElement("div");
  grid.className = "grid h-full";
  grid.getBoundingClientRect = () => ({ width: 600, height: 460, top: 80 });
  documentRef.main.appendChild(grid);
  const add = (parent, text = "", className = "") => {
    const node = documentRef.createElement("div");
    node.textContent = text;
    node.className = className;
    parent.appendChild(node);
    return node;
  };
  add(grid);
  const headers = Array.from({ length: players }, (_, index) => {
    const header = add(grid, "", index === 0 ? "bg-raspberry-slush-diagonal" : "");
    add(header, `Player ${index}`, "font-display");
    add(header, "120", "font-number");
    add(header, "MPR: 2.6");
    return header;
  });
  const targets = Array.from({ length: tactics ? 11 : 6 }, (_, index) => String(20 - index)).concat("B");
  const rows = targets.map((label) => {
    const labelNode = add(grid, label);
    const cells = Array.from({ length: players }, () => {
      const cell = add(grid);
      const mark = documentRef.createElement("img");
      mark.setAttribute("src", "data:image/svg+xml,%3Csvg%3E%3Cline/%3E%3C/svg%3E");
      cell.appendChild(mark);
      return cell;
    });
    return { labelNode, cells };
  });
  if (columnMajor) {
    rows.forEach((row) => grid.appendChild(row.labelNode));
    headers.forEach((header, index) => {
      grid.appendChild(header);
      rows.forEach((row) => grid.appendChild(row.cells[index]));
    });
  }
  const observers = createObserverRegistry();
  const listeners = createListenerRegistry();
  let config = normalizeCricketLayoutConfig({ enabled: true });
  const context = { documentRef, windowRef, domGuards: createDomGuards({ documentRef }), registries: { observers, listeners },
    config: { getFeatureConfig: () => config }, helpers: { createRafScheduler: (callback) => ({ schedule: callback, cancel() {} }) } };
  return { documentRef, windowRef, grid, headers, rows, observers, listeners, context, setConfig: (value) => { config = normalizeCricketLayoutConfig(value); } };
}

test("recommended Cricket effects are calm and opt-in while existing default switches stay compatible", () => {
  const grid = createRecommendedFeatureConfig("cricketGridStatusEffects");
  assert.equal(grid.enabled, false);
  assert.equal(grid.displayProfile, "calm");
  assert.equal(grid.statusStyle, "pattern");
  assert.equal(grid.rowWave, false);
  assert.equal(grid.roundTransitionWipe, false);
  assert.equal(grid.feedback, "impulse");
  const board = createRecommendedFeatureConfig("cricketTargetHighlighter");
  assert.equal(board.enabled, false);
  assert.equal(board.displayProfile, "calm");
  assert.equal(board.statusStyle, "pattern");
  assert.equal(getFeatureConfigSpec("cricketGridStatusEffects").createDefaultConfig().rowWave, true);
});

test("layout presets are opt-in, confined to their card and become custom after an individual edit", () => {
  const spec = getFeatureConfigSpec("cricketLayout");
  assert.equal(spec.createDefaultConfig().enabled, false);
  const patch = buildFeatureSettingPatch("cricketLayout", "profile", "distance");
  assert.deepEqual(Object.keys(patch.features), ["cricketLayout"]);
  const config = normalizeCricketLayoutConfig(patch.features.cricketLayout);
  assert.equal(config.profile, "distance");
  assert.equal(config.markSize, "very-large");
  assert.equal(normalizeCricketLayoutConfig({ ...config, markSize: "original" }).profile, "custom");
  assert.equal(normalizeCricketLayoutConfig({ markSize: "nonsense", activeIndicator: "nonsense" }).markSize, "original");
});

test("Tactics can inherit Cricket or keep a separate profile without changing Cricket", () => {
  const config = normalizeCricketLayoutConfig({ ...buildFeatureSettingPatch("cricketLayout", "tacticsProfile", "distance").features.cricketLayout });
  assert.equal(resolveCricketLayoutSettings(config, true).markSize, "original");
  assert.equal(resolveCricketLayoutSettings({ ...config, tacticsOverrides: true }, true).markSize, "very-large");
  assert.equal(resolveCricketLayoutSettings({ ...config, tacticsOverrides: true }, false).markSize, "original");
});

test("individual edits keep the profile's other sizes and spacing", () => {
  for (const profile of ["distance", "multiplayer"]) {
    const original = normalizeCricketLayoutConfig(buildFeatureSettingPatch("cricketLayout", "profile", profile).features.cricketLayout);
    const custom = normalizeCricketLayoutConfig({ ...original, markSize: "original" });
    const first = calculateCricketLayout({ width: 800, height: 500, settings: original });
    const next = calculateCricketLayout({ width: 800, height: 500, settings: custom });
    assert.equal(next.nameSize, first.nameSize);
    assert.equal(next.scoreSize, first.scoreSize);
    assert.equal(next.gap, first.gap);
  }
});

test("container resize updates fitted sizes and cleanup disconnects its observer", () => {
  const host = fixture(2, true);
  let callback;
  let disconnects = 0;
  host.windowRef.ResizeObserver = class {
    constructor(handler) { callback = handler; }
    observe(node) { assert.equal(node, host.grid); }
    disconnect() { disconnects += 1; }
  };
  let width = 800;
  host.grid.getBoundingClientRect = () => ({ width, height: 460, top: 80 });
  const cleanup = mountCricketLayout(host.context);
  const before = Number.parseFloat(host.grid.style.getPropertyValue("--ad-cricket-name-size"));
  width = 200;
  callback();
  assert.ok(Number.parseFloat(host.grid.style.getPropertyValue("--ad-cricket-name-size")) < before);
  cleanup();
  assert.ok(disconnects > 0);
});

test("Cricket and Tactics sizes stay within available rows and columns for one to six players", () => {
  for (const playerCount of [1, 2, 3, 4, 5, 6]) for (const targetCount of [7, 12]) {
    const geometry = calculateCricketLayout({ width: 420, height: 320, playerCount, targetCount, settings: { markSize: "very-large", targetSize: "very-large" } });
    assert.ok(geometry.markSize <= geometry.rowHeight);
    assert.ok(geometry.targetSize <= geometry.rowHeight);
    assert.ok(geometry.headerHeight + targetCount * geometry.rowHeight + targetCount * geometry.gap <= 320.001);
  }
});

test("layout preserves native order, mark sources and player ownership in both native grid arrangements", () => {
  for (const tactics of [false, true]) for (const columnMajor of [false, true]) {
    const host = fixture(4, tactics, columnMajor);
    const originalChildren = [...host.grid.children];
    const originalSrc = host.rows[0].cells[0].firstChild.getAttribute("src");
    const cleanup = mountCricketLayout(host.context);
    assert.deepEqual([...host.grid.children], originalChildren);
    assert.equal(readModernCricketGrid(host.documentRef).headers.length, 4);
    assert.equal(host.rows[0].cells[0].firstChild.getAttribute("src"), originalSrc);
    assert.equal(host.rows.at(-1).labelNode.style.getPropertyValue("--ad-cricket-row"), String(tactics ? 13 : 8));
    assert.equal(host.headers[0].getAttribute("data-ad-cricket-active"), "true");
    host.headers[0].classList.remove("bg-raspberry-slush-diagonal");
    host.headers[2].classList.add("bg-raspberry-slush-diagonal");
    host.observers.get("cricket-layout:dom-observer").callback([{ target: host.headers[2], type: "attributes", attributeName: "class" }]);
    assert.equal(host.headers[0].getAttribute("data-ad-cricket-active"), "false");
    assert.equal(host.headers[2].getAttribute("data-ad-cricket-active"), "true");
    assert.deepEqual([...host.grid.children], originalChildren);
    cleanup();
    assert.equal(host.grid.getAttribute("data-ad-cricket-layout"), null);
    assert.equal(host.rows[0].cells[0].style.getPropertyValue("--ad-cricket-row"), "");
    assert.equal(host.observers.get("cricket-layout:dom-observer"), null);
  }
});

test("ambiguous active headers remain unmarked, and cleanup preserves concurrent host changes", () => {
  const host = fixture();
  host.headers[1].classList.add("bg-raspberry-slush-diagonal");
  host.grid.style.setProperty("--ad-cricket-target-size", "19px");
  const cleanup = mountCricketLayout(host.context);
  assert.ok(host.headers.every((header) => header.getAttribute("data-ad-cricket-active") === "false"));
  host.grid.style.setProperty("--ad-cricket-target-size", "21px");
  cleanup();
  assert.equal(host.grid.style.getPropertyValue("--ad-cricket-target-size"), "21px");
});

test("replaced native grids are decorated and detached nodes are restored", () => {
  const host = fixture();
  const cleanup = mountCricketLayout(host.context);
  const originalHeader = host.headers[0];
  const replacement = host.documentRef.createElement("div");
  replacement.className = "bg-raspberry-slush-diagonal";
  const name = host.documentRef.createElement("div");
  name.className = "font-display";
  name.textContent = "Replacement";
  replacement.appendChild(name);
  host.grid.insertBefore(replacement, originalHeader);
  originalHeader.remove();
  host.observers.get("cricket-layout:dom-observer").callback([{ target: host.grid, type: "childList", addedNodes: [replacement], removedNodes: [originalHeader] }]);
  assert.equal(originalHeader.getAttribute("data-ad-cricket-layout-node"), null);
  assert.equal(replacement.getAttribute("data-ad-cricket-layout-node"), "header");
  cleanup();
});

test("nested MPR values are treated as one statistic and never resized as score values", () => {
  const host = fixture();
  const header = host.headers[0];
  header.children.at(-1).remove();
  const statistic = host.documentRef.createElement("div");
  const label = host.documentRef.createElement("span");
  label.textContent = "MPR: ";
  const value = host.documentRef.createElement("span");
  value.className = "font-number";
  value.textContent = "2.6";
  statistic.appendChild(label);
  statistic.appendChild(value);
  Object.defineProperty(statistic, "textContent", { get: () => label.textContent + value.textContent });
  header.appendChild(statistic);
  host.setConfig({ enabled: true, mpr: "off" });
  const cleanup = mountCricketLayout(host.context);
  assert.equal(statistic.getAttribute("data-ad-cricket-mpr-value"), "true");
  assert.equal(value.getAttribute("data-ad-cricket-score"), null);
  assert.equal(header.querySelector(".font-number").getAttribute("data-ad-cricket-score"), "true");
  cleanup();
  assert.equal(statistic.getAttribute("data-ad-cricket-mpr-value"), null);
});

test("MPR labels accept native spacing and optional colons while rejecting malformed long labels", () => {
  const labels = ["MPR", "MPR2.6", "MPR 2.6", "MPR: 2.6", "mpr : 2,6", `MPR${" ".repeat(10_000)}x`, "MPR: 2.6 points"];
  for (const [index, text] of labels.entries()) {
    const host = fixture(1);
    const statistic = host.headers[0].children.at(-1);
    statistic.textContent = text;
    const cleanup = mountCricketLayout(host.context);
    assert.equal(statistic.getAttribute("data-ad-cricket-mpr-value"), index < 5 ? "true" : null, text.slice(0, 30));
    assert.equal(host.headers[0].querySelector(".font-number").getAttribute("data-ad-cricket-score"), "true");
    cleanup();
  }
});

test("native score and unlabeled statistic badges remain separate, with statistics hidden independently", () => {
  const host = fixture(2, true);
  const header = host.headers[0];
  header.children.at(-1).remove();
  header.querySelector(".font-number").remove();
  const scoreLine = host.documentRef.createElement("div");
  scoreLine.className = "flex items-center gap-1.5";
  const points = host.documentRef.createElement("span");
  points.className = "font-number font-bold";
  points.textContent = "120";
  scoreLine.appendChild(points);
  const statistics = host.documentRef.createElement("div");
  statistics.className = "flex flex-col items-center justify-center gap-0.5";
  const badge = host.documentRef.createElement("div");
  badge.className = "rounded-sm size-8";
  const statistic = host.documentRef.createElement("span");
  statistic.className = "font-number text-2xl";
  statistic.textContent = "2.6";
  badge.appendChild(statistic);
  statistics.appendChild(badge);
  scoreLine.appendChild(statistics);
  header.appendChild(scoreLine);
  host.setConfig({ enabled: true, mpr: "off" });
  const cleanup = mountCricketLayout(host.context);
  assert.equal(points.getAttribute("data-ad-cricket-score"), "true");
  assert.notEqual(statistic.getAttribute("data-ad-cricket-score"), "true");
  assert.equal(statistics.getAttribute("data-ad-cricket-mpr-value"), "true");
  assert.equal(host.grid.getAttribute("data-ad-cricket-mpr"), "off");
  assert.equal(statistic.textContent, "2.6");
  cleanup();
  assert.equal(statistics.getAttribute("data-ad-cricket-mpr-value"), null);
  assert.equal(points.getAttribute("data-ad-cricket-score"), null);
});

test("two-line names resize their native nameplate and shape without changing native content", () => {
  const host = fixture();
  const header = host.headers[0];
  const name = header.querySelector(".font-display");
  const group = host.documentRef.createElement("div");
  const plate = host.documentRef.createElement("div");
  plate.className = "flex items-center h-8";
  plate.appendChild(name);
  const shape = host.documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  shape.setAttribute("data-slot", "nametag-shape");
  group.appendChild(plate);
  group.appendChild(shape);
  header.appendChild(group);
  const cleanup = mountCricketLayout(host.context);
  assert.equal(plate.getAttribute("data-ad-cricket-nameplate"), "true");
  assert.equal(shape.getAttribute("data-ad-cricket-nameplate-shape"), "true");
  const fontSize = Number.parseFloat(host.grid.style.getPropertyValue("--ad-cricket-name-size"));
  const plateHeight = Number.parseFloat(host.grid.style.getPropertyValue("--ad-cricket-nameplate-height"));
  assert.ok(plateHeight >= fontSize * 2 * 1.15);
  assert.equal(shape.parentElement, group);
  assert.equal(name.parentElement, plate);
  cleanup();
  assert.equal(plate.getAttribute("data-ad-cricket-nameplate"), null);
  assert.equal(shape.getAttribute("data-ad-cricket-nameplate-shape"), null);
});

test("table and board space changes preserve native board and grid node identity", () => {
  const host = fixture();
  const stage = host.documentRef.createElement("div");
  stage.getBoundingClientRect = () => ({ width: 1000, height: 460 });
  host.documentRef.main.appendChild(stage);
  stage.appendChild(host.grid);
  const board = host.documentRef.createElement("div");
  board.setAttribute("role", "img");
  board.setAttribute("aria-label", "Dartboard");
  const svg = host.documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  const group = host.documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  const circle = host.documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("r", "500");
  group.appendChild(circle);
  for (let number = 1; number <= 20; number += 1) {
    const label = host.documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    label.textContent = String(number);
    group.appendChild(label);
  }
  svg.appendChild(group);
  board.appendChild(svg);
  stage.appendChild(board);
  const children = [...stage.children];
  host.setConfig({ enabled: true, space: "table" });
  const cleanup = mountCricketLayout(host.context);
  assert.equal(stage.getAttribute("data-ad-cricket-layout-stage"), "true");
  assert.equal(Number.parseFloat(stage.style.getPropertyValue("--ad-cricket-table-share")), 67);
  assert.deepEqual([...stage.children], children);
  assert.equal(board.firstChild, svg);
  assert.equal(svg.getAttribute("viewBox"), "0 0 1000 1000");
  host.setConfig({ enabled: true, space: "board" });
  host.windowRef.dispatchEvent({ type: "resize" });
  assert.equal(Number.parseFloat(stage.style.getPropertyValue("--ad-cricket-table-share")), 43);
  cleanup();
  assert.equal(stage.getAttribute("data-ad-cricket-layout-stage"), null);
  assert.equal(stage.style.getPropertyValue("--ad-cricket-table-share"), "");
  assert.deepEqual([...stage.children], children);
});
