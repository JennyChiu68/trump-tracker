#!/usr/bin/env node

const fs = require("node:fs/promises");

const basePath = process.argv[2] || "data/trump-feed.json";
const deltaPath = process.argv[3] || "data/trump-feed.delta.json";
const outputPath = process.argv[4] || basePath;

async function main() {
  const [base, delta] = await Promise.all([readJson(basePath), readJson(deltaPath)]);
  const items = [...new Map([...(base.items || []), ...(delta.items || [])].map((item) => [item.id, item])).values()].sort(
    (a, b) => String(a.publishedAt || "").localeCompare(String(b.publishedAt || "")) || String(a.id || "").localeCompare(String(b.id || ""))
  );

  const from = base.window?.from || delta.window?.from || "";
  const to = delta.window?.to || base.window?.to || "";
  const payload = {
    ...base,
    generatedAt: delta.generatedAt || new Date().toISOString(),
    window: {
      from,
      to,
      label: `${from} 至 ${to} Truth Social 归档原帖`,
    },
    coverage: {
      ...(base.coverage || {}),
      note: `特朗普账号 · ${items.length.toLocaleString()} 条唯一发帖`,
      url: archiveRangeUrl(base.coverage?.url || delta.coverage?.url || "", from, to),
    },
    sources: dedupeSources([...(base.sources || []), ...(delta.sources || [])]),
    items,
  };

  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Merged ${delta.items?.length || 0} delta posts; ${items.length} unique posts in ${outputPath}`);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function dedupeSources(sources) {
  return [...new Map(sources.map((source) => [`${source.name || ""}|${source.url || ""}`, source])).values()];
}

function archiveRangeUrl(value, from, to) {
  if (!value) return value;
  try {
    const url = new URL(value);
    url.searchParams.set("start_date", from);
    url.searchParams.set("end_date", to);
    return url.toString();
  } catch {
    return value;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
