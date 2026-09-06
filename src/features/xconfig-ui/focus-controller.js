const FOCUSABLE = 'button, input, select, textarea, summary, a[href], [tabindex]';
const IDENTITY_ATTRIBUTES = [
  'id', 'data-adxconfig-action', 'data-feature-key', 'data-setting-key',
  'data-setting-value', 'data-adxconfig-tab', 'data-color-input-role',
  'aria-label', 'data-adxconfig-transfer-include-assets',
];

function identityOf(node) {
  if (!node) return null;
  const attributes = IDENTITY_ATTRIBUTES
    .map((name) => [name, node.getAttribute?.(name)])
    .filter(([, value]) => value !== null && value !== undefined);
  return attributes.length ? { node, attributes } : null;
}

function findIdentity(root, identity) {
  if (!root || !identity) return null;
  if (root.contains?.(identity.node)) return identity.node;
  return Array.from(root.querySelectorAll(FOCUSABLE)).find((node) =>
    identity.attributes.every(([name, value]) => node.getAttribute(name) === value)
  ) || null;
}

function focusableNodes(root) {
  return Array.from(root?.querySelectorAll?.(FOCUSABLE) || []).filter((node) =>
    !node.disabled && node.getAttribute('tabindex') !== '-1' &&
    !node.closest?.('[hidden], [inert]') &&
    (!node.getClientRects || node.getClientRects().length > 0)
  );
}

/** Preserve logical focus across shell replacement without stealing native menu focus. */
export function createShellFocusController({ documentRef, panelHostId }) {
  let previousFocus = null;
  let previousDialog = null;
  let returnFocus = null;
  let pendingTrigger = null;
  const host = () => documentRef.getElementById(panelHostId);
  const dialog = () => host()?.querySelector('[role="dialog"]');

  return {
    rememberTrigger(node) {
      pendingTrigger = identityOf(node);
    },
    beforeRender() {
      const active = documentRef.activeElement;
      previousFocus = host()?.contains?.(active) ? identityOf(active) : null;
      previousDialog = dialog();
    },
    afterRender() {
      const root = host();
      const nextDialog = dialog();
      if (nextDialog && !previousDialog) {
        returnFocus = previousFocus || pendingTrigger;
        pendingTrigger = null;
        (focusableNodes(nextDialog)[0] || nextDialog).focus?.({ preventScroll: true });
      } else if (!nextDialog && previousDialog) {
        findIdentity(root, returnFocus)?.focus?.({ preventScroll: true });
        returnFocus = null;
      } else if (previousFocus) {
        const target = findIdentity(nextDialog || root, previousFocus);
        (target || (nextDialog && (focusableNodes(nextDialog)[0] || nextDialog)))
          ?.focus?.({ preventScroll: true });
      }
    },
    handleKeydown(event) {
      const root = host();
      if (!root?.contains?.(event.target)) return false;
      const tab = event.target.closest?.('[role="tab"]');
      const directions = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (tab && directions.includes(event.key)) {
        const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
        const index = tabs.indexOf(tab);
        let next = event.key === 'Home' ? 0 : tabs.length - 1;
        if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        event.preventDefault();
        tabs[next]?.focus?.();
        tabs[next]?.click?.();
        return true;
      }
      const activeDialog = dialog();
      if (event.key !== 'Tab' || !activeDialog?.contains?.(event.target)) return false;
      const nodes = focusableNodes(activeDialog);
      const first = nodes[0] || activeDialog;
      const last = nodes.at(-1) || activeDialog;
      if (!nodes.length || (event.shiftKey && event.target === first) ||
          (!event.shiftKey && event.target === last) || event.target === activeDialog) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus?.();
      }
      return true;
    },
  };
}
