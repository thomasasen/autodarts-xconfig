import { evaluatePlayerTargetState } from "../../domain/cricket-rules.js";

// One static match illustrates fitted columns and tactical states together.
const EXAMPLE_ROWS = Object.freeze([
  ["20", [3, 1, 0, 2]], ["19", [0, 3, 1, 0]], ["18", [3, 3, 3, 3]],
  ["17", [1, 2, 0, 1]], ["16", [0, 0, 1, 0]], ["15", [2, 0, 0, 1]], ["Bull", [1, 0, 2, 0]],
]);

export function buildCricketTablePreview(documentRef, createElement) {
  const preview = createElement(documentRef, "div", {
    className: "ad-xconfig-card-bg ad-xconfig-table-preview",
    attributes: { "aria-hidden": "true", "data-adxconfig-cricket-table-preview": "true" },
  });
  const table = createElement(documentRef, "div", { className: "ad-xconfig-table-preview-grid" });
  const add = (text, className = "", attributes = {}) => table.appendChild(createElement(documentRef, "span", { text, className, attributes }));
  add("");
  ["ANNA · 80", "THOMAS · 120", "BEN · 60", "LENA · 100"].forEach((name, index) =>
    add(name, "ad-xconfig-table-preview-header", { "data-active": String(index === 1) }));
  EXAMPLE_ROWS.forEach(([target, marks]) => {
    add(target);
    marks.forEach((value, index) => add(["", "/", "×", "⊗"][value], "ad-xconfig-table-preview-cell", {
      "data-state": evaluatePlayerTargetState(marks, index).presentation,
      "data-active": String(index === 1),
    }));
  });
  preview.appendChild(table);
  return preview;
}
