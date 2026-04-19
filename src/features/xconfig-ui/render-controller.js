export function createShellRenderController(options = {}) {
  const windowRef = options.windowRef || null;
  const documentRef = options.documentRef || null;
  const state = options.state || null;
  const menuItemId = String(options.menuItemId || "").trim();
  const panelHostId = String(options.panelHostId || "").trim();
  const menuLabel = String(options.menuLabel || "").trim();
  const menuLabelCollapseWidth = Number(options.menuLabelCollapseWidth) || 0;
  const installedVersion = String(options.installedVersion || "").trim();
  const sidebarRouteHints =
    options.sidebarRouteHints instanceof Set
      ? options.sidebarRouteHints
      : new Set(Array.isArray(options.sidebarRouteHints) ? options.sidebarRouteHints : []);
  const buildMenuIconElement =
    typeof options.buildMenuIconElement === "function" ? options.buildMenuIconElement : () => null;
  const buildShellContent =
    typeof options.buildShellContent === "function" ? options.buildShellContent : () => null;
  const createElement =
    typeof options.createElement === "function" ? options.createElement : null;
  const getContentElement =
    typeof options.getContentElement === "function" ? options.getContentElement : () => null;
  const getSidebarElement =
    typeof options.getSidebarElement === "function" ? options.getSidebarElement : () => null;
  const isConfigRoute =
    typeof options.isConfigRoute === "function" ? options.isConfigRoute : () => false;
  const isNavigationElement =
    typeof options.isNavigationElement === "function" ? options.isNavigationElement : () => false;
  const parseShellRenderSignature =
    typeof options.parseShellRenderSignature === "function" ? options.parseShellRenderSignature : () => null;
  const buildShellRenderSignature =
    typeof options.buildShellRenderSignature === "function" ? options.buildShellRenderSignature : () => "";
  const toRoutePathname =
    typeof options.toRoutePathname === "function" ? options.toRoutePathname : () => "";
  const getFeatures = typeof options.getFeatures === "function" ? options.getFeatures : () => [];

  function restoreContent() {
    state.hiddenDisplays.forEach((displayValue, node) => {
      if (node?.isConnected) {
        node.style.display = displayValue;
      }
    });
    state.hiddenDisplays.clear();
    state.contentHidden = false;
  }

  function hideContent(content, host) {
    Array.from(content?.children || []).forEach((child) => {
      if (child === host || isNavigationElement(child)) {
        return;
      }

      if (!state.hiddenDisplays.has(child)) {
        state.hiddenDisplays.set(child, child.style.display || "");
      }
      child.style.display = "none";
    });
    state.contentHidden = true;
  }

  function syncMenuButtonState() {
    const button = documentRef.getElementById?.(menuItemId);
    if (!button) {
      return;
    }
    if (isConfigRoute()) {
      button.dataset.active = "true";
    } else {
      delete button.dataset.active;
    }
  }

  function syncMenuUpdateState(item) {
    const button = item || documentRef.getElementById?.(menuItemId);
    if (!button) {
      return;
    }

    const hasUpdate = Boolean(state.updateStatus?.available);
    const remoteVersion = String(state.updateStatus?.remoteVersion || "").trim();
    const title = hasUpdate && remoteVersion
      ? `${menuLabel} - Update verfügbar (${installedVersion} -> ${remoteVersion})`
      : menuLabel;

    if (hasUpdate) {
      button.dataset.updateAvailable = "true";
    } else {
      delete button.dataset.updateAvailable;
    }

    button.dataset.updateState = String(state.updateStatus?.status || "");
    button.setAttribute("title", title);
    button.setAttribute("aria-label", title);
  }

  function syncMenuLabelForWidth(sidebar, item) {
    const menuItem = item || documentRef.getElementById?.(menuItemId);
    const sidebarElement =
      sidebar ||
      getSidebarElement(windowRef, documentRef, {
        panelHostId,
        sidebarRouteHints,
      });
    if (!menuItem || !sidebarElement) {
      return;
    }
    const label = menuItem.querySelector?.(".ad-xconfig-menu-label");
    if (!label) {
      return;
    }
    const width = Number(sidebarElement.getBoundingClientRect?.().width || 0);
    label.style.display = width > 0 && width < menuLabelCollapseWidth ? "none" : "inline";
  }

  function ensureMenuButton() {
    const sidebar = getSidebarElement(windowRef, documentRef, {
      panelHostId,
      sidebarRouteHints,
    });
    if (!sidebar) {
      return null;
    }

    const sidebarLinks = Array.from(sidebar.querySelectorAll("a[href]"));
    const boardsAnchor =
      sidebarLinks.find((link) => toRoutePathname(windowRef, link.getAttribute("href")) === "/boards") ||
      sidebarLinks.find((link) => String(link.textContent || "").trim().toLowerCase() === "meine boards") ||
      null;
    const insertionAnchor =
      boardsAnchor ||
      sidebarLinks.find((link) => sidebarRouteHints.has(toRoutePathname(windowRef, link.getAttribute("href")))) ||
      null;
    const template = [
      insertionAnchor,
      ...Array.from(sidebar.querySelectorAll?.("a[href], button, [role='button']") || []),
      sidebar.lastElementChild,
    ].find((node) => {
      return Boolean(node) &&
        node.id !== menuItemId &&
        !node.closest?.(`#${panelHostId}`) &&
        String(node.dataset?.adxconfigTab || "").trim() === "";
    }) || null;

    let item = documentRef.getElementById?.(menuItemId);
    const shouldRebuildExistingItem =
      Boolean(item) &&
      (
        Boolean(item.closest?.(`#${panelHostId}`)) ||
        item.getAttribute?.("data-adxconfig-tab") !== null ||
        String(item.getAttribute?.("data-adxconfig-action") || "").trim() !== "open" ||
        !item.querySelector?.(".ad-xconfig-menu-label")
      );
    if (shouldRebuildExistingItem) {
      item.remove?.();
      item = null;
    }

    if (!item) {
      item = template ? template.cloneNode(true) : createElement(documentRef, "button", { type: "button" });
      const icon = buildMenuIconElement(documentRef, template);
      const label = createElement(documentRef, "span", {
        className: "ad-xconfig-menu-label",
        text: menuLabel,
      });
      item.replaceChildren(icon, label);
    }

    item.id = menuItemId;
    item.classList?.remove?.("ad-xconfig-tab");
    item.removeAttribute?.("data-adxconfig-tab");
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.setAttribute("aria-label", menuLabel);
    item.setAttribute("title", menuLabel);
    item.dataset.adxconfigAction = "open";
    item.style.cursor = "pointer";

    if (String(item.tagName || "").toLowerCase() === "a") {
      item.removeAttribute("href");
    } else if (String(item.tagName || "").toLowerCase() === "button") {
      item.setAttribute("type", "button");
    }

    const labelNode = item.querySelector?.(".ad-xconfig-menu-label");
    if (!labelNode) {
      const icon = buildMenuIconElement(documentRef, template);
      const label = createElement(documentRef, "span", {
        className: "ad-xconfig-menu-label",
        text: menuLabel,
      });
      item.replaceChildren(icon, label);
    } else {
      labelNode.textContent = menuLabel;
      if (!item.querySelector?.(".ad-xconfig-menu-icon")) {
        const icon = buildMenuIconElement(documentRef, template);
        item.insertBefore?.(icon, item.firstChild || null);
      }
    }

    if (insertionAnchor) {
      if (insertionAnchor.nextElementSibling !== item) {
        insertionAnchor.after(item);
      }
    } else if (item.parentNode !== sidebar) {
      sidebar.appendChild(item);
    }

    syncMenuButtonState();
    syncMenuUpdateState(item);
    syncMenuLabelForWidth(sidebar, item);
    return item;
  }

  function ensurePanelHost() {
    const sidebar = getSidebarElement(windowRef, documentRef, {
      panelHostId,
      sidebarRouteHints,
    });
    const content = getContentElement(windowRef, documentRef, sidebar, {
      panelHostId,
      sidebarRouteHints,
    });
    if (!content) {
      return null;
    }

    let host = documentRef.getElementById?.(panelHostId);
    if (!host) {
      host = createElement(documentRef, "section", {
        id: panelHostId,
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

  function render() {
    if (!state.started) {
      return;
    }

    const host = ensurePanelHost();
    if (!host) {
      return;
    }
    const features = getFeatures();
    const routeActive = isConfigRoute();
    const nextSignature = buildShellRenderSignature(state, features, routeActive);
    const previousSignaturePayload = parseShellRenderSignature(state.renderSignature);
    const keepModalStable =
      Boolean(previousSignaturePayload?.routeActive) &&
      String(previousSignaturePayload?.activeSettingsFeatureKey || "") !== "" &&
      String(previousSignaturePayload?.activeSettingsFeatureKey || "") === String(state.activeSettingsFeatureKey || "") &&
      Boolean(routeActive);

    if (
      state.shellNode &&
      state.shellNode.parentNode === host &&
      state.renderSignature === nextSignature
    ) {
      return;
    }

    const previousShellNode =
      state.shellNode && state.shellNode.parentNode === host ? state.shellNode : null;
    const hostScrollTop = Number(host.scrollTop || 0);
    const previousModal = previousShellNode?.querySelector?.(".ad-xconfig-modal") || null;
    const previousModalBody = previousShellNode?.querySelector?.(".ad-xconfig-modal-body") || null;
    const previousModalScrollTop = Number(previousModal?.scrollTop || 0);
    const previousModalBodyScrollTop = Number(previousModalBody?.scrollTop || 0);

    const nextShellNode = buildShellContent(documentRef, state, features);

    if (!previousShellNode) {
      host.appendChild(nextShellNode);
      state.shellNode = nextShellNode;
    } else if (keepModalStable) {
      state.renderSignature = nextSignature;
      host.scrollTop = hostScrollTop;
      const stableModal = previousShellNode?.querySelector?.(".ad-xconfig-modal") || null;
      const stableModalBody = previousShellNode?.querySelector?.(".ad-xconfig-modal-body") || null;
      if (stableModal) {
        stableModal.scrollTop = previousModalScrollTop;
      }
      if (stableModalBody) {
        stableModalBody.scrollTop = previousModalBodyScrollTop;
      }
      return;
    } else {
      while (previousShellNode.firstChild) {
        previousShellNode.firstChild.remove();
      }
      Array.from(nextShellNode.children).forEach((child) => {
        previousShellNode.appendChild(child);
      });
      state.shellNode = previousShellNode;
    }

    state.renderSignature = nextSignature;
    host.scrollTop = hostScrollTop;

    const nextModal = state.shellNode?.querySelector?.(".ad-xconfig-modal") || null;
    const nextModalBody = state.shellNode?.querySelector?.(".ad-xconfig-modal-body") || null;
    if (nextModal) {
      nextModal.scrollTop = previousModalScrollTop;
    }
    if (nextModalBody) {
      nextModalBody.scrollTop = previousModalBodyScrollTop;
    }
  }

  function syncVisibility() {
    const sidebar = getSidebarElement(windowRef, documentRef, {
      panelHostId,
      sidebarRouteHints,
    });
    const content = getContentElement(windowRef, documentRef, sidebar, {
      panelHostId,
      sidebarRouteHints,
    });
    const host = ensurePanelHost();

    if (!content || !host) {
      return;
    }

    if (isConfigRoute()) {
      render();
      hideContent(content, host);
      host.style.display = "block";
    } else {
      if (state.contentHidden) {
        restoreContent();
      }
      state.activeSettingsFeatureKey = "";
      host.style.display = "none";
    }

    syncMenuButtonState();
    syncMenuUpdateState();
  }

  return {
    ensureMenuButton,
    ensurePanelHost,
    hideContent,
    render,
    restoreContent,
    syncMenuButtonState,
    syncMenuLabelForWidth,
    syncMenuUpdateState,
    syncVisibility,
  };
}
