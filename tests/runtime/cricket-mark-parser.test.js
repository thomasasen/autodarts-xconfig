import test from "node:test";
import assert from "node:assert/strict";

import {
  parseMarksValue,
  parseTextMarkValue,
  readCellPlayerIndex,
} from "../../src/features/cricket-surface/mark-parser.js";

function createNode(options = {}) {
  const attributes = {
    ...(options.attributes || {}),
  };

  return {
    textContent: options.textContent || "",
    dataset: {
      ...(options.dataset || {}),
    },
    getAttribute(name) {
      return Object.hasOwn(attributes, name) ? attributes[name] : null;
    },
    querySelectorAll() {
      return Array.isArray(options.querySelectorAll) ? options.querySelectorAll : [];
    },
  };
}

test("parseTextMarkValue clamps parsed cricket mark values", () => {
  const cricketRules = {
    parseCricketMarkValue: () => 4,
    clampMarks: (value) => Math.max(0, Math.min(3, value)),
  };

  assert.equal(parseTextMarkValue("XXXX", cricketRules), 3);
});

test("parseMarksValue reads direct attributes and icon fallbacks with shared semantics", () => {
  const cricketRules = {
    parseCricketMarkValue(value) {
      if (value === "hit-2") {
        return 2;
      }
      return null;
    },
    clampMarks(value) {
      return Math.max(0, Math.min(3, value));
    },
  };

  const directNode = createNode({
    attributes: {
      "data-marks": "hit-2",
    },
  });
  assert.equal(parseMarksValue(directNode, cricketRules), 2);

  const iconNode = createNode({
    querySelectorAll: [
      createNode({ attributes: { alt: "X" } }),
      createNode({ attributes: { alt: "X" } }),
      createNode({ attributes: { alt: "X" } }),
    ],
  });
  assert.equal(parseMarksValue(iconNode, cricketRules), 3);
  assert.equal(parseMarksValue(iconNode, cricketRules, { countMultipleIcons: false }), 0);
});

test("readCellPlayerIndex accepts both dataset and column index fallbacks", () => {
  assert.equal(
    readCellPlayerIndex(
      createNode({
        attributes: {
          "data-column-index": "2",
        },
      })
    ),
    null
  );

  assert.equal(
    readCellPlayerIndex(
      createNode({
        attributes: {
          "data-column-index": "2",
        },
      }),
      { includeColumnIndex: true }
    ),
    2
  );

  assert.equal(
    readCellPlayerIndex(
      createNode({
        dataset: {
          playerIndex: "1",
        },
      })
    ),
    1
  );
});
