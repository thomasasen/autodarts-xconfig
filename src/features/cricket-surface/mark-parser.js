const MARK_ICON_SELECTOR =
  "img[alt], img[title], [data-marks], [data-mark], [data-hits], [data-hit], [aria-label], [title]";
const MARK_SYMBOL_PATTERN = /[/Xx\u2A02\u2297\u29BB|\u2715\u2716\u2573]/u;
const STANDALONE_MARK_DIGIT_PATTERN = /(^|\D)[0-3](\D|$)/;

function clampMarkCount(value, cricketRules) {
  if (typeof cricketRules?.clampMarks === "function") {
    return cricketRules.clampMarks(value);
  }
  return Math.max(0, Math.min(3, Number(value) || 0));
}

function hasExplicitMarkToken(rawValue) {
  return (
    MARK_SYMBOL_PATTERN.test(rawValue) ||
    /^[0-3]$/.test(rawValue) ||
    STANDALONE_MARK_DIGIT_PATTERN.test(rawValue)
  );
}

function parseMarkCandidate(value, cricketRules) {
  const parsed = parseTextMarkValue(value, cricketRules);
  return Number.isFinite(parsed) ? parsed : null;
}

function readAttributeValue(node, name) {
  if (!node || typeof node.getAttribute !== "function") {
    return null;
  }
  return node.getAttribute(name);
}

function readDirectMarkCandidates(node) {
  return [
    node?.dataset?.marks,
    node?.dataset?.mark,
    node?.dataset?.hits,
    node?.dataset?.hit,
    readAttributeValue(node, "aria-label"),
    readAttributeValue(node, "title"),
    readAttributeValue(node, "alt"),
  ];
}

function readIconMarkValue(icon, cricketRules) {
  const candidates = readDirectMarkCandidates(icon);
  return candidates
    .map((candidate) => parseMarkCandidate(candidate, cricketRules))
    .find((value) => Number.isFinite(value));
}

function parseMarksFromDirectCandidates(node, cricketRules) {
  return readDirectMarkCandidates(node)
    .map((candidate) => parseMarkCandidate(candidate, cricketRules))
    .find((value) => Number.isFinite(value));
}

function parseMarksFromIcons(node, cricketRules, countMultipleIcons) {
  if (typeof node?.querySelectorAll !== "function") {
    return null;
  }

  const icons = Array.from(node.querySelectorAll(MARK_ICON_SELECTOR));
  if (!icons.length) {
    return null;
  }

  const parsedIconValue = icons
    .map((icon) => readIconMarkValue(icon, cricketRules))
    .find((value) => Number.isFinite(value));
  if (Number.isFinite(parsedIconValue)) {
    return parsedIconValue;
  }

  if (countMultipleIcons && icons.length > 1) {
    return clampMarkCount(icons.length, cricketRules);
  }

  return null;
}

function parseIndexCandidate(value) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function parseTextMarkValue(value, cricketRules) {
  const rawValue = String(value || "").trim();
  if (!rawValue || !hasExplicitMarkToken(rawValue)) {
    return null;
  }

  if (cricketRules && typeof cricketRules.parseCricketMarkValue === "function") {
    const parsed = cricketRules.parseCricketMarkValue(rawValue);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return clampMarkCount(parsed, cricketRules);
  }

  const numeric = Number.parseInt(rawValue, 10);
  return Number.isFinite(numeric) ? clampMarkCount(numeric, cricketRules) : null;
}

export function parseMarksValue(node, cricketRules, options = {}) {
  if (!node) {
    return 0;
  }

  const countMultipleIcons = options.countMultipleIcons !== false;
  const directValue = parseMarksFromDirectCandidates(node, cricketRules);
  if (Number.isFinite(directValue)) {
    return directValue;
  }

  const iconValue = parseMarksFromIcons(node, cricketRules, countMultipleIcons);
  if (Number.isFinite(iconValue)) {
    return iconValue;
  }

  const textValue = parseMarkCandidate(node.textContent || "", cricketRules);
  return Number.isFinite(textValue) ? textValue : 0;
}

export function readCellPlayerIndex(cellNode, options = {}) {
  if (!cellNode) {
    return null;
  }

  const includeColumnIndex = options.includeColumnIndex === true;
  const candidates = [
    cellNode.dataset?.playerIndex,
    cellNode.dataset?.player,
  ];
  if (includeColumnIndex) {
    candidates.splice(1, 0, cellNode.dataset?.columnIndex);
  }

  for (const candidate of candidates) {
    const parsed = parseIndexCandidate(candidate);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}
