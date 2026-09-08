/* 博浩英语 CET-6 · 听力模块（语料库 / 变速 / 逐句精听 / 理解自测） */
"use strict";
BH.reg("listening", async function (view) {
  var s = BH.esc;
  var items = await BH.api("/api/content?cat=listening");
  if (!items.length) items = [];
  var idx = 0, rate = 0.85;
  var quiz = { qs: [], qi: 0, right: 0 };

  view.innerHTML =
    '<section class="section tight" style="padding-top:46px"><div class="container">' +
      '<div class="sec-head left"><span class="badge">🎧 听力模块 · 文博浩 创立</span>' +
      '<h2>听力精听训练</h2><p>真题风格新闻与讲座语料 ' + items.length + ' 篇（后台可继续扩充）。支持变速与逐句精听，先听再做，练出耳朵的肌肉记忆。</p></div>' +
      '<div class="panel player-card">' +
        '<div class="toolbar"><label class="tag">选择语料</label><select id="psgSel"></select>' +
        '<label class="tag">语速</label><select id="rateSel"><option value="0.7">🐢 0.7×</option><option value="0.85" selected>🌿 0.85× 推荐</option><option value="1">⚡ 1.0×</option></select>' +
        '<span class="grow"></span><span class="tag" id="psgType"></span></div>' +
        '<h3 id="psgTitle" style="margin:14px 0 4px">—</h3><p class="muted" id="psgSub" style="margin:0 0 16px"></p>' +
        '<div class="btn-row" style="margin-bottom:14px">' +
          '<button class="btn btn-primary" id="playAll">▶ 整段播放</button>' +
          '<button class="btn btn-soft" id="playSent">🗣️ 逐句精听</button>' +
          '<button class="btn btn-ghost" id="stopPlay">⏹ 停止</button>' +
          '<button class="btn btn-ghost" id="toggleScript">📄 原文</button>' +
          '<button class="btn btn-ghost" id="gotoQuiz">📝 开始答题</button>' +
        '</div>' +
        '<div id="nowPlaying" class="callout tip" style="display:none;margin:6px 0 0"><span class="co-t">🎙️ <span class="audio-eq"><i></i><i></i><i></i></span> <span class="sentence-now" id="nowTxt"></span></span></div>' +
        '<div id="scriptBox" class="reader" style="display:none;margin-top:14px;max-height:330px;overflow:auto"></div>' +
      '</div>' +
      '<div class="panel" id="quizPanel" style="display:none;margin-top:16px"><h3><span class="n">?</span> 理解自测</h3><div id="quizZone"></div></div>' +
    '</div></section>' +

    '<section class="section tight" style="background:var(--grad-soft)"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Strategy</span><h2>听力题型与精听五步法</h2></div>' +
      '<div class="two-col"><div>' +
        '<div class="panel" style="margin-bottom:14px"><h3>📰 短篇新闻</h3><p class="muted" style="font-size:13.5px">首句即导语（5W1H）。预读圈专名/数字；因果题听 because / due to / as a result。</p></div>' +
        '<div class="panel" style="margin-bottom:14px"><h3>💬 长对话</h3><p class="muted" style="font-size:13.5px">题序与对话顺序基本一致；提问句与 but / actually 后常是出题点；结尾建议常是最后一题。</p></div>' +
        '<div class="panel"><h3>🎓 讲座 / 讲话</h3><p class="muted" style="font-size:13.5px">分值最大（20%）。听 First / Second / Finally 分层；定义解释处（that is / in other words）常为考点。</p></div>' +
      '</div><div>' +
        '<div class="panel"><h3>🧘 精听五步法</h3><ul class="tick">' +
        '<li><b>泛听抓大意</b>：整段 1 遍，只求听懂主题与结构。</li>' +
        '<li><b>逐句精听</b>：一句一停，努力听清每个词。</li>' +
        '<li><b>对照原文</b>：标出连读/弱读，找“耳朵盲区”。</li>' +
        '<li><b>跟读模仿</b>：跟读 2–3 遍，模仿语速与重音。</li>' +
        '<li><b>盲听检验</b>：合上原文再听 1 遍确认全部听懂。</li></ul>' +
        '<div class="callout tip" style="margin:10px 0 0"><span class="co-t">博浩提示</span>语料朗读依赖系统语音（Chrome / Edge 效果最佳）。</div></div>' +
      '</div></div>' +
    '</div></section>';

  var sel = document.getElementById("psgSel");
  items.forEach(function (it, i) { var o = document.createElement("option"); o.value = i; o.textContent = it.title; sel.appendChild(o); });
  if (!items.length) { document.getElementById("psgTitle").textContent = "暂无听力语料，请在后台添加"; }

  function cur() { return items[idx] || { data: {} }; }
  function show() {
    idx = parseInt(sel.value, 10);
    var it = cur(), d = it.data || {};
    document.getElementById("psgTitle").textContent = it.title;
    document.getElementById("psgSub").textContent = it.sub || "";
    document.getElementById("psgType").textContent = d.type === "news" ? "📰 新闻" : "🎓 讲座/讲话";
    document.getElementById("scriptBox").innerHTML = "<p>" + String(d.text || "").split("\n").filter(Boolean).map(function(x){return s(x);}).join("</p><p>") + "</p>";
    stop();
    resetQuiz();
  }
  sel.onchange = show;
  document.getElementById("rateSel").onchange = function () { rate = parseFloat(this.value); };

  function stop() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    clearTimeout(window._sentTimer);
    document.getElementById("nowPlaying").style.display = "none";
  }
  document.getElementById("stopPlay").onclick = stop;
  function pickVoice() {
    if (!("speechSynthesis" in window)) return null;
    var vs = speechSynthesis.getVoices();
    return vs.filter(function (v) { return /en[-_]US/i.test(v.lang); })[0] || vs.filter(function (v) { return /^en/i.test(v.lang); })[0] || null;
  }
  function utter(txt, onEnd) {
    var u = new SpeechSynthesisUtterance(txt);
    u.lang = "en-US"; var v = pickVoice(); if (v) u.voice = v; u.rate = rate;
    if (onEnd) u.onend = onEnd;
    return u;
  }
  function setNow(t) { var b = document.getElementById("nowPlaying"); document.getElementById("nowTxt").textContent = t; b.style.display = "block"; }
  document.getElementById("playAll").onclick = function () {
    if (!("speechSynthesis" in window)) { BH.toast("当前浏览器不支持语音合成，建议使用 Chrome / Edge"); return; }
    stop();
    setNow("整段播放中…");
    speechSynthesis.speak(utter((cur().data || {}).text || ""));
  };
  document.getElementById("playSent").onclick = function () {
    if (!("speechSynthesis" in window)) { BH.toast("当前浏览器不支持语音合成，建议使用 Chrome / Edge"); return; }
    stop();
    var sents = String((cur().data || {}).text || "").split(/(?<=[.!?])\s+/);
    var i = 0;
    (function next() {
      if (i >= sents.length) { document.getElementById("nowPlaying").style.display = "none"; return; }
      setNow("第 " + (i + 1) + " / " + sents.length + " 句 · " + sents[i]);
      speechSynthesis.speak(utter(sents[i], function () { i++; window._sentTimer = setTimeout(next, 300); }));
    })();
  };
  document.getElementById("toggleScript").onclick = function () {
    var b = document.getElementById("scriptBox");
    var show = b.style.display === "none";
    b.style.display = show ? "block" : "none";
    BH.toast(show ? "已显示原文 📄" : "已隐藏原文（继续精听）👂");
  };

  /* ---------- 自测 ---------- */
  function resetQuiz() {
    quiz = { qs: [], qi: 0, right: 0 };
    var qp = document.getElementById("quizPanel");
    qp.style.display = "none";
  }
  function shuffleArr(a) { var b = a.slice(); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
  document.getElementById("gotoQuiz").onclick = function () {
    var src = (cur().data || {}).qs || [];
    if (!src.length) { BH.toast("本篇暂无题目"); return; }
    quiz.qs = shuffleArr(src); quiz.qi = 0; quiz.right = 0;
    var qp = document.getElementById("quizPanel");
    qp.style.display = "block";
    qp.scrollIntoView({ behavior: "smooth", block: "center" });
    renderQ();
  };
  function renderQ() {
    var zone = document.getElementById("quizZone");
    var q = quiz.qs[quiz.qi];
    var letters = ["A", "B", "C", "D"];
    var html = "<div class='q-item' style='margin-top:0'><div class='q-title'>第 " + (quiz.qi + 1) + " / " + quiz.qs.length + " 题：" + s(q.q) + "</div><div class='opts'>";
    q.opts.forEach(function (o, i) { html += "<button class='opt' data-i='" + i + "'><span class='ltr'>" + letters[i] + ".</span><span>" + s(o) + "</span></button>"; });
    html += "</div><div class='explain' id='qEx'></div></div>";
    html += "<div style='text-align:center;margin-top:16px'><button class='btn btn-primary' id='quizNext' style='display:none'>下一题 →</button></div>";
    zone.innerHTML = html;
    zone.querySelectorAll(".opt").forEach(function (b) { b.onclick = function () { answer(b); }; });
    document.getElementById("quizNext").onclick = function () {
      quiz.qi++;
      if (quiz.qi < quiz.qs.length) renderQ(); else done();
    };
  }
  async function answer(btn) {
    var q = quiz.qs[quiz.qi];
    var chosen = parseInt(btn.getAttribute("data-i"), 10);
    var opts = document.querySelectorAll("#quizZone .opt");
    opts.forEach(function (b) { b.disabled = true; });
    if (chosen === q.ans) { quiz.right++; btn.classList.add("ok"); }
    else { btn.classList.add("bad"); opts[q.ans].classList.add("ok"); }
    var ex = document.getElementById("qEx");
    ex.textContent = (chosen === q.ans ? "✅ 回答正确。" : "❌ 正确答案是 " + "ABCD".charAt(q.ans) + "。") + q.ex;
    ex.classList.add("show");
    document.getElementById("quizNext").style.display = "inline-flex";
  }
  async function done() {
    var total = quiz.qs.length, pct = Math.round(quiz.right / total * 100);
    document.getElementById("quizZone").innerHTML =
      "<div style='text-align:center;padding:16px 0'><div style='font-size:50px'>" + (pct === 100 ? "🏆" : pct >= 66 ? "🎉" : "💪") + "</div>" +
      "<h3>" + (pct === 100 ? "满分！听力高手！" : pct >= 66 ? "不错，继续保持！" : "建议回听原文再测一次") + "</h3>" +
      "<p class='muted'>本轮得分 " + quiz.right + " / " + total + "（" + pct + "%）</p>" +
      "<button class='btn btn-primary' id='replay'>🔁 再测一次</button></div>";
    document.getElementById("replay").onclick = function () { quiz.qs = shuffleArr((cur().data || {}).qs); quiz.qi = 0; quiz.right = 0; renderQ(); };
    try { await BH.authed("/api/me/activity", { method: "POST", body: { type: "听力自测", correct: quiz.right, total: total, seconds: 240, meta: (cur().title || "").slice(0, 40) } }); } catch (e) {}
    if (pct >= 80) BH.celebrate();
  }

  show();
});