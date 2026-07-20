#!/usr/bin/env node

const fs = require("node:fs/promises");
const { curatePayload } = require("../lib/curate-feed");

const input = process.argv[2] || "data/trump-feed.json";
const output = process.argv[3] || "insights-snapshot.js";
const supplementalInput = process.argv[4] || "data/trump-remarks.json";

async function main() {
  const payload = JSON.parse(await fs.readFile(input, "utf8"));
  const supplemental = await readJsonIfExists(supplementalInput);
  const curated = curatePayload(mergeSupplemental(payload, supplemental));
  await fs.writeFile(output, `window.TRUMP_FEED_SNAPSHOT = ${JSON.stringify(curated, null, 2)};\n`);
  console.log(`Built ${output} with ${curated.items.length} curated market items`);
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function mergeSupplemental(payload, supplemental) {
  const extraItems = supplemental?.items || [];
  if (!extraItems.length) return payload;
  const items = [...new Map([...(payload.items || []), ...extraItems].map((item) => [item.id, item])).values()].sort(
    (a, b) => String(a.publishedAt || "").localeCompare(String(b.publishedAt || ""))
  );
  return { ...payload, items };
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
