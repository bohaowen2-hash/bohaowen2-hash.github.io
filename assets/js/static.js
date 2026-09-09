/* ============================================================
   博浩英语 CET-6 · 静态版适配层（GitHub Pages 专用）
   作用：把 v2 动态 API 无缝映射到本地打包数据 + 浏览器本地存储，
        使 词汇/听力/阅读/写作/翻译/备考/个人中心 全功能可用。
   说明：静态版学习记录保存在各人浏览器本地；无后台管理。
   创始人：wbh
   ============================================================ */
"use strict";
(function () {
  if (!window.BH) return;
  BH.STATIC = true;

  var DB = {};
  var LS = "bh-static-state";
  var USER_KEY = "bh-static-user";

  /* ---------- 本地工具 ---------- */
  function todayStr() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function escNothing() {}
  function loadJson(name) {
    if (DB[name]) return Promise.resolve(DB[name]);
    return fetch("data/" + name + ".json").then(function (r) { if (!r.ok) throw new Error("数据加载失败：" + name); return r.json(); }).then(function (j) { DB[name] = j; return j; });
  }
  function parseQS(s) {
    var p = {};
    String(s || "").replace(/^\?/, "").split("&").forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf("=");
      if (i > -1) p[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1));
      else p[decodeURIComponent(kv)] = "";
    });
    return p;
  }

var REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];
function ymd(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function addDaysStr(s, n) { var d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return ymd(d); }

  var PROFILES_KEY = "bh-static-profiles", LS_PRE = "bh-static-state-";
  var DEF = function () { return { known: [], wrong: [], checkins: [], acts: [], reviews: [] }; };
  function curU() { try { var u = JSON.parse(localStorage.getItem("bh_user") || "null"); return (u && u.username) || "local"; } catch (e) { return "local"; } }
  function profs() { try { return JSON.parse(localStorage.getItem(PROFILES_KEY)) || {}; } catch (e) { return {}; } }
  function saveProfs(p) { try { localStorage.setItem(PROFILES_KEY, JSON.stringify(p)); } catch (e) {} }
  function hashPw(pw) { var h = 5381; for (var i = 0; i < String(pw).length; i++) { h = ((h << 5) + h + String(pw).charCodeAt(i)) | 0; } return "h" + Math.abs(h).toString(36); }
  function readState() { var key = LS_PRE + curU(); try { return JSON.parse(localStorage.getItem(key)) || DEF(); } catch (e) { return DEF(); } }
  function writeState(s) { try { localStorage.setItem(LS_PRE + curU(), JSON.stringify(s)); } catch (e) {} }
  function localUser() {
    var u = curU(), ps = profs(), p = ps[u];
    if (p) return { id: u, username: u, name: p.name || u, role: "user", guest: !!p.guest, createdAt: "2026-01-01" };
    return { id: u, username: u, name: u === "local" ? "游客（本机）" : u, role: "user", guest: true, createdAt: "2026-01-01" };
  }
  function shuffle(a) { var b = a.slice(); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; } return b; }

  /* content 扁平化 */
  var contentRows = null;
  function ensureContent() {
    if (contentRows) return Promise.resolve(contentRows);
    return loadJson("content").then(function (all) {
      contentRows = [];
      var ci = 0;
      Object.keys(all || {}).forEach(function (cat) {
        (all[cat] || []).forEach(function (it, i) {
          contentRows.push({ id: "c" + (++ci), cat: cat, title: it.title || "", sub: it.sub || "", data: it.data || {}, sort: i });
        });
      });
      return contentRows;
    });
  }

  /* ---------- 统计（与服务器版一致） ---------- */
  function dateStrOf(d) { return d.toISOString().slice(0, 10); }
  function calcStats(u, st) {
    var checkins = st.checkins.slice().sort();
    var days = {};
    checkins.forEach(function (c) { days[c] = true; });
    var streak = 0, cur = new Date();
    if (!days[dateStrOf(cur)]) cur.setDate(cur.getDate() - 1);
    while (days[dateStrOf(cur)]) { streak++; cur.setDate(cur.getDate() - 1); }
    var heat = [];
    var start = new Date(); start.setDate(start.getDate() - 83);
    for (var i = 0; i < 84; i++) { var d = new Date(start); d.setDate(start.getDate() + i); heat.push({ date: dateStrOf(d), on: !!days[dateStrOf(d)] }); }
    var byType = {}, totalSec = 0, totalQ = 0, totalRight = 0, dayMinutes = {};
    (st.acts || []).forEach(function (a) {
      byType[a.type || "other"] = (byType[a.type || "other"] || 0) + 1;
      totalSec += a.seconds || 0; totalQ += a.total || 0; totalRight += a.correct || 0;
      var key = dateStrOf(new Date(a.at || Date.now()));
      dayMinutes[key] = (dayMinutes[key] || 0) + Math.round((a.seconds || 0) / 60);
    });
    var last14 = [];
    var s14 = new Date(); s14.setDate(s14.getDate() - 13);
    for (var j = 0; j < 14; j++) { var dd = new Date(s14); dd.setDate(s14.getDate() + j); last14.push({ date: dateStrOf(dd), minutes: dayMinutes[dateStrOf(dd)] || 0 }); }
    var today = dateStrOf(new Date());
    return {
      knownCount: (st.known || []).length, wrongCount: (st.wrong || []).length,
      checkinCount: checkins.length, streak: streak, checkedToday: !!days[today],
      activityCount: (st.acts || []).length, totalSeconds: totalSec, totalQuiz: totalQ, totalRight: totalRight,
      accuracy: totalQ ? Math.round(totalRight / totalQ * 100) : 0,
      byType: byType, last14: last14, heat: heat, recent: (st.acts || []).slice(-8).reverse(),
      memory: { due: (st.checkins || []).length > -1 ? (st.reviews || []).filter(function (r) { return !r.due || r.due <= todayStr(); }).length : 0 }
    };
  }

  /* ---------- 主处理 ---------- */
  function handle(path, method, q, body) {
    var p = path.split("?")[0];
    if (p === "/api/site") return loadJson("site");
    if (p === "/api/units") return loadJson("units");

    if (p === "/api/words") {
      return loadJson("words").then(function (all) {
        var rows = all.slice();
        if (q.unit) rows = rows.filter(function (w) { return w.unit === q.unit; });
        if (q.q) { var s = String(q.q).toLowerCase(); rows = rows.filter(function (w) { return w.w.toLowerCase().indexOf(s) === 0 || (w.m || "").toLowerCase().indexOf(s) > -1; }); }
        var off = Math.max(0, parseInt(q.offset || "0", 10));
        var lim = Math.min(500, Math.max(1, parseInt(q.limit || "50", 10)));
        return { total: rows.length, offset: off, rows: rows.slice(off, off + lim) };
      });
    }
    if (p === "/api/words/random") {
      return loadJson("words").then(function (all) {
        var size = Math.min(80, Math.max(1, parseInt(body.size || "20", 10)));
        var exclude = {}; (body.exclude || []).forEach(function (x) { exclude[String(x).toLowerCase()] = true; });
        var wrongSet = {}; (body.wrong || []).forEach(function (x) { wrongSet[String(x).toLowerCase()] = true; });
        var ordered = all.filter(function (w) { return !body.unit || w.unit === body.unit; }).sort(function (x, y) { return x.seq - y.seq; });
        var pool = ordered.slice(parseInt(body.start || "0", 10) >= 1 ? parseInt(body.start, 10) - 1 : 0, (parseInt(body.end || "0", 10) >= parseInt(body.start || "0", 10) && parseInt(body.end, 10) >= 1) ? parseInt(body.end, 10) : ordered.length);
        pool = pool.filter(function (w) {
          if (body.unit && w.unit !== body.unit) return false;
          if (body.onlyWrong && !wrongSet[w.w.toLowerCase()]) return false;
          if (!body.onlyWrong && exclude[w.w.toLowerCase()]) return false;
          return true;
        });
        var picked = [];
        for (var i = 0; i < size && pool.length; i++) picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        return { rows: picked };
      });
    }
    if (p === "/api/phrases") {
      return loadJson("phrases").then(function (all) {
        var rows = all.slice().sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
        if (q.core === "1") rows = rows.filter(function (x) { return x.core; });
        if (q.q) { var s = String(q.q).toLowerCase(); rows = rows.filter(function (x) { return x.en.toLowerCase().indexOf(s) > -1 || (x.zh || "").indexOf(s) > -1; }); }
        var off = Math.max(0, parseInt(q.offset || "0", 10));
        var lim = Math.min(300, Math.max(1, parseInt(q.limit || "40", 10)));
        return { total: rows.length, rows: rows.slice(off, off + lim) };
      });
    }
    if (p === "/api/content") {
      return ensureContent().then(function (rows) {
        var out = q.cat ? rows.filter(function (r) { return r.cat === q.cat; }) : rows;
        return out;
      });
    }

    /* 认证：本机模拟账号（注册/登录仅保存到当前浏览器） */
    if (p === "/api/auth/guest") return Promise.resolve({ token: curU(), user: localUser() });
    if (p === "/api/auth/me" || p === "/api/me") {
      var st0 = readState();
      return Promise.resolve({ user: localUser(), state: { known: st0.known, wrong: st0.wrong, checkins: st0.checkins } });
    }
    if (p === "/api/auth/register") {
      var un = String(body.username || "").trim().toLowerCase();
      if (!/^[a-z0-9_]{3,20}$/.test(un)) return Promise.reject(new Error("用户名需 3-20 位字母/数字/下划线"));
      if (String(body.password || "").length < 6) return Promise.reject(new Error("密码至少 6 位"));
      var ps1 = profs();
      if (ps1[un]) return Promise.reject(new Error("该用户名已在本机注册"));
      ps1[un] = { name: String(body.name || un).slice(0, 24), pass: hashPw(body.password), guest: false };
      saveProfs(ps1);
      try {
        var gkey = LS_PRE + curU(), nkey = LS_PRE + un;
        var src = JSON.parse(localStorage.getItem(gkey)) || {}, dst = JSON.parse(localStorage.getItem(nkey)) || {};
        var uArr = function (a, b) { var m = {}; (a || []).forEach(function (x) { m[x] = 1; }); (b || []).forEach(function (x) { m[x] = 1; }); return Object.keys(m); };
        dst.known = uArr(dst.known, src.known); dst.wrong = uArr(dst.wrong, src.wrong); dst.checkins = uArr(dst.checkins, src.checkins);
        dst.acts = ((src.acts || []).concat(dst.acts || [])).slice(-800);
        dst.reviews = ((src.reviews || []).concat(dst.reviews || [])).slice(0, 20000);
        localStorage.setItem(nkey, JSON.stringify(dst));
      } catch (e) {}
      return Promise.resolve({ token: un, user: { id: un, username: un, name: ps1[un].name, role: "user", guest: false, createdAt: "2026-01-01" } });
    }
    if (p === "/api/auth/login") {
      var ln = String(body.username || "").trim().toLowerCase();
      var ps2 = profs();
      if (!ps2[ln] || ps2[ln].pass !== hashPw(body.password || "")) return Promise.reject(new Error("用户名或密码错误"));
      return Promise.resolve({ token: ln, user: { id: ln, username: ln, name: ps2[ln].name, role: "user", guest: false, createdAt: "2026-01-01" } });
    }
    if (p === "/api/me/password") {
      var cu = curU(), ps3 = profs();
      if (!ps3[cu] || ps3[cu].guest) return Promise.reject(new Error("游客账号无需修改密码，请先注册/登录"));
      if (ps3[cu].pass !== hashPw(body.old || "")) return Promise.reject(new Error("原密码错误"));
      if (String(body.new || "").length < 6) return Promise.reject(new Error("新密码至少 6 位"));
      ps3[cu].pass = hashPw(body.new);
      saveProfs(ps3);
      return Promise.resolve({ ok: true });
    }

    /* 学习记录（本地存储） */
    if (p === "/api/me/known") {
      var st1 = readState();
      var wd = String(body.word || "").toLowerCase();
      st1.known = st1.known.filter(function (w) { return w !== wd; });
      if (body.value !== false) st1.known.push(wd);
      st1.wrong = st1.wrong.filter(function (w) { return w !== wd; });
      writeState(st1);
      return Promise.resolve({ ok: true, knownCount: st1.known.length });
    }
    if (p === "/api/me/wrong" && method === "POST") {
      var st2 = readState();
      var wd2 = String(body.word || "").toLowerCase();
      if (st2.wrong.indexOf(wd2) < 0) st2.wrong.push(wd2);
      writeState(st2);
      return Promise.resolve({ ok: true, wrongCount: st2.wrong.length });
    }
    if (p.indexOf("/api/me/wrong/") === 0 && method === "DELETE") {
      var st3 = readState();
      var del = decodeURIComponent(p.slice("/api/me/wrong/".length)).toLowerCase();
      st3.wrong = st3.wrong.filter(function (w) { return w !== del; });
      writeState(st3);
      return Promise.resolve({ ok: true, wrongCount: st3.wrong.length });
    }
    if (p === "/api/me/checkin") {
      var st4 = readState();
      var d = todayStr();
      if (st4.checkins.indexOf(d) < 0) st4.checkins.push(d);
      writeState(st4);
      return Promise.resolve({ ok: true, date: d, checkedToday: true });
    }
    if (p === "/api/me/activity") {
      var st5 = readState();
      st5.acts.push({ at: new Date().toISOString(), type: String(body.type || "quiz").slice(0, 30), correct: parseInt(body.correct || 0, 10), total: parseInt(body.total || 0, 10), seconds: parseInt(body.seconds || 0, 10), meta: String(body.meta || "").slice(0, 200) });
      if (st5.acts.length > 800) st5.acts = st5.acts.slice(-800);
      writeState(st5);
      return Promise.resolve({ ok: true });
    }
    if (p === "/api/me/stats") {
      var st6 = readState();
      return Promise.resolve(calcStats(localUser(), st6));
    }

    if (p === "/api/words/lookup") {
      return loadJson("words").then(function (all) {
        var list = (q.w || "").split(",").map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean);
        var map = {}; all.forEach(function (w) { var k = w.w.toLowerCase(); if (list.indexOf(k) > -1 && !map[k]) map[k] = w; });
        return { rows: list.map(function (k) { return map[k]; }).filter(Boolean) };
      });
    }
    if (p === "/api/me/reviews") {
      var rs = readState();
      var today = todayStr();
      var due = (rs.reviews || []).filter(function (r) { return !r.due || r.due <= today; });
      return Promise.resolve({ dueWords: due, total: (rs.reviews || []).length, schedule: { due: due.length } });
    }
    if (p === "/api/me/reviews/learn" || p === "/api/me/reviews/answer") {
      var st = readState();
      st.reviews = st.reviews || [];
      var word = String(body.word || "").toLowerCase();
      if (!word) return Promise.reject(new Error("缺少单词"));
      var e = st.reviews.filter(function (r) { return r.w === word; })[0];
      if (!e) { e = { w: word, stage: 0, due: addDaysStr(todayStr(), 1) }; st.reviews.push(e); }
      var good = p.indexOf("answer") > -1 ? body.good !== false : true;
      if (good === false) { e.stage = 0; e.due = addDaysStr(todayStr(), 1); }
      else { e.stage = Math.min(e.stage + 1, REVIEW_INTERVALS.length - 1); e.due = addDaysStr(todayStr(), REVIEW_INTERVALS[e.stage]); }
      writeState(st);
      return Promise.resolve({ ok: true, entry: e });
    }
        if (p.indexOf("/api/admin") === 0) return Promise.reject(new Error("静态公开版无后台管理，请在本机运行 node server.js 使用完整动态版"));
    return Promise.reject(new Error("接口不存在：" + p));
  }

  function api(path, opts) {
    opts = opts || {};
    var u = path.split("?");
    var method = opts.method || "GET";
    var q = parseQS(u[1]);
    var body = {};
    if (opts.body != null) { try { body = typeof opts.body === "string" ? JSON.parse(opts.body) : opts.body; } catch (e) { body = {}; } }
    return handle(path, method, q, body);
  }
  function authed(path, opts) { return api(path, opts); }
  async function ensureGuest() {
    if (BH.token) return;
    var d = await api("/api/auth/guest", { method: "POST", body: {} });
    BH.setSession(d.token, d.user);
  }

  /* 注册为 core 内部可调用的静态实现（含 loadSite/authed/ensureGuest） */
  BH._staticApi = function (path, opts) { return api(path, opts); };
})();