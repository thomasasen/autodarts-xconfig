const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export const ELECTRIC_FILTER_DEFS_NODE_ID = "ad-ext-electric-filter-defs";
export const ELECTRIC_FILTER_SOFT_ID = "ad-ext-electric-displace-soft";
export const ELECTRIC_FILTER_STRONG_ID = "ad-ext-electric-displace-strong";
export const ELECTRIC_FILTER_READY_CLASS = "ad-ext-electric-filter-ready";

const REF_COUNT_BY_DOCUMENT = new WeakMap();

function getDocument(documentRef = null) {
  if (documentRef && typeof documentRef === "object") {
    return documentRef;
  }
  if (typeof document !== "undefined") {
    return document;
  }
  return null;
}

function createSvgNode(documentRef, tagName) {
  if (!documentRef || !tagName) {
    return null;
  }

  if (typeof documentRef.createElementNS === "function") {
    return documentRef.createElementNS(SVG_NAMESPACE, tagName);
  }
  if (typeof documentRef.createElement === "function") {
    return documentRef.createElement(tagName);
  }
  return null;
}

function setNodeAttributes(node, attributes = {}) {
  if (!node || typeof node.setAttribute !== "function") {
    return;
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }
    node.setAttribute(key, String(value));
  });
}

function appendAnimationNode(documentRef, parentNode, attributes = {}) {
  const animationNode = createSvgNode(documentRef, "animate");
  if (!animationNode || !parentNode || typeof parentNode.appendChild !== "function") {
    return null;
  }

  setNodeAttributes(animationNode, attributes);
  parentNode.appendChild(animationNode);
  return animationNode;
}

function appendFilterNode(documentRef, defsNode, options = {}) {
  if (!documentRef || !defsNode || typeof defsNode.appendChild !== "function") {
    return null;
  }

  const filterNode = createSvgNode(documentRef, "filter");
  const turbulenceNode = createSvgNode(documentRef, "feTurbulence");
  const displacementNode = createSvgNode(documentRef, "feDisplacementMap");
  if (!filterNode || !turbulenceNode || !displacementNode) {
    return null;
  }

  const id = String(options.id || "").trim();
  const baseFrequency = String(options.baseFrequency || "0.018 0.06");
  const frequencyValues = String(options.frequencyValues || `${baseFrequency};${baseFrequency}`);
  const frequencyDuration = String(options.frequencyDuration || "700ms");
  const scale = Number.isFinite(Number(options.scale)) ? Number(options.scale) : 9;
  const scaleValues = String(options.scaleValues || `${scale};${scale}`);
  const scaleDuration = String(options.scaleDuration || "780ms");
  const seed = Number.isFinite(Number(options.seed)) ? Number(options.seed) : 11;
  const numOctaves = Number.isFinite(Number(options.numOctaves)) ? Number(options.numOctaves) : 3;

  setNodeAttributes(filterNode, {
    id,
    x: "-18%",
    y: "-18%",
    width: "136%",
    height: "136%",
    colorInterpolationFilters: "sRGB",
  });
  setNodeAttributes(turbulenceNode, {
    type: "fractalNoise",
    baseFrequency,
    numOctaves,
    seed,
    stitchTiles: "stitch",
    result: "noise",
  });
  appendAnimationNode(documentRef, turbulenceNode, {
    attributeName: "baseFrequency",
    dur: frequencyDuration,
    values: frequencyValues,
    repeatCount: "indefinite",
  });
  setNodeAttributes(displacementNode, {
    in: "SourceGraphic",
    in2: "noise",
    scale,
    xChannelSelector: "R",
    yChannelSelector: "G",
    result: "displaced",
  });
  appendAnimationNode(documentRef, displacementNode, {
    attributeName: "scale",
    dur: scaleDuration,
    values: scaleValues,
    repeatCount: "indefinite",
  });

  filterNode.appendChild(turbulenceNode);
  filterNode.appendChild(displacementNode);
  defsNode.appendChild(filterNode);
  return filterNode;
}

function createElectricDefsNode(documentRef) {
  const svgNode = createSvgNode(documentRef, "svg");
  const defsNode = createSvgNode(documentRef, "defs");
  if (!svgNode || !defsNode) {
    return null;
  }

  setNodeAttributes(svgNode, {
    id: ELECTRIC_FILTER_DEFS_NODE_ID,
    width: "0",
    height: "0",
    focusable: "false",
    "aria-hidden": "true",
    role: "presentation",
    style: "position:fixed;width:0;height:0;overflow:hidden;pointer-events:none;opacity:0;z-index:-1;",
  });

  appendFilterNode(documentRef, defsNode, {
    id: ELECTRIC_FILTER_SOFT_ID,
    baseFrequency: "0.013 0.048",
    frequencyValues: "0.010 0.040;0.015 0.055;0.011 0.044;0.013 0.048",
    frequencyDuration: "640ms",
    scale: 7,
    scaleValues: "5;8;6;7",
    scaleDuration: "760ms",
    numOctaves: 2,
    seed: 7,
  });
  appendFilterNode(documentRef, defsNode, {
    id: ELECTRIC_FILTER_STRONG_ID,
    baseFrequency: "0.018 0.082",
    frequencyValues: "0.015 0.070;0.022 0.094;0.017 0.078;0.018 0.082",
    frequencyDuration: "540ms",
    scale: 11,
    scaleValues: "8;14;10;11",
    scaleDuration: "660ms",
    numOctaves: 3,
    seed: 11,
  });

  svgNode.appendChild(defsNode);
  return svgNode;
}

function getDocumentState(documentRef) {
  const existing = REF_COUNT_BY_DOCUMENT.get(documentRef);
  if (existing) {
    return existing;
  }

  const created = {
    refCount: 0,
    defsNode: null,
  };
  REF_COUNT_BY_DOCUMENT.set(documentRef, created);
  return created;
}

function ensureDefsNode(options = {}) {
  const documentRef = options.documentRef;
  const domGuards = options.domGuards || null;
  const rootParent =
    options.parentNode ||
    documentRef?.body ||
    documentRef?.documentElement ||
    documentRef?.head ||
    null;
  if (!documentRef || !rootParent || typeof rootParent.appendChild !== "function") {
    return null;
  }

  const selector = `#${ELECTRIC_FILTER_DEFS_NODE_ID}`;
  if (domGuards && typeof domGuards.ensureSingleNode === "function") {
    return (
      domGuards.ensureSingleNode({
        selector,
        id: ELECTRIC_FILTER_DEFS_NODE_ID,
        parent: rootParent,
        create: (doc) => createElectricDefsNode(doc || documentRef),
      }) || null
    );
  }

  const existing =
    typeof documentRef.getElementById === "function"
      ? documentRef.getElementById(ELECTRIC_FILTER_DEFS_NODE_ID)
      : null;
  if (existing) {
    return existing;
  }

  const created = createElectricDefsNode(documentRef);
  if (created) {
    rootParent.appendChild(created);
  }
  return created;
}

function setReadyClass(documentRef, enabled) {
  const rootNode = documentRef?.documentElement || null;
  if (!rootNode?.classList) {
    return;
  }

  rootNode.classList.toggle(ELECTRIC_FILTER_READY_CLASS, enabled === true);
}

export function retainElectricFilterDefs(options = {}) {
  const documentRef = getDocument(options.documentRef);
  if (!documentRef) {
    return {
      available: false,
      refCount: 0,
      softFilterId: ELECTRIC_FILTER_SOFT_ID,
      strongFilterId: ELECTRIC_FILTER_STRONG_ID,
    };
  }

  const state = getDocumentState(documentRef);
  state.refCount += 1;
  state.defsNode = ensureDefsNode({
    documentRef,
    domGuards: options.domGuards,
    parentNode: options.parentNode,
  });
  setReadyClass(documentRef, Boolean(state.defsNode));

  return {
    available: Boolean(state.defsNode),
    refCount: state.refCount,
    softFilterId: ELECTRIC_FILTER_SOFT_ID,
    strongFilterId: ELECTRIC_FILTER_STRONG_ID,
  };
}

export function releaseElectricFilterDefs(options = {}) {
  const documentRef = getDocument(options.documentRef);
  if (!documentRef) {
    return 0;
  }

  const state = REF_COUNT_BY_DOCUMENT.get(documentRef);
  if (!state) {
    setReadyClass(documentRef, false);
    return 0;
  }

  state.refCount = Math.max(0, Number(state.refCount || 0) - 1);
  if (state.refCount > 0) {
    return state.refCount;
  }

  const nodeFromDocument =
    typeof documentRef.getElementById === "function"
      ? documentRef.getElementById(ELECTRIC_FILTER_DEFS_NODE_ID)
      : null;
  const nodeToRemove = nodeFromDocument || state.defsNode || null;
  if (nodeToRemove && typeof nodeToRemove.remove === "function") {
    nodeToRemove.remove();
  } else if (
    nodeToRemove &&
    nodeToRemove.parentNode &&
    typeof nodeToRemove.parentNode.removeChild === "function"
  ) {
    nodeToRemove.parentNode.removeChild(nodeToRemove);
  }

  setReadyClass(documentRef, false);
  REF_COUNT_BY_DOCUMENT.delete(documentRef);
  return 0;
}
