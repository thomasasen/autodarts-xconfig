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
    return this._set.has(className);
  }

  toArray() {
    return Array.from(this._set.values());
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

class FakeElement {
  constructor(tagName = "div") {
    this.tagName = String(tagName || "div").toUpperCase();
    this.id = "";
    this.textContent = "";
    this.classList = new FakeClassList();
    this.style = new FakeStyleDecl();
    this.parentNode = null;
    this.children = [];
    this.dataset = {};
  }

  appendChild(child) {
    if (!child) {
      return child;
    }

    if (!child.ownerDocument && this.ownerDocument) {
      child.ownerDocument = this.ownerDocument;
    }

    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
      child.parentNode = null;
    }
    return child;
  }

  setAttribute(name, value) {
    if (name === "id") {
      this.id = String(value);
      return;
    }

    if (name === "class") {
      this.classList = new FakeClassList(
        String(value)
          .split(/\s+/)
          .filter(Boolean)
      );
      return;
    }

    this[name] = String(value);
  }

  getAttribute(name) {
    if (name === "id") {
      return this.id;
    }
    if (name === "class") {
      return this.classList.toArray().join(" ");
    }
    return this[name] || "";
  }

  removeAttribute(name) {
    if (name === "id") {
      this.id = "";
      return;
    }
    if (name === "class") {
      this.classList = new FakeClassList();
      return;
    }
    delete this[name];
  }

  get firstChild() {
    return this.children.length ? this.children[0] : null;
  }

  querySelector(selector) {
    const results = this.querySelectorAll(selector);
    return results[0] || null;
  }

  querySelectorAll(selector) {
    const normalized = String(selector || "").trim();
    if (!normalized) {
      return [];
    }

    const selectors = normalized
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    const seen = new Set();
    const matches = [];
    const stack = [...this.children];

    while (stack.length) {
      const node = stack.shift();
      if (!node) {
        continue;
      }

      const hit = selectors.some((entry) => matchesSelector(node, entry));
      if (hit && !seen.has(node)) {
        seen.add(node);
        matches.push(node);
      }

      if (Array.isArray(node.children) && node.children.length) {
        stack.push(...node.children);
      }
    }

    return matches;
  }

  matches(selector) {
    return matchesSelector(this, selector);
  }

  getClientRects() {
    return [1];
  }
}

class FakeEventTarget {
  constructor() {
    this._listeners = [];
  }

  addEventListener(type, handler, options) {
    this._listeners.push({ type, handler, options });
  }

  removeEventListener(type, handler, options) {
    this._listeners = this._listeners.filter((record) => {
      return !(
        record.type === type &&
        record.handler === handler &&
        record.options === options
      );
    });
  }

  listenerCount() {
    return this._listeners.length;
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

class FakeDocument extends FakeEventTarget {
  constructor() {
    super();
    this.head = new FakeElement("head");
    this.head.ownerDocument = this;
    this.documentElement = new FakeElement("html");
    this.documentElement.ownerDocument = this;
    this.body = new FakeElement("body");
    this.body.ownerDocument = this;

    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);

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

    this.scoreElements = [this.activeScoreElement];

    this.body.appendChild(this.variantElement);
    this.body.appendChild(this.suggestionElement);
    this.body.appendChild(this.activePlayerRow);
    this.body.appendChild(this.turnContainer);
    this.body.appendChild(this.turnPointsElement);
    this.body.appendChild(this.winnerNode);
  }

  createElement(tagName) {
    const node = new FakeElement(tagName);
    node.ownerDocument = this;
    return node;
  }

  createElementNS(_namespace, tagName) {
    const node = new FakeElement(tagName);
    node.ownerDocument = this;
    return node;
  }

  getElementById(id) {
    if (id === "ad-ext-game-variant") {
      return this.variantElement;
    }
    if (id === "ad-ext-turn") {
      return this.turnContainer;
    }

    const stack = [this.documentElement];
    while (stack.length) {
      const node = stack.shift();
      if (!node) {
        continue;
      }
      if (node.id === id) {
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
    const normalized = String(selector || "").trim();
    if (!normalized) {
      return [];
    }

    if (normalized.includes(",")) {
      const results = [];
      const seen = new Set();
      normalized
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .forEach((entry) => {
          this.querySelectorAll(entry).forEach((node) => {
            if (seen.has(node)) {
              return;
            }
            seen.add(node);
            results.push(node);
          });
        });
      return results;
    }

    if (normalized === ".suggestion") {
      return this.suggestionElement ? [this.suggestionElement] : [];
    }

    if (normalized === "p.ad-ext-player-score") {
      return this.scoreElements.slice();
    }

    if (
      normalized === ".ad-ext-player-active" ||
      normalized === ".ad-ext-player.ad-ext-player-active"
    ) {
      return this.activePlayerRow ? [this.activePlayerRow] : [];
    }

    if (
      normalized.includes(".ad-ext-player-active p.ad-ext-player-score") ||
      normalized.includes(".ad-ext-player.ad-ext-player-active p.ad-ext-player-score")
    ) {
      return this.scoreElements.slice();
    }

    if (normalized === ".ad-ext-turn-throw") {
      return this.throwRow ? [this.throwRow] : [];
    }

    if (normalized === ".ad-ext-turn-throw p" || normalized === ".ad-ext-turn-throw p.chakra-text") {
      return this.throwTextElement ? [this.throwTextElement] : [];
    }

    if (normalized === "p.ad-ext-turn-points") {
      return this.turnPointsElement ? [this.turnPointsElement] : [];
    }

    if (
      normalized === ".ad-ext_winner-animation" ||
      normalized === ".ad-ext-player-winner" ||
      normalized === ".ad-ext-player.ad-ext-player-winner"
    ) {
      const isWinner =
        this.winnerNode &&
        this.winnerNode.classList.contains("ad-ext-player-winner");
      return isWinner ? [this.winnerNode] : [];
    }

    if (normalized.startsWith("#")) {
      const found = this.getElementById(normalized.slice(1));
      return found ? [found] : [];
    }

    return [];
  }
}

function matchesSelector(node, selector) {
  if (!node || !selector) {
    return false;
  }

  const normalized = String(selector).trim();
  if (!normalized) {
    return false;
  }

  if (normalized.startsWith("#")) {
    return node.id === normalized.slice(1);
  }

  if (normalized.startsWith(".")) {
    const classes = normalized
      .split(".")
      .map((entry) => entry.trim())
      .filter(Boolean);
    return classes.every((className) => node.classList?.contains(className));
  }

  const tagAndClassMatch = normalized.match(/^([a-zA-Z0-9_-]+)(\.[a-zA-Z0-9_.-]+)?$/);
  if (tagAndClassMatch) {
    const tagName = String(tagAndClassMatch[1] || "").toUpperCase();
    if (tagName && node.tagName !== tagName) {
      return false;
    }

    const classChunk = String(tagAndClassMatch[2] || "").trim();
    if (!classChunk) {
      return true;
    }

    const classes = classChunk
      .split(".")
      .map((entry) => entry.trim())
      .filter(Boolean);
    return classes.every((className) => node.classList?.contains(className));
  }

  const attrMatch = normalized.match(/^\[([a-zA-Z0-9_-]+)\]$/);
  if (attrMatch) {
    const attrName = attrMatch[1];
    return Boolean(node[attrName]) || Boolean(node.dataset?.[attrName]);
  }

  return false;
}

function createFakeWindow(options = {}) {
  const documentRef = options.documentRef || new FakeDocument();
  const eventTarget = new FakeEventTarget();

  return {
    document: documentRef,
    localStorage: options.localStorage || new FakeStorage(),
    MutationObserver: FakeMutationObserver,
    MessageEvent: FakeMessageEvent,
    WebSocket: FakeWebSocket,
    requestAnimationFrame(callback) {
      return setTimeout(callback, 0);
    },
    cancelAnimationFrame(handle) {
      clearTimeout(handle);
    },
    addEventListener: eventTarget.addEventListener.bind(eventTarget),
    removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
    __eventTarget: eventTarget,
  };
}

export {
  FakeClassList,
  FakeDocument,
  FakeElement,
  FakeEventTarget,
  FakeMessageEvent,
  FakeMutationObserver,
  FakeStorage,
  FakeWebSocket,
  createFakeWindow,
};
