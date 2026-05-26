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
