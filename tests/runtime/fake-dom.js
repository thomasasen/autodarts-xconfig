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

class FakeDocument {
  constructor() {
    this.head = new FakeElement("head");
    this.documentElement = new FakeElement("html");
    this.body = new FakeElement("body");

    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);

    this.variantElement = new FakeElement("div");
    this.variantElement.id = "ad-ext-game-variant";
    this.variantElement.textContent = "X01";

    this.suggestionElement = new FakeElement("div");
    this.suggestionElement.classList.add("suggestion");

    this.activeScoreElement = new FakeElement("p");
    this.activeScoreElement.classList.add("ad-ext-player-score");
    this.activeScoreElement.textContent = "170";

    this.scoreElements = [this.activeScoreElement];

    this.body.appendChild(this.variantElement);
    this.body.appendChild(this.suggestionElement);
    this.body.appendChild(this.activeScoreElement);
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }

  getElementById(id) {
    if (id === "ad-ext-game-variant") {
      return this.variantElement;
    }

    const styleInHead = this.head.children.find((child) => child.id === id);
    if (styleInHead) {
      return styleInHead;
    }

    const styleInBody = this.body.children.find((child) => child.id === id);
    if (styleInBody) {
      return styleInBody;
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

    if (normalized === ".suggestion") {
      return this.suggestionElement ? [this.suggestionElement] : [];
    }

    if (normalized === "p.ad-ext-player-score") {
      return this.scoreElements.slice();
    }

    if (
      normalized.includes(".ad-ext-player-active p.ad-ext-player-score") ||
      normalized.includes(".ad-ext-player.ad-ext-player-active p.ad-ext-player-score")
    ) {
      return this.scoreElements.slice();
    }

    if (normalized.startsWith("#")) {
      const found = this.getElementById(normalized.slice(1));
      return found ? [found] : [];
    }

    return [];
  }
}

function createFakeWindow(options = {}) {
  const documentRef = options.documentRef || new FakeDocument();
  const eventTarget = new FakeEventTarget();

  return {
    document: documentRef,
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
  FakeWebSocket,
  createFakeWindow,
};