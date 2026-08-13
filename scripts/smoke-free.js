#!/usr/bin/env node

const fs = require("node:fs");

const html = fs.readFileSync("free.html", "utf8");
const css = fs.readFileSync("free.css", "utf8");
const script = fs.readFileSync("free.js", "utf8");

for (const expected of ["行情异动", "老话重提", "开通钻石会员", "upgradeDialog"]) {
  if (!html.includes(expected)) throw new Error(`Free preview is missing: ${expected}`);
}

for (const prohibited of ["snapshot.js", "app.js", "release-feed.json", "/api/trump-feed", "/api/trump-insights"]) {
  if (html.includes(prohibited) || script.includes(prohibited)) {
    throw new Error(`Free preview exposes paid data dependency: ${prohibited}`);
  }
}

if (!css.includes("trump-tracker-hero.png")) throw new Error("Free preview hero asset is missing");
if (!fs.existsSync("assets/trump-tracker-hero.png")) throw new Error("Free preview hero image does not exist");
if ((html.match(/data-panel=/g) || []).length !== 2) throw new Error("Free preview must contain exactly two feature panels");

console.log(JSON.stringify({ freePreview: "ok", paidDataExposed: false, panels: 2 }));
