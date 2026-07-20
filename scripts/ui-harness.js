const fs = require("node:fs");
const vm = require("node:vm");

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  toggle(name, enabled) {
    if (enabled) this.values.add(name);
    else this.values.delete(name);
  }

  contains(name) {
    return this.values.has(name);
  }
}

class FakeElement {
  constructor(dataset = {}) {
    this.dataset = dataset;
    this.classList = new FakeClassList();
    this.attributes = new Map();
    this.listeners = new Map();
    this._innerHTML = "";
    this.matches = new Map();
    this.textContent = "";
    this.value = "";
    this.placeholder = "";
    this.hidden = false;
  }

  addEventListener(type, handler) {
    this.listeners.set(type, handler);
  }

  set innerHTML(value) {
    this._innerHTML = String(value || "");
    this.matches.clear();
  }

  get innerHTML() {
    return this._innerHTML;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    if (this.matches.has(selector)) return this.matches.get(selector);
    const attribute = selector.match(/^\[data-([a-z-]+)\]$/)?.[1];
    if (!attribute) return [];
    const property = attribute.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const pattern = new RegExp(`data-${attribute}(?:="([^"]*)")?`, "g");
    const items = [...this._innerHTML.matchAll(pattern)].map((match) => new FakeElement({ [property]: match[1] || "" }));
    this.matches.set(selector, items);
    return items;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  focus() {}

  scrollIntoView() {}
}

async function loadApp({ snapshotFile = "snapshot.js", appFile = "app.js", payload = null } = {}) {
  const ids = [
    "windowLabel",
    "primaryKicker",
    "primaryTitle",
    "primarySearchInput",
    "clearPrimarySearch",
    "primaryList",
    "primaryPanel",
  ];
  const elements = new Map(ids.map((id) => [`#${id}`, new FakeElement()]));
  const primaryButtons = ["market", "repeat"].map((primaryModule) => new FakeElement({ primaryModule }));
  const filterButtons = [];
  const document = {
    querySelector(selector) {
      return elements.get(selector) || null;
    },
    querySelectorAll(selector) {
      if (selector === "[data-primary-module]") return primaryButtons;
      if (selector === "[data-filter]") return filterButtons;
      return [];
    },
  };
  const context = vm.createContext({
    window: {},
    document,
    console,
    setTimeout,
    clearTimeout,
    fetch: async () => {
      throw new Error("offline test");
    },
  });

  if (payload) context.window.TRUMP_FEED_SNAPSHOT = payload;
  else vm.runInContext(fs.readFileSync(snapshotFile, "utf8"), context, { filename: snapshotFile });
  vm.runInContext(fs.readFileSync(appFile, "utf8"), context, { filename: appFile });
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { context, elements, primaryButtons, filterButtons, vm };
}

module.exports = { loadApp };
