/* ===== 听力生成器：新闻98 + 长对话100 + 讲座98（真题风格原创） ===== */
"use strict";
const fs = require("fs");
const path = require("path");
const H = require("./_helpers.js");
const L1 = require("./lprops1.js");
const L2 = require("./lprops2.js");
const { makeRng, UNIV, CITIES, rInt, pick, cap } = H;

function numFor(R, sentence) {
  if (/minutes/.test(sentence)) return String(rInt(R, 8, 18));
  if (/tons/.test(sentence)) return String(rInt(R, 200, 900));
  if (/thousand/.test(sentence)) return String(rInt(R, 20, 90));
  return String(rInt(R, 20, 90));
}
function fillNews(prop, R) {
  const U = pick(R, UNIV), C = pick(R, CITIES);
  const sub = function (s) {
    return String(s)
      .split("{U}").join(U)
      .split("{C}").join(C)
      .replace(/\{N2\}/g, function () { return numFor(R, s); })
      .replace(/\{N\}/g, function () { return numFor(R, s); });
  };
  const fact = sub(prop.fact);
  const text = [sub(prop.lead), sub(prop.ctx), fact, sub(prop.end)].join(" ");
  return { text: text, fact: fact };
}

function poolsFor(group, role) {
  return group.map(function (p, i) { return { t: p[role], i: i }; });
}
function distractors(pool, selfIdx, R, n) {
  const cand = pool.filter(function (x) { return x.i !== selfIdx; });
  const got = [], used = {};
  for (let k = 0; k < cand.length && got.length < n; k++) {
    const x = cand[Math.floor(R() * cand.length)];
    if (used[x.t]) continue;
    used[x.t] = true; got.push(x.t);
  }
  return got;
}
function buildOptions(R, correct, selfIdx, pool) {
  const wrong = distractors(pool, selfIdx, R, 3);
  const arr = [correct].concat(wrong);
  const order = [];
  for (let i = 0; i < arr.length; i++) order.push(i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = order[i]; order[i] = order[j]; order[j] = t; }
  const opts = order.map(function (k) { return arr[k]; });
  return { opts: opts, ans: order.indexOf(0) };
}
function makeQ(R, q, correct, selfIdx, pool, ex) {
  const o = buildOptions(R, correct, selfIdx, pool, ex);
  return { q: q, opts: o.opts, ans: o.ans, ex: ex };
}

function buildNewsGroup(seedBase) {
  const props = L1.news;
  const poolTp = poolsFor(props, "tp");
  const poolFact = props.map(function (p, i) { return { t: cap(fillNews(p, makeRng(40000 + i * 17)).fact), i: i }; });
  const items = [];
  const TOTAL = 98;
  for (let k = 0; k < TOTAL; k++) {
    const prop = props[k % props.length];
    const R = makeRng(seedBase + k * 104729);
    const res = fillNews(prop, R);
    const qs = [
      makeQ(R, "What is the news report mainly about?", cap(prop.tp), k % props.length, poolTp, "主旨题。新闻导语围绕「" + prop.zt + "」展开，正确项概括了报道主题。"),
      makeQ(R, "Which of the following is TRUE according to the report?", cap(res.fact), k % props.length, poolFact, "细节题。原文明确提到：" + prop.zd + "，其余选项与报道内容不符。")
    ];
    items.push({ title: prop.t, sub: "短篇新闻 News Report · 博浩原创真题风格语料", data: { type: "news", text: res.text, qs: qs } });
  }
  return items;
}

function buildConvGroup(seedBase) {
  const props = L1.conversation;
  const poolTp = poolsFor(props, "tp");
  const poolDs = poolsFor(props, "ds");
  const poolSg = poolsFor(props, "sg");
  const items = [];
  const TOTAL = 100;
  for (let k = 0; k < TOTAL; k++) {
    const prop = props[k % props.length];
    const R = makeRng(seedBase + k * 100003);
    const text = prop.lines.join("\n");
    const qs = [
      makeQ(R, "What are the two speakers mainly talking about?", cap(prop.tp), k % props.length, poolTp, "主旨题。对话围绕「" + prop.zt + "」展开，正确项概括了谈话主题。"),
      makeQ(R, "What can we learn from the conversation?", cap(prop.ds), k % props.length, poolDs, "细节题。对话中提到：" + prop.zs + "。"),
      makeQ(R, "What do the speakers decide to do at the end of the conversation?", cap(prop.sg), k % props.length, poolSg, "结尾题。对话最后双方决定：" + prop.zj + "。")
    ];
    items.push({ title: prop.t, sub: "长对话 Long Conversation · 博浩原创真题风格语料", data: { type: "conversation", text: text, qs: qs } });
  }
  return items;
}

function buildLectureGroup(seedBase) {
  const props = L2;
  const poolTp = poolsFor(props, "tp");
  const poolDs = poolsFor(props, "ds");
  const poolSg = poolsFor(props, "sg");
  const items = [];
  const TOTAL = 98;
  for (let k = 0; k < TOTAL; k++) {
    const prop = props[k % props.length];
    const R = makeRng(seedBase + k * 99991);
    const text = prop.lines.join("\n");
    const qs = [
      makeQ(R, "What is the lecture mainly about?", cap(prop.tp), k % props.length, poolTp, "主旨题。讲座围绕「" + prop.zt + "」展开。"),
      makeQ(R, "Which of the following is TRUE according to the lecture?", cap(prop.ds), k % props.length, poolDs, "细节题。讲座中讲到：" + prop.zs + "。"),
      makeQ(R, "What does the speaker suggest at the end of the lecture?", cap(prop.sg), k % props.length, poolSg, "结尾题。演讲者最后建议：" + prop.zj + "。")
    ];
    items.push({ title: prop.t, sub: "讲座 / 讲话 Lecture · 博浩原创真题风格语料", data: { type: "lecture", text: text, qs: qs } });
  }
  return items;
}

const news = buildNewsGroup(5100001);
const conv = buildConvGroup(5200001);
const lect = buildLectureGroup(5300001);
const items = news.concat(conv, lect);

let bad = 0, tooShort = 0;
items.forEach(function (it) {
  const words = it.data.text.trim().split(/\s+/).length;
  if (words < 40) tooShort++;
  it.data.qs.forEach(function (q) { if (q.opts.length !== 4 || q.ans < 0 || q.ans > 3 || !q.ex) bad++; });
});
console.log("listening items:", items.length, "| news:", news.length, "conv:", conv.length, "lecture:", lect.length);
console.log("bad q:", bad, "| too-short scripts:", tooShort);
fs.writeFileSync(path.join(__dirname, "..", "..", "data", "seed", "generated-listening.json"), JSON.stringify(items));
console.log("---- conversation sample ----");
console.log(items[100].data.text.slice(0, 700));
console.log("---- lecture sample ----");
console.log(items[240].data.text.slice(0, 600));
console.log("---- news sample ----");
console.log(items[3].data.text.slice(0, 600));
console.log("---- q sample ----");
console.log(JSON.stringify(items[100].data.qs[0], null, 1));
