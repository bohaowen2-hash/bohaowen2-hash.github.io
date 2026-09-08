/* ============ 博浩英语 CET-6 · 备考模块脚本 ============ */
(function () {
  "use strict";

  /* ---------- 倒计时 ---------- */
  var DATE_KEY = "bh-exam-date";
  var examDateInput = document.getElementById("examDate");
  var DEFAULT_DATE = "2026-12-19";
  function fmtCN(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    if (isNaN(d)) return dateStr;
    var wd = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
    return d.getFullYear() + " 年 " + (d.getMonth() + 1) + " 月 " + d.getDate() + " 日（周" + wd + "）";
  }
  function daysUntil(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    var t = new Date();
    var today = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    return Math.max(0, Math.round((d - today) / 86400000));
  }
  function renderCountdown() {
    var val = null;
    try { val = localStorage.getItem(DATE_KEY); } catch (e) {}
    if (!val) val = DEFAULT_DATE;
    if (examDateInput) examDateInput.value = val;
    var el = document.getElementById("examDays");
    if (el) el.textContent = daysUntil(val);
    var lab = document.getElementById("examDateLabel");
    if (lab) lab.textContent = fmtCN(val);
  }
  var saveBtn = document.getElementById("saveExamDate");
  if (saveBtn && examDateInput) saveBtn.addEventListener("click", function () {
    if (!examDateInput.value) { showToast("请先选择日期 📅"); return; }
    try { localStorage.setItem(DATE_KEY, examDateInput.value); } catch (e) {}
    renderCountdown();
    showToast("考试日期已更新 ✓");
  });

  /* ---------- 计划生成器 ---------- */
  var weeksSel = document.getElementById("weeksSel");
  var hoursSel = document.getElementById("hoursSel");
  var genBtn = document.getElementById("genPlan");
  var planOut = document.getElementById("planOut");
  if (genBtn) genBtn.addEventListener("click", generatePlan);
  function generatePlan() {
    var W = parseInt(weeksSel.value, 10);
    var H = parseInt(hoursSel.value, 10);
    var totalH = W * 7 * H;
    var a, b;
    if (W >= 8) { a = Math.ceil(W * 0.4); b = Math.ceil(W * 0.8); }
    else if (W >= 5) { a = Math.ceil(W * 0.35); b = Math.ceil(W * 0.75); }
    else if (W === 4) { a = 1; b = 3; }
    else { a = 1; b = 2; }
    var mVocab = Math.round(H * 60 * 0.3), mList = Math.round(H * 60 * 0.25), mRead = Math.round(H * 60 * 0.25), mWrTr = Math.max(10, H * 60 - mVocab - mList - mRead);
    var html = "";
    html += "<div style='display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px'>" +
      "<span class='badge'>⏳ 剩余 " + W + " 周</span><span class='badge'>🕐 每日 " + H + " 小时</span><span class='badge green'>💪 预计总投入约 " + totalH + " 小时</span></div>";

    html += "<div class='q-item' style='margin-top:0'><div class='q-title'>阶段一 · 基础奠基（第 1 – " + a + " 周）</div><ul class='tick'>" +
      "<li>每天雷打不动背词 " + Math.round(mVocab / 10) + "–" + Math.round(mVocab / 5) + " 分钟：本平台核心词汇 + 高频短语，先混脸熟。</li>" +
      "<li>每周精听 3 次听力语料（本平台听力模块），先泛听再精听。</li>" +
      "<li>每天拆 2 个长难句，积累阅读语感（阅读模块）。</li>" +
      "<li>周末：做 1 套真题的阅读部分（不限时），统计错因。</li></ul></div>";

    html += "<div class='q-item'><div class='q-title'>阶段二 · 专项强化（第 " + (a + 1) + " – " + b + " 周）</div><ul class='tick'>" +
      "<li>词汇进入二轮：用自测模式筛出生词，集中攻克。</li>" +
      "<li>听力按题型练：讲座/讲话是 20% 的大头，每天 20 分钟精听不可断。</li>" +
      "<li>阅读开始限时：仔细阅读每篇 ≤ 9 分钟，长篇阅读 ≤ 12 分钟。</li>" +
      "<li>写作翻译各写 2 篇/周，套用本平台模板并找人批改或对照范文自查。</li></ul></div>";

    html += "<div class='q-item'><div class='q-title'>阶段三 · 冲刺复盘（第 " + (b + 1) + " – " + W + " 周）</div><ul class='tick'>" +
      "<li>每周至少 2 次整套模考（严格按 130 分钟计时），训练时间分配。</li>" +
      "<li>建立错题本：只记“为什么错”，考前反复看。</li>" +
      "<li>写作背熟 3–5 个自己的模板 + 20 个闪光句型，考场上直接调用。</li>" +
      "<li>考前 3 天回归基础：复习错题与高频词，不再刷新题。</li></ul></div>";

    html += "<div class='callout tip' style='margin-top:8px'><span class='co-t'>每日时间分配参考</span>词汇约 " + mVocab + " 分钟 · 听力约 " + mList + " 分钟 · 阅读约 " + mRead + " 分钟 · 写作翻译约 " + mWrTr + " 分钟。可根据薄弱项动态调整。</div>";

    planOut.innerHTML = html;
    planOut.scrollIntoView({ behavior: "smooth", block: "nearest" });
    showToast("计划已生成 ✨ 建议截图保存到手机");
  }

  /* ---------- 番茄钟 ---------- */
  var FOCUS = 25 * 60, SHORT = 5 * 60, LONG = 15 * 60;
  var state = { phase: "focus", pomos: 0, left: FOCUS, running: false, timer: null };
  var dial = document.getElementById("dial");
  var timerTxt = document.getElementById("timerTxt");
  var timerMode = document.getElementById("timerMode");
  var tomPhase = document.getElementById("tomPhase");
  var tomCount = document.getElementById("tomCount");

  function phaseTotal() {
    if (state.phase === "focus") return FOCUS;
    if (state.phase === "long") return LONG;
    return SHORT;
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function fmt(s) { return pad(Math.floor(s / 60)) + ":" + pad(s % 60); }
  function refresh() {
    var total = phaseTotal();
    timerTxt.textContent = fmt(state.left);
    dial.style.setProperty("--p", ((total - state.left) / total * 100).toFixed(2));
    if (state.phase === "focus") {
      timerMode.textContent = "专注中";
      tomPhase.textContent = "专注 #" + (Math.floor(state.pomos / 4) * 4 + (state.pomos % 4) + 1);
    } else if (state.phase === "long") {
      timerMode.textContent = "长休息";
      tomPhase.textContent = "长休息（每 4 个番茄后）";
    } else {
      timerMode.textContent = "短休息";
      tomPhase.textContent = "短休息";
    }
    tomCount.textContent = state.pomos;
  }
  function beep() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; g.gain.value = 0.15;
      o.start();
      setTimeout(function () { o.stop(); ctx.close(); }, 600);
    } catch (e) {}
  }
  function tick() {
    state.left--;
    if (state.left <= 0) {
      state.left = 0; refresh();
      if (state.phase === "focus") {
        state.pomos++;
        state.phase = (state.pomos % 4 === 0) ? "long" : "short";
        showToast("🎉 专注完成！休息一下");
      } else {
        state.phase = "focus";
        showToast("☕ 休息结束，开始下一个番茄！");
      }
      state.left = phaseTotal();
      beep();
    }
    refresh();
  }
  function stopTimer() { if (state.timer) { clearInterval(state.timer); state.timer = null; } }
  function startTimer() {
    if (state.running) return;
    state.running = true;
    stopTimer();
    state.timer = setInterval(tick, 1000);
    showToast("番茄钟已开始，加油 💪");
  }
  document.getElementById("tomStart").addEventListener("click", startTimer);
  document.getElementById("tomPause").addEventListener("click", function () {
    state.running = false; stopTimer(); showToast("已暂停 ⏸");
  });
  document.getElementById("tomReset").addEventListener("click", function () {
    state.running = false; stopTimer();
    state.left = phaseTotal(); refresh(); showToast("已重置 ↺");
  });
  document.getElementById("tomSkip").addEventListener("click", function () {
    if (state.phase === "focus") { state.phase = "short"; state.left = SHORT; }
    else { state.phase = "focus"; state.left = FOCUS; }
    state.running = false; stopTimer();
    refresh(); showToast("已切换到下一阶段 ⏭");
  });

  /* ---------- 初始化 ---------- */
  renderCountdown();
  refresh();
})();