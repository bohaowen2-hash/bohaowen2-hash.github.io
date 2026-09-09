/* 博浩英语 CET-6 · 词汇模块（海量词库 / 翻卡 / 自测 / 错题 / 词表 / 短语） */
"use strict";
BH.reg("vocab", async function (view, params) {
  var s = BH.esc;
  var state = {
    units: [], unit: "", mode: "card", // card | quiz | list | phrase
    deck: [], order: [], idx: 0, shuffled: false,
    known: {}, wrong: {}, // word -> true, 云同步镜像
    q: [], qi: 0, right: 0, wrongThis: [],
    loading: true
  };

  /* ---------- 云学习状态 ---------- */
  async function loadMyState() {
    try {
      var me = await BH.authed("/api/me");
      var arr = me.state || {};
      state.known = {}; state.wrong = {};
      (arr.known || []).forEach(function (w) { state.known[w] = true; });
      (arr.wrong || []).forEach(function (w) { state.wrong[w] = true; });
    } catch (e) { /* 离线仍可用本地 */ }
  }
  function localKnown(w) { return !!state.known[w.toLowerCase()]; }
  function localWrong(w) { return !!state.wrong[w.toLowerCase()]; }
  async function markKnown(w, val) {
    w = String(w).toLowerCase();
    if (val) state.known[w] = true; else delete state.known[w];
    delete state.wrong[w];
    try { await BH.authed("/api/me/known", { method: "POST", body: { word: w, value: !!val } }); }
    catch (e) { BH.toast((BH.STATIC ? "保存失败" : "云同步失败") + "：" + e.message); }
  }
  async function markWrong(w, val) {
    w = String(w).toLowerCase();
    if (val) state.wrong[w] = true; else delete state.wrong[w];
    try {
      if (val) await BH.authed("/api/me/wrong", { method: "POST", body: { word: w } });
      else await BH.authed("/api/me/wrong/" + encodeURIComponent(w), { method: "DELETE" });
    } catch (e) { BH.toast((BH.STATIC ? "保存失败" : "云同步失败") + "：" + e.message); }
  }

  /* ---------- 数据 ---------- */
  var unitsData = await BH.api("/api/units");
  state.units = unitsData;
  state.unit = unitsData.length ? unitsData[0].id : "";
  function savedPos() { try { var p = JSON.parse(localStorage.getItem("bh-vocab-pos") || "null"); return p; } catch (e) { return null; } }
  function rememberPos() { try { localStorage.setItem("bh-vocab-pos", JSON.stringify({ unit: state.unit, idx: state.idx })); } catch (e) {} }
  var spInit = savedPos();
  if (spInit && unitsData.some(function (u) { return u.id === spInit.unit; })) state.unit = spInit.unit;
  await loadMyState();

  var unitSelHtml = "<select id='vUnit'>" + unitsData.map(function (u) { return "<option value='" + u.id + "'>" + s(u.name) + "</option>"; }).join("") + "</select>";

  function sessionPools() {
    // 依据当前单元构造当前 pool 的单词数组（本单元全部）
    return null; // 通过 API 拉取
  }

  view.innerHTML =
    '<section class="section tight" style="padding-top:46px"><div class="container">' +
      '<div class="sec-head left"><span class="badge">📖 词汇模块 · wbh 创立</span>' +
      '<h2>核心词汇 · 翻卡闯关</h2>' +
      '<p>词库已扩容至 <b>' + (BH.site ? BH.site.counts.words : "") + '+</b> 大纲核心词与 <b>' + (BH.site ? BH.site.counts.phrases : "") + '+</b> 搭配。翻卡记忆 → 自测巩固 → 错题重练，进度清晰可见。</p></div>' +
      '<div class="toolbar">' +
        '<div class="seg" id="vSeg">' +
          '<button data-mode="card" class="on">🎴 背词</button>' +
          '<button data-mode="quiz">📝 自测</button>' +
          '<button data-mode="spell">✍️ 拼写</button>' +
          '<button data-mode="list">📋 词表</button>' +
          '<button data-mode="review">🧠 复习</button>' +
          '<button data-mode="phrase">🔗 短语库</button>' +
        '</div>' +
        '<span class="grow"></span>' +
        '<button class="btn btn-ghost btn-sm" id="vReset">↺ 清空掌握记录</button>' +
      '</div>' +
      '<div class="progress-line"><span>我已掌握</span><div class="fp-bar"><div class="fp-fill" id="vBar" style="width:0%"></div></div><b id="vBarTxt">0</b></div>' +
    '</div></section>' +
    '<section class="section tight" id="vBody" style="padding-top:8px"><div class="container"><div class="empty-hint"><span class="spin"></span> 加载中…</div></div></section>';

  /* 掌握进度统计 */
  async function refreshProgress() {
    try {
      var d = await BH.authed("/api/me");
      var n = ((d.state && d.state.known) || []).length;
      var total = (BH.site && BH.site.counts && BH.site.counts.words) || 1;
      document.getElementById("vBar").style.width = Math.min(100, n / total * 100) + "%";
      document.getElementById("vBarTxt").textContent = n + " / " + total;
    } catch (e) {}
  }

  /* 绑定分段 & 单元 */
  document.getElementById("vSeg").querySelectorAll("button").forEach(function (b) {
    b.onclick = function () {
      state.mode = b.getAttribute("data-mode");
      document.querySelectorAll("#vSeg button").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      renderBody();
    };
  });
  var unitSel = document.getElementById("vUnit");
  document.getElementById("vReset").onclick = function () {
    if (!confirm("确定清空该浏览器账号的全部“已掌握”记录吗？（本地记录将一并清除）")) return;
    var list = Object.keys(state.known);
    state.known = {};
    Promise.all(list.map(function (w) { return BH.authed("/api/me/known", { method: "POST", body: { word: w, value: false } }).catch(function () {}); }))
      .then(function () { refreshProgress(); BH.toast("已清空掌握记录 ↺"); });
  };

  /* ---------- 视图渲染 ---------- */
  async function renderBody() {
    var box = document.getElementById("vBody");
    var inner = box.querySelector(".container") || box;
    if (state.mode === "card") await renderCard(inner);
    else if (state.mode === "quiz") await renderQuiz(inner);
    else if (state.mode === "spell") await renderSpell(inner);
    else if (state.mode === "list") await renderList(inner);
    else if (state.mode === "review") await renderReview(inner);
    else await renderPhrase(inner);
  }

  /* ============ 背词 ============ */
  var deckWords = [];
  async function loadDeck() {
    var opts = { size: 9999, unit: state.unit };
    var r = await BH.api("/api/words?unit=" + encodeURIComponent(state.unit) + "&limit=500");
    return r.rows;
  }
  async function renderCard(box) {
    box.innerHTML =
      '<div class="toolbar">' + unitSelHtml +
      '<button class="btn btn-ghost btn-sm" id="cShuffle">🔀 乱序</button>' +
      '<button class="btn btn-ghost btn-sm" id="cSpeak">🔊 朗读</button>' +
      '<span class="grow"></span><span class="tag" id="cPos"></span></div>' +
      '<div class="flash-zone">' +
        '<div class="flash-card" id="flashCard"><div class="fc-inner">' +
          '<div class="fc-face fc-front"><span class="fc-tag tag" id="cState">未学</span><div class="fc-word" id="fcWord">…</div><div class="fc-ipa" id="fcIpa"></div><div class="freq-pill" id="cFreq">—</div><div class="fc-hint">👆 点击卡片查看释义</div></div>' +
          '<div class="fc-face fc-back"><span class="fc-tag tag" id="cFreqBack">—</span><div class="fc-meaning" id="fcMeaning"></div><div class="fc-pos" id="fcPos2"></div><div class="fc-ex" id="fcEx"></div><div class="fc-cn" id="fcCn"></div>' +
          
          '<div class="fc-note" id="fcAf" style="display:none"></div>' +
          '<div class="fc-note" id="fcSim" style="display:none"></div>' +
          '<div class="fc-note" id="fcMem" style="display:none"></div></div>' +
        '</div></div>' +
        '<div class="btn-row" style="justify-content:center;margin-top:18px">' +
          '<button class="btn btn-ghost" id="prevBtn">← 上一个</button>' +
          '<button class="btn btn-danger" id="unknownBtn">✗ 不认识</button>' +
          '<button class="btn btn-primary" id="knownBtn">✓ 已掌握</button>' +
          '<button class="btn btn-ghost" id="nextBtn">下一个 →</button>' +
        '</div>' +
        '<div class="session-meta"><span id="cOrder"></span><span>👆 空格 / 点击翻面 · ←→ 切换</span></div>' +
      '</div>';
    var sel = document.getElementById("vUnit");
    sel.value = state.unit;
    sel.onchange = async function () {
      state.unit = sel.value;
      document.getElementById("cPos").textContent = "加载中…";
      deckWords = await loadDeck();
      state.deck = deckWords.slice();
      var sp2 = savedPos();
      state.idx = (sp2 && sp2.unit === state.unit && sp2.idx < state.deck.length) ? sp2.idx : 0;
      state.shuffled = false;
      showCard();
      var un = unitsData.find(function (u) { return u.id === state.unit; });
      BH.toast("已切换到 " + (un ? un.name : state.unit) + " 🎈");
    };
    deckWords = await loadDeck();
    state.deck = deckWords;
    var sp0 = savedPos();
    state.idx = (sp0 && sp0.unit === state.unit && sp0.idx < state.deck.length) ? sp0.idx : 0;
    state.shuffled = false;
    document.getElementById("cShuffle").onclick = function () { state.shuffled = !state.shuffled; if (state.shuffled) { state.deck = deckWords.slice().sort(function(){ return Math.random() - .5; }); } else { state.deck = deckWords.slice(); } state.idx = 0; showCard(); BH.toast(state.shuffled ? "已开启乱序 🔀" : "已恢复顺序 ↩️"); };
    document.getElementById("cSpeak").onclick = function () { speak(cur().w); };
    document.getElementById("flashCard").onclick = function () { document.getElementById("flashCard").classList.toggle("flipped"); };
    document.getElementById("prevBtn").onclick = function () { nav(-1); };
    document.getElementById("nextBtn").onclick = function () { nav(1); };
    document.getElementById("knownBtn").onclick = function () { decide(true); };
    document.getElementById("unknownBtn").onclick = function () { decide(false); };
    window._vKey = function (e) {
      if (document.getElementById("view").dataset.vKeyOn !== "1") return;
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); nav(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); nav(-1); }
      if (e.key === " ") { e.preventDefault(); document.getElementById("flashCard") && document.getElementById("flashCard").classList.toggle("flipped"); }
    };
    document.removeEventListener("keydown", window._vKey);
    document.addEventListener("keydown", window._vKey);
    document.getElementById("view").dataset.vKeyOn = "1";
    showCard();
  }
  function cur() { return state.deck[state.idx]; }
  function nav(d) { state.idx = (state.idx + d + state.deck.length) % state.deck.length; showCard(); }
  function showCard() {
    var w = cur(); if (!w) return;
    document.getElementById("fcWord").textContent = w.w;
    document.getElementById("fcIpa").textContent = w.f || "";
    document.getElementById("fcMeaning").textContent = w.m;
    document.getElementById("fcPos2").textContent = (w.p || "") + " · " + w.w;
    document.getElementById("fcEx").textContent = w.ex ? "“" + w.ex + "”" : "";
    document.getElementById("fcCn").textContent = w.c || "";
    var card = document.getElementById("flashCard");
    card.classList.remove("flipped");
    var st = document.getElementById("cState");
    if (localKnown(w.w)) { st.textContent = "已掌握 ✓"; st.className = "fc-tag tag"; st.style.cssText = "background:rgba(22,163,74,.12);color:var(--green);border-color:rgba(22,163,74,.3)"; }
    else if (localWrong(w.w)) { st.textContent = "错题 ✗"; st.style.cssText = "background:rgba(225,29,72,.1);color:var(--red);border-color:rgba(225,29,72,.28)"; st.className = "fc-tag tag"; }
    else { st.textContent = "未学"; st.className = "fc-tag tag plain"; }
    document.getElementById("cPos").textContent = (state.idx + 1) + " / " + state.deck.length + " 词（每单元 50 词）";
    var fr = document.getElementById("cFreq");
    if (fr) {
      var f = w.freq || "";
      fr.textContent = f === "高" ? "🔥 高频" : f === "中" ? "⭐ 中频" : f === "低" ? "🌱 低频" : "—";
      fr.className = "freq-pill freq-" + (f ? f.toLowerCase() : "none");
    }
    var fb = document.getElementById("cFreqBack");
    if (fb) { fb.textContent = f === "高" ? "🔥 高频" : f === "中" ? "⭐ 中频" : f === "低" ? "🌱 低频" : ""; fb.className = "fc-tag tag freq-pill freq-" + (f ? f.toLowerCase() : "none"); }

    var af = document.getElementById("fcAf"); if (af) { if (w.af) { af.textContent = "🧩 " + w.af; af.style.display = "block"; } else af.style.display = "none"; }
    var sm = document.getElementById("fcSim"); if (sm) { if (w.sim && w.sim.length) { sm.innerHTML = "👯 形近词：" + w.sim.map(function (x) { return "<span class='sim-w'>" + s(x) + "</span>"; }).join(""); sm.style.display = "block"; } else sm.style.display = "none"; }
    var mm = document.getElementById("fcMem"); if (mm) { if (w.mem) { mm.textContent = "💭 " + w.mem; mm.style.display = "block"; } else mm.style.display = "none"; }
    document.getElementById("cOrder").textContent = state.shuffled ? "🔀 乱序中" : "↩️ 按单元顺序";
    rememberPos();
  }
  async function decide(known) {
    var w = cur().w;
    if (known) {
      await markKnown(w, true);
      try { await BH.authed("/api/me/reviews/learn", { method: "POST", body: { word: w } }); } catch (e) {}
    } else {
      await markWrong(w, true);
      try { await BH.authed("/api/me/reviews/answer", { method: "POST", body: { word: w, good: false } }); } catch (e) {}
    }
    refreshProgress();
    showCard();
    nav(1);
  }
  function speak(text) {
    if (!("speechSynthesis" in window)) { fallbackAudio(text); return; }
    var vs = speechSynthesis.getVoices();
    if (!vs.length) {
      speechSynthesis.onvoiceschanged = function () { vs = speechSynthesis.getVoices(); };
    }
    try {
      speechSynthesis.cancel();
      window._speaking = false;
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US"; u.rate = .85;
      var v = vs.filter(function (x) { return /en[-_]US/i.test(x.lang); })[0] || vs.filter(function (x) { return /^en/i.test(x.lang); })[0];
      if (v) u.voice = v;
      u.onstart = function () { window._speaking = true; };
      u.onerror = function () { fallbackAudio(text); };
      u.onend = function () { window._speaking = false; };
      speechSynthesis.speak(u);
      setTimeout(function () { if (!window._speaking) fallbackAudio(text); }, 1600);
    } catch (e) { fallbackAudio(text); }
  }
  function fallbackAudio(text) {
    var a = document.createElement("audio");
    a.src = "https://dict.youdao.com/dictvoice?audio=" + encodeURIComponent(text) + "&type=2";
    a.play().catch(function () { BH.toast("朗读不可用：请检查网络或浏览器设置 🔊"); });
  }

  /* ============ 自测 ============ */
  async function renderQuiz(box) {
    box.innerHTML =
      '<div class="toolbar">' + unitSelHtml +
      '<button class="btn btn-ghost btn-sm" id="qOnlyWrong">❌ 只测错题</button>' +
      '<span class="tag">词号</span><input type="number" id="qFrom" min="1" value="1" style="width:82px">' +
      '<span class="tag">至</span><input type="number" id="qTo" min="1" value="50" style="width:82px">' +
      '<span class="tag muted" style="border:none;background:none" id="qRangeHint">本单元 1–50 词</span>' +
      '<button class="btn btn-primary btn-sm" id="qStart">🚀 开始自测</button></div>' +
      '<div class="panel" style="max-width:760px;margin-top:6px">' +
        '<div id="quizReady" style="text-align:center;padding:18px 0"><p class="muted">从当前单元随机抽 10 词自测（含 4 个释义选项）。答错的词会自动收进错题本。</p></div>' +
        '<div id="quizBody" style="display:none">' +
          '<div class="progress-line"><span>进度</span><div class="fp-bar"><div class="fp-fill" id="qBar" style="width:0%"></div></div><b id="qProg">0/10</b></div>' +
          '<div style="text-align:center;margin:6px 0 16px"><div class="big-word" id="qWord">—</div><div class="muted" id="qIpa"></div></div>' +
          '<div style="display:grid;gap:10px" id="qOpts"></div>' +
          '<div class="btn-row" style="justify-content:center;margin-top:18px"><button class="btn btn-primary" id="qNext" style="display:none">下一题 →</button></div>' +
        '</div>' +
        '<div id="qDone" style="display:none;text-align:center;padding:16px 0"><div style="font-size:52px" id="qEmoji">🎉</div><h3 id="qTitle"></h3><p class="muted" id="qMsg"></p>' +
        '<div class="btn-row" style="justify-content:center"><button class="btn btn-danger" id="qWrongAgain" style="display:none">🔁 重做错题</button><button class="btn btn-primary" id="qAgain">再测一轮</button></div></div>' +
      '</div>';
    var sel = document.getElementById("vUnit"); sel.value = state.unit;
    sel.onchange = function () { state.unit = sel.value; };
    document.getElementById("qFrom").oninput = function () { var t = document.getElementById("qTo"); if (parseInt(this.value, 10) > parseInt(t.value, 10)) t.value = this.value; };
    document.getElementById("qTo").oninput = function () { var f = document.getElementById("qFrom"); if (parseInt(this.value, 10) < parseInt(f.value, 10)) f.value = this.value; };
    document.getElementById("qStart").onclick = function () { startQuiz(false); };
    document.getElementById("qAgain").onclick = function () { startQuiz(false); };
    document.getElementById("qWrongAgain").onclick = function () { startQuiz(true); };
    var nextBtn = document.getElementById("qNext");
    nextBtn.onclick = function () {
      state.qi++;
      if (state.qi < state.q.length) renderQ(); else finishQ();
    };
  }
  async function startQuiz(onlyWrong) {
    var unit = state.unit;
    var meta = await BH.api("/api/words?unit=" + encodeURIComponent(unit) + "&limit=1");
    var maxN = meta.total || 0;
    var fEl = document.getElementById("qFrom"), tEl = document.getElementById("qTo");
    var from = fEl ? Math.max(1, Math.min(parseInt(fEl.value || "1", 10) || 1, maxN || 1)) : 1;
    var to = tEl ? Math.max(from, Math.min(parseInt(tEl.value || "50", 10) || maxN, maxN || from)) : maxN || from;
    if (maxN) { document.getElementById("qRangeHint").textContent = "本单元 1–" + maxN + " 词 · 已选 " + from + "–" + to; }
    var qSize = Math.max(1, Math.min(10, to - from + 1));
    var pool;
    if (onlyWrong) {
      var wrongList = Object.keys(state.wrong);
      if (!wrongList.length) { BH.toast("错题本是空的，先去自测吧 😉"); return; }
      pool = (await BH.api("/api/words/random", { method: "POST", body: { size: qSize, unit: unit, onlyWrong: true, wrong: wrongList } })).rows;
    } else {
      pool = (await BH.api("/api/words/random", { method: "POST", body: { size: qSize, unit: unit, start: from, end: to, exclude: Object.keys(state.known) } })).rows;
    }
    if (pool.length < 4) { BH.toast("当前范围题目不足，请切换到其他单元"); return; }
    pool = pool.slice().sort(function(){ return Math.random() - .5; }).slice(0, 10);
    state.q = pool.map(function (w) {
      var others = pool.filter(function (x) { return x.w !== w.w; }).sort(function(){ return Math.random() - .5; });
      var dist = others.slice(0, 3).map(function (x) { return x.m; });
      var opts = [w.m].concat(dist).sort(function(){ return Math.random() - .5; });
      return { w: w, opts: opts, ans: w.m };
    });
    state.qi = 0; state.right = 0; state.wrongThis = [];
    document.getElementById("quizReady").style.display = "none";
    document.getElementById("qDone").style.display = "none";
    document.getElementById("quizBody").style.display = "block";
    renderQ();
  }
  function renderQ() {
    var q = state.q[state.qi];
    document.getElementById("qWord").textContent = q.w.w;
    document.getElementById("qIpa").textContent = (q.w.f || "") + "  ·  " + (q.w.p || "") + "   ·  " + (q.w.freq === "高" ? "🔥高频" : q.w.freq === "中" ? "⭐中频" : q.w.freq === "低" ? "🌱低频" : "");
    document.getElementById("qProg").textContent = (state.qi + 1) + "/" + state.q.length;
    document.getElementById("qBar").style.width = ((state.qi + 1) / state.q.length * 100) + "%";
    var box = document.getElementById("qOpts");
    box.innerHTML = "";
    var letters = ["A", "B", "C", "D"];
    q.opts.forEach(function (o, i) {
      var b = document.createElement("button");
      b.className = "quiz-opt";
      b.innerHTML = "<span class='key'>" + letters[i] + "</span><span>" + s(o) + "</span>";
      b.onclick = function () { answer(i); };
      box.appendChild(b);
    });
    document.getElementById("qNext").style.display = "none";
  }
  async function answer(i) {
    var q = state.q[state.qi];
    var box = document.getElementById("qOpts");
    var btns = box.querySelectorAll(".quiz-opt");
    btns.forEach(function (b) { b.disabled = true; });
    var ok = q.opts[i] === q.ans;
    if (ok) {
      state.right++; btns[i].classList.add("correct");
      try { await BH.authed("/api/me/reviews/learn", { method: "POST", body: { word: q.w.w } }); } catch (e) {}
    }
    else {
      btns[i].classList.add("wrong");
      state.wrongThis.push(q.w);
      await markWrong(q.w.w, true);
      try { await BH.authed("/api/me/reviews/answer", { method: "POST", body: { word: q.w.w, good: false } }); } catch (e) {}
      btns.forEach(function (b, bi) { if (q.opts[bi] === q.ans) b.classList.add("correct"); });
    }
    document.getElementById("qNext").style.display = "inline-flex";
  }
  async function finishQ() {
    document.getElementById("quizBody").style.display = "none";
    var total = state.q.length, pct = Math.round(state.right / total * 100);
    document.getElementById("qEmoji").textContent = pct >= 90 ? "🏆" : pct >= 70 ? "🎉" : pct >= 50 ? "💪" : "📚";
    document.getElementById("qTitle").textContent = pct >= 90 ? "大神级别！" : pct >= 70 ? "掌握得不错！" : pct >= 50 ? "继续加油！" : "建议先翻卡再测";
    document.getElementById("qMsg").textContent = "本单元得分 " + state.right + " / " + total + "（" + pct + "%），错误 " + state.wrongThis.length + " 词。";
    document.getElementById("qDone").style.display = "block";
    document.getElementById("qWrongAgain").style.display = state.wrongThis.length ? "inline-flex" : "none";
    try {
      await BH.authed("/api/me/activity", { method: "POST", body: { type: "词汇自测", correct: state.right, total: total, seconds: 60, meta: "单元 " + state.unit } });
    } catch (e) {}
    refreshProgress();
    if (pct >= 80) BH.celebrate();
  }

  /* ============ 拼写检验 ============ */
  var spell = { q: [], i: 0, right: 0, wrongs: [] };
  async function renderSpell(box) {
    box.innerHTML =
      '<div class="toolbar">' + unitSelHtml +
      '<button class="btn btn-ghost btn-sm" id="spOnlyWrong">❌ 只拼错题</button>' +
      '<span class="tag">词号</span><input type="number" id="spFrom" min="1" value="1" style="width:82px"><span class="tag">至</span><input type="number" id="spTo" min="1" value="50" style="width:82px">' +
      '<button class="btn btn-primary btn-sm" id="spStart">✍️ 开始拼写 10 词</button></div>' +
      '<div class="panel" style="max-width:720px;margin-top:6px">' +
        '<div id="spReady" style="text-align:center;padding:18px 0"><p class="muted">看中文释义 → 凭记忆拼出英文单词（区分大小写）。答错的自动进错题本。</p></div>' +
        '<div id="spBody" style="display:none">' +
          '<div class="progress-line"><span>进度</span><div class="fp-bar"><div class="fp-fill" id="spBar" style="width:0%"></div></div><b id="spProg">0/10</b></div>' +
          '<div style="text-align:center;margin:14px 0 8px"><div class="muted" id="spMeta" style="font-size:14px"></div>' +
          '<div style="font-size:22px;font-weight:800;margin:8px 0" id="spMeaning">—</div>' +
          '<div id="spUnderscore" class="muted" style="font-size:26px;letter-spacing:6px;font-family:ui-monospace,monospace"></div>' +
          '<button class="btn btn-ghost btn-sm" id="spHint" style="margin-top:10px">💡 给一个首字母提示</button></div>' +
          '<input type="text" id="spInput" placeholder="输入英文单词后回车" autocomplete="off" autocapitalize="off" style="max-width:360px;margin:0 auto;display:block;text-align:center;font-size:18px">' +
          '<div class="btn-row" style="justify-content:center;margin-top:14px"><button class="btn btn-primary" id="spCheck">✓ 检查</button></div>' +
          '<div class="muted" id="spTip" style="text-align:center;margin-top:10px;font-size:13px"></div>' +
        '</div>' +
        '<div id="spDone" style="display:none;text-align:center;padding:16px 0"><div style="font-size:50px" id="spEmoji">🎉</div><h3 id="spTitle"></h3><p class="muted" id="spMsg"></p>' +
        '<div class="btn-row" style="justify-content:center"><button class="btn btn-danger" id="spWrongAgain" style="display:none">🔁 重拼错词</button><button class="btn btn-primary" id="spAgain">再测一轮</button></div></div>' +
      '</div>';
    var sel = document.getElementById("vUnit"); sel.value = state.unit;
    sel.onchange = function () { state.unit = sel.value; };
    document.getElementById("spStart").onclick = function () { spStart(false); };
    document.getElementById("spOnlyWrong").onclick = function () { spStart(true); };
    document.getElementById("spAgain").onclick = function () { spStart(false); };
    document.getElementById("spWrongAgain").onclick = function () { spStart(true); };
    document.getElementById("spHint").onclick = function () {
      var q = spell.q[spell.i]; if (!q) return;
      document.getElementById("spTip").textContent = "提示：首字母是 “" + q.answer.charAt(0).toUpperCase() + "”，共 " + q.answer.length + " 个字母";
    };
    var inp = document.getElementById("spInput");
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") spCheck(); });
    document.getElementById("spCheck").onclick = spCheck;
  }
  async function spStart(onlyWrong) {
    var unit = state.unit;
    var meta = await BH.api("/api/words?unit=" + encodeURIComponent(unit) + "&limit=1");
    var maxN = meta.total || 0;
    var fEl = document.getElementById("spFrom"), tEl = document.getElementById("spTo");
    var from = fEl ? Math.max(1, parseInt(fEl.value || "1", 10) || 1) : 1;
    var to = tEl ? Math.max(from, Math.min(parseInt(tEl.value || String(maxN || from), 10) || maxN, maxN || from)) : maxN || from;
    var wrongList = Object.keys(state.wrong);
    var body = onlyWrong ? { size: 10, unit: unit, onlyWrong: true, wrong: wrongList } : { size: 10, unit: unit, start: from, end: to, exclude: Object.keys(state.known) };
    var pool = (await BH.api("/api/words/random", { method: "POST", body: body })).rows;
    if (pool.length < 1) { BH.toast("当前范围没有可拼写的词（错题本为空时请先自测）"); return; }
    spell.q = pool.map(function (w) { return { m: w.m, pos: w.p || "", freq: w.freq || "", answer: w.w, ex: w.ex || "", mem: w.mem || "" }; });
    spell.i = 0; spell.right = 0; spell.wrongs = [];
    document.getElementById("spReady").style.display = "none";
    document.getElementById("spDone").style.display = "none";
    document.getElementById("spBody").style.display = "block";
    spDraw();
  }
  function spDraw() {
    var q = spell.q[spell.i]; if (!q) { spDone(); return; }
    document.getElementById("spProg").textContent = (spell.i + 1) + "/" + spell.q.length;
    document.getElementById("spBar").style.width = ((spell.i + 1) / spell.q.length * 100) + "%";
    document.getElementById("spMeaning").textContent = q.m;
    document.getElementById("spMeta").textContent = (q.pos ? q.pos + " · " : "") + (q.freq ? (q.freq === "高" ? "🔥高频" : q.freq === "中" ? "⭐中频" : "🌱低频") : "");
    document.getElementById("spUnderscore").textContent = q.answer.replace(/[a-zA-Z]/g, "＿");
    document.getElementById("spTip").textContent = "";
    document.getElementById("spInput").value = "";
    document.getElementById("spInput").focus();
    var ip = document.getElementById("spInput");
    if (ip.setSelectionRange) ip.setSelectionRange(0, 0);
  }
  function norm(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
  async function spCheck() {
    var q = spell.q[spell.i];
    var val = document.getElementById("spInput").value.trim();
    if (!val) { BH.toast("请先输入单词"); return; }
    var ok = norm(val) === norm(q.answer);
    var tip = document.getElementById("spTip");
    if (ok) {
      spell.right++; tip.innerHTML = "✅ 拼写正确！<b>" + q.answer + "</b>";
      tip.style.color = "var(--green)";
      try { await BH.authed("/api/me/known", { method: "POST", body: { word: q.answer, value: true } }); } catch (e) {}
    } else {
      spell.wrongs.push(q);
      tip.innerHTML = "❌ 正确拼写：<b>" + q.answer + "</b>" + (q.ex ? "　例句：" + q.ex : "") + (q.mem ? "　" + q.mem : "");
      tip.style.color = "var(--red)";
      try { await BH.authed("/api/me/wrong", { method: "POST", body: { word: q.answer } }); } catch (e) {}
    }
    document.getElementById("spInput").value = "";
    document.getElementById("spCheck").disabled = true;
    var that = this;
    setTimeout(function () { document.getElementById("spCheck").disabled = false; spell.i++; spDraw(); }, 1300);
  }
  async function spDone() {
    var total = spell.q.length, right = spell.right, pct = total ? Math.round(right / total * 100) : 0;
    document.getElementById("spBody").style.display = "none";
    document.getElementById("spEmoji").textContent = pct === 100 ? "🏆" : pct >= 60 ? "🎉" : "💪";
    document.getElementById("spTitle").textContent = pct === 100 ? "拼写全对！" : pct >= 60 ? "不错，继续练！" : "多看几遍再拼";
    document.getElementById("spMsg").textContent = "拼写正确 " + right + " / " + total + "（" + pct + "%）";
    document.getElementById("spDone").style.display = "block";
    document.getElementById("spWrongAgain").style.display = spell.wrongs.length ? "inline-flex" : "none";
    try { await BH.authed("/api/me/activity", { method: "POST", body: { type: "拼写自测", correct: right, total: total, seconds: 120, meta: "看中文拼英文" } }); } catch (e) {}
    refreshProgress();
    if (pct >= 80) BH.celebrate();
  }

    /* ============ 词表 ============ */
  var listState = { q: "", page: 0, per: 80 };
  async function renderList(box) {
    box.innerHTML =
      '<div class="toolbar">' + unitSelHtml +
      '<input type="text" id="lSearch" placeholder="🔍 搜单词 / 中文释义（回车）" style="max-width:280px">' +
      '<button class="btn btn-primary btn-sm" id="lGo">搜索</button></div>' +
      '<div class="table-wrap" style="margin-top:14px"><table><thead><tr><th style="width:70px">掌握</th><th>单词</th><th>音标</th><th>词性</th><th>释义</th></tr></thead><tbody id="lBody"></tbody></table></div>' +
      '<div class="pager" id="lPager"></div>';
    var sel = document.getElementById("vUnit"); sel.value = state.unit;
    sel.onchange = function () { state.unit = sel.value; listState.page = 0; fetchList(); };
    document.getElementById("lSearch").value = listState.q;
    document.getElementById("lSearch").onkeydown = function (e) { if (e.key === "Enter") { listState.q = this.value.trim(); listState.page = 0; fetchList(); } };
    document.getElementById("lGo").onclick = function () { listState.q = document.getElementById("lSearch").value.trim(); listState.page = 0; fetchList(); };
    await fetchList();
  }
  async function fetchList() {
    var url = "/api/words?unit=" + encodeURIComponent(state.unit) + "&offset=" + (listState.page * listState.per) + "&limit=" + listState.per;
    if (listState.q) url += "&q=" + encodeURIComponent(listState.q);
    var d = await BH.api(url);
    var tb = document.getElementById("lBody");
    tb.innerHTML = d.rows.map(function (w) {
      var k = localKnown(w.w), wr = localWrong(w.w);
      var mark = k ? "<span class='known-dot yes'></span>已掌握" : wr ? "<span class='known-dot no'></span>错题" : "<span class='known-dot none'></span>未学";
      return "<tr><td>" + mark + "</td><td><span class='en'>" + s(w.w) + "</span></td><td class='ipa'>" + s(w.f || "") + "</td><td><span class='pos'>" + s(w.p || "") + "</span></td><td>" + s(w.m) + "</td></tr>";
    }).join("") || "<tr><td colspan='5' style='text-align:center;padding:24px'>无匹配结果</td></tr>";
    var pages = Math.max(1, Math.ceil(d.total / listState.per));
    var pager = document.getElementById("lPager");
    pager.innerHTML = "";
    var mk = function (label, page, on) {
      var b = document.createElement("button");
      b.textContent = label; if (on) b.classList.add("on");
      b.disabled = page === listState.page;
      b.onclick = function () { listState.page = page; fetchList(); };
      return b;
    };
    pager.appendChild(mk("‹", Math.max(0, listState.page - 1)));
    for (var i = 0; i < pages; i++) { if (pages > 13 && i > 2 && i < pages - 3 && Math.abs(i - listState.page) > 2) continue; pager.appendChild(mk(String(i + 1), i, i === listState.page)); }
    pager.appendChild(mk("›", Math.min(pages - 1, listState.page + 1)));
  }

  /* ============ 短语库 ============ */
  var phState = { q: "", page: 0, per: 60, core: false };
  async function renderPhrase(box) {
    box.innerHTML =
      '<div class="toolbar"><input type="text" id="pSearch" placeholder="🔍 搜搭配 / 中文（回车）" style="max-width:280px">' +
      '<button class="btn btn-primary btn-sm" id="pGo">搜索</button>' +
      '<label style="display:flex;gap:6px;align-items:center;font-size:13.5px;cursor:pointer"><input type="checkbox" id="pCore" style="accent-color:#4f46e5;width:auto"> 只看博浩核心搭配</label>' +
      '<span class="tag" id="pTotal"></span></div>' +
      '<div class="table-wrap" style="margin-top:14px"><table><thead><tr><th style="width:60px">#</th><th>搭配 / 短语</th><th>含义</th><th style="width:80px">来源</th></tr></thead><tbody id="pBody"></tbody></table></div>' +
      '<div class="pager" id="pPager"></div>';
    document.getElementById("pSearch").onkeydown = function (e) { if (e.key === "Enter") { phState.q = this.value.trim(); phState.page = 0; fetchPh(); } };
    document.getElementById("pGo").onclick = function () { phState.q = document.getElementById("pSearch").value.trim(); phState.page = 0; fetchPh(); };
    document.getElementById("pCore").checked = phState.core;
    document.getElementById("pCore").onchange = function () { phState.core = this.checked; phState.page = 0; fetchPh(); };
    await fetchPh();
  }
  async function fetchPh() {
    var url = "/api/phrases?offset=" + (phState.page * phState.per) + "&limit=" + phState.per;
    if (phState.q) url += "&q=" + encodeURIComponent(phState.q);
    if (phState.core) url += "&core=1";
    var d = await BH.api(url);
    document.getElementById("pTotal").textContent = "共 " + d.total + " 条";
    document.getElementById("pBody").innerHTML = d.rows.map(function (p, i) {
      return "<tr><td>" + (phState.page * phState.per + i + 1) + "</td><td><span class='en'>" + s(p.en) + "</span></td><td>" + s(p.zh || "") + "</td><td>" + (p.core ? "<span class='tag' style='background:rgba(245,158,11,.12);color:#c77906;border-color:rgba(245,158,11,.3)'>核心</span>" : "<span class='tag'>大纲</span>") + "</td></tr>";
    }).join("") || "<tr><td colspan='4' style='text-align:center;padding:24px'>无匹配结果</td></tr>";
    var pages = Math.max(1, Math.ceil(d.total / phState.per));
    var pager = document.getElementById("pPager");
    pager.innerHTML = "";
    for (var i = 0; i < pages; i++) {
      var b = document.createElement("button");
      b.textContent = i + 1; if (i === phState.page) b.classList.add("on");
      b.disabled = i === phState.page;
      b.onclick = (function (pg) { return function () { phState.page = pg; fetchPh(); }; })(i);
      pager.appendChild(b);
    }
  }

  /* ============ 记忆曲线复习 ============ */
  async function renderReview(box) {
    var data;
    try { data = await BH.authed("/api/me/reviews"); }
    catch (e) { box.innerHTML = "<div class='empty-hint'>复习数据加载失败：" + s(e.message) + "</div>"; return; }
    var due = (data && data.dueWords) || [];
    var total = data ? data.total : 0;
    box.innerHTML =
      '<div class="panel" style="max-width:760px;margin:0 auto 16px">' +
        '<div class="sec-head left" style="margin-bottom:8px"><span class="eyebrow">Ebbinghaus Review</span><h3 style="margin:0">🧠 记忆曲线 · 今日复习</h3>' +
        '<p class="muted" style="font-size:13px;margin:8px 0 0">今日待复习 <b>' + due.length + '</b> 词，已纳入记忆曲线共 ' + total + ' 词。如实点“认识 / 忘了”，系统按 1·2·4·7·15·30 天自动排期。</p></div>' +
        '<div id="rvZone">' + (due.length ? '<div class="empty-hint"><span class="spin"></span> 准备复习卡片…</div>' : '<div class="empty-note">🎉 今日复习已清空！去「背词」把新词标记为“已掌握”，它们会自动加入记忆曲线复习计划。</div><div class="btn-row" style="justify-content:center"><a class="btn btn-soft btn-sm" href="#/me">查看个人记忆曲线 📊</a></div>') + '</div>' +
      '</div>';
    if (!due.length) return;
    var details = {};
    try {
      var ws = due.map(function (d) { return d.w; });
      var dd = await BH.api("/api/words/lookup?w=" + encodeURIComponent(ws.join(",")));
      (dd.rows || []).forEach(function (w) { details[w.w.toLowerCase()] = w; });
    } catch (e) {}
    var queue = due.map(function (d) { return { d: d, w: details[d.w.toLowerCase()] || { w: d.w, m: "（未找到词条，仍可复习）", f: "", p: "" } }; });
    var qi = 0;
    function draw() {
      var zone = document.getElementById("rvZone");
      if (!zone) return;
      if (qi >= queue.length) {
        zone.innerHTML = "<div style='text-align:center;padding:22px 0'><div style='font-size:46px'>🎉</div><h3>今日复习完成！</h3><p class='muted'>刚刚又巩固了 " + queue.length + " 个词，复习曲线已为你安排下一轮。</p><div class='btn-row' style='justify-content:center'><a class='btn btn-primary' href='#/vocab'>去背新词 →</a><a class='btn btn-soft' href='#/me'>个人中心 📊</a></div></div>";
        refreshProgress();
        return;
      }
      var it = queue[qi], w = it.w, d = it.d;
      var iv = [1, 2, 4, 7, 15, 30][Math.min(5, d.stage || 0)] || 1;
      var stageTxt = "下次复习：+" + iv + " 天";
      zone.innerHTML =
        '<div class="flash-zone" style="margin-top:8px">' +
          '<div class="flash-card" id="rvCard"><div class="fc-inner">' +
            '<div class="fc-face fc-front"><span class="fc-tag tag">' + stageTxt + '</span><div class="fc-word" id="rvWord"></div><div class="fc-ipa" id="rvIpa"></div><div class="fc-hint">👆 点击卡片查看释义</div></div>' +
            '<div class="fc-face fc-back"><div class="fc-meaning" id="rvMeaning"></div><div class="fc-pos" id="rvPos"></div></div>' +
          '</div></div>' +
          '<div class="btn-row" style="justify-content:center;margin-top:18px">' +
            '<button class="btn btn-danger" id="rvBad">✗ 忘了</button>' +
            '<button class="btn btn-primary" id="rvGood">✓ 认识</button>' +
          '</div>' +
          '<div class="session-meta" style="justify-content:center"><span>复习进度 ' + (qi + 1) + ' / ' + queue.length + '</span></div>' +
        '</div>';
      document.getElementById("rvWord").textContent = w.w;
      document.getElementById("rvIpa").textContent = w.f || "";
      document.getElementById("rvMeaning").textContent = w.m;
      document.getElementById("rvPos").textContent = (w.p || "") + " · " + w.w;
      var card = document.getElementById("rvCard");
      card.onclick = function () { card.classList.toggle("flipped"); };
      document.getElementById("rvGood").onclick = function () { submit(true); };
      document.getElementById("rvBad").onclick = function () { submit(false); };
      async function submit(good) {
        try {
          await BH.authed("/api/me/reviews/answer", { method: "POST", body: { word: w.w, good: good } });
          if (good) await markKnown(w.w, true); else await markWrong(w.w, true);
        } catch (e) { BH.toast((BH.STATIC ? "保存失败" : "同步失败") + "：" + e.message); }
        qi++; draw();
      }
    }
    draw();
  }

  /* ---------- 清理 & 首屏 ---------- */
  await renderBody();
  refreshProgress();
  if (params && params.mode === "review") {
    var segBtn = document.querySelector('#vSeg button[data-mode="review"]');
    if (segBtn) { state.mode = "review"; segBtn.click(); }
  }
});