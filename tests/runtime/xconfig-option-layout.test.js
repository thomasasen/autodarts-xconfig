import test from "node:test";
import assert from "node:assert/strict";
import { resolveSelectOptionLayoutType } from "../../src/features/xconfig-ui/option-layout.js";

test("overlapping option previews retain the previous layout precedence", () => {
  const flags = [
    ["isTypographyFontField", "typography"], ["isDartDesignField", "dart-design"],
    ["hasTurnScoreCounterPreview", "turn-score"], ["hasAvgTrendArrowPreview", "avg-trend"],
    ["hasDartboardMarkerHighlightPreview", "marker"], ["isCheckoutScoreHighlightPreviewSelectField", "checkout-score"],
    ["isCheckoutTargetHighlightsPreviewSelectField", "checkout-targets"],
    ["isX01RemainingScoreBarPreviewSelectField", "remaining-score"], ["isCheckoutSuggestionStyleField", "suggestion"],
  ];
  for (let index = 0; index < flags.length; index++) {
    const state = Object.fromEntries(flags.slice(index).map(([flag]) => [flag, true]));
    assert.equal(resolveSelectOptionLayoutType(state), flags[index][1]);
    assert.equal(resolveSelectOptionLayoutType({ [flags[index][0]]: true }), flags[index][1]);
  }
  assert.equal(resolveSelectOptionLayoutType({}), "default");
});
