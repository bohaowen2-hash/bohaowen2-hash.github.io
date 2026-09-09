/* ===== 阅读文章生成器：40 个主题骨架 → 496 篇真题风格长文 ===== */
"use strict";
const fs = require("fs");
const path = require("path");
const H = require("./_helpers.js");
const RPROPS = require("./rprops1.js").concat(require("./rprops2.js"));
const { makeRng, UNIV, JOURNAL, rInt, rPct, rNum, pick, cap } = H;

function subNum(sentence, R) {
  if (sentence.indexOf("{N}") < 0) return sentence;
  let out = sentence;
  const val = function () {
    if (/degrees?|Celsius/i.test(out)) return String(rInt(R, 2, 8));
    if (/varieties|brands|options|choices|shops|accounts/i.test(out)) return String(rInt(R, 16, 60));
    return String(rInt(R, 12, 55));
  };
  out = out.replace(/\{N\}%/g, function () { return val() + "%"; });
  out = out.replace(/\{N\}/g, function () { return val(); });
  return out;
}
function renderS(prop, R) { return subNum(prop.s, R); }

function basePools() {
  const pools = { c: [], s: [], w: [], d: [] };
  RPROPS.forEach(function (p, i) {
    const R = makeRng(9000 + i * 13);
    pools.c.push({ t: cap(p.c) + ".", i: i });
    pools.s.push({ t: cap(renderS(p, R)), i: i });
    pools.w.push({ t: cap(p.w), i: i });
    pools.d.push({ t: cap(p.d), i: i });
  });
  return pools;
}
const POOLS = basePools();
function distractors(pool, selfIdx, R, n) {
  const cand = pool.filter(function (x) { return x.i !== selfIdx; });
  const got = [];
  const used = {};
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

const P1_LEAD = [
  "A team of researchers at {U} has now added new evidence to the debate, asking a question that is easier to pose than to answer: {c}.",
  "How much does it really matter? A group of researchers at {U} set out to examine a familiar but surprisingly unresolved question: {c}.",
  "For years the answer has remained surprisingly unclear, so researchers at {U} designed a careful study around a single question: {c}."
];
const P1_TAIL = [
  "Their findings, published in {J}, offer one of the clearest answers so far.",
  "The results, reported in {J}, may force many people to reconsider long-held assumptions.",
  "What the team discovered, described in detail in {J}, is worth the attention of anyone who faces this situation regularly."
];
const P2_LEAD = [
  "To answer the question, the researchers designed a study that compared two situations as closely as possible.",
  "The team set out to settle the question with evidence rather than opinion, gathering data over a substantial period.",
  "To examine the issue, the researchers collected information over time and compared the outcomes with unusual care."
];
const P2_MID = [
  "The differences that emerged were consistent and difficult to explain away.",
  "When the data were analysed, a clear pattern appeared.",
  "The results pointed in one direction and were supported by more than one measure."
];
const P2_EXTRA = [
  "The pattern held even after the researchers took other possible explanations into account.",
  "To make sure the comparison was fair, the team controlled for factors such as background and daily habits.",
  "Additional checks ruled out the most obvious alternative explanations."
];
const P3_LEAD = [
  "Why would such a difference appear?",
  "The researchers believe they know why.",
  "What explains the pattern?"
];
const P3_TAIL = [
  "The explanation fits with a wider body of research on how the mind works.",
  "Similar mechanisms have been identified in other settings as well.",
  "It is a reminder that apparently small choices can have surprisingly large effects."
];
const P4_LEAD = [
  "There is, however, another side to the story.",
  "The findings also come with important caveats.",
  "Not everyone thinks the effect is as straightforward as it first appears."
];
const P4_TAIL = [
  "In other words, context matters as much as the practice itself.",
  "The researchers stress that the results should be applied with care.",
  "Taken together, the evidence paints a more balanced picture than headlines suggest."
];
const P4_EXTRA = [
  "For that reason, sweeping conclusions should be treated with caution.",
  "The authors are careful to describe their results as strong evidence rather than final proof.",
  "As always, one study alone rarely settles a question for good."
];
const P5_LEAD = [
  "So what should ordinary readers take away from the study?",
  "What does this mean in practice?",
  "For people who face this question every day, the practical message is fairly clear."
];
const P5_TAIL = [
  "In a busy world, such small adjustments can add up to real change over time.",
  "The study is a useful reminder that everyday habits matter more than we often assume.",
  "Whether the change is worth making now seems easier to answer than it did before."
];
const P5_END = [
  "In the end, the research suggests that small, deliberate habits can shape outcomes more than most people assume.",
  "And that is a conclusion worth acting on, whatever side of the debate one starts from.",
  "The evidence, in short, gives people a practical reason to change how they go about their daily routines."
];

function buildArticle(R, prop, sText) {
  const U = pick(R, UNIV), J = pick(R, JOURNAL);
  const cNoDot = cap(prop.c);
  const fill = function (tpl) {
    return tpl
      .split("{U}").join(U)
      .split("{J}").join(J)
      .split("{c}").join(cNoDot);
  };
  const P1 = [cap(prop.h), fill(pick(R, P1_LEAD)), fill(pick(R, P1_TAIL))];
  const P2 = [pick(R, P2_LEAD), pick(R, P2_MID), sText, pick(R, P2_EXTRA)];
  const P3 = [pick(R, P3_LEAD), cap(prop.w), pick(R, P3_TAIL)];
  const P4 = [pick(R, P4_LEAD), cap(prop.n), pick(R, P4_TAIL), pick(R, P4_EXTRA)];
  const P5 = [pick(R, P5_LEAD), cap(prop.d), pick(R, P5_TAIL), pick(R, P5_END)];
  return [P1, P2, P3, P4, P5].map(function (par) { return par.join(" "); }).join("\n");
}

function buildQuestions(R, prop, sText) {
  const selfIdx = RPROPS.indexOf(prop);
  const s = sText;
  const qs = [
    { q: "What question does the passage set out to answer?", pool: POOLS.c, correct: cap(prop.c) + ".", ex: "主旨题。全文围绕「" + prop.zc + "」展开，正确项完整概括了这项研究要回答的核心问题。" },
    { q: "What did the study described in the passage find?", pool: POOLS.s, correct: s, ex: "细节题。第二段描述了研究结果（" + prop.zs + "），其余选项与文中内容不符。" },
    { q: "What explanation do the researchers offer for the result?", pool: POOLS.w, correct: cap(prop.w), ex: "推断/因果题。第三段解释了结果背后的机制（" + prop.zw + "）。" },
    { q: "What does the passage suggest that readers do?", pool: POOLS.d, correct: cap(prop.d), ex: "建议/态度题。末段给出的建议是「" + prop.zd + "」。" }
  ];
  return qs.map(function (q) {
    const o = buildOptions(R, q.correct, selfIdx, q.pool);
    return { q: q.q, opts: o.opts, ans: o.ans, ex: q.ex };
  });
}

const TITLE_PATTERNS = [
  "{t}：一项新研究给出的答案",
  "{t}，科学怎么说？",
  "研究解读｜{t}",
  "关于{t}的新证据",
  "{t}：证据、机制与启示"
];

const items = [];
const TOTAL = 496;
for (let i = 0; i < TOTAL; i++) {
  const prop = RPROPS[i % RPROPS.length];
  const R = makeRng(20260001 + i * 7919);
  const sText = cap(renderS(prop, R));
  const passage = buildArticle(R, prop, sText);
  const qs = buildQuestions(R, prop, sText);
  const title = TITLE_PATTERNS[Math.floor(R() * TITLE_PATTERNS.length)].replace("{t}", prop.t);
  items.push({
    title: title,
    sub: "仔细阅读 Section C 实战 · 博浩原创真题风格长文 · " + prop.a + "话题",
    data: { area: prop.a, passage: passage, qs: qs }
  });
}

let wordsMin = 1e9, wordsMax = 0, wordsSum = 0, badQ = 0, doublePct = 0;
items.forEach(function (it) {
  const w = it.data.passage.trim().split(/\s+/).length;
  wordsMin = Math.min(wordsMin, w); wordsMax = Math.max(wordsMax, w); wordsSum += w;
  if (it.data.passage.indexOf("%%") > -1) doublePct++;
  it.data.qs.forEach(function (q) {
    const joined = JSON.stringify(q);
    if (joined.indexOf("%%") > -1) doublePct++;
    if (q.opts.length !== 4 || q.ans < 0 || q.ans > 3 || !q.ex) badQ++;
  });
});
console.log("reading items:", items.length);
console.log("words min/max/avg:", wordsMin, wordsMax, Math.round(wordsSum / items.length));
console.log("bad questions:", badQ, "| double-pct spots:", doublePct);
fs.writeFileSync(path.join(__dirname, "..", "..", "data", "seed", "generated-reading.json"), JSON.stringify(items));
console.log("---- passage sample (idx 7) ----");
console.log(items[7].data.passage);
console.log("---- Q2 sample ----");
console.log(JSON.stringify(items[7].data.qs[1], null, 1).slice(0, 900));
