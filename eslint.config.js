import js from "@eslint/js";
import globals from "globals";

const generatedOrVendorIgnores = [
  "dist/**",
  "node_modules/**",
  "src/legacy-backups/**",
  "src/vendors/anime.min.cjs",
  "src/vendors/canvas-confetti.browser.js",
  "src/vendors/countUp.min.js",
  "src/vendors/odometer.min.js",
];

const unusedVariableRuleOptions = {
  argsIgnorePattern: "^_",
  caughtErrorsIgnorePattern: "^_",
  ignoreRestSiblings: true,
};

function buildUnusedVariableRule(overrides = {}) {
  return [
    "error",
    {
      ...unusedVariableRuleOptions,
      ...overrides,
    },
  ];
}

const unusedVariableRule = buildUnusedVariableRule();

const tampermonkeyGlobals = {
  GM_getValue: "readonly",
  GM_setValue: "readonly",
};

export default [
  {
    ignores: generatedOrVendorIgnores,
  },
  js.configs.recommended,
  {
    files: ["src/**/*.js", "loader/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...tampermonkeyGlobals,
      },
    },
    rules: {
      "no-unused-vars": unusedVariableRule,
    },
  },
  {
    files: ["tests/**/*.js", "scripts/**/*.mjs", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      "no-unused-vars": unusedVariableRule,
    },
  },
];
