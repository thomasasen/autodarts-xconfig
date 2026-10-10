import test from "node:test";
import assert from "node:assert/strict";
import { createShellRenderController } from "../../src/features/xconfig-ui/render-controller.js";
import { buildShellRenderSignature } from "../../src/features/xconfig-ui/render-signature.js";
import { FakeDocument } from "./fake-dom.js";

function fixture(featureKey = "checkout-score-highlight") {
  const documentRef = new FakeDocument();
  const host = documentRef.createElement("section");
  host.id = "test-panel";
  documentRef.main.appendChild(host);
  const state = { started: true, renderSignature: "", activeSettingsFeatureKey: featureKey };
  const features = [{ featureKey, enabled: true, config: { color: "cyan" } }];
  const calls = { parse: 0, build: 0, before: 0, after: 0 };
  let routeActive = true;
  const controller = createShellRenderController({ documentRef, state, panelHostId: host.id,
    getContentElement: () => documentRef.main, getFeatures: () => features,
    isConfigRoute: () => routeActive, buildShellRenderSignature,
    parseShellRenderSignature(signature) { calls.parse++; return signature ? JSON.parse(signature) : null; },
    onBeforeRender() { calls.before++; }, onAfterRender() { calls.after++; },
    buildShellContent() {
      calls.build++;
      const shell = documentRef.createElement("div");
      const modal = documentRef.createElement("div");
      modal.classList.add("ad-xconfig-modal");
      const body = documentRef.createElement("div");
      body.classList.add("ad-xconfig-modal-body");
      body.appendChild(documentRef.createElement("input"));
      modal.appendChild(body);
      shell.appendChild(modal);
      return shell;
    },
  });
  return { documentRef, host, state, features, calls, controller, setRoute(value) { routeActive = value; } };
}

test("unchanged shell updates preserve focus and scroll without parsing or creating UI", () => {
  const f = fixture();
  f.controller.render();
  const input = f.host.querySelector("input");
  f.documentRef.activeElement = input;
  f.host.scrollTop = 31;
  Object.keys(f.calls).forEach((key) => { f.calls[key] = 0; });
  f.controller.render();
  assert.deepEqual(f.calls, { parse: 0, build: 0, before: 0, after: 0 });
  assert.equal(f.host.querySelector("input"), input);
  assert.equal(f.documentRef.activeElement, input);
  assert.equal(f.host.scrollTop, 31);
});

test("changed config keeps the same modal, focused input and both scroll positions", () => {
  const f = fixture();
  f.controller.render();
  const modal = f.host.querySelector(".ad-xconfig-modal");
  const body = modal.querySelector(".ad-xconfig-modal-body");
  const input = body.querySelector("input");
  f.documentRef.activeElement = input;
  modal.scrollTop = 22;
  body.scrollTop = 44;
  f.features[0].config.color = "red";
  f.controller.render();
  assert.equal(f.host.querySelector(".ad-xconfig-modal"), modal);
  assert.equal(f.documentRef.activeElement, input);
  assert.equal(modal.scrollTop, 22);
  assert.equal(body.scrollTop, 44);
  assert.equal(f.calls.build, 2);
});

test("presets and route transitions rebuild modal content instead of retaining stale controls", () => {
  for (const key of ["theme-global-presets", "checkout-score-highlight"]) {
    const f = fixture(key);
    if (key !== "theme-global-presets") f.setRoute(false);
    f.controller.render();
    const input = f.host.querySelector("input");
    f.features[0].config.color = "red";
    f.setRoute(true);
    f.controller.render();
    assert.notEqual(f.host.querySelector("input"), input);
  }
});
