import { createRafScheduler } from "../../shared/raf-scheduler.js";

const groupsByDocument = new WeakMap();

function createSharedGameState(gameState, owner, subscribe, readSurfaceState) {
  return gameState && new Proxy(gameState, {
    get(source, key) {
      if (key === "subscribe" && typeof source.subscribe === "function") return (handler) => subscribe(source, owner, handler);
      if (key === "getSnapshot" && typeof source.getSnapshot === "function") {
        return () => readSurfaceState(source, () => source.getSnapshot());
      }
      const value = Reflect.get(source, key, source);
      return typeof value === "function" ? value.bind(source) : value;
    },
  });
}

function createGroup(context, onEmpty) {
  const jobs = new Set();
  const owners = new Set();
  const sources = new Map();
  const reads = new Map();
  let flushing = false;
  const factory = context.helpers?.createRafScheduler || createRafScheduler;
  const scheduler = factory(() => {
    if (flushing) return;
    flushing = true;
    reads.clear();
    let failure = null;
    try {
      const batch = [...jobs].sort((left, right) => left.priority - right.priority);
      batch.forEach((job) => {
        if (!jobs.delete(job) || !job.owner.active) return;
        try { job.callback(); } catch (error) { failure ||= error; }
      });
    } finally {
      flushing = false;
      reads.clear();
    }
    if (jobs.size) scheduler.schedule();
    if (failure) throw failure;
  }, { windowRef: context.windowRef });

  function readSurfaceState(key, read) {
    if (!flushing) return read();
    if (!reads.has(key)) reads.set(key, read());
    return reads.get(key);
  }

  function subscribe(source, owner, handler) {
    let record = sources.get(source);
    if (!record) {
      record = { handlers: new Set(), release: () => {}, connected: false };
      sources.set(source, record);
    }
    const entry = { owner, handler };
    record.handlers.add(entry);
    const release = () => {
      record.handlers.delete(entry);
      owner.releases.delete(release);
      if (!record.handlers.size && sources.get(source) === record) {
        record.release();
        sources.delete(source);
      }
    };
    owner.releases.add(release);
    if (!record.connected) {
      record.connected = true;
      const dispose = source.subscribe((snapshot) => {
        let failure = null;
        [...record.handlers].forEach((entry) => {
          if (!entry.owner.active) return;
          try { entry.handler(snapshot); } catch (error) { failure ||= error; }
        });
        if (failure) throw failure;
      });
      record.release = typeof dispose === "function" ? dispose : () => {};
    }
    return release;
  }

  return {
    mount(context, priority, initialize) {
      const owner = { active: true, releases: new Set(), jobs: new Set() };
      owners.add(owner);
      const gameState = createSharedGameState(context.gameState, owner, subscribe, readSurfaceState);
      function release() {
        if (!owner.active) return;
        owner.active = false;
        owner.jobs.forEach((job) => jobs.delete(job));
        [...owner.releases].forEach((dispose) => dispose());
        owners.delete(owner);
        if (!owners.size) { scheduler.cancel(); onEmpty(); }
      }
      let cleanup;
      try {
        cleanup = initialize({
          ...context, gameState, readSurfaceState,
          helpers: {
            ...context.helpers,
            createRafScheduler(callback) {
              const job = { owner, priority, callback };
              owner.jobs.add(job);
              return {
                schedule() { if (owner.active) { jobs.add(job); if (!flushing) scheduler.schedule(); } },
                cancel() { jobs.delete(job); },
              };
            },
          },
        });
      } catch (error) { release(); throw error; }
      return () => { if (owner.active) { try { cleanup?.(); } finally { release(); } } };
    },
  };
}

// Each renderer keeps its lifecycle, watchdog and owned DOM; a group shares one frame and read scope.
export function mountFeatureSurfaceGroup(context, groupKey, priority, initialize) {
  const documentRef = context.documentRef || globalThis.document;
  if (!documentRef) return () => {};
  let groups = groupsByDocument.get(documentRef);
  if (!groups) { groups = new Map(); groupsByDocument.set(documentRef, groups); }
  let group = groups.get(groupKey);
  if (!group) {
    group = createGroup(context, () => groups.delete(groupKey));
    groups.set(groupKey, group);
  }
  return group.mount(context, priority, initialize);
}

export function readSharedFeatureSurface(context, key, read) {
  return typeof context.readSurfaceState === "function" ? context.readSurfaceState(key, read) : read();
}
