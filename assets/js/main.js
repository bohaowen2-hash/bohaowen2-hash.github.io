/* ============ 博浩英语 CET-6 · Shared scripts ============ */
(function () {
  "use strict";

  /* ---- Theme ---- */
  var THEME_KEY = "bh-theme";
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var sun = document.getElementById("themeSun"), moon = document.getElementById("themeMoon");
    if (sun) sun.style.display = t === "dark" ? "none" : "inline";
    if (moon) moon.style.display = t === "dark" ? "inline" : "none";
  }
  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  var theme = saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(theme);
  var themeBtn = document.getElementById("themeToggle");
  if (themeBtn) themeBtn.addEventListener("click", function () {
    theme = theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    applyTheme(theme);
  });

  /* ---- Mobile nav ---- */
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () { navLinks.classList.toggle("open"); });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { navLinks.classList.remove("open"); });
    });
  }
  /* Highlight current page */
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === here || (here === "" && href === "index.html")) a.classList.add("active");
  });

  /* ---- Reveal on scroll ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Back to top ---- */
  var backTop = document.getElementById("backTop");
  if (backTop) {
    window.addEventListener("scroll", function () {
      backTop.classList.toggle("show", window.scrollY > 560);
    });
    backTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  /* ---- Count-up stats ---- */
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        var el = en.target, target = parseFloat(el.getAttribute("data-count")), dec = (el.getAttribute("data-dec")||"0");
        var dur = 1500, t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          p = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * p).toFixed(parseInt(dec, 10));
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---- Toast ---- */
  window.showToast = function (msg) {
    var t = document.querySelector(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove("show"); }, 2400);
  };

  /* ---- Copy helper (uses data-copy) ---- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var txt = btn.getAttribute("data-copy");
      function done() { showToast("已复制到剪贴板 ✓"); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(done).catch(function () { fallbackCopy(txt); done(); });
      } else { fallbackCopy(txt); done(); }
    });
  });
  function fallbackCopy(txt) {
    var ta = document.createElement("textarea");
    ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ---- Footer year ---- */
  var yEl = document.getElementById("yearNow");
  if (yEl) yEl.textContent = new Date().getFullYear();

  /* ---- Keyboard hints for quiz pages ---- */
  document.addEventListener("keydown", function (e) {
    var zone = document.querySelector("[data-hotkey]");
    if (!zone) return;
    var active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")) return;
    if (/^[1-9]$/.test(e.key)) {
      var btn = zone.querySelector('[data-key="' + e.key + '"]');
      if (btn && !btn.disabled) btn.click();
    }
  });
})();