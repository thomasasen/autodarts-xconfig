import packageInfo from "../../package.json" with { type: "json" };

// The immutable source tag is created before its userscript release is published.
export const THEME_ASSET_RELEASE_TAG = `v${packageInfo.version}`;
