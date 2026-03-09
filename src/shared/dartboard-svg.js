function getBoardRadius(rootNode) {
  if (!rootNode || typeof rootNode.querySelectorAll !== "function") {
    return 0;
  }

  return Array.from(rootNode.querySelectorAll("circle")).reduce((max, circle) => {
    const radius = Number.parseFloat(circle?.getAttribute?.("r"));
    return Number.isFinite(radius) && radius > max ? radius : max;
  }, 0);
}

function isManagedOverlayGroup(groupNode) {
  if (!groupNode || typeof groupNode.getAttribute !== "function") {
    return false;
  }

  const id = String(groupNode.getAttribute("id") || "").trim().toLowerCase();
  if (!id) {
    return false;
  }

  return id.startsWith("ad-ext-");
}

export function findBoardSvgGroup(documentRef) {
  if (!documentRef || typeof documentRef.querySelectorAll !== "function") {
    return null;
  }

  const svgNodes = Array.from(documentRef.querySelectorAll("svg"));
  if (!svgNodes.length) {
    return null;
  }

  let bestSvg = null;
  let bestScore = -1;

  svgNodes.forEach((svgNode) => {
    const numberCount = new Set(
      Array.from(svgNode.querySelectorAll("text"))
        .map((node) => Number.parseInt(node?.textContent || "", 10))
        .filter((value) => Number.isFinite(value) && value >= 1 && value <= 20)
    ).size;
    const radius = getBoardRadius(svgNode);
    const score = numberCount * 1000 + radius;
    if (score > bestScore) {
      bestSvg = svgNode;
      bestScore = score;
    }
  });

  if (!bestSvg) {
    return null;
  }

  let bestGroup = null;
  let bestRadius = 0;

  Array.from(bestSvg.querySelectorAll("g")).forEach((group) => {
    if (isManagedOverlayGroup(group)) {
      return;
    }

    const groupRadius = getBoardRadius(group);
    if (groupRadius > bestRadius) {
      bestRadius = groupRadius;
      bestGroup = group;
    }
  });

  const radius = bestRadius || getBoardRadius(bestSvg);
  if (!radius) {
    return null;
  }

  return {
    svg: bestSvg,
    group: bestGroup || bestSvg,
    radius,
  };
}

export function ensureOverlayGroup(boardGroup, overlayId, svgNs = "http://www.w3.org/2000/svg") {
  if (!boardGroup || typeof boardGroup.querySelector !== "function") {
    return null;
  }

  let overlay = boardGroup.querySelector(`#${overlayId}`);
  if (overlay) {
    return overlay;
  }

  const ownerDocument = boardGroup.ownerDocument;
  if (!ownerDocument || typeof ownerDocument.createElementNS !== "function") {
    return null;
  }

  overlay = ownerDocument.createElementNS(svgNs, "g");
  overlay.id = overlayId;
  if (typeof boardGroup.appendChild === "function") {
    boardGroup.appendChild(overlay);
  }
  return overlay;
}

export function clearNodeChildren(node) {
  if (!node || typeof node.firstChild === "undefined") {
    return;
  }

  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}
