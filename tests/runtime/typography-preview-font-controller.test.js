import assert from "node:assert/strict";
import test from "node:test";

import { createDomGuards } from "../../src/core/dom-guards.js";
import { createTypographyPreviewFontController } from "../../src/features/xconfig-ui/typography-preview-font-controller.js";
import { FakeDocument, FakeEvent } from "./fake-dom.js";

const STYLE_ID = "test-preview-fonts";

function countImports(styleNode) {
  return String(styleNode?.textContent || "").match(/@import\s+url/g)?.length || 0;
}

function createPreviewTarget(documentRef, presetValue) {
  const target = documentRef.createElement("button");
  target.dataset.adxconfigPreviewFont = presetValue;
  documentRef.body.appendChild(target);
  return target;
}

test("typography preview fonts load on demand, deduplicate and reset between modal sessions", () => {
  const documentRef = new FakeDocument();
  const controller = createTypographyPreviewFontController({
    domGuards: createDomGuards({ documentRef }),
    panelHostId: "ad-xconfig-panel-host",
    styleId: STYLE_ID,
  });
  const audiowideTarget = createPreviewTarget(documentRef, "audiowide");
  const aldrichTarget = createPreviewTarget(documentRef, "aldrich");

  controller.activate("system");
  let styleNode = documentRef.getElementById(STYLE_ID);
  assert.ok(styleNode);
  assert.equal(countImports(styleNode), 0);

  controller.handlePreviewRequest(new FakeEvent("pointerover", { target: audiowideTarget }));
  styleNode = documentRef.getElementById(STYLE_ID);
  assert.equal(countImports(styleNode), 1);
  assert.match(styleNode.textContent, /family=Audiowide/);

  controller.handlePreviewRequest(new FakeEvent("focusin", { target: audiowideTarget }));
  assert.equal(countImports(styleNode), 1);

  controller.handlePreviewRequest(new FakeEvent("focusin", { target: aldrichTarget }));
  assert.equal(countImports(styleNode), 2);
  assert.match(styleNode.textContent, /family=Aldrich/);

  controller.deactivate();
  assert.equal(documentRef.getElementById(STYLE_ID), null);

  controller.activate("audiowide");
  styleNode = documentRef.getElementById(STYLE_ID);
  assert.equal(countImports(styleNode), 1);
  assert.match(styleNode.textContent, /family=Audiowide/);
  assert.doesNotMatch(styleNode.textContent, /family=Aldrich/);
});
