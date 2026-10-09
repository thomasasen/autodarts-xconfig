const END_EVENT_PADDING_MS = 100;

function cssTimeMs(value) {
  const token = String(value || "").trim();
  const amount = Number.parseFloat(token);
  if (!Number.isFinite(amount)) return 0;
  return token.endsWith("ms") ? amount : amount * 1000;
}

function transitionRemainingMs(target, windowRef) {
  let style;
  try {
    style = windowRef?.getComputedStyle?.(target);
  } catch (_) {
    // Use the longest shipped zoom transition when computed styles are unavailable.
  }
  if (!style?.transitionProperty || !style?.transitionDuration) return 300;
  const properties = style.transitionProperty.split(",").map((value) => value.trim());
  const durations = style.transitionDuration.split(",").map(cssTimeMs);
  const delays = String(style.transitionDelay || "0s").split(",").map(cssTimeMs);
  let remaining = 0;
  properties.forEach((property, index) => {
    if (property === "all" || property === "transform") {
      remaining = Math.max(0, durations[index % durations.length] + delays[index % delays.length]);
    }
  });
  return remaining;
}

function hasRunningTransformTransition(target) {
  try {
    return Array.from(target.getAnimations?.() || []).some((animation) =>
      animation.transitionProperty === "transform" &&
      (!animation.effect?.target || animation.effect.target === target) &&
      (animation.playState === "running" || animation.pending === true)
    );
  } catch (_) {
    return false;
  }
}

// Tracks only native transform transitions. No feature restart or persistent polling.
export function createZoomTransitionTracker({ documentRef, windowRef, scheduleUpdate }) {
  const targets = new Map();
  let frame = null;
  const now = () => windowRef?.performance?.now?.() ?? Date.now();
  const hidden = () => documentRef.hidden === true || documentRef.visibilityState === "hidden";

  function pause() {
    if (frame !== null) windowRef?.cancelAnimationFrame?.(frame);
    frame = null;
  }

  function prune() {
    const timestamp = now();
    targets.forEach((deadline, target) => {
      if (target.isConnected === false ||
          (timestamp >= deadline && !hasRunningTransformTransition(target))) {
        targets.delete(target);
      }
    });
  }

  function requestFrame() {
    if (frame === null && targets.size && !hidden()) {
      frame = windowRef?.requestAnimationFrame?.(tick) ?? null;
    }
  }

  function tick() {
    frame = null;
    if (hidden()) return;
    prune();
    scheduleUpdate();
    requestFrame();
  }

  return {
    start(event) {
      const target = event.target;
      if (!target || target.isConnected === false) return;
      targets.set(target, now() + transitionRemainingMs(target, windowRef) + END_EVENT_PADDING_MS);
      scheduleUpdate();
      requestFrame();
    },
    finish(event) {
      if (event?.propertyName !== "transform" || !targets.delete(event.target)) return;
      if (!targets.size) pause();
      scheduleUpdate();
    },
    visibilityChanged() {
      pause();
      if (hidden()) return;
      prune();
      scheduleUpdate();
      requestFrame();
    },
    cancel() {
      pause();
      targets.clear();
    },
  };
}
