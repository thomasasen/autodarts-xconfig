import { test, expect } from "@playwright/test";
import { isMatchNodeVisible } from "../src/features/shared/x01-match-surface.js";

test("Chromium matches the runtime fake-DOM contract", async ({ page }) => {
  await page.setContent("<!doctype html><main></main>");
  await page.addScriptTag({
    content: `window.__xconfigIsMatchNodeVisible = (${isMatchNodeVisible.toString()});`,
  });
  const result = await page.evaluate(async () => {
    const root = document.createElement("section");
    const oldNode = document.createElement("button");
    oldNode.className = "target old";
    root.appendChild(oldNode);
    document.querySelector("main").appendChild(root);

    const mutationBatches = [];
    const observer = new MutationObserver((records) => {
      mutationBatches.push(records.map((record) => record.type));
    });
    observer.observe(root, { childList: true, subtree: true, attributes: true });

    const replacement = document.createElement("button");
    replacement.className = "target replacement";
    replacement.style.cssText = "display:block;width:20px;height:20px";
    root.replaceChildren(replacement);
    replacement.classList.add("active");
    await Promise.resolve();

    const events = [];
    replacement.addEventListener("click", () => events.push("child"));
    root.addEventListener("click", () => events.push("parent"));
    replacement.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const order = [];
    setTimeout(() => order.push("timeout"), 0);
    requestAnimationFrame(() => order.push("raf"));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const visibleBeforeHide = !replacement.hidden && replacement.getClientRects().length > 0 &&
      getComputedStyle(replacement).visibility !== "hidden";
    replacement.hidden = true;
    const visibleAfterHide = !replacement.hidden && replacement.getClientRects().length > 0 &&
      getComputedStyle(replacement).visibility !== "hidden";

    function readVisibility(mutator, { connected = true, measurable = true } = {}) {
      const caseParent = document.createElement("div");
      const caseNode = document.createElement("button");
      caseNode.style.display = "block";
      caseNode.style.padding = "0";
      caseNode.style.border = "0";
      caseNode.style.width = measurable ? "20px" : "0";
      caseNode.style.height = measurable ? "20px" : "0";
      caseParent.appendChild(caseNode);
      if (connected) document.querySelector("main").appendChild(caseParent);
      mutator?.(caseNode, caseParent);
      return window.__xconfigIsMatchNodeVisible(caseNode, window);
    }

    const visibilityMatrix = {
      visible: readVisibility(),
      ownHidden: readVisibility((node) => { node.hidden = true; }),
      ownAriaHidden: readVisibility((node) => node.setAttribute("aria-hidden", "true")),
      ownDisplayNone: readVisibility((node) => { node.style.display = "none"; }),
      ownVisibilityHidden: readVisibility((node) => { node.style.visibility = "hidden"; }),
      ownOpacityZero: readVisibility((node) => { node.style.opacity = "0"; }),
      parentHidden: readVisibility((_, caseParent) => { caseParent.hidden = true; }),
      parentAriaHidden: readVisibility((_, caseParent) => caseParent.setAttribute("aria-hidden", "true")),
      parentDisplayNone: readVisibility((_, caseParent) => { caseParent.style.display = "none"; }),
      parentVisibilityHidden: readVisibility((_, caseParent) => { caseParent.style.visibility = "hidden"; }),
      parentOpacityZero: readVisibility((_, caseParent) => { caseParent.style.opacity = "0"; }),
      disconnected: readVisibility(null, { connected: false }),
      zeroRect: readVisibility(null, { measurable: false }),
    };
    observer.disconnect();

    return {
      mutationBatches,
      selectedClass: root.querySelector(".target.active")?.className,
      oldConnected: oldNode.isConnected,
      visibleBeforeHide,
      visibleAfterHide,
      events,
      scheduledCallbacks: [...order].sort(),
      visibilityMatrix,
    };
  });

  expect(result).toEqual({
    mutationBatches: [["childList", "attributes"]],
    selectedClass: "target replacement active",
    oldConnected: false,
    visibleBeforeHide: true,
    visibleAfterHide: false,
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
});
