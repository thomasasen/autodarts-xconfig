export function createLabelDiagnostics() {
  return {
    rawLabelCount: 0,
    rawUniqueLabelCount: 0,
    atomicLabelCount: 0,
    atomicUniqueLabelCount: 0,
    nestedLabelDropCount: 0,
    multiLabelContainerDropCount: 0,
  };
}

export function cloneLabelDiagnostics(diagnostics) {
  const next = createLabelDiagnostics();
  if (!diagnostics || typeof diagnostics !== "object") {
    return next;
  }

  Object.keys(next).forEach((key) => {
    const value = Number(diagnostics[key]);
    next[key] = Number.isFinite(value) ? value : next[key];
  });

  return next;
}
