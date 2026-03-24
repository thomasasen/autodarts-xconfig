import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeThemeBackgroundUpload,
  uploadThemeBackgroundImage,
} from "../../src/features/xconfig-ui/theme-background.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function installCanvasStub(documentRef, toDataUrlFn) {
  const originalCreateElement = documentRef.createElement.bind(documentRef);
  const drawCalls = [];
  const canvasStates = [];

  documentRef.createElement = (tagName) => {
    if (String(tagName || "").toLowerCase() !== "canvas") {
      return originalCreateElement(tagName);
    }

    const canvas = {
      width: 0,
      height: 0,
      getContext() {
        return {
          drawImage(source, x, y, width, height) {
            drawCalls.push({ source, x, y, width, height });
          },
        };
      },
      toDataURL(mimeType, quality) {
        canvasStates.push({
          width: this.width,
          height: this.height,
          mimeType,
          quality,
        });
        return toDataUrlFn(mimeType, quality, this);
      },
    };

    return canvas;
  };

  return {
    drawCalls,
    canvasStates,
    restore() {
      documentRef.createElement = originalCreateElement;
    },
  };
}

function installFileReaderFallback(windowRef, imageSize, file) {
  windowRef.FileReader = class FakeFileReader {
    constructor() {
      this.result = "";
      this.onload = null;
      this.onerror = null;
    }

    readAsDataURL() {
      this.result = String(file.dataUrl || "");
      this.onload?.();
    }
  };

  windowRef.Image = class FakeImage {
    constructor() {
      this.naturalWidth = imageSize.width;
      this.naturalHeight = imageSize.height;
      this.onload = null;
      this.onerror = null;
    }

    set src(value) {
      this._src = value;
      this.onload?.();
    }
  };
}

test("normalizeThemeBackgroundUpload prefers webp and rescales large images", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const bitmap = {
    width: 4000,
    height: 3000,
    closed: false,
    close() {
      this.closed = true;
    },
  };
  windowRef.createImageBitmap = async () => bitmap;

  const canvas = installCanvasStub(documentRef, (mimeType) => {
    if (mimeType === "image/webp") {
      return `data:image/webp;base64,${"a".repeat(20)}`;
    }
    return `data:${mimeType};base64,${"b".repeat(20)}`;
  });

  const result = await normalizeThemeBackgroundUpload({
    windowRef,
    documentRef,
    file: {
      type: "image/png",
      name: "wall.png",
    },
  });

  assert.equal(result.mimeType, "image/webp");
  assert.equal(result.resized, true);
  assert.equal(result.dataUrl.startsWith("data:image/webp"), true);
  assert.equal(result.byteSize > 0, true);
  assert.equal(bitmap.closed, true);
  assert.equal(canvas.drawCalls.length, 1);
  assert.equal(canvas.drawCalls[0].width, 1440);
  assert.equal(canvas.drawCalls[0].height, 1080);
  assert.equal(canvas.canvasStates[0].mimeType, "image/webp");
  assert.equal(canvas.canvasStates[0].quality, 0.86);

  canvas.restore();
});

test("normalizeThemeBackgroundUpload falls back to image loading and preserves smaller images", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const file = {
    type: "image/png",
    name: "small.png",
    dataUrl: "data:image/png;base64,ZmFrZS1kYXRh",
  };
  installFileReaderFallback(windowRef, { width: 800, height: 600 }, file);

  const canvas = installCanvasStub(documentRef, (mimeType) => {
    if (mimeType === "image/webp") {
      return `data:image/webp;base64,${"x".repeat(2000000)}`;
    }
    if (mimeType === "image/png") {
      return "data:image/png;base64,c21hbGw=";
    }
    return `data:${mimeType};base64,${"y".repeat(10)}`;
  });

  const result = await normalizeThemeBackgroundUpload({
    windowRef,
    documentRef,
    file,
    maxBytes: 1024 * 1024,
  });

  assert.equal(result.mimeType, "image/png");
  assert.equal(result.resized, false);
  assert.equal(result.dataUrl.startsWith("data:image/png"), true);
  assert.equal(canvas.drawCalls.length, 1);
  assert.equal(canvas.drawCalls[0].width, 800);
  assert.equal(canvas.drawCalls[0].height, 600);
  assert.equal(canvas.canvasStates[0].mimeType, "image/webp");
  assert.equal(canvas.canvasStates[1].mimeType, "image/png");

  canvas.restore();
});

test("uploadThemeBackgroundImage normalizes and persists successful uploads, but blocks oversized ones", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const file = {
    type: "image/png",
    name: "persisted.png",
  };
  const bitmap = {
    width: 2400,
    height: 1800,
    close() {},
  };
  windowRef.createImageBitmap = async () => bitmap;

  const canvas = installCanvasStub(documentRef, (mimeType) => {
    if (mimeType === "image/webp") {
      return `data:image/webp;base64,${"a".repeat(40)}`;
    }
    return `data:${mimeType};base64,${"b".repeat(40)}`;
  });

  const calls = [];
  const notices = [];
  const feedback = [];
  const indicators = [];
  let queueCount = 0;

  const originalCreateElement = documentRef.createElement.bind(documentRef);
  documentRef.createElement = (tagName) => {
    if (String(tagName || "").toLowerCase() !== "input") {
      return originalCreateElement(tagName);
    }

    return {
      type: "",
      accept: "",
      style: {},
      files: [file],
      parentNode: null,
      onchange: null,
      removed: false,
      click() {
        this.onchange?.();
      },
      remove() {
        this.removed = true;
      },
    };
  };

  const runtimeApi = {
    async setThemeBackgroundImage(themeKey, dataUrl) {
      calls.push({ themeKey, dataUrl });
      return {};
    },
  };

  uploadThemeBackgroundImage({
    feature: {
      featureKey: "theme-x01",
      title: "Theme X01",
    },
    themeKey: "x01",
    documentRef,
    windowRef,
    runtimeApi,
    setNotice(type, message) {
      notices.push({ type, message });
    },
    setThemeActionFeedback(featureKey, type, message) {
      feedback.push({ featureKey, type, message });
    },
    syncThemeBackgroundIndicators(featureKey) {
      indicators.push(featureKey);
    },
    queueSync() {
      queueCount += 1;
    },
  });

  await wait(5);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].themeKey, "x01");
  assert.equal(calls[0].dataUrl.startsWith("data:image/webp"), true);
  assert.equal(notices.some((entry) => entry.type === "success"), true);
  assert.equal(feedback.some((entry) => entry.type === "success"), true);
  assert.deepEqual(indicators, ["theme-x01"]);
  assert.equal(queueCount >= 1, true);

  uploadThemeBackgroundImage({
    feature: {
      featureKey: "theme-x01",
      title: "Theme X01",
    },
    themeKey: "x01",
    documentRef,
    windowRef,
    runtimeApi: {
      async setThemeBackgroundImage() {
        throw new Error("must not be called");
      },
    },
    maxBytes: 10,
    setNotice(type, message) {
      notices.push({ type, message });
    },
    setThemeActionFeedback(featureKey, type, message) {
      feedback.push({ featureKey, type, message });
    },
    syncThemeBackgroundIndicators(featureKey) {
      indicators.push(`unexpected:${featureKey}`);
    },
    queueSync() {
      queueCount += 1;
    },
  });

  await wait(5);

  assert.equal(calls.length, 1);
  assert.equal(notices.some((entry) => entry.type === "error"), true);
  assert.equal(feedback.some((entry) => entry.type === "error"), true);
  assert.equal(indicators.some((entry) => String(entry).startsWith("unexpected:")), false);
  assert.equal(queueCount >= 2, true);

  canvas.restore();
  documentRef.createElement = originalCreateElement;
});
