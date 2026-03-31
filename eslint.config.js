import js from "@eslint/js";
import globals from "globals";

const unusedVariableRule = [
  "error",
  {
    argsIgnorePattern: "^_",
    caughtErrorsIgnorePattern: "^_",
    ignoreRestSiblings: true,
  },
];

const tampermonkeyGlobals = {
  GM_getValue: "readonly",
  GM_setValue: "readonly",
};

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "src/vendors/anime.min.cjs",
      "src/vendors/canvas-confetti.browser.js",
      "src/features/cricket-grid-fx/logic.js",
      "src/features/cricket-surface/pipeline.js",
      "src/features/themes/shared/board-layout-resolver.js",
      "src/features/themes/shared/cricket-readability.js",
      "src/domain/cricket-rules.js",
      "src/features/cricket-highlighter/logic.js",
      "src/features/xconfig-ui/index.js",
      "src/features/xconfig-ui/render-controller.js",
      "src/features/xconfig-ui/shell-style.js",
      "src/features/xconfig-ui/shell-view.js",
      "scripts/sync-xconfig-docs.mjs",
      "tests/runtime/bootstrap-runtime.test.js",
      "tests/runtime/cricket-theme-compatibility.test.js",
      "tests/runtime/fake-dom.js",
      "tests/runtime/readme-docs.test.js",
    ],
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
