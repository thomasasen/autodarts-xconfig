// Shared presentation-only discovery. Scores and target semantics stay untouched.
export function readCricketPlayerStatistics(header) {
  const isMpr = (node) => /^MPR\s*(?::\s*)?[\d.,]*$/i.test(String(node?.textContent || "").trim());
  const mprNodes = Array.from(header.querySelectorAll("span,div,p")).filter((node) => isMpr(node) && !isMpr(node.parentElement));
  const numericNodes = Array.from(header.querySelectorAll(".font-number")).filter((node) =>
    !mprNodes.some((mpr) => mpr === node || mpr.contains(node)) && /^[\d\s.,+-]+$/.test(String(node.textContent || "").trim()));
  const boldScores = numericNodes.filter((node) => node.classList.contains("font-bold"));
  let score = null;
  if (boldScores.length === 1) score = boldScores[0];
  else if (numericNodes.length === 1) score = numericNodes[0];
  if (score) Array.from(score.parentElement.children).filter((node) =>
    node !== score && node.matches(".flex.flex-col") && node.querySelector(".rounded-sm.size-8 .font-number"))
    .forEach((node) => mprNodes.push(node));
  return { score, mprNodes };
}
