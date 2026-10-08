const CHECK_INTERVAL_MS = 5000;
const SETTLE_MS = 1500;
const REPAIR_COOLDOWN_MS = 30000;
const MAX_REPAIRS_PER_FEATURE = 3;
const GLOBAL_WINDOW_MS = 60000;
const MAX_GLOBAL_REPAIRS = 6;
const MAX_LOG_ENTRIES = 100;

function requireSynchronous(result) {
  if (result && typeof result.then === "function") {
    // A mistaken async hook must not leave an unhandled rejection behind.
    Promise.resolve(result).catch(() => {});
    throw new Error("Watchdog hooks must be synchronous");
  }
  return result;
}

// Synchronous checks only. Neither a healthy render nor a new turn replenishes
// repair budgets. Only an explicit runtime stop/start opens the circuit again.
export function createFeatureWatchdog(context = {}) {
  const features = new Map();
  const log = [];
  const repairTimes = [];
  const windowRef = context.windowRef;
  let started = false;
  let checking = false;
  let timer = null;
  let timerDue = 0;
  let pendingSince = null;
  let pendingLogged = false;

  function record(feature, action, reason, generation) {
    log.push({ time: Date.now(), feature, action, reason: String(reason || "").slice(0, 200), generation });
    if (log.length > MAX_LOG_ENTRIES) log.shift();
  }

  function arm(delay) {
    if (!started || !windowRef?.setTimeout) return;
    const due = Date.now() + delay;
    if (timer !== null && timerDue <= due) return;
    if (timer !== null) windowRef.clearTimeout(timer);
    timerDue = due;
    timer = windowRef.setTimeout(() => {
      timer = null;
      check();
      arm(CHECK_INTERVAL_MS);
    }, delay);
  }

  function inspectFeature(entry, snapshot) {
    const status = entry.readStatus();
    if (!status.enabled || status.scheduled) return { skip: true };
    if (status.failure?.phase === "cleanup") return { reason: "cleanup-failed", unsafe: true };
    // A throwing initializer may already own timers/DOM without having returned
    // cleanup. Automatically mounting it again would duplicate those resources.
    if (status.failure?.phase === "mount") return { reason: "mount-failed", unsafe: true };
    if (!status.mounted) return { reason: "mount-missing", restart: true };
    for (const hooks of entry.checks) {
      const result = requireSynchronous(hooks.check(snapshot));
      if (result !== true && result != null) {
        return { reason: String(result || "health-check-failed"), hooks };
      }
    }
    return {};
  }

  function check() {
    if (!started || checking || context.documentRef?.hidden ||
        context.documentRef?.visibilityState === "hidden") return;
    checking = true;
    try {
      // This deliberate reread is also the backstop for missed DOM/state events.
      const snapshot = context.turnLifecycle.refresh();
      if (snapshot.phase !== "ready") {
        if (snapshot.phase === "pending") {
          if (pendingSince === null) pendingSince = Date.now();
          if (!pendingLogged && Date.now() - pendingSince >= 10000) {
            record("turn-lifecycle", "waiting", "identity-pending", snapshot.generation);
            pendingLogged = true;
          }
        } else {
          pendingSince = null;
          pendingLogged = false;
        }
        return; // A timeout is never evidence for choosing a player.
      }
      pendingSince = null;
      pendingLogged = false;
      for (const [key, entry] of features) {
        let problem;
        try {
          problem = inspectFeature(entry, snapshot);
        } catch (error) {
          problem = { reason: `check-failed: ${error?.message || error}`, unsafe: true };
        }
        if (problem.skip) { entry.status = "inactive"; continue; }
        if (!problem.reason) {
          if (entry.awaitingVerification) record(key, "recovered", "health-check-passed", snapshot.generation);
          entry.awaitingVerification = false;
          entry.correctionFailed = false;
          entry.firstFailure = null;
          entry.reason = "";
          entry.status = entry.blocked ? "blocked" : "healthy";
          continue;
        }
        if (entry.awaitingVerification) {
          record(key, "repair-unconfirmed", problem.reason, snapshot.generation);
          entry.awaitingVerification = false;
          entry.correctionFailed = true;
        }
        if (entry.reason !== problem.reason) record(key, "detected", problem.reason, snapshot.generation);
        entry.reason = problem.reason;
        entry.status = entry.blocked ? "blocked" : "degraded";
        if (entry.firstFailure === null) entry.firstFailure = Date.now();
        if (problem.unsafe) {
          if (!entry.blocked) record(key, "blocked", problem.reason, snapshot.generation);
          entry.blocked = true;
          entry.status = "blocked";
          continue;
        }
        if (entry.blocked || Date.now() - entry.firstFailure < SETTLE_MS ||
            Date.now() - entry.lastRepair < REPAIR_COOLDOWN_MS) continue;
        if (entry.attempts >= MAX_REPAIRS_PER_FEATURE) {
          entry.blocked = true;
          entry.status = "blocked";
          record(key, "blocked", "repair-budget-exhausted", snapshot.generation);
          continue;
        }
        while (repairTimes.length && Date.now() - repairTimes[0] >= GLOBAL_WINDOW_MS) repairTimes.shift();
        if (repairTimes.length >= MAX_GLOBAL_REPAIRS) continue;
        entry.attempts += 1;
        entry.lastRepair = Date.now();
        repairTimes.push(Date.now());
        // A second failed correction may restart only explicitly safe features.
        const restart = problem.restart || (entry.correctionFailed && problem.hooks?.restartSafe === true);
        record(key, restart ? "restart" : "repair", problem.reason, snapshot.generation);
        try {
          const repair = restart ? entry.restart : problem.hooks?.repair;
          if (typeof repair !== "function") throw new Error("No safe repair registered");
          requireSynchronous(repair(snapshot));
          entry.awaitingVerification = true;
        } catch (error) {
          // Uncertain cleanup/repair must never trigger another automatic mount.
          entry.blocked = true;
          entry.status = "blocked";
          record(key, "blocked", `repair-failed: ${error?.message || error}`, snapshot.generation);
        }
      }
    } catch (error) {
      record("turn-lifecycle", "check-failed", error?.message || error, null);
    } finally {
      checking = false;
    }
  }

  return {
    registerFeature(key, { readStatus, restart }) {
      features.set(key, {
        readStatus, restart, checks: new Set(), attempts: 0, lastRepair: -Infinity,
        firstFailure: null, reason: "", status: "idle", blocked: false, awaitingVerification: false,
        correctionFailed: false,
      });
    },
    forFeature(key) {
      const registrations = new Set();
      return {
        register(hooks) {
          const entry = features.get(key);
          if (!entry || typeof hooks.check !== "function") return () => {};
          entry.checks.add(hooks);
          registrations.add(hooks);
          return () => { entry.checks.delete(hooks); registrations.delete(hooks); };
        },
        dispose: () => {
          const entry = features.get(key);
          registrations.forEach((hooks) => entry?.checks.delete(hooks));
          registrations.clear();
        },
      };
    },
    start() {
      if (started) return;
      started = true;
      arm(CHECK_INTERVAL_MS);
    },
    stop() {
      started = false;
      if (timer !== null) windowRef.clearTimeout(timer);
      timer = null;
      repairTimes.length = 0;
      pendingSince = null;
      pendingLogged = false;
      features.forEach((entry) => {
        entry.checks.clear();
        entry.attempts = 0;
        entry.blocked = false;
        entry.lastRepair = -Infinity;
        entry.firstFailure = null;
        entry.reason = "";
        entry.status = "idle";
        entry.awaitingVerification = false;
        entry.correctionFailed = false;
      });
    },
    requestCheck: () => arm(SETTLE_MS),
    check,
    inspect() {
      return {
        started,
        features: Object.fromEntries([...features].map(([key, entry]) => [key, {
          status: entry.status, attempts: entry.attempts, blocked: entry.blocked,
          reason: entry.reason, checks: entry.checks.size,
          coverage: [...entry.checks].some((hooks) => hooks.coverage === "display")
            ? "display" : entry.checks.size ? "render" : "mount",
        }])),
        log: log.map((entry) => ({ ...entry })),
      };
    },
  };
}
