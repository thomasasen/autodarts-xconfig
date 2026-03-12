class FakeEvent {
  constructor(type, options = {}) {
    this.type = String(type || "");
    this.bubbles = options.bubbles !== false;
    this.cancelable = options.cancelable !== false;
    this.defaultPrevented = false;
    this.key = String(options.key || "");
    this.detail = options.detail;
    this.target = options.target || null;
    this.currentTarget = null;
    this._stopped = false;
  }

  preventDefault() {
    if (this.cancelable) {
      this.defaultPrevented = true;
    }
  }

  stopPropagation() {
    this._stopped = true;
  }
}

class FakeClassList {
  constructor(initial = []) {
    this._set = new Set(initial);
  }

  add(...classNames) {
    classNames.forEach((className) => {
      if (className) {
        this._set.add(String(className));
      }
    });
  }

  remove(...classNames) {
    classNames.forEach((className) => {
      this._set.delete(String(className));
    });
  }

  toggle(className, force) {
    if (typeof force === "boolean") {
      if (force) {
        this.add(className);
        return true;
      }
      this.remove(className);
      return false;
    }

    if (this._set.has(className)) {
      this._set.delete(className);
      return false;
    }

    this._set.add(className);
    return true;
  }

  contains(className) {
    return this._set.has(String(className));
  }

  toArray() {
    return Array.from(this._set.values());
  }

  toString() {
    return this.toArray().join(" ");
  }
}

class FakeStyleDecl {
  constructor() {
    this._values = new Map();
  }

  setProperty(name, value) {
    this._values.set(String(name), String(value));
  }

  removeProperty(name) {
    this._values.delete(String(name));
  }

  getPropertyValue(name) {
    return this._values.get(String(name)) || "";
  }
}

class FakeEventTarget {
  constructor() {
    this._listeners = [];
  }

  addEventListener(type, handler, options) {
    this._listeners.push({
      type: String(type || ""),
      handler,
      options,
    });
  }

  removeEventListener(type, handler, options) {
    const normalizedType = String(type || "");
    this._listeners = this._listeners.filter((record) => {
      return !(
        record.type === normalizedType &&
        record.handler === handler &&
        record.options === options
      );
    });
  }

  dispatchEvent(eventLike) {
    const event =
      eventLike instanceof FakeEvent
        ? eventLike
        : new FakeEvent(eventLike?.type || "", eventLike || {});

    if (!event.target) {
      event.target = this;
    }
    event.currentTarget = this;

    const listeners = this._listeners.slice();
    listeners.forEach((record) => {
      if (record.type !== event.type || typeof record.handler !== "function") {
        return;
      }

      record.handler.call(this, event);

      if (record.options && typeof record.options === "object" && record.options.once) {
        this.removeEventListener(record.type, record.handler, record.options);
      }
    });

    return !event.defaultPrevented;
  }

  listenerCount() {
    return this._listeners.length;
  }
}

function isObjectLike(value) {
  return Boolean(value) && typeof value === "object";
}

function splitSelectorList(selector) {
  return String(selector || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function splitSelectorChain(selector) {
  return String(selector || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function matchesSelectorList(node, selector) {
  const selectors = splitSelectorList(selector);
  if (!selectors.length) {
    return false;
  }
  return selectors.some((entry) => matchesSelector(node, entry));
}

function normalizeDatasetKey(attrName) {
  return String(attrName || "")
    .replace(/^data-/, "")
    .replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
}

function propagateOwnerSvg(node, ownerSvgElement) {
  if (!node || typeof node !== "object") {
    return;
  }

  node.ownerSVGElement = ownerSvgElement || null;
  if (!Array.isArray(node.children) || node.children.length === 0) {
    return;
  }

  node.children.forEach((child) => {
    const nextOwnerSvg =
      String(child?.tagName || "").toUpperCase() === "SVG" ? child : ownerSvgElement || null;
    propagateOwnerSvg(child, nextOwnerSvg);
  });
}

function prepareChildForInsertion(parent, child) {
  if (!child || typeof child !== "object") {
    return;
  }

  if (!child.ownerDocument && parent?.ownerDocument) {
    child.ownerDocument = parent.ownerDocument;
  }

  const parentTag = String(parent?.tagName || "").toUpperCase();
  const ownerSvgElement =
    parentTag === "SVG" ? parent : parent?.ownerSVGElement || null;
  if (ownerSvgElement) {
    const childTag = String(child?.tagName || "").toUpperCase();
    propagateOwnerSvg(child, childTag === "SVG" ? child : ownerSvgElement);
  }
}

function createHierarchyRequestError() {
  const error = new Error(
    "Failed to execute 'appendChild' on 'Node': The new child element contains the parent."
  );
  error.name = "HierarchyRequestError";
  return error;
}

class FakeElement extends FakeEventTarget {
  constructor(tagName = "div") {
    super();
    this.tagName = String(tagName || "div").toUpperCase();
    this.nodeType = 1;
    this.id = "";
    this.textContent = "";
    this.classList = new FakeClassList();
    this.style = new FakeStyleDecl();
    this.parentNode = null;
    this.children = [];
    this.dataset = {};
    this.attributes = new Map();
    this.ownerDocument = null;
    this.namespaceURI = null;
    this.ownerSVGElement = null;
    this.value = "";
    this.checked = false;
    this.disabled = false;
    this.href = "";
    this.role = "";
    this.type = "";
    this.title = "";
    this.tabIndex = 0;
    this.__rect = { width: 240, height: 48 };
  }

  appendChild(child) {
    if (!child) {
      return child;
    }

    if (
      child === this ||
      (typeof child.contains === "function" && child.contains(this))
    ) {
      throw createHierarchyRequestError();
    }

    if (child.parentNode && child.parentNode !== this) {
      child.parentNode.removeChild(child);
    }

    prepareChildForInsertion(this, child);

    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  insertBefore(child, referenceNode) {
    if (!child) {
      return child;
    }

    if (
      child === this ||
      (typeof child.contains === "function" && child.contains(this))
    ) {
      throw createHierarchyRequestError();
    }

    if (!referenceNode || referenceNode.parentNode !== this) {
      return this.appendChild(child);
    }

    if (child.parentNode && child.parentNode !== this) {
      child.parentNode.removeChild(child);
    }

    prepareChildForInsertion(this, child);

    const index = this.children.indexOf(referenceNode);
    if (index < 0) {
      return this.appendChild(child);
    }

    child.parentNode = this;
    this.children.splice(index, 0, child);
    return child;
  }

  insertAdjacentElement(position, element) {
    if (!element || !this.parentNode) {
      return element;
    }

    if (position === "afterend") {
      return this.parentNode.insertBefore(element, this.nextElementSibling);
    }

    if (position === "beforebegin") {
      return this.parentNode.insertBefore(element, this);
    }

    if (position === "afterbegin") {
      return this.insertBefore(element, this.firstElementChild);
    }

    return this.appendChild(element);
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
      child.parentNode = null;
    }
    return child;
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  replaceChildren(...nodes) {
    this.children.slice().forEach((child) => {
      this.removeChild(child);
    });
    nodes.flat().forEach((node) => {
      if (node) {
        this.appendChild(node);
      }
    });
  }

  cloneNode(deep = false) {
    const clone = new FakeElement(this.tagName);
    clone.id = this.id;
    clone.textContent = this.textContent;
    clone.classList = new FakeClassList(this.classList.toArray());
    clone.style = this.style;
    clone.value = this.value;
    clone.checked = this.checked;
    clone.disabled = this.disabled;
    clone.href = this.href;
    clone.role = this.role;
    clone.type = this.type;
    clone.title = this.title;
    clone.tabIndex = this.tabIndex;
    clone.dataset = { ...this.dataset };
    clone.attributes = new Map(this.attributes);
    clone.ownerDocument = this.ownerDocument;
    clone.namespaceURI = this.namespaceURI;
    clone.ownerSVGElement = this.ownerSVGElement;
    clone.__rect = { ...this.__rect };

    if (deep) {
      this.children.forEach((child) => {
        clone.appendChild(child.cloneNode(true));
      });
    }

    return clone;
  }

  setAttribute(name, value) {
    const normalizedName = String(name || "");
    const normalizedValue = String(value);

    if (normalizedName === "id") {
      this.id = normalizedValue;
      return;
    }

    if (normalizedName === "class") {
      this.classList = new FakeClassList(
        normalizedValue
          .split(/\s+/)
          .filter(Boolean)
      );
      return;
    }

    if (normalizedName.startsWith("data-")) {
      this.dataset[normalizeDatasetKey(normalizedName)] = normalizedValue;
    }

    this.attributes.set(normalizedName, normalizedValue);
    this[normalizedName] = normalizedValue;
  }

  getAttribute(name) {
    const normalizedName = String(name || "");

    if (normalizedName === "id") {
      return this.id || null;
    }
    if (normalizedName === "class") {
      const className = this.classList.toString();
      return className || null;
    }
    if (normalizedName.startsWith("data-")) {
      if (!this.attributes.has(normalizedName)) {
        return null;
      }
      return this.dataset[normalizeDatasetKey(normalizedName)] || "";
    }

    if (this.attributes.has(normalizedName)) {
      return this.attributes.get(normalizedName) || "";
    }

    return null;
  }

  removeAttribute(name) {
    const normalizedName = String(name || "");

    if (normalizedName === "id") {
      this.id = "";
      return;
    }
    if (normalizedName === "class") {
      this.classList = new FakeClassList();
      return;
    }
    if (normalizedName.startsWith("data-")) {
      delete this.dataset[normalizeDatasetKey(normalizedName)];
    }

    this.attributes.delete(normalizedName);
    delete this[normalizedName];
  }

  contains(node) {
    let current = node;
    while (current) {
      if (current === this) {
        return true;
      }
      current = current.parentNode || null;
    }
    return false;
  }

  querySelector(selector) {
    const results = this.querySelectorAll(selector);
    return results[0] || null;
  }

  querySelectorAll(selector) {
    const selectors = splitSelectorList(selector);
    if (!selectors.length) {
      return [];
    }

    const results = [];
    const seen = new Set();
    const stack = [...this.children];

    while (stack.length) {
      const node = stack.shift();
      if (!node) {
        continue;
      }

      const matches = selectors.some((entry) => matchesSelector(node, entry));
      if (matches && !seen.has(node)) {
        seen.add(node);
        results.push(node);
      }

      if (Array.isArray(node.children) && node.children.length) {
        stack.push(...node.children);
      }
    }

    return results;
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (matchesSelectorList(current, selector)) {
        return current;
      }
      current = current.parentNode || null;
    }
    return null;
  }

  matches(selector) {
    return matchesSelectorList(this, selector);
  }

  click() {
    this.dispatchEvent(new FakeEvent("click", { bubbles: true, target: this }));
  }

  getBoundingClientRect() {
    return {
      width: Number(this.__rect.width || 0),
      height: Number(this.__rect.height || 0),
      top: 0,
      left: 0,
      right: Number(this.__rect.width || 0),
      bottom: Number(this.__rect.height || 0),
    };
  }

  getClientRects() {
    return [this.getBoundingClientRect()];
  }

  dispatchEvent(eventLike) {
    const event =
      eventLike instanceof FakeEvent
        ? eventLike
        : new FakeEvent(eventLike?.type || "", eventLike || {});

    if (!event.target) {
      event.target = this;
    }

    let current = this;
    while (current) {
      FakeEventTarget.prototype.dispatchEvent.call(current, event);
      if (!event.bubbles || event._stopped) {
        break;
      }
      current = current.parentNode || null;
    }

    if (event.bubbles && !event._stopped && this.ownerDocument && current !== this.ownerDocument) {
      FakeEventTarget.prototype.dispatchEvent.call(this.ownerDocument, event);
    }

    return !event.defaultPrevented;
  }

  get parentElement() {
    return this.parentNode instanceof FakeElement ? this.parentNode : null;
  }

  get firstChild() {
    return this.children.length ? this.children[0] : null;
  }

  get firstElementChild() {
    return this.firstChild;
  }

  get lastElementChild() {
    return this.children.length ? this.children[this.children.length - 1] : null;
  }

  get previousElementSibling() {
    if (!this.parentNode) {
      return null;
    }

    const index = this.parentNode.children.indexOf(this);
    return index > 0 ? this.parentNode.children[index - 1] : null;
  }

  get nextElementSibling() {
    if (!this.parentNode) {
      return null;
    }

    const index = this.parentNode.children.indexOf(this);
    return index >= 0 && index < this.parentNode.children.length - 1
      ? this.parentNode.children[index + 1]
      : null;
  }

  get isConnected() {
    return Boolean(this.ownerDocument?.documentElement?.contains(this));
  }
}

class FakeMutationObserver {
  constructor(callback) {
    this.callback = callback;
    this.observeCalls = [];
    this.disconnected = false;
  }

  observe(target, options) {
    this.observeCalls.push({ target, options });
    const documentRef = target?.ownerDocument || target;
    if (documentRef && Array.isArray(documentRef.__mutationObservers)) {
      documentRef.__mutationObservers.push(this);
    }
  }

  disconnect() {
    this.disconnected = true;
  }
}

class FakeWebSocket {}

class FakeMessageEvent {
  constructor(data = "", currentTarget = null) {
    this._data = data;
    this.currentTarget = currentTarget;
  }

  get data() {
    return this._data;
  }
}

class FakeStorage {
  constructor(initial = {}) {
    this._values = new Map(
      Object.entries(initial).map(([key, value]) => [String(key), String(value)])
    );
  }

  getItem(key) {
    return this._values.has(String(key)) ? this._values.get(String(key)) : null;
  }

  setItem(key, value) {
    this._values.set(String(key), String(value));
  }

  removeItem(key) {
    this._values.delete(String(key));
  }
}

function createSidebarLink(documentRef, href, label) {
  const link = documentRef.createElement("a");
  link.href = href;
  link.textContent = label;
  link.setAttribute("href", href);
  link.classList.add("chakra-link");
  return link;
}

class FakeDocument extends FakeEventTarget {
  constructor(options = {}) {
    super();

    this.nodeType = 9;
    this.hidden = false;
    this.visibilityState = "visible";
    this.__mutationObservers = [];

    this.head = new FakeElement("head");
    this.head.ownerDocument = this;

    this.documentElement = new FakeElement("html");
    this.documentElement.ownerDocument = this;

    this.body = new FakeElement("body");
    this.body.ownerDocument = this;

    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);

    this.rootElement = new FakeElement("div");
    this.rootElement.ownerDocument = this;
    this.rootElement.id = "root";

    this.layoutShell = new FakeElement("div");
    this.layoutShell.ownerDocument = this;

    this.sidebar = new FakeElement("nav");
    this.sidebar.ownerDocument = this;
    this.sidebar.classList.add("navigation");
    this.sidebar.setAttribute("role", "navigation");
    this.sidebar.__rect = { width: 260, height: 720 };

    [
      ["/lobbies", "Lobbies"],
      ["/boards", "Boards"],
      ["/matches", "Matches"],
      ["/statistics", "Statistik"],
      ["/settings", "Settings"],
    ].forEach(([href, label]) => {
      this.sidebar.appendChild(createSidebarLink(this, href, label));
    });

    const contentTagName = String(options.contentTagName || "main").trim() || "main";
    this.main = new FakeElement(contentTagName);
    this.main.ownerDocument = this;
    this.main.__rect = { width: 1280, height: 720 };

    this.layoutShell.appendChild(this.sidebar);
    this.layoutShell.appendChild(this.main);
    this.rootElement.appendChild(this.layoutShell);
    this.body.appendChild(this.rootElement);

    this.variantElement = new FakeElement("div");
    this.variantElement.ownerDocument = this;
    this.variantElement.id = "ad-ext-game-variant";
    this.variantElement.textContent = "X01";

    this.suggestionElement = new FakeElement("div");
    this.suggestionElement.ownerDocument = this;
    this.suggestionElement.classList.add("suggestion");

    this.activeScoreElement = new FakeElement("p");
    this.activeScoreElement.ownerDocument = this;
    this.activeScoreElement.classList.add("ad-ext-player-score");
    this.activeScoreElement.textContent = "170";

    this.activePlayerRow = new FakeElement("div");
    this.activePlayerRow.ownerDocument = this;
    this.activePlayerRow.classList.add("ad-ext-player", "ad-ext-player-active");
    this.activePlayerRow.appendChild(this.activeScoreElement);

    this.throwRow = new FakeElement("div");
    this.throwRow.ownerDocument = this;
    this.throwRow.classList.add("ad-ext-turn-throw");

    this.throwTextElement = new FakeElement("p");
    this.throwTextElement.ownerDocument = this;
    this.throwTextElement.classList.add("chakra-text");
    this.throwTextElement.textContent = "T20";
    this.throwRow.appendChild(this.throwTextElement);

    this.turnContainer = new FakeElement("div");
    this.turnContainer.ownerDocument = this;
    this.turnContainer.id = "ad-ext-turn";
    this.turnContainer.appendChild(this.throwRow);

    this.turnPointsElement = new FakeElement("p");
    this.turnPointsElement.ownerDocument = this;
    this.turnPointsElement.classList.add("ad-ext-turn-points");
    this.turnPointsElement.textContent = "60";

    this.winnerNode = new FakeElement("div");
    this.winnerNode.ownerDocument = this;
    this.winnerNode.classList.add("ad-ext-player");

    this.main.appendChild(this.variantElement);
    this.main.appendChild(this.suggestionElement);
    this.main.appendChild(this.activePlayerRow);
    this.main.appendChild(this.turnContainer);
    this.main.appendChild(this.turnPointsElement);
    this.main.appendChild(this.winnerNode);
  }

  createElement(tagName) {
    const node = new FakeElement(tagName);
    node.ownerDocument = this;
    return node;
  }

  createElementNS(_namespace, tagName) {
    const node = this.createElement(tagName);
    node.namespaceURI = _namespace || null;
    return node;
  }

  getElementById(id) {
    const normalizedId = String(id || "");
    if (!normalizedId) {
      return null;
    }

    const stack = [this.documentElement];
    while (stack.length) {
      const node = stack.shift();
      if (!node) {
        continue;
      }
      if (node.id === normalizedId) {
        return node;
      }
      if (Array.isArray(node.children) && node.children.length) {
        stack.push(...node.children);
      }
    }

    return null;
  }

  querySelector(selector) {
    const results = this.querySelectorAll(selector);
    return results[0] || null;
  }

  querySelectorAll(selector) {
    return this.documentElement.querySelectorAll(selector);
  }

  flushMutations(records = []) {
    const mutationRecords = Array.isArray(records) && records.length
      ? records
      : [{ target: this.rootElement, addedNodes: [], removedNodes: [] }];

    this.__mutationObservers
      .filter((observer) => observer && !observer.disconnected && typeof observer.callback === "function")
      .forEach((observer) => observer.callback(mutationRecords));
  }
}

function matchAttribute(node, rawAttribute) {
  const trimmed = String(rawAttribute || "").trim();
  if (!trimmed) {
    return false;
  }

  const match = trimmed.match(/^([a-zA-Z0-9:_-]+)(?:=(['"]?)(.*?)\2)?$/);
  if (!match) {
    return false;
  }

  const attrName = match[1];
  const expectedValue = typeof match[3] === "string" ? match[3] : null;
  const actualValue = node.getAttribute(attrName);

  if (expectedValue === null) {
    return Boolean(actualValue);
  }

  return String(actualValue || "") === expectedValue;
}

function matchSimpleSelector(node, selector) {
  if (!(node instanceof FakeElement)) {
    return false;
  }

  const normalized = String(selector || "").trim();
  if (!normalized) {
    return false;
  }

  let remainder = normalized;
  const tagMatch = remainder.match(/^[a-zA-Z0-9_-]+/);
  if (tagMatch) {
    const tagName = String(tagMatch[0] || "").toUpperCase();
    if (tagName && node.tagName !== tagName) {
      return false;
    }
    remainder = remainder.slice(tagMatch[0].length);
  }

  const idMatches = remainder.match(/#[a-zA-Z0-9_-]+/g) || [];
  if (idMatches.length && !idMatches.every((entry) => node.id === entry.slice(1))) {
    return false;
  }

  const classMatches = remainder.match(/\.[a-zA-Z0-9_-]+/g) || [];
  if (classMatches.length) {
    const allClassesPresent = classMatches.every((entry) =>
      node.classList.contains(entry.slice(1))
    );
    if (!allClassesPresent) {
      return false;
    }
  }

  const attributeMatches = remainder.match(/\[[^\]]+\]/g) || [];
  if (attributeMatches.length) {
    const allAttributesPresent = attributeMatches.every((entry) =>
      matchAttribute(node, entry.slice(1, -1))
    );
    if (!allAttributesPresent) {
      return false;
    }
  }

  return true;
}

function matchesSelector(node, selector) {
  const chain = splitSelectorChain(selector);
  if (!chain.length) {
    return false;
  }

  let current = node;
  for (let index = chain.length - 1; index >= 0; index -= 1) {
    const part = chain[index];
    if (!current || !matchSimpleSelector(current, part)) {
      if (index === chain.length - 1) {
        return false;
      }

      current = current?.parentNode || null;
      while (current && !matchSimpleSelector(current, part)) {
        current = current.parentNode || null;
      }

      if (!current) {
        return false;
      }
    }

    if (index > 0) {
      current = current.parentNode || null;
    }
  }

  return true;
}

function createLocation(initialHref = "https://play.autodarts.io/lobbies") {
  const parsed = new URL(initialHref);
  return {
    origin: parsed.origin,
    pathname: parsed.pathname,
    search: parsed.search,
    hash: parsed.hash,
    get href() {
      return `${this.origin}${this.pathname}${this.search}${this.hash}`;
    },
  };
}

function updateLocation(locationRef, url) {
  if (!locationRef || !url) {
    return;
  }

  const parsed = new URL(String(url), locationRef.origin || "https://play.autodarts.io");
  locationRef.pathname = parsed.pathname;
  locationRef.search = parsed.search;
  locationRef.hash = parsed.hash;
}

function createFakeWindow(options = {}) {
  const documentRef = options.documentRef || new FakeDocument();
  const eventTarget = new FakeEventTarget();
  const location = createLocation(options.href || "https://play.autodarts.io/lobbies");

  const history = {
    pushState(_state, _title, url) {
      updateLocation(location, url);
    },
    replaceState(_state, _title, url) {
      updateLocation(location, url);
    },
  };

  const windowRef = {
    document: documentRef,
    history,
    location,
    __openedUrls: [],
    localStorage: options.localStorage || new FakeStorage(),
    MutationObserver: FakeMutationObserver,
    MessageEvent: FakeMessageEvent,
    WebSocket: FakeWebSocket,
    Event: FakeEvent,
    CustomEvent: class extends FakeEvent {
      constructor(type, eventOptions = {}) {
        super(type, eventOptions);
      }
    },
    Element: FakeElement,
    HTMLElement: FakeElement,
    HTMLAnchorElement: FakeElement,
    HTMLInputElement: FakeElement,
    HTMLSelectElement: FakeElement,
    Node: FakeElement,
    requestAnimationFrame(callback) {
      return setTimeout(callback, 0);
    },
    cancelAnimationFrame(handle) {
      clearTimeout(handle);
    },
    setTimeout(callback, ms, ...args) {
      return setTimeout(callback, ms, ...args);
    },
    clearTimeout(handle) {
      clearTimeout(handle);
    },
    setInterval(callback, ms, ...args) {
      return setInterval(callback, ms, ...args);
    },
    clearInterval(handle) {
      clearInterval(handle);
    },
    open(url) {
      const normalizedUrl = String(url || "");
      this.__openedUrls.push(normalizedUrl);
      return {
        href: normalizedUrl,
        focus() {},
      };
    },
    addEventListener: eventTarget.addEventListener.bind(eventTarget),
    removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
    dispatchEvent: eventTarget.dispatchEvent.bind(eventTarget),
    __eventTarget: eventTarget,
  };

  documentRef.defaultView = windowRef;
  return windowRef;
}

export {
  FakeClassList,
  FakeDocument,
  FakeElement,
  FakeEvent,
  FakeEventTarget,
  FakeMessageEvent,
  FakeMutationObserver,
  FakeStorage,
  FakeWebSocket,
  createFakeWindow,
};
