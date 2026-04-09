import test from "node:test";
import assert from "node:assert/strict";

import { FakeDocument } from "./fake-dom.js";

test("fake dom keeps className-driven cricket host selectors queryable", () => {
  const documentRef = new FakeDocument();

  const wrapper = documentRef.createElement("div");
  wrapper.className = "chakra-stack animate__animated animate__fadeIn css-1k7iu8k";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  playerDisplay.className = "chakra-stack hideAnimations css-10vxar2";

  const activeCard = documentRef.createElement("div");
  activeCard.className = "ad-ext-player ad-ext-player-active css-1en42kf";
  playerDisplay.appendChild(activeCard);

  const objectiveStrip = documentRef.createElement("div");
  objectiveStrip.className = "css-1f26ant";
  const labelCell = documentRef.createElement("div");
  labelCell.className = "css-1yso2z2";
  objectiveStrip.appendChild(labelCell);

  const boardShell = documentRef.createElement("div");
  boardShell.className = "showAnimations css-1cdcn26";
  const boardInner = documentRef.createElement("div");
  boardInner.className = "css-1nz0cmz";
  const boardSvg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  boardInner.appendChild(boardSvg);
  boardShell.appendChild(boardInner);

  wrapper.appendChild(playerDisplay);
  wrapper.appendChild(objectiveStrip);
  wrapper.appendChild(boardShell);
  documentRef.main.appendChild(wrapper);

  assert.equal(documentRef.querySelector(".css-1k7iu8k"), wrapper);
  assert.equal(documentRef.querySelector("#ad-ext-player-display .ad-ext-player-active"), activeCard);
  assert.equal(documentRef.querySelector(".css-1f26ant .css-1yso2z2"), labelCell);
  assert.equal(boardSvg.closest(".showAnimations"), boardShell);
  assert.equal(activeCard.matches(".ad-ext-player.ad-ext-player-active"), true);
  assert.equal(boardShell.getAttribute("class"), "showAnimations css-1cdcn26");
});

test("fake dom supports tactics host strips that hang off the player display without row data attributes", () => {
  const documentRef = new FakeDocument();

  documentRef.variantElement.textContent = "Tactics";
  documentRef.variantElement.className = "css-bs3vp6";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  playerDisplay.className = "chakra-stack hideAnimations css-10vxar2";

  const activeCard = documentRef.createElement("div");
  activeCard.className = "ad-ext-player ad-ext-player-active css-1en42kf";
  playerDisplay.appendChild(activeCard);

  const objectiveStrip = documentRef.createElement("div");
  objectiveStrip.className = "css-x15t8m";
  ["20", "19", "18", "17", "16", "15", "14", "13", "12", "11", "10", "Bull"].forEach(
    (label, index) => {
      const className = index % 2 === 0 ? "css-1yso2z2" : "css-jpb1ox";
      const labelCell = documentRef.createElement("div");
      labelCell.className = className;
      const labelText = documentRef.createElement("p");
      labelText.className = "chakra-text";
      labelText.textContent = label;
      labelCell.appendChild(labelText);

      const playerOneCell = documentRef.createElement("div");
      playerOneCell.className = className;
      const playerTwoCell = documentRef.createElement("div");
      playerTwoCell.className = className;

      objectiveStrip.appendChild(labelCell);
      objectiveStrip.appendChild(playerOneCell);
      objectiveStrip.appendChild(playerTwoCell);
    }
  );

  const boardShell = documentRef.createElement("div");
  boardShell.className = "showAnimations css-1cdcn26";
  const boardInner = documentRef.createElement("div");
  boardInner.className = "css-1nz0cmz";
  const boardSvg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  boardInner.appendChild(boardSvg);
  boardShell.appendChild(boardInner);

  documentRef.main.appendChild(playerDisplay);
  documentRef.main.appendChild(objectiveStrip);
  documentRef.main.appendChild(boardShell);

  assert.equal(documentRef.getElementById("ad-ext-game-variant")?.textContent, "Tactics");
  assert.equal(playerDisplay.nextElementSibling, objectiveStrip);
  assert.equal(objectiveStrip.children.length, 36);
  assert.deepEqual(
    Array.from(objectiveStrip.children)
      .filter((_, index) => index % 3 === 0)
      .map((node) => node.firstElementChild?.textContent || ""),
    ["20", "19", "18", "17", "16", "15", "14", "13", "12", "11", "10", "Bull"]
  );
  assert.equal(documentRef.querySelector(".css-x15t8m .css-jpb1ox"), objectiveStrip.children[3]);
  assert.equal(boardSvg.closest(".showAnimations"), boardShell);
});

test("fake dom supports shared shanghai host selectors for player, turn, and board surfaces", () => {
  const documentRef = new FakeDocument();

  documentRef.variantElement.textContent = "Shanghai";
  documentRef.variantElement.className = "css-1oc5e4d";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  playerDisplay.className = "chakra-stack hideAnimations css-10vxar2";

  const activeCard = documentRef.createElement("div");
  activeCard.className = "ad-ext-player ad-ext-player-active css-1en42kf";
  const inactiveCard = documentRef.createElement("div");
  inactiveCard.className = "ad-ext-player ad-ext-player-inactive css-1en42kf";
  playerDisplay.appendChild(activeCard);
  playerDisplay.appendChild(inactiveCard);

  const turnContainer = documentRef.turnContainer;
  turnContainer.className = "chakra-stack css-1emway5";
  turnContainer.replaceChildren();

  const pointsFrame = documentRef.createElement("div");
  pointsFrame.className = "css-rrf7rv";
  const pointsText = documentRef.createElement("p");
  pointsText.textContent = "0";
  pointsFrame.appendChild(pointsText);

  const firstThrow = documentRef.createElement("div");
  firstThrow.className = "ad-ext-turn-throw css-1p5spmi";
  firstThrow.textContent = "1S1";
  const secondThrow = documentRef.createElement("div");
  secondThrow.className = "ad-ext-turn-throw css-1p5spmi";
  secondThrow.textContent = "18S18";

  const scorePreview = documentRef.createElement("div");
  scorePreview.className = "score css-156dsds";

  turnContainer.appendChild(pointsFrame);
  turnContainer.appendChild(firstThrow);
  turnContainer.appendChild(secondThrow);
  turnContainer.appendChild(scorePreview);

  const boardShell = documentRef.createElement("div");
  boardShell.className = "showAnimations css-1cdcn26";
  const boardInner = documentRef.createElement("div");
  boardInner.className = "css-aiihgx";
  const boardSvg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  boardInner.appendChild(boardSvg);
  boardShell.appendChild(boardInner);

  documentRef.main.appendChild(playerDisplay);
  documentRef.main.appendChild(turnContainer);
  documentRef.main.appendChild(boardShell);

  assert.equal(documentRef.getElementById("ad-ext-game-variant")?.textContent, "Shanghai");
  assert.equal(playerDisplay.nextElementSibling, turnContainer);
  assert.equal(documentRef.querySelector("#ad-ext-player-display .ad-ext-player-active"), activeCard);
  assert.equal(documentRef.querySelector("#ad-ext-turn .ad-ext-turn-throw"), firstThrow);
  assert.equal(documentRef.querySelector("#ad-ext-turn .score"), scorePreview);
  assert.equal(boardSvg.closest(".showAnimations"), boardShell);
  assert.equal(documentRef.querySelector(".showAnimations .css-aiihgx"), boardInner);
});

test("fake dom supports bull-off host surfaces that keep an empty throw strip beside the live board", () => {
  const documentRef = new FakeDocument();

  documentRef.variantElement.textContent = "Bull-off";
  documentRef.variantElement.className = "css-1oc5e4d";

  const playerDisplay = documentRef.createElement("div");
  playerDisplay.id = "ad-ext-player-display";
  playerDisplay.className = "chakra-stack hideAnimations css-10vxar2";

  const activeCard = documentRef.createElement("div");
  activeCard.className = "ad-ext-player ad-ext-player-active css-1en42kf";
  const inactiveCard = documentRef.createElement("div");
  inactiveCard.className = "ad-ext-player ad-ext-player-inactive css-1en42kf";
  playerDisplay.appendChild(activeCard);
  playerDisplay.appendChild(inactiveCard);

  const turnContainer = documentRef.turnContainer;
  turnContainer.className = "chakra-stack css-1emway5";
  turnContainer.replaceChildren();

  const scorePreview = documentRef.createElement("div");
  scorePreview.className = "score css-156dsds";
  turnContainer.appendChild(scorePreview);

  const boardShell = documentRef.createElement("div");
  boardShell.className = "showAnimations css-1cdcn26";
  const boardInner = documentRef.createElement("div");
  boardInner.className = "css-79elbk";
  const boardImage = documentRef.createElement("img");
  const boardSvg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  boardInner.appendChild(boardImage);
  boardInner.appendChild(boardSvg);
  boardShell.appendChild(boardInner);

  documentRef.main.appendChild(playerDisplay);
  documentRef.main.appendChild(turnContainer);
  documentRef.main.appendChild(boardShell);

  assert.equal(documentRef.getElementById("ad-ext-game-variant")?.textContent, "Bull-off");
  assert.equal(playerDisplay.nextElementSibling, turnContainer);
  assert.equal(documentRef.querySelector("#ad-ext-player-display .ad-ext-player-active"), activeCard);
  assert.equal(documentRef.querySelectorAll("#ad-ext-turn .ad-ext-turn-throw").length, 0);
  assert.equal(documentRef.querySelector("#ad-ext-turn .score"), scorePreview);
  assert.equal(boardSvg.closest(".showAnimations"), boardShell);
  assert.equal(documentRef.querySelector(".showAnimations .css-79elbk"), boardInner);
});
