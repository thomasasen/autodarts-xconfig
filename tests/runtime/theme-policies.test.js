import test from "node:test";
import assert from "node:assert/strict";

import { mountThemeFeature } from "../../src/features/themes/shared/mount-theme-feature.js";
import { resolveThemePolicy } from "../../src/features/themes/shared/theme-policies.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";
import {
  X01_TWO_PLAYER_ACTIVE_ATTRIBUTE,
  X01_TWO_PLAYER_ACTIVE_EMPHASIS_ATTRIBUTE,
  X01_TWO_PLAYER_COLOR_SCHEME_ATTRIBUTE,
  X01_TWO_PLAYER_IDENTITY_DENSITY_ATTRIBUTE,
  X01_TWO_PLAYER_INFORMATION_DENSITY_ATTRIBUTE,
  X01_TWO_PLAYER_NAME_LAYOUT_ATTRIBUTE,
  X01_TWO_PLAYER_SLOT_ATTRIBUTE,
  X01_TWO_PLAYER_STACK_ATTRIBUTE,
  X01_TWO_PLAYER_VISUAL_STYLE_ATTRIBUTE,
} from "../../src/features/themes/x01-2player/layout-contract.js";
import {
  X01_TWO_PLAYER_CURRENT_REMAINING_ATTRIBUTE,
  X01_TWO_PLAYER_STALE_REMAINING_ATTRIBUTE,
  X01_TWO_PLAYER_STALE_REMAINING_CLASS,
  deriveX01TwoPlayerScoreboardRowState,
} from "../../src/features/themes/x01-2player/scoreboard-state.js";
import {
  PLAYER_CARD_PART_ATTRIBUTE,
  PLAYER_CARD_PARTS,
  markPlayerCardParts,
} from "../../src/features/shared/player-card-parts.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createX01TwoPlayerCard(documentRef, score, name) {
  const wrapperNode = documentRef.createElement("div");
  const cardNode = documentRef.createElement("div");
  cardNode.classList.add("ad-ext-player");

  const stackNode = documentRef.createElement("div");
  stackNode.classList.add("chakra-stack");

  const identityNode = documentRef.createElement("div");
  identityNode.classList.add("chakra-stack");
  identityNode.appendChild(documentRef.createElement("div"));

  const metaNode = documentRef.createElement("div");
  const metaSpan = documentRef.createElement("span");
  const nameNode = documentRef.createElement("p");
  nameNode.classList.add("ad-ext-player-name");
  nameNode.textContent = name;
  const statRow = documentRef.createElement("div");
  const statText = documentRef.createElement("p");
  statText.classList.add("css-1j0bqop");
  statText.textContent = "AVG 50";
  statRow.appendChild(statText);
  metaSpan.appendChild(nameNode);
  metaSpan.appendChild(statRow);
  metaNode.appendChild(metaSpan);
  identityNode.appendChild(metaNode);

  const scoreNode = documentRef.createElement("p");
  scoreNode.classList.add("ad-ext-player-score");
  scoreNode.textContent = String(score);

  const tableSlot = documentRef.createElement("div");
  const tableShell = documentRef.createElement("div");
  const tableNode = documentRef.createElement("table");
  const rowNode = documentRef.createElement("tr");
  const cellNode = documentRef.createElement("td");
  cellNode.textContent = "140";
  rowNode.appendChild(cellNode);
  tableNode.appendChild(rowNode);
  tableShell.appendChild(tableNode);
  tableSlot.appendChild(tableShell);

  stackNode.appendChild(identityNode);
  stackNode.appendChild(scoreNode);
  cardNode.appendChild(stackNode);
  cardNode.appendChild(tableSlot);
  wrapperNode.appendChild(cardNode);

  return {
    wrapperNode,
    cardNode,
    stackNode,
    identityNode,
    scoreNode,
    tableSlot,
  };
}

function createSharedPlayerCardWithAvatarName(documentRef, options = {}) {
  const cardNode = documentRef.createElement("div");
  cardNode.classList.add("ad-ext-player");

  const avatarNode = documentRef.createElement("div");
  avatarNode.classList.add("chakra-avatar");
  const avatarImageNode = documentRef.createElement("img");
  avatarImageNode.classList.add("chakra-avatar__img");
  avatarImageNode.setAttribute("alt", options.avatarAlt || "");
  avatarNode.appendChild(avatarImageNode);

  const nameNode = documentRef.createElement("span");
  nameNode.classList.add("ad-ext-player-name");
  const nameTextNode = documentRef.createElement("p");
  nameTextNode.textContent = options.visibleName || "";
  nameNode.appendChild(nameTextNode);

  cardNode.appendChild(avatarNode);
  cardNode.appendChild(nameNode);

  return {
    avatarImageNode,
    cardNode,
    nameNode,
    nameTextNode,
  };
}

function replaceScoreboardRows(documentRef, player, rows) {
  const tableNode = player.tableSlot.querySelector("table");
  tableNode.replaceChildren();

  rows.forEach(([scoreText, remainingText]) => {
    const rowNode = documentRef.createElement("tr");
    const scoreCell = documentRef.createElement("td");
    const remainingCell = documentRef.createElement("td");
    scoreCell.textContent = scoreText;
    remainingCell.textContent = remainingText;
    rowNode.appendChild(scoreCell);
    rowNode.appendChild(remainingCell);
    tableNode.appendChild(rowNode);
  });

  return tableNode;
}

function getScoreboardCells(tableNode) {
  return Array.from(tableNode.querySelectorAll("tr")).map((rowNode) => {
    const cells = Array.from(rowNode.children);
    return {
      scoreCell: cells[0],
      remainingCell: cells[1],
    };
  });
}

test("resolveThemePolicy returns specialized policies for cricket and x01 2player only", () => {
  const cricketPolicy = resolveThemePolicy({
    featureKey: "theme-cricket",
  });
  const x01TwoPlayerPolicy = resolveThemePolicy({
    featureKey: "theme-x01-2player",
  });

  assert.ok(cricketPolicy);
  assert.ok(x01TwoPlayerPolicy);
  assert.equal(typeof cricketPolicy.createState, "function");
  assert.equal(typeof cricketPolicy.getManagedNodeIds, "function");
  assert.equal(typeof cricketPolicy.getManagedClassNames, "function");
  assert.equal(typeof cricketPolicy.getObservedAttributeFilter, "function");
  assert.equal(typeof cricketPolicy.shouldScheduleMutation, "function");
  assert.equal(typeof cricketPolicy.onActivate, "function");
  assert.equal(typeof cricketPolicy.onDeactivate, "function");
  assert.equal(typeof x01TwoPlayerPolicy.createState, "function");
  assert.equal(typeof x01TwoPlayerPolicy.getObservedAttributeFilter, "function");
  assert.equal(typeof x01TwoPlayerPolicy.shouldScheduleMutation, "function");
  assert.equal(typeof x01TwoPlayerPolicy.onActivate, "function");
  assert.equal(typeof x01TwoPlayerPolicy.onDeactivate, "function");
  assert.deepEqual(cricketPolicy.getManagedNodeIds(), [
    "ad-ext-theme-cricket-readability-notice",
  ]);
  assert.deepEqual(
    cricketPolicy.getManagedClassNames().sort((left, right) => left.localeCompare(right)),
    [
      "ad-ext-theme-cricket-readability-notice",
      "ad-ext-theme-cricket-readability-text",
      "ad-ext-theme-cricket-readability-toggle",
    ].sort((left, right) => left.localeCompare(right))
  );
  assert.deepEqual(cricketPolicy.getObservedAttributeFilter(), ["class"]);
  assert.equal(resolveThemePolicy({ featureKey: "theme-x01" }), null);
});

test("markPlayerCardParts restores truncated player names from avatar metadata", () => {
  const documentRef = new FakeDocument();
  const { cardNode, nameNode, nameTextNode } = createSharedPlayerCardWithAvatarName(documentRef, {
    visibleName: "TORNADO TO..",
    avatarAlt: "tornado tom",
  });

  markPlayerCardParts(cardNode);

  assert.equal(nameTextNode.textContent, "TORNADO TOM");
  assert.equal(nameNode.getAttribute("title"), "TORNADO TOM");
  assert.equal(nameTextNode.getAttribute("title"), "TORNADO TOM");
});

test("markPlayerCardParts keeps non-truncated player names unchanged", () => {
  const documentRef = new FakeDocument();
  const { cardNode, nameNode, nameTextNode } = createSharedPlayerCardWithAvatarName(documentRef, {
    visibleName: "TORNADO TOM",
    avatarAlt: "different player",
  });

  markPlayerCardParts(cardNode);

  assert.equal(nameTextNode.textContent, "TORNADO TOM");
  assert.equal(nameNode.getAttribute("title"), null);
});

test("theme-x01-2player policy marks active cards and semantic slots without restructuring DOM", () => {
  const documentRef = new FakeDocument();
  const playerDisplayNode = documentRef.createElement("div");
  playerDisplayNode.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplayNode);

  const firstPlayer = createX01TwoPlayerCard(documentRef, 301, "A");
  const secondPlayer = createX01TwoPlayerCard(documentRef, 170, "B");
  firstPlayer.cardNode.classList.add("ad-ext-player-active");
  playerDisplayNode.appendChild(firstPlayer.wrapperNode);
  playerDisplayNode.appendChild(secondPlayer.wrapperNode);

  const policy = resolveThemePolicy({ featureKey: "theme-x01-2player" });
  const themeState = policy.createState();
  policy.onActivate({
    documentRef,
    featureConfig: {
      visualStyle: "broadcast",
      colorScheme: "amber",
      activePlayerEmphasis: "strong",
      informationDensity: "tv",
      identityDensity: "name-only",
      playerNameLayout: "two-lines",
    },
    gameState: {
      getActivePlayerIndex() {
        return 1;
      },
    },
    themeState,
  });

  assert.equal(firstPlayer.cardNode.getAttribute(X01_TWO_PLAYER_ACTIVE_ATTRIBUTE), "false");
  assert.equal(secondPlayer.cardNode.getAttribute(X01_TWO_PLAYER_ACTIVE_ATTRIBUTE), "true");
  assert.equal(firstPlayer.stackNode.getAttribute(X01_TWO_PLAYER_STACK_ATTRIBUTE), "true");
  assert.equal(secondPlayer.stackNode.getAttribute(X01_TWO_PLAYER_STACK_ATTRIBUTE), "true");
  assert.equal(firstPlayer.identityNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), "identity");
  assert.equal(firstPlayer.scoreNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), "score");
  assert.equal(firstPlayer.tableSlot.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), "table");
  assert.equal(documentRef.documentElement.getAttribute(X01_TWO_PLAYER_VISUAL_STYLE_ATTRIBUTE), "broadcast");
  assert.equal(documentRef.documentElement.getAttribute(X01_TWO_PLAYER_COLOR_SCHEME_ATTRIBUTE), "amber");
  assert.equal(documentRef.documentElement.getAttribute(X01_TWO_PLAYER_ACTIVE_EMPHASIS_ATTRIBUTE), "strong");
  assert.equal(documentRef.documentElement.getAttribute(X01_TWO_PLAYER_INFORMATION_DENSITY_ATTRIBUTE), "tv");
  assert.equal(documentRef.documentElement.getAttribute(X01_TWO_PLAYER_IDENTITY_DENSITY_ATTRIBUTE), "name-only");
  assert.equal(documentRef.documentElement.getAttribute(X01_TWO_PLAYER_NAME_LAYOUT_ATTRIBUTE), "two-lines");

  policy.onDeactivate({
    documentRef,
    themeState,
  });

  assert.equal(firstPlayer.cardNode.getAttribute(X01_TWO_PLAYER_ACTIVE_ATTRIBUTE), null);
  assert.equal(firstPlayer.stackNode.getAttribute(X01_TWO_PLAYER_STACK_ATTRIBUTE), null);
  assert.equal(firstPlayer.identityNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), null);
  assert.equal(firstPlayer.scoreNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), null);
  assert.equal(firstPlayer.tableSlot.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), null);
  assert.equal(documentRef.documentElement.getAttribute(X01_TWO_PLAYER_VISUAL_STYLE_ATTRIBUTE), null);
  assert.equal(documentRef.documentElement.getAttribute(X01_TWO_PLAYER_COLOR_SCHEME_ATTRIBUTE), null);
  assert.equal(documentRef.documentElement.getAttribute(X01_TWO_PLAYER_ACTIVE_EMPHASIS_ATTRIBUTE), null);
  assert.equal(documentRef.documentElement.getAttribute(X01_TWO_PLAYER_INFORMATION_DENSITY_ATTRIBUTE), null);
  assert.equal(documentRef.documentElement.getAttribute(X01_TWO_PLAYER_IDENTITY_DENSITY_ATTRIBUTE), null);
  assert.equal(documentRef.documentElement.getAttribute(X01_TWO_PLAYER_NAME_LAYOUT_ATTRIBUTE), null);
});

test("theme-x01-2player policy separates round and profile badges in online player markup", () => {
  const documentRef = new FakeDocument();
  const playerDisplayNode = documentRef.createElement("div");
  playerDisplayNode.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplayNode);

  const player = createX01TwoPlayerCard(documentRef, 301, "ONLINE PLAYER");
  const identityRow = player.identityNode;
  const roundHost = documentRef.createElement("div");
  roundHost.classList.add("css-1k3nd6z");
  const roundBadge = documentRef.createElement("span");
  roundBadge.classList.add("css-3fr5p8");
  roundBadge.textContent = "0";
  roundHost.appendChild(roundBadge);
  identityRow.appendChild(roundHost);

  const nameNode = identityRow.querySelector(".ad-ext-player-name");
  const profileBadge = documentRef.createElement("span");
  profileBadge.classList.add("chakra-badge", "css-n2903v");
  profileBadge.textContent = "35+";
  nameNode.parentNode.appendChild(profileBadge);
  playerDisplayNode.appendChild(player.wrapperNode);

  const policy = resolveThemePolicy({ featureKey: "theme-x01-2player" });
  policy.onActivate({
    documentRef,
    gameState: {
      getActivePlayerIndex() {
        return 0;
      },
    },
    themeState: policy.createState(),
  });

  assert.equal(
    roundBadge.getAttribute(PLAYER_CARD_PART_ATTRIBUTE),
    PLAYER_CARD_PARTS.roundBadge
  );
  assert.equal(
    profileBadge.getAttribute(PLAYER_CARD_PART_ATTRIBUTE),
    PLAYER_CARD_PARTS.profileBadge
  );
});

test("theme-x01-2player policy marks nested online score and media fields", () => {
  const documentRef = new FakeDocument();
  const playerDisplayNode = documentRef.createElement("div");
  playerDisplayNode.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplayNode);

  const wrapperNode = documentRef.createElement("div");
  const cardNode = documentRef.createElement("div");
  cardNode.classList.add("ad-ext-player", "ad-ext-player-active");
  const stackNode = documentRef.createElement("div");
  stackNode.classList.add("chakra-stack", "css-y3hfdd");

  const scoreWrapper = documentRef.createElement("div");
  scoreWrapper.classList.add("chakra-stack", "css-xsngok");
  const scoreNode = documentRef.createElement("p");
  scoreNode.classList.add("chakra-text", "ad-ext-player-score", "css-1r7jzhg");
  scoreNode.textContent = "301";
  scoreWrapper.appendChild(scoreNode);

  const identityNode = documentRef.createElement("div");
  identityNode.classList.add("chakra-stack", "css-37hv00");
  const roundHost = documentRef.createElement("div");
  roundHost.classList.add("css-1k3nd6z");
  const roundBadge = documentRef.createElement("span");
  roundBadge.classList.add("css-3fr5p8");
  roundBadge.textContent = "0";
  roundHost.appendChild(roundBadge);

  const identityHost = documentRef.createElement("div");
  identityHost.classList.add("css-4rrvd0");
  const identityLink = documentRef.createElement("span");
  const mediaNode = documentRef.createElement("div");
  mediaNode.classList.add("chakra-stack", "css-1psdi5l");
  const avatarNode = documentRef.createElement("span");
  avatarNode.classList.add("chakra-avatar", "css-18xwq3i");
  const flagNode = documentRef.createElement("img");
  flagNode.classList.add("chakra-image", "css-6t0bzd");
  mediaNode.appendChild(avatarNode);
  mediaNode.appendChild(flagNode);
  const nameStack = documentRef.createElement("div");
  nameStack.classList.add("chakra-stack", "css-1igwmid");
  const nameNode = documentRef.createElement("span");
  nameNode.classList.add("ad-ext-player-name", "css-g0ywsj");
  nameNode.textContent = "ONLINE PLAYER";
  const profileBadge = documentRef.createElement("span");
  profileBadge.classList.add("chakra-badge", "css-n2903v");
  profileBadge.textContent = "35+";
  nameStack.appendChild(nameNode);
  nameStack.appendChild(profileBadge);
  identityLink.appendChild(mediaNode);
  identityLink.appendChild(nameStack);
  identityHost.appendChild(identityLink);
  identityNode.appendChild(roundHost);
  identityNode.appendChild(identityHost);

  const statsNode = documentRef.createElement("div");
  statsNode.classList.add("chakra-stack", "css-1igwmid");
  const statsText = documentRef.createElement("p");
  statsText.classList.add("chakra-text", "css-1j0bqop");
  statsText.textContent = "#0 | ∅ 0.0 / 0.0";
  statsNode.appendChild(statsText);

  stackNode.appendChild(scoreWrapper);
  stackNode.appendChild(identityNode);
  stackNode.appendChild(statsNode);
  cardNode.appendChild(stackNode);
  wrapperNode.appendChild(cardNode);
  playerDisplayNode.appendChild(wrapperNode);

  const policy = resolveThemePolicy({ featureKey: "theme-x01-2player" });
  policy.onActivate({
    documentRef,
    gameState: {
      getActivePlayerIndex() {
        return 0;
      },
    },
    themeState: policy.createState(),
  });

  assert.equal(scoreWrapper.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), "score");
  assert.equal(scoreWrapper.getAttribute(PLAYER_CARD_PART_ATTRIBUTE), PLAYER_CARD_PARTS.score);
  assert.equal(scoreNode.getAttribute(PLAYER_CARD_PART_ATTRIBUTE), PLAYER_CARD_PARTS.score);
  assert.equal(mediaNode.getAttribute(PLAYER_CARD_PART_ATTRIBUTE), PLAYER_CARD_PARTS.identityMedia);
  assert.equal(avatarNode.getAttribute(PLAYER_CARD_PART_ATTRIBUTE), PLAYER_CARD_PARTS.avatar);
  assert.equal(flagNode.getAttribute(PLAYER_CARD_PART_ATTRIBUTE), PLAYER_CARD_PARTS.flag);
  assert.equal(profileBadge.getAttribute(PLAYER_CARD_PART_ATTRIBUTE), PLAYER_CARD_PARTS.profileBadge);
});

test("theme-x01-2player policy mirrors board controls above the dart overlay without moving originals", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  windowRef.innerWidth = 1536;

  const boardPanel = documentRef.createElement("div");
  boardPanel.classList.add("ad-ext-theme-board-panel");
  boardPanel.__rect = {
    top: 193,
    left: 376,
    width: 783,
    height: 521,
  };

  const boardControls = documentRef.createElement("div");
  boardControls.classList.add("ad-ext-theme-board-controls");
  boardControls.__rect = {
    top: 211,
    left: 902,
    width: 249,
    height: 52,
  };

  const undoButton = documentRef.createElement("button");
  undoButton.textContent = "Undo";
  const nextButton = documentRef.createElement("button");
  nextButton.textContent = "Next";
  let undoClickCount = 0;
  undoButton.addEventListener("click", () => {
    undoClickCount += 1;
  });
  boardControls.appendChild(undoButton);
  boardControls.appendChild(nextButton);
  boardPanel.appendChild(boardControls);
  documentRef.main.appendChild(boardPanel);

  const policy = resolveThemePolicy({ featureKey: "theme-x01-2player" });
  const themeState = policy.createState();
  policy.onActivate({
    documentRef,
    themeState,
    windowRef,
  });

  const portalNode = documentRef.querySelector(
    '[data-ad-ext-x01-2player-board-controls-portal="true"]'
  );
  const mirrorControls = portalNode?.querySelector(".ad-ext-theme-board-controls") || null;
  const mirrorUndoButton = mirrorControls?.querySelector("button") || null;

  assert.ok(portalNode);
  assert.ok(mirrorControls);
  assert.equal(portalNode.parentNode, documentRef.rootElement);
  assert.equal(boardControls.parentNode, boardPanel);
  assert.notEqual(mirrorControls, boardControls);
  assert.equal(mirrorControls.getAttribute("aria-hidden"), "true");
  assert.equal(portalNode.style.getPropertyValue("top"), "211.0px");
  assert.equal(portalNode.style.getPropertyValue("right"), "385.0px");

  mirrorUndoButton.click();
  assert.equal(undoClickCount, 1);

  policy.onActivate({
    documentRef,
    themeState,
    windowRef,
  });

  assert.equal(
    documentRef.querySelectorAll('[data-ad-ext-x01-2player-board-controls-portal="true"]').length,
    1
  );

  policy.onDeactivate({
    documentRef,
    themeState,
  });

  assert.equal(
    documentRef.querySelector('[data-ad-ext-x01-2player-board-controls-portal="true"]'),
    null
  );
  assert.equal(boardControls.parentNode, boardPanel);
});

test("theme-x01-2player policy removes board-control portals from stale theme states", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  windowRef.innerWidth = 1536;

  const boardPanel = documentRef.createElement("div");
  boardPanel.classList.add("ad-ext-theme-board-panel");

  const boardControls = documentRef.createElement("div");
  boardControls.classList.add("ad-ext-theme-board-controls");
  boardControls.__rect = {
    top: 211,
    left: 902,
    width: 249,
    height: 52,
  };

  const undoButton = documentRef.createElement("button");
  undoButton.textContent = "Undo";
  const nextButton = documentRef.createElement("button");
  nextButton.textContent = "Next";
  boardControls.appendChild(undoButton);
  boardControls.appendChild(nextButton);
  boardPanel.appendChild(boardControls);
  documentRef.main.appendChild(boardPanel);

  const policy = resolveThemePolicy({ featureKey: "theme-x01-2player" });
  const staleThemeState = policy.createState();
  policy.onActivate({
    documentRef,
    themeState: staleThemeState,
    windowRef,
  });

  const stalePortalNode = documentRef.querySelector(
    '[data-ad-ext-x01-2player-board-controls-portal="true"]'
  );
  assert.ok(stalePortalNode);

  const nextThemeState = policy.createState();
  policy.onActivate({
    documentRef,
    themeState: nextThemeState,
    windowRef,
  });

  const portalNodes = documentRef.querySelectorAll(
    '[data-ad-ext-x01-2player-board-controls-portal="true"]'
  );

  assert.equal(portalNodes.length, 1);
  assert.notEqual(portalNodes[0], stalePortalNode);
  assert.equal(stalePortalNode.parentNode, null);
  assert.equal(portalNodes[0].style.getPropertyValue("top"), "211.0px");
  assert.equal(portalNodes[0].style.getPropertyValue("right"), "385.0px");

  policy.onDeactivate({
    documentRef,
    themeState: nextThemeState,
  });

  assert.equal(
    documentRef.querySelector('[data-ad-ext-x01-2player-board-controls-portal="true"]'),
    null
  );
});

test("x01 2player scoreboard state marks only older remaining values stale", () => {
  const initialRowStates = deriveX01TwoPlayerScoreboardRowState([
    { scoreText: "", remainingText: "501" },
  ]);
  const rowStates = deriveX01TwoPlayerScoreboardRowState([
    { scoreText: "", remainingText: "501" },
    { scoreText: "60", remainingText: "441" },
    { scoreText: "29", remainingText: "412" },
  ]);

  assert.deepEqual(
    initialRowStates.map((rowState) => ({
      current: rowState.isCurrentRemaining,
      stale: rowState.isStaleRemaining,
      strike: rowState.shouldStrikeRemaining,
    })),
    [{ current: true, stale: false, strike: false }]
  );
  assert.deepEqual(
    rowStates.map((rowState) => ({
      current: rowState.isCurrentRemaining,
      stale: rowState.isStaleRemaining,
      strike: rowState.shouldStrikeRemaining,
    })),
    [
      { current: false, stale: true, strike: true },
      { current: false, stale: true, strike: true },
      { current: true, stale: false, strike: false },
    ]
  );
});

test("theme-x01-2player policy strikes stale remaining cells per player and recomputes after correction", () => {
  const documentRef = new FakeDocument();
  const playerDisplayNode = documentRef.createElement("div");
  playerDisplayNode.id = "ad-ext-player-display";
  documentRef.main.appendChild(playerDisplayNode);

  const firstPlayer = createX01TwoPlayerCard(documentRef, 412, "A");
  const secondPlayer = createX01TwoPlayerCard(documentRef, 401, "B");
  const firstTable = replaceScoreboardRows(documentRef, firstPlayer, [
    ["", "501"],
    ["60", "441"],
    ["29", "412"],
  ]);
  const secondTable = replaceScoreboardRows(documentRef, secondPlayer, [
    ["", "501"],
    ["100", "401"],
  ]);
  playerDisplayNode.appendChild(firstPlayer.wrapperNode);
  playerDisplayNode.appendChild(secondPlayer.wrapperNode);

  const policy = resolveThemePolicy({ featureKey: "theme-x01-2player" });
  const themeState = policy.createState();
  policy.onActivate({
    documentRef,
    gameState: {
      getActivePlayerIndex() {
        return 0;
      },
    },
    themeState,
  });

  const firstCells = getScoreboardCells(firstTable);
  assert.equal(firstCells[0].remainingCell.classList.contains(X01_TWO_PLAYER_STALE_REMAINING_CLASS), true);
  assert.equal(firstCells[1].remainingCell.classList.contains(X01_TWO_PLAYER_STALE_REMAINING_CLASS), true);
  assert.equal(firstCells[2].remainingCell.classList.contains(X01_TWO_PLAYER_STALE_REMAINING_CLASS), false);
  assert.equal(firstCells[2].remainingCell.getAttribute(X01_TWO_PLAYER_CURRENT_REMAINING_ATTRIBUTE), "true");
  assert.equal(firstCells[1].remainingCell.getAttribute(X01_TWO_PLAYER_STALE_REMAINING_ATTRIBUTE), "true");
  assert.equal(firstCells[1].scoreCell.classList.contains(X01_TWO_PLAYER_STALE_REMAINING_CLASS), false);

  const secondCells = getScoreboardCells(secondTable);
  assert.equal(secondCells[0].remainingCell.classList.contains(X01_TWO_PLAYER_STALE_REMAINING_CLASS), true);
  assert.equal(secondCells[1].remainingCell.classList.contains(X01_TWO_PLAYER_STALE_REMAINING_CLASS), false);
  assert.equal(secondCells[1].remainingCell.getAttribute(X01_TWO_PLAYER_CURRENT_REMAINING_ATTRIBUTE), "true");

  firstTable.removeChild(firstTable.children[2]);
  policy.onActivate({
    documentRef,
    gameState: {
      getActivePlayerIndex() {
        return 0;
      },
    },
    themeState,
  });

  const correctedCells = getScoreboardCells(firstTable);
  assert.equal(correctedCells[0].remainingCell.classList.contains(X01_TWO_PLAYER_STALE_REMAINING_CLASS), true);
  assert.equal(correctedCells[1].remainingCell.classList.contains(X01_TWO_PLAYER_STALE_REMAINING_CLASS), false);
  assert.equal(correctedCells[1].remainingCell.getAttribute(X01_TWO_PLAYER_CURRENT_REMAINING_ATTRIBUTE), "true");

  policy.onDeactivate({
    documentRef,
    themeState,
  });

  assert.equal(correctedCells[0].remainingCell.classList.contains(X01_TWO_PLAYER_STALE_REMAINING_CLASS), false);
  assert.equal(correctedCells[0].remainingCell.getAttribute(X01_TWO_PLAYER_STALE_REMAINING_ATTRIBUTE), null);
  assert.equal(correctedCells[1].remainingCell.getAttribute(X01_TWO_PLAYER_CURRENT_REMAINING_ATTRIBUTE), null);
});

test("x01 2player scoreboard state keeps a displayed bust remainder current", () => {
  const rowStates = deriveX01TwoPlayerScoreboardRowState([
    { scoreText: "", remainingText: "501" },
    { scoreText: "60", remainingText: "441" },
    { scoreText: "BUST", remainingText: "441" },
  ]);

  assert.equal(rowStates[0].shouldStrikeRemaining, true);
  assert.equal(rowStates[1].shouldStrikeRemaining, true);
  assert.equal(rowStates[2].isCurrentRemaining, true);
  assert.equal(rowStates[2].shouldStrikeRemaining, false);
});

test("mountThemeFeature honors an injected policy without changing the theme lifecycle", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "x01";
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/test-match",
  });

  const observerCalls = [];
  const listenerCalls = [];
  const removedStyles = [];
  const policyCalls = [];

  const domGuards = {
    ensureStyle() {},
    removeNodeById(styleId) {
      removedStyles.push(styleId);
    },
  };
  const observerRegistry = {
    registerMutationObserver(options) {
      observerCalls.push(options);
      return () => {};
    },
    disconnect() {},
  };
  const listenerRegistry = {
    register(options) {
      listenerCalls.push(options);
      return () => {};
    },
    remove() {},
  };

  const cleanup = mountThemeFeature(
    {
      documentRef,
      windowRef,
      domGuards,
      gameState: {
        isX01Variant() {
          return true;
        },
      },
      config: {
        getFeatureConfig() {
          return {};
        },
      },
      registries: {
        observers: observerRegistry,
        listeners: listenerRegistry,
      },
      helpers: {
        createRafScheduler(callback) {
          let scheduled = false;
          return {
            schedule() {
              if (scheduled) {
                return;
              }
              scheduled = true;
              setTimeout(() => {
                scheduled = false;
                callback();
              }, 0);
            },
            cancel() {
              scheduled = false;
            },
          };
        },
      },
    },
    {
      featureKey: "theme-x01",
      configKey: "themes.x01",
      styleId: "test-theme-style",
      variantName: "x01",
      buildThemeCss() {
        return "body { color: red; }";
      },
      policy: {
        createState() {
          policyCalls.push("createState");
          return { marker: "policy-state" };
        },
        getManagedNodeIds() {
          return ["policy-node"];
        },
        getManagedClassNames() {
          return ["policy-class"];
        },
        getObservedAttributeFilter() {
          return ["data-policy"];
        },
        shouldScheduleMutation(mutations = []) {
          policyCalls.push(`mutations:${mutations.length}`);
          return true;
        },
        onActivate(context = {}) {
          policyCalls.push(`activate:${String(context.themeState?.marker || "")}`);
        },
        onDeactivate(context = {}) {
          policyCalls.push(`deactivate:${String(context.themeState?.marker || "")}`);
        },
      },
    }
  );

  await wait(20);

  assert.ok(policyCalls.includes("createState"));
  assert.ok(policyCalls.some((entry) => entry.startsWith("activate:policy-state")));
  assert.equal(observerCalls.length, 1);
  assert.ok(
    observerCalls[0].observeOptions.attributeFilter.includes("data-policy")
  );
  assert.equal(listenerCalls.length, 2);

  cleanup();
  assert.ok(policyCalls.some((entry) => entry.startsWith("deactivate:policy-state")));
  assert.ok(removedStyles.includes("test-theme-style"));
});

test("mountThemeFeature deactivates the theme when an injected support check rejects the context", async () => {
  const documentRef = new FakeDocument();
  documentRef.variantElement.textContent = "x01";
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.io/matches/test-match",
  });

  const ensuredStyles = [];
  const removedStyles = [];

  const cleanup = mountThemeFeature(
    {
      documentRef,
      windowRef,
      domGuards: {
        ensureStyle(styleId, cssText) {
          ensuredStyles.push({ styleId, cssText });
        },
        removeNodeById(styleId) {
          removedStyles.push(styleId);
        },
      },
      gameState: {
        isX01Variant() {
          return true;
        },
        subscribe() {
          return () => {};
        },
      },
      config: {
        getFeatureConfig() {
          return {};
        },
      },
      registries: {
        observers: {
          registerMutationObserver() {},
          disconnect() {},
        },
        listeners: {
          register() {},
          remove() {},
        },
      },
      helpers: {
        createRafScheduler(callback) {
          return {
            schedule() {
              callback();
            },
            cancel() {},
          };
        },
      },
    },
    {
      featureKey: "theme-x01-2player",
      configKey: "themes.x01TwoPlayer",
      styleId: "test-theme-style",
      variantName: "x01",
      buildThemeCss() {
        return "body { color: red; }";
      },
      isSupportedContext() {
        return false;
      },
    }
  );

  await wait(5);

  assert.equal(ensuredStyles.length, 0);
  assert.ok(removedStyles.includes("test-theme-style"));

  cleanup();
});
