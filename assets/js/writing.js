/* 博浩英语 CET-6 · 写作模块 */
"use strict";
BH.reg("writing", async function (view) {
  var s = BH.esc;
  var templates = await BH.api("/api/content?cat=writingTemplate");
  var bank = await BH.api("/api/content?cat=sentenceBank");
  var essays = await BH.api("/api/content?cat=essay");

  view.innerHTML =
    '<section class="section tight" style="padding-top:46px"><div class="container">' +
      '<div class="sec-head left"><span class="badge">✍️ 写作模块 · 文博浩 创立</span>' +
      '<h2>写作高分模板</h2><p>模板 ' + templates.length + ' 套 · 万能句型 ' + bank.length + ' 句 · 范文 ' + essays.length + ' 篇（全部后台可管理）。模板给骨架，句型给血肉，用你的观点把它填满。</p></div>' +
      '<div class="callout warn"><span class="co-t">⚠️ 博浩提醒</span>模板要活学活用：背框架与句型，但必须结合题目替换内容、加入具体论据，避免被阅卷判为套作。语言准确 &gt; 辞藻华丽。</div>' +
      '<div class="sec-head left" style="margin-top:26px"><span class="eyebrow">Genres</span><h2>四大常考体裁框架</h2></div>' +
      '<div id="tplList"></div>' +
    '</div></section>' +

    '<section class="section tight" style="background:var(--grad-soft)"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Sentence Bank</span><h2>万能句型库（点击 📋 复制）</h2></div>' +
      '<div class="toolbar" id="senCats" style="margin-bottom:14px"></div>' +
      '<div class="grid g-2" id="senGrid"></div>' +
    '</div></section>' +

    '<section class="section tight"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Model Essays</span><h2>范文精讲</h2></div>' +
      '<div id="essayList"></div>' +
      '<div class="panel"><h3>✅ 交卷前 60 秒自查清单</h3><div class="check-list">' +
        ["字数达标（约 160–200 词）？","首段点题并亮明观点？","每段有主题句？","有具体例子 / 数据支撑？","用了 2 个以上高级句型？","拼写与单复数检查？","时态、主谓一致正确？","结尾重申观点、无新论点？"].map(function (t) {
          return "<label><input type='checkbox'> " + t + "</label>";
        }).join("") +
      '</div></div>' +
    '</div></section>';

  document.getElementById("tplList").innerHTML = templates.map(function (t, i) {
    var d = t.data || {};
    return "<details class='acc'" + (i === 0 ? " open" : "") + "><summary>🗣️ " + s(t.title) + " <span class='chev'>▾</span></summary><div class='acc-body'>" +
      "<p><b>结构公式：</b>" + (d.structure || []).map(function (x) { return "①" + s(x); }).join(" → ") + "</p>" +
      (d.skeleton ? "<div class='skel-box'><button class='btn btn-soft btn-sm copy-mini' data-copy='" + s(d.skeleton).replace(/"/g, "&quot;") + "'>📋 复制模板</button>" + s(d.skeleton) + "</div>" : "") +
      "<ul class='tick'>" + (d.tips || []).map(function (x) { return "<li>" + s(x) + "</li>"; }).join("") + "</ul></div></details>";
  }).join("") || "<div class='empty-hint'>暂无写作模板</div>";

  var cats = [];
  bank.forEach(function (b) { var c = (b.data || {}).cat || "通用"; if (cats.indexOf(c) < 0) cats.push(c); });
  var activeCat = "全部";
  var catBox = document.getElementById("senCats");
  catBox.innerHTML = "<button class='btn btn-soft btn-sm' data-cat='全部'>全部</button>" + cats.map(function (c) {
    return "<button class='btn btn-ghost btn-sm' data-cat='" + s(c) + "'>" + s(c) + "</button>";
  }).join("");
  catBox.querySelectorAll("button").forEach(function (b) {
    b.onclick = function () {
      activeCat = b.getAttribute("data-cat");
      catBox.querySelectorAll("button").forEach(function (x) { x.classList.remove("btn-soft"); x.classList.add("btn-ghost"); });
      b.classList.add("btn-soft"); b.classList.remove("btn-ghost");
      renderSen();
    };
  });
  function renderSen() {
    var rows = activeCat === "全部" ? bank : bank.filter(function (b) { return (b.data || {}).cat === activeCat; });
    document.getElementById("senGrid").innerHTML = rows.map(function (b) {
      var d = b.data || {};
      return "<div class='sent-card'><div style='flex:1'><div class='sent-en'>" + s(d.en) + "</div><div class='sent-zh'>" + s(d.zh || "") + "</div></div><button class='cpy' title='复制' data-copy='" + s(d.en).replace(/"/g, "&quot;") + "'>📋</button></div>";
    }).join("") || "<div class='empty-note'>该分类暂无句型</div>";
  }
  renderSen();

  document.getElementById("essayList").innerHTML = essays.map(function (e) {
    var d = e.data || {};
    var paras = (d.paras || []).map(function (p) { return "<p>" + s(p) + "</p>"; }).join("");
    return "<div class='reader' style='margin-bottom:16px'><span class='tag' style='position:absolute;top:16px;right:18px'>博浩原创范文</span><h3 style='margin-bottom:14px'>📝 " + s(e.title) + "</h3><p class='muted' style='font-size:13.5px'><b>题目：</b>" + s(d.topic || "") + "</p>" + paras + "</div>" +
      "<div class='panel' style='margin:0 0 26px'><h3>💡 博浩点评</h3><ul class='tick'>" + (d.comments || []).map(function (c) { return "<li>" + s(c) + "</li>"; }).join("") + "</ul></div>";
  }).join("") || "<div class='empty-hint'>暂无范文</div>";
});