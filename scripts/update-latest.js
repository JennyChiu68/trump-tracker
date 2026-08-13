#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const RAW_FILE = path.join(ROOT, "data", "trump-feed.json");
const DELTA_FILE = path.join(ROOT, "data", "trump-feed.delta.json");

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const to = args.to || new Date().toISOString().slice(0, 10);
  const existing = await readJsonIfExists(RAW_FILE);
  const defaultFrom = existing?.window?.to || `${to.slice(0, 4)}-01-01`;
  const from = args.from || (defaultFrom > to ? to : defaultFrom);
  const fetchOutput = existing ? DELTA_FILE : RAW_FILE;

  await runNode([
    "scripts/fetch-trumps-truth-archive.js",
    "--from",
    from,
    "--to",
    to,
    "--out",
    fetchOutput,
  ]);

  if (existing) {
    await runNode(["scripts/merge-trump-feed.js", RAW_FILE, DELTA_FILE, RAW_FILE]);
  }

  await runNode(["scripts/build-release.js"]);
  console.log(`Latest release snapshot is ready through ${to}.`);
}

function runNode(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: ROOT, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed${signal ? ` (${signal})` : ""}: node ${args.join(" ")}`));
    });
  });
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--from" || token === "--to") args[token.slice(2)] = argv[index + 1];
  }
  return args;
}

function printHelp() {
  console.log(`Usage:
  npm run update:data
  npm run update:data -- --from 2026-08-01 --to 2026-08-13

Fetches the latest public archive delta, merges it into the local raw feed,
then rebuilds the quality-gated release JSON and browser snapshot.`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
