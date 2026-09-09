/* 博浩英语 CET-6 · 写作模块 v2（模板/句型/范文分类/AI练习室） */
"use strict";
BH.reg("writing", async function (view) {
  var s = BH.esc;
  var templates = await BH.api("/api/content?cat=writingTemplate");
  var bank = await BH.api("/api/content?cat=sentenceBank");
  var essays = await BH.api("/api/content?cat=essay");
  var themeRows = await BH.api("/api/content?cat=essayTheme");

  view.innerHTML =
    '<section class="section tight" style="padding-top:46px"><div class="container">' +
      '<div class="sec-head left"><span class="badge">✍️ 写作模块 · 文博浩 创立</span>' +
      '<h2>写作高分训练营</h2><p>模板 ' + templates.length + ' 套 · 万能句型 ' + bank.length + ' 句 · 范文 ' + essays.length + ' 篇 · 近年话题归类 ' + themeRows.length + ' 类 · <b>AI 智能批改</b>。</p></div>' +
      '<div class="callout warn"><span class="co-t">⚠️ 博浩提醒</span>模板要活学活用：背框架与句型，但必须结合题目替换内容、加入具体论据。AI 批改为本地智能引擎，供自查参考。</div>' +
    '</div></section>' +

    '<section class="section tight" style="background:var(--grad-soft)"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">AI Practice</span><h2>🤖 AI 写作练习室</h2><p>选择题目 → 写作文 → 提交给“AI 老师”打分，获取分项得分与修改建议。</p></div>' +
      '<div class="panel" style="max-width:920px">' +
        '<div class="field"><label class="f-label">① 选择作文题目（近年高频话题）</label>' +
          '<div class="chip-group" id="essayTopics" style="margin-bottom:8px"></div></div>' +
        '<div class="field"><label class="f-label">② 输入 / 粘贴你的作文（英文）</label>' +
          '<textarea id="aiEssay" rows="9" placeholder="Paste or type your essay here..."></textarea></div>' +
        '<div class="btn-row"><button class="btn btn-primary" id="aiGrade">🚀 提交给 AI 老师批改</button><button class="btn btn-ghost" id="aiClear">清空</button><span class="muted" style="font-size:12px" id="aiHint"></span><input type="hidden" id="aiTopic" value=""></div>' +
        '<div id="aiResult" style="margin-top:16px"></div>' +
        '<div id="aiHistory" style="margin-top:18px"></div>' +
      '</div>' +
    '</div></section>' +

    '<section class="section tight"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Genres</span><h2>四大常考体裁框架</h2></div>' +
      '<div id="tplList"></div>' +
    '</div></section>' +

    '<section class="section tight" style="background:var(--grad-soft)"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Sentence Bank</span><h2>万能句型库（点击 📋 复制）</h2></div>' +
      '<div class="toolbar" id="senCats" style="margin-bottom:14px"></div>' +
      '<div class="grid g-2" id="senGrid"></div>' +
    '</div></section>' +

    '<section class="section tight"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Topics · 近20年真题归类</span><h2>近年六级作文话题分类</h2><p>按近年真题趋势整理的原创话题归类，练手可从中选题。</p></div>' +
      '<div id="topicList"></div>' +
      '<div class="sec-head left" style="margin-top:46px"><span class="eyebrow">Model Essays</span><h2>范例作文精讲</h2></div>' +
      '<div id="essayList"></div>' +
      '<div class="panel"><h3>✅ 交卷前 60 秒自查清单</h3><div class="check-list">' +
        ["字数达标（约 160–200 词）？","首段点题并亮明观点？","每段有主题句？","有具体例子 / 数据支撑？","用了 2 个以上高级句型？","拼写与单复数检查？","时态、主谓一致正确？","结尾重申观点、无新论点？"].map(function (t) {
          return "<label><input type='checkbox'> " + t + "</label>";
        }).join("") +
      '</div></div>' +
    '</div></section>';

  /* ---------- 话题归类 ---------- */
  var allTopics = [];
  document.getElementById("topicList").innerHTML = themeRows.map(function (r) {
    var d = r.data || {};
    var topics = (d.topics || []).map(function (t) {
      allTopics.push({ zh: t[0], en: t[1] });
      return "<span class='tag pick-topic' style='margin:3px;cursor:pointer' data-zh='" + s(t[0]) + "' data-en='" + s(t[1] || "") + "'>" + s(t[0]) + "</span>";
    }).join("");
    return "<details class='acc'><summary>" + s(r.title) + " <span class='chev'>▾</span></summary><div class='acc-body'><p class='muted' style='font-size:13px'>" + s(d.note || "") + "</p><p>" + topics + "</p></div></details>";
  }).join("") || "<div class='empty-hint'>暂无话题</div>";

  var topicChips = document.getElementById("essayTopics");
  topicChips.innerHTML = allTopics.map(function (t, i) {
    return "<button class='btn btn-ghost btn-sm' data-i='" + i + "'>" + s(t.zh) + "</button>";
  }).join("");
  topicChips.querySelectorAll("button").forEach(function (b) {
    b.onclick = function () {
      var t = allTopics[parseInt(b.getAttribute("data-i"), 10)];
      document.getElementById("aiHint").textContent = "当前题目：" + t.zh + (t.en ? "  ·  " + t.en : "");
      document.getElementById("aiTopic").value = t.zh + (t.en ? " | " + t.en : "");
    };
  });

  /* ---------- AI 批改（本地启发式引擎） ---------- */
  document.getElementById("aiClear").onclick = function () {
    document.getElementById("aiEssay").value = "";
    document.getElementById("aiResult").innerHTML = "";
  };
  var linkers = ["however", "therefore", "moreover", "furthermore", "besides", "in conclusion", "admittedly", "for example", "for instance", "to sum up", "in addition", "as a result", "on the one hand", "on the other hand", "although", "while", "because", "since", "first", "second", "third", "finally", "not only", "only by", "what is more", "in my opinion", "as far as i am concerned"];
  function wordsOf(t) { return (t.match(/[A-Za-z][A-Za-z''-]*/g) || []); }
  function gradeEssay(text, topic) {
    var words = wordsOf(text);
    var wordCount = words.length;
    var sents = (text.split(/[.!?]+/).filter(function (x) { return x.trim().length > 1; })).length || 1;
    var avgSent = +(wordCount / sents).toFixed(1);
    var totalLen = words.reduce(function (a, w) { return a + w.length; }, 0);
    var avgLen = wordCount ? +(totalLen / wordCount).toFixed(1) : 0;
    var longW = words.filter(function (w) { return w.length >= 8; });
    var longRatio = wordCount ? +(longW.length / wordCount).toFixed(2) : 0;
    var linkerHit = 0;
    linkers.forEach(function (lk) { if (text.toLowerCase().indexOf(lk) > -1) linkerHit++; });
    var paras = text.split(/\n\s*\n|\n+/).filter(function (x) { return x.trim().length > 10; }).length;
    if (!paras) paras = 1;
    var kw = 0;
    (topic || "").split(/[^A-Za-z]+/).forEach(function (w) { if (w.length > 3 && text.toLowerCase().indexOf(w.toLowerCase()) > -1) kw++; });

    var content = Math.min(10, +(2 + Math.min(wordCount, 260) / 60 + (paras >= 3 ? 1.2 : paras === 2 ? .6 : 0) + Math.min(kw, 3) * .5 + (sents >= 8 ? 1 : 0)).toFixed(1));
    var structure = Math.min(10, +(2.5 + (paras >= 3 ? 3 : paras === 2 ? 1.6 : 0) + Math.min(linkerHit, 6) * .7 + (paras >= 3 && linkerHit >= 4 ? 1 : 0)).toFixed(1));
    var language = Math.min(10, +(2 + (avgLen >= 4.4 ? 2 : avgLen >= 3.8 ? 1.2 : 0) + (longRatio >= .12 ? 2 : longRatio >= .07 ? 1.2 : 0) + (avgSent <= 24 ? 1.5 : 0) + (wordCount >= 140 ? 1.5 : 0)).toFixed(1));
    var total100 = Math.round(content * 4 + structure * 3 + language * 3);
    var grade = total100 >= 90 ? "A+" : total100 >= 80 ? "A" : total100 >= 70 ? "B+" : total100 >= 60 ? "B" : total100 >= 50 ? "C" : "D";
    var tips = [];
    if (wordCount < 140) tips.push("字数不足：六级作文建议 160–200 词，当前约 " + wordCount + " 词，请补充一个论证段落。");
    else if (wordCount > 260) tips.push("篇幅偏长：内容略散，建议压缩到 200 词左右，删去重复论据。");
    if (paras < 3) tips.push("结构不够：建议按 引入—论证—让步—结尾 分成 3–4 段，每段一个主题句。");
    if (linkerHit < 4) tips.push("连接词偏少：多使用 However / Moreover / Admittedly / In conclusion 等，让逻辑更清晰。");
    if (avgLen < 4) tips.push("用词偏简单：可替换一些基础词为六级词汇（如 important→crucial / essential）。");
    if (longRatio < .07) tips.push("高级词汇不足：适当加入 3–5 个六级高频词（本平台词汇库可刷）。");
    if (avgSent > 26) tips.push("句子过长：把长句拆分，或用从句替换流水句，避免“逗号病”。");
    if (kw < 2) tips.push("扣题不足：段落里反复点题关键词，让阅卷老师一眼看出你没有跑题。");
    if (!tips.length) tips.push("整体不错！请再检查：主谓一致、时态、单复数、拼写，以及结尾是否重申观点。");
    return { wordCount: wordCount, sents: sents, avgSent: avgSent, avgLen: avgLen, longRatio: longRatio, linkerHit: linkerHit, paras: paras, content: content, structure: structure, language: language, total100: total100, grade: grade, tips: tips };
  }
  document.getElementById("aiGrade").onclick = async function () {
    var text = document.getElementById("aiEssay").value.trim();
    var topicEl = document.getElementById("aiTopic");
    var topic = topicEl ? topicEl.value : "";
    if (text.length < 40) { BH.toast("请至少写 40 个字符再提交 ✍️"); return; }
    var r = gradeEssay(text, topic);
    function dim(name, score, maxC) {
      return "<div class='bar-row'><span>" + name + "</span><div class='bar'><i style='width:" + (score / 10 * 100) + "%'></i></div><b>" + score + " / 10</b></div>";
    }
    document.getElementById("aiResult").innerHTML =
      "<div class='q-item' style='margin-top:0'><div class='q-title'>📋 AI 老师评分（满分 100 · 综合 " + r.content * 4 + " + " + r.structure * 3 + " + " + r.language * 3 + "）</div>" +
      "<div style='font-size:42px;font-weight:900;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent'>" + r.total100 + "<span style='font-size:18px'> 分 · " + r.grade + "</span></div>" +
      dim("📝 内容 (40%)", r.content) + dim("🧱 结构 (30%)", r.structure) + dim("💬 语言 (30%)", r.language) +
      "<p class='muted' style='font-size:12px;margin:6px 0'>约 " + r.wordCount + " 词 · " + r.sents + " 句 · 均句长 " + r.avgSent + " 词 · 均词长 " + r.avgLen + " · 连接词 " + r.linkerHit + " 个 · 段落 " + r.paras + " 段</p>" +
      "<div class='callout tip'><span class='co-t'>💡 AI 老师修改建议</span><ol style='margin:4px 0 0;padding-left:20px'>" + r.tips.map(function (x) { return "<li style='font-size:13px'>" + s(x) + "</li>"; }).join("") + "</ol></div></div>";
    saveHistory(text, topic, r);
    try { await BH.authed("/api/me/activity", { method: "POST", body: { type: "AI作文批改", correct: 1, total: 1, seconds: 240, meta: "作文练习" } }); } catch (e) {}
    BH.celebrate();
  };
  function saveHistory(text, topic, r) {
    var h = [];
    try { h = JSON.parse(localStorage.getItem("bh-wr-hist")) || []; } catch (e) {}
    h.unshift({ at: Date.now(), topic: topic, wc: r.wordCount, score: r.total100, grade: r.grade, text: text.slice(0, 220) });
    h = h.slice(0, 6);
    try { localStorage.setItem("bh-wr-hist", JSON.stringify(h)); } catch (e) {}
    renderHistory(h);
  }
  function renderHistory(h) {
    var box = document.getElementById("aiHistory");
    if (!box) return;
    box.innerHTML = h && h.length ? "<h3>📚 最近批改记录</h3>" + h.map(function (it) {
      return "<div class='act-item'><span class='act-ico'>📄</span><div style='flex:1'><div style='font-weight:700'>" + s(it.topic || "无题") + " · <span style='color:var(--brand)'>" + it.score + " 分 (" + it.grade + ")</span></div><div class='muted' style='font-size:12px'>" + new Date(it.at).toLocaleString() + " · 约 " + it.wc + " 词 · " + s(it.text) + "…</div></div></div>";
    }).join("") : "";
  }
  var hist = []; try { hist = JSON.parse(localStorage.getItem("bh-wr-hist")) || []; } catch (e) {}
  renderHistory(hist);

  /* ---------- 模板 ---------- */
  document.getElementById("tplList").innerHTML = templates.map(function (t, i) {
    var d = t.data || {};
    return "<details class='acc'" + (i === 0 ? " open" : "") + "><summary>🗣️ " + s(t.title) + " <span class='chev'>▾</span></summary><div class='acc-body'>" +
      "<p><b>结构公式：</b>" + (d.structure || []).map(function (x) { return "①" + s(x); }).join(" → ") + "</p>" +
      (d.skeleton ? "<div class='skel-box'><button class='btn btn-soft btn-sm copy-mini' data-copy='" + s(d.skeleton).replace(/"/g, "&quot;") + "'>📋 复制模板</button>" + s(d.skeleton) + "</div>" : "") +
      "<ul class='tick'>" + (d.tips || []).map(function (x) { return "<li>" + s(x) + "</li>"; }).join("") + "</ul></div></details>";
  }).join("") || "<div class='empty-hint'>暂无模板</div>";

  /* ---------- 句型库 ---------- */
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

  /* ---------- 范文 ---------- */
  document.getElementById("essayList").innerHTML = essays.map(function (e) {
    var d = e.data || {};
    var paras = (d.paras || []).map(function (p) { return "<p>" + s(p) + "</p>"; }).join("");
    return "<div class='reader' style='margin-bottom:16px'><span class='tag' style='position:absolute;top:16px;right:18px'>博浩原创范文</span><h3 style='margin-bottom:14px'>📝 " + s(e.title) + "</h3><p class='muted' style='font-size:13.5px'><b>题目：</b>" + s(d.topic || "") + "</p>" + paras + "</div>" +
      "<div class='panel' style='margin:0 0 26px'><h3>💡 博浩点评</h3><ul class='tick'>" + (d.comments || []).map(function (c) { return "<li>" + s(c) + "</li>"; }).join("") + "</ul></div>";
  }).join("") || "<div class='empty-hint'>暂无范文</div>";
});