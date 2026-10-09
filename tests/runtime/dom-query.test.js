import test from "node:test";
import assert from "node:assert/strict";

import { queryAll } from "../../src/shared/dom-query.js";
import { queryAll as queryCricketGrid } from "../../src/features/cricket-surface/grid-discovery.js";
import { FakeDocument, createHtmlCollectionLike } from "./fake-dom.js";

test("defensive DOM queries return empty arrays when the query method is unavailable", () => {
  for (const root of [null, undefined, {}, 1, { querySelectorAll: true }]) {
    assert.deepEqual(queryAll(root, ".target"), []);
  }
});

test("defensive DOM queries preserve selector, receiver and DOM order", () => {
  const documentRef = new FakeDocument();
  const first = documentRef.createElement("div");
  const second = documentRef.createElement("div");
  first.classList.add("target");
  second.classList.add("target");
  documentRef.main.appendChild(first);
  documentRef.main.appendChild(second);
  const originalQuery = documentRef.querySelectorAll;
  let calls = 0;
  documentRef.querySelectorAll = function (selector) {
    assert.equal(this, documentRef);
    assert.equal(selector, ".target");
    calls += 1;
    return originalQuery.call(this, selector);
  };
  assert.deepEqual(queryAll(documentRef, ".target"), [first, second]);
  assert.equal(calls, 1);
});

test("defensive DOM queries copy iterable NodeList-like results into independent arrays", () => {
  const first = {};
  const second = {};
  const nodes = [first, second];
  const nodeList = {
    length: 2,
    item: (index) => nodes[index] || null,
    *[Symbol.iterator]() { yield* nodes; },
  };
  const result = queryAll({ querySelectorAll: () => nodeList }, ".target");
  assert.ok(Array.isArray(result));
  assert.deepEqual(result, nodes);
  result.reverse();
  assert.deepEqual(Array.from(nodeList), [first, second]);
});

test("defensive DOM queries support non-iterable HTMLCollection-like results", () => {
  const first = {};
  const second = {};
  const collection = createHtmlCollectionLike([first, second]);
  delete collection[Symbol.iterator];
  const result = queryAll({ querySelectorAll: () => collection }, ".target");
  assert.ok(Array.isArray(result));
  assert.deepEqual(result, [first, second]);
  assert.notEqual(result, collection);
});

test("defensive DOM queries return independent empty arrays for empty matches", () => {
  const matches = [];
  const root = { querySelectorAll: () => matches };
  const first = queryAll(root, ".missing");
  assert.deepEqual(first, []);
  assert.notEqual(first, matches);
  assert.notEqual(first, queryAll(root, ".missing"));
});

test("defensive DOM queries absorb selector and collection-conversion exceptions", () => {
  const throwingRoot = {
    querySelectorAll() { throw new SyntaxError("Invalid selector"); },
  };
  assert.deepEqual(queryAll(throwingRoot, "["), []);
  const throwingCollection = {
    [Symbol.iterator]() { throw new Error("Collection unavailable"); },
  };
  assert.deepEqual(queryAll({ querySelectorAll: () => throwingCollection }, ".target"), []);
  assert.deepEqual(queryAll({ querySelectorAll: () => null }, ".target"), []);
});

test("Cricket grid discovery retains its defensive query export", () => {
  assert.equal(queryCricketGrid, queryAll);
  assert.deepEqual(queryCricketGrid(null, ".target"), []);
});
