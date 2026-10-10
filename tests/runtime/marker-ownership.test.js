import test from "node:test";
import assert from "node:assert/strict";
import { createModernX01Fixture } from "./modern-x01-fixture.js";
import { createDartboardMarkerHighlightState, updateDartboardMarkerHighlight, clearDartboardMarkerHighlight } from "../../src/features/dartboard-marker-highlight/logic.js";
import { resolveDartboardMarkerHighlightConfig } from "../../src/features/dartboard-marker-highlight/style.js";
import { createDartMarkerReplacerState, updateDartMarkerReplacer, clearDartMarkerReplacerState } from "../../src/features/dart-marker-replacer/logic.js";
import { resolveDartMarkerReplacerConfig } from "../../src/features/dart-marker-replacer/style.js";

function fixture() {
  const f = createModernX01Fixture();
  const marker = f.documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  marker.setAttribute("cx", "420"); marker.setAttribute("cy", "320"); marker.setAttribute("r", "5");
  marker.setAttribute("filter", "url(#shadow-2dp)");
  marker.__rect = { left: 940, top: 300, width: 6, height: 6 };
  marker.style.opacity = "0.6"; marker.style.fill = "pink";
  f.layers[3].appendChild(marker);
  const highlight = createDartboardMarkerHighlightState();
  const replacer = createDartMarkerReplacerState(f.windowRef);
  return { ...f, marker, highlight, replacer,
    update: [
      () => updateDartboardMarkerHighlight({ ...f, state: highlight, visualConfig: resolveDartboardMarkerHighlightConfig({ opacityPercent: 85 }) }),
      () => updateDartMarkerReplacer({ ...f, state: replacer, visualConfig: resolveDartMarkerReplacerConfig({ animateDarts: false, hideOriginalMarkers: true }) }),
    ],
    cleanup: [() => clearDartboardMarkerHighlight(highlight), () => clearDartMarkerReplacerState(replacer)],
  };
}

for (const firstToStart of [0, 1]) {
  for (const firstToStop of [0, 1]) {
    test(`marker appearance and visibility retain their owners: start ${firstToStart}, stop ${firstToStop}`, () => {
      const f = fixture();
      try {
        f.update[firstToStart](); f.update[1 - firstToStart]();
        assert.equal(f.highlight.trackedMarkers.size, 1);
        assert.equal(f.replacer.markerOpacityByMarker.size, 1);
        assert.equal(f.marker.style.opacity, "0");
        f.cleanup[firstToStop]();
        assert.equal(f.marker.style.opacity, firstToStop === 0 ? "0" : "0.85");
        f.cleanup[1 - firstToStop]();
        assert.equal(f.marker.style.opacity, "0.6");
        assert.equal(f.marker.style.fill, "pink");
        assert.equal(f.marker.getAttribute("r"), "5");
      } finally { f.cleanup.forEach((cleanup) => cleanup()); }
    });
  }
}

test("marker cleanup preserves newer foreign appearance and visibility values", () => {
  const f = fixture();
  f.update[0](); f.update[1]();
  f.marker.style.opacity = "0.42";
  f.marker.style.fill = "teal";
  f.marker.style.stroke = "purple";
  f.marker.setAttribute("r", "7");
  f.cleanup.forEach((cleanup) => cleanup());
  assert.equal(f.marker.style.opacity, "0.42");
  assert.equal(f.marker.style.fill, "teal");
  assert.equal(f.marker.style.stroke, "purple");
  assert.equal(f.marker.getAttribute("r"), "7");
});

test("releasing the replacer refreshes highlight appearance without reclaiming foreign styles or radius removal", () => {
  const f = fixture();
  f.update[0](); f.update[1]();
  f.marker.style.fill = "teal";
  f.marker.removeAttribute("r");
  f.cleanup[1]();
  assert.equal(f.marker.style.opacity, "0.85");
  assert.equal(f.marker.style.fill, "teal");
  assert.equal(f.marker.getAttribute("r"), null);
  f.cleanup[0]();
  assert.equal(f.marker.style.fill, "teal");
  assert.equal(f.marker.getAttribute("r"), null);
  assert.equal(f.marker.style.opacity, "0.6");
});
