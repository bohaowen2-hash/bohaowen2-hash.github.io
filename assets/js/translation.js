/* 博浩英语 CET-6 · 翻译模块 v2（技巧/主题词块/300题库/段落实战/学习视频） */
"use strict";
BH.reg("translation", async function (view) {
  var s = BH.esc;
  var tips = await BH.api("/api/content?cat=translationTip");
  var themes = await BH.api("/api/content?cat=themeWords");
  var exercises = await BH.api("/api/content?cat=translationExercise");
  var videos = await BH.api("/api/content?cat=video");
  var quiz = await BH.api("/api/content?cat=translationQuiz");

  var themeMap = { "教育": "教育", "科技": "科技", "环境": "环境", "文化": "文化", "社会": "社会" };
  var curTheme = "全部";
  var curSet = [];

  view.innerHTML =
    '<section class="section tight" style="padding-top:46px"><div class="container">' +
      '<div class="sec-head left"><span class="badge">🔄 翻译模块 · wbh 创立</span>' +
      '<h2>翻译实战秘籍</h2><p>六大技巧 + 主题词块 + <b>300 道真题风格模拟句题库</b> + 段落实战 + 精选学习视频。先动笔，再对照，标记掌握，反复练习。</p></div>' +
      '<div class="grid g-feat">' +
        '<div class="mini-card"><div style="font-size:26px">🎬</div><h4>学习视频</h4><p class="muted" style="font-size:12.5px">精选 ' + videos.length + ' 组视频专题（哔哩哔哩检索直达）</p></div>' +
        '<div class="mini-card"><div style="font-size:26px">📝</div><h4>模拟题库</h4><p class="muted" style="font-size:12.5px">真题风格句子翻译 ' + quiz.length + ' 题，可自评掌握</p></div>' +
        '<div class="mini-card"><div style="font-size:26px">📖</div><h4>段落实战</h4><p class="muted" style="font-size:12.5px">完整段落练习 ' + exercises.length + ' 篇含参考译文</p></div>' +
      '</div>' +
    '</div></section>' +

    '<section class="section tight" style="background:var(--grad-soft)"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Videos</span><h2>🎬 精选学习视频</h2><p>点开直达哔哩哔哩搜索对应专题（你可把链接换成更合适的视频）。</p></div>' +
      '<div class="grid g-3">' + videos.map(function (v) {
        var d = v.data || {};
        return "<a class='card clickable' href='" + s(d.url || "#") + "' target='_blank' rel='noopener'><div class='ico'>🎬</div><h3>" + s(v.title) + "</h3><p>" + s(d.why || "") + "</p><span class='go'>去观看 ↗</span></a>";
      }).join("") + '</div>' +
    '</div></section>' +

    '<section class="section tight"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">6 Skills</span><h2>汉译英六大技巧</h2></div>' +
      '<div id="tipList"></div>' +
    '</div></section>' +

    '<section class="section tight" style="background:var(--grad-soft)"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Themes</span><h2>高频主题词块</h2></div>' +
      '<div id="themeList"></div>' +
    '</div></section>' +

    '<section class="section tight"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Quiz · ' + quiz.length + '</span><h2>真题风格模拟题库</h2>' +
      '<p>按主题抽题：先自己翻译，再点“查看参考译文”对照；答得顺手就标 ✅，还需练的标 🔁，会自动收进“仍需练习”。</p></div>' +
      '<div class="toolbar">' +
        '<label class="tag">主题</label><select id="tzTheme">' +
          '<option>全部</option><option>教育</option><option>科技</option><option>环境</option><option>文化</option><option>社会</option>' +
        '</select>' +
        '<button class="btn btn-primary btn-sm" id="tzShuffle">🎲 换一组 10 题</button>' +
        '<span class="tag" id="tzStat"></span>' +
      '</div><div id="tzList" style="margin-top:14px"></div>' +
    '</div></section>' +

    '<section class="section tight" style="background:var(--grad-soft)"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Practice</span><h2>段落实战（先动笔，再对照）</h2></div>' +
      '<div id="exList"></div>' +
    '</div></section>';

  document.getElementById("tipList").innerHTML = tips.map(function (t, i) {
    var d = t.data || {};
    var ex = (d.examples || []).map(function (e) {
      return "<div class='sen'>" + s(e.cn) + "<br><span style='color:var(--ink);font-weight:700'>→ " + s(e.en) + "</span><span class='zh'>💡 " + s(e.note || "") + "</span></div>";
    }).join("");
    return "<details class='acc'" + (i === 0 ? " open" : "") + "><summary>技巧 " + (i + 1) + " · " + s(t.title) + " <span class='chev'>▾</span></summary><div class='acc-body'>" +
      (d.points || []).map(function (p) { return "<p>" + s(p) + "</p>"; }).join("") + ex + "</div></details>";
  }).join("") || "<div class='empty-hint'>暂无技巧</div>";

  document.getElementById("themeList").innerHTML = themes.map(function (t) {
    var d = t.data || {};
    var chips = (d.words || []).map(function (w) { return "<span class='tag' style='margin:3px'><b>" + s(w.en) + "</b> · " + s(w.zh) + "</span>"; }).join("");
    return "<details class='acc'><summary>" + s(t.title) + " <span class='chev'>▾</span></summary><div class='acc-body'><p>" + chips + "</p></div></details>";
  }).join("") || "";

  /* ---------- 300 题题库 ---------- */
  var doneSet = {}, againSet = {};
  try { doneSet = JSON.parse(localStorage.getItem("bh-tr-done")) || {}; againSet = JSON.parse(localStorage.getItem("bh-tr-again")) || {}; } catch (e) {}
  function saveMarks() { try { localStorage.setItem("bh-tr-done", JSON.stringify(doneSet)); localStorage.setItem("bh-tr-again", JSON.stringify(againSet)); } catch (e) {} }
  function pool() {
    if (curTheme === "全部") return quiz.slice();
    return quiz.filter(function (q) { return (q.title || "").indexOf(curTheme) > -1; });
  }
  function pick() {
    var p = pool();
    var arr = p.slice().sort(function () { return Math.random() - .5; }).slice(0, 10);
    return arr;
  }
  function draw() {
    curSet = pick();
    var total = pool().length;
    var againN = againSet ? Object.keys(againSet).length : 0;
    document.getElementById("tzStat").textContent = "当前主题 " + total + " 题 · 已标记 ✅" + (doneSet ? Object.keys(doneSet).length : 0) + " · 🔁" + againN;
    var box = document.getElementById("tzList");
    box.innerHTML = curSet.map(function (q, i) {
      var id = q.id;
      var d = q.data || {};
      var state = againSet[id] ? "🔁 还需练习" : doneSet[id] ? "✅ 已掌握" : "新题";
      return "<div class='q-item'><div class='q-title'>" + (i + 1) + ". " + s(q.title) + "</div>" +
        "<p style='font-size:15px'><b>中译英：</b>" + s(d.cn) + "</p>" +
        "<p class='muted' style='font-size:12.5px;margin:0 0 8px'>状态：" + state + "</p>" +
        "<details class='acc'><summary>🔍 查看参考译文 <span class='chev'>▾</span></summary><div class='acc-body'><div class='sen' style='margin:0'>" + s(d.ref) + "</div>" +
        (d.tips ? "<div class='callout tip' style='margin-top:8px;font-size:12.5px'><span class='co-t'>点拨</span>" + s(d.tips) + "</div>" : "") +
        "<div class='btn-row' style='margin-top:10px'><button class='btn btn-sm btn-soft' data-ok='" + id + "'>✅ 翻得顺</button><button class='btn btn-sm btn-danger' data-no='" + id + "'>🔁 还需练</button></div></div></details></div>";
    }).join("") || "<div class='empty-note'>该主题暂无题目</div>";
    box.querySelectorAll("[data-ok]").forEach(function (b) { b.onclick = function () { mark(b.getAttribute("data-ok"), true); }; });
    box.querySelectorAll("[data-no]").forEach(function (b) { b.onclick = function () { mark(b.getAttribute("data-no"), false); }; });
    async function mark(id, ok) {
      if (ok) { doneSet[id] = 1; delete againSet[id]; } else { againSet[id] = 1; delete doneSet[id]; }
      saveMarks(); draw();
      try { await BH.authed("/api/me/activity", { method: "POST", body: { type: "翻译练习", correct: ok ? 1 : 0, total: 1, seconds: 60, meta: "翻译模拟题" } }); } catch (e) {}
    }
  }
  document.getElementById("tzTheme").onchange = function () { curTheme = this.value; draw(); };
  document.getElementById("tzShuffle").onclick = function () { draw(); BH.toast("已随机抽 10 题 🎲"); };
  draw();

  document.getElementById("exList").innerHTML = exercises.map(function (e) {
    var d = e.data || {};
    return "<details class='acc'><summary>✍️ " + s(e.title) + " <span class='chev'>▾</span></summary><div class='acc-body'>" +
      "<p><b>中文原文：</b></p><div class='sen'>" + s(d.cn) + "</div>" +
      "<p><b>参考译文</b> <button class='btn btn-soft btn-sm' style='margin-left:8px' data-copy='" + s(d.ref || "").replace(/"/g, "&quot;") + "'>📋 复制译文</button></p>" +
      "<div class='callout good' style='margin:6px 0'><span class='co-t'>难点点拨</span>" + s(d.tips || "") + "</div></div></details>";
  }).join("") || "<div class='empty-hint'>暂无段落练习</div>";
});