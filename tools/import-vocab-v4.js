/* 博浩英语 CET-6 · 词库导入工具 v4（7000词/50词单元/高·中·低频 + 词根词缀/形近词/记忆提示） */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
const TMP = process.env.TEMP || "/tmp";

const curatedSrc = fs.readFileSync(path.join(ROOT, "archive/static-v1/assets/js/cet6-words.js"), "utf8");
const sand = {}; vm.createContext(sand); vm.runInContext(curatedSrc, sand);
const kyle = JSON.parse(fs.readFileSync(path.join(TMP, "dictcheck/cet6.json"), "utf8"));
const ws = JSON.parse(fs.readFileSync(path.join(TMP, "dictcheck/b.json"), "utf8"));
const cet4 = JSON.parse(fs.readFileSync(path.join(TMP, "dictcheck/cet4.json"), "utf8"));

const curatedSet = new Set();
sand.CET6_UNITS.forEach(u => (u.words || []).forEach(w => curatedSet.add(w.w.toLowerCase())));
const kSet = new Set(kyle.map(x => x.word.toLowerCase()));
const wArr = ws.words || [];
const wMap = new Map(wArr.map(x => [x.word.toLowerCase(), x]));
const wSet = new Set(wArr.map(x => x.word.toLowerCase()));
const cSet = new Set(cet4.map(x => x.word.toLowerCase()));

function ipaOf(word) { const ph = ((wMap.get(word.toLowerCase()) || {}).phonetic || "").trim(); return ph.startsWith("/") && ph.endsWith("/") && ph.length <= 32 ? ph : ""; }
const byWord = new Map();
for (const it of kyle) {
  const k = (it.word || "").trim().toLowerCase(); if (!k) continue;
  if (!byWord.has(k)) byWord.set(k, { w: it.word.trim(), trs: [] });
  const g = byWord.get(k);
  (it.translations || []).forEach(t => { if (t && t.translation && String(t.translation).trim()) g.trs.push({ t: String(t.translation).trim(), ty: (t.type || "").trim() }); });
}
function kyleRec(g) {
  const trs = []; g.trs.forEach(t => { if (!trs.some(x => x === t.t)) trs.push(t.t); });
  if (!trs.length) return null;
  const types = [...new Set(g.trs.map(t => t.ty).filter(Boolean))];
  return { w: g.w, f: ipaOf(g.w), p: types.join("/"), m: trs.join("；"), ex: "", c: "", src: "open" };
}
const badChars = /[ːˈˌ\u0283\u0292\u0251\u025a\u025b\u0259\u026a\u0254\u028a\u026f\u025d]/;
function cleanWangMeaning(raw) {
  let m = String(raw || "").trim();
  if (!m || m.length < 2 || m.length > 200) return null;
  if (badChars.test(m.slice(0, 14)) || /[\uFF3B\uFF3D\[\]]/.test(m) || /\s{3,}/.test(m)) return null;
  m = m.replace(/\s+/g, " ").trim();
  let p = "";
  const pm = m.match(/^((?:[a-z]+\/)*[a-z]+)\.\s*/i);
  if (pm) { p = pm[1].toLowerCase() + "."; m = m.slice(pm[0].length); }
  return { p, m };
}
const wangOnlyArr = [];
for (const w of wArr) {
  const k = (w.word || "").trim().toLowerCase();
  if (!k || curatedSet.has(k) || kSet.has(k)) continue;
  const cleaned = cleanWangMeaning(w.meaning);
  if (!cleaned) continue;
  wangOnlyArr.push({ w: w.word.trim(), f: ipaOf(w.word), p: cleaned.p, m: cleaned.m, ex: "", c: "", src: "open" });
}
const map = new Map();
function put(rec) { const k = rec.w.toLowerCase(); if (!map.has(k)) map.set(k, rec); }
sand.CET6_UNITS.forEach(u => (u.words || []).forEach(w => put({ w: w.w, f: w.f || "", p: w.p || "", m: w.m || "", ex: w.ex || "", c: w.c || "", src: "bohao" })));
for (const g of byWord.values()) { const r = kyleRec(g); if (r) put(r); }
wangOnlyArr.forEach(r => put(r));

const rows = [];
for (const rec of map.values()) {
  const k = rec.w.toLowerCase();
  const cur = curatedSet.has(k), kk = kSet.has(k), ww = wSet.has(k), cc = cSet.has(k);
  let score;
  if (cur) score = 5; else if (kk && ww) score = 4; else if (cc) score = 3; else if (kk) score = 2; else score = 1;
  rows.push({ rec, score });
}
rows.sort((a, b) => (b.score - a.score) || a.rec.w.localeCompare(b.rec.w, "en"));

const TOTAL = 7000, HI = Math.round(TOTAL * 0.20), MID = Math.round(TOTAL * 0.70);
const chosen = rows.slice(0, TOTAL);
const words = chosen.map((x, i) => {
  const freq = i < HI ? "高" : i < MID ? "中" : "低";
  return Object.assign({}, x.rec, { freq });
});

/* ---------- 词根词缀 / 记忆 / 形近词 增强 ---------- */
const PREFIXES = [
  ["un", "不；相反"], ["re", "再；回"], ["dis", "不；分开"], ["im", "不；向内"], ["in", "不；向内"], ["ir", "不"], ["il", "不"],
  ["pre", "预先"], ["post", "之后"], ["over", "过度；在上"], ["sub", "在下；次级"], ["trans", "跨越；转变"], ["inter", "之间"],
  ["multi", "多"], ["anti", "反对"], ["mis", "错误"], ["non", "非"], ["ex", "向外；前任"], ["co", "共同"], ["en", "使；进入"],
  ["de", "去除；向下"], ["pro", "向前；支持"], ["super", "超级；在上"], ["under", "不足；在下"], ["semi", "半"], ["tele", "远"],
  ["auto", "自动；自己"], ["bio", "生命"], ["geo", "地球；地理"], ["micro", "微小"], ["macro", "宏观"], ["mono", "单一"],
  ["poly", "多"], ["uni", "单一"], ["bi", "二"], ["tri", "三"]
];
const SUFFIXES = [
  ["tion", "名词：…的行为/状态"], ["sion", "名词：…的行为/状态"], ["ment", "名词：…的结果/过程"], ["ness", "名词：…的性质"],
  ["ity", "名词：…的性质"], ["ty", "名词：…的性质"], ["er", "…的人/物"], ["or", "…的人/物"], ["ist", "…者/…家"],
  ["ism", "…主义/学说"], ["logy", "…学/…论"], ["ful", "充满…的"], ["less", "无…的"], ["ous", "…的"], ["ious", "…的"],
  ["able", "可…的"], ["ible", "可…的"], ["al", "…的"], ["ive", "…性的"], ["ize", "使…化"], ["ise", "使…化"],
  ["ly", "…地"], ["en", "使变得"], ["hood", "…的状态"], ["ship", "身份/关系"], ["ance", "名词"], ["ence", "名词"],
  ["th", "名词"], ["ic", "…的"], ["ary", "…的"], ["ish", "…似的"]
];
function affixOf(word) {
  const lw = word.toLowerCase();
  const parts = [];
  for (const [p, mean] of PREFIXES) if (lw.length > p.length + 2 && lw.startsWith(p)) { parts.push("前缀 " + p + "-：" + mean); break; }
  for (const [s, mean] of SUFFIXES) if (lw.length > s.length + 2 && lw.endsWith(s)) { parts.push("后缀 " + s + "：" + mean); break; }
  return parts.join("；");
}
function chunkWord(word) {
  const out = [];
  for (let i = 0; i < word.length; i += 2) out.push(word.slice(i, i + 2));
  return out.join("·");
}
function dist(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 1) return 9;
  const dp = [];
  for (let i = 0; i <= m; i++) { dp[i] = []; dp[i][0] = i; }
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const cost = a[i - 1] === b[j - 1] ? 0 : 1;
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    if (dp[i][j] > 2) dp[i][j] = 3;
  }
  return dp[m][n];
}
/* 用长度 + 前2字母建索引找形近词 */
const idx = {};
words.forEach(w => {
  const k = w.w.length + ":" + w.w.toLowerCase().slice(0, 2);
  (idx[k] = idx[k] || []).push(w.w);
});
const simMap = {};
words.forEach(w => {
  const lw = w.w.toLowerCase();
  const cand = [];
  for (const L of [lw.length - 1, lw.length, lw.length + 1]) {
    const key = L + ":" + lw.slice(0, 2);
    (idx[key] || []).forEach(c => { const lc = c.toLowerCase(); if (lc !== lw) cand.push(c); });
  }
  const res = [];
  cand.forEach(c => { if (dist(lw, c.toLowerCase()) <= 1 && res.length < 3) res.push(c); });
  simMap[w.w.toLowerCase()] = res;
});
words.forEach(w => {
  const lw = w.w.toLowerCase();
  const af = affixOf(w.w);
  const sim = simMap[lw] || [];
  let mem;
  if (af) mem = "拆词记忆：" + af + (sim[0] ? "；与 " + sim[0] + " 对照辨析" : "");
  else mem = "拼读记忆：" + w.w + " → " + chunkWord(w.w) + " 分段朗读" + (sim[0] ? "；与 " + sim[0] + " 对照辨析" : "");
  w.af = af; w.mem = mem; w.sim = sim;
});

/* 50 词分组 + 单元命名：高频词 Unit n */
const perUnit = 50;
const units = [];
let seq = 0;
for (let i = 0; i < words.length; i += perUnit) {
  const g = i / perUnit + 1;
  units.push({ id: "u" + String(g).padStart(3, "0"), name: ({ "\u9ad8": "\u9ad8\u9891", "\u4e2d": "\u4e2d\u9891", "\u4f4e": "\u4f4e\u9891" })[words[i].freq] + "\u8bcd Unit " + g, kind: words[i].freq, seq: units.length + 1 });
  words.slice(i, i + perUnit).forEach(w => { w.unit = units[units.length - 1].id; w.seq = seq++; });
}
const out = path.join(ROOT, "data/seed");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "units.json"), JSON.stringify(units));
fs.writeFileSync(path.join(out, "words.json"), JSON.stringify(words));
const cnt = f => words.filter(w => w.freq === f).length;
console.log("total:", words.length, "units:", units.length);
console.log("high/mid/low:", cnt("高"), cnt("中"), cnt("低"));
console.log("with-af:", words.filter(w => w.af).length, "with-sim:", words.filter(w => w.sim.length).length);
console.log("unit1 name:", units[0].name, "| unit2:", units[1].name, "| unit29:", units[28].name, "| unit99:", units[98].name);
const probe = ["abandon", "ability", "something"];
probe.forEach(x => { const f = words.find(w => w.w === x); if (f) console.log(x, "| af:", f.af || "-", "| sim:", (f.sim || []).join(","), "| mem:", f.mem); });