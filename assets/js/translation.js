/* 博浩英语 CET-6 · 翻译模块 */
"use strict";
BH.reg("translation", async function (view) {
  var s = BH.esc;
  var tips = await BH.api("/api/content?cat=translationTip");
  var themes = await BH.api("/api/content?cat=themeWords");
  var exercises = await BH.api("/api/content?cat=translationExercise");

  view.innerHTML =
    '<section class="section tight" style="padding-top:46px"><div class="container">' +
      '<div class="sec-head left"><span class="badge">🔄 翻译模块 · 文博浩 创立</span>' +
      '<h2>翻译实战秘籍</h2><p>六级翻译 = 段落汉译英（约 15 分钟）。记住：意思对永远先于词藻美——先保证语法正确、主干通顺，再谈地道。技巧 ' + tips.length + ' 条 · 主题词块 ' + themes.length + ' 组 · 实战练习 ' + exercises.length + ' 篇。</p></div>' +
      '<div class="sec-head left" style="margin-top:20px"><span class="eyebrow">6 Skills</span><h2>汉译英六大技巧</h2></div>' +
      '<div id="tipList"></div>' +
    '</div></section>' +

    '<section class="section tight" style="background:var(--grad-soft)"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Themes</span><h2>高频主题词块</h2></div>' +
      '<div id="themeList"></div>' +
    '</div></section>' +

    '<section class="section tight"><div class="container">' +
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
  }).join("") || "<div class='empty-hint'>暂无技巧内容</div>";

  document.getElementById("themeList").innerHTML = themes.map(function (t) {
    var d = t.data || {};
    var chips = (d.words || []).map(function (w) { return "<span class='tag' style='margin:3px'><b>" + s(w.en) + "</b> · " + s(w.zh) + "</span>"; }).join("");
    return "<details class='acc'><summary>" + s(t.title) + " <span class='chev'>▾</span></summary><div class='acc-body'><p>" + chips + "</p></div></details>";
  }).join("") || "<div class='empty-hint'>暂无主题词块</div>";

  document.getElementById("exList").innerHTML = exercises.map(function (e) {
    var d = e.data || {};
    return "<details class='acc'><summary>✍️ " + s(e.title) + " <span class='chev'>▾</span></summary><div class='acc-body'>" +
      "<p><b>中文原文：</b></p><div class='sen'>" + s(d.cn) + "</div>" +
      "<p><b>参考译文</b> <button class='btn btn-soft btn-sm' style='margin-left:8px' data-copy='" + s(d.ref || "").replace(/"/g, "&quot;") + "'>📋 复制译文</button></p>" +
      "<div class='callout good' style='margin:6px 0'><span class='co-t'>难点点拨</span>" + s(d.tips || "") + "</div></div></details>";
  }).join("") || "<div class='empty-hint'>暂无翻译练习</div>";
});