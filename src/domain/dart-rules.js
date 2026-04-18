import * as variantRulesModule from "./variant-rules.js";
import * as x01RulesModule from "./x01-rules.js";
import * as cricketRulesModule from "./cricket-rules.js";

export * as variantRules from "./variant-rules.js";
export * as x01Rules from "./x01-rules.js";
export * as cricketRules from "./cricket-rules.js";

export const dartRules = {
  variantRules: variantRulesModule,
  x01Rules: x01RulesModule,
  cricketRules: cricketRulesModule,
};
