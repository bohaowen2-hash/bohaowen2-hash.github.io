/* 博浩英语 CET-6 · 阅读模块 v3（500 篇长文库 / 主题筛选 / 分页 / 实战答题） */
"use strict";
BH.reg("reading", async function (view) {
  var s = BH.esc;
  var passages = (await BH.api("/api/content?cat=reading")) || [];
  var longs = (await BH.api("/api/content?cat=longSentence")) || [];
  var state = { pidx: 0, area: "全部", q: "", page: 0, per: 12, quiz: { qs: [], qi: 0, right: 0 } };

  function areaOf(it, i) {
    if (i < 4 || (it.title || "").indexOf("模拟阅读") !== 0) return "核心精读";
    var parts = String(it.title).split(" · ");
    return parts[1] || "综合";
  }
  function wordsN(it) { return String(((it.data || {}).passage) || "").trim().split(/\s+/).filter(Boolean).length; }
  function qN(it) { return ((it.data || {}).qs || []).length; }
  function areas() {
    var m = {}, out = [];
    passages.forEach(function (it, i) { var a = areaOf(it, i); if (!m[a]) { m[a] = true; out.push(a); } });
    return out;
  }
  var areaList = areas();
  function filtered() {
    return passages.filter(function (it, i) {
      if (state.area !== "全部" && areaOf(it, i) !== state.area) return false;
      if (state.q) {
        var hay = ((it.title || "") + " " + String(((it.data || {}).passage) || "").slice(0, 600)).toLowerCase();
        if (hay.indexOf(state.q.toLowerCase()) < 0) return false;
      }
      return true;
    });
  }
  function cur() { return passages[state.pidx] || passages[0] || { data: {} }; }

  view.innerHTML =
    '<section class="section tight" style="padding-top:46px"><div class="container">' +
      '<div class="sec-head left"><span class="badge">📚 阅读模块 · 文博浩 创立</span>' +
      '<h2>阅读实战与长难句</h2><p>真题风格长文共 <b>' + passages.length + '</b> 篇 · 长难句 ' + longs.length + ' 条。先限时精读（每篇约 5–8 分钟），再对答案看解析。</p></div>' +
      '<div class="panel" style="margin-bottom:16px">' +
        '<div class="toolbar" style="margin-bottom:12px"><span class="tag">主题</span>' +
          '<div class="seg" id="rdSeg"></div>' +
          '<input type="text" id="rdSearch" placeholder="🔍 搜标题 / 首段（回车）" style="max-width:230px">' +
          '<span class="grow"></span><span class="tag" id="rdTotal"></span></div>' +
        '<div class="lib-list" id="rdList"></div><div class="pager" id="rdPager"></div>' +
      '</div>' +
      '<article class="reader"><div class="toolbar" style="margin:-6px 0 12px;padding-bottom:10px;border-bottom:1px dashed var(--line)">' +
        '<span class="tag" id="rdMeta">—</span><span class="grow"></span>' +
        '<button class="btn btn-ghost btn-sm" id="prevRd">← 上一篇</button>' +
        '<button class="btn btn-ghost btn-sm" id="nextRd">下一篇 →</button>' +
        '<button class="btn btn-primary btn-sm" id="rdPractice">📝 实战答题</button></div>' +
        '<div id="rdPassage" style="padding-top:4px"></div></article>' +
      '<div class="panel" id="rdQuizPanel" style="display:none;margin-top:16px"><h3><span class="n">?</span> 实战自测</h3><div id="rdQuizZone"></div></div>' +
    '</div></section>' +
    '<section class="section tight" style="background:var(--grad-soft)"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Long Sentences</span><h2>长难句拆解</h2></div><div id="longList"></div>' +
    '</div></section>';

  var seg = document.getElementById("rdSeg");
  seg.innerHTML = "<button class='on' data-a='全部'>全部</button>" + areaList.filter(function (a) { return a !== "核心精读"; }).map(function (a) { return "<button data-a='" + s(a) + "'>" + s(a) + "</button>"; }).join("");
  seg.querySelectorAll("button").forEach(function (b) {
    b.onclick = function () {
      state.area = b.getAttribute("data-a"); state.page = 0;
      seg.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on"); renderLib();
    };
  });
  document.getElementById("rdSearch").onkeydown = function (e) { if (e.key === "Enter") { state.q = this.value.trim(); state.page = 0; renderLib(); } };
  document.getElementById("prevRd").onclick = function () { move(-1); };
  document.getElementById("nextRd").onclick = function () { move(1); };
  document.getElementById("rdPractice").onclick = function () { openQuiz(); };

  function renderLib() {
    var arr = filtered();
    var pages = Math.max(1, Math.ceil(arr.length / state.per));
    if (state.page >= pages) state.page = pages - 1;
    var rows = arr.slice(state.page * state.per, (state.page + 1) * state.per);
    document.getElementById("rdTotal").textContent = "共 " + arr.length + " 篇";
    var zone = document.getElementById("rdList");
    zone.innerHTML = rows.map(function (it, k) {
      var gi = passages.indexOf(it);
      var isOn = passages[state.pidx] === it;
      return "<button type='button' class='lib-row" + (isOn ? " on" : "") + "' data-g='" + gi + "'>" +
        "<span class='tag lib-tag'>" + s(areaOf(it, gi)) + "</span>" +
        "<span class='lib-title'>" + s(it.title || "无题") + "</span>" +
        "<span class='muted lib-sub'>约 " + wordsN(it) + " 词 · " + qN(it) + " 题</span></button>";
    }).join("") || "<div class='empty-note'>没有匹配的文章，换个关键词试试</div>";
    zone.querySelectorAll(".lib-row").forEach(function (b) {
      b.onclick = function () {
        state.pidx = parseInt(b.getAttribute("data-g"), 10);
        renderLib(); showPassage();
      };
    });
    var pg = document.getElementById("rdPager");
    pg.innerHTML = "";
    var mk = function (label, page, on) {
      var x = document.createElement("button");
      x.textContent = label; if (on) x.classList.add("on");
      x.disabled = page === state.page;
      x.onclick = function () { state.page = page; renderLib(); };
      return x;
    };
    pg.appendChild(mk("‹", Math.max(0, state.page - 1)));
    for (var i = 0; i < pages; i++) {
      if (pages > 12 && i > 2 && i < pages - 3 && Math.abs(i - state.page) > 2) continue;
      pg.appendChild(mk(String(i + 1), i, i === state.page));
    }
    pg.appendChild(mk("›", Math.min(pages - 1, state.page + 1)));
  }
  function showPassage() {
    var it = cur(), d = it.data || {};
    var wc = wordsN(it);
    document.getElementById("rdMeta").textContent = areaOf(it, state.pidx) + " · 约 " + wc + " 词 · 建议 " + Math.max(5, Math.round(wc / 60)) + " 分钟 · " + qN(it) + " 题";
    document.getElementById("rdPassage").innerHTML = String(d.passage || "（本篇暂无正文）").split("\n").filter(Boolean).map(function (x) { return "<p>" + s(x) + "</p>"; }).join("");
    closeQuiz();
  }
  function move(delta) { state.pidx = (state.pidx + delta + passages.length) % passages.length; renderLib(); showPassage(); window.scrollTo({ top: 0 }); }
  function openQuiz() {
    var src = (cur().data || {}).qs || [];
    if (!src.length) { BH.toast("本篇暂无题目"); return; }
    state.quiz = { qs: src.slice(), qi: 0, right: 0 };
    var qp = document.getElementById("rdQuizPanel");
    qp.style.display = "block"; qp.scrollIntoView({ behavior: "smooth", block: "center" });
    drawQ();
  }
  function drawQ() {
    var q = state.quiz.qs[state.quiz.qi];
    if (!q) return done();
    var letters = ["A", "B", "C", "D"];
    var html = "<div class='q-item' style='margin-top:0'><div class='q-title'>第 " + (state.quiz.qi + 1) + " / " + state.quiz.qs.length + " 题：" + s(q.q) + "</div><div class='opts'>";
    (q.opts || []).forEach(function (o, i) { html += "<button class='opt' data-i='" + i + "'><span class='ltr'>" + letters[i] + ".</span><span>" + s(o) + "</span></button>"; });
    html += "</div><div class='explain' id='rdEx'></div></div><div style='text-align:center;margin-top:16px'><button class='btn btn-primary' id='rdNext' style='display:none'>下一题 →</button></div>";
    document.getElementById("rdQuizZone").innerHTML = html;
    document.getElementById("rdQuizZone").querySelectorAll(".opt").forEach(function (b) { b.onclick = function () { answerQ(b); }; });
    document.getElementById("rdNext").onclick = function () { state.quiz.qi++; drawQ(); };
  }
  function answerQ(btn) {
    var q = state.quiz.qs[state.quiz.qi];
    var chosen = parseInt(btn.getAttribute("data-i"), 10);
    var opts = document.querySelectorAll("#rdQuizZone .opt");
    opts.forEach(function (b) { b.disabled = true; });
    if (chosen === q.ans) { state.quiz.right++; btn.classList.add("ok"); }
    else { btn.classList.add("bad"); if (opts[q.ans]) opts[q.ans].classList.add("ok"); }
    var ex = document.getElementById("rdEx");
    ex.textContent = (chosen === q.ans ? "✅ 回答正确。" : "❌ 正确答案是 " + "ABCD".charAt(q.ans) + "。") + (q.ex || "");
    ex.classList.add("show");
    document.getElementById("rdNext").style.display = "inline-flex";
  }
  async function done() {
    var total = state.quiz.qs.length, right = state.quiz.right, pct = total ? Math.round(right / total * 100) : 0;
    document.getElementById("rdQuizZone").innerHTML =
      "<div style='text-align:center;padding:16px 0'><div style='font-size:50px'>" + (pct === 100 ? "🏆" : pct >= 60 ? "🎉" : "💪") + "</div><h3>" + (pct === 100 ? "满分！" : pct >= 60 ? "不错，继续练！" : "回看原文再答一次") + "</h3>" +
      "<p class='muted'>得分 " + right + " / " + total + "（" + pct + "%）</p><button class='btn btn-primary' id='rdAgain'>🔁 再答一次</button></div>";
    document.getElementById("rdAgain").onclick = function () { state.quiz.qi = 0; state.quiz.right = 0; drawQ(); };
    try { await BH.authed("/api/me/activity", { method: "POST", body: { type: "阅读实战", correct: right, total: total, seconds: 420, meta: String(cur().title || "").slice(0, 40) } }); } catch (e) {}
    if (pct >= 80) BH.celebrate();
  }
  function closeQuiz() { var qp = document.getElementById("rdQuizPanel"); if (qp) qp.style.display = "none"; }

  document.getElementById("longList").innerHTML = longs.map(function (it, i) {
    var d = it.data || {};
    return "<details class='acc'><summary>" + (i + 1) + ". " + s(it.title || d.en || "长难句") + " <span class='chev'>▾</span></summary><div class='acc-body'>" +
      "<p class='sen'>" + s(d.en || "") + "</p><p><b>译文：</b>" + s(d.zh || "") + "</p>" +
      "<ul class='tick'>" + (d.points || []).map(function (pt) { return "<li>" + s(pt) + "</li>"; }).join("") + "</ul></div></details>";
  }).join("") || "<div class='empty-note'>暂无长难句</div>";

  renderLib();
  showPassage();
});