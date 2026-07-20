#!/usr/bin/env node

const { loadApp } = require("./ui-harness");

async function main() {
  const { context, vm } = await loadApp();
  const items = JSON.parse(vm.runInContext("JSON.stringify(statements)", context));
  const failures = [];
  const blockedPattern = /中国|中方|中美|对华|涉华|习近平|台湾|香港|新疆|西藏|人民币|贸易战|\bchina\b|\bchinese\b|\bxi jinping\b|\btaiwan\b|\bcny\b|\bcnh\b|\byuan\b/i;
  const genericPattern = /相关问题|具体措辞可展开|我在这条发言中强调|我就.+发表表态/;
  const advicePattern = /偏多|偏空|做多|做空|买入|卖出|建议交易/;

  for (const item of items) {
    if (!item.isDirectSpeech) failures.push(`${item.id}: 非直接发言进入结果`);
    if (!item.translationAligned) failures.push(`${item.id}: 中英文语义锚点不一致`);
    if (/^RT\s+@/i.test(item.quote)) failures.push(`${item.id}: 转发进入结果`);
    if (blockedPattern.test(`${item.quote} ${item.speechCn} ${item.summary}`)) failures.push(`${item.id}: 涉华内容未屏蔽`);
    if (genericPattern.test(item.speechCn)) failures.push(`${item.id}: 使用无信息量占位文案`);
    if (advicePattern.test(`${item.verdict} ${item.verify}`)) failures.push(`${item.id}: 系统判断包含直接交易建议`);
  }

  const missile = items.find((item) => /1000 missiles.*locked and loaded/i.test(item.quote));
  if (missile && !/1000枚导弹/.test(missile.speechCn)) failures.push(`${missile.id}: 1000枚导弹发言被错误翻译`);

  const groups = new Map();
  for (const item of items) {
    const bucket = groups.get(item.speechCn) || new Set();
    bucket.add(String(item.quote || "").replace(/\s+/g, " ").trim());
    groups.set(item.speechCn, bucket);
  }
  const collisions = [...groups.entries()]
    .map(([speechCn, originals]) => ({ speechCn, originals: originals.size }))
    .filter((group) => group.originals >= 3)
    .sort((a, b) => b.originals - a.originals);
  const suspiciousCollisions = collisions.filter(
    (group) => group.originals > 12 && !/伊朗协议即将达成|伊朗绝不能拥有核武器|美联储|鲍威尔/.test(group.speechCn)
  );
  if (suspiciousCollisions.length) failures.push(`出现高风险模板碰撞：${JSON.stringify(suspiciousCollisions.slice(0, 5))}`);

  const topics = Object.fromEntries(
    [...new Set(items.map((item) => item.topic))].sort().map((topic) => [topic, items.filter((item) => item.topic === topic).length])
  );
  const result = {
    total: items.length,
    directSpeech: items.filter((item) => item.isDirectSpeech).length,
    alignedTranslations: items.filter((item) => item.translationAligned).length,
    uniqueChinese: new Set(items.map((item) => item.speechCn)).size,
    collisionGroups: collisions.length,
    topics,
  };

  if (failures.length) throw new Error(`${failures.slice(0, 20).join("\n")}\n审计失败项：${failures.length}`);
  console.log(JSON.stringify(result));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
