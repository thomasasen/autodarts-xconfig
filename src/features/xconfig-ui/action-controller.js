export function createShellActionController(options = {}) {
  const windowRef = options.windowRef || null;
  const documentRef = options.documentRef || null;
  const state = options.state || null;
  const runtimeApi = options.runtimeApi || null;
  const getFeatures = typeof options.getFeatures === "function" ? options.getFeatures : () => [];
  const setNotice = typeof options.setNotice === "function" ? options.setNotice : () => {};
  const queueSync = typeof options.queueSync === "function" ? options.queueSync : () => {};
  const refreshUpdateStatus =
    typeof options.refreshUpdateStatus === "function" ? options.refreshUpdateStatus : () => Promise.resolve();
  const navigateToConfigRoute =
    typeof options.navigateToConfigRoute === "function" ? options.navigateToConfigRoute : () => {};
  const navigateBack =
    typeof options.navigateBack === "function" ? options.navigateBack : () => {};
  const openReadme = typeof options.openReadme === "function" ? options.openReadme : () => {};
  const openChangelog = typeof options.openChangelog === "function" ? options.openChangelog : () => {};
  const openUserscriptInstall =
    typeof options.openUserscriptInstall === "function" ? options.openUserscriptInstall : () => false;
  const getXConfigDescriptor =
    typeof options.getXConfigDescriptor === "function" ? options.getXConfigDescriptor : () => null;
  const buildFeatureSettingPatch =
    typeof options.buildFeatureSettingPatch === "function" ? options.buildFeatureSettingPatch : () => ({ features: {} });
  const parseFieldValue =
    typeof options.parseFieldValue === "function" ? options.parseFieldValue : (_field, value) => value;
  const syncSelectOptionButtons =
    typeof options.syncSelectOptionButtons === "function" ? options.syncSelectOptionButtons : () => {};
  const themeKeyFromConfigKey =
    typeof options.themeKeyFromConfigKey === "function" ? options.themeKeyFromConfigKey : () => "";
  const isThemeFeature =
    typeof options.isThemeFeature === "function" ? options.isThemeFeature : () => false;
  const clearThemeBackgroundImage =
    typeof options.clearThemeBackgroundImage === "function" ? options.clearThemeBackgroundImage : () => {};
  const uploadThemeBackgroundImage =
    typeof options.uploadThemeBackgroundImage === "function" ? options.uploadThemeBackgroundImage : () => {};
  const syncThemeBackgroundIndicators =
    typeof options.syncThemeBackgroundIndicators === "function" ? options.syncThemeBackgroundIndicators : () => {};
  const setThemeActionFeedback =
    typeof options.setThemeActionFeedback === "function" ? options.setThemeActionFeedback : () => {};

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

  function handleAction(action, actionNode, feature) {
    if (!action) {
      return;
    }

    if (action === "open") {
      navigateToConfigRoute();
      return;
    }
    if (action === "close") {
      navigateBack();
      return;
    }
    if (action === "open-settings" && feature) {
      state.activeSettingsFeatureKey = feature.featureKey;
      queueSync();
      return;
    }
    if (action === "close-settings" || action === "close-settings-backdrop") {
      state.activeSettingsFeatureKey = "";
      queueSync();
      return;
    }
    if (action === "open-readme") {
      openReadme(windowRef, feature?.featureKey || "");
      return;
    }
    if (action === "open-changelog") {
      openChangelog(windowRef);
      return;
    }
    if (action === "check-update") {
      refreshUpdateStatus({
        force: true,
        announce: true,
      });
      return;
    }
    if (action === "install-update") {
      const opened = openUserscriptInstall(windowRef);
      setNotice(
        opened ? "info" : "error",
        opened
          ? "Installations-Tab geöffnet. Bestätige das Update in Tampermonkey."
          : "Installations-Tab konnte nicht geöffnet werden."
      );
      return;
    }

    if (action === "reset" && typeof runtimeApi.resetConfig === "function") {
      const confirmed = typeof windowRef.confirm === "function"
        ? windowRef.confirm(
            "Bist du sicher? Der Hard Reset setzt alles auf Standard zurück, deaktiviert alle Module und löscht alle gespeicherten Theme-Bilder."
          )
        : true;
      if (!confirmed) {
        return;
      }
      withRuntimeCall(
        runtimeApi.resetConfig(),
        "Hard Reset ausgeführt.",
        "Hard Reset fehlgeschlagen.",
        "info"
      );
      return;
    }

    if (
      action === "apply-recommended-defaults" &&
      typeof runtimeApi.applyRecommendedDefaults === "function"
    ) {
      const confirmed = typeof windowRef.confirm === "function"
        ? windowRef.confirm(
            "Bist du sicher? Die empfohlenen Standards aktivieren alle Module und setzen die Konfiguration neu. Deine eigenen Theme-Bilder bleiben erhalten."
          )
        : true;
      if (!confirmed) {
        return;
      }
      withRuntimeCall(
        runtimeApi.applyRecommendedDefaults(),
        "Empfohlene Standards angewendet.",
        "Empfohlene Standards konnten nicht angewendet werden.",
        "info"
      );
      return;
    }

    if (action === "set-feature" && feature && typeof runtimeApi.setFeatureEnabled === "function") {
      const enabled = String(actionNode?.getAttribute?.("data-feature-enabled")) === "true";
      withRuntimeCall(
        runtimeApi.setFeatureEnabled(feature.featureKey, enabled),
        `${feature.title}: ${enabled ? "An" : "Aus"}`,
        `${feature.title}: Status konnte nicht gespeichert werden.`
      );
      return;
    }

    if (action === "set-setting-toggle" && feature && typeof runtimeApi.saveConfig === "function") {
      const configKey = actionNode?.getAttribute?.("data-config-key") || feature.configKey;
      const settingKey = actionNode?.getAttribute?.("data-setting-key");
      const settingValue = String(actionNode?.getAttribute?.("data-setting-value")) === "true";
      if (!configKey || !settingKey) {
        return;
      }
      const toggleButtons = Array.from(
        actionNode?.parentElement?.querySelectorAll?.(
          `[data-adxconfig-action='set-setting-toggle'][data-setting-key='${settingKey}']`
        ) || []
      );
      toggleButtons.forEach((buttonNode) => {
        buttonNode.setAttribute("data-active", buttonNode === actionNode ? "true" : "false");
      });
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
      return;
    }

    if (action === "set-setting-select-option" && feature && typeof runtimeApi.saveConfig === "function") {
      const configKey = actionNode?.getAttribute?.("data-config-key") || feature.configKey;
      const settingKey = String(actionNode?.getAttribute?.("data-setting-key") || "").trim();
      const settingRawValue = String(actionNode?.getAttribute?.("data-setting-value") ?? "");
      if (!configKey || !settingKey) {
        return;
      }

      const descriptor = getXConfigDescriptor(feature.featureKey);
      const field = descriptor?.fields?.find(
        (entry) => entry.control === "select" && entry.key === settingKey
      ) || null;
      if (!field) {
        return;
      }

      syncSelectOptionButtons(documentRef, actionNode, settingRawValue);
      const nextValue = parseFieldValue(field, settingRawValue, false);
      withRuntimeCall(
        runtimeApi.saveConfig(buildFeatureSettingPatch(configKey, settingKey, nextValue)),
        "Einstellung gespeichert.",
        "Einstellung konnte nicht gespeichert werden."
      );
      return;
    }

    if (!feature) {
      return;
    }

    if (action === "run-feature-action" && typeof runtimeApi.runFeatureAction === "function") {
      const descriptor = getXConfigDescriptor(feature.featureKey);
      const actionId = String(actionNode?.getAttribute?.("data-feature-action-id") || "").trim();
      const actionField =
        descriptor?.fields?.find(
          (field) =>
            field.control === "action" &&
            field.action === action &&
            String(field.actionId || "").trim() === actionId
        ) || null;
      withRuntimeCall(
        runtimeApi.runFeatureAction(feature.featureKey, actionId),
        actionField?.successMessage || "Aktion ausgeführt.",
        actionField?.errorMessage || "Aktion konnte nicht ausgeführt werden.",
        "info"
      );
      return;
    }

    const themeKey = themeKeyFromConfigKey(feature.configKey);
    if (action === "clearThemeBackground" && themeKey && typeof runtimeApi.clearThemeBackgroundImage === "function") {
      clearThemeBackgroundImage({
        feature,
        themeKey,
        runtimeApi,
        setNotice,
        setThemeActionFeedback,
        syncThemeBackgroundIndicators,
        queueSync,
      });
      return;
    }

    if (action === "uploadThemeBackground" && themeKey) {
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
  }

  return {
    handleAction,
    withRuntimeCall,
  };
}
