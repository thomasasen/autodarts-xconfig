// Keep overrides after host styles without repeatedly swapping xConfig styles.
// Reordering owned siblings would make their DOM observers trigger each other.
export function maintainMatchStyleOrder(styleNode) {
  const parent = styleNode?.parentNode;
  if (!parent?.appendChild) return;
  const siblings = Array.from(parent.children || []);
  const index = siblings.indexOf(styleNode);
  if (index < 0) return;
  const hostStyleFollows = siblings.slice(index + 1).some((node) => {
    if (/^(?:ad-ext-|ad-xconfig-)/.test(String(node.id || ""))) return false;
    const tag = String(node.tagName || "").toLowerCase();
    return tag === "style" || (tag === "link" && node.getAttribute("rel") === "stylesheet");
  });
  if (hostStyleFollows) parent.appendChild(styleNode);
}
