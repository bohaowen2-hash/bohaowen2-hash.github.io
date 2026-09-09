/* ============================================================
   博浩英语 CET-6 · 静态版适配层（GitHub Pages 专用）
   作用：把 v2 动态 API 无缝映射到本地打包数据 + 浏览器本地存储，
        使 词汇/听力/阅读/写作/翻译/备考/个人中心 全功能可用。
   说明：静态版学习记录保存在各人浏览器本地；无后台管理。
   创始人：文博浩
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
  function readState() {
    try { return JSON.parse(localStorage.getItem(LS)) || { known: [], wrong: [], checkins: [], acts: [] }; }
    catch (e) { return { known: [], wrong: [], checkins: [], acts: [] }; }
  }
  function writeState(s) {
    try { localStorage.setItem(LS, JSON.stringify(s)); } catch (e) {}
  }
  function localUser() {
    return { id: "local", username: "local", name: "学习者（本机）", role: "user", guest: false, createdAt: "2026-01-01" };
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
      byType: byType, last14: last14, heat: heat, recent: (st.acts || []).slice(-8).reverse()
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

    /* 认证：静态版固定“本机学习者” */
    if (p === "/api/auth/guest") return Promise.resolve({ token: "static-local", user: localUser() });
    if (p === "/api/auth/me" || p === "/api/me") {
      var st = readState();
      return Promise.resolve({ user: localUser(), state: { known: st.known, wrong: st.wrong, checkins: st.checkins } });
    }
    if (p === "/api/auth/register" || p === "/api/auth/login") {
      return Promise.reject(new Error("静态公开版无需注册/登录，学习记录保存在本机浏览器"));
    }
    if (p === "/api/me/password") return Promise.reject(new Error("静态公开版无需修改密码"));

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