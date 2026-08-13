#!/usr/bin/env node

const fs = require("node:fs/promises");

const ORIGIN = "https://www.trumpstruth.org";
const DEFAULT_FROM = "2026-01-01";
const DEFAULT_TO = new Date().toISOString().slice(0, 10);
const DEFAULT_OUT = "data/trump-feed.json";
const MONTHS = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const from = args.from || DEFAULT_FROM;
  const to = args.to || DEFAULT_TO;
  const out = args.out || DEFAULT_OUT;
  const perPage = Number(args.perPage || 100);
  const maxPages = Number(args.maxPages || 80);
  const hydrateEmpty = args.hydrateEmpty !== "false";

  const { results, expectedTotal } = await fetchSearchResults({ from, to, perPage, maxPages });
  const hydrated = hydrateEmpty ? await hydrateEmptyStatuses(results) : results;
  const items = hydrated.map(toFeedItem).sort((a, b) => a.publishedAt.localeCompare(b.publishedAt) || a.id.localeCompare(b.id));

  const payload = {
    generatedAt: new Date().toISOString(),
    window: {
      from,
      to,
      label: `${from} 至 ${to} Truth Social 归档原帖`,
    },
    coverage: {
      mode: "archive",
      sourceLabel: "归档原帖",
      title: "已接入发言归档",
      note: `特朗普账号 · ${items.length.toLocaleString()} 条唯一发帖`,
      url: `${ORIGIN}/search?query=&start_date=${from}&end_date=${to}&removed=include&sort=date_desc&per_page=100`,
      linkLabel: "归档来源",
      truthSocial: {
        account: "@realDonaldTrump",
        directEndpoint: "https://truthsocial.com/api/v1/accounts/107780257626128497/statuses",
        connected: true,
        via: "https://trumpstruth.org",
      },
    },
    sources: [
      {
        name: "Trump’s Truth",
        status: "第三方公开归档；含原帖、已删除帖、视频转录和图片描述",
        connected: true,
        url: `${ORIGIN}/search?start_date=${from}&end_date=${to}&removed=include`,
      },
      {
        name: "Truth Social",
        status: "原站链接保留在归档页面；直连 API 在当前环境被 Cloudflare 阻断",
        connected: false,
      },
    ],
    items,
  };

  await fs.writeFile(out, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${items.length} posts to ${out}${expectedTotal ? `; archive reported ${expectedTotal}` : ""}`);
}

async function fetchSearchResults({ from, to, perPage, maxPages }) {
  const results = [];
  let expectedTotal = 0;

  for (let page = 1; page <= maxPages; page += 1) {
    const url = new URL("/search", ORIGIN);
    url.searchParams.set("query", "");
    url.searchParams.set("start_date", from);
    url.searchParams.set("end_date", to);
    url.searchParams.set("removed", "include");
    url.searchParams.set("sort", "date_desc");
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(page));

    const html = await requestText(url);
    expectedTotal ||= extractExpectedTotal(html);
    const pageItems = parseSearchResults(html);
    if (!pageItems.length) break;

    results.push(...pageItems);
    console.log(`Fetched archive page ${page}: ${pageItems.length} posts (${results.length}/${expectedTotal || "?"})`);
    if (expectedTotal && results.length >= expectedTotal) break;
  }

  return { results: dedupeById(results), expectedTotal };
}

async function hydrateEmptyStatuses(results) {
  const emptyItems = results.filter((item) => !item.text.trim());
  if (!emptyItems.length) return results;

  console.log(`Hydrating ${emptyItems.length} media-only/empty posts from detail pages`);
  const byId = new Map(results.map((item) => [item.id, item]));

  for (let index = 0; index < emptyItems.length; index += 1) {
    const item = emptyItems[index];
    try {
      const detail = await fetchStatusDetail(item.archiveUrl);
      byId.set(item.id, { ...item, ...detail });
    } catch (error) {
      byId.set(item.id, { ...item, context: `详情页读取失败：${error.message}` });
    }

    if ((index + 1) % 25 === 0 || index === emptyItems.length - 1) {
      console.log(`Hydrated ${index + 1}/${emptyItems.length}`);
    }
  }

  return [...byId.values()];
}

async function fetchStatusDetail(url) {
  const html = await requestText(url);
  const content = extractFirst(html, /<div class="status__content">([\s\S]*?)<\/div>/);
  const attachmentDescriptions = [...html.matchAll(/<img[^>]+(?:alt|title)="([^"]*)"[^>]*class="status-attachment__image"/g)]
    .map((match) => decodeHtml(match[1]))
    .filter(Boolean);
  const videoTracks = [...html.matchAll(/<track[^>]+src="([^"]+)"/g)].map((match) => toAbsoluteUrl(match[1]));
  const original = extractFirst(html, /<a href="(https:\/\/truthsocial\.com\/@realDonaldTrump\/[^"]+)"/);
  const text = cleanText(content || "");
  const mediaText = attachmentDescriptions.length ? `图片描述：${dedupeStrings(attachmentDescriptions).join(" / ")}` : "";
  const videoText = videoTracks.length ? `视频字幕：${videoTracks.join(" / ")}` : "";

  return {
    text: text || mediaText || videoText,
    context: [mediaText && "含图片描述", videoText && "含视频字幕链接"].filter(Boolean).join("；"),
    originalUrl: original || "",
  };
}

function parseSearchResults(html) {
  const chunks = html.split('<div class="search-result"').slice(1);
  return chunks.map((chunk) => {
    const statusUrl = extractFirst(chunk, /data-status-url="([^"]+)"/);
    const id = statusUrl.match(/statuses\/(\d+)/)?.[1] || "";
    const dateText = extractFirst(chunk, /status-info__meta[\s\S]*?statuses\/\d+"[^>]*>([^<]+)<\/a>/);
    const text = cleanText(extractFirst(chunk, /<div class="snippet-clean-content">\s*([\s\S]*?)\s*<\/div>/) || "");
    return {
      id,
      dateText: decodeHtml(dateText),
      publishedAt: parseArchiveDate(dateText),
      archiveUrl: toAbsoluteUrl(statusUrl),
      originalUrl: "",
      text,
      context: "",
    };
  }).filter((item) => item.id && item.publishedAt);
}

function toFeedItem(item) {
  const text = item.text.trim();
  return {
    id: `trutharchive-${item.id}`,
    publishedAt: item.publishedAt,
    source: "Trump’s Truth",
    sourceTitle: "Archived @realDonaldTrump Truth Social post",
    sourceUrl: item.archiveUrl,
    originalUrl: item.originalUrl || "",
    spokenText: text || "（图片/视频帖，归档页暂无可提取正文）",
    context: item.context || "Trump’s Truth 公开归档；原帖来自 Truth Social。",
  };
}

async function requestText(url) {
  const attempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "text/html,application/xhtml+xml",
          "user-agent": "Jin10-Trump-Tracker-Prototype/1.0",
        },
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
      return response.text();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await delay(attempt * 1_000);
    }
  }

  throw lastError;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function parseArchiveDate(value) {
  const match = decodeHtml(value).match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4}),\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/);
  if (!match) return "";
  const [, monthName, day, year, rawHour, minute, meridiem] = match;
  let hour = Number(rawHour);
  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return `${year}-${MONTHS[monthName.toLowerCase()]}-${pad(day)} ${pad(hour)}:${minute}`;
}

function cleanText(html) {
  return decodeHtml(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function decodeHtml(value = "") {
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function extractExpectedTotal(html) {
  const value = extractFirst(html, /<h2 class="search-page__heading">\s*([\d,]+)\s+results/i);
  return value ? Number(value.replace(/,/g, "")) : 0;
}

function extractFirst(text, pattern) {
  const match = text.match(pattern);
  return match ? match[1].trim() : "";
}

function toAbsoluteUrl(value) {
  if (!value) return "";
  return value.startsWith("http") ? value : new URL(value, ORIGIN).toString();
}

function dedupeById(items) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function dedupeStrings(items) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") args.help = true;
    else if (token.startsWith("--")) args[token.slice(2)] = argv[index + 1];
  }
  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/fetch-trumps-truth-archive.js --from 2026-01-01 --to 2026-06-18 --out data/trump-feed.json

Options:
  --perPage 100          Archive page size.
  --maxPages 80          Safety cap.
  --hydrateEmpty false   Skip detail-page reads for media-only posts.`);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
