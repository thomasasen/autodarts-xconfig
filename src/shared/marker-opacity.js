// Appearance and hiding share one original value, independent of mount order.
// Entries disappear when both consumers release the marker.
const owners = new WeakMap();

export function isMarkerHiddenByOverlay(marker) {
  return marker?.getAttribute?.("data-ad-ext-original-opacity") != null ||
    marker?.dataset?.adExtOriginalOpacity !== undefined;
}

export function getMarkerOriginalOpacity(marker) {
  return owners.get(marker)?.original ?? (marker.style?.opacity || "");
}

function acquire(marker) {
  let entry = owners.get(marker);
  if (!entry) {
    entry = { original: marker.style.opacity || "", applied: null, highlight: null, hidden: false };
    owners.set(marker, entry);
  }
  return entry;
}

function applyOpacity(marker, entry) {
  const value = entry.hidden || isMarkerHiddenByOverlay(marker) ? "0" : entry.highlight?.opacity ?? entry.original;
  if (marker.style.opacity !== value) marker.style.opacity = value;
  entry.applied = marker.style.opacity;
  if (!entry.hidden && !entry.highlight) owners.delete(marker);
}

export function setMarkerHighlightOpacity(marker, opacity, refresh) {
  const entry = acquire(marker);
  entry.highlight = { opacity: String(opacity), refresh };
  refresh();
  applyOpacity(marker, entry);
}

export function releaseMarkerHighlightOpacity(marker) {
  const entry = owners.get(marker);
  if (!entry) return;
  entry.highlight = null;
  if (marker.style.opacity === entry.applied) applyOpacity(marker, entry);
  else if (!entry.hidden) owners.delete(marker);
}

export function setMarkerOverlayHidden(marker, hidden) {
  const entry = hidden ? acquire(marker) : owners.get(marker);
  if (!entry) return;
  const changed = entry.hidden !== hidden;
  const stillOwned = entry.applied === null || marker.style.opacity === entry.applied;
  entry.hidden = hidden;
  if (changed && stillOwned) entry.highlight?.refresh(true);
  if (hidden || stillOwned) applyOpacity(marker, entry);
  else if (!entry.highlight) owners.delete(marker);
}
