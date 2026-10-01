import test from "node:test";
import assert from "node:assert/strict";

import {
  AUTODARTS_DART_DESIGNER_IMPORT_ACTION,
  AUTODARTS_DART_DESIGNER_PANEL_ID,
  AUTODARTS_DART_DESIGNER_RESTORE_ACTION,
  captureAutodartsDartDesignerConfig,
  createAutodartsDartDesignerController,
} from "../../src/features/xconfig-ui/autodarts-dart-designer-controller.js";
import {
  AUTODARTS_DART_DESIGNER_PARTS,
  normalizeAutodartsDartDesignerConfig,
} from "../../src/shared/autodarts-dart-designer.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

const OPTIONS_BY_TAB = Object.freeze([
  Object.freeze(["Standard", "Kite", "Pear", "Combat"]),
  Object.freeze(["Autodarts White", "Autodarts Blue", "Red"]),
  Object.freeze(["Black", "Blue", "Red"]),
  Object.freeze(["Black 1", "Color Blue", "Silver 2"]),
  Object.freeze(["Black", "Gold", "Silver"]),
]);

function createDesignerFixture() {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({
    documentRef,
    href: "https://play.autodarts.com/settings/customise-darts",
  });
  documentRef.main.replaceChildren();

  const preview = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  preview.setAttribute("viewBox", "0 0 475 101");
  const previewPath = documentRef.createElementNS("http://www.w3.org/2000/svg", "path");
  preview.appendChild(previewPath);
  documentRef.main.appendChild(preview);

  const tabList = documentRef.createElement("div");
  tabList.setAttribute("role", "tablist");
  const panel = documentRef.createElement("div");
  panel.setAttribute("role", "tabpanel");
  const selectedOptionIndexes = [0, 2, 1, 2, 1];
  let activeTabIndex = 0;

  function renderPanel() {
    panel.replaceChildren();
    OPTIONS_BY_TAB[activeTabIndex].forEach((label, optionIndex) => {
      const button = documentRef.createElement("button");
      button.textContent = label;
      button.setAttribute(
        "aria-pressed",
        selectedOptionIndexes[activeTabIndex] === optionIndex ? "true" : "false"
      );
      button.addEventListener("click", () => {
        selectedOptionIndexes[activeTabIndex] = optionIndex;
        renderPanel();
      });
      panel.appendChild(button);
    });
  }

  AUTODARTS_DART_DESIGNER_PARTS.forEach((part) => {
    const tab = documentRef.createElement("button");
    tab.textContent = part.fallbackLabel;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", part.tabIndex === activeTabIndex ? "true" : "false");
    tab.addEventListener("click", () => {
      activeTabIndex = part.tabIndex;
      Array.from(tabList.querySelectorAll("[role='tab']")).forEach((entry, index) => {
        entry.setAttribute("aria-selected", index === activeTabIndex ? "true" : "false");
      });
      renderPanel();
    });
    tabList.appendChild(tab);
  });
  renderPanel();
  documentRef.main.appendChild(tabList);
  documentRef.main.appendChild(panel);

  return {
    documentRef,
    windowRef,
    selectedOptionIndexes,
    select(tabIndex, optionIndex) {
      activeTabIndex = tabIndex;
      selectedOptionIndexes[tabIndex] = optionIndex;
      Array.from(tabList.querySelectorAll("[role='tab']")).forEach((entry, index) => {
        entry.setAttribute("aria-selected", index === activeTabIndex ? "true" : "false");
      });
      renderPanel();
    },
  };
}

test("dart designer config normalization requires all five bounded selections", () => {
  const parts = Object.fromEntries(
    AUTODARTS_DART_DESIGNER_PARTS.map((part) => [
      part.key,
      {
        tabIndex: 99,
        tabLabel: `  ${part.fallbackLabel}  `,
        optionIndex: part.tabIndex,
        optionLabel: `  Option ${part.tabIndex + 1}  `,
      },
    ])
  );
  const normalized = normalizeAutodartsDartDesignerConfig({ version: 9, parts });

  assert.equal(normalized.version, 1);
  assert.equal(normalized.parts.flightShape.tabIndex, 0);
  assert.equal(normalized.parts.point.tabIndex, 4);
  assert.equal(normalized.parts.barrel.optionLabel, "Option 4");
  assert.equal(
    normalizeAutodartsDartDesignerConfig({ version: 1, parts: { ...parts, point: null } }),
    null
  );
});

test("dart designer controller imports the rendered dart and restores all saved parts", async () => {
  const fixture = createDesignerFixture();
  let featureConfig = {
    turnDartStyle: "original",
    turnDartDesignerImageDataUrl: "",
    turnDartDesignerConfig: null,
  };
  const savedPatches = [];
  const runtimeApi = {
    listFeatures() {
      return [{ featureKey: "turn-dart-display", config: featureConfig }];
    },
    async saveConfig(patch) {
      savedPatches.push(patch);
      featureConfig = {
        ...featureConfig,
        ...patch.features.turnDartDisplay,
      };
    },
  };
  const controller = createAutodartsDartDesignerController({
    ...fixture,
    runtimeApi,
    rasterizePreview: async () => "data:image/webp;base64,QUJDRA==",
  });

  const injectedPanel = controller.sync();
  assert.ok(injectedPanel);
  assert.equal(injectedPanel.id, AUTODARTS_DART_DESIGNER_PANEL_ID);
  assert.ok(
    injectedPanel.querySelector(
      `[data-adxconfig-action='${AUTODARTS_DART_DESIGNER_IMPORT_ACTION}']`
    )
  );
  assert.equal(
    injectedPanel.querySelector(
      `[data-adxconfig-action='${AUTODARTS_DART_DESIGNER_RESTORE_ACTION}']`
    ).disabled,
    true
  );

  await controller.importCurrentDart();

  assert.equal(savedPatches.length, 1);
  assert.equal(featureConfig.turnDartStyle, "designer");
  assert.equal(featureConfig.turnDartDesignerImageDataUrl, "data:image/webp;base64,QUJDRA==");
  assert.equal(featureConfig.turnDartDesignerConfig.parts.flight.optionLabel, "Red");
  assert.equal(featureConfig.turnDartDesignerConfig.parts.point.optionLabel, "Gold");
  assert.match(
    injectedPanel.querySelector("[data-adxconfig-dart-designer-status='true']").textContent,
    /gespeichert/i
  );

  fixture.select(0, 3);
  fixture.select(1, 0);
  fixture.select(2, 0);
  fixture.select(3, 0);
  fixture.select(4, 2);
  await controller.restoreSavedDart();

  assert.deepEqual(fixture.selectedOptionIndexes, [0, 2, 1, 2, 1]);
  assert.match(
    injectedPanel.querySelector("[data-adxconfig-dart-designer-status='true']").textContent,
    /geladen/i
  );

  fixture.windowRef.history.pushState({}, "", "/lobbies");
  controller.sync();
  assert.equal(fixture.documentRef.getElementById(AUTODARTS_DART_DESIGNER_PANEL_ID), null);
});

test("dart designer capture rejects an incomplete host selection", async () => {
  const fixture = createDesignerFixture();
  fixture.select(2, -1);

  await assert.rejects(
    captureAutodartsDartDesignerConfig(fixture),
    /Schaft/
  );
});
