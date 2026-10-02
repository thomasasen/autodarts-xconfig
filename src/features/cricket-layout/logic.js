const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function calculateCricketLayout(options = {}) {
  const playerCount = clamp(Math.trunc(Number(options.playerCount) || 2), 1, 6);
  const targetCount = options.targetCount === 12 ? 12 : 7;
  const width = Math.max(1, Number(options.width) || 800);
  const height = Math.max(1, Number(options.height) || 500);
  const settings = options.settings || {};
  const automaticShare = clamp(.49 + (playerCount - 2) * .035 + (targetCount === 12 ? .04 : 0), .46, .67);
  const tableShare = settings.space === "table" ? .67 : settings.space === "board" ? .43 : automaticShare;
  const gap = Math.min(settings.density === "compact" || targetCount === 12 ? 2 : 4, height / (targetCount * 8));
  const labelWidth = Math.min(width * .2, clamp(width * .075, 36, 64));
  const columnWidth = Math.max(20, (width - labelWidth - gap * playerCount) / playerCount);
  const nameLines = settings.names === "single" ? 1 : 2;
  const headerHeight = Math.min(height * .36, clamp(height * (settings.textSize === "large" ? .28 : .23), 64, settings.textSize === "large" ? 150 : 128));
  const rowHeight = Math.max(1, (height - headerHeight - gap * targetCount) / targetCount);
  const maxMark = Math.max(1, Math.min(rowHeight - 6, columnWidth - 8));
  const preferredMark = settings.markSize === "very-large" ? 60 : 44;
  const preferredTarget = settings.targetSize === "very-large" ? 38 : settings.targetSize === "large" ? 30 : 24;
  return {
    tableShare,
    gap,
    labelWidth,
    headerHeight,
    rowHeight,
    markSize: Math.min(preferredMark, maxMark),
    targetSize: Math.max(1, Math.min(preferredTarget, rowHeight * .7, labelWidth * .62)),
    nameSize: Math.max(1, Math.min(settings.textSize === "large" ? 26 : 20, columnWidth * .15, headerHeight * .34 / nameLines)),
    scoreSize: Math.max(1, Math.min(settings.textSize === "large" ? 48 : 36, columnWidth * .38, headerHeight * .35)),
  };
}
