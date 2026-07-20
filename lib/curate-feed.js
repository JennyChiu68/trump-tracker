const BLOCK_TERMS = [
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
  "beijing",
  "taiwan",
  "hong kong",
  "xinjiang",
  "tibet",
  "trade war",
  "china trade",
  "cny",
  "cnh",
  "renminbi",
  "yuan",
];

const MARKET_TERMS = [
  "伊朗",
  "霍尔木兹",
  "核武器",
  "核协议",
  "中东",
  "以色列",
  "加沙",
  "黎巴嫩",
  "原油",
  "油价",
  "汽油",
  "美联储",
  "鲍威尔",
  "降息",
  "利率",
  "通胀",
  "关税",
  "贸易协议",
  "美股",
  "戴尔",
  "美光",
  "iran",
  "iranian",
  "hormuz",
  "nuclear",
  "middle east",
  "israel",
  "israeli",
  "gaza",
  "hamas",
  "lebanon",
  "beirut",
  "oil",
  "crude",
  "gas prices",
  "gasoline",
  "fuel",
  "opec",
  "powell",
  "federal reserve",
  "interest rate",
  "rate cut",
  "inflation",
  "tariff",
  "trade deal",
  "dell",
  "micron",
];

const POLITICAL_NOISE_TERMS = [
  "complete and total endorsement",
  "vote for",
  "running for congress",
  "candidate for congress",
  "election day",
  "竞选",
  "候选人",
  "投票支持",
];

function curatePayload(payload) {
  const items = (payload.items || [])
    .filter(isCuratedMarketItem)
    .sort((a, b) => String(a.publishedAt || "").localeCompare(String(b.publishedAt || "")));
  return {
    generatedAt: payload.generatedAt,
    window: payload.window,
    coverage: {
      mode: "curated-market-insights",
      note: "仅提供三个市场功能所需的精选发言",
    },
    items,
  };
}

function isCuratedMarketItem(item) {
  const quote = String(item.spokenText || item.text || item.quote || "").trim();
  if (!quote || isMediaOrLinkOnly(quote)) return false;

  const searchable = searchableText(item);
  if (isBlockedContent(item)) return false;
  if (!MARKET_TERMS.some((term) => searchable.includes(term))) return false;
  if (POLITICAL_NOISE_TERMS.some((term) => searchable.includes(term))) return false;
  return item.isDirectSpeech === true || looksLikeDirectTrumpSpeech(quote);
}

function isBlockedContent(item) {
  const searchable = searchableText(item);
  return BLOCK_TERMS.some((term) => searchable.includes(term));
}

function searchableText(item) {
  return [item.spokenText, item.text, item.quote, item.context, item.sourceTitle]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isMediaOrLinkOnly(value) {
  const text = String(value || "").trim();
  if (/^(图片描述|视频字幕)：/.test(text)) return true;
  if (/^https?:\/\/\S+$/i.test(text)) return true;
  return false;
}

function looksLikeDirectTrumpSpeech(value) {
  const text = String(value || "").replace(/https?:\/\/\S+/gi, " ").replace(/\s+/g, " ").trim();
  if (text.length < 8) return false;
  if (/^RT\s+@/i.test(text)) return false;
  if (/[\u3400-\u9fff]/.test(text)) return /^(我|我们|关于|必须|不能|要么|去买|油价|伊朗|美国)/.test(text);

  const lower = text.toLowerCase();
  const firstPerson = /\b(i|i'm|i’ve|i'll|i’d|my|me|we|we're|we’ve|we'll|our|us)\b/.test(lower);
  const directOpening = /^(iran|the fed|powell|there will be|the united states|oil prices|gas prices|tariffs?|no tolls|just as i promised)/i.test(text);
  return firstPerson || directOpening;
}

module.exports = {
  curatePayload,
  isCuratedMarketItem,
  isBlockedContent,
};
