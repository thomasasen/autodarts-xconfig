import test from "node:test";
import assert from "node:assert/strict";

import { createBootstrap } from "../../src/core/bootstrap.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createThemeConfig(themeConfigKey, themeFeatureConfig = {}) {
  const themeName = String(themeConfigKey || "").trim();
  return {
    featureToggles: {
      checkoutScorePulse: false,
      [`themes.${themeName}`]: true,
    },
    features: {
      checkoutScorePulse: {
        enabled: false,
      },
      themes: {
        [themeName]: {
          enabled: true,
          ...themeFeatureConfig,
        },
      },
    },
  };
}

function attachCricketGridLayout(documentRef) {
  const screen = documentRef.createElement("div");
  screen.classList.add("css-tkevr6");

  const grid = documentRef.createElement("div");
  grid.classList.add("chakra-stack");
  screen.appendChild(grid);

  const header = documentRef.createElement("div");
  header.classList.add("chakra-wrap", "css-0");
  grid.appendChild(header);

  const footerSlot = documentRef.createElement("div");
  footerSlot.classList.add("slot-footer");
  if (documentRef.turnContainer.parentNode) {
    documentRef.turnContainer.parentNode.removeChild(documentRef.turnContainer);
  }
  footerSlot.appendChild(documentRef.turnContainer);
  grid.appendChild(footerSlot);

  const playersSlot = documentRef.createElement("div");
  playersSlot.classList.add("slot-players");
  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  const activePlayer = documentRef.createElement("div");
  activePlayer.classList.add("ad-ext-player", "ad-ext-player-active");
  playerDisplay.appendChild(activePlayer);
  playersSlot.appendChild(playerDisplay);
  grid.appendChild(playersSlot);

  const boardSlot = documentRef.createElement("div");
  boardSlot.classList.add("slot-board");
  const boardOuter = documentRef.createElement("div");
  const boardInner = documentRef.createElement("div");
  boardInner.classList.add("css-tqsk66");
  const boardSvg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  boardSvg.setAttribute("viewBox", "0 0 1000 1000");

  for (let value = 1; value <= 20; value += 1) {
    const numberNode = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    numberNode.textContent = String(value);
    boardSvg.appendChild(numberNode);
  }

  const circle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("r", "340");
  boardSvg.appendChild(circle);

  boardInner.appendChild(boardSvg);
  boardOuter.appendChild(boardInner);
  boardSlot.appendChild(boardOuter);
  grid.appendChild(boardSlot);

  documentRef.main.appendChild(screen);
  return { grid, footerSlot, playersSlot, boardSlot };
}

test("theme-cricket assigns and cleans stable layout slots on direct grid children", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "Cricket";
  const layout = attachCricketGridLayout(documentRef);
  const windowRef = createFakeWindow({ documentRef });
  const runtime = createBootstrap({
    windowRef,
    documentRef,
    config: createThemeConfig("cricket", {
      showAvg: true,
    }),
  });

  runtime.start();
  runtime.start();
  await wait(5);

  assert.equal(layout.grid.getAttribute("data-ad-theme-layout-root"), "true");
  assert.equal(
    layout.grid.getAttribute("data-ad-theme-layout-root-owner"),
    "theme-cricket"
  );
  assert.equal(layout.footerSlot.getAttribute("data-ad-theme-slot"), "footer");
  assert.equal(layout.playersSlot.getAttribute("data-ad-theme-slot"), "players");
  assert.equal(layout.boardSlot.getAttribute("data-ad-theme-slot"), "board");
  assert.equal(layout.boardSlot.getAttribute("data-ad-theme-slot-owner"), "theme-cricket");

  runtime.stop();

  assert.equal(layout.grid.getAttribute("data-ad-theme-layout-root"), null);
  assert.equal(layout.footerSlot.getAttribute("data-ad-theme-slot"), null);
  assert.equal(layout.playersSlot.getAttribute("data-ad-theme-slot"), null);
  assert.equal(layout.boardSlot.getAttribute("data-ad-theme-slot"), null);
  assert.equal(documentRef.querySelectorAll("[data-ad-theme-slot]").length, 0);
});

