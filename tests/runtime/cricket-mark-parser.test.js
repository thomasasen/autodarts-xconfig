import test from "node:test";
import assert from "node:assert/strict";

import {
  parseMarksValue,
  parseTextMarkValue,
  readCellPlayerIndex,
} from "../../src/features/cricket-surface/mark-parser.js";

function createNode(options = {}) {
  const attributes = {
    ...options.attributes,
  };
  const derivedDataset = Object.entries(attributes).reduce((result, [name, value]) => {
    if (!name.startsWith("data-")) {
      return result;
    }
    const datasetKey = name
      .slice(5)
      .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    result[datasetKey] = value;
    return result;
  }, {});

  return {
    textContent: options.textContent || "",
    dataset: {
      ...derivedDataset,
      ...options.dataset,
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

test("parseTextMarkValue ignores throw-like score tokens and accepts wrapped mark digits", () => {
  const cricketRules = {
    parseCricketMarkValue(value) {
      return /^\(3\)$/.test(String(value || "").trim()) ? 3 : null;
    },
    clampMarks(value) {
      return Math.max(0, Math.min(3, value));
    },
  };

  assert.equal(parseTextMarkValue("D18"), null);
  assert.equal(parseTextMarkValue("(3)", cricketRules), 3);
});

test("readCellPlayerIndex accepts both dataset and column index fallbacks", () => {
  assert.equal(
    readCellPlayerIndex(
      createNode({
        dataset: {
          columnIndex: "2",
        },
      })
    ),
    null
  );

  assert.equal(
    readCellPlayerIndex(
      createNode({
        dataset: {
          columnIndex: "2",
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
