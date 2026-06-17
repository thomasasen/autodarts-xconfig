import { animateArrowNode } from "../avg-trend-arrow/logic.js";
import {
  ANIMATE_CLASS,
  DOWN_CLASS,
  UP_CLASS,
  VISIBLE_CLASS,
  resolveAvgTrendArrowDuration,
} from "../avg-trend-arrow/style.js";
import { AVG_TREND_PREVIEW_SELECTOR } from "./avg-trend-preview-contract.js";

function resolvePreviewDuration(context = {}) {
  if (context.settingKey === "durationMs") {
    return resolveAvgTrendArrowDuration(context.settingValue);
  }
  return resolveAvgTrendArrowDuration(context.feature?.config?.durationMs);
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

function startAvgTrendArrowPreview(context = {}) {
  const optionNode = context.optionNode || null;
  const arrowNode = optionNode?.querySelector?.(AVG_TREND_PREVIEW_SELECTOR) || null;
  const timeoutByArrow = new Map();
  const durationMs = resolvePreviewDuration(context);

  resetArrowNode(arrowNode, timeoutByArrow);
  if (arrowNode?.style) {
    arrowNode.style.setProperty("--ad-xconfig-avg-trend-preview-duration", `${durationMs}ms`);
  }
  animateArrowNode(arrowNode, durationMs, timeoutByArrow);

  return () => {
    resetArrowNode(arrowNode, timeoutByArrow);
  };
}

export function createAvgTrendArrowPreviewAdapter() {
  return {
    prefix: "avg-trend-arrow-",
    matches: (previewEffect) => String(previewEffect || "").startsWith("avg-trend-arrow-"),
    start: startAvgTrendArrowPreview,
  };
}
