import { mountCricketTablePart } from "../cricket-table/index.js";

export function initializeCricketGridStatusEffects(context = {}) {
  return mountCricketTablePart(context, "effects");
}

export const mountCricketGridStatusEffects = initializeCricketGridStatusEffects;
export const initialize = initializeCricketGridStatusEffects;
export const mount = initializeCricketGridStatusEffects;
