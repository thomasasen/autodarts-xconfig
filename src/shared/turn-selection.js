function parseTimestamp(value) {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function selectNewestTurn(candidates) {
  if (!Array.isArray(candidates) || !candidates.length) {
    return null;
  }

  return candidates.reduce((best, candidate) => {
    if (!best) {
      return candidate;
    }

    const candidateRound = Number.isFinite(candidate?.round) ? candidate.round : -1;
    const bestRound = Number.isFinite(best?.round) ? best.round : -1;
    if (candidateRound !== bestRound) {
      return candidateRound > bestRound ? candidate : best;
    }

    const candidateTurn = Number.isFinite(candidate?.turn) ? candidate.turn : -1;
    const bestTurn = Number.isFinite(best?.turn) ? best.turn : -1;
    if (candidateTurn !== bestTurn) {
      return candidateTurn > bestTurn ? candidate : best;
    }

    const candidateTs = parseTimestamp(candidate?.createdAt);
    const bestTs = parseTimestamp(best?.createdAt);
    return candidateTs >= bestTs ? candidate : best;
  }, null);
}
