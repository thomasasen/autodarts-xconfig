import test from "node:test";
import assert from "node:assert/strict";

import { createDomGuards } from "../../src/core/dom-guards.js";
import {
  ELECTRIC_FILTER_DEFS_NODE_ID,
  ELECTRIC_FILTER_READY_CLASS,
  ELECTRIC_FILTER_SOFT_ID,
  ELECTRIC_FILTER_STRONG_ID,
  releaseElectricFilterDefs,
  retainElectricFilterDefs,
} from "../../src/shared/electric-border-engine.js";
import { FakeDocument } from "./fake-dom.js";

test("electric-border-engine mounts one shared defs node per document and cleans up by refcount", () => {
  const documentRef = new FakeDocument();
  const domGuards = createDomGuards({ documentRef });

  const firstRetain = retainElectricFilterDefs({ documentRef, domGuards });
  const secondRetain = retainElectricFilterDefs({ documentRef, domGuards });

  assert.equal(firstRetain.available, true);
  assert.equal(firstRetain.softFilterId, ELECTRIC_FILTER_SOFT_ID);
  assert.equal(firstRetain.strongFilterId, ELECTRIC_FILTER_STRONG_ID);
  assert.equal(secondRetain.refCount, 2);
  assert.equal(documentRef.querySelectorAll(`#${ELECTRIC_FILTER_DEFS_NODE_ID}`).length, 1);
  assert.ok(documentRef.getElementById(ELECTRIC_FILTER_SOFT_ID));
  assert.ok(documentRef.getElementById(ELECTRIC_FILTER_STRONG_ID));
  assert.equal(documentRef.documentElement.classList.contains(ELECTRIC_FILTER_READY_CLASS), true);

  assert.equal(releaseElectricFilterDefs({ documentRef }), 1);
  assert.equal(documentRef.querySelectorAll(`#${ELECTRIC_FILTER_DEFS_NODE_ID}`).length, 1);

  assert.equal(releaseElectricFilterDefs({ documentRef }), 0);
  assert.equal(documentRef.querySelectorAll(`#${ELECTRIC_FILTER_DEFS_NODE_ID}`).length, 0);
  assert.equal(documentRef.documentElement.classList.contains(ELECTRIC_FILTER_READY_CLASS), false);
});
