export const SEGMENT_ORDER = Object.freeze([
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
]);

export const RING_RATIOS = Object.freeze({
  outerBullInner: 0.031112,
  outerBullOuter: 0.075556,
  tripleInner: 0.431112,
  tripleOuter: 0.475556,
  doubleInner: 0.711112,
  doubleOuter: 0.755556,
});

export function polar(radius, angleDeg) {
  const radians = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: Number((radius * Math.cos(radians)).toFixed(4)),
    y: Number((radius * Math.sin(radians)).toFixed(4)),
  };
}

export function wedgePath(innerRadius, outerRadius, startDeg, endDeg) {
  const p0 = polar(outerRadius, startDeg);
  const p1 = polar(outerRadius, endDeg);
  const p2 = polar(innerRadius, endDeg);
  const p3 = polar(innerRadius, startDeg);
  const largeArc = (endDeg - startDeg + 360) % 360 > 180 ? 1 : 0;
  return [
    `M ${p0.x} ${p0.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${p3.x} ${p3.y}`,
    "Z",
  ].join(" ");
}

export function ringPath(innerRadius, outerRadius) {
  const outer = [
    `M 0 ${-outerRadius}`,
    `A ${outerRadius} ${outerRadius} 0 1 1 0 ${outerRadius}`,
    `A ${outerRadius} ${outerRadius} 0 1 1 0 ${-outerRadius}`,
    "Z",
  ].join(" ");
  const inner = [
    `M 0 ${-innerRadius}`,
    `A ${innerRadius} ${innerRadius} 0 1 0 0 ${innerRadius}`,
    `A ${innerRadius} ${innerRadius} 0 1 0 0 ${-innerRadius}`,
    "Z",
  ].join(" ");
  return `${outer} ${inner}`;
}

export function segmentAngles(value) {
  const index = SEGMENT_ORDER.indexOf(Number(value));
  if (index < 0) {
    return null;
  }
  const center = index * 18;
  return {
    start: center - 9,
    end: center + 9,
  };
}
