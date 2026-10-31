// Preserve independent per-design values when expanding shared metadata defaults.
export function expandCommunityDesignEntries(entries, defaults) {
  return Object.freeze(entries.map((entry) => ({ ...structuredClone(defaults), ...entry })));
}
