import { mountCricketTablePart } from "../cricket-table/index.js";

export function mountCricketLayout(context = {}) {
  return mountCricketTablePart(context, "layout");
}
