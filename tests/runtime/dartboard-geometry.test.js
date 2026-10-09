import test from "node:test";
import assert from "node:assert/strict";

import {
  SEGMENT_ORDER, RING_RATIOS, polar, wedgePath, ringPath, segmentAngles,
} from "../../src/shared/dartboard-geometry.js";

test("dartboard geometry keeps clockwise sectors with 20 at the top", () => {
  const expectedOrder = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
  assert.deepEqual(SEGMENT_ORDER, expectedOrder);
  expectedOrder.forEach((value, index) => {
    const expected = { start: index * 18 - 9, end: index * 18 + 9 };
    assert.deepEqual(segmentAngles(value), expected);
    assert.deepEqual(segmentAngles(String(value)), expected);
  });
  for (const value of [0, 21, "BULL", "", null, undefined, NaN]) {
    assert.equal(segmentAngles(value), null);
  }
});

test("dartboard geometry preserves top origin and four-decimal coordinates", () => {
  assert.deepEqual(polar(100, 0), { x: 0, y: -100 });
  assert.deepEqual(polar(100, 90), { x: 100, y: 0 });
  assert.deepEqual(polar(100, 9), { x: 15.6434, y: -98.7688 });
  assert.equal(
    wedgePath(10, 20, 0, 90),
    "M 0 -20 A 20 20 0 0 1 20 0 L 10 0 A 10 10 0 0 0 0 -10 Z"
  );
  assert.equal(
    wedgePath(10, 20, 0, 270),
    "M 0 -20 A 20 20 0 1 1 -20 0 L -10 0 A 10 10 0 1 0 0 -10 Z"
  );
});

test("dartboard bull rings preserve opposing arc directions and immutable ratios", () => {
  assert.equal(
    ringPath(10, 20),
    "M 0 -20 A 20 20 0 1 1 0 20 A 20 20 0 1 1 0 -20 Z M 0 -10 A 10 10 0 1 0 0 10 A 10 10 0 1 0 0 -10 Z"
  );
  assert.deepEqual(RING_RATIOS, {
    outerBullInner: 0.031112, outerBullOuter: 0.075556,
    tripleInner: 0.431112, tripleOuter: 0.475556,
    doubleInner: 0.711112, doubleOuter: 0.755556,
  });
  assert.ok(Object.isFrozen(SEGMENT_ORDER));
  assert.ok(Object.isFrozen(RING_RATIOS));
});
