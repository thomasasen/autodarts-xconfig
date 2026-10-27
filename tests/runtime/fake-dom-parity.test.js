import test from "node:test";
import assert from "node:assert/strict";

import { isMatchNodeVisible } from "../../src/features/shared/x01-match-surface.js";
import {
  FakeDocument,
  FakeEvent,
  createFakeTimerHarness,
  createFakeWindow,
} from "./fake-dom.js";

test("fake DOM contract mirrors the Chromium behaviors used by runtime harnesses", () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const root = documentRef.createElement("section");
  const oldNode = documentRef.createElement("button");
  oldNode.className = "target old";
  root.appendChild(oldNode);
  documentRef.main.appendChild(root);

  const mutationBatches = [];
  const observer = new windowRef.MutationObserver((records) => {
    mutationBatches.push(records.map((record) => record.type));
  });
  observer.observe(root, { childList: true, subtree: true, attributes: true });

  const replacement = documentRef.createElement("button");
  replacement.className = "target replacement";
  replacement.__rect = { left: 0, top: 0, width: 20, height: 20 };
  root.replaceChildren(replacement);
  replacement.classList.add("active");
  documentRef.flushMutations([
    { type: "childList", target: root, addedNodes: [replacement], removedNodes: [oldNode] },
    { type: "attributes", target: replacement, attributeName: "class" },
  ]);

  const events = [];
  replacement.addEventListener("click", () => events.push("child"));
  root.addEventListener("click", () => events.push("parent"));
  replacement.dispatchEvent(new FakeEvent("click", { bubbles: true }));

  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  const order = [];
  windowRef.setTimeout(() => order.push("timeout"), 0);
  windowRef.requestAnimationFrame(() => order.push("raf"));
  timers.advance(0);
  timers.advance(16);

  function readVisibility(mutator, { connected = true, measurable = true } = {}) {
    const caseParent = documentRef.createElement("div");
    const caseNode = documentRef.createElement("button");
    caseNode.__rect = measurable
      ? { left: 0, top: 0, width: 20, height: 20 }
      : { left: 0, top: 0, width: 0, height: 0 };
    caseParent.appendChild(caseNode);
    if (connected) documentRef.main.appendChild(caseParent);
    mutator?.(caseNode, caseParent);
    return isMatchNodeVisible(caseNode, windowRef);
  }

  const visibilityMatrix = {
    visible: readVisibility(),
    ownHidden: readVisibility((node) => { node.hidden = true; }),
    ownAriaHidden: readVisibility((node) => node.setAttribute("aria-hidden", "true")),
    ownDisplayNone: readVisibility((node) => node.style.setProperty("display", "none")),
    ownVisibilityHidden: readVisibility((node) => node.style.setProperty("visibility", "hidden")),
    ownOpacityZero: readVisibility((node) => node.style.setProperty("opacity", "0")),
    parentHidden: readVisibility((_, parent) => { parent.hidden = true; }),
    parentAriaHidden: readVisibility((_, parent) => parent.setAttribute("aria-hidden", "true")),
    parentDisplayNone: readVisibility((_, parent) => parent.style.setProperty("display", "none")),
    parentVisibilityHidden: readVisibility((_, parent) => parent.style.setProperty("visibility", "hidden")),
    parentOpacityZero: readVisibility((_, parent) => parent.style.setProperty("opacity", "0")),
    disconnected: readVisibility(null, { connected: false }),
    zeroRect: readVisibility(null, { measurable: false }),
  };

  assert.deepEqual({
    mutationBatches,
    selectedClass: root.querySelector(".target.active")?.className,
    oldConnected: oldNode.isConnected,
    visibleBeforeHide: isMatchNodeVisible(replacement, windowRef),
    events,
    scheduledCallbacks: [...order].sort(),
    visibilityMatrix,
  }, {
    mutationBatches: [["childList", "attributes"]],
    selectedClass: "target replacement active",
    oldConnected: false,
    visibleBeforeHide: true,
    events: ["child", "parent"],
    scheduledCallbacks: ["raf", "timeout"],
    visibilityMatrix: {
      visible: true,
      ownHidden: false,
      ownAriaHidden: false,
      ownDisplayNone: false,
      ownVisibilityHidden: false,
      ownOpacityZero: false,
      parentHidden: false,
      parentAriaHidden: false,
      parentDisplayNone: false,
      parentVisibilityHidden: false,
      parentOpacityZero: false,
      disconnected: false,
      zeroRect: false,
    },
  });

  replacement.hidden = true;
  assert.equal(isMatchNodeVisible(replacement, windowRef), false);
});
