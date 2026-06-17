export const PLAYER_CARD_PART_ATTRIBUTE = "data-ad-ext-player-card-part";

export const PLAYER_CARD_PARTS = Object.freeze({
  avatar: "avatar",
  flag: "flag",
  identityMedia: "identity-media",
  name: "name",
  profileBadge: "profile-badge",
  roundBadge: "round-badge",
  score: "score",
  stats: "stats",
});

const ROUND_BADGE_ANCESTOR_CLASSES = new Set(["css-1k3nd6z", "css-1cmgsw8"]);

function queryAll(rootNode, selector) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return [];
  }

  try {
    return Array.from(rootNode.querySelectorAll(selector));
  } catch (_) {
    return [];
  }
}

function setPart(node, partName) {
  if (!node || !partName || typeof node.setAttribute !== "function") {
    return null;
  }

  node.setAttribute(PLAYER_CARD_PART_ATTRIBUTE, partName);
  return node;
}

function hasAnyClass(node, classNames) {
  if (!node?.classList) {
    return false;
  }

  return classNames.some((className) => node.classList.contains(className));
}

function getTrimmedText(node) {
  if (!node || typeof node !== "object") {
    return "";
  }

  return String(node.textContent || "").trim();
}

function getAttributeText(node, attributeName) {
  if (!node || typeof node.getAttribute !== "function" || !attributeName) {
    return "";
  }

  return String(node.getAttribute(attributeName) || "").trim();
}

function normalizePlayerNameText(value) {
  return String(value || "")
    .trim()
    .replaceAll(/\s+/g, " ");
}

function normalizeComparablePlayerName(value) {
  return normalizePlayerNameText(value)
    .toLowerCase()
    .replaceAll(/[\s.]+/g, "");
}

function isLikelyTruncatedPlayerName(value) {
  const normalized = normalizePlayerNameText(value);
  return normalized.endsWith("..") || normalized.includes("\u2026");
}

function findClosestDescendant(rootNode, selector) {
  if (!rootNode || typeof rootNode.querySelector !== "function") {
    return null;
  }

  try {
    return rootNode.querySelector(selector);
  } catch (_) {
    return null;
  }
}

function getElementChildren(node) {
  return Array.from(node?.children || []).filter((child) => child?.nodeType === 1);
}

function hasMeaningfulText(node) {
  return getTrimmedText(node).length > 0;
}

function resolvePlayerNameTextNode(nameNode) {
  if (!nameNode) {
    return null;
  }

  return (
    getElementChildren(nameNode).find((child) => hasMeaningfulText(child)) ||
    findClosestDescendant(nameNode, "p") ||
    nameNode
  );
}

function resolvePlayerAvatarAltText(avatarNode) {
  if (!avatarNode) {
    return "";
  }

  const avatarImage =
    (avatarNode.matches?.("img") ? avatarNode : null) ||
    findClosestDescendant(avatarNode, "img");
  return normalizePlayerNameText(getAttributeText(avatarImage, "alt"));
}

function formatResolvedPlayerDisplayName(value) {
  const normalized = normalizePlayerNameText(value);
  return normalized ? normalized.toLocaleUpperCase() : "";
}

function setAttributeIfChanged(node, attributeName, value) {
  if (!node || typeof node.setAttribute !== "function" || !attributeName) {
    return;
  }

  if (node.getAttribute?.(attributeName) !== value) {
    node.setAttribute(attributeName, value);
  }
}

function maybeRestorePlayerDisplayName(nameNode, avatarNode) {
  if (!nameNode) {
    return;
  }

  const nameTextNode = resolvePlayerNameTextNode(nameNode);
  const visibleName = normalizePlayerNameText(getTrimmedText(nameTextNode));
  if (!visibleName || !isLikelyTruncatedPlayerName(visibleName)) {
    return;
  }

  const sourceCandidates = [
    getAttributeText(nameNode, "title"),
    getAttributeText(nameNode, "aria-label"),
    getAttributeText(nameTextNode, "title"),
    getAttributeText(nameTextNode, "aria-label"),
    resolvePlayerAvatarAltText(avatarNode),
  ]
    .map((value) => normalizePlayerNameText(value))
    .filter(Boolean);

  const visibleComparable = normalizeComparablePlayerName(visibleName);
  const resolvedSource = sourceCandidates.find((candidate) => {
    const comparableCandidate = normalizeComparablePlayerName(candidate);
    return comparableCandidate.length > visibleComparable.length;
  });
  if (!resolvedSource) {
    return;
  }

  const resolvedDisplayName = formatResolvedPlayerDisplayName(resolvedSource);
  if (!resolvedDisplayName) {
    return;
  }

  nameTextNode.textContent = resolvedDisplayName;
  setAttributeIfChanged(nameNode, "title", resolvedDisplayName);
  if (nameTextNode !== nameNode) {
    setAttributeIfChanged(nameTextNode, "title", resolvedDisplayName);
  }
}

function isRoundBadgeNode(node) {
  if (!node?.classList?.contains?.("css-3fr5p8")) {
    return false;
  }

  let current = node.parentNode || null;
  while (current?.nodeType === 1) {
    for (const className of ROUND_BADGE_ANCESTOR_CLASSES) {
      if (current.classList?.contains?.(className)) {
        return true;
      }
    }
    current = current.parentNode || null;
  }

  return false;
}

function findStatsNode(cardNode) {
  const statsTextNode = cardNode?.querySelector?.(".css-1j0bqop") || null;
  return statsTextNode?.parentNode?.nodeType === 1 ? statsTextNode.parentNode : statsTextNode;
}

function findScoreContainer(cardNode, scoreNode) {
  if (!cardNode || !scoreNode) {
    return null;
  }

  let current = scoreNode.parentNode || null;
  while (current?.nodeType === 1 && current !== cardNode) {
    if (
      current.parentNode?.classList?.contains?.("chakra-stack") &&
      current.parentNode.parentNode === cardNode
    ) {
      return current;
    }
    current = current.parentNode || null;
  }

  return null;
}

function findIdentityMediaNode(cardNode, avatarNode, flagNode) {
  const anchors = [avatarNode, flagNode].filter(Boolean);
  for (const anchorNode of anchors) {
    let current = anchorNode.parentNode || null;
    while (current?.nodeType === 1 && current !== cardNode) {
      if (
        current.classList?.contains?.("chakra-stack") &&
        current.querySelector?.(".chakra-avatar, .chakra-avatar__img, .chakra-image")
      ) {
        return current;
      }
      current = current.parentNode || null;
    }
  }

  return null;
}

export function clearPlayerCardPartMarkers(rootNode) {
  queryAll(rootNode, `[${PLAYER_CARD_PART_ATTRIBUTE}]`).forEach((node) => {
    node.removeAttribute?.(PLAYER_CARD_PART_ATTRIBUTE);
  });
}

export function markPlayerCardParts(cardNode) {
  if (!cardNode || typeof cardNode.querySelectorAll !== "function") {
    return {
      avatarNode: null,
      nameNode: null,
      profileBadgeNodes: [],
      roundBadgeNodes: [],
      scoreNode: null,
      statsNode: null,
    };
  }

  const rawScoreNode = cardNode.querySelector(".ad-ext-player-score");
  const scoreNode = setPart(rawScoreNode, PLAYER_CARD_PARTS.score);
  const scoreContainerNode = setPart(
    findScoreContainer(cardNode, rawScoreNode),
    PLAYER_CARD_PARTS.score
  );
  const nameNode = setPart(cardNode.querySelector(".ad-ext-player-name"), PLAYER_CARD_PARTS.name);
  const avatarNode = setPart(
    cardNode.querySelector(".chakra-avatar") || cardNode.querySelector(".chakra-avatar__img"),
    PLAYER_CARD_PARTS.avatar
  );
  maybeRestorePlayerDisplayName(nameNode, avatarNode);
  const flagNode = setPart(cardNode.querySelector(".chakra-image"), PLAYER_CARD_PARTS.flag);
  const identityMediaNode = setPart(
    findIdentityMediaNode(cardNode, avatarNode, flagNode),
    PLAYER_CARD_PARTS.identityMedia
  );
  const statsNode = setPart(findStatsNode(cardNode), PLAYER_CARD_PARTS.stats);
  const profileBadgeNodes = [];
  const roundBadgeNodes = [];

  queryAll(cardNode, ".chakra-badge, .css-3fr5p8").forEach((badgeNode) => {
    if (isRoundBadgeNode(badgeNode)) {
      roundBadgeNodes.push(setPart(badgeNode, PLAYER_CARD_PARTS.roundBadge));
      return;
    }

    if (badgeNode.classList?.contains?.("chakra-badge") || hasAnyClass(badgeNode, ["css-3fr5p8"])) {
      profileBadgeNodes.push(setPart(badgeNode, PLAYER_CARD_PARTS.profileBadge));
    }
  });

  return {
    avatarNode,
    flagNode,
    identityMediaNode,
    nameNode,
    profileBadgeNodes: profileBadgeNodes.filter(Boolean),
    roundBadgeNodes: roundBadgeNodes.filter(Boolean),
    scoreNode,
    scoreContainerNode,
    statsNode,
  };
}
