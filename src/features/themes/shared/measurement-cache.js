export function createMeasurementCacheManager(options = {}) {
  const customCacheKeys = Array.isArray(options.customCacheKeys)
    ? options.customCacheKeys.filter((key) => typeof key === "string" && key)
    : [];
  let activeCache = null;

  function createCache() {
    const cache = {
      rectByNode: new WeakMap(),
    };

    customCacheKeys.forEach((key) => {
      cache[key] = new WeakMap();
    });

    return cache;
  }

  function withCache(callback) {
    if (typeof callback !== "function") {
      return undefined;
    }

    const previousCache = activeCache;
    activeCache = createCache();

    try {
      return callback();
    } finally {
      activeCache = previousCache;
    }
  }

  function getRect(node) {
    if (!node || typeof node.getBoundingClientRect !== "function") {
      return null;
    }

    const rectCache = activeCache?.rectByNode || null;
    if (rectCache?.has(node)) {
      return rectCache.get(node);
    }

    let rect = null;
    try {
      rect = node.getBoundingClientRect();
    } catch (_) {
      rect = null;
    }

    rectCache?.set(node, rect);
    return rect;
  }

  function getDimension(node, dimensionName) {
    const rect = getRect(node);
    const dimension = Number.parseFloat(rect?.[dimensionName]);
    return Number.isFinite(dimension) && dimension > 0 ? dimension : 0;
  }

  function getWidth(node) {
    return getDimension(node, "width");
  }

  function getHeight(node) {
    return getDimension(node, "height");
  }

  function getNumber(node, propertyName, cacheKey) {
    if (!node || typeof node !== "object" || !propertyName) {
      return 0;
    }

    const cache = cacheKey ? activeCache?.[cacheKey] || null : null;
    if (cache?.has(node)) {
      return cache.get(node);
    }

    const value = Number.parseFloat(node[propertyName]);
    const normalized = Number.isFinite(value) && value > 0 ? value : 0;
    cache?.set(node, normalized);
    return normalized;
  }

  function getCustomCache(cacheKey) {
    return cacheKey ? activeCache?.[cacheKey] || null : null;
  }

  return {
    withCache,
    getRect,
    getDimension,
    getWidth,
    getHeight,
    getNumber,
    getCustomCache,
  };
}
