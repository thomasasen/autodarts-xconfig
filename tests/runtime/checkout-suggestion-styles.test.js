import test from "node:test";
import assert from "node:assert/strict";

import {
  applySuggestionStyle,
  collectSuggestions,
  isX01Active,
  resetSuggestionNode,
} from "../../src/features/checkout-suggestion-styles/logic.js";
import { initializeCheckoutSuggestionStyles } from "../../src/features/checkout-suggestion-styles/index.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { createObserverRegistry } from "../../src/core/observer-registry.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";
import { createModernX01Fixture } from "./modern-x01-fixture.js";
import {
  LAYOUT_CLASS,
  MODERN_CLASS,
  NO_LABEL_CLASS,
  STYLE_CLASSES,
  buildStyleText,
} from "../../src/features/checkout-suggestion-styles/style.js";

test("checkout-suggestion-styles writes and clears the checkout label through dataset-backed attributes", () => {
  const documentRef = new FakeDocument();
  const node = documentRef.createElement("div");

  applySuggestionStyle(node, {
    style: "badge",
    labelText: "CHECKOUT",
    colorTheme: "amber",
  });

  assert.equal(node.dataset.adExtLabel, "CHECKOUT");
  assert.equal(node.getAttribute("data-ad-ext-label"), "CHECKOUT");

  resetSuggestionNode(node);

  assert.equal(node.dataset.adExtLabel, undefined);
  assert.equal(node.getAttribute("data-ad-ext-label"), null);
});

test("checkout-suggestion-styles schedules only suggestion, turn, variant, and game-state changes", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const observers = createObserverRegistry();
  let scheduleCount = 0;
  let gameStateSubscriber = null;
  const cleanup = initializeCheckoutSuggestionStyles({
    documentRef,
    windowRef,
    domGuards: createDomGuards({ documentRef }),
    registries: { observers },
    helpers: {
      createRafScheduler() {
        return {
          schedule() {
            scheduleCount += 1;
          },
          cancel() {},
        };
      },
    },
    gameState: {
      subscribe(subscriber) {
        gameStateSubscriber = subscriber;
        return () => {};
      },
    },
  });
  const observer = observers.get("checkout-suggestion-styles:dom-observer");
  const unrelatedNode = documentRef.createElement("div");
  documentRef.sidebar.appendChild(unrelatedNode);

  assert.equal(scheduleCount, 1);
  observer.callback([{ target: documentRef.sidebar, addedNodes: [unrelatedNode] }]);
  assert.equal(scheduleCount, 1);

  observer.callback([{ target: documentRef.turnScoreElement }]);
  observer.callback([{ target: documentRef.suggestionElement }]);
  observer.callback([{ target: documentRef.variantElement }]);
  gameStateSubscriber();
  assert.equal(scheduleCount, 5);

  cleanup();
});

test("checkout-suggestion-styles targets only the native modern turn route", () => {
  const fixture = createModernX01Fixture({
    throws: [],
    route: ["T20", "25", "D18"],
  });

  const suggestions = collectSuggestions(fixture.documentRef, fixture.windowRef);

  assert.deepEqual(suggestions, fixture.rows.map(({ row }) => row));
  assert.equal(suggestions.includes(fixture.cardRoute), false);
});

test("checkout-suggestion-styles recognizes modern X01 when game state has no variant", () => {
  const fixture = createModernX01Fixture({
    throws: [],
    route: ["T20", "25", "D18"],
  });

  assert.equal(isX01Active({
    gameState: { isX01Variant: () => false },
    documentRef: fixture.documentRef,
    windowRef: fixture.windowRef,
  }), true);
});

test("checkout-suggestion-styles applies the modern field layout before checkout appears", () => {
  const fixture = createModernX01Fixture({ throws: [], route: [] });
  const cleanup = initializeCheckoutSuggestionStyles({
    documentRef: fixture.documentRef,
    windowRef: fixture.windowRef,
    domGuards: createDomGuards({ documentRef: fixture.documentRef }),
    helpers: {
      createRafScheduler(callback) {
        return { schedule: callback, cancel() {} };
      },
    },
    gameState: {
      isX01Variant: () => true,
      subscribe: () => () => {},
    },
  });

  assert.equal(fixture.turn.classList.contains(LAYOUT_CLASS), true);
  assert.equal(fixture.rows.some(({ row }) => row.classList.contains("ad-ext-checkout-suggestion")), false);

  cleanup();

  assert.equal(fixture.turn.classList.contains(LAYOUT_CLASS), false);
});

test("checkout-suggestion-styles keeps modern theme typography and paints decoration behind it", () => {
  const styleText = buildStyleText();
  const modernBaseRule = styleText.match(
    new RegExp(`\\.${MODERN_CLASS.replaceAll("-", "\\-")} \\{([^}]*)\\}`)
  )?.[1] || "";
  const modernLabelRule = styleText.match(
    new RegExp(`\\.${MODERN_CLASS.replaceAll("-", "\\-")}::before \\{([^}]*)\\}`)
  )?.[1] || "";
  const visibleTextSelector =
    `.${LAYOUT_CLASS} > :first-child > .${MODERN_CLASS} > span:not([aria-hidden="true"])`;
  const nestedTextSelector = `${visibleTextSelector} *`;

  assert.doesNotMatch(modernBaseRule, /(?:^|;)\s*(?:color|font-family|background)\s*:/);
  assert.equal(styleText.includes(visibleTextSelector), true);
  assert.equal(styleText.includes(nestedTextSelector), true);
  assert.match(styleText, /var\(--ad-ext-theme-throw-label-color, #f2f5f8\) 25%/);
  assert.match(styleText, /#ffffff 75%/);
  assert.match(styleText, /-webkit-text-fill-color: currentColor !important;/);
  assert.match(modernLabelRule, /-webkit-text-fill-color: currentColor !important;/);
  assert.match(modernLabelRule, /top: -6px;/);
  assert.match(modernLabelRule, /font-size: 11px;/);
  assert.match(modernLabelRule, /text-shadow: none !important;/);
  assert.match(
    styleText,
    new RegExp(
      `\\.${MODERN_CLASS.replaceAll("-", "\\-")}:not\\(\\.${NO_LABEL_CLASS.replaceAll("-", "\\-")}\\) \\{[^}]*overflow: visible;`
    )
  );
  Object.values(STYLE_CLASSES).forEach((styleClass) => {
    assert.match(
      styleText,
      new RegExp(`\\.${MODERN_CLASS.replaceAll("-", "\\-")}\\.${styleClass.replaceAll("-", "\\-")}::after`)
    );
  });
});

test("checkout-suggestion-styles keeps desktop fields enlarged at common browser heights", () => {
  const styleText = buildStyleText();

  assert.match(styleText, /flex: 0 0 444px;/);
  assert.match(styleText, /width: 444px;/);
  assert.match(styleText, /@media \(max-width: 900px\)/);
  assert.doesNotMatch(styleText, /max-height:/);
});

test("checkout-suggestion-styles decorates the modern route with one label and cleans it up", () => {
  const fixture = createModernX01Fixture({
    throws: [],
    route: ["T20", "25", "D18"],
  });
  let render = () => {};
  const cleanup = initializeCheckoutSuggestionStyles({
    documentRef: fixture.documentRef,
    windowRef: fixture.windowRef,
    domGuards: createDomGuards({ documentRef: fixture.documentRef }),
    helpers: {
      createRafScheduler(callback) {
        render = callback;
        return {
          schedule: callback,
          cancel() {},
        };
      },
    },
    gameState: {
      isX01Variant: () => true,
      subscribe: () => () => {},
    },
    config: {
      getFeatureConfig: () => ({
        style: "ribbon",
        labelText: "CHECKOUT",
        colorTheme: "cyan",
      }),
    },
  });
  const modernRows = fixture.rows.map(({ row }) => row);

  modernRows.forEach((row) => {
    assert.equal(row.classList.contains("ad-ext-checkout-suggestion"), true);
    assert.equal(row.classList.contains("ad-ext-checkout-suggestion--modern"), true);
  });
  assert.equal(modernRows[0].dataset.adExtLabel, "CHECKOUT");
  assert.equal(modernRows[1].dataset.adExtLabel, undefined);
  assert.equal(modernRows[2].dataset.adExtLabel, undefined);
  assert.equal(fixture.cardRoute.classList.contains("ad-ext-checkout-suggestion"), false);

  fixture.setVisit(["T20"], ["25", "D18"]);
  render();

  assert.equal(modernRows[0].classList.contains("ad-ext-checkout-suggestion"), false);
  assert.equal(modernRows[1].dataset.adExtLabel, "CHECKOUT");
  assert.equal(modernRows[2].dataset.adExtLabel, undefined);

  cleanup();

  modernRows.forEach((row) => {
    assert.equal(row.classList.contains("ad-ext-checkout-suggestion"), false);
    assert.equal(row.classList.contains("ad-ext-checkout-suggestion--modern"), false);
  });
});
