export const GAME_LAYOUT_MIN_WIDTH = 1180;
export const GAME_LAYOUT_MIN_HEIGHT = 650;
export const GAME_LAYOUT_MIN_LANDSCAPE_RATIO = 1.45;
export const GAME_LAYOUT_PADDING = 16;
export const GAME_LAYOUT_GAP = 16;
export const GAME_LAYOUT_PLAYER_GAP = 10;
export const GAME_LAYOUT_PLAYER_MIN_HEIGHT = 112;
export const GAME_LAYOUT_PLAYER_MAX_HEIGHT = 160;
export const GAME_LAYOUT_RAIL_MAX_WIDTH = 820;
export const GAME_LAYOUT_INACTIVE_SCALE = 0.6;
export const GAME_LAYOUT_TURN_HEIGHT = 144;
export const GAME_LAYOUT_TURN_PLAYER_GAP = 16;
export const GAME_LAYOUT_NAME_MIN_FONT_SIZE = 14;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeIndex(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : fallback;
}

export function rotatePlayersToActive(players = []) {
  const orderedPlayers = Array.isArray(players) ? [...players] : [];
  const activeIndexes = orderedPlayers.reduce((indexes, player, index) => {
    if (player?.active === true) indexes.push(index);
    return indexes;
  }, []);

  if (activeIndexes.length !== 1 || activeIndexes[0] === 0) {
    return orderedPlayers;
  }

  const activeIndex = activeIndexes[0];
  return [
    ...orderedPlayers.slice(activeIndex),
    ...orderedPlayers.slice(0, activeIndex),
  ];
}

export function resolveGameLayoutPlayerOrder(players = [], playerOrder = "fixed") {
  const orderedPlayers = Array.isArray(players) ? [...players] : [];
  return playerOrder === "active-first"
    ? rotatePlayersToActive(orderedPlayers)
    : orderedPlayers;
}

function normalizePlayerName(value) {
  return String(value ?? "").replaceAll(/\s+/g, " ").trim().toLocaleLowerCase();
}

export function resolveLegStarterSeat(snapshot, playerCount, visiblePlayerNames = []) {
  const count = Math.max(0, Math.trunc(Number(playerCount) || 0));
  const players = snapshot?.match?.players;
  if (!count || !Array.isArray(players) || players.length !== count) {
    return null;
  }

  const seats = players.map((player) => {
    const seat = player?.index;
    return typeof seat === "number" &&
      Number.isInteger(seat) &&
      seat >= 0 &&
      seat < count
      ? seat
      : null;
  });
  if (seats.includes(null) || new Set(seats).size !== count) {
    return null;
  }

  if (Array.isArray(visiblePlayerNames) && visiblePlayerNames.length === count) {
    for (let playerIndex = 0; playerIndex < players.length; playerIndex += 1) {
      const seat = seats[playerIndex];
      const matchName = normalizePlayerName(players[playerIndex]?.name);
      const visibleName = normalizePlayerName(visiblePlayerNames[seat]);
      if (!matchName || !visibleName || matchName !== visibleName) {
        return null;
      }
    }
  }

  return seats[0];
}

export function calculateFittedFontSize(options = {}) {
  const preferredFontSize = Math.max(0, Number(options.preferredFontSize) || 0);
  const minimumFontSize = Math.min(
    preferredFontSize,
    Math.max(0, Number(options.minimumFontSize) || 0)
  );
  const availableWidth = Math.max(0, Number(options.availableWidth) || 0);
  const availableHeight = Math.max(0, Number(options.availableHeight) || 0);
  const contentWidth = Math.max(0, Number(options.contentWidth) || 0);
  const contentHeight = Math.max(0, Number(options.contentHeight) || 0);

  if (!preferredFontSize || !availableWidth || !availableHeight || !contentWidth || !contentHeight) {
    return preferredFontSize;
  }

  const scale = Math.min(1, availableWidth / contentWidth, availableHeight / contentHeight);
  const fittedFontSize = Math.max(minimumFontSize, preferredFontSize * scale);
  return Math.floor(fittedFontSize * 4) / 4;
}

export function calculateClearRailRange(options = {}) {
  const railLeft = Number(options.railLeft) || 0;
  const railWidth = Math.max(0, Number(options.railWidth) || 0);
  const railTop = Number(options.railTop) || 0;
  const railBottom = Number(options.railBottom) || 0;
  const gap = Math.max(0, Number(options.gap) || 0);
  const railRight = railLeft + railWidth;
  let clearLeft = railLeft;

  for (const obstacle of options.obstacles || []) {
    const left = Number(obstacle?.left);
    const right = Number(obstacle?.right);
    const top = Number(obstacle?.top);
    const bottom = Number(obstacle?.bottom);
    if (![left, right, top, bottom].every(Number.isFinite)) continue;
    const overlapsVertically = top < railBottom && bottom > railTop;
    const overlapsRail = left < railRight && right > railLeft;
    if (overlapsVertically && overlapsRail) clearLeft = Math.max(clearLeft, right + gap);
  }

  clearLeft = Math.min(clearLeft, railRight);
  return {
    left: clearLeft,
    width: Math.max(0, railRight - clearLeft),
  };
}

export function calculateBoardFocusLayout(options = {}) {
  const width = Math.max(0, Number(options.width) || 0);
  const height = Math.max(0, Number(options.height) || 0);
  const playerCount = Math.max(0, Math.trunc(Number(options.playerCount) || 0));
  const supported =
    width >= GAME_LAYOUT_MIN_WIDTH &&
    height >= GAME_LAYOUT_MIN_HEIGHT &&
    width / height >= GAME_LAYOUT_MIN_LANDSCAPE_RATIO &&
    playerCount > 0;

  if (!supported) {
    return {
      supported: false,
      width,
      height,
      playerCount,
      firstVisibleIndex: 0,
      visiblePlayerCount: 0,
      playerHeight: 0,
      boardSize: 0,
      overflow: false,
    };
  }

  const railWidth = clamp(width * 0.42, 480, GAME_LAYOUT_RAIL_MAX_WIDTH);
  const playerViewportHeight = Math.max(
    0,
    height - GAME_LAYOUT_PADDING * 2 - GAME_LAYOUT_TURN_HEIGHT - GAME_LAYOUT_TURN_PLAYER_GAP
  );
  const requestedActiveIndex = Number(options.activeIndex);
  const hasActivePlayer = options.activeIndex == null ||
    !Number.isFinite(requestedActiveIndex) || requestedActiveIndex >= 0;
  const heightUnits = hasActivePlayer
    ? 1 + GAME_LAYOUT_INACTIVE_SCALE * Math.max(0, playerCount - 1)
    : playerCount;
  const fitHeight = playerCount > 0
    ? (playerViewportHeight - GAME_LAYOUT_PLAYER_GAP * (playerCount - 1)) / heightUnits
    : 0;
  const allPlayersFit = fitHeight >= GAME_LAYOUT_PLAYER_MIN_HEIGHT;
  const playerHeight = allPlayersFit
    ? Math.min(GAME_LAYOUT_PLAYER_MAX_HEIGHT, fitHeight)
    : GAME_LAYOUT_PLAYER_MIN_HEIGHT;
  const inactivePlayerHeight = hasActivePlayer
    ? playerHeight * GAME_LAYOUT_INACTIVE_SCALE
    : playerHeight;
  let visiblePlayerCount = playerCount;
  if (!allPlayersFit && hasActivePlayer) {
    visiblePlayerCount = Math.max(
      1,
      1 + Math.floor(
        (playerViewportHeight - GAME_LAYOUT_PLAYER_MIN_HEIGHT) /
          (GAME_LAYOUT_PLAYER_MIN_HEIGHT * GAME_LAYOUT_INACTIVE_SCALE + GAME_LAYOUT_PLAYER_GAP)
      )
    );
  } else if (!allPlayersFit) {
    visiblePlayerCount = Math.max(
      1,
      Math.floor(
        (playerViewportHeight + GAME_LAYOUT_PLAYER_GAP) /
          (GAME_LAYOUT_PLAYER_MIN_HEIGHT + GAME_LAYOUT_PLAYER_GAP)
      )
    );
  }
  const maximumFirstVisible = Math.max(0, playerCount - visiblePlayerCount);
  const requestedFirstVisible = clamp(
    normalizeIndex(options.firstVisibleIndex),
    0,
    maximumFirstVisible
  );
  const activeIndex = hasActivePlayer
    ? clamp(
        normalizeIndex(options.activeIndex, requestedFirstVisible),
        0,
        Math.max(0, playerCount - 1)
      )
    : -1;
  const pinActiveAtStart = options.pinActiveAtStart === true && activeIndex >= 0;
  let firstVisibleIndex = requestedFirstVisible;
  if (!pinActiveAtStart) {
    if (activeIndex >= 0 && activeIndex < firstVisibleIndex) {
      firstVisibleIndex = activeIndex;
    } else if (activeIndex >= firstVisibleIndex + visiblePlayerCount) {
      firstVisibleIndex = activeIndex - visiblePlayerCount + 1;
    }
  }
  firstVisibleIndex = clamp(firstVisibleIndex, 0, maximumFirstVisible);

  const boardAreaWidth = Math.max(
    0,
    width - GAME_LAYOUT_PADDING - railWidth - GAME_LAYOUT_GAP
  );
  const boardAreaHeight = Math.max(0, height - GAME_LAYOUT_PADDING);
  const boardSize = Math.min(boardAreaWidth, boardAreaHeight);
  const overflow = visiblePlayerCount < playerCount;
  const scrollThumbHeight = overflow
    ? Math.max(32, playerViewportHeight * (visiblePlayerCount / playerCount))
    : 0;
  const scrollThumbTravel = Math.max(0, playerViewportHeight - scrollThumbHeight);
  const scrollThumbOffset = overflow && maximumFirstVisible > 0
    ? scrollThumbTravel * (firstVisibleIndex / maximumFirstVisible)
    : 0;

  return {
    supported: true,
    width,
    height,
    playerCount,
    railWidth,
    playerViewportHeight,
    playerHeight,
    inactivePlayerHeight,
    visiblePlayerCount,
    firstVisibleIndex,
    maximumFirstVisible,
    activeIndex,
    pinActiveAtStart,
    overflow,
    boardSize,
    scrollThumbHeight,
    scrollThumbOffset,
  };
}

export function moveBoardFocusWindow(firstVisibleIndex, delta, playerCount, visiblePlayerCount) {
  const maximumFirstVisible = Math.max(0, Number(playerCount) - Number(visiblePlayerCount));
  if (!Number(delta)) {
    return clamp(normalizeIndex(firstVisibleIndex), 0, maximumFirstVisible);
  }
  return clamp(
    normalizeIndex(firstVisibleIndex) + (Number(delta) < 0 ? -1 : 1),
    0,
    maximumFirstVisible
  );
}
