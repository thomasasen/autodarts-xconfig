export const GAME_LAYOUT_MIN_WIDTH = 1180;
export const GAME_LAYOUT_MIN_HEIGHT = 650;
export const GAME_LAYOUT_MIN_LANDSCAPE_RATIO = 1.45;
export const GAME_LAYOUT_PADDING = 16;
export const GAME_LAYOUT_GAP = 16;
export const GAME_LAYOUT_PLAYER_GAP = 10;
export const GAME_LAYOUT_PLAYER_MIN_HEIGHT = 112;
export const GAME_LAYOUT_PLAYER_MAX_HEIGHT = 160;
export const GAME_LAYOUT_INACTIVE_SCALE = 0.6;
export const GAME_LAYOUT_TURN_HEIGHT = 128;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeIndex(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : fallback;
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

  const railWidth = clamp(width * 0.42, 480, 650);
  const playerViewportHeight = Math.max(
    0,
    height - GAME_LAYOUT_PADDING * 2 - GAME_LAYOUT_TURN_HEIGHT
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
  let firstVisibleIndex = requestedFirstVisible;
  if (activeIndex >= 0 && activeIndex < firstVisibleIndex) {
    firstVisibleIndex = activeIndex;
  } else if (activeIndex >= firstVisibleIndex + visiblePlayerCount) {
    firstVisibleIndex = activeIndex - visiblePlayerCount + 1;
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
