/* 博浩英语 CET-6 · 听力模块 v3（300+ 语料库 / 变速 / 逐句精听 / 自测） */
"use strict";
BH.reg("listening", async function (view) {
  var s = BH.esc;
  var items = (await BH.api("/api/content?cat=listening")) || [];
  var state = { idx: 0, type: "all", q: "", page: 0, per: 12, rate: 0.85, quiz: { qs: [], qi: 0, right: 0 } };
  var TYPE = { news: { ico: "📰", cn: "新闻" }, conversation: { ico: "💬", cn: "对话" }, lecture: { ico: "🎓", cn: "讲座" } };
  function typeOf(it) { var t = (it.data || {}).type || "lecture"; return TYPE[t] ? t : "lecture"; }
  function typeCN(it) { return (TYPE[typeOf(it)] || TYPE.lecture).cn; }
  function typeIco(it) { return (TYPE[typeOf(it)] || TYPE.lecture).ico; }
  function counts() { var c = { news: 0, conversation: 0, lecture: 0 }; items.forEach(function (it) { c[typeOf(it)]++; }); return c; }
  var C = counts();
  function filtered() {
    return items.filter(function (it) {
      if (state.type !== "all" && typeOf(it) !== state.type) return false;
      if (state.q) {
        var hay = ((it.title || "") + " " + String((it.data || {}).text || "")).toLowerCase();
        if (hay.indexOf(state.q.toLowerCase()) < 0) return false;
      }
      return true;
    });
  }
  function cur() { return items[state.idx] || items[0] || { data: {} }; }

  view.innerHTML =
    '<section class="section tight" style="padding-top:46px"><div class="container">' +
      '<div class="sec-head left"><span class="badge">🎧 听力模块 · wbh 创立</span>' +
      '<h2>听力精听训练</h2><p>真题风格语料共 <b>' + items.length + '</b> 篇：新闻 ' + C.news + ' · 对话 ' + C.conversation + ' · 讲座 ' + C.lecture + '。变速、逐句精听、对照原文、理解自测。</p></div>' +
      '<div class="panel" style="margin-bottom:16px">' +
        '<div class="toolbar" style="margin-bottom:12px"><span class="tag">类型</span>' +
          '<div class="seg" id="psgSeg"></div>' +
          '<input type="text" id="psgSearch" placeholder="🔍 搜标题 / 内容（回车）" style="max-width:230px">' +
          '<span class="grow"></span><span class="tag" id="psgTotal"></span></div>' +
        '<div class="lib-list" id="psgList"></div><div class="pager" id="psgPager"></div>' +
      '</div>' +
      '<div class="panel player-card">' +
        '<div class="toolbar"><span class="tag" id="psgType"></span><span class="tag">语速</span>' +
          '<select id="rateSel"><option value="0.7">🐢 0.7×</option><option value="0.85" selected>🌿 0.85×</option><option value="1">⚡ 1.0×</option></select><span class="grow"></span>' +
          '<button class="btn btn-ghost btn-sm" id="prevPsg">← 上一条</button>' +
          '<button class="btn btn-ghost btn-sm" id="nextPsg">下一条 →</button></div>' +
        '<h3 id="psgTitle" style="margin:12px 0 4px">—</h3><p class="muted" id="psgSub" style="margin:0 0 14px"></p>' +
        '<div class="btn-row" style="margin-bottom:12px">' +
          '<button class="btn btn-primary" id="playAll">▶ 整段播放</button>' +
          '<button class="btn btn-soft" id="playSent">🗣️ 逐句精听</button>' +
          '<button class="btn btn-ghost" id="stopPlay">⏹ 停止</button>' +
          '<button class="btn btn-ghost" id="toggleScript">📄 原文</button>' +
          '<button class="btn btn-ghost" id="gotoQuiz">📝 开始答题</button></div>' +
        '<div id="nowPlaying" class="callout tip" style="display:none;margin:4px 0 0"><span class="co-t">🎙️ <span class="audio-eq"><i></i><i></i><i></i></span> <span class="sentence-now" id="nowTxt"></span></span></div>' +
        '<div id="scriptBox" class="reader" style="display:none;margin-top:14px;max-height:340px;overflow:auto"></div>' +
      '</div>' +
      '<div class="panel" id="quizPanel" style="display:none;margin-top:16px"><h3><span class="n">?</span> 理解自测</h3><div id="quizZone"></div></div>' +
    '</div></section>' +
    '<section class="section tight" style="background:var(--grad-soft)"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Strategy</span><h2>听力策略与精听五步法</h2></div>' +
      '<div class="panel"><h3>🧘 精听五步法（每一步怎么做、怎么看）</h3><details class="acc" open><summary>① 泛听抓大意 · 只求“听懂主题” <span class="chev">▾</span></summary><div class="acc-body"><p><b>怎么做：</b>整段放 1 遍，不暂停、不回放，只回答三个问题——讲谁？发生什么？结果或态度如何？<br><b>怎么看效果：</b>能说出“这是一条关于……的新闻，重点是……”就算过关。</p><p class="sen">例：听 “This week, growing attention has turned to waste sorting.” 之后你只需知道：<span class="zh">主题=垃圾分类（waste sorting）。</span></p></div></details><details class="acc"><summary>② 逐句精听 · 一句一停，逼自己听清 <span class="chev">▾</span></summary><div class="acc-body"><p><b>怎么做：</b>用“🗣️ 逐句精听”按钮，每句结束自动停；第一遍先听主干（主谓宾），第二遍补细节（时间、地点、数字、转折）。<br><b>卡住怎么办：</b>最多听 3 遍还听不出，就过，不许先看原文。</p><p class="sen">例：句子 “Supporters say the practice can help reduce waste.” 第一遍听出 Supporters … can help … waste，第二遍补上 reduce。<span class="zh">先主干后细节。</span></p></div></details><details class="acc"><summary>③ 对照原文 · 找出“耳朵盲区” <span class="chev">▾</span></summary><div class="acc-body"><p><b>怎么做：</b>点“📄 原文”，逐句对答案：听对的不看，听错的标红。<br><b>重点看三类：</b>连读（help you → help-ju）、弱读（can 读成 /kən/）、生词读音。</p><p class="sen">例：听到 “help reduce” 像 “helpreduce”——这正常，就是连读；把它按节奏多读几遍。<span class="zh">盲区 = 耳朵没跟上，而不是不认识词。</span></p></div></details><details class="acc"><summary>④ 跟读模仿 · 嘴带动耳朵 <span class="chev">▾</span></summary><div class="acc-body"><p><b>怎么做：</b>调慢速（0.7×），跟读 2–3 遍；再回常速 1 遍，模仿重音和停顿。<br><b>标准：</b>读到“几乎和原音同时结束”为佳。</p></div></details><details class="acc"><summary>⑤ 盲听检验 · 合上原文再听 <span class="chev">▾</span></summary><div class="acc-body"><p><b>怎么做：</b>隐藏原文，整段再听 1 遍，目标：无停顿听懂 90% 以上；再点“📝 开始答题”自测。<br><b>自评：</b>听力自测 ≥80% 可进入下一篇。</p></div></details><div class="callout tip" style="margin-top:12px"><span class="co-t">💡 搭配建议</span>精听每天 20 分钟就够：5 分钟泛听 + 10 分钟逐句 + 5 分钟跟读。量不贪多，贵在“听清每个词”。语料朗读依赖系统语音（Chrome/Edge 最佳）。</div></div>' +
    '</div></section>';

  var seg = document.getElementById("psgSeg");
  seg.innerHTML = "<button class='on' data-t='all'>全部</button><button data-t='news'>📰 新闻</button><button data-t='conversation'>💬 对话</button><button data-t='lecture'>🎓 讲座</button>";
  seg.querySelectorAll("button").forEach(function (b) {
    b.onclick = function () {
      state.type = b.getAttribute("data-t"); state.page = 0;
      seg.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on"); renderList();
    };
  });
  document.getElementById("psgSearch").onkeydown = function (e) { if (e.key === "Enter") { state.q = this.value.trim(); state.page = 0; renderList(); } };
  document.getElementById("rateSel").onchange = function () { state.rate = parseFloat(this.value); };
  document.getElementById("prevPsg").onclick = function () { move(-1); };
  document.getElementById("nextPsg").onclick = function () { move(1); };
  document.getElementById("playAll").onclick = function () { playAll(); };
  document.getElementById("playSent").onclick = function () { playSent(); };
  document.getElementById("stopPlay").onclick = stop;
  document.getElementById("toggleScript").onclick = toggleScript;
  document.getElementById("gotoQuiz").onclick = openQuiz;

  function renderList() {
    var arr = filtered();
    var pages = Math.max(1, Math.ceil(arr.length / state.per));
    if (state.page >= pages) state.page = pages - 1;
    var rows = arr.slice(state.page * state.per, (state.page + 1) * state.per);
    document.getElementById("psgTotal").textContent = "共 " + arr.length + " 条";
    var zone = document.getElementById("psgList");
    zone.innerHTML = rows.map(function (it) {
      var gi = items.indexOf(it);
      return "<button type='button' class='lib-row" + (items[state.idx] === it ? " on" : "") + "' data-g='" + gi + "'>" +
        "<span class='tag lib-tag'>" + typeIco(it) + " " + typeCN(it) + "</span>" +
        "<span class='lib-title'>" + s(it.title || "无题") + "</span>" +
        "<span class='muted lib-sub'>" + s(it.sub || "") + "</span></button>";
    }).join("") || "<div class='empty-note'>没有匹配的语料</div>";
    zone.querySelectorAll(".lib-row").forEach(function (b) {
      b.onclick = function () { state.idx = parseInt(b.getAttribute("data-g"), 10); renderList(); show(); };
    });
    var pg = document.getElementById("psgPager");
    pg.innerHTML = "";
    var mk = function (label, page, on) {
      var x = document.createElement("button");
      x.textContent = label; if (on) x.classList.add("on");
      x.disabled = page === state.page;
      x.onclick = function () { state.page = page; renderList(); };
      return x;
    };
    pg.appendChild(mk("‹", Math.max(0, state.page - 1)));
    for (var i = 0; i < pages; i++) {
      if (pages > 12 && i > 2 && i < pages - 3 && Math.abs(i - state.page) > 2) continue;
      pg.appendChild(mk(String(i + 1), i, i === state.page));
    }
    pg.appendChild(mk("›", Math.min(pages - 1, state.page + 1)));
  }
  function show() {
    var it = cur(), d = it.data || {};
    document.getElementById("psgType").textContent = typeIco(it) + " " + typeCN(it);
    document.getElementById("psgTitle").textContent = it.title || "—";
    document.getElementById("psgSub").textContent = it.sub || "";
    document.getElementById("scriptBox").innerHTML = String(d.text || "").split("\n").filter(Boolean).map(function (x) { return "<p>" + s(x) + "</p>"; }).join("");
    stop(); closeQuiz();
  }
  function move(delta) { state.idx = (state.idx + delta + items.length) % items.length; renderList(); show(); window.scrollTo({ top: 0 }); }
  function stop() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    clearTimeout(window._sentTimer);
    var np = document.getElementById("nowPlaying"); if (np) np.style.display = "none";
  }
  function voice() {
    if (!("speechSynthesis" in window)) return null;
    var vs = speechSynthesis.getVoices();
    return vs.filter(function (v) { return /en[-_]US/i.test(v.lang); })[0] || vs.filter(function (v) { return /^en/i.test(v.lang); })[0] || null;
  }
  function ut(txt, onEnd) {
    var u = new SpeechSynthesisUtterance(txt);
    u.lang = "en-US"; var v = voice(); if (v) u.voice = v;
    u.rate = state.rate; if (onEnd) u.onend = onEnd;
    return u;
  }
  function setNow(t) { var b = document.getElementById("nowPlaying"); if (b) { document.getElementById("nowTxt").textContent = t; b.style.display = "block"; } }
  function playAll() {
    if (!("speechSynthesis" in window)) { BH.toast("浏览器不支持语音，建议 Chrome/Edge"); return; }
    stop();
    setNow("整段播放中…");
    speechSynthesis.speak(ut(String((cur().data || {}).text || "")));
  }
  function playSent() {
    if (!("speechSynthesis" in window)) { BH.toast("浏览器不支持语音，建议 Chrome/Edge"); return; }
    stop();
    var sents = String((cur().data || {}).text || "").split(/(?<=[.!?])\s+/).filter(Boolean);
    var i = 0;
    (function next() {
      if (i >= sents.length) { var np = document.getElementById("nowPlaying"); if (np) np.style.display = "none"; return; }
      setNow("第 " + (i + 1) + " / " + sents.length + " 句 · " + sents[i]);
      speechSynthesis.speak(ut(sents[i], function () { i++; window._sentTimer = setTimeout(next, 260); }));
    })();
  }
  function toggleScript() {
    var b = document.getElementById("scriptBox");
    var show = b.style.display === "none";
    b.style.display = show ? "block" : "none";
    BH.toast(show ? "已显示原文 📄" : "已隐藏原文 👂");
  }
  function openQuiz() {
    var src = (cur().data || {}).qs || [];
    if (!src.length) { BH.toast("本条暂无题目"); return; }
    state.quiz = { qs: src.slice().sort(function () { return Math.random() - .5; }), qi: 0, right: 0 };
    var qp = document.getElementById("quizPanel");
    qp.style.display = "block"; qp.scrollIntoView({ behavior: "smooth", block: "center" });
    drawQ();
  }
  function drawQ() {
    var q = state.quiz.qs[state.quiz.qi];
    if (!q) return done();
    var letters = ["A", "B", "C", "D"];
    var html = "<div class='q-item' style='margin-top:0'><div class='q-title'>第 " + (state.quiz.qi + 1) + " / " + state.quiz.qs.length + " 题：" + s(q.q) + "</div><div class='opts'>";
    (q.opts || []).forEach(function (o, i) { html += "<button class='opt' data-i='" + i + "'><span class='ltr'>" + letters[i] + ".</span><span>" + s(o) + "</span></button>"; });
    html += "</div><div class='explain' id='qEx'></div></div><div style='text-align:center;margin-top:16px'><button class='btn btn-primary' id='qNext' style='display:none'>下一题 →</button></div>";
    document.getElementById("quizZone").innerHTML = html;
    document.getElementById("quizZone").querySelectorAll(".opt").forEach(function (b) { b.onclick = function () { ansQ(b); }; });
    document.getElementById("qNext").onclick = function () { state.quiz.qi++; drawQ(); };
  }
  function ansQ(btn) {
    var q = state.quiz.qs[state.quiz.qi];
    var chosen = parseInt(btn.getAttribute("data-i"), 10);
    var opts = document.querySelectorAll("#quizZone .opt");
    opts.forEach(function (b) { b.disabled = true; });
    if (chosen === q.ans) { state.quiz.right++; btn.classList.add("ok"); }
    else { btn.classList.add("bad"); if (opts[q.ans]) opts[q.ans].classList.add("ok"); }
    var ex = document.getElementById("qEx");
    ex.textContent = (chosen === q.ans ? "✅ 正确。" : "❌ 正确答案是 " + "ABCD".charAt(q.ans) + "。") + (q.ex || "");
    ex.classList.add("show");
    document.getElementById("qNext").style.display = "inline-flex";
  }
  async function done() {
    var total = state.quiz.qs.length, right = state.quiz.right, pct = total ? Math.round(right / total * 100) : 0;
    document.getElementById("quizZone").innerHTML =
      "<div style='text-align:center;padding:16px 0'><div style='font-size:50px'>" + (pct === 100 ? "🏆" : pct >= 60 ? "🎉" : "💪") + "</div><h3>" + (pct === 100 ? "满分！" : pct >= 60 ? "不错！" : "回听原文再答") + "</h3>" +
      "<p class='muted'>得分 " + right + " / " + total + "（" + pct + "%）</p><button class='btn btn-primary' id='qAgain'>🔁 再答一次</button></div>";
    document.getElementById("qAgain").onclick = function () { state.quiz.qi = 0; state.quiz.right = 0; drawQ(); };
    try { await BH.authed("/api/me/activity", { method: "POST", body: { type: "听力自测", correct: right, total: total, seconds: 240, meta: String(cur().title || "").slice(0, 40) } }); } catch (e) {}
    if (pct >= 80) BH.celebrate();
  }
  function closeQuiz() { var qp = document.getElementById("quizPanel"); if (qp) qp.style.display = "none"; }

  renderList();
  show();
});