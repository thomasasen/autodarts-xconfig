import { createFeatureMountHarness } from "../shared/feature-mount-harness.js";
import { findBoardPresentationSurface } from "../../shared/board-presentation-surface.js";
import { isThemeGameContextActive } from "../themes/shared/theme-utils.js";
import { buildLiveBoardFilter, createLiveBoardFilterDefinition } from "./logic.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const ID = "ad-xconfig-live-image-filter";

export function mountLiveBoardEnhancement(context = {}) {
  let image = null;
  let original = null;
  let applied = "";
  let defs = null;
  let supported = null;
  const config = () => context.config?.getFeatureConfig?.("liveBoardEnhancement") || {};
  const clear = () => {
    if (image?.style.getPropertyValue("filter") === applied) {
      if (original.value) image.style.setProperty("filter", original.value, original.priority);
      else image.style.removeProperty("filter");
    }
    image = null;
    original = null;
    applied = "";
    defs?.remove();
    defs = null;
  };
  const healthy = () => !image || (image.isConnected && defs?.isConnected && image.style.getPropertyValue("filter") === applied);
  const harness = createFeatureMountHarness(context, { update, checkHealth: healthy, repairHealth: () => { update(); return healthy(); } });
  if (!harness) return () => {};
  const { documentRef, windowRef } = harness;
  function update() {
    const settings = config();
    const next = isThemeGameContextActive({ documentRef, windowRef }) ? findBoardPresentationSurface(documentRef)?.image : null;
    const strength = Number(settings.intensity ?? 30);
    if (supported === null) {
      supported = Boolean(documentRef.createElementNS?.(SVG_NS, "feConvolveMatrix")) && windowRef?.CSS?.supports?.("filter", `url("#${ID}")`) !== false;
    }
    if (!settings.enabled || !strength || !next || !supported) { clear(); return; }
    if (next !== image) {
      clear();
      image = next;
      original = { value: image.style.getPropertyValue("filter"), priority: image.style.getPropertyPriority("filter") };
      original.base = original.value || windowRef?.getComputedStyle?.(image)?.filter || "";
    }
    if (applied && image.style.getPropertyValue("filter") !== applied) {
      const external = image.style.getPropertyValue("filter");
      if (!external.includes(ID)) {
        original = { value: external, priority: image.style.getPropertyPriority("filter"), base: external || "" };
      }
    }
    if (!defs?.isConnected) {
      defs = createLiveBoardFilterDefinition(documentRef, ID, strength);
      documentRef.body.appendChild(defs);
    }
    const values = buildLiveBoardFilter(strength);
    const kernel = defs.querySelector("feConvolveMatrix");
    if (kernel.getAttribute("kernelMatrix") !== values.kernel) kernel.setAttribute("kernelMatrix", values.kernel);
    for (const func of defs.querySelectorAll("feFuncR,feFuncG,feFuncB")) {
      if (func.getAttribute("exponent") !== values.gamma) func.setAttribute("exponent", values.gamma);
    }
    const base = original.base === "none" ? "" : original.base;
    applied = `${base} url("#${ID}") contrast(${values.contrast})`.trim();
    if (image.style.getPropertyValue("filter") !== applied) image.style.setProperty("filter", applied, "important");
  }
  harness.registerObserver({ key: "live-board-enhancement:dom", observeOptions: { childList: true, subtree: true } });
  harness.subscribeToGameState();
  harness.schedule();
  return harness.createCleanup(clear);
}
