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

test("cricket theme uses the stable cricket-card attribute contract and readability layout", () => {
  const css = buildCricketThemeCss({ showAvg: true });

  assert.equal(PREVIEW_PLACEMENT.mode, "standard");
  assert.doesNotMatch(css, /ad-ext-turn-preview-space/);
  assert.match(css, /--ad-ext-cricket-surface:\s*rgba\(8,\s*16,\s*30,\s*0\.9\)/);
  assert.match(css, /--ad-ext-theme-cricket-player-column-min-width:\s*14\.25rem;/);
  assert.match(css, /--ad-ext-theme-cricket-player-column-max-width:\s*15\.5rem;/);
  assert.match(css, /--ad-ext-theme-cricket-player-column-width:\s*clamp\(/);
  assert.match(css, /--ad-ext-theme-cricket-player-area-required-width:\s*var\(--ad-ext-theme-cricket-left-min-width\);/);

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
    /#ad-ext-player-display\s*\+\s*div,\s*\.ad-ext-theme-content-left\s*>\s*#ad-ext-player-display\s*\+\s*div\s*\{[^}]*grid-template-columns:\s*repeat\(\s*var\(--ad-ext-theme-cricket-player-count\),\s*var\(--ad-ext-theme-cricket-player-column-width\)\s*\)\s*!important;/s
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
    /\.ad-ext-crfx-root\s+\.ad-ext-crfx-label-cell\s*\{[^}]*box-shadow:\s*inset 0 0 0 1px rgba\(110,\s*138,\s*154,\s*0\.26\),\s*inset 0 0 10px rgba\(3,\s*16,\s*24,\s*0\.2\)\s*!important;/s
  );
  assert.match(
    css,
    /\.ad-ext-theme-board-panel\s*\{[^}]*background:\s*transparent\s*!important;[^}]*border:\s*none\s*!important;[^}]*box-shadow:\s*none\s*!important;/s
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
