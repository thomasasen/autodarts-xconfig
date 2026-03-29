import test from "node:test";
import assert from "node:assert/strict";

import {
  PREVIEW_PLACEMENT,
  buildCricketThemeCss,
} from "../../src/features/themes/cricket/style.js";
import {
  CRICKET_ACTIVE_PLAYER_ATTRIBUTE,
  CRICKET_IDENTITY_SHELL_ATTRIBUTE,
  CRICKET_META_ATTRIBUTE,
  CRICKET_META_SHELL_ATTRIBUTE,
  CRICKET_ROW_ATTRIBUTE,
  CRICKET_SLOT_ATTRIBUTE,
  CRICKET_STACK_ATTRIBUTE,
} from "../../src/features/themes/shared/theme-layout-contract.js";
import { buildStyleText as buildCricketHighlighterStyleText } from "../../src/features/cricket-highlighter/style.js";
import { buildStyleText as buildCricketGridFxStyleText } from "../../src/features/cricket-grid-fx/style.js";

function attrSelector(attributeName, value = "true") {
  return `[${attributeName}="${value}"]`;
}

function extractRuleSlice(css, selector, length = 700) {
  const start = css.indexOf(selector);
  assert.notEqual(start, -1, `Expected CSS selector not found: ${selector}`);
  return css.slice(start, start + length);
}

test("cricket theme uses the stable cricket-card attribute contract and readability layout", () => {
  const css = buildCricketThemeCss({ showAvg: true });

  assert.equal(PREVIEW_PLACEMENT.mode, "standard");
  assert.doesNotMatch(css, /ad-ext-turn-preview-space/);
  assert.match(css, /--ad-ext-cricket-surface:\s*rgba\(8,\s*16,\s*30,\s*0\.9\)/);
  assert.match(css, /--ad-ext-theme-cricket-player-column-min-width:\s*14\.25rem;/);
  assert.match(css, /--ad-ext-theme-cricket-player-column-max-width:\s*15\.5rem;/);
  assert.match(css, /--ad-ext-theme-cricket-player-column-width:\s*clamp\(/);
  assert.match(css, /--ad-ext-theme-cricket-player-area-required-width:\s*var\(--ad-ext-theme-cricket-left-min-width\);/);
  assert.match(
    css,
    /--ad-ext-theme-cricket-name-size-active:\s*clamp\(\s*1\.08rem,\s*1\.19vw,\s*1\.28rem\s*\);/
  );
  assert.match(
    css,
    /--ad-ext-theme-cricket-name-size-inactive:\s*clamp\(\s*0\.86rem,\s*0\.92vw,\s*0\.99rem\s*\);/
  );
  assert.match(css, /--ad-ext-theme-cricket-score-size-active:\s*clamp\(/);
  assert.match(css, /--ad-ext-theme-cricket-score-size-inactive:\s*clamp\(/);
  assert.match(css, /--ad-ext-theme-cricket-score-end-inset:\s*0\.38rem;/);
  assert.match(
    css,
    /--ad-ext-theme-cricket-wins-font-size:\s*clamp\(\s*1\.86rem,\s*2\.16vw,\s*2\.28rem\s*\);/
  );
  assert.match(css, /--ad-ext-theme-cricket-wins-min-height:\s*3\.15rem;/);
  assert.match(css, /--ad-ext-theme-cricket-wins-padding-inline:\s*0\.9rem;/);
  assert.match(css, /--ad-ext-theme-cricket-player-grid-gap:\s*0\.35rem;/);

  assert.ok(
    css.includes(
      `#ad-ext-player-display .ad-ext-player > ${attrSelector(CRICKET_STACK_ATTRIBUTE)} {`
    )
  );
  assert.ok(
    css.includes(
      `#ad-ext-player-display .ad-ext-player > ${attrSelector(CRICKET_STACK_ATTRIBUTE)} > ${attrSelector(CRICKET_ROW_ATTRIBUTE)} {`
    )
  );
  assert.ok(
    css.includes(
      `#ad-ext-player-display .ad-ext-player > ${attrSelector(CRICKET_STACK_ATTRIBUTE)} > ${attrSelector(CRICKET_ROW_ATTRIBUTE)} > ${attrSelector(CRICKET_SLOT_ATTRIBUTE, "marks")} {`
    )
  );
  assert.ok(
    css.includes(
      `#ad-ext-player-display .ad-ext-player > ${attrSelector(CRICKET_STACK_ATTRIBUTE)} > ${attrSelector(CRICKET_ROW_ATTRIBUTE)} > ${attrSelector(CRICKET_SLOT_ATTRIBUTE, "identity")} {`
    )
  );
  assert.ok(
    css.includes(
      `#ad-ext-player-display .ad-ext-player > ${attrSelector(CRICKET_STACK_ATTRIBUTE)} > ${attrSelector(CRICKET_SLOT_ATTRIBUTE, "stats")} {`
    )
  );
  assert.ok(
    css.includes(
      `#ad-ext-player-display .ad-ext-player > ${attrSelector(CRICKET_STACK_ATTRIBUTE)} > ${attrSelector(CRICKET_SLOT_ATTRIBUTE, "decorative")} {`
    )
  );
  assert.ok(css.includes(attrSelector(CRICKET_IDENTITY_SHELL_ATTRIBUTE)));
  assert.ok(css.includes(attrSelector(CRICKET_META_SHELL_ATTRIBUTE)));
  assert.ok(css.includes(attrSelector(CRICKET_META_ATTRIBUTE, "avatar")));
  assert.ok(css.includes(attrSelector(CRICKET_META_ATTRIBUTE, "name")));
  assert.ok(css.includes(attrSelector(CRICKET_META_ATTRIBUTE, "wins")));
  assert.doesNotMatch(css, /\.chakra-stack\.css-y3hfdd/);
  assert.doesNotMatch(css, /\.chakra-stack\.css-37hv00\s*>\s*\.css-aa7b80/);

  assert.match(
    css,
    /\.ad-ext-theme-content-slot\.ad-ext-theme-cricket-readability-constrained:not\(\.ad-ext-theme-cricket-board-hidden\)\s*\{[^}]*grid-template-columns:\s*minmax\(var\(--ad-ext-theme-cricket-player-area-required-width\),\s*max-content\)\s*minmax\(0,\s*var\(--ad-ext-theme-cricket-board-width,\s*var\(--ad-ext-theme-cricket-board-min-width-auto\)\)\)\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-content-slot\.ad-ext-theme-cricket-board-forced-visible\s*\{[^}]*grid-template-columns:\s*minmax\(var\(--ad-ext-theme-cricket-player-area-required-width\),\s*max-content\)\s*minmax\(0,\s*var\(--ad-ext-theme-cricket-board-width,\s*var\(--ad-ext-theme-cricket-board-min-width-manual\)\)\)\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-content-slot\.ad-ext-theme-cricket-board-hidden\s*\{[^}]*grid-template-columns:\s*minmax\(var\(--ad-ext-theme-cricket-player-area-required-width\),\s*max-content\)\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-content-slot\s*>\s*\.ad-ext-theme-content-left\s*\{[^}]*display:\s*flex\s*!important;[^}]*flex-direction:\s*column\s*!important;[^}]*gap:\s*var\(--ad-ext-theme-cricket-player-grid-gap\)\s*!important;[^}]*height:\s*100%\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-content-left\s*>\s*#ad-ext-player-display\s*\{[^}]*grid-area:\s*auto\s*!important;[^}]*grid-row:\s*auto\s*!important;[^}]*grid-column:\s*auto\s*!important;[^}]*flex:\s*0\s+0\s+auto\s*!important;[^}]*max-height:\s*none\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s*\+\s*div,\s*\.ad-ext-theme-content-left\s*>\s*#ad-ext-player-display\s*\+\s*div\s*\{[^}]*grid-template-columns:\s*repeat\(\s*var\(--ad-ext-theme-cricket-player-count\),\s*var\(--ad-ext-theme-cricket-player-column-width\)\s*\)\s*!important;[^}]*grid-auto-rows:\s*minmax\(0,\s*1fr\)\s*!important;[^}]*margin-top:\s*0\s*!important;[^}]*flex:\s*1\s+1\s+auto\s*!important;[^}]*height:\s*auto\s*!important;[^}]*align-content:\s*stretch\s*!important;/s
  );
  assert.doesNotMatch(
    css,
    /\.ad-ext-theme-content-slot\s*>\s*\.ad-ext-theme-content-left\s*\{[^}]*display:\s*grid\s*!important;/s
  );
});

test("cricket theme keeps row labels fully visible inside viewport", () => {
  const css = buildCricketThemeCss({ showAvg: true });

  assert.match(css, /p\.chakra-text\.css-1qlemha\s*\{[^}]*left:\s*0\s*!important;/s);
  assert.doesNotMatch(css, /left:\s*calc\(var\(--chakra-space-2\)\s*\*\s*-5\)/);
});

test("cricket theme keeps score and active-card hierarchy on stable selectors", () => {
  const css = buildCricketThemeCss({ showAvg: true });

  assert.ok(
    css.includes(
      `#ad-ext-player-display .ad-ext-player > ${attrSelector(CRICKET_STACK_ATTRIBUTE)} > .ad-ext-player-score {`
    )
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\s*\{[^}]*inline-size:\s*max-content\s*!important;[^}]*max-inline-size:\s*none\s*!important;[^}]*overflow:\s*visible\s*!important;[^}]*text-overflow:\s*initial\s*!important;/s
  );
  assert.ok(
    css.includes(
      `#ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="true"] > ${attrSelector(CRICKET_STACK_ATTRIBUTE)} {`
    )
  );
  assert.ok(
    css.includes(
      `#ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="false"] > ${attrSelector(CRICKET_STACK_ATTRIBUTE)} {`
    )
  );
  assert.ok(
    css.includes(
      `#ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="true"] .ad-ext-player-score {`
    )
  );
  assert.ok(
    css.includes(
      `#ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="false"] .ad-ext-player-score {`
    )
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*>\s*\[data-ad-ext-cricket-stack="true"\]::before\s*\{[^}]*linear-gradient\(135deg,\s*rgba\(255,\s*255,\s*255,\s*0\.06\),\s*rgba\(255,\s*255,\s*255,\s*0\)\s*32%\)/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s*\{[^}]*--ad-ext-theme-cricket-name-size:\s*var\(--ad-ext-theme-cricket-name-size-inactive\);[^}]*--ad-ext-theme-cricket-score-size:\s*var\(--ad-ext-theme-cricket-score-size-inactive\);/s
  );
  assert.ok(
    css.includes(
      `#ad-ext-player-display .ad-ext-player[${CRICKET_ACTIVE_PLAYER_ATTRIBUTE}="true"]{`
    )
  );
  assert.ok(css.includes(`--ad-ext-theme-cricket-name-size: var(--ad-ext-theme-cricket-name-size-active);`));
  assert.ok(css.includes(`--ad-ext-theme-cricket-score-size: var(--ad-ext-theme-cricket-score-size-active);`));
  assert.ok(css.includes(`--ad-ext-theme-cricket-wins-scale: 1;`));
  assert.doesNotMatch(css, /--ad-ext-theme-cricket-wins-scale:\s*0\.92;/);
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name\s*\{[^}]*display:\s*block\s*!important;[^}]*font-size:\s*var\(--ad-ext-theme-cricket-name-size\)\s*!important;[^}]*width:\s*100%\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-name\s*>\s*p\s*\{[^}]*font-size:\s*var\(--ad-ext-theme-cricket-name-size\)\s*!important;[^}]*line-height:\s*1\.08\s*!important;[^}]*white-space:\s*nowrap\s*!important;[^}]*overflow:\s*hidden\s*!important;/s
  );
  assert.match(
    css,
    /#ad-ext-player-display\s+\.ad-ext-player\s+\.ad-ext-player-score\s*\{[^}]*color:\s*var\(--ad-ext-theme-cricket-score-color\)\s*!important;[^}]*font-size:\s*var\(--ad-ext-theme-cricket-score-size\)\s*!important;[^}]*margin-inline-end:\s*var\(--ad-ext-theme-cricket-score-end-inset\)\s*!important;/s
  );
  const winsRule = extractRuleSlice(
    css,
    `#ad-ext-player-display .ad-ext-player > ${attrSelector(CRICKET_STACK_ATTRIBUTE)} > ${attrSelector(CRICKET_ROW_ATTRIBUTE)} > ${attrSelector(CRICKET_SLOT_ATTRIBUTE, "identity")} ${attrSelector(CRICKET_META_ATTRIBUTE, "wins")} {`
  );
  assert.match(winsRule, /min-height:\s*var\(--ad-ext-theme-cricket-wins-min-height\)\s*!important;/);
  assert.match(winsRule, /padding-inline:\s*var\(--ad-ext-theme-cricket-wins-padding-inline\)\s*!important;/);
  assert.match(winsRule, /font-size:\s*var\(--ad-ext-theme-cricket-wins-font-size\)\s*!important;/);
  assert.match(
    css,
    /\.ad-ext-crfx-root\s+\.ad-ext-crfx-label-cell\s*\{[^}]*box-shadow:\s*inset 0 0 0 1px rgba\(110,\s*138,\s*154,\s*0\.26\),\s*inset 0 0 10px rgba\(3,\s*16,\s*24,\s*0\.2\)\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-panel\s*\{[^}]*background:[^}]*linear-gradient\(180deg,\s*rgba\(9,\s*16,\s*28,\s*0\.9\),\s*rgba\(4,\s*12,\s*20,\s*0\.84\)\)[^}]*border:\s*1px solid rgba\(56,\s*74,\s*102,\s*0\.58\)\s*!important;[^}]*box-shadow:[^}]*0 8px 24px rgba\(0,\s*0,\s*0,\s*0\.24\)\s*!important;[^}]*overflow:\s*hidden\s*!important;/s
  );
  assert.ok(
    css.includes(
      `#ad-ext-player-display .ad-ext-player > ${attrSelector(CRICKET_STACK_ATTRIBUTE)} > ${attrSelector(CRICKET_ROW_ATTRIBUTE)} > ${attrSelector(CRICKET_SLOT_ATTRIBUTE, "identity")} ${attrSelector(CRICKET_META_SHELL_ATTRIBUTE)} {`
    )
  );
  assert.ok(
    css.includes(
      `#ad-ext-player-display .ad-ext-player > ${attrSelector(CRICKET_STACK_ATTRIBUTE)} > ${attrSelector(CRICKET_ROW_ATTRIBUTE)} > ${attrSelector(CRICKET_SLOT_ATTRIBUTE, "identity")} > ${attrSelector(CRICKET_IDENTITY_SHELL_ATTRIBUTE)} {`
    )
  );
  assert.match(
    css,
    /grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto\s*!important;/s
  );
  assert.match(css, /grid-column:\s*1\s*\/\s*-1\s*!important;/s);
});

test("cricket theme removes event-shell padding so the board fills its slot", () => {
  const css = buildCricketThemeCss({ showAvg: true });

  assert.match(
    css,
    /\.ad-ext-theme-board-event-shell\s*\{[^}]*padding:\s*0\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-event-shell\s*>\s*\.ad-ext-theme-board-canvas,\s*\.ad-ext-theme-board-event-shell\s*>\s*\.ad-ext-theme-board-media-root,\s*\.ad-ext-theme-board-panel\.ad-ext-theme-board-image-backed\s+\.ad-ext-theme-board-media-root\s*\{[^}]*width:\s*100%\s*!important;[^}]*height:\s*100%\s*!important;/s
  );
});

test("cricket highlighter style exposes full presentation contract", () => {
  const css = buildCricketHighlighterStyleText();

  assert.match(css, /\.ad-ext-cricket-target\s*\{[^}]*fill:\s*var\(--ad-ext-cricket-fill,\s*transparent\);/s);
  assert.match(css, /\.ad-ext-cricket-target\.is-open\s*\{[^}]*--ad-ext-cricket-fill:\s*var\(--ad-ext-cricket-open-fill\);/s);
  assert.match(css, /\.ad-ext-cricket-target\.is-dead\s*\{[^}]*--ad-ext-cricket-fill:\s*var\(--ad-ext-cricket-dead-fill\);/s);
  assert.match(css, /\.ad-ext-cricket-target\.is-inactive\s*\{[^}]*--ad-ext-cricket-fill:\s*var\(--ad-ext-cricket-inactive-fill\);/s);
  assert.match(css, /\.ad-ext-cricket-target\.is-scoring\s*\{[^}]*--ad-ext-cricket-fill:\s*var\(--ad-ext-cricket-scoring-fill\);/s);
  assert.match(css, /\.ad-ext-cricket-target\.is-pressure\s*\{[^}]*--ad-ext-cricket-fill:\s*var\(--ad-ext-cricket-pressure-fill\);/s);
  assert.doesNotMatch(css, /ad-ext-cricket-target-pulse/);
});

test("cricket grid fx style exposes badge and state hierarchy", () => {
  const css = buildCricketGridFxStyleText();

  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-label-cell,\s*\.ad-ext-crfx-root\s+\.ad-ext-crfx-badge\s*\{/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-badge\s*\{[^}]*position:\s*absolute\s*!important;[^}]*left:\s*8px\s*!important;/s);
  assert.match(css, /\[data-ad-ext-crfx-label-hidden="true"\]\s*\{[^}]*color:\s*transparent\s*!important;/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-badge\.ad-ext-crfx-badge-burst\s*\{[^}]*animation:\s*ad-ext-crfx-badge-burst 700ms ease;/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-score\s*\{[^}]*repeating-linear-gradient\(/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-pressure\s*\{[^}]*repeating-linear-gradient\(/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-open\s*\{[^}]*linear-gradient\(/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-open-inactive\s*\{[^}]*linear-gradient\(/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-active-column\s*\{[^}]*linear-gradient\(/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-open-active\s*\{[^}]*linear-gradient\(/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-mark-progress\s*\{[^}]*animation:\s*ad-ext-crfx-mark 420ms cubic-bezier\(0\.2,\s*0\.8,\s*0\.2,\s*1\);/s);
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-delta\s*\{[^}]*font-size:\s*2\.22rem;/s);
  assert.doesNotMatch(css, /ad-ext-crfx-cell-active/);
  assert.doesNotMatch(css, /ad-ext-crfx-cell-inactive/);
});

test("cricket grid fx player-cell states override theme row backgrounds", () => {
  const css = buildCricketGridFxStyleText();

  assert.match(
    css,
    /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-score\s*\{[^}]*repeating-linear-gradient\(/s
  );
  assert.match(
    css,
    /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-pressure\s*\{[^}]*repeating-linear-gradient\(/s
  );
  assert.match(css, /\.ad-ext-crfx-root\s+\.ad-ext-crfx-cell\.ad-ext-crfx-open-active\s*\{[^}]*box-shadow:/s);
});
