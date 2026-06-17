import { resolveDartDesignAsset } from "#feature-assets";
import {
  DART_CLASS,
  DART_CONTAINER_CLASS,
  DART_ROTATE_CLASS,
  DART_SHADOW_CLASS,
  buildStyleText,
  resolveDartMarkerReplacerConfig,
} from "./style.js";
import {
  DART_IMAGE_SOURCE_HEIGHT,
  DART_IMAGE_SOURCE_WIDTH,
  DART_IMAGE_TIP_Y,
} from "./logic.js";
import {
  DART_IMPACT_SHADOW_OPACITY_BOOST,
  createDartImpactShadowKeyframes,
  createDartImpactShadowOptions,
  createDartImpactWobbleKeyframes,
  createDartImpactWobbleOptions,
} from "./impact.js";

const PREVIEW_ID = "ad-ext-dart-marker-replacer-preview";
const PREVIEW_STYLE_ID = "ad-ext-dart-marker-replacer-preview-style";
const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const DART_ASPECT_RATIO = DART_IMAGE_SOURCE_WIDTH / DART_IMAGE_SOURCE_HEIGHT;
const TIP_OFFSET_Y_RATIO = DART_IMAGE_TIP_Y / DART_IMAGE_SOURCE_HEIGHT;
const PREVIEW_BASE_DART_LENGTH = 86;
const PREVIEW_CLEANUP_BUFFER_MS = 1800;
const previewSessionByWindow = new WeakMap();

function clearNode(node) {
  if (!node) {
    return;
  }

  while (node.firstChild) {
    node.firstChild.remove();
  }
}

function getTimerFns(windowRef) {
  return {
    setTimeoutRef:
      windowRef && typeof windowRef.setTimeout === "function"
        ? windowRef.setTimeout.bind(windowRef)
        : setTimeout,
    clearTimeoutRef:
      windowRef && typeof windowRef.clearTimeout === "function"
        ? windowRef.clearTimeout.bind(windowRef)
        : clearTimeout,
  };
}

function createSvgElement(documentRef, tagName, attributes = {}) {
  const node = documentRef.createElementNS(SVG_NS, tagName);
  Object.entries(attributes).forEach(([name, value]) => {
    node.setAttribute(name, String(value));
  });
  return node;
}

function setImageSource(imageNode, sourceUrl) {
  imageNode.setAttribute("href", sourceUrl);
  if (typeof imageNode.setAttributeNS === "function") {
    imageNode.setAttributeNS(XLINK_NS, "href", sourceUrl);
  }
}

function ensurePreviewStyle(documentRef) {
  const existingStyle = documentRef.getElementById?.(PREVIEW_STYLE_ID);
  if (existingStyle) {
    return existingStyle;
  }

  const style = documentRef.createElement("style");
  style.id = PREVIEW_STYLE_ID;
  style.textContent = `
${buildStyleText()}
#${PREVIEW_ID}{display:block;width:100%;pointer-events:auto}
#${PREVIEW_ID}[data-preview-mode="overlay"]{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;background:rgba(4,9,22,.56)}
#${PREVIEW_ID} .ad-ext-dart-marker-replacer-preview-stage{width:100%;border:1px solid rgba(255,255,255,.2);border-radius:8px;background:linear-gradient(160deg,rgba(13,24,58,.92),rgba(25,32,71,.88));box-shadow:inset 0 0 0 1px rgba(126,216,255,.08);padding:.6rem}
#${PREVIEW_ID}[data-preview-mode="overlay"] .ad-ext-dart-marker-replacer-preview-stage{width:min(34rem,calc(100vw - 2rem));border-radius:12px;background:linear-gradient(160deg,rgba(13,24,58,.98),rgba(25,32,71,.98));box-shadow:0 16px 44px rgba(0,0,0,.42);padding:.85rem}
#${PREVIEW_ID} .ad-ext-dart-marker-replacer-preview-head{display:none;align-items:center;justify-content:space-between;gap:.75rem;margin-bottom:.55rem;color:#fff;font:700 .86rem "Open Sans","Segoe UI",Tahoma,sans-serif}
#${PREVIEW_ID}[data-preview-mode="overlay"] .ad-ext-dart-marker-replacer-preview-head{display:flex}
#${PREVIEW_ID} .ad-ext-dart-marker-replacer-preview-close{border:1px solid rgba(255,255,255,.26);border-radius:8px;background:rgba(255,255,255,.08);color:#fff;width:2rem;height:2rem;cursor:pointer}
#${PREVIEW_ID} svg{display:block;width:100%;height:auto;overflow:visible;border-radius:8px;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.13),rgba(7,14,30,.82) 62%,rgba(3,7,18,.94))}
#${PREVIEW_ID} .ad-ext-dart-marker-replacer-preview-board{fill:rgba(8,16,36,.82);stroke:rgba(255,255,255,.2);stroke-width:2}
#${PREVIEW_ID} .ad-ext-dart-marker-replacer-preview-board-band{fill:none;stroke:rgba(255,255,255,.14);stroke-width:12}
#${PREVIEW_ID} .ad-ext-dart-marker-replacer-preview-segment{fill:rgba(126,216,255,.12);stroke:rgba(126,216,255,.42);stroke-width:1}
#${PREVIEW_ID} .ad-ext-dart-marker-replacer-preview-ring{fill:none;stroke:rgba(126,216,255,.5);stroke-width:2;stroke-dasharray:5 5}
#${PREVIEW_ID} .ad-ext-dart-marker-replacer-preview-marker{fill:rgb(49,130,206);stroke:#fff;stroke-width:1.5}
`;
  documentRef.head?.appendChild(style);
  return style;
}

function clearDartMarkerReplacerPreview(windowRef) {
  const session = previewSessionByWindow.get(windowRef);
  if (!session) {
    return;
  }

  const { clearTimeoutRef } = getTimerFns(windowRef);
  session.timers.forEach((timerHandle) => clearTimeoutRef(timerHandle));
  session.animations.forEach((animation) => {
    try {
      animation.cancel?.();
    } catch (_) {
      // fail-soft animation cleanup
    }
  });
  session.root?.remove?.();
  session.style?.remove?.();
  previewSessionByWindow.delete(windowRef);
}

function createPreviewImage(documentRef, className, sourceUrl, geometry) {
  const image = createSvgElement(documentRef, "image", {
    class: className,
    preserveAspectRatio: "xMidYMid meet",
    "aria-hidden": "true",
    x: geometry.x,
    y: geometry.y,
    width: geometry.width,
    height: geometry.height,
  });
  setImageSource(image, sourceUrl);
  image.style.transformOrigin = geometry.transformOrigin;
  return image;
}

function resolveInlinePreviewTarget(options = {}) {
  const targetNode = options.targetNode || null;
  if (
    targetNode &&
    targetNode.isConnected !== false &&
    typeof targetNode.appendChild === "function"
  ) {
    return targetNode;
  }

  return null;
}

function animatePreviewDart(entry, visualConfig, windowRef, session) {
  if (!visualConfig.animateDarts || typeof entry.container.animate !== "function") {
    return 0;
  }

  const durationMs = Math.max(0, Number(visualConfig.flightDurationMs) || 0);
  const blurStart = visualConfig.enableFlightBlur ? "blur(2px)" : "blur(0px)";
  const blurMid = visualConfig.enableFlightBlur ? "blur(1px)" : "blur(0px)";
  const flightAnimation = entry.container.animate(
    [
      { transform: "translate(104px,-26px) scale(.94)", opacity: 0.2, filter: blurStart },
      { transform: "translate(34px,-8px) scale(.98)", opacity: 0.76, filter: blurMid },
      { transform: "translate(0,0) scale(1)", opacity: 1, filter: "blur(0px)" },
    ],
    {
      duration: durationMs,
      easing: "cubic-bezier(0.15,0.7,0.2,1)",
      fill: "both",
    }
  );
  session.animations.add(flightAnimation);

  if (
    visualConfig.enableShadow &&
    entry.shadowNode &&
    typeof entry.shadowNode.animate === "function"
  ) {
    const baseOpacity = 0.26;
    const maxOpacity = Math.min(1, baseOpacity + DART_IMPACT_SHADOW_OPACITY_BOOST);
    const shadowAnimation = entry.shadowNode.animate(
      createDartImpactShadowKeyframes(baseOpacity, maxOpacity),
      createDartImpactShadowOptions(durationMs)
    );
    session.animations.add(shadowAnimation);
  }

  if (
    visualConfig.enableWobble &&
    entry.imageNode &&
    typeof entry.imageNode.animate === "function"
  ) {
    const wobbleAnimation = entry.imageNode.animate(
      createDartImpactWobbleKeyframes(),
      createDartImpactWobbleOptions(durationMs)
    );
    session.animations.add(wobbleAnimation);
  }

  return durationMs;
}

export function runDartMarkerReplacerPreview(options = {}) {
  const documentRef =
    options.documentRef ||
    (globalThis.document !== undefined ? globalThis.document : null);
  const windowRef =
    options.windowRef ||
    documentRef?.defaultView ||
    (globalThis.window !== undefined ? globalThis.window : null);
  if (!documentRef || !windowRef) {
    throw new Error("Dart Marker Replacer preview requires a browser document.");
  }

  clearDartMarkerReplacerPreview(windowRef);

  const visualConfig = resolveDartMarkerReplacerConfig(options.featureConfig || {});
  const sourceUrl = resolveDartDesignAsset(visualConfig.designKey);
  const inlineTarget = resolveInlinePreviewTarget(options);
  const isInlinePreview = Boolean(inlineTarget);
  const style = ensurePreviewStyle(documentRef);
  const { setTimeoutRef } = getTimerFns(windowRef);
  const session = {
    root: null,
    style,
    timers: new Set(),
    animations: new Set(),
  };

  const root = documentRef.createElement("div");
  root.id = PREVIEW_ID;
  root.setAttribute("role", "presentation");
  root.setAttribute("data-preview-mode", isInlinePreview ? "inline" : "overlay");
  const stage = documentRef.createElement("div");
  stage.className = "ad-ext-dart-marker-replacer-preview-stage";
  const head = documentRef.createElement("div");
  head.className = "ad-ext-dart-marker-replacer-preview-head";
  const title = documentRef.createElement("span");
  title.textContent = "Virtueller Dart-Marker";
  const closeButton = documentRef.createElement("button");
  closeButton.type = "button";
  closeButton.className = "ad-ext-dart-marker-replacer-preview-close";
  closeButton.setAttribute("aria-label", "Demo schließen");
  closeButton.textContent = "×";
  head.append(title, closeButton);

  const svg = createSvgElement(documentRef, "svg", {
    viewBox: "0 0 320 168",
    focusable: "false",
  });
  svg.appendChild(createSvgElement(documentRef, "circle", {
    cx: "160",
    cy: "84",
    r: "62",
    class: "ad-ext-dart-marker-replacer-preview-board",
  }));
  svg.appendChild(createSvgElement(documentRef, "circle", {
    cx: "160",
    cy: "84",
    r: "42",
    class: "ad-ext-dart-marker-replacer-preview-board-band",
  }));
  svg.appendChild(createSvgElement(documentRef, "path", {
    d: "M160 84 L200 36 A62 62 0 0 1 221 94 Z",
    class: "ad-ext-dart-marker-replacer-preview-segment",
  }));
  svg.appendChild(createSvgElement(documentRef, "circle", {
    cx: "194",
    cy: "70",
    r: "15",
    class: "ad-ext-dart-marker-replacer-preview-ring",
  }));
  const marker = createSvgElement(documentRef, "circle", {
    cx: "194",
    cy: "70",
    r: "6",
    class: "ad-ext-dart-marker-replacer-preview-marker",
  });
  marker.style.opacity = visualConfig.hideOriginalMarkers ? "0" : "1";
  svg.appendChild(marker);

  const dartLength = PREVIEW_BASE_DART_LENGTH * visualConfig.sizeMultiplier;
  const dartHeight = dartLength / DART_ASPECT_RATIO;
  const target = { x: 194, y: 70 };
  const geometry = {
    x: target.x,
    y: target.y - dartHeight * TIP_OFFSET_Y_RATIO,
    width: dartLength,
    height: dartHeight,
    transformOrigin: `0% ${TIP_OFFSET_Y_RATIO * 100}%`,
  };
  const container = createSvgElement(documentRef, "g", {
    class: DART_CONTAINER_CLASS,
  });
  const rotateGroup = createSvgElement(documentRef, "g", {
    class: DART_ROTATE_CLASS,
    transform: `rotate(18 ${target.x} ${target.y})`,
  });
  const shadowNode = createPreviewImage(
    documentRef,
    DART_SHADOW_CLASS,
    sourceUrl,
    geometry
  );
  shadowNode.style.opacity = visualConfig.enableShadow ? "0.26" : "0";
  shadowNode.style.display = visualConfig.enableShadow ? "" : "none";
  shadowNode.style.transform = "translate(6px,5px) scale(1.08,1) skewY(3deg)";
  shadowNode.style.filter =
    visualConfig.enableShadow && visualConfig.enableShadowBlur ? "blur(2px)" : "";
  const imageNode = createPreviewImage(documentRef, DART_CLASS, sourceUrl, geometry);
  rotateGroup.append(shadowNode, imageNode);
  container.appendChild(rotateGroup);
  svg.appendChild(container);

  stage.append(head, svg);
  root.appendChild(stage);
  if (inlineTarget) {
    clearNode(inlineTarget);
    inlineTarget.appendChild(root);
  } else {
    documentRef.body?.appendChild(root);
  }
  session.root = root;
  previewSessionByWindow.set(windowRef, session);

  if (!isInlinePreview) {
    closeButton.addEventListener("click", () => clearDartMarkerReplacerPreview(windowRef));
    root.addEventListener("click", (event) => {
      if (event.target === root) {
        clearDartMarkerReplacerPreview(windowRef);
      }
    });
  }

  const durationMs = animatePreviewDart(
    { container, shadowNode, imageNode },
    visualConfig,
    windowRef,
    session
  );
  if (!isInlinePreview) {
    const cleanupHandle = setTimeoutRef(
      () => clearDartMarkerReplacerPreview(windowRef),
      Math.max(1500, durationMs + PREVIEW_CLEANUP_BUFFER_MS)
    );
    session.timers.add(cleanupHandle);
  }

  return {
    ok: true,
    designKey: visualConfig.designKey,
    sizePercent: visualConfig.sizePercent,
    animateDarts: visualConfig.animateDarts,
    mode: isInlinePreview ? "inline" : "overlay",
  };
}
