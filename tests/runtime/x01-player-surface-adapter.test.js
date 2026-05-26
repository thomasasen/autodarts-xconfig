import test from "node:test";
import assert from "node:assert/strict";

import {
  X01_PLAYER_CARD_SELECTOR,
  X01_PLAYER_DISPLAY_ROOT_SELECTOR,
  X01_PLAYER_NAME_SELECTOR,
  X01_PLAYER_SCORE_SELECTOR,
  createX01PlayerSurfaceObserveOptions,
  findX01PlayerSurface,
  getX01PlayerSurfaceSnapshot,
} from "../../src/features/shared/x01-player-surface-adapter.js";
import { FakeDocument } from "./fake-dom.js";

function removeDefaultPlayerNodes(documentRef) {
  documentRef.activePlayerRow.remove();
  documentRef.winnerNode.remove();
}

function appendPlayerDisplayRoot(documentRef) {
  removeDefaultPlayerNodes(documentRef);
  const root = documentRef.createElement("div");
  root.id = "ad-ext-player-display";
  documentRef.main.appendChild(root);
  return root;
}

function appendPlayerCard(documentRef, root, options = {}) {
  const wrapper = options.nested ? documentRef.createElement("div") : null;
  const card = documentRef.createElement("div");
  card.id = options.id || "";
  card.classList.add("ad-ext-player");

  if (options.active === true) {
    card.classList.add("ad-ext-player-active");
  } else if (options.inactive === true) {
    card.classList.add("ad-ext-player-inactive");
  }

  if (typeof options.scoreText !== "undefined") {
    const scoreNode = documentRef.createElement("p");
    scoreNode.classList.add("ad-ext-player-score");
    scoreNode.textContent = options.scoreText;
    card.appendChild(scoreNode);
  }

  if (typeof options.nameText !== "undefined") {
    const nameNode = documentRef.createElement("span");
    nameNode.classList.add("ad-ext-player-name");
    nameNode.textContent = options.nameText;
    card.appendChild(nameNode);
  }

  if (wrapper) {
    wrapper.appendChild(card);
    root.appendChild(wrapper);
  } else {
    root.appendChild(card);
  }

  return card;
}

test("x01 player surface adapter exports the external baseline selectors", () => {
  assert.equal(X01_PLAYER_DISPLAY_ROOT_SELECTOR, "#ad-ext-player-display");
  assert.equal(X01_PLAYER_CARD_SELECTOR, ".ad-ext-player, [id^=\"ad-ext-player-\"]");
  assert.equal(X01_PLAYER_SCORE_SELECTOR, ".ad-ext-player-score");
  assert.equal(X01_PLAYER_NAME_SELECTOR, ".ad-ext-player-name");
});

test("x01 player surface adapter returns an empty snapshot for invalid document input", () => {
  assert.deepEqual(getX01PlayerSurfaceSnapshot(null), {
    playerDisplayRoot: null,
    playerCards: [],
    players: [],
    source: "none",
  });
  assert.deepEqual(findX01PlayerSurface({}), {
    playerDisplayRoot: null,
    playerCards: [],
    players: [],
    source: "none",
  });
});

test("x01 player surface adapter returns source none when player display root is absent", () => {
  const documentRef = new FakeDocument();

  const snapshot = getX01PlayerSurfaceSnapshot(documentRef);

  assert.equal(snapshot.playerDisplayRoot, null);
  assert.deepEqual(snapshot.playerCards, []);
  assert.deepEqual(snapshot.players, []);
  assert.equal(snapshot.source, "none");
});

test("x01 player surface adapter reads two players with names and scores", () => {
  const documentRef = new FakeDocument();
  const root = appendPlayerDisplayRoot(documentRef);
  const firstCard = appendPlayerCard(documentRef, root, {
    id: "ad-ext-player-0",
    nameText: "TORNADO TOM",
    scoreText: "423",
    active: true,
  });
  const secondCard = appendPlayerCard(documentRef, root, {
    id: "ad-ext-player-1",
    nameText: "TEST2",
    scoreText: "501",
    inactive: true,
  });

  const snapshot = getX01PlayerSurfaceSnapshot(documentRef);

  assert.equal(snapshot.playerDisplayRoot, root);
  assert.deepEqual(snapshot.playerCards, [firstCard, secondCard]);
  assert.equal(snapshot.source, "tools-for-autodarts");
  assert.deepEqual(
    snapshot.players.map((player) => ({
      index: player.index,
      id: player.id,
      nameText: player.nameText,
      scoreText: player.scoreText,
      isActive: player.isActive,
    })),
    [
      {
        index: 0,
        id: "ad-ext-player-0",
        nameText: "TORNADO TOM",
        scoreText: "423",
        isActive: true,
      },
      {
        index: 1,
        id: "ad-ext-player-1",
        nameText: "TEST2",
        scoreText: "501",
        isActive: false,
      },
    ]
  );
});

test("x01 player surface adapter ignores online profile badge text when reading names", () => {
  const documentRef = new FakeDocument();
  const root = appendPlayerDisplayRoot(documentRef);
  const card = appendPlayerCard(documentRef, root, {
    id: "ad-ext-player-0",
    nameText: "ONLINE PLAYER",
    scoreText: "501",
  });
  const profileBadge = documentRef.createElement("span");
  profileBadge.classList.add("chakra-badge", "css-n2903v");
  profileBadge.textContent = "35+";
  card.appendChild(profileBadge);

  const snapshot = getX01PlayerSurfaceSnapshot(documentRef);

  assert.equal(snapshot.players[0].nameText, "ONLINE PLAYER");
  assert.equal(snapshot.players[0].scoreText, "501");
});

test("x01 player surface adapter handles missing score and name nodes defensively", () => {
  const documentRef = new FakeDocument();
  const root = appendPlayerDisplayRoot(documentRef);
  appendPlayerCard(documentRef, root, {
    id: "ad-ext-player-0",
  });

  const snapshot = getX01PlayerSurfaceSnapshot(documentRef);

  assert.equal(snapshot.players.length, 1);
  assert.equal(snapshot.players[0].nameText, "");
  assert.equal(snapshot.players[0].scoreText, "");
  assert.equal(snapshot.players[0].isActive, false);
});

test("x01 player surface adapter collects nested player cards safely", () => {
  const documentRef = new FakeDocument();
  const root = appendPlayerDisplayRoot(documentRef);
  const nestedCard = appendPlayerCard(documentRef, root, {
    id: "ad-ext-player-0",
    nameText: "Nested",
    scoreText: "170",
    nested: true,
  });

  const snapshot = getX01PlayerSurfaceSnapshot(documentRef);

  assert.deepEqual(snapshot.playerCards, [nestedCard]);
  assert.equal(snapshot.players[0].nameText, "Nested");
  assert.equal(snapshot.players[0].scoreText, "170");
});

test("x01 player surface observe options stay scoped to class changes", () => {
  assert.deepEqual(createX01PlayerSurfaceObserveOptions(), {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class"],
  });
});
