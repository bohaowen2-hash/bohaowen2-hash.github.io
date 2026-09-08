/* 博浩英语 CET-6 · 词库导入工具 v2（同词合并多义） */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
const TMP = process.env.TEMP || "/tmp";

const curatedSrc = fs.readFileSync(path.join(ROOT, "archive/static-v1/assets/js/cet6-words.js"), "utf8");
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(curatedSrc, sandbox);
const curatedUnits = sandbox.CET6_UNITS || [];
const curatedPhrases = sandbox.CET6_PHRASES || [];

const kyle = JSON.parse(fs.readFileSync(path.join(TMP, "dictcheck/cet6.json"), "utf8"));
const ipaMap = new Map();
try {
  const ws = JSON.parse(fs.readFileSync(path.join(TMP, "dictcheck/b.json"), "utf8"));
  for (const it of ws.words || []) {
    const ph = (it.phonetic || "").trim();
    if (ph.startsWith("/") && ph.endsWith("/") && ph.length <= 32) ipaMap.set(it.word.toLowerCase(), ph);
  }
} catch (e) { console.warn("音标源缺失:", e.message); }

/* 同词合并 */
const byWord = new Map();
for (const it of kyle) {
  const w = (it.word || "").trim().toLowerCase();
  if (!w) continue;
  if (!byWord.has(w)) byWord.set(w, { word: it.word.trim(), trs: [], phs: [] });
  const g = byWord.get(w);
  for (const t of it.translations || []) if (t && t.translation && String(t.translation).trim()) g.trs.push({ translation: String(t.translation).trim(), type: (t.type || "").trim() });
  for (const p of it.phrases || []) if (p && p.phrase && String(p.phrase).trim()) g.phs.push({ phrase: String(p.phrase).trim(), translation: (p.translation || "").trim() });
}
function normMerged(g) {
  const trs = [];
  for (const t of g.trs) { if (!trs.some(x => x.translation === t.translation)) trs.push(t); }
  if (!trs.length) return null;
  const types = [...new Set(trs.map(t => t.type).filter(Boolean))];
  return {
    w: g.word,
    f: ipaMap.get(g.word.toLowerCase()) || "",
    p: types.join("/"),
    m: trs.map(t => t.translation).join("；"),
    ex: "", c: "",
    phrases: g.phs
  };
}
const merged = [];
for (const g of byWord.values()) { const n = normMerged(g); if (n) merged.push(n); }

/* 博浩原创优先，去重 */
const seen = new Set();
const curatedWords = [];
curatedUnits.forEach((u, ui) => {
  (u.words || []).forEach(w => {
    const key = w.w.toLowerCase();
    if (!seen.has(key)) { seen.add(key); curatedWords.push({ unit: "core-" + String(ui + 1).padStart(2, "0"), w: w.w, f: w.f || "", p: w.p || "", m: w.m || "", ex: w.ex || "", c: w.c || "", src: "bohao", phrases: [] }); }
  });
});
const bank = [];
for (const n of merged) {
  const key = n.w.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  bank.push(n);
}

const BANK_PER = 150;
let seq = 0;
const units = curatedUnits.map((u, i) => ({ id: "core-" + String(i + 1).padStart(2, "0"), name: u.name, kind: "core", seq: i + 1 }));
const words = curatedWords.map(w => ({ unit: w.unit, w: w.w, f: w.f, p: w.p, m: w.m, ex: w.ex, c: w.c, src: w.src, seq: seq++ }));
let bi = 0;
while (bi < bank.length) {
  const chunk = bank.slice(bi, bi + BANK_PER);
  const g = Math.floor(bi / BANK_PER) + 1;
  units.push({ id: "bk-" + String(g).padStart(2, "0"), name: "大纲词库 · 第 " + g + " 组（" + chunk[0].w + " 起）", kind: "bank", seq: units.length + 1 });
  chunk.forEach(n => words.push({ unit: "bk-" + String(g).padStart(2, "0"), w: n.w, f: n.f, p: n.p, m: n.m, ex: n.ex, c: n.c, src: "open-cet6", seq: seq++ }));
  bi += BANK_PER;
}

/* 短语：博浩核心 + 大纲合并短语（去重） */
const phraseSeen = new Set();
const phrases = [];
let pseq = 0;
curatedPhrases.forEach(([en, zh]) => {
  const key = en.toLowerCase().trim();
  if (!phraseSeen.has(key)) { phraseSeen.add(key); phrases.push({ en: en.trim(), zh: zh.trim(), core: true, src: "bohao", seq: pseq++ }); }
});
for (const n of merged) {
  for (const p of n.phrases || []) {
    const en = p.phrase, zh = (p.translation || "").trim();
    if (!en) continue;
    const key = en.toLowerCase();
    if (phraseSeen.has(key)) continue;
    phraseSeen.add(key);
    phrases.push({ en, zh, core: false, src: "open-cet6", seq: pseq++ });
  }
}

const out = path.join(ROOT, "data/seed");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "units.json"), JSON.stringify(units));
fs.writeFileSync(path.join(out, "words.json"), JSON.stringify(words));
fs.writeFileSync(path.join(out, "phrases.json"), JSON.stringify(phrases));
console.log("units:", units.length);
console.log("words:", words.length, "(curated " + curatedWords.length + " + bank " + bank.length + ")");
console.log("phrases:", phrases.length, "(core " + phrases.filter(p=>p.core).length + ")");
console.log("with-ipa:", words.filter(w=>w.f).length);
console.log("sizes:", ["units","words","phrases"].map(f => Math.round(fs.statSync(path.join(out, f + ".json")).size / 1024) + "KB " + f).join(" | "));