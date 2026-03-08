function normalizeStringList(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function normalizePredicateList(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((value) => typeof value === "function");
}

function nodeHasClass(node, className) {
  return Boolean(className) && Boolean(node?.classList?.contains?.(className));
}

function nodeMatches(node, options = {}) {
  if (!node || typeof node !== "object") {
    return false;
  }

  const ids = options.ids || [];
  const classNames = options.classNames || [];
  const predicates = options.predicates || [];

  if (ids.includes(String(node.id || "").trim())) {
    return true;
  }

  if (classNames.some((className) => nodeHasClass(node, className))) {
    return true;
  }

  return predicates.some((predicate) => {
    try {
      return Boolean(predicate(node));
    } catch (_) {
      return false;
    }
  });
}

export function nodeOrAncestorMatches(node, matcher) {
  if (typeof matcher !== "function") {
    return false;
  }

  let current = node;
  while (current) {
    if (matcher(current)) {
      return true;
    }
    current = current.parentNode || null;
  }

  return false;
}

export function createManagedNodeMatcher(options = {}) {
  const ids = normalizeStringList(options.ids);
  const classNames = normalizeStringList(options.classNames);
  const predicates = normalizePredicateList(options.predicates);

  if (!ids.length && !classNames.length && !predicates.length) {
    return () => false;
  }

  return function isManagedNode(node) {
    return nodeOrAncestorMatches(node, (candidate) => {
      return nodeMatches(candidate, {
        ids,
        classNames,
        predicates,
      });
    });
  };
}

function toNodeArray(value) {
  if (!value || typeof value[Symbol.iterator] !== "function") {
    return [];
  }

  return Array.from(value).filter(Boolean);
}

export function hasExternalDomMutation(mutations = [], isManagedNode = null) {
  if (!Array.isArray(mutations) || !mutations.length || typeof isManagedNode !== "function") {
    return true;
  }

  return mutations.some((mutation) => {
    const targetNode = mutation?.target || null;
    if (targetNode && isManagedNode(targetNode)) {
      return false;
    }

    const touchedNodes = [
      ...toNodeArray(mutation?.addedNodes),
      ...toNodeArray(mutation?.removedNodes),
    ];

    if (!touchedNodes.length) {
      return Boolean(targetNode);
    }

    return touchedNodes.some((node) => !isManagedNode(node));
  });
}
