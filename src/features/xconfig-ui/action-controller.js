import {
  createThemeGlobalTemplatePresetPatch,
  getThemeGlobalTemplatePreset,
} from "../../shared/theme-global-template-presets.js";

function withRuntimeCall(controller, promiseLike, successMessage, errorMessage, successType = "success") {
  Promise.resolve(promiseLike)
    .then(() => {
      if (successMessage) {
        controller.setNotice(successType, successMessage);
      }
    })
    .catch(() => {
      if (errorMessage) {
        controller.setNotice("error", errorMessage);
      }
    })
    .finally(() => controller.queueSync());
}

function confirmAction(windowRef, message) {
  if (typeof windowRef?.confirm === "function") {
    return windowRef.confirm(message);
  }
  return true;
}

function setActiveSettingsFeature(state, queueSync, feature) {
  if (state && feature) {
    state.activeSettingsFeatureKey = feature.featureKey;
  }
  queueSync();
}

function clearActiveSettingsFeature(state, queueSync) {
  if (state) {
    state.activeSettingsFeatureKey = "";
  }
  queueSync();
}

function handleInstallUpdate(controller) {
  const opened = controller.openUserscriptInstall(controller.windowRef);
  controller.setNotice(
    opened ? "info" : "error",
    opened
      ? "Installations-Tab geöffnet. Bestätige das Update in Tampermonkey."
      : "Installations-Tab konnte nicht geöffnet werden."
  );
}

function handleResetConfig(controller) {
  if (!controller.runtimeApi || typeof controller.runtimeApi.resetConfig !== "function") {
    return;
  }

  const confirmed = confirmAction(
    controller.windowRef,
    "Bist du sicher? Der Hard Reset setzt alles auf Standard zurück, deaktiviert alle Module und löscht alle gespeicherten Theme-Bilder."
  );
  if (!confirmed) {
    return;
  }

  withRuntimeCall(
    controller,
    controller.runtimeApi.resetConfig(),
    "Hard Reset ausgeführt.",
    "Hard Reset fehlgeschlagen.",
    "info"
  );
}

function handleApplyRecommendedDefaults(controller) {
  if (!controller.runtimeApi || typeof controller.runtimeApi.applyRecommendedDefaults !== "function") {
    return;
  }

  const confirmed = confirmAction(
    controller.windowRef,
    "Bist du sicher? Die empfohlenen Standards aktivieren alle Module und setzen die Konfiguration neu. Deine eigenen Theme-Bilder bleiben erhalten."
  );
  if (!confirmed) {
    return;
  }

  withRuntimeCall(
    controller,
    controller.runtimeApi.applyRecommendedDefaults(),
    "Empfohlene Standards angewendet.",
    "Empfohlene Standards konnten nicht angewendet werden.",
    "info"
  );
}

function handleSetFeature(controller, actionNode, feature) {
  if (!feature || !controller.runtimeApi || typeof controller.runtimeApi.setFeatureEnabled !== "function") {
    return;
  }

  const enabled = String(actionNode?.getAttribute?.("data-feature-enabled")) === "true";
  withRuntimeCall(
    controller,
    controller.runtimeApi.setFeatureEnabled(feature.featureKey, enabled),
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

function handleSetSettingToggle(controller, actionNode, feature) {
  if (!feature || !controller.runtimeApi || typeof controller.runtimeApi.saveConfig !== "function") {
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
    controller,
    controller.runtimeApi.saveConfig(
      controller.buildFeatureSettingPatch(configKey, settingKey, settingValue)
    ),
    "Einstellung gespeichert.",
    "Einstellung konnte nicht gespeichert werden."
  );
}

function resolveFieldOptionValues(field) {
  return Array.isArray(field?.options)
    ? field.options.map((option) => String(option?.value ?? ""))
    : [];
}

function resolveCurrentSelectedValues(inputWrap, settingKey) {
  return Array.from(
    inputWrap?.querySelectorAll?.(
      `[data-adxconfig-action='set-setting-select-option'][data-setting-key='${settingKey}'][data-active='true']`
    ) || []
  ).map((node) => String(node?.getAttribute?.("data-setting-value") ?? ""));
}

function resolveFeatureConfigValues(feature, settingKey) {
  const configuredValue = feature?.config?.[settingKey];
  if (Array.isArray(configuredValue)) {
    return configuredValue;
  }
  return [configuredValue];
}

function resolveCurrentMultiSelection(inputWrap, feature, settingKey, optionValues) {
  return Array.from(
    new Set(
      resolveCurrentSelectedValues(inputWrap, settingKey)
        .concat(resolveFeatureConfigValues(feature, settingKey).map((value) => String(value ?? "")))
        .filter((value) => optionValues.includes(value))
    )
  );
}

function resolveNextSelection(field, currentValues, settingRawValue, optionValues) {
  if (field.multiple !== true) {
    return [settingRawValue];
  }

  const nextValues = currentValues.includes(settingRawValue)
    ? currentValues.filter((value) => value !== settingRawValue)
    : [...currentValues, settingRawValue];
  return nextValues.length ? nextValues : [optionValues[0] || ""];
}

function handleSetSettingSelectOption(controller, actionNode, feature) {
  if (!feature || !controller.runtimeApi || typeof controller.runtimeApi.saveConfig !== "function") {
    return;
  }

  const configKey = actionNode?.getAttribute?.("data-config-key") || feature.configKey;
  const settingKey = String(actionNode?.getAttribute?.("data-setting-key") || "").trim();
  const settingRawValue = String(actionNode?.getAttribute?.("data-setting-value") ?? "");
  if (!configKey || !settingKey) {
    return;
  }

  const descriptor = controller.getXConfigDescriptor(feature.featureKey);
  const field =
    descriptor?.fields?.find(
      (entry) => entry.control === "select" && entry.key === settingKey
    ) || null;
  if (!field) {
    return;
  }

  const optionValues = resolveFieldOptionValues(field);
  const inputWrap =
    actionNode?.closest?.(".ad-xconfig-setting-input") ||
    actionNode?.parentElement ||
    null;
  const currentValues = field.multiple === true
    ? resolveCurrentMultiSelection(inputWrap, feature, settingKey, optionValues)
    : [];
  const nextSelection = resolveNextSelection(field, currentValues, settingRawValue, optionValues);
  const nextValue = field.multiple === true
    ? nextSelection.map((value) => controller.parseFieldValue(field, value, false))
    : controller.parseFieldValue(field, nextSelection[0] || "", false);
  controller.syncSelectOptionButtons(
    controller.documentRef,
    actionNode,
    field.multiple === true ? nextSelection : nextSelection[0] || ""
  );
  withRuntimeCall(
    controller,
    controller.runtimeApi.saveConfig(
      controller.buildFeatureSettingPatch(configKey, settingKey, nextValue)
    ),
    "Einstellung gespeichert.",
    "Einstellung konnte nicht gespeichert werden."
  );
}

function handleClearSettingColor(controller, actionNode, feature) {
  if (!feature || !controller.runtimeApi || typeof controller.runtimeApi.saveConfig !== "function") {
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
  controller.syncColorFieldControl(fieldNode, {
    value: "",
  });
  withRuntimeCall(
    controller,
    controller.runtimeApi.saveConfig(controller.buildFeatureSettingPatch(configKey, settingKey, "")),
    "Theme-Default wieder aktiv.",
    "Einstellung konnte nicht gespeichert werden."
  );
}

function handleRunFeatureAction(controller, actionNode, feature) {
  if (!feature || !controller.runtimeApi || typeof controller.runtimeApi.runFeatureAction !== "function") {
    return;
  }

  const descriptor = controller.getXConfigDescriptor(feature.featureKey);
  const actionId = String(actionNode?.getAttribute?.("data-feature-action-id") || "").trim();
  const actionField =
    descriptor?.fields?.find(
      (field) =>
        field.control === "action" &&
        field.action === "run-feature-action" &&
        String(field.actionId || "").trim() === actionId
    ) || null;

  withRuntimeCall(
    controller,
    controller.runtimeApi.runFeatureAction(feature.featureKey, actionId),
    actionField?.successMessage || "Aktion ausgeführt.",
    actionField?.errorMessage || "Aktion konnte nicht ausgeführt werden.",
    "info"
  );
}

function handleApplyThemeGlobalPreset(controller, actionNode, feature) {
  if (!feature || !controller.runtimeApi || typeof controller.runtimeApi.saveConfig !== "function") {
    return;
  }

  const presetKey = String(actionNode?.getAttribute?.("data-feature-action-id") || "").trim();
  const preset = getThemeGlobalTemplatePreset(presetKey);
  const patch = createThemeGlobalTemplatePresetPatch(presetKey);
  if (!preset || !patch) {
    return;
  }

  const confirmed = confirmAction(
    controller.windowRef,
    `Preset "${preset.label}" anwenden? Dadurch werden alle Einstellungen in Templates Global inklusive globalem Wallpaper überschrieben.`
  );
  if (!confirmed) {
    return;
  }

  withRuntimeCall(
    controller,
    Promise.resolve(controller.runtimeApi.saveConfig(patch)).then(() => {
      controller.syncThemeBackgroundIndicators(feature.featureKey);
    }),
    `Preset "${preset.label}" angewendet.`,
    `Preset "${preset.label}" konnte nicht angewendet werden.`
  );
}

function handleClearThemeBackground(controller, feature) {
  const themeKey = controller.themeKeyFromConfigKey(feature.configKey);
  if (!themeKey || typeof controller.runtimeApi?.clearThemeBackgroundImage !== "function") {
    return;
  }

  controller.clearThemeBackgroundImage({
    feature,
    themeKey,
    runtimeApi: controller.runtimeApi,
    setNotice: controller.setNotice,
    setThemeActionFeedback: controller.setThemeActionFeedback,
    syncThemeBackgroundIndicators: controller.syncThemeBackgroundIndicators,
    queueSync: controller.queueSync,
  });
}

function handleUploadThemeBackground(controller, feature) {
  const themeKey = controller.themeKeyFromConfigKey(feature.configKey);
  if (!themeKey) {
    return;
  }

  controller.uploadThemeBackgroundImage({
    feature,
    themeKey,
    documentRef: controller.documentRef,
    windowRef: controller.windowRef,
    runtimeApi: controller.runtimeApi,
    setNotice: controller.setNotice,
    setThemeActionFeedback: controller.setThemeActionFeedback,
    syncThemeBackgroundIndicators: controller.syncThemeBackgroundIndicators,
    queueSync: controller.queueSync,
  });
}

function buildCommandHandlers(controller) {
  return new Map([
    ["open", () => controller.navigateToConfigRoute()],
    ["close", () => controller.navigateBack()],
    ["open-settings", (_actionNode, feature) => {
      if (!feature) {
        return;
      }
      setActiveSettingsFeature(controller.state, controller.queueSync, feature);
    }],
    ["close-settings", () => clearActiveSettingsFeature(controller.state, controller.queueSync)],
    ["close-settings-backdrop", () => clearActiveSettingsFeature(controller.state, controller.queueSync)],
    ["open-readme", (_actionNode, feature) => {
      controller.openReadme(controller.windowRef, feature?.featureKey || "");
    }],
    ["open-changelog", () => controller.openChangelog(controller.windowRef)],
    ["check-update", () => {
      controller.refreshUpdateStatus({
        force: true,
        announce: true,
      });
    }],
    ["install-update", () => handleInstallUpdate(controller)],
    ["reset", () => handleResetConfig(controller)],
    ["apply-recommended-defaults", () => handleApplyRecommendedDefaults(controller)],
    ["set-feature", (actionNode, feature) => handleSetFeature(controller, actionNode, feature)],
    ["set-setting-toggle", (actionNode, feature) =>
      handleSetSettingToggle(controller, actionNode, feature)],
    ["set-setting-select-option", (actionNode, feature) =>
      handleSetSettingSelectOption(controller, actionNode, feature)],
    ["clear-setting-color", (actionNode, feature) =>
      handleClearSettingColor(controller, actionNode, feature)],
    ["run-feature-action", (actionNode, feature) =>
      handleRunFeatureAction(controller, actionNode, feature)],
    ["applyThemeGlobalPreset", (actionNode, feature) => {
      if (!feature) {
        return;
      }
      handleApplyThemeGlobalPreset(controller, actionNode, feature);
    }],
    ["clearThemeBackground", (_actionNode, feature) => {
      if (!feature) {
        return;
      }
      handleClearThemeBackground(controller, feature);
    }],
    ["uploadThemeBackground", (_actionNode, feature) => {
      if (!feature) {
        return;
      }
      handleUploadThemeBackground(controller, feature);
    }],
  ]);
}

function handleShellAction(commandHandlers, action, actionNode, feature) {
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

export function createShellActionController(options = {}) {
  const controller = {
    windowRef: options.windowRef || null,
    documentRef: options.documentRef || null,
    state: options.state || null,
    runtimeApi: options.runtimeApi || null,
    setNotice: typeof options.setNotice === "function" ? options.setNotice : () => {},
    queueSync: typeof options.queueSync === "function" ? options.queueSync : () => {},
    refreshUpdateStatus:
      typeof options.refreshUpdateStatus === "function"
        ? options.refreshUpdateStatus
        : () => Promise.resolve(),
    navigateToConfigRoute:
      typeof options.navigateToConfigRoute === "function"
        ? options.navigateToConfigRoute
        : () => {},
    navigateBack:
      typeof options.navigateBack === "function" ? options.navigateBack : () => {},
    openReadme:
      typeof options.openReadme === "function" ? options.openReadme : () => {},
    openChangelog:
      typeof options.openChangelog === "function" ? options.openChangelog : () => {},
    openUserscriptInstall:
      typeof options.openUserscriptInstall === "function"
        ? options.openUserscriptInstall
        : () => false,
    getXConfigDescriptor:
      typeof options.getXConfigDescriptor === "function"
        ? options.getXConfigDescriptor
        : () => null,
    buildFeatureSettingPatch:
      typeof options.buildFeatureSettingPatch === "function"
        ? options.buildFeatureSettingPatch
        : () => ({ features: {} }),
    parseFieldValue:
      typeof options.parseFieldValue === "function" ? options.parseFieldValue : (_field, value) => value,
    syncSelectOptionButtons:
      typeof options.syncSelectOptionButtons === "function"
        ? options.syncSelectOptionButtons
        : () => {},
    syncColorFieldControl:
      typeof options.syncColorFieldControl === "function"
        ? options.syncColorFieldControl
        : () => {},
    themeKeyFromConfigKey:
      typeof options.themeKeyFromConfigKey === "function" ? options.themeKeyFromConfigKey : () => "",
    clearThemeBackgroundImage:
      typeof options.clearThemeBackgroundImage === "function"
        ? options.clearThemeBackgroundImage
        : () => {},
    uploadThemeBackgroundImage:
      typeof options.uploadThemeBackgroundImage === "function"
        ? options.uploadThemeBackgroundImage
        : () => {},
    syncThemeBackgroundIndicators:
      typeof options.syncThemeBackgroundIndicators === "function"
        ? options.syncThemeBackgroundIndicators
        : () => {},
    setThemeActionFeedback:
      typeof options.setThemeActionFeedback === "function"
        ? options.setThemeActionFeedback
        : () => {},
  };
  const commandHandlers = buildCommandHandlers(controller);

  return {
    handleAction: (action, actionNode, feature) =>
      handleShellAction(commandHandlers, action, actionNode, feature),
    withRuntimeCall: (promiseLike, successMessage, errorMessage, successType = "success") =>
      withRuntimeCall(controller, promiseLike, successMessage, errorMessage, successType),
  };
}
