#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const ACCOUNT_ID = "107780257626128497";
const ACCOUNT_HANDLE = "@realDonaldTrump";
const API_ORIGIN = "https://truthsocial.com";
const DEFAULT_OUT = path.join("data", "trump-feed.truthsocial.json");

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const to = args.to ? new Date(args.to) : new Date();
  const from = args.from ? new Date(args.from) : shiftDays(to, -90);
  const output = args.out || DEFAULT_OUT;
  const limit = Number(args.limit || 40);
  const maxPages = Number(args.maxPages || 80);
  const accountId = args.accountId || ACCOUNT_ID;

  assertDate(from, "--from");
  assertDate(to, "--to");

  const statuses = await fetchStatuses({ accountId, from, to, limit, maxPages });
  const items = statuses.map(toFeedItem).sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
  const payload = {
    generatedAt: new Date().toISOString(),
    window: {
      from: toDateKey(from),
      to: toDateKey(to),
      label: "过去3个月 Truth Social 原帖快照",
    },
    coverage: {
      mode: "truth-social",
      sourceLabel: "Truth Social 原帖",
      note: `已接入 ${ACCOUNT_HANDLE} Truth Social 原帖快照。`,
      truthSocial: {
        account: ACCOUNT_HANDLE,
        accountId,
        endpoint: `${API_ORIGIN}/api/v1/accounts/${accountId}/statuses`,
        connected: true,
      },
    },
    sources: [
      {
        name: "Truth Social",
        status: `${ACCOUNT_HANDLE} 原帖一次性快照`,
        connected: true,
      },
    ],
    items,
  };

  await fs.writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${items.length} Truth Social posts to ${output}`);
}

async function fetchStatuses({ accountId, from, to, limit, maxPages }) {
  const statuses = [];
  let maxId = "";

  for (let page = 0; page < maxPages; page += 1) {
    const url = new URL(`/api/v1/accounts/${accountId}/statuses`, API_ORIGIN);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("exclude_replies", "false");
    url.searchParams.set("only_replies", "false");
    url.searchParams.set("with_muted", "true");
    if (maxId) url.searchParams.set("max_id", maxId);

    const pageItems = await requestJson(url);
    if (!Array.isArray(pageItems) || pageItems.length === 0) break;

    for (const status of pageItems) {
      const createdAt = new Date(status.created_at);
      if (Number.isNaN(createdAt.getTime())) continue;
      if (createdAt > to) continue;
      if (createdAt >= from && !status.reblog) statuses.push(status);
    }

    const oldest = new Date(pageItems[pageItems.length - 1]?.created_at || "");
    if (oldest < from) break;
    maxId = pageItems[pageItems.length - 1]?.id;
    if (!maxId) break;
  }

  return dedupeById(statuses);
}

async function requestJson(url) {
  const headers = {
    accept: "application/json",
    "user-agent": "Jin10-Trump-Tracker-Prototype/1.0",
  };
  if (process.env.TRUTHSOCIAL_AUTH_TOKEN) {
    headers.authorization = `Bearer ${process.env.TRUTHSOCIAL_AUTH_TOKEN}`;
  }
  if (process.env.TRUTHSOCIAL_COOKIE) {
    headers.cookie = process.env.TRUTHSOCIAL_COOKIE;
  }

  const response = await fetch(url, { headers });
  const text = await response.text();
  if (!response.ok) {
    const isCloudflare = text.includes("Cloudflare") || text.includes("cf-error-details");
    const reason = isCloudflare ? "Cloudflare blocked the request" : text.slice(0, 220);
    throw new Error(`${response.status} ${response.statusText}: ${reason}`);
  }

  return JSON.parse(text);
}

function toFeedItem(status) {
  const text = stripHtml(status.content || "").trim();
  return {
    id: `truthsocial-${status.id}`,
    publishedAt: formatDateTime(status.created_at),
    source: "Truth Social",
    sourceTitle: `${ACCOUNT_HANDLE} Truth Social`,
    sourceUrl: status.url || `${API_ORIGIN}/${ACCOUNT_HANDLE}/posts/${status.id}`,
    spokenText: text,
    context: summarizeStatus(status),
  };
}

function summarizeStatus(status) {
  const parts = [];
  if (status.replies_count) parts.push(`${status.replies_count} replies`);
  if (status.reblogs_count) parts.push(`${status.reblogs_count} retruths`);
  if (status.favourites_count) parts.push(`${status.favourites_count} likes`);
  return parts.length ? parts.join(" · ") : "Truth Social 原帖";
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function dedupeById(items) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
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
  node scripts/fetch-truth-social.js --from 2026-03-18 --to 2026-06-18 --out data/trump-feed.json

Environment:
  TRUTHSOCIAL_AUTH_TOKEN  Optional bearer token if the API requires browser/auth state.
  TRUTHSOCIAL_COOKIE      Optional Cookie header captured from an allowed backend/browser session.

Notes:
  The direct Truth Social API may be blocked by Cloudflare in local/dev networks.
  This script is one-shot and does not poll.`);
}

function assertDate(date, label) {
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${label} date`);
}

function shiftDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(value) {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
