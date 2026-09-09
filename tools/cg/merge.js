/* ===== 合并生成内容 → seed/content.json 与 db.json（保留用户与进度） ===== */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const SEED_FILE = path.join(ROOT, "data", "seed", "content.json");
const DB_FILE = path.join(ROOT, "data", "db.json");
const GEN_R = path.join(ROOT, "data", "seed", "generated-reading.json");
const GEN_L = path.join(ROOT, "data", "seed", "generated-listening.json");

const content = JSON.parse(fs.readFileSync(SEED_FILE, "utf8"));
const genR = JSON.parse(fs.readFileSync(GEN_R, "utf8"));
const genL = JSON.parse(fs.readFileSync(GEN_L, "utf8"));
const oldR = content.reading || [];
const oldL = content.listening || [];

content.reading = oldR.concat(genR);
content.listening = oldL.concat(genL);
console.log("seed reading:", content.reading.length, "listening:", content.listening.length);
fs.writeFileSync(SEED_FILE, JSON.stringify(content));

// ---- db.json：替换 reading/listening 行，保留其它行与用户 ----
const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
let cid = (db.counters && db.counters.cid) || 1;
const nextCid = function () { return "c" + (cid++); };
db.content = db.content.filter(function (r) { return r.cat !== "reading" && r.cat !== "listening"; });

const addItems = function (cat, arr) {
  arr.forEach(function (it, i) {
    db.content.push({ id: nextCid(), cat: cat, title: it.title || "", sub: it.sub || "", data: it.data || {}, sort: i });
  });
};
addItems("reading", content.reading);
addItems("listening", content.listening);

// 让每个分类内部的 sort 连续且从 0 开始（不影响其它分类）
const byCat = {};
db.content.forEach(function (r) { (byCat[r.cat] = byCat[r.cat] || []).push(r); });
Object.keys(byCat).forEach(function (k) {
  byCat[k].forEach(function (r, i) { r.sort = i; });
});
if (!db.counters) db.counters = { id: 1, cid: 1 };
db.counters.cid = cid;
fs.writeFileSync(DB_FILE, JSON.stringify(db));
console.log("db content rows:", db.content.length, "| users:", db.users.length, "| counters.cid:", db.counters.cid);

const dbCheck = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
const cr = dbCheck.content.filter(function (r) { return r.cat === "reading"; });
const cl = dbCheck.content.filter(function (r) { return r.cat === "listening"; });
console.log("db reading:", cr.length, "listening:", cl.length);
// 抽样校验
function chk(it) {
  const d = it.data || {};
  return !!it.title && (!!d.text || !!d.passage) && Array.isArray(d.qs) && d.qs.every(function (q) { return q.q && Array.isArray(q.opts) && q.opts.length === 4 && q.ans >= 0 && q.ans < 4 && q.ex; });
}
let badR = cr.filter(function (r) { return !chk(r); }).length;
let badL = cl.filter(function (r) { return !chk(r); }).length;
console.log("bad reading rows:", badR, "bad listening rows:", badL);
