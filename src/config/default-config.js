export const defaultConfig = {
  featureToggles: {
    checkoutScorePulse: true,
  },
  features: {
    checkoutScorePulse: {
      enabled: true,
      effect: "scale",
      colorTheme: "159, 219, 88",
      intensity: "standard",
      triggerSource: "suggestion-first",
      debug: false,
    },
  },
};