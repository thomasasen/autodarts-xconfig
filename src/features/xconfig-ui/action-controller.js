import {
  createThemeGlobalTemplatePresetPatch,
  getThemeGlobalTemplatePreset,
} from "../../shared/theme-global-template-presets.js";

export function createShellActionController(options = {}) {
  const windowRef = options.windowRef || null;
  const documentRef = options.documentRef || null;
  const state = options.state || null;
  const runtimeApi = options.runtimeApi || null;
  const setNotice = typeof options.setNotice === "function" ? options.setNotice : () => {};
  const queueSync = typeof options.queueSync === "function" ? options.queueSync : () => {};
  const refreshUpdateStatus =
    typeof options.refreshUpdateStatus === "function"
      ? options.refreshUpdateStatus
      : () => Promise.resolve();
  const navigateToConfigRoute =
    typeof options.navigateToConfigRoute === "function"
      ? options.navigateToConfigRoute
      : () => {};
  const navigateBack =
    typeof options.navigateBack === "function" ? options.navigateBack : () => {};
  const openReadme = typeof options.openReadme === "function" ? options.openReadme : () => {};
  const openChangelog =
    typeof options.openChangelog === "function" ? options.openChangelog : () => {};
  const openUserscriptInstall =
    typeof options.openUserscriptInstall === "function"
      ? options.openUserscriptInstall
      : () => false;
  const getXConfigDescriptor =
    typeof options.getXConfigDescriptor === "function"
      ? options.getXConfigDescriptor
      : () => null;
  const buildFeatureSettingPatch =
    typeof options.buildFeatureSettingPatch === "function"
      ? options.buildFeatureSettingPatch
      : () => ({ features: {} });
  const parseFieldValue =
    typeof options.parseFieldValue === "function" ? options.parseFieldValue : (_field, value) => value;
  const syncSelectOptionButtons =
    typeof options.syncSelectOptionButtons === "function"
      ? options.syncSelectOptionButtons
      : () => {};
  const syncColorFieldControl =
    typeof options.syncColorFieldControl === "function"
      ? options.syncColorFieldControl
      : () => {};
  const themeKeyFromConfigKey =
    typeof options.themeKeyFromConfigKey === "function" ? options.themeKeyFromConfigKey : () => "";
  const clearThemeBackgroundImage =
    typeof options.clearThemeBackgroundImage === "function"
      ? options.clearThemeBackgroundImage
      : () => {};
  const uploadThemeBackgroundImage =
    typeof options.uploadThemeBackgroundImage === "function"
      ? options.uploadThemeBackgroundImage
      : () => {};
  const syncThemeBackgroundIndicators =
    typeof options.syncThemeBackgroundIndicators === "function"
      ? options.syncThemeBackgroundIndicators
      : () => {};
  const setThemeActionFeedback =
    typeof options.setThemeActionFeedback === "function"
      ? options.setThemeActionFeedback
      : () => {};

  function withRuntimeCall(promiseLike, successMessage, errorMessage, successType = "success") {
    Promise.resolve(promiseLike)
      .then(() => {
        if (successMessage) {
          setNotice(successType, successMessage);
        }
      })
      .catch(() => {
        if (errorMessage) {
          setNotice("error", errorMessage);
        }
      })
      .finally(() => queueSync());
  }

  function confirmAction(message) {
    if (typeof windowRef?.confirm === "function") {
      return windowRef.confirm(message);
    }
    return true;
  }

  function setActiveSettingsFeature(feature) {
    if (state && feature) {
      state.activeSettingsFeatureKey = feature.featureKey;
    }
    queueSync();
  }

  function clearActiveSettingsFeature() {
    if (state) {
      state.activeSettingsFeatureKey = "";
    }
    queueSync();
  }

  function handleInstallUpdate() {
    const opened = openUserscriptInstall(windowRef);
    setNotice(
      opened ? "info" : "error",
      opened
        ? "Installations-Tab geöffnet. Bestätige das Update in Tampermonkey."
        : "Installations-Tab konnte nicht geöffnet werden."
    );
  }

  function handleResetConfig() {
    if (!runtimeApi || typeof runtimeApi.resetConfig !== "function") {
      return;
    }

    const confirmed = confirmAction(
      "Bist du sicher? Der Hard Reset setzt alles auf Standard zurück, deaktiviert alle Module und löscht alle gespeicherten Theme-Bilder."
    );
    if (!confirmed) {
      return;
    }

    withRuntimeCall(
      runtimeApi.resetConfig(),
      "Hard Reset ausgeführt.",
      "Hard Reset fehlgeschlagen.",
      "info"
    );
  }

  function handleApplyRecommendedDefaults() {
    if (!runtimeApi || typeof runtimeApi.applyRecommendedDefaults !== "function") {
      return;
    }

    const confirmed = confirmAction(
      "Bist du sicher? Die empfohlenen Standards aktivieren alle Module und setzen die Konfiguration neu. Deine eigenen Theme-Bilder bleiben erhalten."
    );
    if (!confirmed) {
      return;
    }

    withRuntimeCall(
      runtimeApi.applyRecommendedDefaults(),
      "Empfohlene Standards angewendet.",
      "Empfohlene Standards konnten nicht angewendet werden.",
      "info"
    );
  }

  function handleSetFeature(actionNode, feature) {
    if (!feature || !runtimeApi || typeof runtimeApi.setFeatureEnabled !== "function") {
      return;
    }

    const enabled = String(actionNode?.getAttribute?.("data-feature-enabled")) === "true";
    withRuntimeCall(
      runtimeApi.setFeatureEnabled(feature.featureKey, enabled),
      `${feature.title}: ${enabled ? "An" : "Aus"}`,
      `${feature.title}: Status konnte nicht gespeichert werden.`
    );
  }

  function updateToggleButtons(actionNode, settingKey) {
    const toggleButtons = Array.from(
      actionNode?.parentElement?.querySelectorAll?.(
        `[data-adxconfig-action='set-setting-toggle'][data-setting-key='${settingKey}']`
      ) || []
    );
    toggleButtons.forEach((buttonNode) => {
      buttonNode.dataset.active = buttonNode === actionNode ? "true" : "false";
    });
  }

  function handleSetSettingToggle(actionNode, feature) {
    if (!feature || !runtimeApi || typeof runtimeApi.saveConfig !== "function") {
      return;
    }

    const configKey = actionNode?.getAttribute?.("data-config-key") || feature.configKey;
    const settingKey = actionNode?.getAttribute?.("data-setting-key");
    const settingValue = String(actionNode?.getAttribute?.("data-setting-value")) === "true";
    if (!configKey || !settingKey) {
      return;
    }

    updateToggleButtons(actionNode, settingKey);
    const hiddenInput = actionNode?.parentElement?.querySelector?.(
      `input[data-adxconfig-setting='true'][data-setting-key='${settingKey}']`
    );
    if (hiddenInput) {
      hiddenInput.checked = settingValue;
    }

    withRuntimeCall(
      runtimeApi.saveConfig(buildFeatureSettingPatch(configKey, settingKey, settingValue)),
      "Einstellung gespeichert.",
      "Einstellung konnte nicht gespeichert werden."
    );
  }

  function handleSetSettingSelectOption(actionNode, feature) {
    if (!feature || !runtimeApi || typeof runtimeApi.saveConfig !== "function") {
      return;
    }

    const configKey = actionNode?.getAttribute?.("data-config-key") || feature.configKey;
    const settingKey = String(actionNode?.getAttribute?.("data-setting-key") || "").trim();
    const settingRawValue = String(actionNode?.getAttribute?.("data-setting-value") ?? "");
    if (!configKey || !settingKey) {
      return;
    }

    const descriptor = getXConfigDescriptor(feature.featureKey);
    const field =
      descriptor?.fields?.find(
        (entry) => entry.control === "select" && entry.key === settingKey
      ) || null;
    if (!field) {
      return;
    }

    const optionValues = Array.isArray(field.options)
      ? field.options.map((option) => String(option?.value ?? ""))
      : [];
    const inputWrap =
      actionNode?.closest?.(".ad-xconfig-setting-input") ||
      actionNode?.parentElement ||
      null;
    const currentValues = field.multiple === true
      ? Array.from(
          new Set(
            (
              Array.from(
                inputWrap?.querySelectorAll?.(
                  `[data-adxconfig-action='set-setting-select-option'][data-setting-key='${settingKey}'][data-active='true']`
                ) || []
              ).map((node) => String(node?.getAttribute?.("data-setting-value") ?? "")) ||
              []
            )
              .concat(
                (Array.isArray(feature?.config?.[settingKey])
                  ? feature.config[settingKey]
                  : [feature?.config?.[settingKey]])
                  .map((value) => String(value ?? ""))
              )
              .filter((value) => optionValues.includes(value))
          )
        )
      : [];
    const nextSelection = field.multiple === true
      ? (() => {
        const nextValues = currentValues.includes(settingRawValue)
          ? currentValues.filter((value) => value !== settingRawValue)
          : [...currentValues, settingRawValue];
        return nextValues.length ? nextValues : [optionValues[0] || ""];
      })()
      : [settingRawValue];
    const nextValue = field.multiple === true
      ? nextSelection.map((value) => parseFieldValue(field, value, false))
      : parseFieldValue(field, nextSelection[0] || "", false);
    syncSelectOptionButtons(
      documentRef,
      actionNode,
      field.multiple === true ? nextSelection : nextSelection[0] || ""
    );
    withRuntimeCall(
      runtimeApi.saveConfig(buildFeatureSettingPatch(configKey, settingKey, nextValue)),
      "Einstellung gespeichert.",
      "Einstellung konnte nicht gespeichert werden."
    );
  }

  function handleClearSettingColor(actionNode, feature) {
    if (!feature || !runtimeApi || typeof runtimeApi.saveConfig !== "function") {
      return;
    }

    const configKey = actionNode?.getAttribute?.("data-config-key") || feature.configKey;
    const settingKey = String(actionNode?.getAttribute?.("data-setting-key") || "").trim();
    if (!configKey || !settingKey) {
      return;
    }

    const fieldNode =
      actionNode?.closest?.("[data-adxconfig-color-field='true']") ||
      actionNode?.parentElement?.closest?.("[data-adxconfig-color-field='true']") ||
      null;
    syncColorFieldControl(fieldNode, {
      value: "",
    });
    withRuntimeCall(
      runtimeApi.saveConfig(buildFeatureSettingPatch(configKey, settingKey, "")),
      "Theme-Default wieder aktiv.",
      "Einstellung konnte nicht gespeichert werden."
    );
  }

  function handleRunFeatureAction(actionNode, feature) {
    if (!feature || !runtimeApi || typeof runtimeApi.runFeatureAction !== "function") {
      return;
    }

    const descriptor = getXConfigDescriptor(feature.featureKey);
    const actionId = String(actionNode?.getAttribute?.("data-feature-action-id") || "").trim();
    const actionField =
      descriptor?.fields?.find(
        (field) =>
          field.control === "action" &&
          field.action === "run-feature-action" &&
          String(field.actionId || "").trim() === actionId
      ) || null;

    withRuntimeCall(
      runtimeApi.runFeatureAction(feature.featureKey, actionId),
      actionField?.successMessage || "Aktion ausgeführt.",
      actionField?.errorMessage || "Aktion konnte nicht ausgeführt werden.",
      "info"
    );
  }

  function handleApplyThemeGlobalPreset(actionNode, feature) {
    if (!feature || !runtimeApi || typeof runtimeApi.saveConfig !== "function") {
      return;
    }

    const presetKey = String(actionNode?.getAttribute?.("data-feature-action-id") || "").trim();
    const preset = getThemeGlobalTemplatePreset(presetKey);
    const patch = createThemeGlobalTemplatePresetPatch(presetKey);
    if (!preset || !patch) {
      return;
    }

    const confirmed = confirmAction(
      `Preset "${preset.label}" anwenden? Dadurch werden alle Einstellungen in Templates Global inklusive globalem Wallpaper überschrieben.`
    );
    if (!confirmed) {
      return;
    }

    withRuntimeCall(
      Promise.resolve(runtimeApi.saveConfig(patch)).then(() => {
        syncThemeBackgroundIndicators(feature.featureKey);
      }),
      `Preset "${preset.label}" angewendet.`,
      `Preset "${preset.label}" konnte nicht angewendet werden.`
    );
  }

  function handleClearThemeBackground(feature) {
    const themeKey = themeKeyFromConfigKey(feature.configKey);
    if (!themeKey || typeof runtimeApi?.clearThemeBackgroundImage !== "function") {
      return;
    }

    clearThemeBackgroundImage({
      feature,
      themeKey,
      runtimeApi,
      setNotice,
      setThemeActionFeedback,
      syncThemeBackgroundIndicators,
      queueSync,
    });
  }

  function handleUploadThemeBackground(feature) {
    const themeKey = themeKeyFromConfigKey(feature.configKey);
    if (!themeKey) {
      return;
    }

    uploadThemeBackgroundImage({
      feature,
      themeKey,
      documentRef,
      windowRef,
      runtimeApi,
      setNotice,
      setThemeActionFeedback,
      syncThemeBackgroundIndicators,
      queueSync,
    });
  }

  const commandHandlers = new Map([
    ["open", () => navigateToConfigRoute()],
    ["close", () => navigateBack()],
    ["open-settings", (_actionNode, feature) => {
      if (!feature) {
        return;
      }
      setActiveSettingsFeature(feature);
    }],
    ["close-settings", () => clearActiveSettingsFeature()],
    ["close-settings-backdrop", () => clearActiveSettingsFeature()],
    ["open-readme", (_actionNode, feature) => {
      openReadme(windowRef, feature?.featureKey || "");
    }],
    ["open-changelog", () => openChangelog(windowRef)],
    ["check-update", () => {
      refreshUpdateStatus({
        force: true,
        announce: true,
      });
    }],
    ["install-update", () => handleInstallUpdate()],
    ["reset", () => handleResetConfig()],
    ["apply-recommended-defaults", () => handleApplyRecommendedDefaults()],
    ["set-feature", (actionNode, feature) => handleSetFeature(actionNode, feature)],
    ["set-setting-toggle", (actionNode, feature) => handleSetSettingToggle(actionNode, feature)],
    ["set-setting-select-option", (actionNode, feature) =>
      handleSetSettingSelectOption(actionNode, feature)],
    ["clear-setting-color", (actionNode, feature) => handleClearSettingColor(actionNode, feature)],
    ["run-feature-action", (actionNode, feature) => handleRunFeatureAction(actionNode, feature)],
    ["applyThemeGlobalPreset", (actionNode, feature) => {
      if (!feature) {
        return;
      }
      handleApplyThemeGlobalPreset(actionNode, feature);
    }],
    ["clearThemeBackground", (_actionNode, feature) => {
      if (!feature) {
        return;
      }
      handleClearThemeBackground(feature);
    }],
    ["uploadThemeBackground", (_actionNode, feature) => {
      if (!feature) {
        return;
      }
      handleUploadThemeBackground(feature);
    }],
  ]);

  function handleAction(action, actionNode, feature) {
    const normalizedAction = String(action || "").trim();
    if (!normalizedAction) {
      return;
    }

    const handler = commandHandlers.get(normalizedAction);
    if (!handler) {
      return;
    }

    handler(actionNode, feature, normalizedAction);
  }

  return {
    handleAction,
    withRuntimeCall,
  };
}
