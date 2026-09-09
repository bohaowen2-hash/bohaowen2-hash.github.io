/* 博浩英语 CET-6 · 词汇模块（海量词库 / 翻卡 / 自测 / 错题 / 词表 / 短语） */
"use strict";
BH.reg("vocab", async function (view) {
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
    catch (e) { BH.toast("云同步失败：" + e.message); }
  }
  async function markWrong(w, val) {
    w = String(w).toLowerCase();
    if (val) state.wrong[w] = true; else delete state.wrong[w];
    try {
      if (val) await BH.authed("/api/me/wrong", { method: "POST", body: { word: w } });
      else await BH.authed("/api/me/wrong/" + encodeURIComponent(w), { method: "DELETE" });
    } catch (e) { BH.toast("云同步失败：" + e.message); }
  }

  /* ---------- 数据 ---------- */
  var unitsData = await BH.api("/api/units");
  state.units = unitsData;
  state.unit = unitsData.length ? unitsData[0].id : "";
  await loadMyState();

  var unitSelHtml = "<select id='vUnit'>" + unitsData.map(function (u) { return "<option value='" + u.id + "'>" + s(u.name) + "</option>"; }).join("") + "</select>";

  function sessionPools() {
    // 依据当前单元构造当前 pool 的单词数组（本单元全部）
    return null; // 通过 API 拉取
  }

  view.innerHTML =
    '<section class="section tight" style="padding-top:46px"><div class="container">' +
      '<div class="sec-head left"><span class="badge">📖 词汇模块 · 文博浩 创立</span>' +
      '<h2>核心词汇 · 翻卡闯关</h2>' +
      '<p>词库已扩容至 <b>' + (BH.site ? BH.site.counts.words : "") + '+</b> 大纲核心词与 <b>' + (BH.site ? BH.site.counts.phrases : "") + '+</b> 搭配。翻卡记忆 → 自测巩固 → 错题重练，学习进度自动云端同步。</p></div>' +
      '<div class="toolbar">' +
        '<div class="seg" id="vSeg">' +
          '<button data-mode="card" class="on">🎴 背词</button>' +
          '<button data-mode="quiz">📝 自测</button>' +
          '<button data-mode="list">📋 词表</button>' +
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
    if (!confirm("确定清空该浏览器账号的全部“已掌握”记录吗？（云端同步清除）")) return;
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
    else if (state.mode === "list") await renderList(inner);
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
          '<div class="fc-face fc-front"><span class="fc-tag tag" id="cState">未学</span><div class="fc-word" id="fcWord">…</div><div class="fc-ipa" id="fcIpa"></div><div class="fc-hint">👆 点击卡片查看释义</div></div>' +
          '<div class="fc-face fc-back"><div class="fc-meaning" id="fcMeaning"></div><div class="fc-pos" id="fcPos2"></div><div class="fc-ex" id="fcEx"></div><div class="fc-cn" id="fcCn"></div></div>' +
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
    sel.onchange = function () { state.unit = sel.value; startDeck(false); };
    deckWords = await loadDeck();
    state.deck = deckWords; state.idx = 0; state.shuffled = false;
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
    document.getElementById("cPos").textContent = (state.idx + 1) + " / " + state.deck.length + " 词";
    document.getElementById("cOrder").textContent = state.shuffled ? "🔀 乱序中" : "↩️ 按单元顺序";
  }
  async function decide(known) {
    var w = cur().w;
    if (known) await markKnown(w, true); else await markWrong(w, true);
    refreshProgress();
    showCard();
    nav(1);
  }
  function speak(text) {
    if (!("speechSynthesis" in window)) { BH.toast("当前浏览器不支持语音朗读"); return; }
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text); u.lang = "en-US"; u.rate = .85;
    var vs = speechSynthesis.getVoices();
    var v = vs.filter(function (x) { return /en[-_]US/i.test(x.lang); })[0] || vs.filter(function (x) { return /^en/i.test(x.lang); })[0];
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }

  /* ============ 自测 ============ */
  async function renderQuiz(box) {
    box.innerHTML =
      '<div class="toolbar">' + unitSelHtml +
      '<button class="btn btn-ghost btn-sm" id="qOnlyWrong">❌ 只测错题</button>' +
      '<button class="btn btn-primary btn-sm" id="qStart">🚀 开始 10 题</button></div>' +
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
    var pool;
    if (onlyWrong) {
      var wrongList = Object.keys(state.wrong);
      if (!wrongList.length) { BH.toast("错题本是空的，先去自测吧 😉"); return; }
      pool = (await BH.api("/api/words/random", { method: "POST", body: { size: 80, unit: unit, onlyWrong: true, wrong: wrongList } })).rows;
    } else {
      pool = (await BH.api("/api/words/random", { method: "POST", body: { size: 80, unit: unit, exclude: Object.keys(state.known) } })).rows;
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
    document.getElementById("qIpa").textContent = (q.w.f || "") + "  ·  " + (q.w.p || "");
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
    if (ok) { state.right++; btns[i].classList.add("correct"); }
    else {
      btns[i].classList.add("wrong");
      state.wrongThis.push(q.w);
      await markWrong(q.w.w, true);
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

  /* ---------- 清理 & 首屏 ---------- */
  await renderBody();
  refreshProgress();
});