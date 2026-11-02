import { acquireSharedCricketRuntime } from "../cricket-surface/shared-runtime.js";
import { createCricketLayoutRenderer } from "../cricket-layout/renderer.js";
import { createCricketGridStatusRenderer } from "../cricket-grid-status-effects/renderer.js";

const tables = new WeakMap();

function createTable(runtime) {
  const parts = new Map();
  let unsubscribe = null;
  let sharedHealth = null;
  const schedule = () => runtime.scheduler.schedule();

  function monitor(part) {
    part.unmonitor = part.context.watchdog?.register({
      coverage: "display",
      check(snapshot) {
        if (part.renderError) return part.renderError;
        const shared = sharedHealth?.check(snapshot);
        return shared !== true && shared != null ? shared : part.renderer.checkHealth?.(snapshot) ?? true;
      },
      repair(snapshot) {
        if (runtime.scheduler.health) sharedHealth?.repair(snapshot);
        else schedule();
      },
    }) || (() => {});
  }

  function renderPart(kind, input) {
    const part = parts.get(kind);
    if (!part) return;
    try {
      part.renderer.update(input);
      part.renderError = "";
    } catch (error) {
      part.renderError = `render-failed: ${error?.message || error}`;
    }
  }

  return {
    attach(kind, context) {
      const renderer = kind === "layout"
        ? createCricketLayoutRenderer(context, schedule)
        : createCricketGridStatusRenderer(context, runtime);
      const part = { renderer, context, renderError: "", unmonitor: () => {} };
      parts.set(kind, part);
      if (!unsubscribe) {
        unsubscribe = runtime.subscribe({
          featureKey: "cricket-table",
          watchdog: { register(health) {
            sharedHealth = health;
            parts.forEach(monitor);
            return () => parts.forEach((entry) => entry.unmonitor());
          } },
          onTurnReset: () => parts.forEach((entry) => entry.renderer.clear()),
          isManagedNode: (node) => Array.from(parts.values()).some((entry) => entry.renderer.isManagedNode?.(node)),
          collectWatchNodes: (input) => Array.from(parts.values()).flatMap((entry) => entry.renderer.collectWatchNodes?.(input) || []),
          onRenderState(input) {
            // Geometry owns the base table; state effects decorate it afterwards.
            renderPart("layout", input);
            renderPart("effects", input);
          },
        });
      } else {
        monitor(part);
        schedule();
      }
      let removed = false;
      return () => {
        if (removed) return;
        removed = true;
        part.unmonitor();
        (renderer.dispose || renderer.clear)();
        parts.delete(kind);
        if (!parts.size) {
          unsubscribe();
          tables.delete(runtime);
        } else schedule();
      };
    },
  };
}

// Preserve both public feature/config identities while sharing one table subscription.
export function mountCricketTablePart(context = {}, kind) {
  const documentRef = context.documentRef || globalThis.document;
  const windowRef = context.windowRef || globalThis.window;
  if (!documentRef || !windowRef || !context.domGuards || !context.domain?.cricketRules) return () => {};
  const runtime = acquireSharedCricketRuntime(context);
  if (!runtime) return () => {};
  let table = tables.get(runtime);
  if (!table) {
    table = createTable(runtime);
    tables.set(runtime, table);
  }
  return table.attach(kind, { ...context, documentRef, windowRef });
}
