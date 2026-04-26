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

function escapeRegExp(value) {
  return String(value).replaceAll(/[\\^$.*+?()[\]{}|]/g, String.raw`\$&`);
}

function buildExactNamePattern(names, { allowUnderscorePrefix = false } = {}) {
  const normalizedNames = Array.isArray(names) ? names.filter(Boolean) : [];
  const parts = normalizedNames.map((name) => escapeRegExp(name));

  if (allowUnderscorePrefix) {
    parts.unshift("_.*");
  }

  return `^(?:${parts.join("|")})$`;
}

const unusedVariableRule = buildUnusedVariableRule();

// These files still carry known WIP/legacy unused symbols. Keep the allowlist exact so
// newly introduced unused bindings in the same files are reported again.
const legacyUnusedVarAllowances = [
  {
    files: ["src/features/cricket-grid-fx/logic.js"],
    varsIgnorePattern: buildExactNamePattern([
      "sharedCollectTargetLabelsInNode",
      "TURN_PREVIEW_ROOT_SELECTOR",
      "resolveGridRoot",
      "filterAtomicRows",
      "collectTargetLabelsInNode",
    ]),
  },
  {
    files: ["src/features/cricket-surface/pipeline.js"],
    varsIgnorePattern: buildExactNamePattern([
      "collectTargetLabelsInNodeLayout",
      "resolveBadgeNodeLayout",
      "resolveLabelCellLayout",
      "BASE_CRICKET_OBJECTIVE_COUNT",
      "TURN_PREVIEW_ROOT_SELECTOR",
      "filterAtomicLabelNodes",
      "hasAnyTargetDescendant",
      "isLikelyStructuralPlayerCell",
      "collectTargetLabelsInNode",
      "readActiveThrowMarksByLabel",
      "readTurnMarksByLabel",
    ]),
    argsIgnorePattern: buildExactNamePattern(["options"], { allowUnderscorePrefix: true }),
  },
  {
    files: ["src/features/themes/shared/board-layout-resolver.js"],
    varsIgnorePattern: buildExactNamePattern([
      "createRafScheduler",
      "PREVIEW_SPACE_CLASS",
      "isPreviewPlacementEnabled",
      "isThemeVariantActive",
      "togglePreviewSpace",
      "createManagedNodeMatcher",
      "hasExternalDomMutation",
      "BOARD_INPUT_MODE_ATTRIBUTE_FILTER",
      "CRICKET_BOARD_WIDTH_CSS_VARIABLE",
      "CRICKET_PLAYER_AREA_REQUIRED_WIDTH_CSS_VARIABLE",
      "CRICKET_PLAYER_COUNT_CSS_VARIABLE",
      "CRICKET_THEME_FEATURE_KEY",
      "CRICKET_READABILITY_POLICY",
      "createCricketReadabilityState",
      "shouldKeepImageBackedLayoutHooks",
      "clearStyleVariable",
      "updateStyleVariable",
      "toggleClass",
      "areLayoutHookTargetsConnected",
    ]),
  },
  {
    files: ["src/features/themes/shared/cricket-readability.js"],
    varsIgnorePattern: buildExactNamePattern([
      "createRafScheduler",
      "PREVIEW_SPACE_CLASS",
      "isPreviewPlacementEnabled",
      "isThemeVariantActive",
      "togglePreviewSpace",
      "createManagedNodeMatcher",
      "hasExternalDomMutation",
      "BOARD_INPUT_MODE_ATTRIBUTE_FILTER",
      "CRICKET_THEME_FEATURE_KEY",
      "hasBoardInputModeMutation",
      "updateBoardLayoutHooks",
    ]),
  },
  {
    files: ["src/features/xconfig-ui/index.js"],
    varsIgnorePattern: buildExactNamePattern([
      "resolveDartDesignAsset",
      "resolveXConfigPreviewAsset",
      "buildThemeBackgroundStatus",
      "README_URL",
      "CHANGELOG_URL",
      "DART_MARKER_DARTS_FEATURE_KEY",
      "DART_MARKER_DARTS_DESIGN_SETTING_KEY",
      "descriptorOrder",
      "animationGroupOrder",
      "animationFeatureOrder",
      "observeRoot",
      "patchHistory",
      "navigateBack",
    ]),
  },
  {
    files: ["src/features/xconfig-ui/shell-view.js"],
    varsIgnorePattern: buildExactNamePattern([
      "openUserscriptInstall",
      "readStoredUpdateStatus",
      "createManagedNodeMatcher",
      "hasExternalDomMutation",
      "currentRoute",
      "getContentElement",
      "getSidebarElement",
      "isConfigHash",
      "isLegacyConfigPath",
      "isNavigationElement",
      "normalizeRoutePath",
      "removeNodeById",
      "toRoutePathname",
      "buildFeatureSettingPatch",
      "themeKeyFromConfigKey",
      "cancelWindowSync",
      "queueWindowSync",
      "buildShellRenderSignature",
      "parseShellRenderSignature",
      "createShellRenderController",
      "createShellRouteController",
      "applyThemeBackgroundStatusNode",
      "clearThemeBackgroundImage",
      "uploadThemeBackgroundImage",
      "createShellActionController",
      "createUpdateStatusController",
      "createShellLifecycleController",
      "CONFIG_PATH",
      "CONFIG_HASH",
      "MENU_LABEL_COLLAPSE_WIDTH",
      "STYLE_ID",
      "ROOT_OBSERVER_KEY",
      "NOTICE_TIMEOUT_MS",
      "UPDATE_AUTO_CHECK_INTERVAL_MS",
      "LISTENER_KEYS",
      "SIDEBAR_ROUTE_HINTS",
      "shellByWindow",
      "styleText",
    ]),
  },
];

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
  ...legacyUnusedVarAllowances.map(
    ({ files, varsIgnorePattern, argsIgnorePattern }) => ({
      files,
      rules: {
        "no-unused-vars": buildUnusedVariableRule({
          varsIgnorePattern,
          ...(argsIgnorePattern ? { argsIgnorePattern } : {}),
        }),
      },
    })
  ),
];
