import { animateArrowNode } from "../average-trend-arrow/logic.js";
import {
  ANIMATE_CLASS,
  DOWN_CLASS,
  UP_CLASS,
  VISIBLE_CLASS,
  resolveAverageTrendArrowDuration,
} from "../average-trend-arrow/style.js";
import { AVERAGE_TREND_PREVIEW_SELECTOR } from "./average-trend-preview-contract.js";

function resolvePreviewDuration(context = {}) {
  if (context.settingKey === "durationMs") {
    return resolveAverageTrendArrowDuration(context.settingValue);
  }
  return resolveAverageTrendArrowDuration(context.feature?.config?.durationMs);
}

function resetArrowNode(arrowNode, timeoutByArrow) {
  if (!arrowNode?.classList) {
    return;
  }
  const timeout = timeoutByArrow.get(arrowNode);
  if (timeout) {
    clearTimeout(timeout);
    timeoutByArrow.delete(arrowNode);
  }
  arrowNode.classList.remove(ANIMATE_CLASS, DOWN_CLASS);
  arrowNode.classList.add(VISIBLE_CLASS, UP_CLASS);
}

export function createAverageTrendArrowPreviewAdapter() {
  function start(context = {}) {
    const optionNode = context.optionNode || null;
    const arrowNode = optionNode?.querySelector?.(AVERAGE_TREND_PREVIEW_SELECTOR) || null;
    const timeoutByArrow = new Map();
    const durationMs = resolvePreviewDuration(context);

    resetArrowNode(arrowNode, timeoutByArrow);
    if (arrowNode?.style) {
      arrowNode.style.setProperty("--ad-xconfig-average-trend-preview-duration", `${durationMs}ms`);
    }
    animateArrowNode(arrowNode, durationMs, timeoutByArrow);

    return () => {
      resetArrowNode(arrowNode, timeoutByArrow);
    };
  }

  return {
    prefix: "average-trend-arrow-",
    matches: (previewEffect) => String(previewEffect || "").startsWith("average-trend-arrow-"),
    start,
  };
}
