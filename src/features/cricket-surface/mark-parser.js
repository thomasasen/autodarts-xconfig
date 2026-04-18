export function parseTextMarkValue(value, cricketRules) {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return null;
  }

  const hasExplicitMarkToken = (() => {
    if (/[/Xx\u2A02\u2297\u29BB|\u2715\u2716\u2573]/u.test(rawValue)) {
      return true;
    }
    if (/^(?:0|1|2|3)$/.test(rawValue)) {
      return true;
    }
    return /(^|\D)(?:0|1|2|3)(\D|$)/.test(rawValue);
  })();
  if (!hasExplicitMarkToken) {
    return null;
  }

  if (cricketRules && typeof cricketRules.parseCricketMarkValue === "function") {
    const parsed = cricketRules.parseCricketMarkValue(rawValue);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return typeof cricketRules.clampMarks === "function" ? cricketRules.clampMarks(parsed) : parsed;
  }

  const numeric = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.max(0, Math.min(3, numeric));
}

export function parseMarksValue(node, cricketRules, options = {}) {
  if (!node) {
    return 0;
  }
  const countMultipleIcons = options.countMultipleIcons !== false;

  const readMark = (value) => {
    const parsed = parseTextMarkValue(value, cricketRules);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const directCandidates = [];
  if (typeof node.getAttribute === "function") {
    directCandidates.push(
      node.getAttribute("data-marks"),
      node.getAttribute("data-mark"),
      node.getAttribute("data-hits"),
      node.getAttribute("data-hit"),
      node.getAttribute("aria-label"),
      node.getAttribute("title"),
      node.getAttribute("alt")
    );
  }
  for (const candidate of directCandidates) {
    const parsed = readMark(candidate);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (typeof node.querySelectorAll === "function") {
    const icons = Array.from(
      node.querySelectorAll(
        "img[alt], img[title], [data-marks], [data-mark], [data-hits], [data-hit], [aria-label], [title]"
      )
    );
    if (icons.length > 0) {
      const parsedIconValue = icons
        .map((icon) => {
          return readMark(
            icon?.getAttribute?.("data-marks") ||
              icon?.getAttribute?.("data-mark") ||
              icon?.getAttribute?.("data-hits") ||
              icon?.getAttribute?.("data-hit") ||
              icon?.getAttribute?.("aria-label") ||
              icon?.getAttribute?.("title") ||
              icon?.getAttribute?.("alt") ||
              ""
          );
        })
        .find((value) => Number.isFinite(value));
      if (Number.isFinite(parsedIconValue)) {
        return parsedIconValue;
      }
      if (countMultipleIcons && icons.length > 1) {
        if (typeof cricketRules?.clampMarks === "function") {
          return cricketRules.clampMarks(icons.length);
        }
        return Math.max(0, Math.min(3, icons.length));
      }
    }
  }

  const textValue = readMark(node.textContent || "");
  return Number.isFinite(textValue) ? textValue : 0;
}

export function readCellPlayerIndex(cellNode, options = {}) {
  if (!cellNode || typeof cellNode.getAttribute !== "function") {
    return null;
  }
  const includeColumnIndex = options.includeColumnIndex === true;

  const candidates = [
    cellNode.getAttribute("data-player-index"),
    cellNode.getAttribute("data-player"),
    cellNode.dataset?.playerIndex,
    cellNode.dataset?.player,
  ];
  if (includeColumnIndex) {
    candidates.splice(1, 0, cellNode.getAttribute("data-column-index"));
    candidates.splice(4, 0, cellNode.dataset?.columnIndex);
  }

  for (const candidate of candidates) {
    const parsed = Number.parseInt(String(candidate || "").trim(), 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return null;
}
