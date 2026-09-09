/* 博浩英语 CET-6 · 阅读模块 */
"use strict";
BH.reg("reading", async function (view) {
  var s = BH.esc;
  var passages = await BH.api("/api/content?cat=reading");
  var longs = await BH.api("/api/content?cat=longSentence");
  var pidx = 0;
  var quiz = { qs: [], qi: 0, right: 0 };

  view.innerHTML =
    '<section class="section tight" style="padding-top:46px"><div class="container">' +
      '<div class="sec-head left"><span class="badge">📚 阅读模块 · 文博浩 创立</span>' +
      '<h2>阅读实战与长难句</h2><p>真题风格仔细阅读篇章 ' + passages.length + ' 篇（后台可扩充）· 长难句 ' + longs.length + ' 条。先限时精读，再对答案看解析。</p></div>' +
      '<div class="toolbar"><label class="tag">选择篇章</label><select id="rdSel"></select>' +
      '<button class="btn btn-primary btn-sm" id="rdPractice">📝 进入实战答题</button></div>' +
      '<article class="reader" style="margin-top:16px"><span class="tag" style="position:absolute;top:18px;right:20px">⏱ 仔细阅读建议 9 分钟/篇</span><div id="rdPassage" style="padding-top:6px"></div></article>' +
      '<div class="panel" id="rdQuizPanel" style="display:none;margin-top:16px"><h3><span class="n">?</span> 实战自测</h3><div id="rdQuizZone"></div></div>' +
    '</div></section>' +

    '<section class="section tight" style="background:var(--grad-soft)"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Long Sentences</span><h2>长难句拆解 · 先主干，再枝叶</h2><p>共 ' + longs.length + ' 条经典句型解析，每天拆 2 句，一个月后长难句不再是障碍。</p></div>' +
      '<div id="longList"></div>' +
      '<div class="callout tip"><span class="co-t">博浩口诀</span>先画主干框，再挂修饰枝；从句找引导词，插入语先跳过。</div>' +
    '</div></section>' +

    '<section class="section tight"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Tips</span><h2>阅读五大提分技巧</h2></div>' +
      '<div class="grid g-3">' +
        tip("🎯","题干优先，回文定位","先读题干圈关键词（人名、数字、专有名词），再回原文定位。") +
        tip("🔄","警惕同义替换","正确选项几乎从不照抄原文，而是换一种说法；原词重现反而要小心。") +
        tip("🧲","转折之后是重点","but / however / yet / in fact 之后往往是作者真实观点或出题位置。") +
        tip("🚫","排除绝对化选项","含 all / never / only / completely 的选项常被过度概括；may / tend to 更稳妥。") +
        tip("🧩","主旨看首尾","主旨题盯住首段尾句与末段首句，或看每段主题句的高频复现词。") +
        tip("⏳","严格限时","选词填空 ≤ 8 分钟 · 长篇阅读 ≤ 12 分钟 · 仔细阅读 ≤ 18 分钟。") +
      '</div>' +
    '</div></section>';

  function tip(ico, t, d) { return "<div class='card plain'><div class='ico'>" + ico + "</div><h3>" + t + "</h3><p>" + d + "</p></div>"; }

  var sel = document.getElementById("rdSel");
  passages.forEach(function (it, i) { var o = document.createElement("option"); o.value = i; o.textContent = it.title; sel.appendChild(o); });
  sel.onchange = function () { pidx = parseInt(sel.value, 10); showPassage(); resetQuiz(); };
  function cur() { return passages[pidx] || { data: {} }; }
  function showPassage() {
    var d = cur().data || {};
    document.getElementById("rdPassage").innerHTML = String(d.passage || "").split("\n").filter(Boolean).map(function (x) { return "<p>" + s(x) + "</p>"; }).join("");
  }
  document.getElementById("rdPractice").onclick = function () {
    var src = (cur().data || {}).qs || [];
    if (!src.length) { BH.toast("本篇暂无题目"); return; }
    quiz.qs = src.slice(); quiz.qi = 0; quiz.right = 0;
    var qp = document.getElementById("rdQuizPanel");
    qp.style.display = "block";
    qp.scrollIntoView({ behavior: "smooth", block: "center" });
    renderQ();
  };
  function renderQ() {
    var zone = document.getElementById("rdQuizZone");
    var q = quiz.qs[quiz.qi];
    var letters = ["A", "B", "C", "D"];
    var html = "<div class='q-item' style='margin-top:0'><div class='q-title'>第 " + (quiz.qi + 1) + " / " + quiz.qs.length + " 题：" + s(q.q) + "</div><div class='opts'>";
    q.opts.forEach(function (o, i) { html += "<button class='opt' data-i='" + i + "'><span class='ltr'>" + letters[i] + ".</span><span>" + s(o) + "</span></button>"; });
    html += "</div><div class='explain' id='rdEx'></div></div><div style='text-align:center;margin-top:16px'><button class='btn btn-primary' id='rdNext' style='display:none'>下一题 →</button></div>";
    zone.innerHTML = html;
    zone.querySelectorAll(".opt").forEach(function (b) { b.onclick = function () { answer(b); }; });
    document.getElementById("rdNext").onclick = function () {
      quiz.qi++;
      if (quiz.qi < quiz.qs.length) renderQ(); else done();
    };
  }
  function answer(btn) {
    var q = quiz.qs[quiz.qi];
    var chosen = parseInt(btn.getAttribute("data-i"), 10);
    var opts = document.querySelectorAll("#rdQuizZone .opt");
    opts.forEach(function (b) { b.disabled = true; });
    if (chosen === q.ans) { quiz.right++; btn.classList.add("ok"); }
    else { btn.classList.add("bad"); opts[q.ans].classList.add("ok"); }
    var ex = document.getElementById("rdEx");
    ex.textContent = (chosen === q.ans ? "✅ 回答正确。" : "❌ 正确答案是 " + "ABCD".charAt(q.ans) + "。") + q.ex;
    ex.classList.add("show");
    document.getElementById("rdNext").style.display = "inline-flex";
  }
  async function done() {
    var total = quiz.qs.length, pct = Math.round(quiz.right / total * 100);
    document.getElementById("rdQuizZone").innerHTML =
      "<div style='text-align:center;padding:16px 0'><div style='font-size:50px'>" + (pct === 100 ? "🏆" : pct >= 66 ? "🎉" : "📖") + "</div>" +
      "<h3>" + (pct === 100 ? "满分通过！" : pct >= 66 ? "掌握得不错！" : "回到原文再精读一遍吧") + "</h3>" +
      "<p class='muted'>实战得分 " + quiz.right + " / " + total + "（" + pct + "%）</p>" +
      "<button class='btn btn-primary' id='rdAgain'>🔁 重新挑战</button></div>";
    document.getElementById("rdAgain").onclick = function () { quiz.qs = (cur().data || {}).qs.slice(); quiz.qi = 0; quiz.right = 0; renderQ(); };
    try { await BH.authed("/api/me/activity", { method: "POST", body: { type: "阅读实战", correct: quiz.right, total: total, seconds: 420, meta: (cur().title || "").slice(0, 40) } }); } catch (e) {}
    if (pct >= 80) BH.celebrate();
  }
  function resetQuiz() {
    quiz = { qs: [], qi: 0, right: 0 };
    document.getElementById("rdQuizPanel").style.display = "none";
  }

  /* 长难句列表 */
  var ll = document.getElementById("longList");
  ll.innerHTML = longs.map(function (it, i) {
    var d = it.data || {};
    return "<details class='acc'><summary>" + (i + 1) + ". " + s(it.title || d.en || "") + " <span class='chev'>▾</span></summary><div class='acc-body'>" +
      "<p class='sen'>" + s(d.en || "") + "</p>" +
      "<p><b>译文：</b>" + s(d.zh || "") + "</p>" +
      "<ul class='tick'>" + (d.points || []).map(function (pt) { return "<li>" + s(pt) + "</li>"; }).join("") + "</ul></div></details>";
  }).join("") || "<div class='empty-hint'>暂无长难句素材，请到后台添加</div>";

  showPassage();
});