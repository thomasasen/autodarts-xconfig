import {
  DEFAULT_GAME_LAYOUT_PLAYER_TRANSITION_EFFECT,
  getGameLayoutPlayerTransitionProfile,
  normalizeGameLayoutPlayerTransitionEffect,
} from "../../../shared/game-layout-transition-profiles.js";

const DEFAULT_PROFILE = getGameLayoutPlayerTransitionProfile(
  DEFAULT_GAME_LAYOUT_PLAYER_TRANSITION_EFFECT
);
const DEFAULT_DURATION_MS = DEFAULT_PROFILE.durationMs;
const DEFAULT_EASING = DEFAULT_PROFILE.easing;
const MIN_SCALE = 0.35;
const MAX_SCALE = 2.85;

function readNumber(value) {
  const number = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(number) ? number : null;
}

function readLayoutRect(root, item, preferRenderedGeometry = false) {
  const rootRect = root?.getBoundingClientRect?.() || {};
  const itemRect = item?.getBoundingClientRect?.() || {};
  const playerY = readNumber(item?.style?.getPropertyValue?.("--ad-game-layout-player-y"));
  const cardHeight = readNumber(
    item?.style?.getPropertyValue?.("--ad-game-layout-card-height")
  );
  const railWidth = readNumber(
    root?.style?.getPropertyValue?.("--ad-game-layout-rail-width")
  );

  const rendered = {
    left: Number(itemRect.left) - Number(rootRect.left || 0),
    top: Number(itemRect.top) - Number(rootRect.top || 0),
    width: Number(itemRect.width),
    height: Number(itemRect.height),
  };
  const renderedScaleX = railWidth ? validateScale(rendered.width / railWidth) : 1;
  const renderedScaleY = cardHeight ? validateScale(rendered.height / cardHeight) : 1;
  if (
    preferRenderedGeometry &&
    Number.isFinite(rendered.left) &&
    Number.isFinite(rendered.top) &&
    rendered.width > 0 &&
    rendered.height > 0 &&
    renderedScaleX !== null &&
    renderedScaleY !== null
  ) {
    return rendered;
  }

  const fallback = {
    left: Number.isFinite(rendered.left) ? rendered.left : 0,
    top: playerY ?? rendered.top,
    width: railWidth ?? rendered.width,
    height: cardHeight ?? rendered.height,
  };
  if (
    !Number.isFinite(fallback.left) ||
    !Number.isFinite(fallback.top) ||
    !Number.isFinite(fallback.width) ||
    !Number.isFinite(fallback.height) ||
    fallback.width <= 0 ||
    fallback.height <= 0
  ) {
    return null;
  }
  return fallback;
}

function capturePlayers(root, players, preferRenderedGeometry = false) {
  const snapshot = new Map();
  players.forEach((player) => {
    const item = player?.item;
    if (!item) return;
    snapshot.set(item, {
      rect: readLayoutRect(root, item, preferRenderedGeometry),
      parent: item.parentElement || null,
      visible: item.getAttribute?.("data-ad-ext-game-layout-visible") !== "false",
    });
  });
  return snapshot;
}

function validateScale(value) {
  if (!Number.isFinite(value) || value < MIN_SCALE || value > MAX_SCALE) {
    return null;
  }
  return value;
}

function hasReducedMotion(windowRef) {
  try {
    return windowRef?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  } catch (_) {
    return false;
  }
}

function interpolate(value, progress) {
  return 1 + (value - 1) * progress;
}

export function buildGameLayoutPlayerTransitionKeyframes(options = {}) {
  const dx = Number(options.dx) || 0;
  const dy = Number(options.dy) || 0;
  const scaleX = Number(options.scaleX) || 1;
  const scaleY = Number(options.scaleY) || 1;
  const effect = normalizeGameLayoutPlayerTransitionEffect(options.effect);
  const profile = getGameLayoutPlayerTransitionProfile(effect);
  const base = [
    {
      transformOrigin: "top left",
      transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scaleX}, ${scaleY})`,
    },
    {
      transformOrigin: "top left",
      transform: "translate3d(0px, 0px, 0) scale(1, 1)",
    },
  ];

  if (
    effect !== "lane-flip" ||
    options.movingDown !== true ||
    !Number.isFinite(profile.laneOffsetPx) ||
    profile.laneOffsetPx === 0
  ) {
    return base;
  }

  const progress = 0.56;
  return [
    base[0],
    {
      offset: progress,
      transformOrigin: "top left",
      transform: `translate3d(${profile.laneOffsetPx}px, ${dy * (1 - progress)}px, 0) scale(${interpolate(scaleX, 1 - progress)}, ${interpolate(scaleY, 1 - progress)})`,
    },
    base[1],
  ];
}

export function createGameLayoutPlayerTransitionController(options = {}) {
  const windowRef =
    options.windowRef || (globalThis.window !== undefined ? globalThis.window : null);
  const durationOverride = Number(options.duration);
  const easingOverride = String(options.easing || "").trim();
  const animations = new Map();

  function removeMarker(item) {
    item?.removeAttribute?.("data-ad-ext-game-layout-transitioning");
    item?.removeAttribute?.("data-ad-ext-game-layout-transition-effect");
  }

  function cancel() {
    animations.forEach((animation, item) => {
      try {
        animation?.cancel?.();
      } catch (_) {
        // A detached host node must not break layout recovery.
      }
      removeMarker(item);
    });
    animations.clear();
  }

  function capture(root, players) {
    const list = Array.isArray(players) ? players : [];
    const preferRenderedGeometry = animations.size > 0;
    const snapshot = capturePlayers(root, list, preferRenderedGeometry);
    cancel();
    return snapshot;
  }

  function animate({
    root,
    players,
    before,
    enabled = true,
    effect = DEFAULT_GAME_LAYOUT_PLAYER_TRANSITION_EFFECT,
  } = {}) {
    const list = Array.isArray(players) ? players : [];
    const normalizedEffect = normalizeGameLayoutPlayerTransitionEffect(effect);
    const profile = getGameLayoutPlayerTransitionProfile(normalizedEffect);
    const duration = Math.max(
      0,
      Number.isFinite(durationOverride) && durationOverride > 0
        ? durationOverride
        : profile.durationMs
    );
    const easing = easingOverride || profile.easing;
    if (
      enabled !== true ||
      !root ||
      !before ||
      !list.length ||
      duration <= 0 ||
      hasReducedMotion(windowRef)
    ) {
      return false;
    }

    const after = capturePlayers(root, list);
    if (after.size !== before.size || after.size !== list.length) {
      return false;
    }

    const transitions = [];
    for (const player of list) {
      const item = player?.item;
      const previous = before.get(item);
      const next = after.get(item);
      if (
        !item ||
        !previous?.rect ||
        !next?.rect ||
        previous.parent !== next.parent ||
        previous.visible !== next.visible
      ) {
        return false;
      }
      if (!next.visible) continue;
      if (item.isConnected === false || typeof item.animate !== "function") return false;

      const dx = previous.rect.left - next.rect.left;
      const dy = previous.rect.top - next.rect.top;
      const scaleX = validateScale(previous.rect.width / next.rect.width);
      const scaleY = validateScale(previous.rect.height / next.rect.height);
      if (scaleX === null || scaleY === null) return false;

      if (
        Math.abs(dx) < 0.5 &&
        Math.abs(dy) < 0.5 &&
        Math.abs(scaleX - 1) < 0.005 &&
        Math.abs(scaleY - 1) < 0.005
      ) {
        continue;
      }

      transitions.push({
        item,
        dx,
        dy,
        scaleX,
        scaleY,
        movingDown: next.rect.top > previous.rect.top + 0.5,
      });
    }

    if (!transitions.length) return false;

    for (const { item, dx, dy, scaleX, scaleY, movingDown } of transitions) {
      item.setAttribute?.("data-ad-ext-game-layout-transitioning", "true");
      item.setAttribute?.("data-ad-ext-game-layout-transition-effect", normalizedEffect);
      let animation = null;
      try {
        animation = item.animate(
          buildGameLayoutPlayerTransitionKeyframes({
            dx,
            dy,
            scaleX,
            scaleY,
            effect: normalizedEffect,
            movingDown,
          }),
          {
            duration,
            easing,
            fill: "none",
          }
        );
      } catch (_) {
        removeMarker(item);
        cancel();
        return false;
      }

      animations.set(item, animation);
      const finish = () => {
        if (animations.get(item) !== animation) return;
        animations.delete(item);
        removeMarker(item);
      };
      animation.onfinish = finish;
      animation.oncancel = finish;
    }

    return true;
  }

  return {
    capture,
    animate,
    cancel,
    isRunning: () => animations.size > 0,
  };
}

export const GAME_LAYOUT_PLAYER_TRANSITION_DURATION_MS = DEFAULT_DURATION_MS;
export const GAME_LAYOUT_PLAYER_TRANSITION_EASING = DEFAULT_EASING;
