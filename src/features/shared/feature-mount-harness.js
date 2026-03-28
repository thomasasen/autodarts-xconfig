import { createRafScheduler } from "../../shared/raf-scheduler.js";

function resolveSchedulerFactory(context, windowRef) {
  const factory = context?.helpers?.createRafScheduler;
  if (typeof factory === "function") {
    return factory;
  }

  return (callback, options = {}) =>
    createRafScheduler(callback, {
      windowRef,
      ...options,
    });
}

function resolveObserverTarget(documentRef) {
  return documentRef?.documentElement || documentRef?.body || documentRef || null;
}

function createCleanupStack() {
  const entries = [];

  return {
    add(cleanup) {
      if (typeof cleanup !== "function") {
        return cleanup;
      }
      entries.push(cleanup);
      return cleanup;
    },
    flush() {
      while (entries.length) {
        const cleanup = entries.pop();
        try {
          cleanup();
        } catch (_) {
          // Keep feature teardown resilient.
        }
      }
    },
  };
}

export function createFeatureMountHarness(context = {}, options = {}) {
  const documentRef = context.documentRef || (typeof document !== "undefined" ? document : null);
  const windowRef = context.windowRef || (typeof window !== "undefined" ? window : null);
  const observerRegistry = context.registries?.observers || null;
  const listenerRegistry = context.registries?.listeners || null;
  const gameState = context.gameState || null;
  const schedulerFactory = resolveSchedulerFactory(context, windowRef);
  const isSupported =
    typeof options.isSupported === "function"
      ? options.isSupported({
          context,
          documentRef,
          windowRef,
          observerRegistry,
          listenerRegistry,
          gameState,
        })
      : true;

  if (!documentRef || typeof schedulerFactory !== "function" || isSupported !== true) {
    return null;
  }

  const scheduler = schedulerFactory(
    typeof options.update === "function" ? options.update : () => {},
    options.schedulerOptions || {}
  );
  const cleanupStack = createCleanupStack();

  const harness = {
    context,
    documentRef,
    windowRef,
    observerRegistry,
    listenerRegistry,
    gameState,
    scheduler,
    schedule() {
      scheduler.schedule();
    },
    addCleanup(cleanup) {
      return cleanupStack.add(cleanup);
    },
    registerObserver(observerOptions = {}) {
      if (
        !observerRegistry ||
        typeof observerRegistry.registerMutationObserver !== "function"
      ) {
        return null;
      }

      const key = String(observerOptions.key || "").trim();
      const target = observerOptions.target || resolveObserverTarget(documentRef);
      if (!key || !target) {
        return null;
      }

      const observer = observerRegistry.registerMutationObserver({
        key,
        target,
        callback:
          typeof observerOptions.callback === "function"
            ? observerOptions.callback
            : () => harness.schedule(),
        observeOptions: observerOptions.observeOptions,
        MutationObserverRef:
          observerOptions.MutationObserverRef || windowRef?.MutationObserver,
      });

      if (!observer) {
        return null;
      }

      cleanupStack.add(() => {
        if (typeof observerRegistry.disconnect === "function") {
          observerRegistry.disconnect(key);
        }
      });

      return observer;
    },
    registerListeners(listenerEntries = []) {
      if (
        !listenerRegistry ||
        typeof listenerRegistry.register !== "function" ||
        !Array.isArray(listenerEntries)
      ) {
        return;
      }

      listenerEntries.forEach((entry) => {
        const key = String(entry?.key || "").trim();
        if (!key) {
          return;
        }

        listenerRegistry.register(entry);
        cleanupStack.add(() => {
          if (typeof listenerRegistry.remove === "function") {
            listenerRegistry.remove(key);
          }
        });
      });
    },
    subscribeToGameState(handler = null) {
      if (!gameState || typeof gameState.subscribe !== "function") {
        return () => {};
      }

      const unsubscribe = gameState.subscribe(
        typeof handler === "function" ? handler : () => harness.schedule()
      );
      cleanupStack.add(() => {
        try {
          unsubscribe();
        } catch (_) {
          // Keep feature teardown resilient.
        }
      });
      return unsubscribe;
    },
    createCleanup(finalize = null) {
      let cleanedUp = false;

      return function cleanupFeatureMountHarness() {
        if (cleanedUp) {
          return;
        }
        cleanedUp = true;

        scheduler.cancel();
        cleanupStack.flush();

        if (typeof finalize === "function") {
          finalize();
        }
      };
    },
  };

  return harness;
}
