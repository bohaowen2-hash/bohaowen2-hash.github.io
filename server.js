/* =====================================================================
   博浩英语 CET-6 · 动态学习平台服务器（零第三方依赖）
   创始人：wbh  |  启动：node server.js   |  默认端口 3000（可用 PORT 覆盖）
   ---------------------------------------------------------------------
   功能：静态托管 SPA + REST API（账号/词库/素材/学习记录/打卡/统计/后台管理）
   数据：data/db.json（JSON 数据库，原子写入，首次启动自动从 data/seed 播种）
   ===================================================================== */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SEED_DIR = path.join(DATA_DIR, "seed");
const PORT = parseInt(process.env.PORT || "3000", 10);
const MAX_BODY = 60 * 1024 * 1024; // 60MB（支持词库大体积导入）

/* ---------------- 极小 JSON 数据库 ---------------- */
let db = null, dirty = false, saveTimer = null;
function defaultSettings() {
  return {
    brand: { name: "博浩英语", en: "BohaoEnglish", tagline: "CET-6 六级学习平台" },
    founder: {
      name: "wbh", en: "W.B.H.", avatarText: "文",
      title: "博浩英语（CET-6 学习平台）创始人 & 主编",
      bio: "做六级备考内容的人很多，但博浩英语是一份真诚、免费、体系化的礼物——没有噱头，不讲玄学，只有经过验证的方法和陪你坚持的每一天。愿每一个努力的你，都能一次上岸。",
      sign: "wbh"
    },
    hero: { title: "六级上岸，从博浩英语开始", sub: "一套体系化的 CET-6 备考方案：7000 词条（含大纲与扩展词）、听力精听、英文长阅读、写作模板、翻译题库与 AI 批改。" },
    announcement: "🎉 词库 7000 词条 · 500 篇英文阅读 · 300 条听力 · 真账号云端同步" ,
    examDate: "2026-12-19",
    contact: "wbh@bohaoenglish.cn",
    footerNote: "真诚、免费、体系化的 CET-6 学习平台，由wbh创立并持续维护。"
  };
}
function emptyDb() {
  return {
    meta: { version: 2, created: new Date().toISOString() },
    settings: defaultSettings(),
    users: [],
    units: [], words: [], phrases: [], content: [], classes: [],
    counters: { id: 1, cid: 1 }
  };
}
function loadDb() {
  if (fs.existsSync(DB_FILE)) {
    try { db = JSON.parse(fs.readFileSync(DB_FILE, "utf8")); } catch (e) { db = emptyDb(); }
    if (!db.settings) db.settings = defaultSettings();
    if (!db.users) db.users = [];
    if (!db.units) db.units = [];
    if (!db.words) db.words = [];
    if (!db.phrases) db.phrases = [];
    if (!db.content) db.content = [];
    if (!db.classes) db.classes = [];
    if (!db.counters) db.counters = { id: 1, cid: 1 };
    (db.users || []).forEach(u => { if (!Array.isArray(u.reviews)) u.reviews = []; });
    if (db.meta && db.meta.version < 2) db.settings = Object.assign(defaultSettings(), db.settings || {});
    try {
      const stj = JSON.stringify(db.settings || {});
      if (stj.indexOf("文博浩") > -1 || stj.indexOf("Wen Bohao") > -1) {
        db.settings = JSON.parse(stj.replace(/文博浩/g, "wbh").replace(/Wen Bohao/g, "W.B.H.").replace(/wenbohao/g, "wbh"));
        scheduleSave();
      }
    } catch (e) {}
    if (db.meta && db.meta.version < 4) {
      try {
        db.words.forEach(function (w) {
          if (w && w.m) {
            var parts = String(w.m).split(/[；;]/).map(function (x) { return x.trim(); }).filter(Boolean);
            w.m = parts.slice(0, 2).join("；");
          }
        });
        db.meta.version = 4;
        scheduleSave();
      } catch (e2) {}
    }
    return false;
  }
  db = emptyDb();
  return true; // 需要播种
}
function saveNow() {
  if (!dirty) return;
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
  dirty = false;
}
function scheduleSave() {
  dirty = true;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 80);
}
function nextId() { return db.counters.id++; }
function nextCid() { return "c" + (db.counters.cid++); }
process.on("exit", saveNow);
process.on("SIGINT", () => { saveNow(); process.exit(0); });

/* ---------------- 播种 ---------------- */
function readSeed(name) {
  const p = path.join(SEED_DIR, name);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : [];
}
function seedIfNeeded(isNew) {
  if (!isNew && db.meta && db.meta.seeded) return;
  const units = readSeed("units.json");
  const words = readSeed("words.json");
  const phrases = readSeed("phrases.json");
  const content = readSeed("content.json");
  db.units = units.map(u => ({ id: u.id, name: u.name, kind: u.kind || "core", seq: u.seq || 0 }));
  db.words = words.map(w => ({ id: nextId(), unit: w.unit, w: w.w, f: w.f || "", p: w.p || "", m: w.m || "", ex: w.ex || "", c: w.c || "", freq: w.freq || "", src: w.src || "open", seq: w.seq || 0 }));
  db.phrases = phrases.map(p => ({ id: nextId(), en: p.en, zh: p.zh || "", core: !!p.core, src: p.src || "open", seq: p.seq || 0 }));
  for (const cat of Object.keys(content || {})) {
    (content[cat] || []).forEach((it, i) => {
      db.content.push({ id: nextCid(), cat: cat, title: it.title || "", sub: it.sub || "", data: it.data || {}, sort: i });
    });
  }
  // 默认管理员
  const adminName = "admin";
  const adminPass = process.env.BOHAO_ADMIN_PW || crypto.randomBytes(6).toString("hex");
  const salt = crypto.randomBytes(16).toString("hex");
  db.users.push({
    id: nextId(), username: adminName, name: "站长", role: "admin", guest: false,
    salt, pass: scryptHash(adminPass, salt),
    known: [], wrong: [], checkins: [], activities: [], reviews: [],
    createdAt: new Date().toISOString()
  });
  db.meta.seeded = true;
  db.meta.adminInitialPassword = adminPass;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, "admin.txt"), "管理员账号: admin\n初始密码: " + adminPass + "\n（登录后请在 个人中心 → 修改密码 中更换，并删除本文件）\n", "utf8");
  saveNow();
  console.log("✔ 首次启动：已从种子数据播种（词汇 " + db.words.length + " / 搭配 " + db.phrases.length + " / 素材 " + db.content.length + "）");
  console.log("✔ 管理员账号 admin，初始密码：" + adminPass + "（已写入 data/admin.txt，请尽快修改）");
}
function scryptHash(pw, salt) { return crypto.scryptSync(String(pw), salt, 64).toString("hex"); }
function mergeUniq(a, b) { const s = {}; [].concat(a || []).forEach(x => s[x] = 1); [].concat(b || []).forEach(x => s[x] = 1); return Object.keys(s); }

/* ---------------- 认证 ---------------- */
function tokenOf(req) {
  const h = req.headers.authorization || "";
  if (h.startsWith("Bearer ")) return h.slice(7);
  const url = new URL(req.url, "http://x");
  return url.searchParams.get("token") || "";
}
function userByToken(tok) {
  if (!tok) return null;
  return db.users.find(u => u.token === tok) || null;
}
function publicUser(u) {
  return { id: u.id, username: u.username, name: u.name || u.username, role: u.role || "user", guest: !!u.guest, createdAt: u.createdAt };
}

/* ---------------- 学习统计 ---------------- */
function dateStr(d) { return d.toISOString().slice(0, 10); }
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];
function addDaysDate(s, n) { const d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function ensureReviews(u) { if (!Array.isArray(u.reviews)) u.reviews = []; return u.reviews; }
function reviewSummary(u) {
  const rs = ensureReviews(u); const today = dateStr(new Date());
  const plan = [];
  for (let i = 1; i <= 30; i++) plan.push({ date: addDaysDate(today, i), count: 0 });
  const counts = {};
  rs.forEach(r => { const d = (r.due && r.due >= today) ? r.due : today; counts[d] = (counts[d] || 0) + 1; });
  plan.forEach(p => { p.count = counts[p.date] || 0; });
  return { due: rs.filter(r => !r.due || r.due <= today).length, plan };
}
function calcStats(u) {
  const checkins = [...new Set(u.checkins || [])].sort();
  const days = new Set(checkins);
  // 连续打卡
  let streak = 0;
  const cur = new Date();
  if (!days.has(dateStr(cur))) cur.setDate(cur.getDate() - 1);
  while (days.has(dateStr(cur))) { streak++; cur.setDate(cur.getDate() - 1); }
  // 近 84 天热力图
  const heat = [];
  const start = new Date(); start.setDate(start.getDate() - 83);
  for (let i = 0; i < 84; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    heat.push({ date: dateStr(d), on: days.has(dateStr(d)) });
  }
  // 活动统计
  const acts = u.activities || [];
  const byType = {};
  let totalSec = 0, totalQ = 0, totalRight = 0;
  const dayMinutes = {};
  for (const a of acts) {
    byType[a.type || "other"] = (byType[a.type || "other"] || 0) + 1;
    totalSec += a.seconds || 0;
    totalQ += a.total || 0;
    totalRight += a.correct || 0;
    const key = dateStr(new Date(a.at || Date.now()));
    dayMinutes[key] = (dayMinutes[key] || 0) + Math.round((a.seconds || 0) / 60);
  }
  const last14 = [];
  const s14 = new Date(); s14.setDate(s14.getDate() - 13);
  for (let i = 0; i < 14; i++) {
    const d = new Date(s14); d.setDate(s14.getDate() + i);
    last14.push({ date: dateStr(d), minutes: dayMinutes[dateStr(d)] || 0 });
  }
  const today = dateStr(new Date());
  return {
    knownCount: (u.known || []).length,
    wrongCount: (u.wrong || []).length,
    checkinCount: checkins.length,
    streak,
    checkedToday: days.has(today),
    activityCount: acts.length,
    totalSeconds: totalSec,
    totalQuiz: totalQ,
    totalRight,
    accuracy: totalQ ? Math.round(totalRight / totalQ * 100) : 0,
    byType,
    last14,
    heat,
    recent: acts.slice(-8).reverse(),
    memory: reviewSummary(u)
  };
}

/* ---------------- 路由分发 ---------------- */
function json(res, code, obj) { const b = JSON.stringify(obj); res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); res.end(b); }
function apiError(res, code, msg) { json(res, code, { error: msg }); }
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", c => { size += c.length; if (size > MAX_BODY) { reject(new Error("body too large")); req.destroy(); return; } chunks.push(c); });
    req.on("end", () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}); } catch (e) { reject(new Error("invalid json")); } });
    req.on("error", reject);
  });
}
function cors(res) { res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"); }
function serveStatic(req, res, pathname) {
  const allowed = pathname === "/" || pathname === "/index.html" || pathname === "/manifest.webmanifest" || pathname === "/sw.js" || pathname === "/robots.txt" || pathname === "/sitemap.xml" || pathname.startsWith("/assets/");
  if (!allowed) return false;
  let file = pathname === "/" ? "index.html" : pathname.slice(1);
  const full = path.resolve(ROOT, file);
  if (!full.startsWith(ROOT + path.sep) && full !== path.join(ROOT, "index.html")) return false;
  if (!fs.existsSync(full) || fs.statSync(full).isDirectory()) return false;
  const ext = path.extname(full).toLowerCase();
  const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json; charset=utf-8", ".xml": "application/xml; charset=utf-8" };
  const noCache = ext === ".html" || pathname === "/sw.js" || pathname === "/manifest.webmanifest";
  res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream", "Cache-Control": noCache ? "no-cache" : "public, max-age=3600" });
  fs.createReadStream(full).pipe(res);
  return true;
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  const url = new URL(req.url, "http://x");
  const p = url.pathname;
  const q = url.searchParams;
  try {
    /* ---------- 公开内容 ---------- */
    if (p === "/api/site" && req.method === "GET") {
      const s = db.settings;
      return json(res, 200, {
        brand: s.brand, founder: s.founder, hero: s.hero, announcement: s.announcement,
        examDate: s.examDate, contact: s.contact, footerNote: s.footerNote,
        counts: { units: db.units.length, words: db.words.length, phrases: db.phrases.length, content: db.content.length, users: db.users.length }
      });
    }
    if (p === "/api/units" && req.method === "GET") return json(res, 200, db.units.slice().sort((a, b) => a.seq - b.seq));
    if (p === "/api/words" && req.method === "GET") {
      const unit = q.get("unit") || "";
      const query = (q.get("q") || "").trim().toLowerCase();
      const off = Math.max(0, parseInt(q.get("offset") || "0", 10));
      const lim = Math.min(500, Math.max(1, parseInt(q.get("limit") || "50", 10)));
      let rows = db.words;
      if (unit) rows = rows.filter(w => w.unit === unit);
      if (query) rows = rows.filter(w => w.w.toLowerCase().indexOf(query) === 0 || w.m.toLowerCase().indexOf(query) > -1);
      rows = rows.slice().sort((a, b) => a.seq - b.seq);
      return json(res, 200, { total: rows.length, offset: off, rows: rows.slice(off, off + lim) });
    }
    if (p === "/api/words/lookup" && req.method === "GET") {
      const words = (q.get("w") || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
      if (!words.length) return json(res, 200, { rows: [] });
      const map = {};
      db.words.forEach(w => { const k = w.w.toLowerCase(); if (words.indexOf(k) > -1 && !map[k]) map[k] = w; });
      return json(res, 200, { rows: words.map(k => map[k]).filter(Boolean) });
    }
    if (p === "/api/words/random" && req.method === "POST") {
      const body = await readBody(req);
      const size = Math.min(80, Math.max(1, parseInt(body.size || "20", 10)));
      const exclude = new Set((body.exclude || []).map(x => String(x).toLowerCase()));
      const unit = body.unit || "";
      let pool = unit ? db.words.filter(w => w.unit === unit).slice().sort((a, b) => a.seq - b.seq) : db.words;
      const stt = parseInt(body.start || "0", 10), enn = parseInt(body.end || "0", 10);
      if (stt >= 1 && enn >= stt) pool = pool.slice(stt - 1, enn);
      pool = pool.filter(w => !exclude.has(w.w.toLowerCase()));
      if (body.onlyWrong) { const wrong = new Set((body.wrong || []).map(x => String(x).toLowerCase())); pool = pool.filter(w => wrong.has(w.w.toLowerCase())); }
      if (!pool.length) return json(res, 200, { rows: [] });
      const picked = [];
      for (let i = 0; i < size && pool.length; i++) picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      return json(res, 200, { rows: picked });
    }
    if (p === "/api/phrases" && req.method === "GET") {
      const query = (q.get("q") || "").trim().toLowerCase();
      const off = Math.max(0, parseInt(q.get("offset") || "0", 10));
      const lim = Math.min(300, Math.max(1, parseInt(q.get("limit") || "40", 10)));
      const core = q.get("core");
      let rows = db.phrases.slice().sort((a, b) => a.seq - b.seq);
      if (core === "1") rows = rows.filter(x => x.core);
      if (query) rows = rows.filter(x => x.en.toLowerCase().indexOf(query) > -1 || (x.zh || "").indexOf(query) > -1);
      return json(res, 200, { total: rows.length, rows: rows.slice(off, off + lim) });
    }
    if (p === "/api/content" && req.method === "GET") {
      const cat = q.get("cat") || "";
      let rows = db.content;
      if (cat) rows = rows.filter(c => c.cat === cat);
      return json(res, 200, rows.slice().sort((a, b) => a.sort - b.sort));
    }

    /* ---------- 认证 ---------- */
    if (p === "/api/auth/register" && req.method === "POST") {
      const b = await readBody(req);
      const username = String(b.username || "").trim().toLowerCase();
      const name = String(b.name || username).trim().slice(0, 30);
      const password = String(b.password || "");
      if (!/^[a-z0-9_]{3,20}$/.test(username)) return apiError(res, 400, "用户名需为 3-20 位字母/数字/下划线");
      if (password.length < 6) return apiError(res, 400, "密码至少 6 位");
      if (db.users.some(u => u.username === username)) return apiError(res, 409, "用户名已被注册");
      const salt = crypto.randomBytes(16).toString("hex");
      const curG = userByToken(tokenOf(req));
      const g = curG && curG.guest ? curG : null;
      const user = { id: nextId(), username, name, role: "user", guest: false, salt, pass: scryptHash(password, salt), token: crypto.randomBytes(24).toString("hex"), known: [], wrong: [], checkins: [], activities: [], reviews: [], createdAt: new Date().toISOString() };
      if (g) {
        user.known = mergeUniq(user.known, g.known);
        user.wrong = mergeUniq(user.wrong, g.wrong);
        user.checkins = mergeUniq(user.checkins, g.checkins);
        user.reviews = (g.reviews || []).concat(user.reviews || []).slice(0, 20000);
        user.activities = (g.activities || []).concat(user.activities || []).slice(-5000);
        db.users = db.users.filter(x => x !== g);
      }
      db.users.push(user); scheduleSave();
      return json(res, 200, { token: user.token, user: publicUser(user) });
    }
    if (p === "/api/auth/login" && req.method === "POST") {
      const b = await readBody(req);
      const username = String(b.username || "").trim().toLowerCase();
      const user = db.users.find(u => u.username === username && !u.guest);
      if (!user || user.pass !== scryptHash(String(b.password || ""), user.salt)) return apiError(res, 401, "用户名或密码错误");
      user.token = crypto.randomBytes(24).toString("hex"); scheduleSave();
      return json(res, 200, { token: user.token, user: publicUser(user) });
    }
    if (p === "/api/auth/guest" && req.method === "POST") {
      const username = "guest_" + Date.now().toString(36) + Math.floor(Math.random() * 999).toString(36);
      const user = { id: nextId(), username, name: "游客", role: "user", guest: true, salt: "", pass: "", token: crypto.randomBytes(24).toString("hex"), known: [], wrong: [], checkins: [], activities: [], reviews: [], createdAt: new Date().toISOString() };
      db.users.push(user); scheduleSave();
      return json(res, 200, { token: user.token, user: publicUser(user) });
    }
    if ((p === "/api/auth/me" || p === "/api/me") && req.method === "GET") {
      const u = userByToken(tokenOf(req));
      if (!u) return apiError(res, 401, "未登录");
      return json(res, 200, { user: publicUser(u), state: { known: u.known, wrong: u.wrong, checkins: u.checkins } });
    }
    if (p === "/api/me/password" && req.method === "POST") {
      const u = userByToken(tokenOf(req)); if (!u) return apiError(res, 401, "未登录");
      const b = await readBody(req);
      if (u.guest) return apiError(res, 400, "游客账号请先注册登录");
      if (u.pass !== scryptHash(String(b.old || ""), u.salt)) return apiError(res, 401, "原密码错误");
      if (String(b.new || "").length < 6) return apiError(res, 400, "新密码至少 6 位");
      u.salt = crypto.randomBytes(16).toString("hex"); u.pass = scryptHash(String(b.new), u.salt); scheduleSave();
      return json(res, 200, { ok: true });
    }

    /* ---------- 学习记录 ---------- */
    const me = userByToken(tokenOf(req));
    if (p.startsWith("/api/me/") && !me) return apiError(res, 401, "未登录，请先登录或注册");
    if (p === "/api/me/known" && req.method === "POST") {
      const b = await readBody(req);
      const word = String(b.word || "").trim().toLowerCase();
      if (!word) return apiError(res, 400, "缺少单词");
      me.known = me.known.filter(w => w !== word);
      if (b.value !== false) me.known.push(word);
      me.wrong = me.wrong.filter(w => w !== word); // 掌握后自动移出错题
      scheduleSave();
      return json(res, 200, { ok: true, knownCount: me.known.length });
    }
    if (p === "/api/me/wrong" && req.method === "POST") {
      const b = await readBody(req);
      const word = String(b.word || "").trim().toLowerCase();
      if (!word) return apiError(res, 400, "缺少单词");
      if (!me.wrong.includes(word)) me.wrong.push(word);
      scheduleSave();
      return json(res, 200, { ok: true, wrongCount: me.wrong.length });
    }
    if (p.startsWith("/api/me/wrong/") && req.method === "DELETE") {
      const word = decodeURIComponent(p.slice("/api/me/wrong/".length)).toLowerCase();
      me.wrong = me.wrong.filter(w => w !== word); scheduleSave();
      return json(res, 200, { ok: true, wrongCount: me.wrong.length });
    }
    if (p === "/api/me/checkin" && req.method === "POST") {
      const d = dateStr(new Date());
      if (!me.checkins.includes(d)) me.checkins.push(d);
      scheduleSave();
      return json(res, 200, { ok: true, date: d, checkedToday: true });
    }
    if (p === "/api/me/activity" && req.method === "POST") {
      const b = await readBody(req);
      const type = String(b.type || "quiz").slice(0, 30);
      me.activities.push({ at: new Date().toISOString(), type, correct: parseInt(b.correct || 0, 10), total: parseInt(b.total || 0, 10), seconds: parseInt(b.seconds || 0, 10), meta: String(b.meta || "").slice(0, 200) });
      if (me.activities.length > 5000) me.activities = me.activities.slice(-5000);
      scheduleSave();
      return json(res, 200, { ok: true });
    }
    if (p === "/api/me/reviews" && req.method === "GET") {
      const rs = ensureReviews(me).slice().sort((a, b) => String(a.due || "").localeCompare(String(b.due || "")));
      const today = dateStr(new Date());
      return json(res, 200, { dueWords: rs.filter(r => !r.due || r.due <= today), total: rs.length, schedule: reviewSummary(me) });
    }
    if (p === "/api/me/reviews/learn" && req.method === "POST") {
      const b = await readBody(req);
      const word = String(b.word || "").trim().toLowerCase();
      if (!word) return apiError(res, 400, "缺少单词");
      const rs = ensureReviews(me);
      let e = rs.find(r => r.w === word);
      if (!e) {
        e = { w: word, stage: 0, due: addDaysDate(dateStr(new Date()), REVIEW_INTERVALS[0]) };
        rs.push(e); scheduleSave();
        return json(res, 200, { ok: true, entry: e });
      }
      e.stage = Math.min(e.stage + 1, REVIEW_INTERVALS.length - 1);
      e.due = addDaysDate(dateStr(new Date()), REVIEW_INTERVALS[e.stage]);
      scheduleSave();
      return json(res, 200, { ok: true, entry: e });
    }
    if (p === "/api/me/reviews/answer" && req.method === "POST") {
      const b = await readBody(req);
      const word = String(b.word || "").trim().toLowerCase();
      if (!word) return apiError(res, 400, "缺少单词");
      const rs = ensureReviews(me);
      let e = rs.find(r => r.w === word);
      if (!e) { e = { w: word, stage: 0, due: addDaysDate(dateStr(new Date()), 1) }; rs.push(e); }
      if (b.good === false) { e.stage = 0; e.due = addDaysDate(dateStr(new Date()), 1); }
      else { e.stage = Math.min(e.stage + 1, REVIEW_INTERVALS.length - 1); e.due = addDaysDate(dateStr(new Date()), REVIEW_INTERVALS[e.stage]); }
      scheduleSave();
      return json(res, 200, { ok: true, entry: e });
    }
    /* ---------- 班级 / 组队（动态版真账号） ---------- */
    if (p === "/api/me/class" && req.method === "GET") {
      const cl = db.classes.find(x => (x.members || []).indexOf(me.id) > -1);
      return json(res, 200, cl ? { joined: { code: cl.code, name: cl.name, isTeacher: cl.ownerId === me.id } } : { joined: null });
    }
    if (p === "/api/me/class/create" && req.method === "POST") {
      const b = await readBody(req);
      const name = String(b.name || "我的班级").trim().slice(0, 30);
      const code = "BH" + Math.random().toString(36).slice(2, 6).toUpperCase() + Math.floor(10 + Math.random() * 89);
      db.classes.push({ id: nextId(), code: code, name: name, ownerId: me.id, members: [me.id], createdAt: new Date().toISOString() });
      scheduleSave();
      return json(res, 200, { ok: true, code: code, name: name });
    }
    if (p === "/api/me/class/join" && req.method === "POST") {
      const b = await readBody(req);
      const code = String(b.code || "").trim().toUpperCase();
      const cl = db.classes.find(x => x.code === code);
      if (!cl) return apiError(res, 404, "班级码不存在，请检查后重试");
      if ((cl.members || []).indexOf(me.id) < 0) cl.members.push(me.id);
      scheduleSave();
      return json(res, 200, { ok: true, name: cl.name, code: cl.code });
    }
    if (p === "/api/me/class/members" && req.method === "GET") {
      const cl = db.classes.find(x => (x.members || []).indexOf(me.id) > -1 && x.ownerId === me.id);
      if (!cl) return apiError(res, 403, "仅班级创建者可查看成员");
      const rows = (cl.members || []).map(id => { const u = db.users.find(x => x.id === id); return u ? { name: u.name || u.username, checkins: (u.checkins || []).length, known: (u.known || []).length } : null; }).filter(Boolean);
      return json(res, 200, { name: cl.name, code: cl.code, rows: rows });
    }
    if (p === "/api/me/stats" && req.method === "GET") return json(res, 200, calcStats(me));

    /* ---------- 后台管理 ---------- */
    if (p.startsWith("/api/admin")) {
      const admin = me && me.role === "admin" ? me : null;
      if (!admin) return apiError(res, 403, "需要管理员权限");
      if (p === "/api/admin/overview" && req.method === "GET") {
        const cats = {};
        db.content.forEach(c => { cats[c.cat] = (cats[c.cat] || 0) + 1; });
        return json(res, 200, {
          counts: { users: db.users.length, units: db.units.length, words: db.words.length, phrases: db.phrases.length, content: db.content.length },
          byCat: cats,
          activityTotal: db.users.reduce((s, u) => s + (u.activities || []).length, 0),
          knownTotal: db.users.reduce((s, u) => s + (u.known || []).length, 0)
        });
      }
      const mRow = p.match(/^\/api\/admin\/rows\/(\w+)$/);
      const mRowId = p.match(/^\/api\/admin\/rows\/(\w+)\/([\w\-]+)$/);
      const COLS = { units: "units", words: "words", phrases: "phrases", content: "content" };
      if (mRow && COLS[mRow[1]] && req.method === "GET") {
        const col = COLS[mRow[1]];
        const off = Math.max(0, parseInt(q.get("offset") || "0", 10));
        const lim = Math.min(300, Math.max(1, parseInt(q.get("limit") || "50", 10)));
        const query = (q.get("q") || "").trim().toLowerCase();
        const cat = q.get("cat") || "";
        let rows = db[col].slice();
        if (col === "content" && cat) rows = rows.filter(r => r.cat === cat);
        if (col === "words") { const wunit = q.get("unit") || ""; if (wunit) rows = rows.filter(r => r.unit === wunit); }
        if (query) {
          if (col === "words") rows = rows.filter(r => r.w.toLowerCase().indexOf(query) > -1);
          else if (col === "phrases") rows = rows.filter(r => r.en.toLowerCase().indexOf(query) > -1 || (r.zh || "").indexOf(query) > -1);
          else rows = rows.filter(r => String(r.name || r.title || "").toLowerCase().indexOf(query) > -1);
        }
        const sorter = col === "words" ? (a, b) => a.seq - b.seq : col === "phrases" ? (a, b) => a.seq - b.seq : (a, b) => (a.sort || 0) - (b.sort || 0);
        rows = rows.slice().sort(sorter);
        return json(res, 200, { total: rows.length, rows: rows.slice(off, off + lim) });
      }
      if (mRow && COLS[mRow[1]] && req.method === "POST") {
        const col = COLS[mRow[1]];
        const b = await readBody(req);
        const list = Array.isArray(b) ? b : [b];
        const added = [];
        for (const item of list) {
          if (!item || typeof item !== "object") continue;
          const row = Object.assign({}, item);
          delete row.id;
          if (col === "content") { if (!row.cat) continue; row.id = nextCid(); row.sort = db.content.length; }
          else { row.id = nextId(); row.seq = db[col].length; }
          db[col].push(row); added.push(row);
        }
        scheduleSave();
        return json(res, 200, { ok: true, count: added.length, rows: added });
      }
      if (mRowId && COLS[mRowId[1]] && req.method === "PUT") {
        const col = COLS[mRowId[1]];
        const id = isNaN(+mRowId[2]) ? mRowId[2] : +mRowId[2];
        const idx = db[col].findIndex(r => r.id === id);
        if (idx < 0) return apiError(res, 404, "记录不存在");
        const b = await readBody(req);
        db[col][idx] = Object.assign({}, db[col][idx], b, { id: db[col][idx].id });
        scheduleSave();
        return json(res, 200, { ok: true, row: db[col][idx] });
      }
      if (mRowId && COLS[mRowId[1]] && req.method === "DELETE") {
        const col = COLS[mRowId[1]];
        const id = isNaN(+mRowId[2]) ? mRowId[2] : +mRowId[2];
        db[col] = db[col].filter(r => r.id !== id);
        scheduleSave();
        return json(res, 200, { ok: true });
      }
      if (p === "/api/admin/settings" && req.method === "GET") return json(res, 200, db.settings);
      if (p === "/api/admin/settings" && req.method === "PUT") {
        const b = await readBody(req);
        db.settings = deepMerge(db.settings, b);
        scheduleSave();
        return json(res, 200, { ok: true, settings: db.settings });
      }
      if (p === "/api/admin/users" && req.method === "GET") {
        const lim = Math.min(200, parseInt(q.get("limit") || "50", 10));
        const rows = db.users.slice().sort((a, b) => (b.activities || []).length - (a.activities || []).length).slice(0, lim)
          .map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role, guest: u.guest, known: (u.known || []).length, wrong: (u.wrong || []).length, checkins: (u.checkins || []).length, activities: (u.activities || []).length, createdAt: u.createdAt }));
        return json(res, 200, { rows });
      }
      return apiError(res, 404, "未知管理接口");
    }
    if (p.startsWith("/api/")) return apiError(res, 404, "接口不存在");

    /* ---------- 静态资源 / SPA ---------- */
    if (req.method === "GET" && serveStatic(req, res, p)) return;
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
  } catch (e) {
    if (!res.headersSent) return apiError(res, 400, e.message || "请求处理失败");
  }
});
function deepMerge(base, patch) {
  const out = Object.assign({}, base);
  for (const k of Object.keys(patch || {})) {
    if (patch[k] && typeof patch[k] === "object" && !Array.isArray(patch[k]) && base[k] && typeof base[k] === "object") out[k] = deepMerge(base[k], patch[k]);
    else out[k] = patch[k];
  }
  return out;
}
const isNew = loadDb();
seedIfNeeded(isNew);
server.listen(PORT, () => {
  console.log("==============================================================");
  console.log("  博浩英语 CET-6 动态学习平台 · 创始人 wbh");
  console.log("  本地访问: http://localhost:" + PORT);
  console.log("  后台管理: http://localhost:" + PORT + "/#/admin");
  console.log("==============================================================");
});