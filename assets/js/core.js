/* ============================================================
   博浩英语 CET-6 · 前端核心（路由 / API / UI / 会话）
   创始人：文博浩
   ============================================================ */
"use strict";
var BH = window.BH = {
  routes: {}, site: null, user: null,
  token: null, _booted: false
};
(function () {
  try { BH.token = localStorage.getItem("bh_token") || null; } catch (e) {}
  try {
    var u = localStorage.getItem("bh_user");
    if (u) BH.user = JSON.parse(u);
  } catch (e) {}

  /* ---------- 基础工具 ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function toast(msg, ms) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove("show"); }, ms || 2600);
  }
  function modal(html) {
    var m = document.getElementById("modalBox");
    var mask = document.getElementById("modalMask");
    m.innerHTML = html;
    mask.style.display = "flex";
    document.body.style.overflow = "hidden";
    mask.onclick = function (e) { if (e.target === mask) closeModal(); };
    var closeBtn = m.querySelector("[data-close]");
    if (closeBtn) closeBtn.onclick = closeModal;
    var first = m.querySelector("input,select,button:not([data-close])");
    if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function closeModal() {
    var mask = document.getElementById("modalMask");
    mask.style.display = "none";
    document.body.style.overflow = "";
  }
  function copyText(txt) {
    function ok() { toast("已复制到剪贴板 ✓"); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, function () { fb(txt); ok(); });
    else { fb(txt); ok(); }
  }
  function fb(txt) {
    var ta = document.createElement("textarea");
    ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }
  function celebrate() {
    var wrap = document.createElement("div");
    wrap.className = "confetti";
    var colors = ["#4f46e5", "#7c3aed", "#0ea5e9", "#f59e0b", "#16a34a", "#e11d48"];
    for (var i = 0; i < 60; i++) {
      var s = document.createElement("i");
      s.style.cssText = "left:" + (Math.random() * 100) + "vw;background:" + colors[i % colors.length] + ";animation-duration:" + (2.2 + Math.random() * 2) + "s;animation-delay:" + (Math.random() * .6) + "s;";
      wrap.appendChild(s);
    }
    document.body.appendChild(wrap);
    setTimeout(function () { wrap.remove(); }, 5200);
  }
  function fmtClock(sec) { sec = Math.max(0, Math.round(sec)); var m = Math.floor(sec / 60), s = sec % 60; return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s; }
  function todayStr() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function fmtDateCN(s) { if (!s) return ""; var d = new Date(s.length <= 10 ? s + "T00:00:00" : s); if (isNaN(d)) return s; var wd = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()]; return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日"; }
  function daysUntil(dateStr) { var d = new Date(dateStr + "T00:00:00"); var t = new Date(); var today = new Date(t.getFullYear(), t.getMonth(), t.getDate()); return Math.max(0, Math.round((d - t) / 86400000)); }

  /* ---------- API ---------- */
  async function netApi(path, opts) {
    opts = opts || {};
    var headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    if (BH.token) headers["Authorization"] = "Bearer " + BH.token;
    var res;
    try { res = await fetch(path, { method: opts.method || "GET", headers: headers, body: opts.body != null ? (typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body)) : undefined }); }
    catch (e) { throw new Error("网络连接失败，请检查服务是否启动"); }
    var data;
    try { data = await res.json(); } catch (e) { data = {}; }
    if (!res.ok) { var err = new Error((data && data.error) || ("请求失败 " + res.status)); err.status = res.status; err.data = data; throw err; }
    return data;
  }
  function api(path, opts) {
    if (BH._staticApi) return BH._staticApi(path, opts);
    return netApi(path, opts);
  }
  async function ensureGuest() {
    if (BH.token) return;
    var d = await api("/api/auth/guest", { method: "POST", body: {} });
    setSession(d.token, d.user);
  }
  function setSession(token, user) {
    BH.token = token; BH.user = user;
    try { localStorage.setItem("bh_token", token); localStorage.setItem("bh_user", JSON.stringify(user)); } catch (e) {}
    updateNavUser();
  }
  function clearSession() {
    BH.token = null; BH.user = null;
    try { localStorage.removeItem("bh_token"); localStorage.removeItem("bh_user"); } catch (e) {}
    updateNavUser();
  }
  async function authed(path, opts) {
    if (!BH.token) await ensureGuest();
    try { return await api(path, opts); }
    catch (e) {
      if (e.status === 401 && BH.token) {
        clearSession(); await ensureGuest();
        return await api(path, opts);
      }
      throw e;
    }
  }

  /* ---------- 站点信息 & 页脚/公告 ---------- */
  async function loadSite() {
    try {
      var s = await api("/api/site");
      BH.site = s;
      var byId = function (id) { return document.getElementById(id); };
      if (s.brand) {
        byId("brandName").innerHTML = esc(s.brand.name) + "<small>CET-6 · " + esc(s.brand.tagline || "学习平台") + "</small>";
        byId("footBrand").textContent = s.brand.name;
        byId("footBrand2").textContent = s.brand.name;
        document.title = s.brand.name + " CET-6 · 六级学习平台 | " + (s.founder ? s.founder.name : "文博浩") + " 创立";
      }
      if (s.founder) {
        byId("footFounder").textContent = s.founder.name;
        byId("footFounder2").textContent = s.founder.name;
      }
      byId("footNote").textContent = s.footerNote || "";
      var ab = byId("announceBar"), at = byId("announceText");
      if (s.announcement) { at.innerHTML = esc(s.announcement); ab.style.display = "block"; }
      byId("announceClose").onclick = function () { ab.style.display = "none"; };
      return s;
    } catch (e) {
      var fN = document.getElementById("footNote"); if (fN) fN.textContent = "真诚、免费、体系化的 CET-6 学习平台，由文博浩创立并持续维护。";
      return null;
    }
  }

  /* ---------- 导航 ---------- */
  function updateNavUser() {
    var btn = document.getElementById("navMeBtn");
    if (!btn) return;
    if (BH.user) {
      var label = BH.user.role === "admin" ? "⚙️ 管理" : "📊 我的";
      btn.textContent = label;
      btn.setAttribute("href", BH.user.role === "admin" ? "#/admin" : "#/me");
    } else { btn.textContent = "📊 我的"; btn.setAttribute("href", "#/me"); }
  }
  function setNavActive(name) {
    var links = document.querySelectorAll(".nav-links a");
    links.forEach(function (a) {
      var href = a.getAttribute("href");
      a.classList.toggle("active", href === "#/" + name || (name === "home" && href === "#/"));
    });
  }

  /* ---------- 路由 ---------- */
  function currentRoute() {
    var h = (location.hash || "#/").replace(/^#\/?/, "");
    var parts = h.split("?");
    var name = parts[0] || "home";
    var params = {};
    if (parts[1]) {
      parts[1].split("&").forEach(function (kv) {
        var i = kv.indexOf("=");
        if (i > -1) params[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1));
        else params[decodeURIComponent(kv)] = "";
      });
    }
    return { name: name, params: params };
  }
  async function route() {
    var view = document.getElementById("view");
    var r = currentRoute();
    var fn = BH.routes[r.name];
    setNavActive(r.name === "" ? "home" : r.name);
    updateNavUser();
    if (!fn) { view.innerHTML = "<div class='container section' style='text-align:center'><h2>页面不存在</h2><a class='btn btn-primary' href='#/'>回首页</a></div>"; return; }
    window.scrollTo({ top: 0 });
    try {
      await fn(view, r.params);
    } catch (e) {
      console.error(e);
      view.innerHTML = "<div class='container section' style='text-align:center'><h2>😢 加载失败</h2><p class='muted'>" + esc(e.message) + "</p><button class='btn btn-primary' onclick='location.reload()'>刷新重试</button></div>";
    }
  }

  /* ---------- 主题 / 小部件 ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var sun = document.getElementById("themeSun"), moon = document.getElementById("themeMoon");
    if (sun) sun.style.display = t === "dark" ? "none" : "inline";
    if (moon) moon.style.display = t === "dark" ? "inline" : "none";
  }
  function init() {
    var saved = null;
    try { saved = localStorage.getItem("bh-theme"); } catch (e) {}
    var theme = saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    applyTheme(theme);
    var tb = document.getElementById("themeToggle");
    tb.onclick = function () {
      theme = theme === "dark" ? "light" : "dark";
      try { localStorage.setItem("bh-theme", theme); } catch (e) {}
      applyTheme(theme);
    };
    var nt = document.getElementById("navToggle");
    var nl = document.getElementById("navLinks");
    nt.onclick = function () { nl.classList.toggle("open"); };
    nl.querySelectorAll("a").forEach(function (a) { a.onclick = function () { nl.classList.remove("open"); }; });
    var bt = document.getElementById("backTop");
    window.addEventListener("scroll", function () { bt.classList.toggle("show", window.scrollY > 500); });
    bt.onclick = function () { window.scrollTo({ top: 0, behavior: "smooth" }); };
    var y = document.getElementById("yearNow"); if (y) y.textContent = new Date().getFullYear();
    document.getElementById("footContact").onclick = function () { modal("<h3>📮 建议与反馈</h3><p class='muted'>感谢你对博浩英语的支持！你的每一条建议都会帮助我们把平台做得更好。</p><p>联系创始人文博浩：<br><b>" + esc((BH.site && BH.site.contact) || "wbhao@bohaoenglish.cn") + "</b></p><p style='text-align:right'><button class='btn btn-primary' data-close>知道了</button></p>"); };
    document.addEventListener("click", function (e) { var b = e.target && e.target.closest ? e.target.closest("[data-copy]") : null; if (b) copyText(b.getAttribute("data-copy")); });
    window.addEventListener("hashchange", route);
    loadSite().then(function () { route(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  /* 导出 */
  BH.esc = esc; BH.toast = toast; BH.modal = modal; BH.closeModal = closeModal;
  BH.copy = copyText; BH.celebrate = celebrate; BH.fmtClock = fmtClock;
  BH.today = todayStr; BH.fmtDateCN = fmtDateCN; BH.daysUntil = daysUntil;
  BH.api = api; BH.authed = authed; BH.ensureGuest = ensureGuest;
  BH.setSession = setSession; BH.clearSession = clearSession;
  BH.updateNavUser = updateNavUser;
  BH.reg = function (name, fn) { BH.routes[name] = fn; };
  BH.render = function (id, html) { document.getElementById(id).innerHTML = html; };
  BH.refresh = route;            // 无刷新重绘当前路由（SPA）
  BH.reloadSite = loadSite;       // 重新拉取站点文案（无需整页刷新）
  BH.navTo = function (h) { if ((location.hash || "#/") === h) BH.refresh(); else location.hash = h; };
})();