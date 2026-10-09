import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { renderCheckoutTargets } from "../../src/features/checkout-target-highlights/logic.js";
import {
  OVERLAY_ID as CHECKOUT_OVERLAY_ID,
  resolveBoardTargetVisualConfig,
} from "../../src/features/checkout-target-highlights/style.js";
import { renderCricketHighlights } from "../../src/features/cricket-target-highlighter/logic.js";
import {
  OVERLAY_ID as CRICKET_OVERLAY_ID,
  resolveCricketVisualConfig,
} from "../../src/features/cricket-target-highlighter/style.js";
import { FakeDocument } from "./fake-dom.js";

const LABELS = [...Array.from({ length: 20 }, (_, index) => String(index + 1)), "BULL"];
// Captured from the original renderers before extracting shared geometry.
// These fingerprints include shape order, target identity, paths, radii and fill rules.
const CHECKOUT_BASELINES = [
  [100, 0, "inner", "a5954f872083dd321c6910a2fa6945b96a0e012c037047d76a1a3e5b897e8c18"],
  [100, 0, "outer", "42e0ab37586d6dc0c61ab8d2a97edbd773c7220404c0ced76584bdb70c9454ba"],
  [100, 0, "both", "ed656967e56fcc7d1c3676b6eb4f3ab39bb4b38e7767ac33f59f9ba4e867150f"],
  [100, 2.5, "inner", "09a6505bc70d9fa50f97275713ff80e5a90629e8db473605a710da29660b670c"],
  [100, 2.5, "outer", "49040721f5c806a4f5f3abeb5c3e48bb6bb26da6410627f921479d0eea78e1d3"],
  [100, 2.5, "both", "bb432dfd19d9b8bb5601b921101230dc3e65a6e2afe2f550246ea32d4bab992b"],
  [500, 0, "inner", "626165ca6801b768ad8d6d31f3bd6d1fefd4f236c71a74e40aaac9779ed24df6"],
  [500, 0, "outer", "dc9f93d5efc3143f38dd518e7ad09e675e83d79577451434d580cd192321d304"],
  [500, 0, "both", "81819fef860c3b2003d8d7cfcc646213b0f88b5210d603573a259d4beaa7a7ce"],
  [500, 2.5, "inner", "2fa7aae908f69756297ca675a243bfee94dc6e7f00e076a83a3652c82ab9e971"],
  [500, 2.5, "outer", "beb5c22b170e599370d77b92a2184bdf7152d8f8c9be83c264a0ace1c263d763"],
  [500, 2.5, "both", "06939f7ada9a0d333c42c12762c4a57b70bf0e62db5e6082ab50f9cf284cda7b"],
];
const CRICKET_BASELINES = [
  [100, 0, "e25ea31fe5623a2479bf210d506d74eb0b63c403b2788dc6200db4a2eba6cbfb"],
  [100, 2.5, "9dd436d5bb652ac1f98f79669084e80eadab6a2851590b04c3ddacb11cc0fe20"],
  [500, 0, "fa0591f8e1528cc9073973b27a27094caaa965d93553d9582efae4f6b1b51e99"],
  [500, 2.5, "6060fafb755c4eb6c7b4f1beeedc510a1ba2f4a775567672029ac92a68837715"],
];

function createBoard(documentRef, radius) {
  const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${radius * 2} ${radius * 2}`);
  const group = documentRef.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.appendChild(group);
  const circle = documentRef.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("r", String(radius));
  group.appendChild(circle);
  LABELS.slice(0, 20).forEach((label) => {
    const text = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
    text.textContent = label;
    group.appendChild(text);
  });
  documentRef.main.appendChild(svg);
  return { group, radius };
}

function readGeometry(overlay) {
  assert.ok(overlay);
  return Array.from(overlay.children)
    .filter((node) => ["path", "circle"].includes(node.tagName.toLowerCase()))
    .map((node) => [
      node.tagName,
      node.dataset.targetRing || "",
      node.dataset.targetValue || "",
      node.dataset.targetLabel || "",
      node.getAttribute("d"),
      node.getAttribute("r"),
      node.getAttribute("fill-rule"),
    ]);
}

function fingerprint(geometry) {
  return createHash("sha256").update(JSON.stringify(geometry)).digest("hex");
}

for (const [radius, edgePaddingPx, singleRing, expected] of CHECKOUT_BASELINES) {
  test(`checkout preserves all S/D/T sectors and both bulls at radius ${radius}, padding ${edgePaddingPx}, singles ${singleRing}`, () => {
    const documentRef = new FakeDocument();
    const board = createBoard(documentRef, radius);
    const checkoutTargets = [
      ...Array.from({ length: 20 }, (_, index) =>
        ["S", "D", "T"].map((ring) => ({ ring, value: index + 1 }))
      ).flat(),
      { ring: "SB" },
      { ring: "DB" },
    ];
    const visualConfig = {
      ...resolveBoardTargetVisualConfig({}), edgePaddingPx, singleRing, renderOutline: false,
    };
    renderCheckoutTargets({ board, checkoutTargets, visualConfig });
    const geometry = readGeometry(documentRef.getElementById(CHECKOUT_OVERLAY_ID));
    assert.equal(geometry.length, singleRing === "both" ? 82 : 62);
    assert.equal(fingerprint(geometry), expected);
    renderCheckoutTargets({ board, checkoutTargets, visualConfig });
    assert.deepEqual(readGeometry(documentRef.getElementById(CHECKOUT_OVERLAY_ID)), geometry);
  });
}

for (const [radius, edgePaddingPx, expected] of CRICKET_BASELINES) {
  test(`cricket preserves all sectors and bull at radius ${radius}, padding ${edgePaddingPx}`, () => {
    const documentRef = new FakeDocument();
    createBoard(documentRef, radius);
    const options = {
      documentRef,
      visualConfig: { ...resolveCricketVisualConfig({ showOpenTargets: true }), edgePaddingPx },
      renderState: {
        targetOrder: LABELS,
        stateMap: new Map(LABELS.map((label) => [
          label, { label, boardPresentation: "open", isHighlightActive: true },
        ])),
      },
      cache: {},
    };
    assert.equal(renderCricketHighlights(options), true);
    const geometry = readGeometry(documentRef.getElementById(CRICKET_OVERLAY_ID));
    assert.equal(geometry.length, 82);
    assert.equal(fingerprint(geometry), expected);
    assert.equal(renderCricketHighlights(options), true);
    assert.deepEqual(readGeometry(documentRef.getElementById(CRICKET_OVERLAY_ID)), geometry);
  });
}
