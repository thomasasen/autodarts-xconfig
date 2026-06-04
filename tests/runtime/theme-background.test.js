import test from "node:test";
import assert from "node:assert/strict";

import {
  applyTurnDartImageStatusNode,
  applyThemeBackgroundStatusNode,
  buildTurnDartImageStatus,
  buildThemeBackgroundStatus,
  normalizeThemeBackgroundUpload,
  uploadThemeBackgroundImage,
} from "../../src/features/xconfig-ui/theme-background.js";
import { FakeDocument, createFakeWindow } from "./fake-dom.js";

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function installCanvasStub(documentRef, toDataUrlFn, contextOptions = {}) {
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
          drawImage(source, ...args) {
            const call = { source, args };
            if (args.length === 4) {
              const [x, y, width, height] = args;
              Object.assign(call, { x, y, width, height });
            } else if (args.length === 8) {
              const [sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height] = args;
              Object.assign(call, {
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                x,
                y,
                width,
                height,
              });
            }
            drawCalls.push(call);
          },
          getImageData:
            typeof contextOptions.getImageData === "function"
              ? contextOptions.getImageData
              : undefined,
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

function createAlphaBoxImageData(width, height, box) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = box.y; y < box.y + box.height; y += 1) {
    for (let x = box.x; x < box.x + box.width; x += 1) {
      data[(y * width + x) * 4 + 3] = 255;
    }
  }
  return { data, width, height };
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

test("normalizeThemeBackgroundUpload can trim transparent margins for dart-style uploads", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const bitmap = {
    width: 240,
    height: 240,
    close() {},
  };
  windowRef.createImageBitmap = async () => bitmap;

  const canvas = installCanvasStub(
    documentRef,
    (mimeType) => `data:${mimeType};base64,${"d".repeat(40)}`,
    {
      getImageData: () =>
        createAlphaBoxImageData(240, 240, {
          x: 10,
          y: 97,
          width: 218,
          height: 46,
        }),
    }
  );

  const result = await normalizeThemeBackgroundUpload({
    windowRef,
    documentRef,
    file: {
      type: "image/png",
      name: "dart.png",
    },
    maxWidth: 960,
    maxHeight: 240,
    maxBytes: 350 * 1024,
    trimTransparent: true,
  });

  assert.equal(result.resized, true);
  assert.equal(canvas.drawCalls.length, 2);
  assert.equal(canvas.drawCalls[0].width, 240);
  assert.equal(canvas.drawCalls[0].height, 240);
  assert.equal(canvas.drawCalls[1].sourceX, 10);
  assert.equal(canvas.drawCalls[1].sourceY, 97);
  assert.equal(canvas.drawCalls[1].sourceWidth, 218);
  assert.equal(canvas.drawCalls[1].sourceHeight, 46);
  assert.equal(canvas.drawCalls[1].width, 218);
  assert.equal(canvas.drawCalls[1].height, 46);
  assert.equal(canvas.canvasStates[0].width, 218);
  assert.equal(canvas.canvasStates[0].height, 46);

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
  const createdInputs = [];
  let queueCount = 0;

  const originalCreateElement = documentRef.createElement.bind(documentRef);
  documentRef.createElement = (tagName) => {
    if (String(tagName || "").toLowerCase() !== "input") {
      return originalCreateElement(tagName);
    }

    const input = {
      type: "",
      accept: "",
      style: {},
      tabIndex: 0,
      files: [file],
      parentNode: null,
      onchange: null,
      removed: false,
      attributes: new Map(),
      setAttribute(name, value) {
        this.attributes.set(String(name), String(value));
      },
      click() {
        this.onchange?.();
      },
      remove() {
        this.removed = true;
      },
    };
    createdInputs.push(input);
    return input;
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

  assert.equal(createdInputs.length >= 1, true);
  assert.equal(createdInputs[0].style.display, undefined);
  assert.equal(createdInputs[0].style.position, "fixed");
  assert.equal(createdInputs[0].style.left, "-9999px");
  assert.equal(createdInputs[0].style.width, "1px");
  assert.equal(createdInputs[0].style.height, "1px");
  assert.equal(createdInputs[0].style.opacity, "0");
  assert.equal(createdInputs[0].style.pointerEvents, "none");
  assert.equal(createdInputs[0].tabIndex, -1);
  assert.equal(createdInputs[0].attributes.get("aria-hidden"), "true");
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

test("uploadThemeBackgroundImage skips stale callbacks after lifecycle deactivation", async () => {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const file = {
    type: "image/png",
    name: "late.png",
  };
  const bitmap = {
    width: 800,
    height: 600,
    close() {},
  };
  let resolveBitmap = () => {};
  windowRef.createImageBitmap = () =>
    new Promise((resolve) => {
      resolveBitmap = () => resolve(bitmap);
    });

  const canvas = installCanvasStub(
    documentRef,
    (mimeType) => `data:${mimeType};base64,${"a".repeat(40)}`
  );
  const originalCreateElement = documentRef.createElement.bind(documentRef);
  const createdInputs = [];
  documentRef.createElement = (tagName) => {
    if (String(tagName || "").toLowerCase() !== "input") {
      return originalCreateElement(tagName);
    }

    const input = {
      type: "",
      accept: "",
      style: {},
      tabIndex: 0,
      files: [file],
      onchange: null,
      removed: false,
      setAttribute() {},
      click() {
        this.onchange?.();
      },
      remove() {
        this.removed = true;
      },
    };
    createdInputs.push(input);
    return input;
  };

  let active = true;
  const calls = [];
  const notices = [];
  let queueCount = 0;

  uploadThemeBackgroundImage({
    feature: {
      featureKey: "theme-x01",
      title: "Theme X01",
    },
    themeKey: "x01",
    documentRef,
    windowRef,
    runtimeApi: {
      async setThemeBackgroundImage(themeKey, dataUrl) {
        calls.push({ themeKey, dataUrl });
      },
    },
    isActive: () => active,
    setNotice(type, message) {
      notices.push({ type, message });
    },
    setThemeActionFeedback(featureKey, type, message) {
      notices.push({ featureKey, type, message });
    },
    syncThemeBackgroundIndicators(featureKey) {
      notices.push({ featureKey });
    },
    queueSync() {
      queueCount += 1;
    },
  });

  assert.equal(createdInputs.length, 1);
  active = false;
  resolveBitmap();
  await wait(5);

  assert.equal(createdInputs[0].removed, true);
  assert.deepEqual(calls, []);
  assert.deepEqual(notices, []);
  assert.equal(queueCount, 0);

  canvas.restore();
  documentRef.createElement = originalCreateElement;
});

test("theme background status nodes keep image metadata in dataset-backed attributes", () => {
  const documentRef = new FakeDocument();
  const status = buildThemeBackgroundStatus(documentRef, {
    featureKey: "theme-x01",
    title: "Theme X01",
    config: {
      backgroundImageDataUrl: `data:image/webp;base64,${"a".repeat(40)}`,
    },
  });

  assert.equal(status.dataset.adxconfigThemeImageStatus, "true");
  assert.equal(status.dataset.featureKey, "theme-x01");
  assert.equal(status.dataset.themeImageState, "present");
  assert.equal(status.dataset.themeImageType, "upload");
  assert.equal(status.dataset.themeImageSize, "30");

  applyThemeBackgroundStatusNode(documentRef, status, {
    featureKey: "theme-x01",
    title: "Theme X01",
    config: {
      backgroundImageDataUrl: "",
    },
  });

  assert.equal(status.dataset.themeImageState, "empty");
  assert.equal(status.dataset.themeImageType, "");
  assert.equal(status.dataset.themeImageSize, "");
});

test("turn dart image status nodes show and remove uploaded dart previews", () => {
  const documentRef = new FakeDocument();
  const status = buildTurnDartImageStatus(documentRef, {
    featureKey: "theme-global-typography",
    title: "Templates Global",
    config: {
      turnDartImageDataUrl: `data:image/webp;base64,${"d".repeat(40)}`,
    },
  });

  assert.equal(status.dataset.adxconfigTurnDartImageStatus, "true");
  assert.equal(status.dataset.featureKey, "theme-global-typography");
  assert.equal(status.dataset.turnDartImageState, "present");
  assert.equal(status.dataset.turnDartImageType, "image/webp");
  assert.equal(status.dataset.turnDartImageSize, "30");
  assert.match(
    String(status.querySelector(".ad-xconfig-theme-image-status-summary")?.textContent || ""),
    /Aktuelles Dart-Bild: image\/webp, 30 B\./
  );

  const preview = status.querySelector(".ad-xconfig-turn-dart-image-preview");
  assert.ok(preview);
  assert.equal(preview.getAttribute("src"), `data:image/webp;base64,${"d".repeat(40)}`);

  applyTurnDartImageStatusNode(documentRef, status, {
    featureKey: "theme-global-typography",
    title: "Templates Global",
    config: {
      turnDartImageDataUrl: "",
    },
  });

  assert.equal(status.dataset.turnDartImageState, "empty");
  assert.equal(status.dataset.turnDartImageType, "");
  assert.equal(status.dataset.turnDartImageSize, "");
  assert.equal(status.querySelector(".ad-xconfig-turn-dart-image-preview"), null);
  assert.equal(
    String(status.querySelector(".ad-xconfig-theme-image-status-summary")?.textContent || ""),
    "Aktuelles Dart-Bild: keines."
  );
});
