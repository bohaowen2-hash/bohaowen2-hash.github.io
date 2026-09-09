/* 博浩英语 CET-6 · 词库导入工具 v3.2（7000词 / 50词一单元 / 高·中·低频） */
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
/* Kyle 同词合并 */
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
/* wang 独有清洗 */
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
/* 合并 */
const map = new Map();
function put(rec) { const k = rec.w.toLowerCase(); if (!map.has(k)) map.set(k, rec); }
sand.CET6_UNITS.forEach(u => (u.words || []).forEach(w => put({ w: w.w, f: w.f || "", p: w.p || "", m: w.m || "", ex: w.ex || "", c: w.c || "", src: "bohao" })));
for (const g of byWord.values()) { const r = kyleRec(g); if (r) put(r); }
wangOnlyArr.forEach(r => put(r));

/* 打分分层 */
const rows = [];
for (const rec of map.values()) {
  const k = rec.w.toLowerCase();
  const cur = curatedSet.has(k), kk = kSet.has(k), ww = wSet.has(k), cc = cSet.has(k);
  let score;
  if (cur) score = 5; else if (kk && ww) score = 4; else if (cc) score = 3; else if (kk) score = 2; else score = 1;
  rows.push({ rec, score, cur, kk, ww, cc });
}
rows.sort((a, b) => (b.score - a.score) || a.rec.w.localeCompare(b.rec.w, "en"));

/* 取 7000 并按位次分配频次 */
const TOTAL = 7000;
const HI = Math.round(TOTAL * 0.20);   // 高 1400
const MID = Math.round(TOTAL * 0.70);  // 中 边界(前70%)
const chosen = rows.slice(0, TOTAL);
const words = chosen.map((x, i) => {
  const freq = i < HI ? "高" : i < MID ? "中" : "低";
  return Object.assign({}, x.rec, { freq });
});
/* 50 词分组 */
const perUnit = 50;
const units = [];
let seq = 0;
for (let i = 0; i < words.length; i += perUnit) {
  const chunk = words.slice(i, i + perUnit);
  const g = i / perUnit + 1;
  units.push({ id: "u" + String(g).padStart(3, "0"), name: chunk[0].freq + "频词 " + g + " 组 · " + chunk[0].w + " 起", kind: chunk[0].freq, seq: units.length + 1 });
  chunk.forEach(w => { w.unit = units[units.length - 1].id; w.seq = seq++; });
}
const out = path.join(ROOT, "data/seed");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "units.json"), JSON.stringify(units));
fs.writeFileSync(path.join(out, "words.json"), JSON.stringify(words));
const cnt = f => words.filter(w => w.freq === f).length;
console.log("total:", words.length, "units:", units.length, "perUnit:", perUnit);
console.log("high:", cnt("高"), "mid:", cnt("中"), "low:", cnt("低"));
console.log("unit1:", words.slice(0, 6).map(w => w.w + "(" + w.freq + ")").join(", "));
console.log("unit140 first:", words[6950] && words[6950].w + "(" + words[6950].freq + ")");
const probe = w => { const f = words.find(x => x.w === w); console.log(w + " ->", f ? f.freq : "N/A"); };
probe("abandon"); probe("something"); probe("ability"); probe("serendipity");