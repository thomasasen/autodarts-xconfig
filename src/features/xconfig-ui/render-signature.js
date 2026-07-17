export function buildShellRenderSignature(state, features, routeActive) {
  const normalizedFeatures = Array.isArray(features)
    ? features.map((feature) => {
      return {
        featureKey: feature.featureKey || "",
        enabled: Boolean(feature.enabled),
        mounted: Boolean(feature.mounted),
        config: feature.config || null,
      };
    })
    : [];

  return JSON.stringify({
    routeActive: Boolean(routeActive),
    activeTab: String(state?.activeTab || ""),
    activeSettingsFeatureKey: String(state?.activeSettingsFeatureKey || ""),
    noticeType: String(state?.notice?.type || ""),
    noticeMessage: String(state?.notice?.message || ""),
    settingsTransfer: {
      dialog: String(state?.settingsTransfer?.dialog || ""),
      includeAssets: state?.settingsTransfer?.includeAssets !== false,
      importMode: String(state?.settingsTransfer?.importMode || "merge"),
      fileName: String(state?.settingsTransfer?.fileName || ""),
      fileSize: Number(state?.settingsTransfer?.fileSize || 0),
      busy: Boolean(state?.settingsTransfer?.busy),
      report: state?.settingsTransfer?.report || null,
    },
    updateStatus: {
      capable: Boolean(state?.updateStatus?.capable),
      status: String(state?.updateStatus?.status || ""),
      installedVersion: String(state?.updateStatus?.installedVersion || ""),
      remoteVersion: String(state?.updateStatus?.remoteVersion || ""),
      available: Boolean(state?.updateStatus?.available),
      checkedAt: Number(state?.updateStatus?.checkedAt || 0),
      stale: Boolean(state?.updateStatus?.stale),
      error: String(state?.updateStatus?.error || ""),
    },
    features: normalizedFeatures,
  });
}

export function parseShellRenderSignature(signature) {
  if (!signature) {
    return null;
  }

  try {
    const parsed = JSON.parse(signature);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_) {
    return null;
  }
}
