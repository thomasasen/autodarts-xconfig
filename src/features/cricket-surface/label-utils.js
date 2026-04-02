const MAX_INFERRED_DOM_LABEL_TEXT_LENGTH = 24;

export function normalizeCricketLabelValue(cricketRules, value) {
  if (!cricketRules || typeof cricketRules.normalizeCricketLabel !== "function") {
    return "";
  }

  return cricketRules.normalizeCricketLabel(value);
}

export function normalizeCricketLabelNode(cricketRules, node) {
  const explicitLabel =
    node?.getAttribute?.("data-row-label") || node?.getAttribute?.("data-target-label") || "";
  if (explicitLabel) {
    return normalizeCricketLabelValue(cricketRules, explicitLabel);
  }

  const textContent = String(node?.textContent || "").replace(/\s+/g, " ").trim();
  if (!textContent || textContent.length > MAX_INFERRED_DOM_LABEL_TEXT_LENGTH) {
    return "";
  }

  return normalizeCricketLabelValue(cricketRules, textContent);
}

export function getClassTokens(node) {
  if (!node || typeof node !== "object") {
    return [];
  }

  const listTokens =
    typeof node.classList?.toArray === "function"
      ? node.classList.toArray()
      : Array.isArray(node.classList)
        ? node.classList
        : null;
  if (Array.isArray(listTokens) && listTokens.length > 0) {
    return listTokens.filter(Boolean).map((entry) => String(entry).trim()).filter(Boolean);
  }

  const className = String(node.className || node.getAttribute?.("class") || "").trim();
  if (!className) {
    return [];
  }

  return className.split(/\s+/).filter(Boolean);
}
