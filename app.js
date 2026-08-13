const snapshotPayload = window.TRUMP_FEED_SNAPSHOT || {
  generatedAt: new Date().toISOString(),
  window: {
    from: "2026-03-17",
    to: "2026-06-17",
    label: "三个月快照",
  },
  items: [],
};

const PAGE_SIZE = 40;
const PRIMARY_PAGE_SIZE = 20;
const FILTER_LABELS = {
  all: "全部消息",
  focus: "值得关注",
  impact: "高敏感",
  repeat: "同观点",
};

let activeModule = "market";
let selectedTradeTopic = null;
let selectedRepeatKey = null;
let selectedEventTopic = null;
let primaryModule = "market";
let primaryLimit = PRIMARY_PAGE_SIZE;
let currentFilter = "all";
let selectedDay = "";
let selectedNarrativeKey = "";
let renderLimit = PAGE_SIZE;
let statements = [];
let currentWindow = snapshotPayload.window;
const HIGH_IMPACT_THRESHOLD = 65;
const SHORT_SPEECH_LIMIT = 220;
const CNN_IRAN_DEAL_REFERENCE = 37;
const POST_CNN_IRAN_DEAL_ADDS = 2;
const CHINA_BLOCK_TERMS = [
  "中国",
  "中方",
  "中美",
  "对华",
  "涉华",
  "习近平",
  "中国领导人",
  "中国国家主席",
  "台湾",
  "香港",
  "新疆",
  "西藏",
  "人民币",
  "离岸人民币",
  "在岸人民币",
  "贸易战",
  "中美贸易",
  "china",
  "chinese",
  "president xi",
  "xi jinping",
  "xi, of china",
  "people's republic of china",
  "people’s republic of china",
  "beijing",
  "prc",
  "ccp",
  "taiwan",
  "hong kong",
  "xinjiang",
  "tibet",
  "trade war",
  "china trade",
  "chinese goods",
  "chinese products",
  "chinese communist",
  "cny",
  "cnh",
  "renminbi",
  "yuan",
];
const REVIEWED_SPEECH_CN = {
  "trutharchive-40393": "我认为最高法院关于出生公民权和关税的负面裁决，令美国损失了数万亿美元和国际声望。",
  "trutharchive-40398": "我宣布和平委员会已就哈马斯及加沙其他武装组织全面解除武装达成协议；协议将分阶段执行，以军随后撤出，国际稳定部队将协助新的巴勒斯坦警察维护安全。",
  "trutharchive-40453": "我说伊朗及其他中东国家已请求美方暂缓打击，并称协议框架包括立即全面开放霍尔木兹海峡、结束伊朗核威胁；我同意取消打击，但以迅速达成协议为条件。",
  "trutharchive-40464": "我说雪佛龙重返委内瑞拉并有望扩大收益，也要求石油公司立即下调消费者端的成品油价格。",
  "trutharchive-40465": "我指责伊朗一边请求谈判一边否认谈判，并称美国海军已控制霍尔木兹海峡；除非达成协议或伊朗完全投降，否则封锁不会解除，伊朗也绝不能拥有核武器。",
  "trutharchive-40554": "我宣布把《濒危物种法》恢复到原定适用范围，以减少对石油、天然气、木材、住房和基础设施建设的监管限制。",
  "trutharchive-40703": "我说伊朗要求获得五个月军事冲突的损失赔偿；作为回应，我也要求伊朗赔偿美军、受害者家属和伊朗抗议者，并已指示把这一要求纳入今后的所有谈判。",
  "trutharchive-40758": "我说美国已完全控制霍尔木兹海峡，并考虑继续保持控制；海军封锁形成“钢铁之墙”，伊朗目前无力改变局面。",
  "trutharchive-40158": "我已指示军方：每当伊朗造成一名美国军人死亡，伊朗都将为此付出数倍代价。",
  "trutharchive-40161": "我与英国新任首相安迪·伯纳姆进行了很好的通话，讨论了北海石油、贸易、军事联盟和霍尔木兹海峡排雷等议题。",
  "trutharchive-40176": "我已指示政府允许所有美国航空公司开通直飞黎巴嫩的航班，希望其他国家也这样做。",
  "trutharchive-40182": "自2026年8月1日起，进口仿制药未来两年继续实行零关税，随后一年升至100%，再之后升至200%，以推动仿制药生产回流美国。",
  "trutharchive-40212": "从现在起，伊朗每次在霍尔木兹海峡向船只开火，美国都将摧毁一座桥梁或发电厂，包括德黑兰附近或市内的目标。",
  "trutharchive-40218": "美国与沙特的民用核协议将获批准，但条件是沙特加入《亚伯拉罕协议》；美国不反对不进行铀浓缩的民用核设施。",
  "trutharchive-40219": "如果胡塞武装再次向船只开火，美国将认定伊朗对此负责，并对伊朗和胡塞武装实施重大军事惩罚。",
  "trutharchive-40220": "从现在起，船只、货物及相关损失将由美国掌控的伊朗资金赔付。",
  "trutharchive-40233": "加拿大取消邀请美国参加戈迪·豪大桥开通仪式，但原协议已被修改，美国现在将获得50%的利润；加拿大仍在向美国支付高额关税。",
  "trutharchive-40235": "欧盟再次针对美国企业处以巨额罚款；我将立即启动301调查，并预计尽快对欧盟加征高额关税。",
};
const topicGrid = document.querySelector("#topicGrid");
const signalDetail = document.querySelector("#signalDetail");
const repeatGrid = document.querySelector("#repeatGrid");
const eventGrid = document.querySelector("#eventGrid");
const searchInput = document.querySelector("#searchInput");
const clearSearch = document.querySelector("#clearSearch");
const statementList = document.querySelector("#statementList");
const feedTitle = document.querySelector("#feedTitle");
const primaryList = document.querySelector("#primaryList");
const primarySearchInput = document.querySelector("#primarySearchInput");
const clearPrimarySearch = document.querySelector("#clearPrimarySearch");

function init() {
  document.querySelectorAll("[data-primary-module]").forEach((button) => {
    button.addEventListener("click", () => {
      primaryModule = button.dataset.primaryModule || "market";
      primaryLimit = PRIMARY_PAGE_SIZE;
      updatePrimaryActiveState();
      renderPrimaryModule();
      document.querySelector("#primaryPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  primarySearchInput?.addEventListener("input", () => {
    primaryLimit = PRIMARY_PAGE_SIZE;
    updatePrimarySearchState();
    renderPrimaryModule();
  });

  clearPrimarySearch?.addEventListener("click", () => {
    primarySearchInput.value = "";
    primarySearchInput.focus();
    primaryLimit = PRIMARY_PAGE_SIZE;
    updatePrimarySearchState();
    renderPrimaryModule();
  });

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter || "all";
      selectedDay = "";
      selectedNarrativeKey = "";
      renderLimit = PAGE_SIZE;
      updateFilterTabs(currentFilter);
      updateMetricActiveState();
      renderStatements();
    });
  });

  document.querySelectorAll("[data-metric-action]").forEach((button) => {
    button.addEventListener("click", () => applyMetricFilter(button.dataset.metricAction || ""));
  });

  searchInput?.addEventListener("input", () => {
    renderLimit = PAGE_SIZE;
    updateClearSearchState();
    renderStatements();
  });

  clearSearch?.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.focus();
    renderLimit = PAGE_SIZE;
    updateClearSearchState();
    renderStatements();
  });

  renderLoadingState();
  loadFeed();
}

async function loadFeed() {
  try {
    const response = await fetch("./api/trump-feed", { cache: "default" });
    if (!response.ok) throw new Error("feed unavailable");
    applyPayload(await response.json());
  } catch (error) {
    if (snapshotPayload.items?.length) applyPayload(snapshotPayload);
    else renderFatalState();
  }
}

function renderLoadingState() {
  document.querySelector("#primaryPanel")?.setAttribute("aria-busy", "true");
  if (primaryList) primaryList.innerHTML = '<div class="status-state"><span class="status-spinner" aria-hidden="true"></span><strong>正在整理发言</strong></div>';
  if (statementList) statementList.innerHTML = '<div class="status-state"><span class="status-spinner" aria-hidden="true"></span><strong>正在载入归档</strong></div>';
}

function renderFatalState() {
  document.querySelector("#primaryPanel")?.setAttribute("aria-busy", "false");
  const message = '<div class="status-state error-state"><strong>数据载入失败</strong><span>请稍后刷新页面</span></div>';
  if (primaryList) primaryList.innerHTML = message;
  if (statementList) statementList.innerHTML = message;
}

function applyPayload(payload) {
  currentWindow = payload.window || snapshotPayload.window;
  statements = attachNarrativeStats(
    normalizeFeed(payload.items || snapshotPayload.items).filter(
      (item) =>
        item.isDirectSpeech &&
        item.speechCn &&
        item.translationAligned &&
        !isGenericGeneratedSpeech(item.speechCn) &&
        !isLowValuePoliticalEndorsement(item) &&
        !isChinaRelatedContent(item)
    )
  );

  document.querySelector("#primaryPanel")?.setAttribute("aria-busy", "false");

  setText("#windowLabel", `${formatWindowDate(currentWindow.from)} - ${formatWindowDate(currentWindow.to)}`);
  setText("#archiveWindowLabel", `${formatWindowDate(currentWindow.from)} - ${formatWindowDate(currentWindow.to)}`);
  updateHeaderMetrics();
  updateFilterTabs(currentFilter);
  updateClearSearchState();
  updatePrimarySearchState();
  updatePrimaryActiveState();
  renderPrimaryModule();
  renderStatements();
}

function updateHeaderMetrics() {
  updateMetricActiveState();
}

function applyMetricFilter(action) {
  const isActive =
    (action === "latest" && Boolean(selectedDay)) ||
    (action === "impact" && currentFilter === "impact" && !selectedDay && !selectedNarrativeKey) ||
    (action === "repeat" && Boolean(selectedNarrativeKey));

  if (isActive) {
    currentFilter = "all";
    selectedDay = "";
    selectedNarrativeKey = "";
  } else if (action === "latest") {
    currentFilter = "focus";
    selectedDay = getLatestStatementDay();
    selectedNarrativeKey = "";
  } else if (action === "impact") {
    currentFilter = "impact";
    selectedDay = "";
    selectedNarrativeKey = "";
  } else if (action === "repeat") {
    currentFilter = "repeat";
    selectedDay = "";
    selectedNarrativeKey = getTopRepeatMetric().key;
  }

  renderLimit = PAGE_SIZE;
  updateFilterTabs(currentFilter);
  updateMetricActiveState();
  renderStatements();
  document.querySelector("#feedPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getLatestStatementDay() {
  return statements.filter(isWorthWatching).reduce((latest, item) => {
    const day = String(item.date || "").slice(0, 10);
    return day && (!latest || day.localeCompare(latest) > 0) ? day : latest;
  }, "");
}

function getTopRepeatMetric() {
  const top = summarizeNarratives()
    .slice()
    .sort((a, b) => metricNumber(b.displayCount || b.count) - metricNumber(a.displayCount || a.count))[0];
  if (!top) return { countLabel: "0", topicLabel: "--", key: "" };
  return {
    countLabel: `${top.displayCount || top.count}`,
    topicLabel: top.title.length > 6 ? `${top.title.slice(0, 6)}...` : top.title,
    key: top.key,
  };
}

function metricNumber(value) {
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function setActiveModule(nextModule, shouldScroll = false) {
  const allowed = new Set(["market", "repeat", "events"]);
  activeModule = allowed.has(nextModule) ? nextModule : "market";

  document.querySelectorAll("[data-module-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.modulePanel !== activeModule;
  });

  updateMetricActiveState();
  if (shouldScroll) document.querySelector(".workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateMetricActiveState() {
  document.querySelectorAll("[data-metric-action]").forEach((button) => {
    const action = button.dataset.metricAction;
    const active =
      (action === "latest" && Boolean(selectedDay)) ||
      (action === "impact" && currentFilter === "impact" && !selectedDay && !selectedNarrativeKey) ||
      (action === "repeat" && Boolean(selectedNarrativeKey));
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function updateClearSearchState() {
  if (clearSearch) clearSearch.hidden = !searchInput?.value;
}

function updatePrimarySearchState() {
  if (clearPrimarySearch) clearPrimarySearch.hidden = !primarySearchInput?.value;
}

function updatePrimaryActiveState() {
  document.querySelectorAll("[data-primary-module]").forEach((button) => {
    const active = button.dataset.primaryModule === primaryModule;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  document.querySelector(".module-switcher")?.setAttribute("data-module", primaryModule);
  document.querySelector("#primaryPanel")?.setAttribute("data-module", primaryModule);
}

function getMarketHistory() {
  return statements
    .filter(isMarketMovingStatement)
    .map((item) => ({
      ...item,
      signal: tradeSignalForTopic(item.topic, item, item.impact),
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.impact - a.impact);
}

function renderPrimaryModule() {
  if (!primaryList || !primarySearchInput) return;
  const query = primarySearchInput.value.trim().toLowerCase();
  const meta = {
    market: { title: "行情异动", kicker: "市场传导", placeholder: "搜索品种、主题、关键词" },
    repeat: { title: "老话重提", kicker: "重复统计", placeholder: "搜索重复观点" },
  }[primaryModule] || { title: "行情异动", kicker: "市场传导", placeholder: "搜索品种、主题、关键词" };

  setText("#primaryTitle", meta.title);
  setText("#primaryKicker", meta.kicker);
  primarySearchInput.placeholder = meta.placeholder;

  if (primaryModule === "repeat") {
    const groups = summarizeNarratives().filter((group) => matchesRepeatGroupSearch(group, query));
    primaryList.innerHTML = groups.length ? groups.map(renderRepeatHistoryGroup).join("") : '<div class="empty-state">没有匹配的重复观点</div>';
    return;
  }

  const source = getMarketHistory();
  const filtered = source.filter((item) => !query || getSearchText(item, query).includes(query));
  const visible = filtered.slice(0, primaryLimit);
  const records = visible.length
    ? `${visible.map(renderMarketHistoryRow).join("")}${renderPrimaryLoadMore(visible.length, filtered.length)}`
    : '<div class="empty-state">没有匹配的历史记录</div>';
  primaryList.innerHTML = records;

  primaryList.querySelector("[data-primary-load-more]")?.addEventListener("click", () => {
    primaryLimit += PRIMARY_PAGE_SIZE;
    renderPrimaryModule();
  });
}

function renderPrimaryLoadMore(visibleCount, totalCount) {
  if (visibleCount >= totalCount) return "";
  return `<button class="load-more primary-more" type="button" data-primary-load-more>继续加载 ${Math.min(PRIMARY_PAGE_SIZE, totalCount - visibleCount)} 条</button>`;
}

function renderMarketHistoryRow(item) {
  const date = formatDateParts(item.date);
  const signal = item.signal || tradeSignalForTopic(item.topic, item, item.impact);
  const views = signal.views
    .slice(0, 3)
    .map((view) => `<span class="trade-chip ${view.type}"><strong>${escapeHtml(view.asset)}</strong>${escapeHtml(view.label)}</span>`)
    .join("");
  return `
    <article class="primary-record market-record">
      <div class="record-time"><strong>${escapeHtml(date.day)}</strong><span>${escapeHtml(date.time)}</span></div>
      <div class="record-body">
        <div class="record-topline">
          <span class="topic-pill">${escapeHtml(item.topic)}</span>
          <em class="signal-badge ${signal.action}">${escapeHtml(signal.actionLabel)}</em>
        </div>
        <p class="record-quote"><span>特朗普：</span>${escapeHtml(item.speechCn)}</p>
        <div class="instrument-strip record-instruments">${views}</div>
        <div class="market-rows">
          <div><span>市场判断</span><strong>${escapeHtml(signal.note)}</strong></div>
          <div><span>关键变量</span><strong>${escapeHtml(signal.trigger.replace(/^触发：/, ""))}</strong></div>
        </div>
      </div>
    </article>
  `;
}

function matchesRepeatGroupSearch(group, query) {
  if (!query) return true;
  const occurrences = getNarrativeOccurrences(group.key);
  const searchable = [group.title, group.topic, group.note, ...occurrences.map((item) => `${item.speechCn} ${item.quote}`)]
    .join(" ")
    .toLowerCase();
  return searchable.includes(query);
}

function getNarrativeOccurrences(key) {
  return statements
    .filter((item) => item.narrative?.key === key)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function renderRepeatHistoryGroup(group) {
  const occurrences = getNarrativeOccurrences(group.key);
  const countLabel = group.displayCount || String(group.count);
  return `
    <details class="repeat-history-group">
      <summary>
        <span class="repeat-summary-copy">
          <strong>${escapeHtml(group.title)}</strong>
          <small>${escapeHtml(group.topic)} · 最近 ${escapeHtml(formatDateLabel(group.latestDate))}</small>
        </span>
        <span class="repeat-summary-count"><strong>${escapeHtml(countLabel)}</strong><small>次</small></span>
      </summary>
      <div class="repeat-history-body">
        <p>${escapeHtml(group.note)}</p>
        <div class="repeat-archive-label">本组包含 ${occurrences.length} 条历史记录</div>
        <div class="repeat-occurrences">
          ${occurrences.map(renderRepeatOccurrence).join("")}
        </div>
      </div>
    </details>
  `;
}

function renderRepeatOccurrence(item) {
  return `
    <article class="repeat-occurrence">
      <time>${escapeHtml(formatDateLabel(item.date))}</time>
      <p><span>特朗普：</span>${escapeHtml(item.speechCn)}</p>
    </article>
  `;
}

function normalizeFeed(items) {
  return items.map((item) => {
    const quote = item.spokenText || item.text || item.quote || "";
    const context = item.context || "";
    const analysis = analyzeText(`${quote} ${context}`);
    const reviewedSpeechCn = REVIEWED_SPEECH_CN[item.id] || "";
    const isDirectSpeech = item.isDirectSpeech === true || Boolean(reviewedSpeechCn) || isDirectTrumpSpeech(quote);
    const speechCn = item.speechCn || reviewedSpeechCn || buildChineseSpeech(quote, analysis);
    return {
      id: item.id,
      date: item.publishedAt || item.date || "",
      source: normalizeSourceName(item.source || "未知来源"),
      sourceUrl: item.sourceUrl || "",
      sourceTitle: item.sourceTitle || item.source || "来源",
      quote,
      speechCn,
      translationAligned: isTranslationAligned(quote, speechCn),
      summary: buildChineseSummary(quote, analysis),
      isDirectSpeech,
      forceFocus: Boolean(item.forceFocus),
      context,
      ...analysis,
    };
  });
}

function isLowValuePoliticalEndorsement(item) {
  const text = String(item.quote || "").toLowerCase();
  return (
    /complete and total endorsement|great honor to endorse|total endorsement/.test(text) ||
    /\brunning for (?:the )?(?:u\.s\. )?(?:senate|congress|governor|attorney general|secretary of state|lieutenant governor)\b/.test(text)
  );
}

function isChinaRelatedContent(item) {
  const text = [
    item.quote,
    item.context,
    item.sourceTitle,
    item.speechCn,
    item.summary,
  ]
    .join(" ")
    .toLowerCase();

  return CHINA_BLOCK_TERMS.some((term) => text.includes(term));
}

function isGenericGeneratedSpeech(value) {
  return [
    "我批评媒体、民主党或激进左翼的说法，并强调自己的立场。",
    "我强调伊朗、核问题或霍尔木兹局势仍是关键。",
    "我强调伊朗、核问题或霍尔木兹局势的变化，重点仍要看协议文本和通行情况。",
    "我说倒影池或公共设施遭到破坏，相关修复和执法会推进。",
    "我强调贸易和关税政策要让美国获得更公平待遇。",
    "我继续向美联储和鲍威尔施压，要求更快调整利率。",
    "我强调股市、就业、油价、房贷利率或通胀等美国经济表现。",
    "我认为边境和移民执法必须更强硬，美国需要继续驱逐非法犯罪移民。",
    "我强调边境和移民执法必须更强硬。",
    "我提到相关选举胜利，并强调这是重要政治信号。",
    "我提到某名政治人物选举失利，并将其归因于政治立场或行为。",
    "我认为关税让美国重新获得公平待遇，其他国家不能继续占美国便宜。",
    "我宣布支持这名候选人，并呼吁选民投票。",
    "我宣布给予这名候选人完全、彻底的支持，并呼吁选民出来投票。",
    "我呼吁选民投票支持相关候选人。",
    "我谈到一名候选人参选，并强调其支持MAGA和美国优先路线。",
    "我说这次选举取得重要胜利。",
    "我说这名政治人物选举失利。",
    "我提到民调或支持率变化，重点涉及选举政治。",
    "我强调出现新的纪录，重点涉及综合政治风险。",
    "我提到刚完成一场重要会面。",
    "我表达了感谢。",
  ].includes(String(value || "").trim());
}

function isTranslationAligned(quote, speechCn) {
  const source = String(quote || "").toLowerCase();
  const translated = String(speechCn || "");
  if (!source || !translated) return false;
  if (hasCjk(quote)) return true;

  const anchors = [
    [/和平示威者|抗议者/, /peaceful protest(?:e|o)rs?|protest(?:e|o)rs?/i],
    [/1000枚导弹|一千枚导弹/, /1000 missiles|one thousand missiles/i],
    [/伊朗/, /iran|iranian/i],
    [/霍尔木兹|海峡/, /hormuz|strait/i],
    [/核武器|核查|核协议/, /nuclear|weapon inspections?/i],
    [/关税/, /tariffs?/i],
    [/美联储|鲍威尔|降息/, /federal reserve|powell|interest rates?|rate cuts?/i],
    [/原油|油价|汽油|加油站/, /oil|crude|gas prices?|gasoline|fuel|pump/i],
    [/戴尔/, /dell/i],
    [/美光/, /micron/i],
    [/照片身份证明/, /photo i\.?d\.?/i],
    [/公民身份证明/, /proof of citizenship/i],
    [/邮寄投票/, /mail-in ballots?/i],
    [/倒影池/, /reflecting pool/i],
    [/委内瑞拉/, /venezuela/i],
  ];

  return anchors.every(([translatedPattern, sourcePattern]) => !translatedPattern.test(translated) || sourcePattern.test(source));
}

function attachNarrativeStats(items) {
  const stats = new Map();
  const tagged = items.map((item) => {
    const narrative = detectNarrative(item);
    if (!narrative) return { ...item, narrative: null };
    const bucket = stats.get(narrative.key) || {
      ...narrative,
      count: 0,
      latestDate: "",
      impactTotal: 0,
    };
    bucket.count += 1;
    bucket.impactTotal += item.impact;
    if (!bucket.latestDate || item.date.localeCompare(bucket.latestDate) > 0) bucket.latestDate = item.date;
    stats.set(narrative.key, bucket);
    return { ...item, narrative };
  });

  return tagged.map((item) => {
    if (!item.narrative) {
      return {
        ...item,
        narrativeCount: 0,
        narrativeLatestDate: "",
        narrativeTitle: "",
        narrativeNote: "",
        narrativePriority: 0,
      };
    }
    const stat = stats.get(item.narrative.key);
    const display = narrativeDisplayMeta(stat, tagged);
    return {
      ...item,
      narrativeCount: stat.count,
      narrativeCountLabel: display.countLabel || `${stat.count}`,
      narrativeLatestDate: stat.latestDate,
      narrativeTitle: display.title || stat.title,
      narrativeNote: display.note || stat.note,
      narrativePriority: stat.priority,
    };
  });
}

function analyzeText(text) {
  const normalized = stripUrls(text).toLowerCase();
  const topic = inferTopic(normalized);
  const signals = detectSignals(normalized);
  const intent = inferIntent(topic, signals);
  const impact = clamp(topic.baseImpact + signals.detail * 8 + signals.verifiable * 2 + signals.threat * 10 + signals.repeat * 4, 18, 94);
  const novelty = clamp(72 - signals.repeat * 18 - signals.vague * 12 + signals.detail * 12 + signals.verifiable * 4, 8, 92);
  const confidence = clamp(34 + signals.detail * 14 + signals.verifiable * 12 - signals.vague * 8 - signals.repeat * 4, 12, 88);

  return {
    topic: topic.name,
    intent,
    novelty,
    repeat: 100 - novelty,
    confidence,
    impact,
    assets: topic.assets,
    verdict: buildVerdict(topic, signals, novelty, confidence),
    verify: buildVerify(topic, signals),
  };
}

function renderRepeats() {
  if (!repeatGrid) return;
  const items = summarizeNarratives().slice(0, 6);
  if (selectedRepeatKey === null || (selectedRepeatKey && !items.some((item) => item.key === selectedRepeatKey))) {
    selectedRepeatKey = items[0]?.key || "";
  }

  repeatGrid.innerHTML = items
    .map((item) => `
      <div class="tool-item ${item.key === selectedRepeatKey ? "expanded" : ""}">
        <button class="tool-row repeat-row ${item.key === selectedRepeatKey ? "active" : ""}" type="button" role="option" data-repeat-key="${escapeAttribute(item.key)}" aria-selected="${item.key === selectedRepeatKey}" aria-expanded="${item.key === selectedRepeatKey}">
          <span class="row-accent ${item.level}" aria-hidden="true"></span>
          <span class="row-copy">
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(item.topic)} · ${escapeHtml(formatDateLabel(item.latestDate))}</small>
          </span>
          <span class="row-value repeat-value"><strong>${escapeHtml(item.displayCount || String(item.count))}</strong><small>次</small></span>
        </button>
        ${item.key === selectedRepeatKey ? `<div class="inline-inspector">${renderRepeatInspector(item)}</div>` : ""}
      </div>
    `)
    .join("");
  repeatGrid.querySelectorAll("[data-repeat-key]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.repeatKey || "";
      selectedRepeatKey = selectedRepeatKey === key ? "" : key;
      renderRepeats();
    });
  });
}

function renderRepeatInspector(item) {
  return `
    <div class="inspector-head">
      <div>
        <span>当前观点</span>
        <strong>${escapeHtml(item.title)}</strong>
      </div>
      <em class="count-badge">${escapeHtml(item.displayCount || String(item.count))}次</em>
    </div>
    <blockquote class="speech-block"><span>最近原话</span>特朗普：${escapeHtml(item.latestSpeech || "暂无发言摘录")}</blockquote>
    <div class="analysis-table">
      <div><span>重复判断</span><strong>${escapeHtml(item.levelLabel)}</strong></div>
      <div><span>市场含义</span><strong>${escapeHtml(item.note)}</strong></div>
      <div><span>最近出现</span><strong>${escapeHtml(formatDateLabel(item.latestDate))}</strong></div>
    </div>
  `;
}

function summarizeNarratives() {
  const byKey = new Map();
  statements.forEach((item) => {
    if (!item.narrative) return;
    const key = item.narrative.key;
    const bucket = byKey.get(key) || {
      ...item.narrative,
      count: 0,
      latestDate: "",
      latestSpeech: "",
      sourceUrl: "",
      impactTotal: 0,
    };
    bucket.count += 1;
    bucket.impactTotal += item.impact;
    if (!bucket.latestDate || item.date.localeCompare(bucket.latestDate) > 0) {
      bucket.latestDate = item.date;
      bucket.latestSpeech = item.speechCn;
      bucket.sourceUrl = item.sourceUrl;
    }
    byKey.set(key, bucket);
  });

  return [...byKey.values()]
    .filter((item) => item.count >= 3 && item.priority >= 70)
    .map((item) => {
      const avgImpact = Math.round(item.impactTotal / item.count);
      const level = item.count >= 30 ? "hot" : item.count >= 10 ? "warm" : "mild";
      const display = narrativeDisplayMeta(item, statements);
      return {
        ...item,
        avgImpact,
        level,
        levelLabel: level === "hot" ? "高频重复" : level === "warm" ? "重复出现" : "偶发重复",
        displayCount: display.countLabel || String(item.count),
        latestLabel: display.latestLabel || `${item.count} 次 · 最近 ${formatDateLabel(item.latestDate)}`,
        note: display.note || item.note,
      };
    })
    .sort((a, b) => b.priority - a.priority || b.count - a.count || b.avgImpact - a.avgImpact);
}

function narrativeDisplayMeta(stat, sourceItems) {
  if (stat.key !== "iran_deal_close") return {};

  const strictCount = sourceItems.filter((item) => isStrictIranDealClaim(item.quote || "")).length;
  const broadCount = sourceItems.filter((item) => isCnnLikeIranDealClaim(item.quote || "")).length;
  const detectedPostCnnAdds = sourceItems.filter((item) => {
    const raw = item.quote || "";
    return item.date > "2026-06-09 15:30" && isCnnLikeIranDealClaim(raw) && !isArchiveMediaOrRepost(raw);
  }).length;
  const postCnnAdds = Math.max(POST_CNN_IRAN_DEAL_ADDS, detectedPostCnnAdds);
  const cnnEstimate = CNN_IRAN_DEAL_REFERENCE + postCnnAdds;

  return {
    countLabel: `约${cnnEstimate}`,
    latestLabel: `CNN 6/9：${CNN_IRAN_DEAL_REFERENCE} · 当前约${cnnEstimate}`,
    note: `CNN ${CNN_IRAN_DEAL_REFERENCE} 次是历史参照；后续又出现 ${postCnnAdds} 条。交易仍看协议文本、伊朗确认、霍尔木兹。`,
  };
}

function renderTopics() {
  if (!topicGrid) return;
  const items = summarizeTradeSignals().slice(0, 6);
  if (selectedTradeTopic === null || (selectedTradeTopic && !items.some((item) => item.topic === selectedTradeTopic))) {
    selectedTradeTopic = items[0]?.topic || "";
  }

  topicGrid.innerHTML = items
    .map((item) => `
      <button class="signal-card ${item.topic === selectedTradeTopic ? "active" : ""}" type="button" role="option" data-trade-topic="${escapeAttribute(item.topic)}" aria-selected="${item.topic === selectedTradeTopic}">
        <span class="signal-card-top">
          <strong>${escapeHtml(item.topic)}</strong>
          <em class="signal-card-status ${item.action}">${escapeHtml(item.actionLabel)}</em>
        </span>
        <span class="signal-card-quote">${escapeHtml(compactQuote(item.latestSpeech, 42))}</span>
        <small>${escapeHtml(formatDateLabel(item.latestDate))}</small>
      </button>
    `)
    .join("");

  const selected = items.find((item) => item.topic === selectedTradeTopic) || items[0];
  if (signalDetail) signalDetail.innerHTML = selected ? renderTradeInspector(selected) : "";

  topicGrid.querySelectorAll("[data-trade-topic]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedTradeTopic = button.dataset.tradeTopic || "";
      renderTopics();
    });
  });

  signalDetail?.querySelector("[data-topic-feed]")?.addEventListener("click", () => {
    searchInput.value = selected?.topic || "";
    currentFilter = "all";
    selectedDay = "";
    selectedNarrativeKey = "";
    renderLimit = PAGE_SIZE;
    updateFilterTabs(currentFilter);
    updateMetricActiveState();
    updateClearSearchState();
    renderStatements();
    document.querySelector("#feedPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function renderTradeInspector(item) {
  const views = item.views
    .map((view) => `<span class="trade-chip ${view.type}"><strong>${escapeHtml(view.asset)}</strong>${escapeHtml(view.label)}</span>`)
    .join("");
  return `
    <div class="inspector-head">
      <div>
        <span>当前信号</span>
        <strong>${escapeHtml(item.topic)}</strong>
      </div>
      <em class="signal-badge ${item.action}">${escapeHtml(item.actionLabel)}</em>
    </div>
    <blockquote class="speech-block"><span>特朗普原话</span>特朗普：${escapeHtml(item.latestSpeech || "暂无发言摘录")}</blockquote>
    <div class="instrument-strip">${views}</div>
    <div class="analysis-table">
      <div><span>市场判断</span><strong>${escapeHtml(item.note)}</strong></div>
      <div><span>关键变量</span><strong>${escapeHtml(item.trigger.replace(/^触发：/, ""))}</strong></div>
      <div><span>发言时间</span><strong>${escapeHtml(formatDateLabel(item.latestDate))}</strong></div>
    </div>
    <div class="signal-actions">
      <button class="signal-feed-button" type="button" data-topic-feed="${escapeAttribute(item.topic)}">查看相关消息</button>
    </div>
  `;
}

function renderEvents() {
  if (!eventGrid) return;
  const items = summarizeTrackedEvents().slice(0, 6);
  if (selectedEventTopic === null || (selectedEventTopic && !items.some((item) => item.topic === selectedEventTopic))) {
    selectedEventTopic = items[0]?.topic || "";
  }

  eventGrid.innerHTML = items
    .map((item) => `
      <div class="tool-item ${item.topic === selectedEventTopic ? "expanded" : ""}">
        <button class="tool-row event-row ${item.topic === selectedEventTopic ? "active" : ""}" type="button" role="option" data-event-topic="${escapeAttribute(item.topic)}" aria-selected="${item.topic === selectedEventTopic}" aria-expanded="${item.topic === selectedEventTopic}">
          <span class="row-accent ${item.stateClass}" aria-hidden="true"></span>
          <span class="row-copy">
            <strong>${escapeHtml(item.topic)}</strong>
            <small>${escapeHtml(formatDateLabel(item.latestDate))} · ${escapeHtml(compactQuote(item.latestSpeech, 34))}</small>
          </span>
          <span class="row-value event-value ${item.stateClass}">${escapeHtml(item.state)}</span>
        </button>
        ${item.topic === selectedEventTopic ? `<div class="inline-inspector">${renderEventInspector(item)}</div>` : ""}
      </div>
    `)
    .join("");
  eventGrid.querySelectorAll("[data-event-topic]").forEach((button) => {
    button.addEventListener("click", () => {
      const topic = button.dataset.eventTopic || "";
      selectedEventTopic = selectedEventTopic === topic ? "" : topic;
      renderEvents();
    });
  });
}

function renderEventInspector(item) {
  const assets = item.assets.slice(0, 3).map((asset) => `<span class="asset-tag">${escapeHtml(asset)}</span>`).join("");
  return `
    <div class="inspector-head">
      <div>
        <span>跟踪事件</span>
        <strong>${escapeHtml(item.topic)}</strong>
      </div>
      <em class="event-badge ${item.stateClass}">${escapeHtml(item.state)}</em>
    </div>
    <blockquote class="speech-block"><span>当前口径</span>特朗普：${escapeHtml(item.latestSpeech)}</blockquote>
    <div class="asset-strip">${assets}</div>
    <div class="analysis-table">
      <div><span>本次变化</span><strong>${escapeHtml(item.change)}</strong></div>
      <div><span>下一步观察</span><strong>${escapeHtml(item.next)}</strong></div>
      <div><span>最近更新</span><strong>${escapeHtml(formatDateLabel(item.latestDate))}</strong></div>
    </div>
  `;
}

function summarizeTrackedEvents() {
  const allowedTopics = new Set(["伊朗协议", "中东局势", "美联储", "能源", "关税", "美股个股"]);
  const byTopic = new Map();

  statements.forEach((item) => {
    if (!allowedTopics.has(item.topic) || !isWorthWatching(item)) return;
    const current = byTopic.get(item.topic);
    if (!current || item.date.localeCompare(current.date) > 0 || (item.date === current.date && item.impact > current.impact)) {
      byTopic.set(item.topic, item);
    }
  });

  return [...byTopic.values()]
    .map((item) => {
      const decision = buildDecisionRows(item);
      const repeated = item.narrativeCount >= 3 && item.narrativePriority >= 70;
      const isNew = item.novelty >= 56;
      const state = item.impact >= HIGH_IMPACT_THRESHOLD ? "重点观察" : repeated ? "持续口径" : isNew ? "出现变化" : "信息不足";
      const stateClass = item.impact >= HIGH_IMPACT_THRESHOLD ? "hot" : isNew ? "new" : "steady";
      const change = repeated && !isNew
        ? `没有新增落地条件；同一观点已出现${item.narrativeCountLabel || item.narrativeCount}次。`
        : isNew
          ? "口径中出现新的对象、数字或行动描述，需等待外部确认。"
          : "暂未形成可验证的新条件，继续按事件进展观察。";
      return {
        topic: item.topic,
        latestDate: item.date,
        latestSpeech: item.speechCn,
        sourceUrl: item.sourceUrl,
        assets: item.assets,
        state,
        stateClass,
        change,
        next: decision.trigger,
      };
    })
    .sort((a, b) => b.latestDate.localeCompare(a.latestDate));
}

function renderStatements() {
  if (!statementList || !searchInput) return;
  const query = searchInput.value.trim().toLowerCase();
  const filtered = statements
    .filter((item) => matchesFilter(item))
    .filter((item) => !selectedDay || item.date.startsWith(selectedDay))
    .filter((item) => !selectedNarrativeKey || item.narrative?.key === selectedNarrativeKey)
    .filter((item) => {
      if (!query) return true;
      return getSearchText(item, query).includes(query);
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.impact - a.impact);

  if (!filtered.length) {
    statementList.innerHTML = `${renderActiveNarrativeBar()}<div class="empty-state">没有匹配的发言</div>`;
    bindStatementActions();
    return;
  }

  const visible = filtered.slice(0, renderLimit);
  statementList.innerHTML = `
    ${renderActiveNarrativeBar()}
    ${visible.map((item) => renderStatementRow(item, query)).join("")}
    ${renderLoadMore(visible.length, filtered.length)}
  `;

  bindStatementActions();
}

function bindStatementActions() {
  const loadMore = statementList.querySelector("[data-load-more]");
  if (loadMore) {
    loadMore.addEventListener("click", () => {
      renderLimit += PAGE_SIZE;
      renderStatements();
    });
  }

  const clearNarrative = statementList.querySelector("[data-clear-narrative]");
  if (clearNarrative) {
    clearNarrative.addEventListener("click", () => {
      selectedNarrativeKey = "";
      selectedDay = "";
      currentFilter = "all";
      renderLimit = PAGE_SIZE;
      updateFilterTabs(currentFilter);
      updateMetricActiveState();
      renderStatements();
    });
  }
}

function renderActiveNarrativeBar() {
  if (selectedDay) {
    const dayItems = statements.filter((entry) => entry.date.startsWith(selectedDay) && isWorthWatching(entry));
    return `
      <div class="active-narrative">
        <div>
          <span>正在看</span>
          <strong>${escapeHtml(formatDateLabel(`${selectedDay} 00:00`))} 值得关注</strong>
        </div>
        <em>${dayItems.length}条</em>
        <button type="button" data-clear-narrative>清除</button>
      </div>
    `;
  }
  if (currentFilter === "impact") {
    const highImpactItems = statements.filter((entry) => entry.impact >= HIGH_IMPACT_THRESHOLD);
    return `
      <div class="active-narrative">
        <div>
          <span>正在看</span>
          <strong>高敏感发言</strong>
        </div>
        <em>列表${highImpactItems.length}条</em>
        <button type="button" data-clear-narrative>清除</button>
      </div>
    `;
  }
  const selected = getSelectedNarrative();
  if (!selected) return "";
  return `
    <div class="active-narrative">
      <div>
        <span>正在看同一观点</span>
        <strong>${escapeHtml(selected.title)}</strong>
      </div>
      <em>列表${selected.listCount}条</em>
      <button type="button" data-clear-narrative>清除</button>
    </div>
  `;
}

function getSelectedNarrative() {
  if (!selectedNarrativeKey) return null;
  const item = statements.find((entry) => entry.narrative?.key === selectedNarrativeKey);
  if (!item) return null;
  return {
    title: item.narrativeTitle || item.narrative.title,
    listCount: statements.filter((entry) => entry.narrative?.key === selectedNarrativeKey).length,
  };
}

function updateFilterTabs(nextFilter) {
  document.querySelectorAll("[data-filter]").forEach((item) => {
    const active = item.dataset.filter === nextFilter;
    item.classList.toggle("active", active);
    item.setAttribute("aria-selected", active ? "true" : "false");
  });
  if (feedTitle) feedTitle.textContent = FILTER_LABELS[nextFilter] || "全部消息";
}

function renderLoadMore(visibleCount, totalCount) {
  if (visibleCount >= totalCount) return "";
  return `<button class="load-more" type="button" data-load-more>继续加载 ${Math.min(PAGE_SIZE, totalCount - visibleCount)} 条</button>`;
}

function getSearchText(item, query) {
  const visibleText = [
    item.topic,
    scoreText(item.impact),
    item.speechCn,
    item.verdict,
    item.verify,
    item.assets.join(" "),
    item.narrativeTitle,
    item.narrativeCount >= 2 ? "同观点重复" : "",
    repeatText(item.novelty),
    verificationBadgeText(item.confidence),
  ].join(" ");

  if (hasCjk(query)) return visibleText.toLowerCase();
  return `${visibleText} ${item.quote || ""}`.toLowerCase();
}

function getSearchHitReason(item, query) {
  const normalized = String(query || "").trim().toLowerCase();
  if (!normalized) return "";
  const checks = [
    ["主题", item.topic],
    ["中文摘译", item.speechCn],
    ["判断", item.verdict],
    ["触发条件", item.verify],
    ["关联品种", item.assets.join(" ")],
    ["同观点", item.narrativeTitle],
    ["信息属性", `${repeatText(item.novelty)} ${verificationBadgeText(item.confidence)}`],
  ];
  if (!hasCjk(normalized)) checks.push(["英文原文", item.quote]);
  const hit = checks.find(([, value]) => String(value || "").toLowerCase().includes(normalized));
  return hit ? hit[0] : "相关内容";
}

function hasCjk(value) {
  return /[\u3400-\u9fff]/.test(value);
}

function renderNarrativeChip(item) {
  if (!item.narrativeTitle || item.narrativeCount < 2 || item.narrativePriority < 70) return "";
  return `
    <span class="chip repeat-count" title="同一观点在当前样本中的出现次数">
      <span>${escapeHtml(item.narrativeTitle)}</span>
      <strong>同观点${escapeHtml(item.narrativeCountLabel || `${item.narrativeCount}`)}次</strong>
    </span>
  `;
}

function renderStatementRow(item, query = "") {
  const color = colorForScore(item.impact);
  const riskLabel = riskLabelForItem(item);
  const date = formatDateParts(item.date);
  const assets = item.assets.slice(0, 3).map((asset) => `<span class="chip asset-chip">${escapeHtml(asset)}</span>`).join("");
  const decision = buildDecisionRows(item);
  const searchHit = query ? getSearchHitReason(item, query) : "";
  const infoChips = [
    renderNarrativeChip(item),
    `<span class="chip">${repeatText(item.novelty)}</span>`,
    renderVerificationChip(item.confidence),
  ]
    .filter(Boolean)
    .join("");
  return `
    <article class="statement-row">
      <div class="row-time">
        <strong>${escapeHtml(date.day)}</strong>
        <span>${escapeHtml(date.time)}</span>
      </div>
      <div class="row-main">
        <div class="row-topline">
          <div class="row-meta">
            <span class="topic-pill">${escapeHtml(item.topic)}</span>
          </div>
          <span class="risk-pill" style="--risk-color:${color};--risk-bg:${riskBackground(item.impact)}">${escapeHtml(riskLabel)}</span>
        </div>
        <p class="row-quote"><span class="speaker-label">特朗普：</span>${escapeHtml(item.speechCn)}</p>
        ${searchHit ? `<div class="search-hit">命中：${escapeHtml(searchHit)}</div>` : ""}
        <div class="row-judgement">
          <div>
            <span>市场含义</span>
            <strong>${escapeHtml(decision.meaning)}</strong>
          </div>
          <div>
            <span>触发条件</span>
            <strong>${escapeHtml(decision.trigger)}</strong>
          </div>
          <div>
            <span>失效条件</span>
            <strong>${escapeHtml(decision.invalid)}</strong>
          </div>
        </div>
        <div class="tag-section">
          <span class="tag-label">关联品种</span>
          <div class="row-tags">${assets}</div>
        </div>
        <div class="tag-section">
          <span class="tag-label">信息属性</span>
          <div class="row-tags">${infoChips}</div>
        </div>
      </div>
    </article>
  `;
}

function buildDecisionRows(item) {
  const repeatHint = item.narrativeCount >= 3 && item.narrativePriority >= 70 ? `；同一观点已出现${item.narrativeCountLabel || item.narrativeCount}次` : "";
  const map = {
    伊朗协议: {
      meaning: `${item.verdict}${repeatHint}`,
      trigger: item.verify,
      invalid: "没有协议文本、伊朗确认、军事行动或霍尔木兹变化时，只按口径处理。",
    },
    中东局势: {
      meaning: `${item.verdict}${repeatHint}`,
      trigger: item.verify,
      invalid: "停火执行和能源通道都没有变化时，不直接推交易方向。",
    },
    关税: {
      meaning: `${item.verdict}${repeatHint}`,
      trigger: item.verify,
      invalid: "只喊公平贸易、没有税率对象和日期时，不视为落地信号。",
    },
    美联储: {
      meaning: `${item.verdict}${repeatHint}`,
      trigger: item.verify,
      invalid: "联储官员、CPI或就业数据不配合时，容易停留在口头施压。",
    },
    能源: {
      meaning: `${item.verdict}${repeatHint}`,
      trigger: item.verify,
      invalid: "没有油价、库存、航运或供应数据变化时，不追单。",
    },
    美股个股: {
      meaning: `${item.verdict}${repeatHint}`,
      trigger: item.verify,
      invalid: "没有公司公告、订单、政策文件或价格确认时，只按短线情绪处理。",
    },
    移民边境: {
      meaning: "政策风险口径，默认不作为直接交易信号。",
      trigger: item.verify,
      invalid: "没有行政令、法院或执法数据时，按政治噪声过滤。",
    },
    选举政治: {
      meaning: "选举动员或政治攻防，交易方向弱。",
      trigger: item.verify,
      invalid: "没有民调突变、选情结果或政策承诺变化时，默认过滤。",
    },
    综合政治风险: {
      meaning: "政治情绪或舆论口径，交易价值低。",
      trigger: item.verify,
      invalid: "不能落到政策文件、官方动作或价格变化时，默认过滤。",
    },
  };
  return map[item.topic] || {
    meaning: item.verdict,
    trigger: item.verify,
    invalid: "缺少第二来源或价格确认时，不作为交易依据。",
  };
}

function riskLabelForItem(item) {
  if (item.topic === "美股个股") return "个股信号";
  return scoreText(item.impact);
}

function summarizeTopics() {
  const byTopic = new Map();
  statements.forEach((item) => {
    const bucket = byTopic.get(item.topic) || {
      topic: item.topic,
      count: 0,
      impactTotal: 0,
      assets: [],
      latestDate: "",
    };
    bucket.count += 1;
    bucket.impactTotal += item.impact;
    bucket.assets.push(...item.assets);
    if (!bucket.latestDate || item.date.localeCompare(bucket.latestDate) > 0) bucket.latestDate = item.date;
    byTopic.set(item.topic, bucket);
  });

  return [...byTopic.values()]
    .map((item) => ({
      ...item,
      avgImpact: Math.round(item.impactTotal / item.count),
      assets: [...new Set(item.assets)],
    }))
    .sort((a, b) => b.count - a.count || b.latestDate.localeCompare(a.latestDate) || b.avgImpact - a.avgImpact);
}

function summarizeTradeSignals() {
  return summarizeTopics()
    .filter((topic) => isActionableTopic(topic.topic))
    .map((topic) => {
      const latest = statements
        .filter((item) => item.topic === topic.topic)
        .sort((a, b) => b.date.localeCompare(a.date) || b.impact - a.impact)[0];
      return {
        ...topic,
        latestSpeech: latest?.speechCn || buildChineseSpeech(latest?.quote || "", latest || {}) || "",
        latestSourceUrl: latest?.sourceUrl || "",
        ...tradeSignalForTopic(topic.topic, latest, topic.avgImpact),
      };
    })
    .sort((a, b) => b.latestDate.localeCompare(a.latestDate) || signalPriority(b) - signalPriority(a) || b.avgImpact - a.avgImpact);
}

function signalPriority(item) {
  if (item.action === "risk") return 4;
  if (item.action === "attention") return 3;
  if (item.action === "watch") return 3;
  if (item.action === "low") return 1;
  return 2;
}

function tradeSignalForTopic(topic, latest, avgImpact) {
  const text = tradeSignalText(latest);
  const hasThreat = /strike|bomb|attack|war|hormuz|sanction|blockade|封锁|打击|制裁|威胁/.test(text);
  const hasDeal = /deal|agreement|ceasefire|peace|协议|停火|达成/.test(text);
  const hasOilDown = /oil prices?.*(plummet|drop|dropping|lower|lowering|down|fall|falling|tumbling)|gas prices?.*(drop|dropping|lower|lowering|down|falling)|油价.*(下跌|下降|回落)|汽油.*(下跌|下降|降价)/.test(text);
  const hasSupplyRisk = /hormuz|opec|oil tanker|oil tankers|ships|transits|blockade|sanction|war|strike|霍尔木兹|油轮|通行|封锁|制裁|库存|供应/.test(text);
  const hasFedEntity = /powell|federal reserve|\bfed\b|鲍威尔|美联储/.test(text);
  const hasRateCut = hasFedEntity && /rate cuts?|interest rates?|cut rates?|lower rates?|降息|利率/.test(text);
  const hasFedPersonnel = /board of the federal reserve|cook lawsuit|suitability|supreme court|理事|诉讼|最高法院|人事/.test(text);

  if (topic === "伊朗协议") {
    const views = hasThreat
      ? [
          { asset: "原油", label: "供应风险", type: "risk" },
          { asset: "黄金", label: "避险/实际利率", type: "attention" },
          { asset: "美元", label: "波动关注", type: "watch" },
        ]
      : hasDeal
        ? [
            { asset: "原油", label: "供应预期变化", type: "watch" },
            { asset: "黄金", label: "避险/实际利率", type: "attention" },
            { asset: "美元", label: "波动关注", type: "watch" },
          ]
        : [
            { asset: "原油", label: "影响待定", type: "watch" },
            { asset: "黄金", label: "避险/实际利率", type: "attention" },
            { asset: "美元", label: "波动关注", type: "watch" },
          ];
    return {
      action: hasThreat ? "risk" : "watch",
      actionLabel: hasThreat ? "风险升温" : "信息不足",
      views,
      note: hasThreat
        ? "中东风险升温。原油重点看供应通道；黄金需同时观察避险需求、通胀预期、美元与实际利率，方向并非单一。"
        : "最新口径仍需验证；协议文本、伊朗确认或军事行动会改变市场影响。黄金仍需结合避险需求、美元与实际利率判断。",
      trigger: "触发：霍尔木兹通行、军事行动、协议文本。",
    };
  }

  if (topic === "中东局势") {
    return {
      action: hasThreat ? "risk" : "watch",
      actionLabel: hasThreat ? "风险升温" : "信息不足",
      views: [
        { asset: "原油", label: hasThreat ? "供应风险" : "波动关注", type: hasThreat ? "risk" : "watch" },
        { asset: "黄金", label: "避险/实际利率", type: "attention" },
        { asset: "美元", label: "波动关注", type: "watch" },
      ],
      note: hasThreat
        ? "军事风险升温。原油重点看供应通道；黄金需同时观察避险需求、通胀预期、美元与实际利率。"
        : "停火或谈判口径需要后续执行确认；黄金方向仍取决于避险需求与实际利率的共同变化。",
      trigger: "触发：停火执行、军事行动、能源通道。",
    };
  }

  if (topic === "关税") {
    return {
      action: "risk",
      actionLabel: "政策压力",
      views: [
        { asset: "美元", label: "波动关注", type: "watch" },
        { asset: "铜", label: "需求压力", type: "risk" },
        { asset: "美股", label: "利润率压力", type: "risk" },
      ],
      note: "关税升级可能改变成本、需求和风险偏好，需结合税率与执行范围判断。",
      trigger: "触发：税率、对象、执行日期。",
    };
  }

  if (topic === "美联储") {
    return {
      action: hasRateCut ? "attention" : "watch",
      actionLabel: hasRateCut ? "利率关注" : hasFedPersonnel ? "人事施压" : "信息不足",
      views: hasRateCut
        ? [
            { asset: "美债", label: "利率敏感", type: "attention" },
            { asset: "美元", label: "利差变化", type: "watch" },
            { asset: "黄金", label: "实际利率敏感", type: "attention" },
          ]
        : [
            { asset: "美债", label: "利率关注", type: "attention" },
            { asset: "美元", label: "波动关注", type: "watch" },
            { asset: "黄金", label: "实际利率敏感", type: "attention" },
          ],
      note: hasRateCut ? "发言本身不代表政策变化，需观察联储官员与经济数据是否形成验证。" : "最新更像美联储人事或程序施压，需与正式政策信号区分。",
      trigger: "触发：联储表态、CPI、就业数据、人事进展。",
    };
  }

  if (topic === "能源") {
    if (hasOilDown) {
      return {
        action: "attention",
        actionLabel: "价格变化",
        views: [
          { asset: "WTI", label: "价格回落", type: "attention" },
          { asset: "布伦特", label: "价格回落", type: "attention" },
          { asset: "通胀预期", label: "降温关注", type: "watch" },
        ],
        note: "最新口径强调油价和汽油价格回落，重点观察实际价格与通胀预期是否同步变化。",
        trigger: "触发：WTI/布伦特、零售汽油、库存和供应数据。",
      };
    }
    return {
      action: hasSupplyRisk || avgImpact >= 70 ? "risk" : "watch",
      actionLabel: hasSupplyRisk || avgImpact >= 70 ? "供给风险" : "信息不足",
      views: hasSupplyRisk || avgImpact >= 70
        ? [
            { asset: "WTI", label: "供应风险", type: "risk" },
            { asset: "布伦特", label: "供应风险", type: "risk" },
            { asset: "通胀预期", label: "再通胀关注", type: "attention" },
          ]
        : [
            { asset: "WTI", label: "波动关注", type: "watch" },
            { asset: "布伦特", label: "波动关注", type: "watch" },
            { asset: "通胀预期", label: "影响待定", type: "watch" },
          ],
      note: "能源类发言要先区分供应风险与价格变化，不能只看措辞强弱。",
      trigger: "触发：油轮通行、OPEC、库存变化。",
    };
  }

  if (topic === "美股个股") {
    return {
      action: "attention",
      actionLabel: "个股关注",
      views: [
        { asset: "戴尔", label: "短线关注", type: "attention" },
        { asset: "美光", label: "短线关注", type: "attention" },
        { asset: "美股", label: "题材关注", type: "watch" },
      ],
      note: "特朗普点名个股可能带来短线关注，但仍需公司公告、订单和价格表现验证。",
      trigger: "触发：公司公告、订单线索、盘前盘后价格。",
    };
  }

  if (topic === "选举政治" || topic === "移民边境" || topic === "综合政治风险") {
    return {
      action: "low",
      actionLabel: "关联度低",
      views: [
        { asset: "美元", label: "相关性低", type: "neutral" },
        { asset: "美股", label: "相关性低", type: "neutral" },
        { asset: "黄金", label: "相关性低", type: "neutral" },
      ],
      note: "政治动员类发言与主要品种的即时关联较弱，需等待政策或事件层面的变化。",
      trigger: "触发：民调突变、法律文件、政策落地。",
    };
  }

  return {
    action: "watch",
    actionLabel: "信息不足",
    views: topic.assets.slice(0, 3).map((asset) => ({ asset, label: "影响待定", type: "watch" })),
    note: "当前信息不足，需结合第二来源与市场价格验证。",
    trigger: "触发：官方文件和市场价格确认。",
  };
}

function tradeSignalText(latest) {
  return `${latest?.quote || ""} ${latest?.speechCn || ""} ${latest?.context || ""}`.toLowerCase();
}

function detectNarrative(item) {
  const text = String(item.quote || "").toLowerCase();
  const rules = [
    {
      key: "iran_deal_close",
      title: "伊朗协议即将达成",
      topic: "伊朗协议",
      priority: 100,
      test: (value) => isCnnLikeIranDealClaim(value),
      note: "同一观点反复出现但未必落地；真正触发仍是协议文本、伊朗确认或霍尔木兹通行。",
    },
    {
      key: "iran_no_nuclear_weapon",
      title: "伊朗不能拥有核武器",
      topic: "伊朗协议",
      priority: 98,
      test: (value) => hasAny(value, ["iran"]) && hasAny(value, ["nuclear weapon", "nuclear weapons", "no nuclear", "cannot have nuclear", "must not have nuclear"]),
      note: "这是更强硬的底线表述，交易上更接近风险溢价，而不是协议落地信号。",
    },
    {
      key: "powell_too_late_cut_rates",
      title: "鲍威尔太迟，应降息",
      topic: "美联储",
      priority: 94,
      test: (value) => hasAny(value, ["powell", "fed"]) && hasAny(value, ["too late", "late", "cut", "lower", "interest rate", "rates"]),
      note: "这是反复施压口径，不等于政策变化；需要联储表态或通胀就业数据确认。",
    },
    {
      key: "voter_id_citizenship",
      title: "投票必须出示身份证明",
      topic: "选举政治",
      priority: 90,
      test: (value) => hasAny(value, ["photo i.d", "voter id", "proof of citizenship", "voters must show"]),
      note: "偏政治制度口径，重复次数高但金融资产方向弱。",
    },
    {
      key: "no_mail_ballots",
      title: "反对邮寄投票",
      topic: "选举政治",
      priority: 88,
      test: (value) => hasAny(value, ["no mail-in ballots", "mail-in ballots", "mail in ballots"]),
      note: "偏选举规则口径，通常不直接形成交易方向。",
    },
    {
      key: "men_women_sports",
      title: "反对男性参加女子体育",
      topic: "综合政治风险",
      priority: 55,
      test: (value) => hasAny(value, ["men in women", "women’s sports", "women's sports", "transgender mutilation", "transgender surgery"]),
      note: "文化议题重复口径，适合过滤，通常不作为交易信号。",
    },
    {
      key: "tariffs_fair_trade",
      title: "关税让美国获得公平贸易",
      topic: "关税",
      priority: 92,
      test: (value) => hasAny(value, ["tariff", "tariffs"]) && hasAny(value, ["fair", "unfair", "ripped off", "treated unfairly", "take advantage"]),
      note: "这是贸易施压观点，只有出现税率、对象和日期，才从口号变成交易变量。",
    },
    {
      key: "complete_total_endorsement",
      title: "完全背书某候选人",
      topic: "选举政治",
      priority: 10,
      test: (value) => hasAny(value, ["complete and total endorsement"]),
      note: "高频政治背书句式，交易价值低，主要用于识别噪声。",
    },
  ];

  return rules.find((rule) => rule.test(text)) || null;
}

function hasAny(value, words) {
  return words.some((word) => value.includes(word));
}

function isCnnLikeIranDealClaim(rawValue) {
  const value = String(rawValue || "").toLowerCase();
  return (
    value.includes("iran") &&
    hasAny(value, ["deal", "agreement"]) &&
    hasAny(value, [
      "close",
      "soon",
      "very close",
      "shortly",
      "near",
      "imminent",
      "want",
      "wants",
      "wanted",
      "would like",
      "ready",
      "make a deal",
      "making a deal",
      "potential deal",
      "proceeding nicely",
    ])
  );
}

function isStrictIranDealClaim(rawValue) {
  const value = String(rawValue || "").toLowerCase();
  return value.includes("iran") && hasAny(value, ["deal", "agreement"]) && hasAny(value, ["close", "soon", "very close", "shortly", "near", "imminent"]);
}

function isArchiveMediaOrRepost(value) {
  return /^(rt @|图片描述)/i.test(String(value || ""));
}

function normalizeSourceName(source) {
  if (/trump/i.test(source) || /truth/i.test(source)) return "来源";
  return source;
}

function isDirectTrumpSpeech(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  if (/^(图片描述|视频字幕)：|^RT\s+@/i.test(text)) return false;
  if (/^https?:\/\//i.test(text)) return false;

  const withoutUrls = stripUrls(text).replace(/\s+/g, " ").trim();
  if (!withoutUrls || withoutUrls.length < 8) return false;

  const lower = withoutUrls.toLowerCase();
  const hasUrl = /https?:\/\//i.test(text);
  const hasFirstPerson = /\b(i|i'm|i’ve|i'll|i’d|my|me|we|we're|we’ve|we'll|our|us)\b/.test(lower);
  const hasDirectCommand = /^(house republicans|republicans|democrats|iran|china|canada|the fed|powell|there will be|no tolls|happy father|the united states|the crowd|last night|it is my great honor|this is|these pictures|big rally tonight|my real poll numbers|the failing new york times)/i.test(withoutUrls);
  const startsLikeTrumpPost = /^(i\b|i'm|i’ve|i will|i am|i just|if\b|we\b|we're|we’ve|my\b|our\b|just as i|as i promised|thank you|vote for|big rally|these pictures|this is|there will be|no tolls|happy|house republicans|the united states|the crowd|last night|it is my great honor|everybody is|remember,|now with|for years,|pregnant women|the biggest problem)/i.test(withoutUrls);
  const looksLikeHeadlineShare = /https?:\/\//i.test(text) && !hasFirstPerson && withoutUrls.length < 140;

  if (hasUrl && !startsLikeTrumpPost) return false;
  return !looksLikeHeadlineShare && (hasFirstPerson || hasDirectCommand);
}

function matchesFilter(item) {
  if (currentFilter === "focus") return isWorthWatching(item);
  if (currentFilter === "impact") return item.impact >= HIGH_IMPACT_THRESHOLD;
  if (currentFilter === "repeat") return item.narrativeCount >= 3 && item.narrativePriority >= 70;
  return true;
}

function isWorthWatching(item) {
  if (item.forceFocus) return true;
  if (item.narrativeCount >= 3 && item.narrativePriority >= 70) return true;
  if (!isActionableTopic(item.topic)) return false;
  if (item.impact >= 50) return true;
  if (item.novelty >= 55 && item.confidence >= 45) return true;
  return false;
}

function isActionableTopic(topic) {
  return ["伊朗协议", "中东局势", "关税", "美联储", "能源", "美股个股"].includes(topic);
}

function isMarketMovingStatement(item) {
  if (!isActionableTopic(item.topic)) return false;
  const text = tradeSignalText(item);
  const rules = {
    伊朗协议:
      /sanction|strike|attack|missile|blockade|hormuz|oil|nuclear inspections?|deal|agreement|ceasefire|war|military|funds?|制裁|打击|导弹|封锁|霍尔木兹|原油|核查|协议|停火|战争|军事|资金/i,
    中东局势: /strike|attack|missile|ceasefire|war|military|oil|hormuz|打击|袭击|导弹|停火|战争|军事|原油|霍尔木兹/i,
    关税: /tariff|tariffs|关税/i,
    美联储: /powell|federal reserve|interest rates?|rate cuts?|美联储|鲍威尔|降息|利率/i,
    能源: /oil|gas|fuel|barrels?|north sea|opec|原油|油价|汽油|北海|欧佩克/i,
    美股个股: /dell|micron|stock|shares?|戴尔|美光|股票|个股/i,
  };
  return Boolean(rules[item.topic]?.test(text));
}

function detectSignals(text) {
  const hasNumber = /\b\d+(?:\.\d+)?\b|%|万|亿/.test(text);
  return {
    repeat: countMatches(text, ["very close", "soon", "quickly", "again", "多次", "反复", "再次", "很快", "临近", "接近"]),
    vague: countMatches(text, ["could", "maybe", "可能", "预计", "暂定", "声称", "强调", "great", "powerful"]),
    detail: countMatches(text, ["60", "48", "friday", "signed", "mou", "percent", "%", "税率", "日期", "周五", "签署", "完成", "文本", "窗口", "60 天", "协议"]),
    verifiable:
      countMatches(text, [
        "barrel",
        "barrels",
        "million",
        "record",
        "all time",
        "oil prices",
        "tumbling",
        "flowed",
        "yesterday",
        "ships",
        "transits",
        "stock market",
        "jobs",
        "cpi",
        "employment",
        "yield",
        "通行",
        "油价",
        "桶",
        "创纪录",
        "库存",
        "数据",
        "收益率",
      ]) + (hasNumber ? 1 : 0),
    threat: countMatches(text, ["tariff", "sanction", "strike", "bomb", "seize", "blockade", "threat", "control", "关税", "制裁", "打击", "威胁", "夺取", "拿下", "封锁", "摧毁", "控制", "警告"]),
  };
}

function inferTopic(text) {
  if (/\b(oil prices?|gas prices?|fuel|pump)\b|油价|汽油/.test(text)) {
    return { name: "能源", baseImpact: 62, assets: ["WTI", "布伦特", "通胀预期"], words: [] };
  }
  if (/\b(dell|micron)\b|戴尔|美光|科技股|半导体/.test(text)) {
    return { name: "美股个股", baseImpact: 66, assets: ["戴尔", "美光", "美股"], words: [] };
  }
  if (/\b(powell)\b|federal reserve|\bfed\b|interest rates?|rate cuts?|lower rates?|降息|利率|美联储|鲍威尔/.test(text)) {
    return { name: "美联储", baseImpact: 58, assets: ["美债", "美元", "黄金"], words: [] };
  }
  if (/\b(tariff|tariffs|reciprocal)\b|trade deal|china trade|关税|贸易协议|对华贸易|中国/.test(text)) {
    return { name: "关税", baseImpact: 72, assets: ["美元", "铜", "美股"], words: [] };
  }
  if (/\b(iran|iranian|hormuz|kharg)\b|伊朗|霍尔木兹/.test(text)) {
    return { name: "伊朗协议", baseImpact: 70, assets: ["原油", "黄金", "美元"], words: [] };
  }
  if (/\b(israel|israeli|gaza|hamas|lebanon|beirut|netanyahu)\b|middle east|以色列|加沙|哈马斯|黎巴嫩|中东/.test(text)) {
    return { name: "中东局势", baseImpact: 60, assets: ["原油", "黄金", "美元"], words: [] };
  }
  if (/\b(oil|opec|crude|gasoline|oil tankers?|north sea oil)\b|原油|产油|北海油田/.test(text)) {
    return { name: "能源", baseImpact: 62, assets: ["WTI", "布伦特", "通胀预期"], words: [] };
  }
  if (/\b(endorse|endorsement|candidate|runoff|campaign|voter|ballots)\b|running for|vote for|complete and total endorsement|proof of citizenship|mail-in ballots|won,\s*big|just lost|lost,\s*big|election wins?|背书|候选人|参选|竞选|投票/.test(text)) {
    return { name: "选举政治", baseImpact: 34, assets: ["美元", "美股", "黄金"], words: [] };
  }

  const rules = [
    { name: "移民边境", baseImpact: 42, assets: ["美元", "美股", "黄金"], pattern: /\b(border|immigration|deport|deportation|ice)\b|illegal immigration|移民|边境|遣返/ },
  ];

  return rules.find((topic) => topic.pattern.test(text)) || {
    name: "综合政治风险",
    baseImpact: 42,
    assets: ["美元", "美股", "黄金"],
    words: [],
  };
}

function inferIntent(topic, signals) {
  if (signals.threat > 0) return "威胁施压";
  if (topic.name === "关税") return "筹码抬价";
  if (topic.name === "美联储") return "政策施压";
  if (signals.detail > 0) return "政策信号";
  if (signals.repeat > 0) return "观点重复";
  return "情绪扰动";
}

function buildVerdict(topic, signals, novelty, confidence) {
  if (topic.name === "美股个股") return "特朗普点名个股，可能带来短线关注；先看盘前盘后价格、公司回应和订单线索。";
  if (topic.name === "选举政治") return "交易方向弱，适合过滤；除非民调、选情或政策承诺发生明显变化。";
  if (topic.name === "中东局势") return "中东风险口径，先看停火执行、军事行动和能源通道是否变化。";
  if (topic.name === "移民边境") return "更偏政策风险，短线交易需等行政令、执法数据或法院进展。";
  if (topic.name === "综合政治风险") return "噪声占比较高，先看是否落到政策文件或市场价格。";
  if (confidence < 35 && novelty < 35) return "新信息少，更适合按重复叙事处理。";
  if (signals.threat > 0) return "威胁或施压口径，容易先推升风险溢价。";
  if (novelty >= 50) return "可能带来新的政策变量，值得留意。";
  return "可能带来情绪波动，需要第二来源确认。";
}

function buildVerify(topic, signals) {
  if (topic.name === "关税") return "税率、对象、落地日期";
  if (topic.name === "伊朗协议") return signals.threat > 0 ? "军事行动是否发生" : "协议文本、伊朗口径、霍尔木兹通行";
  if (topic.name === "美联储") return "联储官员、通胀数据、美债收益率";
  if (topic.name === "能源") return "油价、汽油零售价格、库存/供应";
  if (topic.name === "美股个股") return "公司公告、订单线索、盘前盘后价格";
  if (topic.name === "选举政治") return "投票结果、民调和当地媒体口径";
  if (topic.name === "中东局势") return "停火执行、军事行动、能源通道";
  if (topic.name === "移民边境") return "行政令、执法数据和法院进展";
  return "官方文件和第二来源";
}

function buildChineseSpeech(quote, analysis) {
  const cleaned = cleanSpeechText(quote);
  const lower = cleaned.toLowerCase();
  const name = extractNominationName(cleaned);

  if (!cleaned) return "";
  if (hasCjk(cleaned)) return normalizeChineseSpeech(cleaned);
  if (/great honor to announce the nomination/i.test(cleaned)) {
    return name ? `我很荣幸宣布提名${name}进入我的政府团队。` : "我很荣幸宣布一项新的政府人事提名。";
  }
  if (/communists are finally making their move/i.test(cleaned)) {
    return "我认为共产主义者终于开始行动了；我已经等待并准备了很久。";
  }
  if (/last night[’']s rally was packed/i.test(cleaned)) {
    return "昨晚的集会坐满了，大约4.5万人到场；7月4日会超出你们见过的一切。";
  }
  if (/house republicans should unify/i.test(cleaned)) {
    return "我要求众议院共和党人团结起来，不要再投票否决规则，也不要威胁这样做。";
  }
  if (/the crowd was incredible/i.test(cleaned)) {
    return "昨晚人群非常惊人，现场至少有4.5万人，还有大量电视和线上观众。";
  }
  if (/two major earthquakes.*venezuela/i.test(cleaned)) {
    return "委内瑞拉刚遭遇两次大地震，美国已经准备好、愿意并且能够提供帮助。";
  }
  if (/there will be no tolls in the hormuz strait/i.test(cleaned)) {
    return "霍尔木兹海峡在停火期60天内不会收费；60天后也不会收费，除非由美国为相关服务征收。";
  }
  if (/many additional people have been arrested/i.test(cleaned)) {
    return "更多与破坏倒影池有关的人已经被逮捕；我认为这些破坏者必须受到相应处理。";
  }
  if (/many statues and fountains.*reflecting pool|300 foot long gash.*10 year prison sentence/i.test(cleaned)) {
    return "我说多个雕像和喷泉已修复，只有倒影池遭破坏；破坏者造成300英尺裂痕并投放化学品，最高10年刑期会严格执行。";
  }
  if (/united states park police have arrested/i.test(cleaned)) {
    return "美国公园警察已经逮捕多名破坏倒影池的人；我认为这是严重破坏国家纪念设施的罪行。";
  }
  if (/happy father/i.test(cleaned)) {
    return "父亲节快乐！我们的国家表现很棒，就业和股市创纪录，经济是有史以来最好的。";
  }
  if (/thank you,\s*scotland/i.test(cleaned)) {
    return "感谢苏格兰。";
  }
  if (/at least\s+\d+\s+people injured.*chicago weekend shootings/i.test(cleaned)) {
    return "芝加哥周末枪击造成至少39人受伤、4人死亡；我可以迅速并永久解决这个问题，普里茨克应该给我打电话。";
  }
  if (/six people have been arrested.*reflecting pool/i.test(cleaned)) {
    return "已有6人因破坏倒影池被捕、7人被传唤；倒影池会在7月4日前后抽水并进行永久修复。";
  }
  if (/19 millions? barrels of oil.*hormuz strait/i.test(cleaned)) {
    return "霍尔木兹海峡昨天流出1900万桶原油，创下纪录；油价正在下跌，世界更安全了。";
  }
  if (/oil prices.*gas prices.*freedom fuel|gas prices at the pump.*freedom fuel|freedom fuel network/i.test(cleaned)) {
    return "我说油价正在快速下跌、汽油价格也在下降；7月3日 Freedom Fuel Network 将在费城地区25个加油站降价。";
  }
  if (/what changed after almost 4 months of war/i.test(cleaned)) {
    return "我反驳《纽约时报》称战争变化不大，强调伊朗军力受损、通胀高企、霍尔木兹已开放，原油流出且美股和就业创高。";
  }
  if (/new york times.*battered and beat up iran.*treasonous/i.test(cleaned)) {
    return "我指责《纽约时报》用虚假事实报道伊朗局势，称这种报道近乎叛国，并会把相关报道加入对其诉讼。";
  }
  if (/iran has fully and completely agreed.*nuclear inspections/i.test(cleaned)) {
    return "伊朗已经同意长期接受最高级别核查；因此我允许霍尔木兹海峡继续开放，但美方舰船仍会留在原位以备重新封锁。";
  }
  if (/iran has allowed an american citizen.*gesture of goodwill by iran/i.test(cleaned)) {
    return "我说伊朗已允许一名被错误拘押的美国公民离境；她目前安全且状况良好，美方感谢伊朗释放的善意。";
  }
  if (/holding canada responsible.*tariffs canada is currently paying/i.test(cleaned)) {
    return "我认为加拿大森林管理不当导致受污染空气进入美国；相关损失应计入加拿大目前支付的关税，并会就此致电加拿大总理。";
  }
  if (/republicans should add iran to the russian sanctions bill/i.test(cleaned)) {
    return "我要求共和党把伊朗加入针对俄罗斯的制裁法案，并称这原本就是林赛希望推动的安排。";
  }
  if (/opening up.*north sea oil|opening north sea oil/i.test(cleaned)) {
    return "我支持英国全面开放北海原油资源，认为这能改善英国的能源和经济状况，并称一切应从开放北海原油开始。";
  }
  if (/giant eagle.*300 products.*labor day/i.test(cleaned)) {
    return "我说Giant Eagle将在劳动节前下调300多种商品的价格，并要求其他连锁超市跟进；我同时强调油价、汽油、鸡蛋和处方药价格正在下降。";
  }
  if (/vote for\s+andy biggs/i.test(cleaned)) {
    return "我支持Andy Biggs竞选亚利桑那州州长，并呼吁选民投票给他。";
  }
  if (/rush limbaugh/i.test(cleaned)) {
    return "我称赞Rush Limbaugh的妻子Kathryn在节目中表现出色，并表示大家都很怀念Rush。";
  }
  if (/china take over canada/i.test(cleaned)) {
    return "我说世界最不需要的就是中国接管加拿大；这不会发生，甚至不会接近发生。";
  }
  if (/telephone conversation with president xi/i.test(cleaned)) {
    return "我刚和中国国家主席习近平通了长时间电话，谈到贸易、军事、台湾、俄乌、伊朗，以及中国购买美国能源和农产品等议题。";
  }
  if (/meeting with.*president xi jinping.*beijing/i.test(cleaned)) {
    return "我与习近平主席的会面已重新安排，将在北京举行；我期待这会成为一次重要访问。";
  }
  if (/china is very happy.*hormuz/i.test(cleaned)) {
    return "我说中国很高兴我永久开放霍尔木兹海峡；中国已同意不向伊朗输送武器。";
  }
  if (/president xi is very happy.*hormuz/i.test(cleaned)) {
    return "我说习近平很高兴霍尔木兹海峡正在开放，并期待在中国举行一次可能具有历史意义的会面。";
  }
  if (/looking forward to my trip to china/i.test(cleaned)) {
    return "我期待访问中国，并称中国是了不起的国家、习近平是受尊重的领导人。";
  }
  if (/jensen huang.*china|going to china.*open up|open up.*china/i.test(cleaned)) {
    return "我说黄仁勋、马斯克等企业家正随我前往中国，我会要求习近平进一步开放中国。";
  }
  if (/great hall of china|china has a ballroom/i.test(cleaned)) {
    return "我提到中国有宏大的会堂，并认为美国也应该建设更好的活动大厅。";
  }
  if (/weak and pathetic congressman dan goldman just lost/i.test(cleaned)) {
    return "我称Dan Goldman软弱可悲，并说他刚刚选举大败，因为人们不喜欢他非法针对特朗普。";
  }
  if (/former congressman dan goldman/i.test(cleaned)) {
    return "我说Dan Goldman曾试图起诉我，并称他现在失去方向、结局可悲。";
  }
  if (/america the beautiful will never be a communist country/i.test(cleaned)) {
    return "我表示美丽的美国永远不会成为共产主义国家。";
  }
  if (/italy wasn.?t there for us/i.test(cleaned)) {
    return "我说意大利当时没有支持我们，所以我们也不会支持意大利。";
  }
  if (/i had a lot of big election wins last night/i.test(cleaned)) {
    return "我说昨晚取得很多重要选举胜利，并向所有人致谢。";
  }
  if (/cook lawsuit.*board of the federal reserve|board of the federal reserve.*cook lawsuit/i.test(cleaned)) {
    return "我说有关Cook是否适合担任美联储理事的诉讼被最高法院发回程序处理，政府会立即采取行动。";
  }
  if (/supreme court upheld birthright citizenship/i.test(cleaned)) {
    return "我说最高法院维持出生公民权令人遗憾，但国会可以通过立法修正，我会全力支持。";
  }
  if (/slaughter case.*humphrey/i.test(cleaned)) {
    return "我说最高法院Slaughter案把更多权力交还总统，是一项重要胜利；出生公民权问题会在国会继续修正。";
  }
  if (analysis.topic === "选举政治") {
    const campaignSpeech = translateCampaignSpeech(cleaned);
    if (campaignSpeech) return campaignSpeech;
  }
  if (/poll:/i.test(cleaned)) {
    const pollSpeech = translatePollSpeech(cleaned);
    if (pollSpeech) return pollSpeech;
    return "";
  }
  const topicSpeech = translateTopicSpeech(cleaned, analysis);
  if (topicSpeech) return topicSpeech;
  if (isShortSpeech(cleaned)) {
    const directTranslation = translateShortSpeech(cleaned, analysis);
    if (directTranslation) return directTranslation;
  }
  if (/powell|federal reserve|\bfed\b|interest rates?|rate cut/i.test(cleaned)) {
    return "";
  }
  if (/tariff|tariffs|trade deal|treated.*unfairly|ripped off/i.test(cleaned)) {
    return "";
  }
  if (/iran/i.test(cleaned) && /nuclear weapon|nuclear bomb|nuclear/i.test(cleaned)) {
    return "";
  }
  if (/iran/i.test(cleaned) && /deal|agreement|ceasefire/i.test(cleaned)) {
    return "";
  }
  if (/complete and total endorsement|endorse|endorsement/i.test(cleaned)) {
    return "";
  }
  if (/voter|vote|mail-in ballots|photo i\.d|proof of citizenship/i.test(cleaned)) {
    return /photo i\.?d/i.test(cleaned) && /proof of citizenship/i.test(cleaned) && /mail-in ballots/i.test(cleaned)
      ? "我要求选民出示照片身份证明和公民身份证明，并反对无条件邮寄投票。"
      : "";
  }
  if (/\bborder\b|\bimmigration\b|\bdeport(?:ation)?\b|\bice\b|nice facility/i.test(cleaned)) {
    return "";
  }
  return "";
}

function buildChineseSummary(quote, analysis) {
  const entities = extractEntities(quote);
  const subject = entities.length ? `（${entities.slice(0, 3).join(" / ")}）` : "";
  const impact = scoreText(analysis.impact);
  const verify = analysis.verify;
  const topicActions = {
    关税: "涉及贸易条件或关税筹码",
    伊朗协议: "涉及伊朗、中东或核协议相关表态",
    美联储: "涉及利率、通胀或美联储压力",
    能源: "涉及能源供应、油价或通胀预期",
    美股个股: "涉及被点名公司或美股题材",
    选举政治: "涉及候选人背书、投票规则或选举动员",
    中东局势: "涉及中东、以色列、加沙或黎巴嫩局势",
    移民边境: "涉及边境、移民或执法口径",
    综合政治风险: "偏政治情绪或舆论动员",
  };
  const action = topicActions[analysis.topic] || "释放政治信号";
  return `${analysis.topic}：${action}${subject}，当前判断为“${impact}”。后续看${verify}。`;
}

function cleanSpeechText(value) {
  return stripUrls(String(value || ""))
    .replace(/^RT @realDonaldTrump\s*/i, "")
    .replace(/President\s+(DONALD J\. TRUMP|DJT)\.?/gi, "")
    .replace(/\bDONALD J\. TRUMP\b\.?/gi, "")
    .replace(/Thank you for your attention to this matter!?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeChineseSpeech(value) {
  return String(value || "")
    .replace(/^美国总统特朗普[：:]\s*/, "")
    .replace(/^美国总统特朗普称\s*/, "")
    .replace(/^特朗普[：:]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripUrls(value) {
  return String(value || "").replace(/https?:\/\/\S+/gi, "").trim();
}

function extractNominationName(value) {
  const match = value.match(/nomination of\s+([^@!,]+?)(?:\s+@| as |!|,)/i);
  return match ? match[1].trim() : "";
}

function compactChineseTopic(value, analysis) {
  const entities = extractEntities(value);
  if (entities.length) return `${entities.slice(0, 3).join("、")}相关问题`;
  return `${analysis.topic}相关问题`;
}

function isShortSpeech(value) {
  const text = stripUrls(value);
  const sentenceCount = text.split(/[.!?。！？]+/).filter((item) => item.trim().length > 4).length;
  return text.length <= SHORT_SPEECH_LIMIT && sentenceCount <= 3;
}

function translateShortSpeech(value, analysis) {
  const text = cleanSpeechText(value).replace(/\s+!!!?$/g, "!").trim();
  const lower = text.toLowerCase();

  if (!text) return "";
  if (/^thank you,\s*scotland/i.test(text)) return "感谢苏格兰！";
  if (/^he won,\s*big/i.test(text)) return "他大获全胜！";
  if (/^these pictures were taken this morning/i.test(text)) return "这些照片是今天早上拍的。";
  if (/^the failing new york times is corrupt/i.test(text)) return "失败的《纽约时报》是腐败的！";
  if (/^big rally tonight on the national mall/i.test(text)) return "今晚国家广场有大型集会，音乐会很棒；晚上7点到场。";
  if (/my real poll numbers are the highest they have ever been/i.test(text)) return "我的真实民调数字达到历史最高，谢谢！";
  if (/hard rubber surface.*no paint.*vandals/i.test(text)) return "这是硬橡胶表面，不是油漆；这是被破坏者切开并拉扯之前的样子。";
  if (/vote for\s+andy biggs/i.test(text)) return "投票支持Andy Biggs竞选亚利桑那州州长，他很棒！";
  if (/america the beautiful will never be a communist country/i.test(text)) return "美丽的美国永远不会成为共产主义国家！";
  if (/everybody is fully aware that iran will agree.*weapons inspections/i.test(text)) return "所有人都很清楚，伊朗会同意接受重大武器检查，以长期确保“核诚实”。";
  if (/federal reserve|powell|interest rates?|rate cut|tariff|tariffs|border|immigration|deport|iran|hormuz|nuclear/i.test(lower)) return "";
  if (/vote for/i.test(lower)) return translateVoteFor(text);
  if (/thank you/i.test(lower)) return translateThankYou(text);
  if (/great meeting/i.test(lower)) return translateMeeting(text);
  return "";
}

function summarizeFallbackSpeech(value, analysis) {
  const cleaned = cleanSpeechText(value);
  const sentence = pickKeySentence(cleaned);
  const lower = sentence.toLowerCase();
  const entities = extractEntities(sentence);

  if (/thank you/i.test(sentence)) return translateThankYou(sentence);
  if (/vote for/i.test(sentence)) return translateVoteFor(sentence);
  if (/great meeting/i.test(sentence)) return translateMeeting(sentence);
  if (/approval|poll/i.test(lower)) return `我提到民调或支持率变化，重点涉及${entities[0] || analysis.topic}。`;
  if (/record|all time/i.test(lower)) return `我强调出现新的纪录，重点涉及${entities.slice(0, 2).join("、") || analysis.topic}。`;
  if (/fake news|radical left|democrat/i.test(lower)) return "我批评媒体、民主党或激进左翼的说法，并强调自己的立场。";
  if (/crime|shooting|police|arrest/i.test(lower)) return "我提到治安、执法或逮捕进展，强调需要更强硬处理。";
  if (/communist|communism/i.test(lower)) return "我强调美国不会走向共产主义，并把这作为政治立场表态。";
  if (/\b(lost|win|won|defeat|election|congressman|senator|governor)\b/i.test(lower)) return translatePoliticalResult(sentence, analysis);
  return translatePlainStance(sentence, analysis);
}

function pickKeySentence(value) {
  const sentences = String(value || "")
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const meaningful = sentences.find((item) => {
    const lower = item.toLowerCase();
    return !/^president\s/.test(lower) && !/^thank you for your attention/.test(lower) && item.length > 12;
  });
  return meaningful || sentences[0] || value;
}

function translateThankYou(value) {
  const match = value.match(/thank you,\s*([^!.]+)[!.]*/i);
  return match ? `感谢${match[1].trim()}。` : "我表达了感谢。";
}

function translateVoteFor(value) {
  if (/vote republican/i.test(value)) return "我呼吁选民今后投票支持共和党。";
  const match = value.match(/vote for\s+(.+?)(?:\s+on\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|[,.;!—-]| for |$)/i);
  if (!match) return "我呼吁选民投票支持相关候选人。";
  const name = cleanCampaignName(match[1]);
  return name ? `我呼吁选民投票支持${name}。` : "我呼吁选民投票支持相关候选人。";
}

function translateMeeting(value) {
  if (/intel ceo,\s*lip-bu tan/i.test(value)) return "我刚与英特尔CEO陈立武举行了一场重要会面。";
  const match = value.match(/great meeting with\s+(.+?)(?:\.|,|$)/i);
  return match ? `我刚与${match[1].trim()}举行了一场重要会面。` : "我提到刚完成一场重要会面。";
}

function translateCampaignSpeech(value) {
  const name = extractCampaignName(value);
  if (/henry cuellar/i.test(value) && /tano tijerina/i.test(value)) {
    return "我说曾赦免Henry Cuellar，但现在支持Tano Tijerina与他竞争，因为后者在边境、减税和军事上更强硬。";
  }
  if (/clay fuller/i.test(value) && /won convincingly|congratulations/i.test(value)) {
    return "我祝贺Clay Fuller赢下相关席位，并称他比前任有明显改善。";
  }
  if (/complete and total endorsement|endorse|endorsement/i.test(value)) {
    return name ? `我宣布支持${name}，并呼吁选民投票。` : "";
  }
  if (/vote for/i.test(value)) return translateVoteFor(value);
  if (/won,\s*big|he won|she won|won the election|big win/i.test(value)) {
    return name ? `我说${name}取得重要胜利。` : "";
  }
  if (/lost,\s*big|just lost|lost the election|defeat/i.test(value)) {
    return name ? `我说${name}选举失利。` : "";
  }
  if (/considering launching|launching (?:her|his)? campaign|is running for|running for|candidate|campaign/i.test(value)) {
    return name ? `我谈到${name}参选，并强调这名候选人支持MAGA和美国优先路线。` : "";
  }
  if (/photo i\.?d/i.test(value) && /proof of citizenship/i.test(value) && /mail-in ballots/i.test(value)) {
    return "我要求选民出示照片身份证明和公民身份证明，并反对无条件邮寄投票。";
  }
  return "";
}

function translatePollSpeech(value) {
  if (/\bice\b.*\bnice\b|change the name of\s+“?ice/i.test(value)) {
    return "我发起投票，询问是否把ICE改名为NICE，并称媒体对移民执法人员不公。";
  }
  if (/dumocrat|dumbocrat/i.test(value)) return "我发起投票，询问大家更喜欢用“Dumocrat”还是“Dumbocrat”称呼民主党。";
  return "";
}

function translateTopicSpeech(value, analysis) {
  const lower = String(value || "").toLowerCase();
  if (analysis.topic === "能源") {
    if (/oil prices.*dropping|gas prices.*dropping|oil prices.*plummeting|gas prices at the pump/i.test(value)) {
      return "我说油价和汽油价格正在下跌，并把这作为美国经济改善的一部分。";
    }
    if (/freedom fuel/i.test(value)) {
      return "我说Freedom Fuel将在费城地区加油站降低汽油价格。";
    }
    if (/oil|gas|fuel|energy|crude|opec/i.test(lower)) return "";
  }
  if (analysis.topic === "美联储") {
    if (/cook lawsuit|board of the federal reserve/i.test(lower)) {
      return "我说有关美联储理事资格的诉讼会继续推进，政府将立即采取行动。";
    }
    if (
      /(?:powell|federal reserve|\bfed\b).{0,100}(?:cut|lower|reduce).{0,30}(?:interest )?rates?|(?:interest )?rates?.{0,80}(?:too high|must come down|should be lower)/i.test(
        lower
      )
    ) {
      return "我认为鲍威尔和美联储行动太慢，应该尽快降息。";
    }
  }
  if (analysis.topic === "关税") {
    if (/iran|iranian/i.test(lower) && /25%|25 percent|effective immediately/i.test(lower)) {
      return "我宣布立即对与伊朗做生意的国家征收25%关税，相关命令是最终决定。";
    }
    if (/tariff|tariffs|trade deal|treated.*unfairly|ripped off/i.test(lower)) return "";
  }
  if (analysis.topic === "伊朗协议") {
    const iranSpeech = translateIranSpeech(value);
    if (iranSpeech) return iranSpeech;
    if (/plan that iran has just sent/i.test(value)) {
      return "我说会审查伊朗刚发来的方案，但目前难以接受，因为伊朗付出的代价还不够。";
    }
    if (/\bvote on iran\b|\biran (?:resolution|sanctions?) vote\b|\bputs iran on notice\b/i.test(lower)) {
      return "我说参议院关于伊朗的投票结果发生变化，并称这会向伊朗发出信号。";
    }
    if (/iran/i.test(lower) && /(?:can never|cannot|must not|will not|won.?t).{0,20}(?:have|obtain).{0,20}nuclear/i.test(lower)) {
      return "我认为伊朗绝不能拥有核武器；相关协议必须确保这一点。";
    }
    if (isStrictIranDealClaim(lower)) return "我认为伊朗协议即将达成。";
    if (/deal|agreement|ceasefire|hormuz|strike|attack|war|military/i.test(lower)) return "";
  }
  if (analysis.topic === "中东局势") {
    if (/peace plan|ceasefire|gaza|hamas|israel|israeli|lebanon|beirut|netanyahu/i.test(value)) return "";
  }
  if (analysis.topic === "移民边境") {
    if (/\bborder\b|immigration|deport|migrant|alien|\bice\b|i\.c\.e\./i.test(value)) return "";
  }
  return "";
}

function translateIranSpeech(value) {
  const lower = String(value || "").toLowerCase();
  if (/oil is flowing.*iran can never have a nuclear weapon/i.test(value)) {
    return "我说原油正在流动，伊朗绝不能拥有核武器；股市和就业创高、物价在下降。";
  }
  if (/israel never talked me into the war with iran/i.test(value)) {
    return "我说不是以色列说服我对伊朗开战，真正原因是伊朗绝不能拥有核武器。";
  }
  if (/i.?m winning a war.*blockade.*destroying iran|blockade.*destroying iran/i.test(value)) {
    return "我说美国正在赢得对伊朗的战争，封锁正严重打击伊朗，媒体却在误导外界。";
  }
  if (/1000 missiles.*locked and loaded.*assassinate.*(?:me|president)/i.test(value)) {
    return "我说已有1000枚导弹锁定目标；如果伊朗政府企图暗杀我，美国将立即作出强力回应。";
  }
  if (/locked and loaded/i.test(value) && /peaceful protesters|come to their rescue/i.test(value)) {
    return "我警告伊朗如果射杀和平示威者，美国会出手援助；我们已经准备好行动。";
  }
  if (/iran is looking at freedom/i.test(value)) return "我说伊朗正在看到前所未有的自由，美国已准备好提供帮助。";
  if (/iranian patriots.*keep protesting|take over your institutions/i.test(value)) {
    return "我呼吁伊朗爱国者继续抗议、接管机构，并称杀人者和施暴者会付出代价。";
  }
  if (/scheduled hangings.*cancelled|over 800/i.test(value)) return "我说伊朗领导层取消原定处决值得尊重，并对此表示感谢。";
  if (/going to hit very hard|we will hit them with a force/i.test(value)) {
    return "我警告伊朗不要发动打击，否则美国会以前所未有的力量反击。";
  }
  if (/destroying the terrorist regime of iran|iran.?s navy is gone|air force is no longer/i.test(value)) {
    return "我说美国正在军事和经济上摧毁伊朗政权，并批评媒体淡化伊朗军力受损。";
  }
  if (/taking over the entire middle east|obliterating israel/i.test(value)) {
    return "我说伊朗曾计划接管整个中东并消灭以色列，但这些计划已经结束。";
  }
  if (/iranian terror state|so called .?strait/i.test(value)) {
    return "我提出让使用海峡的国家承担责任，并称这会促使盟友更快行动。";
  }
  if (/number one state sponsor of terror|putting them out of business/i.test(value)) {
    return "我称伊朗是头号支持恐怖主义的国家，并说美国正迅速削弱其能力。";
  }
  if (/death of iran|greatest enemy america has/i.test(value)) {
    return "我说伊朗衰落后，美国最大的敌人是激进左翼民主党。";
  }
  if (/nato nations.*iran|need nothing from nato/i.test(value)) {
    return "我说北约国家在伊朗问题上没有提供帮助，美国不需要北约，但这点不能忘。";
  }
  if (/pausing the period of energy plant destruction|talks are ongoing/i.test(value)) {
    return "我说应伊朗政府请求，暂停摧毁能源设施10天，谈判仍在继续。";
  }
  if (/power plant day|bridge day|open the .*strait/i.test(value)) {
    return "我威胁伊朗开放海峡，并称电厂和桥梁可能成为打击目标。";
  }
  if (/whole civilization will die|regime change/i.test(value)) {
    return "我说不希望伊朗文明消亡，但在政权更迭后也许会出现转机。";
  }
  if (/fake ten point plan|iran negotiations/i.test(value)) {
    return "我指责媒体编造伊朗谈判十点计划，称其目的是抹黑和平进程。";
  }
  if (/fertilizer prices|price gouging/i.test(value)) {
    return "我说会密切关注伊朗冲突期间的化肥价格，不接受垄断者哄抬价格。";
  }
  if (/blockade ships entering or exiting iranian ports/i.test(value)) {
    return "我宣布美国将在指定时间封锁进出伊朗港口的船只。";
  }
  if (/strait of iran is fully open|full passage/i.test(value)) return "我说伊朗宣布海峡完全开放，可以全面通行。";
  if (/removed, or is removing, all sea mines/i.test(value)) return "我说伊朗在美国帮助下已经或正在清除全部海雷。";
  if (/violated the cease fire/i.test(value)) return "我说伊朗已经多次违反停火。";
  if (/iranian leaders.*release of these women/i.test(value)) return "我要求伊朗领导人释放相关女性，并称这会是谈判的良好开端。";
  if (/playing games.*47 years|delay, delay, delay/i.test(value)) {
    return "我说伊朗多年来一直拖延谈判，并批评奥巴马时期给了伊朗太多好处。";
  }
  if (/response from iran.*totally unacceptable/i.test(value)) return "我说已经看过伊朗代表的回应，并认为完全不可接受。";
  if (/clock is ticking|time is of the essence/i.test(value)) return "我警告伊朗时间不多，必须尽快行动。";
  if (/talks are continuing.*iran/i.test(value)) return "我说与伊朗的谈判正在快速继续。";
  if (/israel and iran must immediately stop/i.test(value)) return "我要求以色列和伊朗立即停止开火。";
  if (/hitting iran.*very hard tonight/i.test(value)) return "我说美国今晚将对伊朗进行强力打击。";
  if (/we didn.?t meet out of desperation|they get no money/i.test(value)) {
    return "我说不是美国绝望求见，而是伊朗；60天期限会继续执行，伊朗拿不到钱。";
  }
  if (/iran is in a stronger position|defeated militarily/i.test(value)) {
    return "我反驳民主党称伊朗更强的说法，强调伊朗在军事上已经失败。";
  }
  if (/stop their.*proxies in lebanon|hit iran very hard again/i.test(value)) {
    return "我要求伊朗立即约束其在黎巴嫩的代理人，否则美国会再次更强力打击伊朗。";
  }
  if (/iran has requested a meeting|doha/i.test(value)) return "我说伊朗请求会面，会议将在多哈举行。";
  if (/australia.*iran national woman|women.?s soccer team|world cup/i.test(value)) {
    return "我谈到伊朗女子足球队安全问题，呼吁相关国家提供庇护或保障。";
  }
  if (/iran.*freedom|protest|terror|strait|blockade|cease fire|negotiations|meeting|ports|mines|proxies|hit iran/i.test(lower)) {
    return "";
  }
  return "";
}

function extractCampaignName(value) {
  const patterns = [
    /^([A-Z][A-Za-z.'’-]+(?:\s+[A-Z][A-Za-z.'’-]+){1,3})\s+is\s+(?:a|an)\b[^.]{0,160}\b(?:candidate|running)/i,
    /(?:endorse|endorsing)\s+[^,]{2,100},\s*([A-Z][A-Za-z.'’-]+(?:\s+[A-Z][A-Za-z.'’-]+){1,3})(?:,|\s+who|\s+for|!|$)/i,
    /(?:endorse|endorsing)\s+[“"']?([^.!?]{2,120}?)(?:, who| who|, a |, an |, the |, for |!|\.|$)/i,
    /vote for\s+(.+?)(?:\.| for |$)/i,
    /word is that\s+([^.!?]{2,120}?)(?:,?\s+is\s+(?:considering|running)|,)/i,
    /i am hearing that\s+([^.!?]{2,120}?)(?:,?\s+is\s+(?:considering|running)|,)/i,
    /([A-Z][A-Za-z.'’-]+(?:\s+[A-Z][A-Za-z.'’-]+){1,3}),[^.]{0,140}\b(?:is running|running for|considering launching|launching)\b/i,
    /([A-Z][A-Za-z.'’-]+(?:\s+[A-Z][A-Za-z.'’-]+){1,3})\s+is running for/i,
  ];
  for (const pattern of patterns) {
    const match = String(value || "").match(pattern);
    if (!match) continue;
    const cleaned = cleanCampaignName(match[1]);
    if (cleaned) return cleaned;
  }
  return "";
}

function cleanCampaignName(value) {
  const candidates = String(value || "")
    .replace(/[“”"']/g, "")
    .split(",")
    .map((part) => stripCampaignDescriptors(part))
    .filter(Boolean);
  for (const candidate of candidates.reverse()) {
    if (isReliablePersonName(candidate)) return candidate;
  }
  return "";
}

function stripCampaignDescriptors(value) {
  let name = String(value || "").replace(/\s+/g, " ").trim();
  const descriptorPatterns = [
    /^(?:highly\s+)?respected\s+/i,
    /^very\s+popular\s+/i,
    /^proven\s+/i,
    /^america\s+first\s+patriot\s+/i,
    /^maga\s+warrior\s+and\s+[^,]+$/i,
    /^maga\s+warrior\s+/i,
    /^real\s+republican\s+/i,
    /^fantastic\s+candidate\s+/i,
    /^phenomenal\s+candidate\s+/i,
    /^major\s+league\s+baseball\s+star\s+/i,
    /^political\s+winner\s+/i,
    /^u\.s\.\s+marine\s+corps\s+veteran\s+and\s+/i,
    /^former\s+[A-Za-z\s.'’-]{2,50}\s+/i,
    /^state\s+representative\s+/i,
    /^state\s+senator\s+/i,
    /^county\s+commissioner\s+/i,
    /^city\s+councilman\s+/i,
    /^texas\s+lieutenant\s+governor\s+/i,
    /^san\s+diego\s+county\s+supervisor\s+/i,
    /^omaha\s+city\s+councilman\s+/i,
    /^congress(?:man|woman)?\s+/i,
    /^senator\s+/i,
    /^governor\s+/i,
    /^dr\.\s+/i,
  ];
  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of descriptorPatterns) {
      const next = name.replace(pattern, "").trim();
      if (next !== name) {
        name = next;
        changed = true;
      }
    }
  }
  return name;
}

function isReliablePersonName(value) {
  const name = String(value || "").trim();
  if (!name || name.length > 44) return false;
  const lower = name.toLowerCase();
  if (
    /america|patriot|warrior|respected|popular|candidate|campaign|congress|senate|district|election|polling|location|endorse|endorsing|anyone|votes|against|save america|find your|democrats|republicans|who|will|never|let|down|for| on | of | in | and |the |man who/.test(lower)
  ) {
    return false;
  }
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) return false;
  return words.every((word) => /^[A-Z][A-Za-z.'’-]+$/.test(word) || /^[A-Z]{2,}$/.test(word));
}

function translatePoliticalResult(value, analysis) {
  const name = extractPersonName(value);
  if (/\b(lost|defeat)\b/i.test(value)) {
    return name ? `我提到${name}选举失利，并把这解释为选民对其政治行为的不满。` : "我提到某名政治人物选举失利，并将其归因于政治立场或行为。";
  }
  if (/\b(won|win)\b/i.test(value)) {
    return name ? `我提到${name}取得选举胜利，并强调这是重要政治信号。` : "我提到相关选举胜利，并强调这是重要政治信号。";
  }
  return translatePlainStance(value, analysis);
}

function translatePlainStance(value, analysis) {
  return "";
}

function extractPersonName(value) {
  const patterns = [
    /congressman\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})/i,
    /senator\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})/i,
    /governor\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})/i,
    /for\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})/i,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[1].trim();
  }
  return "";
}

function extractEntities(value) {
  const text = String(value || "");
  const rules = [
    [/\biran(?:ian)?\b/i, "伊朗"],
    [/\bisrael(?:i)?\b/i, "以色列"],
    [/\bhormuz\b/i, "霍尔木兹"],
    [/\bchina\b|\bchinese\b/i, "中国"],
    [/\btariffs?\b/i, "关税"],
    [/\bfed\b|federal reserve/i, "美联储"],
    [/\bpowell\b/i, "鲍威尔"],
    [/\boil\b|oil prices?|crude/i, "原油"],
    [/\bopec\b/i, "OPEC"],
    [/\bcolombia\b/i, "哥伦比亚"],
    [/\bborder\b/i, "边境"],
    [/\bimmigration\b/i, "移民"],
    [/\bnuclear\b/i, "核协议"],
    [/\brates?\b|interest rates?/i, "利率"],
    [/\binflation\b/i, "通胀"],
  ];
  return [...new Set(rules.filter(([pattern]) => pattern.test(text)).map(([, label]) => label))];
}

function scoreText(value) {
  if (value >= 70) return "高敏感";
  if (value >= 50) return "有波动";
  return "低相关";
}

function repeatText(novelty) {
  if (novelty <= 30) return "重复观点";
  if (novelty <= 55) return "半新半旧";
  return "新信息";
}

function renderVerificationChip(value) {
  const text = verificationBadgeText(value);
  return text ? `<span class="chip">${escapeHtml(text)}</span>` : "";
}

function verificationBadgeText(value) {
  return value >= 60 ? "可核验" : "";
}

function colorForScore(value) {
  if (value >= 70) return "#cf3f3f";
  if (value >= 50) return "#a96700";
  return "#6b7280";
}

function riskBackground(value) {
  if (value >= 70) return "#fff1f1";
  if (value >= 50) return "#fff7ed";
  return "#f2f4f8";
}

function formatWindowDate(value) {
  return value ? value.replaceAll("-", ".") : "--";
}

function formatDateLabel(value) {
  if (!value) return "";
  const { day, time } = formatDateParts(value);
  return `${day}${time ? ` ${time}` : ""}`;
}

function formatDateParts(value) {
  if (!value) return { day: "--", time: "" };
  const [date, time = ""] = value.split(" ");
  return {
    day: date.slice(5),
    time: time.slice(0, 5),
  };
}

function compactQuote(value, limit) {
  const normalized = String(value || "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length <= limit) return normalized;
  const clipped = normalized.slice(0, limit).replace(/\s+\S*$/, "");
  return `${clipped}...`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function countMatches(text, words) {
  return words.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

init();
