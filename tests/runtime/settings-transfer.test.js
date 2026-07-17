import test from "node:test";
import assert from "node:assert/strict";

import {
  downloadSettingsExport,
  selectSettingsImportFile,
} from "../../src/features/xconfig-ui/settings-transfer.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

test("settings export download uses a JSON blob and revokes its object URL", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const calls = [];
  windowRef.Blob = globalThis.Blob;
  windowRef.URL = {
    createObjectURL(blob) {
      calls.push(["create", blob.type, blob.size]);
      return "blob:settings-export";
    },
    revokeObjectURL(url) {
      calls.push(["revoke", url]);
    },
  };
  const originalCreateElement = documentRef.createElement.bind(documentRef);
  documentRef.createElement = (tagName) => {
    const node = originalCreateElement(tagName);
    if (String(tagName).toLowerCase() === "a") {
      node.click = () => calls.push(["click", node.download, node.href]);
    }
    return node;
  };

  const fileName = downloadSettingsExport({
    documentRef,
    windowRef,
    exportResult: {
      fileName: "backup.json",
      payload: { format: "autodarts-xconfig-settings" },
    },
  });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(fileName, "backup.json");
  assert.deepEqual(calls[0].slice(0, 2), ["create", "application/json;charset=utf-8"]);
  assert.deepEqual(calls[1], ["click", "backup.json", "blob:settings-export"]);
  assert.deepEqual(calls[2], ["revoke", "blob:settings-export"]);
});

test("settings import file picker reads UTF-8 text and rejects oversized files", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  let selected = null;
  let error = null;

  selectSettingsImportFile({
    documentRef,
    windowRef,
    onSuccess: (value) => {
      selected = value;
    },
    onError: (value) => {
      error = value;
    },
  });
  let input = documentRef.body.children.find((node) => node.tagName === "INPUT");
  input.files = [{ name: "backup.json", size: 42, text: async () => "{\"ok\":true}" }];
  input.onchange();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(selected, {
    fileName: "backup.json",
    fileSize: 42,
    payload: "{\"ok\":true}",
  });
  assert.equal(error, null);

  selectSettingsImportFile({
    documentRef,
    windowRef,
    onError: (value) => {
      error = value;
    },
  });
  input = documentRef.body.children.find((node) => node.tagName === "INPUT");
  input.files = [{ name: "too-large.json", size: 33 * 1024 * 1024 }];
  input.onchange();
  assert.match(error.message, /größer als 32 MiB/);
});
