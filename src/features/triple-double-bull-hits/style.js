export const STYLE_ID = "ad-ext-triple-double-bull-hits-style";
export const HIT_BASE_CLASS = "ad-ext-hit-highlight";
export const HIT_KIND_CLASS = Object.freeze({
  triple: "ad-ext-hit-highlight--triple",
  double: "ad-ext-hit-highlight--double",
  bull: "ad-ext-hit-highlight--bull",
});

export function buildStyleText() {
  return `
.${HIT_BASE_CLASS} {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 4px 8px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-shadow: 0 0 6px rgba(255, 255, 255, 0.25);
  transition: transform 140ms ease-out, box-shadow 140ms ease-out;
}

.${HIT_BASE_CLASS}:hover {
  transform: translateY(-1px);
}

.${HIT_KIND_CLASS.triple} {
  color: #fff4dc;
  background: linear-gradient(135deg, #ef4444 0%, #f97316 50%, #fbbf24 100%);
  box-shadow: 0 0 16px rgba(249, 115, 22, 0.45);
}

.${HIT_KIND_CLASS.double} {
  color: #ecfeff;
  background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #6366f1 100%);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.45);
}

.${HIT_KIND_CLASS.bull} {
  color: #0f172a;
  background: linear-gradient(135deg, #bef264 0%, #86efac 50%, #4ade80 100%);
  box-shadow: 0 0 16px rgba(134, 239, 172, 0.5);
}
`;
}
