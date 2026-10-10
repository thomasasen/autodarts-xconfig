import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Serve source modules directly, so this regression needs no userscript build.
  await page.route("http://xconfig.test/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/") {
      await route.fulfill({ contentType: "text/html", body: `<!doctype html>
        <style>
          #host { width:500px; height:500px; overflow:visible }
          #board { width:500px; height:500px; position:relative }
          #board svg { position:absolute; inset:0; width:100%; height:100% }
          @media (prefers-reduced-motion:reduce) {
            * { transition:none!important; transition-duration:0s!important }
          }
        </style>
        <div id="host"><div id="board" role="img" aria-label="Dartboard">
          ${Array.from({ length: 4 }, () => '<svg viewBox="0 0 1000 1000"><circle cx="500" cy="500" r="380"/><text x="500" y="50">20</text></svg>').join("")}
        </div></div>` });
    } else if (pathname.startsWith("/src/") && !pathname.includes("..")) {
      await route.fulfill({ contentType: "text/javascript", body: await readFile(new URL(`..${pathname}`, import.meta.url), "utf8") });
    } else {
      await route.abort();
    }
  });
  await page.goto("http://xconfig.test/");
  await page.evaluate(async () => {
    const logic = await import("/src/features/tv-board-zoom/logic.js");
    const style = await import("/src/features/tv-board-zoom/style.js");
    const x01Rules = await import("/src/domain/x01-rules.js");
    const stylesheet = document.createElement("style");
    stylesheet.textContent = style.buildStyleText();
    document.head.appendChild(stylesheet);
    const targetNode = document.getElementById("board");
    const hostNode = document.getElementById("host");
    const layers = Array.from(targetNode.querySelectorAll("svg"));
    const state = {};
    const speed = style.resolveZoomSpeedConfig("mittel", "cinematic");
    window.zoomTest = {
      layers, state,
      apply(segment, zoomStyle = "cinematic") {
        return logic.applyZoom({ targetNode, hostNode, boardSvg: layers[0] }, 2.75,
          style.resolveZoomSpeedConfig("mittel", zoomStyle),
          { reason: "checkout", segment }, state, { x01Rules, windowRef: window, documentRef: document });
      },
      reset(immediate = false) { logic.resetZoom(speed, state, immediate); },
      sample() {
        return layers.map((layer) => {
          const computed = getComputedStyle(layer);
          const matrix = new DOMMatrixReadOnly(computed.transform);
          return { scale: matrix.a, x: matrix.e, y: matrix.f, duration: computed.transitionDuration,
            property: computed.transitionProperty, priority: layer.style.getPropertyPriority("transition") };
        });
      },
      async nextFrame() { await new Promise(requestAnimationFrame); },
      async advance(ms) {
        const start = performance.now();
        do { await new Promise(requestAnimationFrame); } while (performance.now() - start < ms);
      },
    };
  });
});

for (const reducedMotion of ["no-preference", "reduce"]) {
  test(`cinematic zoom interpolates all layers and retargets under ${reducedMotion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    const result = await page.evaluate(async () => {
      const zoom = window.zoomTest;
      await zoom.nextFrame();
      zoom.sample();
      zoom.apply("D18");
      await zoom.advance(110);
      const duringIn = zoom.sample();
      zoom.apply("D18");
      const afterDuplicate = zoom.sample();
      zoom.apply("D20");
      const afterRetarget = zoom.sample();
      await zoom.advance(460);
      const settled = zoom.sample();
      zoom.reset();
      await zoom.advance(90);
      const duringOut = zoom.sample();
      zoom.apply("D5");
      const afterResume = zoom.sample();
      await zoom.advance(460);
      const resumed = zoom.sample();
      zoom.reset();
      await zoom.advance(410);
      const restored = zoom.sample();
      return { reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
        duringIn, afterDuplicate, afterRetarget, settled, duringOut, afterResume, resumed, restored,
        released: zoom.state.zoomedElement === null,
        stylesRestored: zoom.layers.every((layer) => !layer.style.transition && !layer.style.transform) };
    });
    expect(result.reduced).toBe(reducedMotion === "reduce");
    for (let index = 0; index < 4; index += 1) {
      const entering = result.duringIn[index];
      expect(entering.scale).toBeGreaterThan(1);
      expect(entering.scale).toBeLessThan(2.75);
      expect(entering.duration).toBe("0.42s");
      expect(entering.priority).toBe("important");
      expect(result.afterDuplicate[index].scale).toBeCloseTo(entering.scale, 3);
      expect(result.afterDuplicate[index].property).toBe("transform");
      expect(result.afterRetarget[index].scale).toBeCloseTo(entering.scale, 3);
      expect(result.afterRetarget[index].x).toBeCloseTo(entering.x, 2);
      expect(result.afterRetarget[index].y).toBeCloseTo(entering.y, 2);
      expect(result.settled[index].scale).toBeCloseTo(2.75, 3);
      const leaving = result.duringOut[index];
      expect(leaving.scale).toBeGreaterThan(1);
      expect(leaving.scale).toBeLessThan(2.75);
      expect(leaving.duration).toBe("0.34s");
      expect(leaving.priority).toBe("important");
      expect(result.afterResume[index].scale).toBeCloseTo(leaving.scale, 3);
      expect(result.afterResume[index].x).toBeCloseTo(leaving.x, 2);
      expect(result.afterResume[index].y).toBeCloseTo(leaving.y, 2);
      expect(result.resumed[index].scale).toBeCloseTo(2.75, 3);
      expect(result.restored[index].scale).toBe(1);
      expect(result.restored[index].priority).toBe("");
      expect(entering.scale).toBeCloseTo(result.duringIn[0].scale, 3);
    }
    expect(result.released).toBe(true);
    expect(result.stylesRestored).toBe(true);
  });
}

test("standard zoom keeps its existing priority under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const samples = await page.evaluate(() => {
    window.zoomTest.apply("D18", "standard");
    const samples = window.zoomTest.sample();
    window.zoomTest.reset(true);
    return samples;
  });
  samples.forEach((sample) => {
    expect(sample.priority).toBe("");
    expect(sample.property).toBe("none");
  });
});
