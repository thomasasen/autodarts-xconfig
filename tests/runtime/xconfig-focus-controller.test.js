import test from "node:test";
import assert from "node:assert/strict";
import { createShellFocusController } from "../../src/features/xconfig-ui/focus-controller.js";
import { FakeDocument } from "./fake-dom.js";

function setup() {
  const documentRef = new FakeDocument();
  const host = documentRef.createElement("div");
  host.id = "focus-host";
  documentRef.body.appendChild(host);
  function element(tag, attributes = {}, parent = host) {
    const node = documentRef.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    node.focus = () => { documentRef.activeElement = node; };
    parent.appendChild(node);
    return node;
  }
  const controller = createShellFocusController({ documentRef, panelHostId: host.id });
  return { documentRef, host, element, controller };
}

function key(target, value, shiftKey = false) {
  return { target, key: value, shiftKey, prevented: false, preventDefault() { this.prevented = true; } };
}

test("xConfig restores the dialog trigger and the selected control after shell replacement", () => {
  const { documentRef, element, controller } = setup();
  const trigger = element("button", { "data-adxconfig-action": "open-settings", "data-feature-key": "demo" });
  trigger.focus();
  controller.beforeRender();
  trigger.remove();
  const nextTrigger = element("button", { "data-adxconfig-action": "open-settings", "data-feature-key": "demo" });
  const modal = element("section", { role: "dialog" });
  const close = element("button", { "data-adxconfig-action": "close-settings" }, modal);
  const input = element("input", { id: "enabled" }, modal);
  controller.afterRender();
  assert.equal(documentRef.activeElement, close);
  input.focus();
  controller.beforeRender();
  input.remove();
  const replacement = element("input", { id: "enabled" }, modal);
  controller.afterRender();
  assert.equal(documentRef.activeElement, replacement);
  controller.beforeRender();
  modal.remove();
  controller.afterRender();
  assert.equal(documentRef.activeElement, nextTrigger);
});

test("xConfig traps both dialog tab boundaries and leaves native menu keyboard events alone", () => {
  const { documentRef, element, controller } = setup();
  const modal = element("section", { role: "dialog" });
  const first = element("button", { id: "first" }, modal);
  const disabled = element("button", {}, modal);
  disabled.disabled = true;
  const last = element("input", { id: "last" }, modal);
  const forward = key(last, "Tab");
  controller.handleKeydown(forward);
  assert.equal(forward.prevented, true);
  assert.equal(documentRef.activeElement, first);
  const backward = key(first, "Tab", true);
  controller.handleKeydown(backward);
  assert.equal(backward.prevented, true);
  assert.equal(documentRef.activeElement, last);
  const native = element("button", {}, documentRef.body);
  native.focus();
  controller.beforeRender();
  controller.afterRender();
  assert.equal(documentRef.activeElement, native);
  assert.equal(controller.handleKeydown(key(native, "Tab")), false);
});

test("xConfig tabs wrap with arrows and support Home and End", () => {
  const { documentRef, element, controller } = setup();
  const themes = element("button", { role: "tab", "data-adxconfig-tab": "themes" });
  const animations = element("button", { role: "tab", "data-adxconfig-tab": "animations" });
  let selected;
  themes.click = () => { selected = "themes"; };
  animations.click = () => { selected = "animations"; };
  for (const [target, value, expected] of [
    [themes, "ArrowLeft", animations], [animations, "ArrowRight", themes],
    [animations, "Home", themes], [themes, "End", animations],
  ]) {
    const event = key(target, value);
    assert.equal(controller.handleKeydown(event), true);
    assert.equal(event.prevented, true);
    assert.equal(documentRef.activeElement, expected);
    assert.equal(selected, expected.getAttribute("data-adxconfig-tab"));
  }
});


test("xConfig restores the import trigger after asynchronous file selection", () => {
  const { documentRef, element, controller } = setup();
  const trigger = element("button", { "data-adxconfig-action": "open-settings-import" });
  controller.rememberTrigger(trigger);
  documentRef.activeElement = documentRef.body;
  controller.beforeRender();
  const modal = element("section", { role: "dialog" });
  element("button", { id: "cancel" }, modal);
  controller.afterRender();
  controller.beforeRender();
  modal.remove();
  controller.afterRender();
  assert.equal(documentRef.activeElement, trigger);
});

test("xConfig retains focus on the export asset checkbox across a settings render", () => {
  const { documentRef, element, controller } = setup();
  const modal = element("section", { role: "dialog" });
  const input = element("input", { "data-adxconfig-transfer-include-assets": "true" }, modal);
  input.focus();
  controller.beforeRender();
  input.remove();
  const replacement = element("input", { "data-adxconfig-transfer-include-assets": "true" }, modal);
  controller.afterRender();
  assert.equal(documentRef.activeElement, replacement);
});
