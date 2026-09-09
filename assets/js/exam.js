/* 博浩英语 CET-6 · 备考模块 */
"use strict";
BH.reg("exam", async function (view, params) {
  var s = BH.esc;
  var tips = await BH.api("/api/content?cat=examTips");
  var DEFAULT_DATE = (BH.site && BH.site.examDate) || "2026-12-19";

  view.innerHTML =
    '<section class="section tight" style="padding-top:46px"><div class="container">' +
      '<div class="sec-head left"><span class="badge">🗓️ 备考模块 · wbh 创立</span>' +
      '<h2>科学备考中心</h2><p>先定目标、摸清题型分值，再生成专属计划，用番茄钟把每一天落到实处。锦囊 ' + tips.length + ' 则。</p></div>' +
      '<div class="two-col">' +
        '<div class="panel"><h3>⏳ 考试倒计时</h3>' +
          '<div class="big-count" id="examDays">—</div>' +
          '<div class="muted" style="font-size:14px;margin-bottom:10px">距目标考试还有（目标日：<b id="examDateLbl"></b>）</div>' +
          '<div class="toolbar"><input type="date" id="myExamDate" style="max-width:190px"><button class="btn btn-soft btn-sm" id="saveMyDate">设为我的目标</button></div>' +
          '<p class="muted" style="font-size:12px;margin:8px 0 0">六级笔试一般每年 6 月与 12 月各一次，以准考证为准。</p>' +
        '</div>' +
        '<div class="panel"><h3>🧮 稳过 500 分分配参考</h3>' +
          '<div class="table-wrap"><table style="min-width:0"><thead><tr><th>板块</th><th>占比</th><th>建议目标</th></tr></thead><tbody>' +
          '<tr><td>✍️ 写作</td><td>15% · 106.5</td><td>≥ 80</td></tr>' +
          '<tr><td>🎧 听力</td><td>35% · 248.5</td><td>≥ 175</td></tr>' +
          '<tr><td>📖 阅读</td><td>35% · 248.5</td><td>≥ 185</td></tr>' +
          '<tr><td>🔄 翻译</td><td>15% · 106.5</td><td>≥ 75</td></tr>' +
          '</tbody></table></div>' +
          '<p class="muted" style="font-size:12px;margin:8px 0 0">过级线 425/710；阅读性价比最高，优先保证。</p>' +
        '</div>' +
      '</div>' +
    '</div></section>' +

    '<section class="section tight" style="background:var(--grad-soft)"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Paper</span><h2>笔试题型与时间速查</h2><p>总分 710 · 建议用时约 130 分钟（以官方最新说明为准）。</p></div>' +
      '<div class="table-wrap"><table><thead><tr><th>部分</th><th>题型</th><th>题量</th><th>占比</th><th>建议用时</th></tr></thead><tbody>' +
      '<tr><td rowspan="1"><b>写作</b></td><td>短文写作</td><td>1 篇</td><td>15%</td><td>30 分钟</td></tr>' +
      '<tr><td rowspan="3"><b>听力理解</b></td><td>长对话</td><td>8 题</td><td>8%</td><td rowspan="3">约 30 分钟</td></tr>' +
      '<tr><td>听力篇章</td><td>7 题</td><td>7%</td></tr>' +
      '<tr><td>讲话 / 讲座</td><td>20 题</td><td>20%</td></tr>' +
      '<tr><td rowspan="3"><b>阅读理解</b></td><td>选词填空</td><td>10 题</td><td>5%</td><td rowspan="3">40 分钟</td></tr>' +
      '<tr><td>长篇阅读</td><td>10 题</td><td>10%</td></tr>' +
      '<tr><td>仔细阅读</td><td>10 题</td><td>20%</td></tr>' +
      '<tr><td><b>翻译</b></td><td>段落汉译英</td><td>1 段</td><td>15%</td><td>30 分钟</td></tr>' +
      '</tbody></table></div>' +
    '</div></section>' +

    '<section class="section tight"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Planner</span><h2>个性化冲刺计划生成器</h2></div>' +
      '<div class="panel"><div class="toolbar">' +
        '<label class="tag">剩余时间</label><select id="weeksSel"><option value="2">2 周 · 极限冲刺</option><option value="4">4 周 · 快速突击</option><option value="6" selected>6 周 · 标准备考</option><option value="8">8 周 · 从容准备</option><option value="12">12 周 · 长期作战</option></select>' +
        '<label class="tag">每日时长</label><select id="hoursSel"><option value="1">1 小时/天</option><option value="2" selected>2 小时/天</option><option value="3">3 小时/天</option><option value="4">4 小时/天</option><option value="5">5 小时/天</option></select>' +
        '<button class="btn btn-primary" id="genPlan">✨ 生成我的计划</button>' +
      '</div><div class="empty-hint plan-html" id="planOut" style="text-align:left;margin-top:14px">点击上方按钮，生成你的专属计划 📋</div>' +
      '<div id="planRun" style="margin-top:16px"></div>' +
    '</div>' +
    '</div></section>' +

    '<section class="section tight" style="background:var(--grad-soft)"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Pomodoro</span><h2>番茄钟 · 专注 25 分钟</h2></div>' +
      '<div class="panel"><div class="dial-wrap">' +
        '<div class="dial" id="dial" style="--p:0"><div style="text-align:center"><div class="time" id="timerTxt">25:00</div><div class="mode" id="timerMode">专注中</div></div></div>' +
        '<div><div class="btn-row" style="margin-bottom:12px">' +
          '<button class="btn btn-primary" id="tomStart">▶ 开始</button>' +
          '<button class="btn btn-ghost" id="tomPause">⏸ 暂停</button>' +
          '<button class="btn btn-ghost" id="tomReset">↺ 重置</button>' +
          '<button class="btn btn-soft" id="tomSkip">⏭ 跳过</button>' +
        '</div><ul class="tick">' +
          '<li>当前阶段：<b id="tomPhase">专注 #1</b></li>' +
          '<li>本轮完成：<b id="tomCount">0</b> 个番茄</li>' +
          '<li>完成 4 个番茄自动进入 15 分钟长休息。</li>' +
        '</ul></div>' +
      '</div></div>' +
    '</div></section>' +

    '<section class="section tight"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Tips</span><h2>冲刺锦囊</h2></div>' +
      '<div id="tipList"></div>' +
    '</div></section>' +
    '<section class="section tight" style="background:var(--grad-soft)"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Real Papers</span><h2>📑 历年真题库</h2><p>2012–2025 六级原卷（原卷 PDF 由站主提供，仅供个人学习）。可浏览、可打开或下载。</p></div>' +
      '<div class="panel">' +
        '<div class="toolbar" style="margin-bottom:10px">' +
          '<label class="tag">年份</label><select id="exYear"><option value="all">全部年份</option></select>' +
          '<label class="tag">套数</label><select id="exSet"><option value="all">全部套</option><option value="1">第1套</option><option value="2">第2套</option><option value="3">第3套</option></select>' +
          '<span class="grow"></span><span class="tag" id="exTotal"></span>' +
        '</div>' +
        '<div id="examLib" class="empty-note">加载真题索引…</div>' +
        '<div class="pager" id="exPager" style="margin-top:12px"></div>' +
        '<p class="muted" style="font-size:12px;margin:12px 0 0">提示：真题版权归原出题方；此处仅在你本人授权/自行提供的前提下用于个人学习，请勿对外二次传播。</p>' +
      '</div>' +
    '</div></section>';

  document.getElementById("tipList").innerHTML = tips.map(function (t) {
    var d = t.data || {};
    return "<details class='acc'><summary>💡 " + s(t.title) + " <span class='chev'>▾</span></summary><div class='acc-body'><ul class='tick'>" + (d.body || []).map(function (x) { return "<li>" + s(x) + "</li>"; }).join("") + "</ul></div></details>";
  }).join("") || "<div class='empty-hint'>暂无锦囊</div>";

  /* ---------- 倒计时 ---------- */
  var saved = null;
  try { saved = localStorage.getItem("bh-my-exam-date"); } catch (e) {}
  var myDate = saved || DEFAULT_DATE;
  function refreshDays() {
    document.getElementById("examDays").textContent = BH.daysUntil(myDate);
    document.getElementById("examDateLbl").textContent = BH.fmtDateCN(myDate);
    document.getElementById("myExamDate").value = myDate;
  }
  document.getElementById("saveMyDate").onclick = function () {
    var v = document.getElementById("myExamDate").value;
    if (!v) { BH.toast("请先选择日期"); return; }
    myDate = v;
    try { localStorage.setItem("bh-my-exam-date", v); } catch (e) {}
    refreshDays(); BH.toast("目标日期已更新 ✓");
  };
  refreshDays();

  /* ---------- 计划生成 ---------- */
  document.getElementById("genPlan").onclick = function () {
    var W = parseInt(document.getElementById("weeksSel").value, 10);
    var H = parseInt(document.getElementById("hoursSel").value, 10);
    var a = W >= 8 ? Math.ceil(W * .4) : W >= 5 ? Math.ceil(W * .35) : W === 4 ? 1 : 1;
    var b = W >= 8 ? Math.ceil(W * .8) : W >= 5 ? Math.ceil(W * .75) : W === 4 ? 3 : 2;
    var html = "<div class='toolbar' style='margin-bottom:12px'><span class='badge'>⏳ 剩余 " + W + " 周</span><span class='badge'>🕐 每日 " + H + " 小时</span><span class='badge green'>💪 预计总投入约 " + (W * 7 * H) + " 小时</span></div>";
    function stage(t, weeks, items) {
      return "<div class='q-item' style='margin-top:0;margin-bottom:10px'><div class='q-title'>" + t + "（" + weeks + "）</div><ul class='tick'>" + items.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul></div>";
    }
    html += stage("阶段一 · 基础奠基", "第 1–" + a + " 周", [
      "每天背词 " + Math.round(H * 18) + " 分钟：博浩词汇（7000 词条）+ 核心搭配，先混脸熟。",
      "每周精听 3 次听力语料：先泛听抓大意，再逐句精听（听力模块）。",
      "每天拆 2 个长难句，积累阅读语感（阅读模块）。",
      "周末：做 1 套真题阅读部分（不限时），统计错因。"
    ]);
    html += stage("阶段二 · 专项强化", "第 " + (a + 1) + "–" + b + " 周", [
      "词汇进入二轮：用自测模式筛出生词，错题自动进错题本，集中攻克。",
      "听力按题型练：讲座/讲话是 20% 大头，每天 20 分钟精听不可断。",
      "阅读开始限时：仔细阅读每篇 ≤ 9 分钟，长篇阅读 ≤ 12 分钟。",
      "写作翻译每周各 2 篇，套用平台模板并对照范文自查。"
    ]);
    html += stage("阶段三 · 冲刺复盘", "第 " + (b + 1) + "–" + W + " 周", [
      "每周至少 2 次整套模考，严格计时，训练时间分配。",
      "建立错题本：只记为什么错，考前反复看（个人中心可复习错词）。",
      "写作背熟 3–5 个自己的模板 + 20 个闪光句型。",
      "考前 3 天回归基础：复习错题与高频词，不再刷新题。"
    ]);
    html += "<div class='callout tip'><span class='co-t'>每日分配</span>词汇 " + Math.round(H * 60 * .3) + " 分钟 · 听力 " + Math.round(H * 60 * .25) + " 分钟 · 阅读 " + Math.round(H * 60 * .25) + " 分钟 · 写译 " + Math.max(10, H * 60 - Math.round(H * 60 * .8)) + " 分钟，可按薄弱项动态调整。</div>";
    document.getElementById("planOut").innerHTML = html;
    try { localStorage.setItem("bh-plan-run", JSON.stringify({ start: BH.today(), examDate: myDate, weeks: W, hours: H, done: {} })); } catch (e) {}
    renderPlanRun();
    BH.toast("计划已生成 ✨ 建议截图保存");
  };

  /* ---------- 番茄钟 ---------- */
  var FOCUS = 25 * 60, SHORT = 5 * 60, LONG = 15 * 60;
  var tom = { phase: "focus", pomos: 0, left: FOCUS, running: false, timer: null };
  function phaseTotal() { return tom.phase === "focus" ? FOCUS : tom.phase === "long" ? LONG : SHORT; }
  function refreshTom() {
    var total = phaseTotal();
    document.getElementById("timerTxt").textContent = BH.fmtClock(tom.left);
    document.getElementById("dial").style.setProperty("--p", ((total - tom.left) / total * 100).toFixed(2));
    if (tom.phase === "focus") { document.getElementById("timerMode").textContent = "专注中"; document.getElementById("tomPhase").textContent = "专注 #" + (tom.pomos + 1); }
    else if (tom.phase === "long") { document.getElementById("timerMode").textContent = "长休息"; document.getElementById("tomPhase").textContent = "长休息"; }
    else { document.getElementById("timerMode").textContent = "短休息"; document.getElementById("tomPhase").textContent = "短休息"; }
    document.getElementById("tomCount").textContent = tom.pomos;
  }
  function beep() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; g.gain.value = .12; o.start();
      setTimeout(function () { o.stop(); ctx.close(); }, 600);
    } catch (e) {}
  }
  function tick() {
    tom.left--;
    if (tom.left <= 0) {
      if (tom.phase === "focus") {
        tom.pomos++;
        tom.phase = (tom.pomos % 4 === 0) ? "long" : "short";
        BH.toast("🎉 专注完成！休息一下");
        BH.authed("/api/me/activity", { method: "POST", body: { type: "专注番茄", correct: 1, total: 1, seconds: FOCUS, meta: "番茄钟" } }).catch(function () {});
        BH.authed("/api/me/checkin", { method: "POST", body: {} }).catch(function () {});
      } else {
        tom.phase = "focus";
        BH.toast("☕ 休息结束，开始下一个番茄！");
      }
      tom.left = phaseTotal(); beep();
    }
    refreshTom();
  }
  function stopTom() { if (tom.timer) { clearInterval(tom.timer); tom.timer = null; } }
  document.getElementById("tomStart").onclick = function () {
    if (tom.running) return;
    tom.running = true; stopTom();
    tom.timer = setInterval(tick, 1000);
    BH.toast("番茄钟已开始，加油 💪");
  };
  document.getElementById("tomPause").onclick = function () { tom.running = false; stopTom(); BH.toast("已暂停 ⏸"); };
  document.getElementById("tomReset").onclick = function () { tom.running = false; stopTom(); tom.left = phaseTotal(); refreshTom(); BH.toast("已重置 ↺"); };
  document.getElementById("tomSkip").onclick = function () {
    if (tom.phase === "focus") { tom.phase = "short"; tom.left = SHORT; } else { tom.phase = "focus"; tom.left = FOCUS; }
    tom.running = false; stopTom(); refreshTom(); BH.toast("已切换到下一阶段 ⏭");
  };
  /* ---------- 计划动态执行 + 落后提醒 ---------- */
  function planRunData() { try { return JSON.parse(localStorage.getItem("bh-plan-run") || "null"); } catch (e) { return null; } }
  function renderPlanRun() {
    var zone = document.getElementById("planRun"); if (!zone) return;
    var run = planRunData();
    if (!run) { zone.innerHTML = ""; return; }
    var start = new Date(run.start + "T00:00:00");
    var nowD = new Date(); var today = new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate());
    var totalDays = Math.max(1, run.weeks * 7);
    var elapsed = Math.max(1, Math.round((today - start) / 86400000) + 1);
    if (elapsed > totalDays) elapsed = totalDays;
    var progress = Math.min(1, elapsed / totalDays);
    var doneMap = run.done || {};
    var missed = 0;
    for (var i = 0; i < elapsed - 1; i++) { var d = new Date(start); d.setDate(start.getDate() + i); var key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); if (!doneMap[key]) missed++; }
    var todayDone = !!doneMap[BH.today()];
    var stageIdx = progress <= .4 ? 0 : progress <= .75 ? 1 : 2;
    var stageNames = ["阶段一 · 基础奠基", "阶段二 · 专项强化", "阶段三 · 冲刺复盘"];
    var stageTasks = [
      ["背词 " + Math.round(run.hours * 18) + " 分钟（当前单元 50 词）", "精听 1 段听力 / 拆 2 个长难句", "词汇自测或错题复习"],
      ["限时阅读 1 篇（≤9 分钟）+ 精听 20 分钟", "自测 1 组 + 错题清空", "写作/翻译练习 1 项"],
      ["整套模考计时 + 错题归因", "背熟模板句型 / 主题词块", "只做复习，不刷新题"]
    ];
    var html = "<div class='panel' style='margin-top:6px'><h3>📅 计划执行</h3>" +
      "<div class='progress-line'><span>第 " + elapsed + " / " + totalDays + " 天</span><div class='fp-bar'><div class='fp-fill' style='width:" + (progress * 100).toFixed(0) + "%'></div></div><b>" + Math.round(progress * 100) + "%</b></div>" +
      "<div class='tag'>当前阶段：" + stageNames[stageIdx] + "</div>" +
      "<ul class='tick' style='margin-top:8px'>" + stageTasks[stageIdx].map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>" +
      (missed > 0 ? "<div class='callout warn'><span class='co-t'>落后提醒</span>你有 <b>" + missed + "</b> 天未完成学习，建议今天补上，别让计划落空。</div>" : "") +
      "<div class='btn-row'><button class='btn " + (todayDone ? "btn-soft" : "btn-primary") + "' id='planDone'>" + (todayDone ? "✅ 今天已完成" : "完成今日任务") + "</button>" +
      "<button class='btn btn-ghost' id='planResetRun'>↺ 重置进度</button></div></div>";
    zone.innerHTML = html;
    var db = document.getElementById("planDone");
    if (db) db.onclick = async function () { run.done = run.done || {}; run.done[BH.today()] = 1; try { localStorage.setItem("bh-plan-run", JSON.stringify(run)); } catch (e) {} try { await BH.authed("/api/me/checkin", { method: "POST", body: {} }); } catch (e) {} renderPlanRun(); BH.toast("今日任务完成，继续加油！"); };
    var rb = document.getElementById("planResetRun");
    if (rb) rb.onclick = function () { run.done = {}; try { localStorage.setItem("bh-plan-run", JSON.stringify(run)); } catch (e) {} renderPlanRun(); BH.toast("计划进度已重置"); };
  }

  renderExams();
  function renderExams() {
    var zone = document.getElementById("examLib"); if (!zone) return;
    fetch("data/exams.json").then(function (r) { return r.json(); }).then(function (list) {
      list.sort(function (a, b) { return (b.year - a.year) || (b.month - a.month) || (b.set - a.set); });
      var ys = document.getElementById("exYear");
      var years = {};
      list.forEach(function (e) { if (e.year) years[e.year] = 1; });
      ys.innerHTML = "<option value='all'>全部年份</option>" + Object.keys(years).sort().map(function (y) { return "<option value='" + y + "'>" + y + "年</option>"; }).join("");
      ys.onchange = drawExams; document.getElementById("exSet").onchange = drawExams;
      drawExams(list);
    }).catch(function () { zone.innerHTML = "<div class='empty-note'>真题索引仅在静态版提供（原卷 PDF 由站主提供）。</div>"; });
  }
  var exPg = 0;
  function drawExams(list) {
    var zone = document.getElementById("examLib"); if (!zone) return;
    var year = document.getElementById("exYear").value;
    var set = document.getElementById("exSet").value;
    var rows = list.filter(function (e) { return (year === "all" || String(e.year) === year) && (set === "all" || String(e.set) === set); });
    var pages = Math.max(1, Math.ceil(rows.length / 15));
    if (exPg >= pages) exPg = pages - 1;
    var pg = document.getElementById("exPager"); pg.innerHTML = "";
    var mk = function (label, p, on) { var b = document.createElement("button"); b.textContent = label; if (on) b.classList.add("on"); b.disabled = p === exPg; b.onclick = function () { exPg = p; drawExams(list); }; pg.appendChild(b); };
    mk("‹", Math.max(0, exPg - 1)); for (var i = 0; i < pages; i++) { if (pages > 15 && i > 3 && i < pages - 4 && Math.abs(i - exPg) > 3) continue; mk(String(i + 1), i, i === exPg); } mk("›", Math.min(pages - 1, exPg + 1));
    var slice = rows.slice(exPg * 15, (exPg + 1) * 15);
    document.getElementById("exTotal").textContent = "共 " + rows.length + " 套";
    zone.innerHTML = slice.length ? slice.map(function (e) {
      return "<div class='act-item'><span class='act-ico'>📄</span><div style='flex:1'><div style='font-weight:700'>" + e.year + "年" + e.month + "月 · 第" + e.set + "套</div><div class='muted' style='font-size:12px'>" + e.file + "</div></div><a class='btn btn-soft btn-sm' target='_blank' rel='noopener' href='assets/exams/" + encodeURIComponent(e.file) + "'>打开 / 下载 ↗</a><button class='btn btn-ghost btn-sm' data-txt='" + encodeURIComponent(e.file) + "'>📄 全文</button><button class='btn btn-ghost btn-sm' data-exc='" + encodeURIComponent(e.file) + "'>✍️ 题干</button><button class='btn btn-ghost btn-sm' data-ans='" + encodeURIComponent(e.file) + "'>🔑 答案</button><button class='btn btn-ghost btn-sm' data-q='" + encodeURIComponent(e.file) + "'>🧩 分题</button></div>";
    }).join("") : "<div class='empty-note'>没有匹配的真题，调整筛选条件试试</div>";
    zone.querySelectorAll("[data-txt]").forEach(function (bt) { bt.onclick = function () { openPaperText(decodeURIComponent(bt.getAttribute("data-txt"))); }; });
    zone.querySelectorAll("[data-exc]").forEach(function (bx) { bx.onclick = function () { openExcerpt(decodeURIComponent(bx.getAttribute("data-exc"))); }; });
    zone.querySelectorAll("[data-ans]").forEach(function (ba) { ba.onclick = function () { openAnswers(decodeURIComponent(ba.getAttribute("data-ans"))); }; });
    zone.querySelectorAll("[data-q]").forEach(function (bq) { bq.onclick = function () { openQuestions(decodeURIComponent(bq.getAttribute("data-q"))); }; });
  }

  function segPaper(txt) {
    var parts = String(txt || "").split(/\n(?=Part\s*(?:[IVX]+|One|Two|Three|Four|Five|Six))|\n(?=Part\s+)/i);
    var out = [];
    parts.forEach(function (p, i) {
      var m = p.match(/^Part\s*([IVX]+|One|Two|Three|Four|Five|Six)\s*([A-Za-z\u4e00-\u9fa5 ().]{0,40})/i);
      if (m) { out.push({ i: i, title: "Part " + m[1] + (m[2] ? " " + m[2].trim() : ""), body: p.replace(/^Part\s*[IVX]+[^\n]*\n?/i, "") }); }
    });
    if (!out.length) return [];
    // 修正首块（可能以页眉开头无 Part 标题）——把每块前面的无标题残段并入第一段
    return out;
  }
  function openPaperText(file) {
    var txtFile = "data/papers-text/" + encodeURIComponent(String(file).replace(/\.pdf$/i, "")) + ".txt";
    BH.toast("加载全文…");
    fetch(txtFile).then(function (r) { if (!r.ok) throw new Error("未找到文本"); return r.text(); }).then(function (txt) {
      var segs = segPaper(txt);
      BH.modal("<h3>📄 " + (String(file).replace(/\.pdf$/i, "")) + " · 分章节原文</h3><div style='text-align:right'><a class='btn btn-soft btn-sm' download='" + encodeURIComponent(String(file).replace(/\.pdf$/i, "")) + ".txt' href='" + txtFile + "'>⬇️ 下载全文 txt</a><button class='btn btn-ghost btn-sm' data-close>关闭</button></div>" +
        (segs.length ? "<div class='chip-group' id='ppHead' style='margin:8px 0'>" + segs.map(function (g, i) { return "<button class='btn btn-ghost btn-sm' data-g='" + i + "'>" + g.title + "</button>"; }).join("") + "</div>" : "") +
        "<div id='ppBody' style='max-height:62vh;overflow:auto;border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--bg-soft)'>" +
          (segs.length ? segs.map(function (g) { return "<div id='seg" + g.i + "' style='margin-bottom:18px'><div class='tag' style='background:rgba(124,58,237,.12);color:var(--brand);border-color:rgba(124,58,237,.3)'>" + esc(g.title) + "</div><pre style='white-space:pre-wrap;font-family:ui-monospace,Consolas,monospace;font-size:12.5px;line-height:1.7;margin:8px 0 0'>" + esc(g.body) + "</pre></div>"; }).join("") : "<pre style='white-space:pre-wrap;font-family:ui-monospace,Consolas,monospace;font-size:12.5px;margin:0'>" + esc(txt) + "</pre>") +
        "</div>");
      var hd = document.getElementById("ppHead");
      if (hd) hd.querySelectorAll("button").forEach(function (b) { b.onclick = function () { var t = document.getElementById("seg" + b.getAttribute("data-g")); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); }; });
    }).catch(function (e) { BH.toast("全文加载失败：" + e.message); try { window.open(txtFile, "_blank"); } catch (e2) {} });
  }


  function openExcerpt(file) {
    fetch("data/excerpts.json").then(function (r) { return r.json(); }).then(function (list) {
      var e = list.filter(function (x) { return x.file === file; })[0];
      if (!e) { BH.toast("未找到该套题干"); return; }
      BH.modal("<h3>✍️ " + String(file).replace(/\.pdf$/i, "") + " · 写作 / 翻译题干</h3>" +
        "<div class='panel' style='margin-bottom:10px'><h3>📝 Writing</h3><pre style='white-space:pre-wrap;font-family:inherit;font-size:13.5px;margin:0;background:var(--bg-soft);padding:10px;border-radius:10px'>" + esc(e.writing || "（未提取到）") + "</pre></div>" +
        "<div class='panel'><h3>🔄 Translation</h3><pre style='white-space:pre-wrap;font-family:inherit;font-size:13.5px;margin:0;background:var(--bg-soft);padding:10px;border-radius:10px'>" + esc(e.translation || "（未提取到）") + "</pre></div>" +
        "<p style='text-align:right'><button class='btn btn-primary' data-close>关闭</button></p>", true);
      document.querySelector(".modal").classList.add("wide");
    }).catch(function (err) { BH.toast("题干加载失败：" + err.message + "；已尝试打开文件"); try { window.open("data/excerpts.json", "_blank"); } catch (e2) {} });
  }


  function openAnswers(file) {
    fetch("data/papers-answers.json").then(function (r) { return r.json(); }).then(function (list) {
      var e = list.filter(function (x) { return x.file === file; })[0];
      if (!e || !e.answers) { BH.toast("该套原卷未附参考答案"); return; }
      BH.modal("<h3>🔑 " + String(file).replace(/\.pdf$/i, "") + " · 参考答案</h3><pre style='white-space:pre-wrap;font-family:ui-monospace,Consolas,monospace;font-size:13px;line-height:1.8;max-height:62vh;overflow:auto;background:var(--bg-soft);padding:14px;border-radius:12px'>" + esc(e.answers) + "</pre><p style='text-align:right'><button class='btn btn-primary' data-close>关闭</button></p>", true);
      document.querySelector(".modal").classList.add("wide");
    }).catch(function (err) { BH.toast("分题加载失败：" + err.message + "；已尝试打开文件"); try { window.open("data/papers-questions.json", "_blank"); } catch (e2) {} });
  }


  function openQuestions(file) {
    fetch("data/papers-questions.json").then(function (r) { return r.json(); }).then(function (list) {
      var e = list.filter(function (x) { return x.file === file; })[0];
      var qs = (e && e.qs) || [];
      if (!qs.length) { BH.toast("该套未能可靠分题（多为扫描版）；请用📄全文或PDF查看"); return; }
      var group = { listening: [], reading: [] };
      qs.forEach(function (q) { (q.part === "reading" ? group.reading : group.listening).push(q); });
      function render(arr, label) {
        if (!arr.length) return "";
        return "<h3 style='margin:14px 0 6px'>" + label + "</h3>" + arr.map(function (q) {
          return "<div class='q-item' style='margin-top:6px'><div class='q-title'>第 " + q.n + " 题</div><div class='opts'>" + "ABCD".split("").slice(0, q.opts.length).map(function (L, i) { return "<div class='opt' style='cursor:default'><span class='ltr'>" + L + ".</span><span>" + esc(q.opts[i]) + "</span></div>"; }).join("") + "</div></div>";
        }).join("");
      }
      BH.modal("<h3>🧩 " + String(file).replace(/\.pdf$/i, "") + " · 分题浏览</h3>" +
        "<p class='muted' style='font-size:12px'>自动解析自动排版，可能有个别错位，仅供复习参考，请以原卷为准。</p>" +
        "<div style='max-height:62vh;overflow:auto;padding-right:4px'>" + render(group.listening, "🎧 听力题干") + render(group.reading, "📖 阅读题干") + "</div>" +
        "<p style='text-align:right'><button class='btn btn-primary' data-close>关闭</button></p>", true);
      document.querySelector(".modal").classList.add("wide");
    }).catch(function (err) { BH.toast("加载失败：" + err.message + "（如持续，请用无痕窗口重试）"); });
  }

  refreshTom();
  renderPlanRun();
  if (params && params.go === "exams") {
    setTimeout(function () { var el = document.getElementById("examLib"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 500);
  }
});