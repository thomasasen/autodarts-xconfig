export function buildLiveBoardFilter(intensity = 30) {
  const amount = Math.min(100, Math.max(0, Number(intensity) || 0)) / 100;
  const edge = amount * 0.7;
  return {
    kernel: `0 ${-edge} 0 ${-edge} ${1 + edge * 4} ${-edge} 0 ${-edge} 0`,
    gamma: String(1 - amount * 0.06),
    contrast: String(1 + amount * 0.1),
  };
}

export function createLiveBoardFilterDefinition(documentRef, id, intensity) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = documentRef.createElementNS(ns, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("data-adx-decoration", "live-filter");
  svg.style.cssText = "position:absolute;width:0;height:0;pointer-events:none;overflow:hidden";
  const filter = documentRef.createElementNS(ns, "filter");
  filter.id = id;
  filter.setAttribute("color-interpolation-filters", "sRGB");
  const values = buildLiveBoardFilter(intensity);
  const kernel = documentRef.createElementNS(ns, "feConvolveMatrix");
  for (const [key, value] of Object.entries({ order: "3", edgeMode: "duplicate", preserveAlpha: "true", kernelMatrix: values.kernel })) kernel.setAttribute(key, value);
  filter.appendChild(kernel);
  const transfer = documentRef.createElementNS(ns, "feComponentTransfer");
  for (const channel of ["R", "G", "B"]) {
    const func = documentRef.createElementNS(ns, `feFunc${channel}`);
    for (const [key, value] of Object.entries({ type: "gamma", amplitude: "1", offset: "0", exponent: values.gamma })) func.setAttribute(key, value);
    transfer.appendChild(func);
  }
  filter.appendChild(transfer);
  svg.appendChild(filter);
  return svg;
}
