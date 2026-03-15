import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AUTODARTS_CRICKET_GAME_MODE_TERMS,
  AUTODARTS_CRICKET_SCORING_MODE_TERMS,
  AUTODARTS_DOC_SOURCE_URLS,
  AUTODARTS_NON_TAKEOUT_NOTICE_TEXTS,
  AUTODARTS_TAKEOUT_NOTICE_TEXTS,
  AUTODARTS_X01_OUT_MODE_TERMS,
} from "../src/shared/autodarts-doc-terms.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const fixturePath = path.resolve(repoRoot, "tests", "fixtures", "autodarts-docs-terms.json");

const docsByUrl = new Map();

async function fetchDoc(url) {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return String(await response.text());
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function assertTermInDoc(url, term) {
  const docText = normalizeText(docsByUrl.get(url));
  const normalizedTerm = normalizeText(term);
  if (!normalizedTerm || docText.includes(normalizedTerm)) {
    return;
  }

  throw new Error(`Term not found in source doc: "${term}" (${url})`);
}

function assertTermInAnyDoc(urls, term) {
  for (const url of urls) {
    const docText = normalizeText(docsByUrl.get(url));
    if (docText.includes(normalizeText(term))) {
      return;
    }
  }

  throw new Error(`Term not found in any source doc: "${term}"`);
}

async function main() {
  for (const sourceUrl of AUTODARTS_DOC_SOURCE_URLS) {
    docsByUrl.set(sourceUrl, await fetchDoc(sourceUrl));
  }

  const boardManagerUrl = AUTODARTS_DOC_SOURCE_URLS[0];
  const inGameUrl = AUTODARTS_DOC_SOURCE_URLS[1];
  const x01Url = AUTODARTS_DOC_SOURCE_URLS[2];
  const cricketUrl = AUTODARTS_DOC_SOURCE_URLS[3];

  AUTODARTS_TAKEOUT_NOTICE_TEXTS.forEach((term) => {
    if (
      term === "Remove Darts" ||
      term === "Removing Darts" ||
      term === "Darts entfernen"
    ) {
      return;
    }

    assertTermInAnyDoc([boardManagerUrl, inGameUrl], term);
  });

  AUTODARTS_NON_TAKEOUT_NOTICE_TEXTS.forEach((term) => {
    assertTermInDoc(boardManagerUrl, term);
  });

  AUTODARTS_X01_OUT_MODE_TERMS.forEach((term) => {
    assertTermInDoc(x01Url, term);
  });

  AUTODARTS_CRICKET_GAME_MODE_TERMS.forEach((term) => {
    assertTermInDoc(cricketUrl, term);
  });

  AUTODARTS_CRICKET_SCORING_MODE_TERMS.forEach((term) => {
    if (term.toLowerCase() === "normal") {
      assertTermInDoc(cricketUrl, "Normal");
      return;
    }
    assertTermInDoc(cricketUrl, term);
  });

  const payload = {
    version: 1,
    syncedAt: new Date().toISOString(),
    sources: AUTODARTS_DOC_SOURCE_URLS,
    removeDarts: {
      positive: AUTODARTS_TAKEOUT_NOTICE_TEXTS,
      negative: AUTODARTS_NON_TAKEOUT_NOTICE_TEXTS,
    },
    x01: {
      variantExamples: ["X01", "501"],
      outModes: AUTODARTS_X01_OUT_MODE_TERMS,
    },
    cricket: {
      gameModes: AUTODARTS_CRICKET_GAME_MODE_TERMS,
      scoringModes: {
        standard: ["Normal"],
        cutthroat: AUTODARTS_CRICKET_SCORING_MODE_TERMS.filter((term) =>
          normalizeText(term).includes("cut")
        ),
      },
    },
  };

  await writeFile(fixturePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Synced ${fixturePath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
