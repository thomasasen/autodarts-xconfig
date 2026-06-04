import test from "node:test";
import assert from "node:assert/strict";

import {
  createManagedNodeMatcher,
  shouldHandleExternalDomMutation,
} from "../../src/core/dom-mutation-filter.js";
import { FakeDocument } from "./fake-dom.js";

test("shouldHandleExternalDomMutation ignores managed mutations before domain filters run", () => {
  const documentRef = new FakeDocument();
  const managedNode = documentRef.createElement("section");
  managedNode.id = "ad-xconfig-panel-host";
  const externalNode = documentRef.createElement("section");
  const isManagedNode = createManagedNodeMatcher({
    ids: ["ad-xconfig-panel-host"],
  });
  let domainFilterCalls = 0;
  const shouldHandle = () => {
    domainFilterCalls += 1;
    return true;
  };

  assert.equal(
    shouldHandleExternalDomMutation(
      [
        {
          target: managedNode,
          addedNodes: [managedNode],
          removedNodes: [],
        },
      ],
      {
        isManagedNode,
        shouldHandle,
      }
    ),
    false
  );
  assert.equal(domainFilterCalls, 0);

  assert.equal(
    shouldHandleExternalDomMutation(
      [
        {
          target: documentRef.body,
          addedNodes: [externalNode],
          removedNodes: [],
        },
      ],
      {
        isManagedNode,
        shouldHandle,
      }
    ),
    true
  );
  assert.equal(domainFilterCalls, 1);
});
