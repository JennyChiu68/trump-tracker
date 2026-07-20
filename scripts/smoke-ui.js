#!/usr/bin/env node

const fs = require("node:fs");
const { loadApp } = require("./ui-harness");

async function main() {
  const { context, elements, primaryButtons, filterButtons, vm } = await loadApp();

  const primaryList = elements.get("#primaryList");
  const primarySearch = elements.get("#primarySearchInput");
  const totalStatements = vm.runInContext("statements.length", context);
  const marketTotal = vm.runInContext("getMarketHistory().length", context);
  const publicHtml = fs.readFileSync("index.html", "utf8");

  if (totalStatements < 100) throw new Error(`Reliable history is unexpectedly small: ${totalStatements}`);
  if (publicHtml.includes("完整发言归档") || publicHtml.includes("statementList")) throw new Error("Full public archive remains in the page");
  if (elements.get("#primaryTitle").textContent !== "行情异动") throw new Error("Market module is not the default view");
  if (countMatches(primaryList.innerHTML, "market-record") !== Math.min(20, marketTotal)) throw new Error("Market initial pagination is incorrect");
  if (!primaryList.innerHTML.includes("市场判断") || !primaryList.innerHTML.includes("关键变量")) throw new Error("Market module is missing market context");
  if (primaryList.innerHTML.includes("等待确认")) throw new Error("Market module exposes ambiguous waiting copy");
  const prohibitedAdvice = ["偏多", "偏空", "做多", "做空", "买入", "卖出", "暂不交易"].filter((label) => primaryList.innerHTML.includes(label));
  if (prohibitedAdvice.length) throw new Error(`Market module exposes directional advice: ${prohibitedAdvice.join(", ")}`);

  primarySearch.value = "1000枚导弹";
  primarySearch.listeners.get("input")();
  if (countMatches(primaryList.innerHTML, "market-record") !== 1 || !primaryList.innerHTML.includes("1000枚导弹")) {
    throw new Error("Market search returned unrelated records");
  }
  elements.get("#clearPrimarySearch").listeners.get("click")();

  const marketLoadMore = primaryList.querySelector("[data-primary-load-more]");
  if (marketTotal > 20) {
    if (!marketLoadMore) throw new Error("Market module is missing historical pagination");
    marketLoadMore.listeners.get("click")();
    if (countMatches(primaryList.innerHTML, "market-record") !== Math.min(40, marketTotal)) throw new Error("Market module did not load the next page");
  }

  primaryButtons[1].listeners.get("click")();
  if (elements.get("#primaryTitle").textContent !== "老话重提") throw new Error("Repeat module did not activate");
  if (!primaryList.innerHTML.includes("repeat-history-group") || !primaryList.innerHTML.includes("本组包含")) throw new Error("Repeat module is missing grouped history");

  primarySearch.value = "__definitely_no_match__";
  primarySearch.listeners.get("input")();
  if (!primaryList.innerHTML.includes("没有匹配的重复观点")) throw new Error("Primary search returned unrelated repeat groups");
  elements.get("#clearPrimarySearch").listeners.get("click")();
  if (!primaryList.innerHTML.includes("repeat-history-group")) throw new Error("Clear primary search did not restore repeat history");

  const exposedSourceControls = ["原文与来源", "查看英文原文", "查看来源"].filter((label) => primaryList.innerHTML.includes(label));
  if (exposedSourceControls.length) throw new Error(`Source controls must remain hidden: ${exposedSourceControls.join(", ")}`);

  console.log(
    JSON.stringify({
      totalStatements,
      marketHistory: marketTotal,
      repeatGroups: vm.runInContext("summarizeNarratives().length", context),
      publicArchive: "none",
      directionalAdvice: "none",
    })
  );
}

function countMatches(value, needle) {
  return String(value).split(needle).length - 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
