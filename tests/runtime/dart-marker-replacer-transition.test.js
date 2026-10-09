import test from "node:test";
import assert from "node:assert/strict";
import { createZoomTransitionTracker } from "../../src/features/dart-marker-replacer/zoom-transition-tracker.js";
import { initializeDartMarkerReplacer } from "../../src/features/dart-marker-replacer/index.js";
import { createDomGuards } from "../../src/core/dom-guards.js";
import { FakeDocument, createFakeWindow, createFakeTimerHarness } from "./fake-dom.js";

function fixture(style = {}) {
  const documentRef = new FakeDocument();
  const windowRef = createFakeWindow({ documentRef });
  const timers = createFakeTimerHarness();
  timers.installOnWindow(windowRef);
  windowRef.getComputedStyle = () => ({
    transitionProperty: "transform", transitionDuration: "0.3s", transitionDelay: "0s", ...style,
  });
  let updates = 0;
  const tracker = createZoomTransitionTracker({ documentRef, windowRef, scheduleUpdate: () => { updates += 1; } });
  const target = documentRef.createElement("div");
  documentRef.main.appendChild(target);
  const event = (node = target, propertyName = "transform") => ({ target: node, propertyName });
  return { documentRef, windowRef, timers, tracker, target, event, get updates() { return updates; } };
}

test("dart transition tracking follows the full CSS duration and delay, then stops without an end event", () => {
  const f = fixture({ transitionProperty: "opacity, all, transform", transitionDuration: "50ms, 0.2s, 1s", transitionDelay: "0s, 0s, 0.2s" });
  f.tracker.start(f.event());
  f.timers.advance(1250);
  assert.ok(f.timers.pendingCount > 0, "valid long transitions are not cut to shipped zoom duration");
  f.timers.advance(100);
  assert.equal(f.timers.pendingCount, 0);
  const updates = f.updates;
  f.timers.advance(1000);
  assert.equal(f.updates, updates, "lost end events do not leave a frame loop");
});

test("dart transition tracking uses repeated CSS time lists and negative delay", () => {
  const f = fixture({ transitionProperty: "opacity, transform", transitionDuration: "0.4s", transitionDelay: "-0.2s" });
  f.tracker.start(f.event());
  f.timers.advance(290);
  assert.ok(f.timers.pendingCount > 0);
  f.timers.advance(30);
  assert.equal(f.timers.pendingCount, 0);
});

test("dart transition tracking preserves overlapping targets and accepts end events after class removal", () => {
  const f = fixture();
  const second = f.documentRef.createElement("div");
  f.documentRef.main.appendChild(second);
  f.target.classList.add("ad-ext-tv-board-zoom");
  f.tracker.start(f.event());
  f.tracker.start(f.event(second));
  f.target.classList.remove("ad-ext-tv-board-zoom");
  f.tracker.finish(f.event());
  assert.equal(f.timers.pendingCount, 1, "the other target still needs tracking");
  f.tracker.finish(f.event(second, "opacity"));
  assert.equal(f.timers.pendingCount, 1, "other transition properties cannot end transform tracking");
  f.tracker.finish(f.event(second));
  assert.equal(f.timers.pendingCount, 0);
});

test("dart transition tracking drops detached targets on the next frame", () => {
  const f = fixture();
  f.tracker.start(f.event());
  f.target.remove();
  f.timers.advance(16);
  assert.equal(f.timers.pendingCount, 0);
});

test("dart transition tracking retains a verified running native transition past its fallback deadline", () => {
  const f = fixture();
  let running = true;
  f.target.getAnimations = () => [{ transitionProperty: "transform", playState: running ? "running" : "finished", effect: { target: f.target } }];
  f.tracker.start(f.event());
  f.timers.advance(1000);
  assert.equal(f.timers.pendingCount, 1);
  running = false;
  f.timers.advance(16);
  assert.equal(f.timers.pendingCount, 0);
});

test("dart transition tracking pauses hidden frames and resumes an unfinished transition", () => {
  const f = fixture();
  f.tracker.start(f.event());
  f.documentRef.hidden = true;
  f.tracker.visibilityChanged();
  const updates = f.updates;
  assert.equal(f.timers.pendingCount, 0);
  f.timers.advance(100);
  assert.equal(f.updates, updates);
  f.documentRef.hidden = false;
  f.tracker.visibilityChanged();
  assert.equal(f.updates, updates + 1);
  assert.equal(f.timers.pendingCount, 1);
  f.documentRef.hidden = true;
  f.tracker.visibilityChanged();
  f.timers.advance(1000);
  f.documentRef.hidden = false;
  f.tracker.visibilityChanged();
  assert.equal(f.timers.pendingCount, 0, "an expired hidden transition gets only a final reposition");
});

test("dart transition tracking rearms repeated starts and clears all state on turn reset or unmount", () => {
  const f = fixture();
  f.tracker.start(f.event());
  f.timers.advance(300);
  f.tracker.start(f.event());
  f.timers.advance(200);
  assert.equal(f.timers.pendingCount, 1);
  f.tracker.cancel();
  const updates = f.updates;
  f.tracker.finish(f.event());
  f.tracker.visibilityChanged();
  assert.equal(f.timers.pendingCount, 0);
  assert.equal(f.updates, updates + 1, "visibility updates once, but retains no old targets");
  f.tracker.start(f.event());
  assert.equal(f.timers.pendingCount, 1, "a new turn can track new transitions");
  f.tracker.cancel();
  f.timers.advance(1000);
  assert.equal(f.timers.pendingCount, 0);
});

test("dart marker mount wires class-independent transition ends and cancels tracking on turn reset and cleanup", () => {
  const f = fixture();
  const listeners = new Map();
  let turnEntry;
  let schedules = 0;
  const cleanup = initializeDartMarkerReplacer({
    documentRef: f.documentRef, windowRef: f.windowRef,
    domGuards: createDomGuards({ documentRef: f.documentRef }),
    registries: { listeners: {
      register(options) { listeners.set(options.type, options); },
      remove(key) { for (const [type, value] of listeners) if (value.key === key) listeners.delete(type); },
    } },
    turnLifecycle: { register(entry) { turnEntry = entry; return () => {}; } },
    helpers: { createRafScheduler: () => ({ schedule() { schedules += 1; }, cancel() {} }) },
  });
  const run = (type) => listeners.get(type).handler(f.event());
  try {
    f.target.classList.add("ad-ext-tv-board-zoom");
    run("transitionrun");
    assert.equal(f.timers.pendingCount, 1);
    f.target.classList.remove("ad-ext-tv-board-zoom");
    run("transitionend");
    assert.equal(f.timers.pendingCount, 0);
    f.target.classList.add("ad-ext-tv-board-zoom");
    run("transitionrun");
    run("transitioncancel");
    assert.equal(f.timers.pendingCount, 0);
    run("transitionrun");
    turnEntry.reset();
    assert.equal(f.timers.pendingCount, 0);
    run("transitionrun");
    assert.equal(f.timers.pendingCount, 1);
  } finally {
    cleanup();
  }
  const before = schedules;
  f.timers.advance(1000);
  assert.equal(schedules, before);
  assert.equal(f.timers.pendingCount, 0);
  assert.equal(listeners.size, 0);
});
