/* ============ 博浩英语 CET-6 · 词汇模块脚本 ============ */
(function () {
  "use strict";
  var UNITS = typeof CET6_UNITS !== "undefined" ? CET6_UNITS : [];
  var PHRASES = typeof CET6_PHRASES !== "undefined" ? CET6_PHRASES : [];
  var KNOWN_KEY = "bh-known";
  function loadKnown() { try { return JSON.parse(localStorage.getItem(KNOWN_KEY)) || []; } catch (e) { return []; } }
  function saveKnown(list) { try { localStorage.setItem(KNOWN_KEY, JSON.stringify(list)); } catch (e) {} }
  var known = loadKnown();
  function isKnown(w) { return known.indexOf(w) > -1; }
  function addKnown(w) { if (!isKnown(w)) { known.push(w); saveKnown(known); } }

  var unitSel = document.getElementById("unitSel");
  var ui = {
    card: document.getElementById("flashCard"),
    word: document.getElementById("fcWord"),
    ipa: document.getElementById("fcIpa"),
    meaning: document.getElementById("fcMeaning"),
    pos: document.getElementById("fcPos"),
    ex: document.getElementById("fcEx"),
    exCn: document.getElementById("fcExCn"),
    cardPos: document.getElementById("cardPos"),
    knownSummary: document.getElementById("knownSummary"),
    knownBar: document.getElementById("knownBar"),
    accordion: document.getElementById("wordAccordion"),
    phraseRows: document.getElementById("phraseRows")
  };

  /* ---------- 单元下拉 ---------- */
  var currentUnit = 0;
  function fillUnitOptions() {
    if (!unitSel) return;
    UNITS.forEach(function (u, i) {
      var o = document.createElement("option");
      o.value = i; o.textContent = u.name + "（" + u.words.length + " 词）";
      unitSel.appendChild(o);
    });
  }

  /* ---------- 背词卡片 ---------- */
  var order = [], idx = 0, shuffled = false;
  function resetOrder() {
    var ws = UNITS[currentUnit].words;
    order = ws.map(function (_, i) { return i; });
    if (shuffled) shuffle(order);
    idx = 0;
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } }
  function curWord() { return UNITS[currentUnit].words[order[idx]]; }
  function renderCard() {
    if (!ui.word) return;
    var w = curWord();
    ui.word.textContent = w.w;
    ui.ipa.textContent = w.f || "";
    ui.meaning.textContent = w.m;
    ui.pos.textContent = (w.p || "") + " · " + w.w;
    ui.ex.textContent = w.ex ? "“" + w.ex + "”" : "";
    ui.exCn.textContent = w.c || "";
    ui.card.classList.remove("flipped");
    ui.cardPos.textContent = (idx + 1) + " / " + order.length;
  }
  function goNext() { idx = (idx + 1) % order.length; renderCard(); }
  function goPrev() { idx = (idx - 1 + order.length) % order.length; renderCard(); }
  function mark(k) {
    if (k) addKnown(curWord().w);
    renderSummary();
    goNext();
  }

  if (ui.card) {
    ui.card.addEventListener("click", function () { ui.card.classList.toggle("flipped"); });
    document.getElementById("knownBtn").addEventListener("click", function () { mark(true); });
    document.getElementById("unknownBtn").addEventListener("click", function () { mark(false); });
    document.getElementById("nextBtn").addEventListener("click", goNext);
    document.getElementById("prevBtn").addEventListener("click", goPrev);
    document.getElementById("shuffleBtn").addEventListener("click", function () {
      shuffled = !shuffled;
      resetOrder(); renderCard();
      showToast(shuffled ? "已开启随机顺序 🔀" : "已恢复顺序背诵 ↩️");
    });
    document.getElementById("speakWord").addEventListener("click", function () { speak(curWord().w); });
    document.addEventListener("keydown", function (e) {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      if (e.key === " ") { e.preventDefault(); ui.card.classList.toggle("flipped"); }
    });
  }

  /* ---------- 朗读 ---------- */
  function speak(text) {
    if (!("speechSynthesis" in window)) { showToast("当前浏览器不支持语音朗读 😢"); return; }
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    var voices = speechSynthesis.getVoices();
    var v = voices.filter(function (x) { return /en[-_]US/i.test(x.lang); })[0] || voices.filter(function (x) { return /^en/i.test(x.lang); })[0];
    if (v) u.voice = v;
    u.rate = 0.85;
    speechSynthesis.speak(u);
  }
  if ("speechSynthesis" in window) speechSynthesis.onvoiceschanged = function () {};

  /* ---------- 进度 ---------- */
  var totalWords = UNITS.reduce(function (s, u) { return s + u.words.length; }, 0);
  function renderSummary() {
    var knownInUnit = UNITS[currentUnit].words.filter(function (w) { return isKnown(w.w); }).length;
    if (ui.knownSummary) ui.knownSummary.textContent = "全部词库已掌握 " + known.length + " / " + totalWords + " 词 · 本单元 " + knownInUnit + " / " + UNITS[currentUnit].words.length + " 词";
    if (ui.knownBar) ui.knownBar.style.width = (totalWords ? (known.length / totalWords * 100) : 0) + "%";
  }

  /* ---------- 词表 ---------- */
  function renderAccordion() {
    if (!ui.accordion) return;
    ui.accordion.innerHTML = "";
    UNITS.forEach(function (u, uiIdx) {
      var d = document.createElement("details");
      d.className = "acc reveal";
      var kn = u.words.filter(function (w) { return isKnown(w.w); }).length;
      var sum = document.createElement("summary");
      sum.innerHTML = "<span>" + u.name + "</span><span class='tag' style='margin-left:10px'>已掌握 " + kn + "/" + u.words.length + "</span><span class='chev'>▾</span>";
      d.appendChild(sum);
      var body = document.createElement("div");
      body.className = "acc-body";
      var wrap = document.createElement("div");
      wrap.className = "table-wrap";
      var html = "<table><thead><tr><th style='width:70px'>掌握</th><th>单词</th><th>音标</th><th>词性</th><th>释义</th><th>例句</th></tr></thead><tbody>";
      u.words.forEach(function (w) {
        var k = isKnown(w.w);
        html += "<tr><td><span class='known-dot " + (k ? "yes" : "no") + "'></span>" + (k ? "已掌握" : "未掌握") + "</td>" +
                "<td><span class='en'>" + w.w + "</span></td><td class='ipa'>" + (w.f || "") + "</td>" +
                "<td><span class='pos'>" + (w.p || "") + "</span></td><td>" + w.m + "</td>" +
                "<td style='font-size:13px;color:var(--muted)'>" + (w.ex || "") + "</td></tr>";
      });
      html += "</tbody></table>";
      wrap.innerHTML = html;
      body.appendChild(wrap);
      d.appendChild(body);
      ui.accordion.appendChild(d);
    });
  }

  function renderPhrases() {
    if (!ui.phraseRows) return;
    ui.phraseRows.innerHTML = PHRASES.map(function (p, i) {
      return "<tr><td>" + (i + 1) + "</td><td><span class='en'>" + p[0] + "</span></td><td>" + p[1] + "</td></tr>";
    }).join("");
  }

  /* ---------- 自测 ---------- */
  var quiz = {
    questions: [], qi: 0, correct: 0, wrong: [], active: false
  };
  function shuffleArr(a) { var b = a.slice(); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
  function startQuiz(onlyWrong) {
    var pool = onlyWrong && quiz.wrong.length ? quiz.wrong : UNITS[currentUnit].words;
    if (pool.length < 4) pool = UNITS.reduce(function (s, u) { return s.concat(u.words); }, []);
    if (pool.length < 4) { showToast("词库不足，无法出题 😢"); return; }
    var chosen = shuffleArr(pool).slice(0, Math.min(10, pool.length));
    quiz.questions = chosen.map(function (w) {
      var distractors = shuffleArr(pool.filter(function (x) { return x.w !== w.w; })).slice(0, 3).map(function (x) { return x.m; });
      var opts = shuffleArr([w.m].concat(distractors));
      return { word: w, opts: opts, ans: w.m };
    });
    quiz.qi = 0; quiz.correct = 0; quiz.wrong = [];
    if (onlyWrong) quiz.wrong = [];
    quiz.active = true;
    document.getElementById("quizReady").style.display = "none";
    document.getElementById("quizDone").style.display = "none";
    document.getElementById("quizBody").style.display = "block";
    renderQuestion();
  }
  function renderQuestion() {
    var q = quiz.questions[quiz.qi];
    document.getElementById("quizWord").textContent = q.word.w;
    document.getElementById("quizIpa").textContent = (q.word.f || "") + "  ·  " + (q.word.p || "");
    document.getElementById("quizProgressTxt").textContent = "第 " + (quiz.qi + 1) + " / " + quiz.questions.length + " 题";
    document.getElementById("quizBar").style.width = ((quiz.qi + 1) / quiz.questions.length * 100) + "%";
    var box = document.getElementById("quizOpts");
    box.innerHTML = "";
    var letters = ["A", "B", "C", "D"];
    q.opts.forEach(function (o, i) {
      var b = document.createElement("button");
      b.className = "quiz-opt";
      b.setAttribute("data-key", String(i + 1));
      b.innerHTML = "<span class='key'>" + letters[i] + "</span><span>" + o + "</span>";
      b.addEventListener("click", function () { answer(i); });
      box.appendChild(b);
    });
    document.getElementById("quizNext").style.display = "none";
  }
  function answer(i) {
    var q = quiz.questions[quiz.qi];
    var box = document.getElementById("quizOpts");
    var btns = box.querySelectorAll(".quiz-opt");
    Array.prototype.forEach.call(btns, function (b) { b.disabled = true; });
    var ok = q.opts[i] === q.ans;
    if (ok) { quiz.correct++; btns[i].classList.add("correct"); }
    else {
      btns[i].classList.add("wrong");
      quiz.wrong.push(q.word);
      Array.prototype.forEach.call(btns, function (b, bi) { if (q.opts[bi] === q.ans) b.classList.add("correct"); });
    }
    document.getElementById("quizNext").style.display = "inline-flex";
  }
  function finishQuiz() {
    quiz.active = false;
    document.getElementById("quizBody").style.display = "none";
    var total = quiz.questions.length, right = quiz.correct, pct = Math.round(right / total * 100);
    var emoji = pct >= 90 ? "🏆" : pct >= 70 ? "🎉" : pct >= 50 ? "💪" : "📚";
    document.getElementById("doneEmoji").textContent = emoji;
    document.getElementById("doneTitle").textContent = pct >= 90 ? "大神级别！" : pct >= 70 ? "掌握得不错！" : pct >= 50 ? "继续加油！" : "建议先翻卡再测";
    document.getElementById("doneMsg").textContent = "本单元得分 " + right + " / " + total + "（" + pct + "%），错误 " + quiz.wrong.length + " 词。";
    document.getElementById("quizDone").style.display = "block";
    document.getElementById("retryWrong").style.display = quiz.wrong.length ? "inline-flex" : "none";
  }
  var nextBtn = document.getElementById("quizNext");
  if (nextBtn) nextBtn.addEventListener("click", function () {
    quiz.qi++;
    if (quiz.qi < quiz.questions.length) renderQuestion();
    else finishQuiz();
  });
  var startBtn = document.getElementById("startQuiz");
  if (startBtn) startBtn.addEventListener("click", function () { startQuiz(false); });
  var againBtn = document.getElementById("quizAgain");
  if (againBtn) againBtn.addEventListener("click", function () { startQuiz(false); });
  var retryBtn = document.getElementById("retryWrong");
  if (retryBtn) retryBtn.addEventListener("click", function () { startQuiz(true); });

  /* ---------- 重置 ---------- */
  var resetBtn = document.getElementById("resetKnown");
  if (resetBtn) resetBtn.addEventListener("click", function () {
    if (confirm("确定要清空全部“已掌握”记录吗？")) {
      known = []; saveKnown(known);
      renderSummary(); renderAccordion();
      showToast("学习进度已重置 ↺");
    }
  });

  /* ---------- 事件绑定 & 初始化 ---------- */
  if (unitSel) {
    unitSel.addEventListener("change", function () { currentUnit = parseInt(unitSel.value, 10); resetOrder(); renderCard(); renderSummary(); });
  }
  fillUnitOptions();
  resetOrder();
  renderCard();
  renderSummary();
  renderAccordion();
  renderPhrases();

  /* 预加载语音列表 */
  if ("speechSynthesis" in window) { speechSynthesis.getVoices(); }
})();