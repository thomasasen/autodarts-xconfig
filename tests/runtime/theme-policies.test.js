import test from "node:test";
import assert from "node:assert/strict";

import { mountThemeFeature } from "../../src/features/themes/shared/mount-theme-feature.js";
import { resolveThemePolicy } from "../../src/features/themes/shared/theme-policies.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";
import {
  X01_TWO_PLAYER_ACTIVE_ATTRIBUTE,
  X01_TWO_PLAYER_SLOT_ATTRIBUTE,
  X01_TWO_PLAYER_STACK_ATTRIBUTE,
} from "../../src/features/themes/x01-2player/layout-contract.js";

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
    cricketPolicy.getManagedClassNames().sort(),
    [
      "ad-ext-theme-cricket-readability-notice",
      "ad-ext-theme-cricket-readability-text",
      "ad-ext-theme-cricket-readability-toggle",
    ].sort()
  );
  assert.deepEqual(cricketPolicy.getObservedAttributeFilter(), ["class"]);
  assert.equal(resolveThemePolicy({ featureKey: "theme-x01" }), null);
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

  policy.onDeactivate({
    documentRef,
    themeState,
  });

  assert.equal(firstPlayer.cardNode.getAttribute(X01_TWO_PLAYER_ACTIVE_ATTRIBUTE), null);
  assert.equal(firstPlayer.stackNode.getAttribute(X01_TWO_PLAYER_STACK_ATTRIBUTE), null);
  assert.equal(firstPlayer.identityNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), null);
  assert.equal(firstPlayer.scoreNode.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), null);
  assert.equal(firstPlayer.tableSlot.getAttribute(X01_TWO_PLAYER_SLOT_ATTRIBUTE), null);
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
