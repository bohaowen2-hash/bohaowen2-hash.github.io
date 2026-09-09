/* ===== 内容生成器 · 公共工具（mulberry32 RNG / 实体池） ===== */
"use strict";
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeRng(seed) { return mulberry32((seed >>> 0) || 1); }
const UNIV = [
  "the University of Oxford", "Stanford University", "Harvard University", "the University of Cambridge",
  "MIT", "Columbia University", "Yale University", "Princeton University", "University College London",
  "the University of Edinburgh", "ETH Zurich", "the University of Toronto", "the University of British Columbia",
  "McGill University", "the University of Melbourne", "the University of Sydney", "the National University of Singapore",
  "the University of Tokyo", "Seoul National University", "Peking University", "Tsinghua University",
  "the University of Hong Kong", "the University of Amsterdam", "the University of Helsinki", "Carnegie Mellon University",
  "the University of Michigan", "the University of California, Berkeley", "the University of Chicago",
  "Northwestern University", "Duke University", "the University of Washington", "the London School of Economics"
];
const RES = [
  "Chen", "Wang", "Li", "Zhang", "Liu", "Yang", "Huang", "Zhao", "Wu", "Zhou", "Xu", "Sun", "Ma", "Zhu",
  "Smith", "Johnson", "Brown", "Taylor", "Anderson", "Thomas", "Martin", "Moore", "Clark", "Lewis",
  "Walker", "Hall", "Young", "King", "Wright", "Scott", "Green", "Baker", "Adams", "Nelson", "Carter",
  "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins",
  "Stewart", "Morris", "Murphy", "Cook", "Rogers", "Morgan", "Peterson", "Cooper", "Reed", "Bailey"
];
const CITIES = [
  "Shanghai", "Beijing", "Guangzhou", "Shenzhen", "Hangzhou", "Chengdu", "Wuhan", "Nanjing",
  "London", "New York", "San Francisco", "Boston", "Chicago", "Seattle", "Toronto", "Sydney",
  "Melbourne", "Singapore", "Tokyo", "Seoul", "Berlin", "Amsterdam", "Helsinki", "Oslo", "Stockholm", "Zurich"
];
const JOURNAL = ["a leading psychology journal", "the journal Nature Human Behaviour", "the Journal of Applied Psychology", "the Journal of Educational Psychology", "the British Medical Journal", "The Lancet Public Health", "the Journal of Environmental Psychology", "the American Economic Review", "Science Advances", "PNAS", "the Journal of Experimental Psychology: General"];
const NAMES = function () { return RES[Math.floor(Math.random() * RES.length)]; };
function rInt(R, lo, hi) { return lo + Math.floor(R() * (hi - lo + 1)); }
function rPct(R, lo, hi) { return rInt(R, lo, hi) + "%"; }
function rNum(R, lo, hi, step) { step = step || 1; return lo + Math.floor(R() * ((hi - lo) / step + 1)) * step; }
function pick(R, arr) { return arr[Math.floor(R() * arr.length)]; }
function shuffle(R, arr) { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
function sampleN(R, arr, n) { return shuffle(R, arr).slice(0, n); }
function cap(s) { s = String(s || "").trim(); return s ? s[0].toUpperCase() + s.slice(1) : s; }
module.exports = { mulberry32, makeRng, UNIV, RES, CITIES, JOURNAL, rInt, rPct, rNum, pick, shuffle, sampleN, cap };
