#!/usr/bin/env node

const fs = require("node:fs/promises");
const { loadApp } = require("./ui-harness");

const rawFile = process.argv[2] || "data/trump-feed.json";
const supplementalFile = process.argv[3] || "data/trump-remarks.json";
const releaseFile = process.argv[4] || "data/release-feed.json";
const browserSnapshotFile = process.argv[5] || "snapshot.js";

async function main() {
  const [raw, supplemental] = await Promise.all([readJson(rawFile), readJsonIfExists(supplementalFile)]);
  const merged = mergePayload(raw, supplemental);
  const { context, vm } = await loadApp({ payload: merged });
  const acceptedIds = new Set(JSON.parse(vm.runInContext("JSON.stringify(statements.map(item => item.id))", context)));
  const items = merged.items.filter((item) => acceptedIds.has(item.id));
  const from = merged.window?.from || "";
  const to = merged.window?.to || "";
  const payload = {
    ...merged,
    window: {
      ...merged.window,
      label: `${from} 至 ${to} 固定快照`,
    },
    coverage: {
      mode: "release-snapshot",
      sourceLabel: "固定快照",
      title: "已载入质检快照",
      note: `${items.length.toLocaleString()} 条通过发言归属、翻译对齐与合规过滤`,
    },
    sources: buildSources(merged, supplemental),
    items,
  };

  await fs.writeFile(releaseFile, `${JSON.stringify(payload, null, 2)}\n`);
  await fs.writeFile(browserSnapshotFile, `window.TRUMP_FEED_SNAPSHOT=${JSON.stringify(payload)};\n`);
  console.log(`Built release snapshot with ${items.length} of ${merged.items.length} source records`);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function readJsonIfExists(filePath) {
  try {
    return await readJson(filePath);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function mergePayload(raw, supplemental) {
  const extraItems = supplemental?.items || [];
  const items = [...new Map([...(raw.items || []), ...extraItems].map((item) => [item.id, item])).values()].sort(
    (a, b) => String(a.publishedAt || "").localeCompare(String(b.publishedAt || "")) || String(a.id || "").localeCompare(String(b.id || ""))
  );
  return {
    ...raw,
    items,
  };
}

function buildSources(payload, supplemental) {
  const from = payload.window?.from || "";
  const to = payload.window?.to || "";
  const truthSocial = (payload.sources || []).find((source) => source.name === "Truth Social");
  return [
    {
      name: "Trump’s Truth",
      status: "第三方公开归档；当前发布版本使用固定快照",
      connected: true,
      url: `https://trumpstruth.org/search?start_date=${from}&end_date=${to}&removed=include`,
    },
    truthSocial,
    ...(supplemental?.sources || []),
  ].filter(Boolean);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
