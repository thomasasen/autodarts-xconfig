function normalizeSidebarRouteHints(values) {
  if (values instanceof Set) {
    return values;
  }
  return new Set(Array.isArray(values) ? values : []);
}

function restoreShellContent(controller) {
  controller.state.hiddenDisplays.forEach((displayValue, node) => {
    if (node?.isConnected) {
      node.style.display = displayValue;
    }
  });
  controller.state.hiddenDisplays.clear();
  controller.state.contentHidden = false;
}

function hideShellContent(controller, content, host) {
  Array.from(content?.children || []).forEach((child) => {
    if (child === host || controller.isNavigationElement(child)) {
      return;
    }

    if (!controller.state.hiddenDisplays.has(child)) {
      controller.state.hiddenDisplays.set(child, child.style.display || "");
    }
    child.style.display = "none";
  });
  controller.state.contentHidden = true;
}

function restoreAttribute(node, name, value) {
  if (!node) {
    return;
  }
  if (value === null) {
    node.removeAttribute?.(name);
  } else {
    node.setAttribute?.(name, value);
  }
}

function restoreNativeNavigationState(controller) {
  const presentation = controller.state.nativeNavigationPresentation;
  if (!presentation) {
    return;
  }

  const { activeItem, menuItem, indicator } = presentation;
  if (activeItem?.isConnected) {
    restoreAttribute(activeItem, "class", presentation.activeItemClass);
    restoreAttribute(activeItem, "aria-current", presentation.activeItemAriaCurrent);
    restoreAttribute(activeItem, "data-status", presentation.activeItemDataStatus);
  }
  if (menuItem?.isConnected) {
    restoreAttribute(menuItem, "class", presentation.menuItemClass);
  }
  if (indicator?.isConnected) {
    indicator.style.left = presentation.indicatorLeft;
    indicator.style.width = presentation.indicatorWidth;
  }

  controller.state.nativeNavigationPresentation = null;
}

function findNativeNavigationIndicator(sidebar, menuItem) {
  return Array.from(sidebar?.children || []).find((node) => {
    return node !== menuItem &&
      node.getAttribute?.("aria-hidden") === "true" &&
      node.classList?.contains?.("absolute") &&
      node.classList?.contains?.("bottom-0");
  }) || null;
}

function syncNativeNavigationState(controller, menuItem) {
  const sidebar = menuItem?.parentElement || null;
  if (!sidebar) {
    return;
  }

  const existing = controller.state.nativeNavigationPresentation;
  if (
    existing &&
    (
      existing.menuItem !== menuItem ||
      !existing.activeItem?.isConnected ||
      !existing.indicator?.isConnected
    )
  ) {
    restoreNativeNavigationState(controller);
  }

  if (!controller.state.nativeNavigationPresentation) {
    const sidebarItems = Array.from(sidebar.querySelectorAll?.("a[href], button, [role='button']") || []);
    const activeItem = sidebarItems.find((item) => {
      return item !== menuItem &&
        (item.getAttribute?.("aria-current") === "page" || item.getAttribute?.("data-status") === "active");
    }) || null;
    const indicator = findNativeNavigationIndicator(sidebar, menuItem);
    if (!activeItem || !indicator) {
      return;
    }

    controller.state.nativeNavigationPresentation = {
      activeItem,
      activeItemClass: activeItem.getAttribute?.("class"),
      activeItemAriaCurrent: activeItem.getAttribute?.("aria-current"),
      activeItemDataStatus: activeItem.getAttribute?.("data-status"),
      menuItem,
      menuItemClass: menuItem.getAttribute?.("class"),
      indicator,
      indicatorLeft: indicator.style.left || "",
      indicatorWidth: indicator.style.width || "",
    };

    restoreAttribute(activeItem, "class", controller.state.nativeNavigationPresentation.menuItemClass);
    activeItem.removeAttribute?.("aria-current");
    activeItem.removeAttribute?.("data-status");
    restoreAttribute(menuItem, "class", controller.state.nativeNavigationPresentation.activeItemClass);
  }

  const presentation = controller.state.nativeNavigationPresentation;
  const sidebarRect = sidebar.getBoundingClientRect?.();
  const menuRect = menuItem.getBoundingClientRect?.();
  if (!sidebarRect || !menuRect || menuRect.width <= 0) {
    return;
  }
  presentation.indicator.style.left = `${menuRect.left - sidebarRect.left}px`;
  presentation.indicator.style.width = `${menuRect.width}px`;
}

function syncMenuButtonState(controller) {
  const button = controller.documentRef.getElementById?.(controller.menuItemId);
  if (!button) {
    return;
  }
  if (controller.isConfigRoute()) {
    button.dataset.active = "true";
    button.setAttribute("aria-current", "page");
    syncNativeNavigationState(controller, button);
  } else {
    restoreNativeNavigationState(controller);
    delete button.dataset.active;
    button.removeAttribute("aria-current");
  }
}

function syncMenuUpdateState(controller, item = null) {
  const button = item || controller.documentRef.getElementById?.(controller.menuItemId);
  if (!button) {
    return;
  }

  const hasUpdate = Boolean(controller.state.updateStatus?.available);
  const remoteVersion = String(controller.state.updateStatus?.remoteVersion || "").trim();
  const title = hasUpdate && remoteVersion
    ? `${controller.menuLabel} - Update verfügbar (${controller.installedVersion} -> ${remoteVersion})`
    : controller.menuLabel;

  if (hasUpdate) {
    button.dataset.updateAvailable = "true";
  } else {
    delete button.dataset.updateAvailable;
  }

  button.dataset.updateState = String(controller.state.updateStatus?.status || "");
  button.setAttribute("title", title);
  button.setAttribute("aria-label", title);
}

function syncMenuLabelVisibility(controller, item = null) {
  const menuItem = item || controller.documentRef.getElementById?.(controller.menuItemId);
  if (!menuItem) {
    return;
  }
  const label = menuItem.querySelector?.(".ad-xconfig-menu-label");
  if (!label) {
    return;
  }
  label.style.display = "inline";
}

function resolveSidebarTemplate(controller, sidebar, insertionAnchor) {
  return [
    insertionAnchor,
    ...Array.from(sidebar.querySelectorAll?.("a[href], button, [role='button']") || []),
    sidebar.lastElementChild,
  ].find((node) => {
    return Boolean(node) &&
      node.id !== controller.menuItemId &&
      !node.closest?.(`#${controller.panelHostId}`) &&
      String(node.dataset?.adxconfigTab || "").trim() === "";
  }) || null;
}

function ensureMenuButton(controller) {
  const sidebar = controller.getSidebarElement(controller.windowRef, controller.documentRef, {
    panelHostId: controller.panelHostId,
    sidebarRouteHints: controller.sidebarRouteHints,
  });
  if (!sidebar) {
    return null;
  }

  const sidebarItems = Array.from(sidebar.querySelectorAll("a[href], button, [role='button']"));
  const sidebarLinks = sidebarItems.filter((item) => item.getAttribute?.("href"));
  const statsAnchor = sidebarItems.find((item) => {
    const route = controller.toRoutePathname(controller.windowRef, item.getAttribute?.("href"));
    const label = String(item.textContent || "").trim().toLowerCase();
    return route === "/statistics" || route === "/stats" || label === "stats" || label === "statistik";
  }) || null;
  const boardsAnchor =
    sidebarLinks.find((link) => controller.toRoutePathname(controller.windowRef, link.getAttribute("href")) === "/boards") ||
    sidebarLinks.find((link) => String(link.textContent || "").trim().toLowerCase() === "meine boards") ||
    null;
  const insertionAnchor =
    statsAnchor ||
    boardsAnchor ||
    sidebarLinks.find((link) => controller.sidebarRouteHints.has(controller.toRoutePathname(controller.windowRef, link.getAttribute("href")))) ||
    null;
  const template = resolveSidebarTemplate(controller, sidebar, insertionAnchor);

  let item = controller.documentRef.getElementById?.(controller.menuItemId);
  const shouldRebuildExistingItem =
    Boolean(item) &&
    (
      Boolean(item.closest?.(`#${controller.panelHostId}`)) ||
      item.getAttribute?.("data-adxconfig-tab") !== null ||
      String(item.getAttribute?.("data-adxconfig-action") || "").trim() !== "open" ||
      !item.querySelector?.(".ad-xconfig-menu-label")
    );
  if (shouldRebuildExistingItem) {
    item.remove?.();
    item = null;
  }

  if (!item) {
    item = template ? template.cloneNode(true) : controller.createElement(controller.documentRef, "button", { type: "button" });
    const label = controller.createElement(controller.documentRef, "span", {
      className: "ad-xconfig-menu-label",
      text: controller.menuLabel,
    });
    item.textContent = "";
    item.replaceChildren(label);
  }

  item.id = controller.menuItemId;
  item.classList?.remove?.("ad-xconfig-tab");
  item.removeAttribute?.("data-adxconfig-tab");
  item.setAttribute("role", "button");
  item.setAttribute("tabindex", "0");
  item.setAttribute("aria-label", controller.menuLabel);
  item.setAttribute("title", controller.menuLabel);
  item.dataset.adxconfigAction = "open";
  item.style.cursor = "pointer";

  if (String(item.tagName || "").toLowerCase() === "a") {
    item.removeAttribute("href");
  } else if (String(item.tagName || "").toLowerCase() === "button") {
    item.setAttribute("type", "button");
  }

  const labelNode = item.querySelector?.(".ad-xconfig-menu-label");
  if (!labelNode) {
    const label = controller.createElement(controller.documentRef, "span", {
      className: "ad-xconfig-menu-label",
      text: controller.menuLabel,
    });
    item.replaceChildren(label);
  } else {
    labelNode.textContent = controller.menuLabel;
    item.replaceChildren(labelNode);
  }

  if (insertionAnchor) {
    if (insertionAnchor.nextElementSibling !== item) {
      insertionAnchor.after(item);
    }
  } else if (item.parentNode !== sidebar) {
    sidebar.appendChild(item);
  }

  syncMenuButtonState(controller);
  syncMenuUpdateState(controller, item);
  syncMenuLabelVisibility(controller, item);
  return item;
}

function ensurePanelHost(controller) {
  const sidebar = controller.getSidebarElement(controller.windowRef, controller.documentRef, {
    panelHostId: controller.panelHostId,
    sidebarRouteHints: controller.sidebarRouteHints,
  });
  const content = controller.getContentElement(controller.windowRef, controller.documentRef, sidebar, {
    panelHostId: controller.panelHostId,
    sidebarRouteHints: controller.sidebarRouteHints,
  });
  if (!content) {
    return null;
  }

  let host = controller.documentRef.getElementById?.(controller.panelHostId);
  if (!host) {
    host = controller.createElement(controller.documentRef, "section", {
      id: controller.panelHostId,
    });
  }

  if (content === host || host.contains?.(content)) {
    return host;
  }

  if (host.parentNode !== content) {
    content.appendChild(host);
  }

  return host;
}

function shouldKeepModalStable(previousSignaturePayload, state, routeActive) {
  return Boolean(previousSignaturePayload?.routeActive) &&
    String(previousSignaturePayload?.activeSettingsFeatureKey || "") !== "" &&
    String(previousSignaturePayload?.activeSettingsFeatureKey || "") === String(state.activeSettingsFeatureKey || "") &&
    Boolean(routeActive);
}

const STABLE_MODAL_PREVIEW_REFRESH_SELECTORS = Object.freeze([
  "[data-adxconfig-checkout-suggestion-styles-preview='true']",
  "[data-adxconfig-checkout-score-highlight-preview='true']",
  "[data-adxconfig-x01-remaining-score-bar-preview='true']",
  "[data-adxconfig-checkout-target-highlights-preview='true']",
]);

function captureModalScrollState(previousShellNode, host) {
  const previousModal = previousShellNode?.querySelector?.(".ad-xconfig-modal") || null;
  const previousModalBody = previousShellNode?.querySelector?.(".ad-xconfig-modal-body") || null;
  return {
    hostScrollTop: Number(host.scrollTop || 0),
    previousModalScrollTop: Number(previousModal?.scrollTop || 0),
    previousModalBodyScrollTop: Number(previousModalBody?.scrollTop || 0),
  };
}

function restoreModalScrollState(shellNode, modalScrollState) {
  const nextModal = shellNode?.querySelector?.(".ad-xconfig-modal") || null;
  const nextModalBody = shellNode?.querySelector?.(".ad-xconfig-modal-body") || null;
  if (nextModal) {
    nextModal.scrollTop = modalScrollState.previousModalScrollTop;
  }
  if (nextModalBody) {
    nextModalBody.scrollTop = modalScrollState.previousModalBodyScrollTop;
  }
}

function replaceNodeFromSource(targetNode, sourceNode) {
  if (!targetNode || !sourceNode) {
    return;
  }

  const parentNode = targetNode.parentNode || null;
  if (!parentNode || typeof targetNode.before !== "function") {
    while (targetNode.firstChild) {
      targetNode.firstChild.remove();
    }
    const sourceChildren = sourceNode.childNodes?.length
      ? sourceNode.childNodes
      : sourceNode.children || [];
    Array.from(sourceChildren).forEach((child) => {
      targetNode.appendChild(child);
    });
    return;
  }

  targetNode.before(sourceNode);
  targetNode.remove?.();
}

function refreshStableModalContent(previousShellNode, nextShellNode) {
  const previousModalBody = previousShellNode?.querySelector?.(".ad-xconfig-modal-body") || null;
  const nextModalBody = nextShellNode?.querySelector?.(".ad-xconfig-modal-body") || null;
  if (!previousModalBody || !nextModalBody) {
    return;
  }

  STABLE_MODAL_PREVIEW_REFRESH_SELECTORS.forEach((selector) => {
    const previousPreview = previousModalBody.querySelector?.(selector) || null;
    const nextPreview = nextModalBody.querySelector?.(selector) || null;
    replaceNodeFromSource(previousPreview, nextPreview);
  });
}

function renderShell(controller) {
  if (!controller.state.started) {
    return;
  }

  const host = ensurePanelHost(controller);
  if (!host) {
    return;
  }
  const features = controller.getFeatures();
  const routeActive = controller.isConfigRoute();
  const nextSignature = controller.buildShellRenderSignature(controller.state, features, routeActive);
  const previousSignaturePayload = controller.parseShellRenderSignature(controller.state.renderSignature);
  const keepModalStable = shouldKeepModalStable(previousSignaturePayload, controller.state, routeActive);

  if (
    controller.state.shellNode &&
    controller.state.shellNode.parentNode === host &&
    controller.state.renderSignature === nextSignature
  ) {
    return;
  }

  const previousShellNode =
    controller.state.shellNode && controller.state.shellNode.parentNode === host ? controller.state.shellNode : null;
  const modalScrollState = captureModalScrollState(previousShellNode, host);
  controller.onBeforeRender();
  const nextShellNode = controller.buildShellContent(controller.documentRef, controller.state, features);

  if (!previousShellNode) {
    host.appendChild(nextShellNode);
    controller.state.shellNode = nextShellNode;
  } else if (keepModalStable) {
    refreshStableModalContent(previousShellNode, nextShellNode);
    controller.state.renderSignature = nextSignature;
    host.scrollTop = modalScrollState.hostScrollTop;
    restoreModalScrollState(previousShellNode, modalScrollState);
    controller.onAfterRender();
    return;
  } else {
    while (previousShellNode.firstChild) {
      previousShellNode.firstChild.remove();
    }
    Array.from(nextShellNode.children).forEach((child) => {
      previousShellNode.appendChild(child);
    });
    controller.state.shellNode = previousShellNode;
  }

  controller.state.renderSignature = nextSignature;
  host.scrollTop = modalScrollState.hostScrollTop;
  restoreModalScrollState(controller.state.shellNode, modalScrollState);
  controller.onAfterRender();
}

function syncShellVisibility(controller) {
  const sidebar = controller.getSidebarElement(controller.windowRef, controller.documentRef, {
    panelHostId: controller.panelHostId,
    sidebarRouteHints: controller.sidebarRouteHints,
  });
  const content = controller.getContentElement(controller.windowRef, controller.documentRef, sidebar, {
    panelHostId: controller.panelHostId,
    sidebarRouteHints: controller.sidebarRouteHints,
  });
  const host = ensurePanelHost(controller);

  if (!content || !host) {
    return;
  }

  if (controller.isConfigRoute()) {
    renderShell(controller);
    hideShellContent(controller, content, host);
    host.style.display = "block";
  } else {
    controller.onBeforeRender();
    if (controller.state.contentHidden) {
      restoreShellContent(controller);
    }
    controller.state.activeSettingsFeatureKey = "";
    host.style.display = "none";
  }

  syncMenuButtonState(controller);
  syncMenuUpdateState(controller);
}

function resolveOptionalFunction(value, fallback) {
  return typeof value === "function" ? value : fallback;
}

function buildShellRenderControllerContext(options = {}) {
  return {
    windowRef: options.windowRef || null,
    documentRef: options.documentRef || null,
    state: options.state || null,
    menuItemId: String(options.menuItemId || "").trim(),
    panelHostId: String(options.panelHostId || "").trim(),
    menuLabel: String(options.menuLabel || "").trim(),
    installedVersion: String(options.installedVersion || "").trim(),
    sidebarRouteHints: normalizeSidebarRouteHints(options.sidebarRouteHints),
    buildShellContent: resolveOptionalFunction(options.buildShellContent, () => null),
    createElement: resolveOptionalFunction(options.createElement, null),
    getContentElement: resolveOptionalFunction(options.getContentElement, () => null),
    getSidebarElement: resolveOptionalFunction(options.getSidebarElement, () => null),
    isConfigRoute: resolveOptionalFunction(options.isConfigRoute, () => false),
    isNavigationElement: resolveOptionalFunction(options.isNavigationElement, () => false),
    parseShellRenderSignature: resolveOptionalFunction(options.parseShellRenderSignature, () => null),
    buildShellRenderSignature: resolveOptionalFunction(options.buildShellRenderSignature, () => ""),
    toRoutePathname: resolveOptionalFunction(options.toRoutePathname, () => ""),
    getFeatures: resolveOptionalFunction(options.getFeatures, () => []),
    onBeforeRender: resolveOptionalFunction(options.onBeforeRender, () => {}),
    onAfterRender: resolveOptionalFunction(options.onAfterRender, () => {}),
  };
}

export function createShellRenderController(options = {}) {
  const controller = buildShellRenderControllerContext(options);

  return {
    ensureMenuButton: () => ensureMenuButton(controller),
    ensurePanelHost: () => ensurePanelHost(controller),
    hideContent: (content, host) => hideShellContent(controller, content, host),
    render: () => renderShell(controller),
    restoreContent: () => {
      restoreShellContent(controller);
      restoreNativeNavigationState(controller);
    },
    syncMenuButtonState: () => syncMenuButtonState(controller),
    syncMenuUpdateState: (item) => syncMenuUpdateState(controller, item),
    syncVisibility: () => syncShellVisibility(controller),
  };
}
