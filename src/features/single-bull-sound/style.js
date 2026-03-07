export const THROW_TEXT_SELECTORS = Object.freeze([
  ".ad-ext-turn-throw p.chakra-text",
  ".ad-ext-turn-throw p",
  ".ad-ext-turn-throw",
]);

const ALLOWED_VOLUME = new Set([0.5, 0.75, 0.9, 1]);
const ALLOWED_COOLDOWN = new Set([400, 700, 1000]);
const ALLOWED_POLL_INTERVAL = new Set([0, 1200]);

function normalizeNumberChoice(value, fallbackValue, allowedSet) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && allowedSet.has(numeric)) {
    return numeric;
  }
  return fallbackValue;
}

export function resolveSingleBullSoundConfig(featureConfig = {}) {
  return {
    volume: normalizeNumberChoice(featureConfig.volume, 0.9, ALLOWED_VOLUME),
    cooldownMs: normalizeNumberChoice(featureConfig.cooldownMs, 700, ALLOWED_COOLDOWN),
    pollIntervalMs: normalizeNumberChoice(featureConfig.pollIntervalMs, 0, ALLOWED_POLL_INTERVAL),
  };
}
