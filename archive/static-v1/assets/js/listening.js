/* ============ 博浩英语 CET-6 · 听力模块脚本 ============ */
(function () {
  "use strict";

  var PASSAGES = [
    {
      type: "📰 短篇新闻 News Report",
      title: "Biodegradable Plastic Made from Food Waste",
      text: "Researchers at Greenfield University have developed a new type of biodegradable plastic made from food waste. The team says the material breaks down naturally within a few months, instead of hundreds of years like traditional plastics. In their experiments, the new plastic was used to make food packaging and disposable cups. The researchers hope the invention will help reduce plastic pollution in oceans, where millions of tons of waste accumulate every year. However, they admit that the material is still more expensive to produce than ordinary plastic, and mass production may not begin for another five years. Environmental groups have welcomed the news but urge governments to invest more in recycling systems as well.",
      qs: [
        { q: "What is the main advantage of the new plastic?", opts: ["It is much cheaper than traditional plastic.", "It can break down naturally in a short time.", "It can be recycled into new food.", "It is stronger than ordinary plastic."], ans: 1, ex: "原文说它“breaks down naturally within a few months”，即几个月内自然降解，而传统塑料需要数百年。" },
        { q: "According to the report, what problem does the invention aim to solve?", opts: ["The shortage of food in universities.", "The high cost of packaging.", "Plastic pollution in oceans.", "The decline of the plastic industry."], ans: 2, ex: "原文提到“help reduce plastic pollution in oceans”，目的是减少海洋塑料污染。" },
        { q: "What do the researchers admit about the new plastic?", opts: ["It is difficult to produce.", "It is not safe for food.", "It is still expensive to make.", "It takes hundreds of years to degrade."], ans: 2, ex: "研究员承认“still more expensive to produce than ordinary plastic”，成本仍是问题。" }
      ]
    },
    {
      type: "🎓 讲座 / 讲话 Lecture",
      title: "Sleep and Memory",
      text: "Good morning, everyone. Today I would like to talk about the relationship between sleep and memory. For a long time, scientists believed that memory was formed while we were awake. Recent research, however, shows that sleep plays an equally important role. During deep sleep, the brain reviews the information we learned during the day and transfers it from short-term to long-term storage. In one experiment, students who napped for forty minutes after studying remembered twenty percent more than those who stayed awake. Interestingly, the quality of sleep matters more than its length. Researchers therefore suggest that students avoid staying up late before an exam, because a single night of poor sleep can reduce the ability to recall what they have learned. To sum up, if you want to remember more, do not sacrifice your sleep.",
      qs: [
        { q: "What did scientists used to believe about memory?", opts: ["Memory is formed mainly during deep sleep.", "Memory is formed while people are awake.", "Sleep has little to do with memory.", "Napping improves long-term memory."], ans: 1, ex: "原文“scientists believed that memory was formed while we were awake”，过去认为清醒时形成记忆。" },
        { q: "What did the experiment with students show?", opts: ["Napping for 40 minutes helped students remember more.", "Staying awake improved memory by 20 percent.", "Students should sleep longer before exams.", "Short naps reduced learning efficiency."], ans: 0, ex: "小睡40分钟的学生比清醒者多记住20%，说明小睡有助于记忆。" },
        { q: "What does the speaker suggest at the end?", opts: ["Students should take a nap during exams.", "Sleep quality matters more than sleep length.", "Students should not stay up late before an exam.", "Both B and C."], ans: 3, ex: "演讲者既说睡眠质量比时长重要，也建议考前不要熬夜，因此 B 与 C 都对，选 D（Both B and C）。" }
      ]
    }
  ];

  var sel = document.getElementById("psgSel");
  var rateSel = document.getElementById("rateSel");
  var idx = 0, rate = 0.85, sentIdx = 0;
  var scriptBox = document.getElementById("scriptBox");
  var nowBox = document.getElementById("nowPlaying");
  var nowTxt = document.getElementById("nowTxt");

  /* ---------- 填充语料选项 ---------- */
  PASSAGES.forEach(function (p, i) {
    var o = document.createElement("option");
    o.value = i; o.textContent = p.title;
    sel.appendChild(o);
  });
  function showPassage() {
    idx = parseInt(sel.value, 10);
    var p = PASSAGES[idx];
    document.getElementById("psgTitle").textContent = p.title;
    document.getElementById("listenTypeTag").textContent = "类型：" + p.type;
    scriptBox.innerHTML = "<p>" + p.text.replace(/\n/g, "</p><p>") + "</p>";
    stopSpeech();
    resetQuiz();
  }
  sel.addEventListener("change", showPassage);
  rateSel.addEventListener("change", function () { rate = parseFloat(rateSel.value); });

  /* ---------- 播放控制 ---------- */
  function stopSpeech() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    nowBox.style.display = "none";
    clearInterval(window._sentTimer);
  }
  document.getElementById("stopPlay").addEventListener("click", stopSpeech);

  function pickVoice() {
    if (!("speechSynthesis" in window)) return null;
    var voices = speechSynthesis.getVoices();
    return voices.filter(function (v) { return /en[-_]US/i.test(v.lang); })[0]
        || voices.filter(function (v) { return /^en/i.test(v.lang); })[0] || null;
  }
  function utter(text, onEnd) {
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    var v = pickVoice(); if (v) u.voice = v;
    u.rate = rate;
    if (onEnd) u.onend = onEnd;
    return u;
  }
  function setNow(t) { nowTxt.textContent = t; nowBox.style.display = "block"; }

  document.getElementById("playAll").addEventListener("click", function () {
    if (!("speechSynthesis" in window)) { showToast("当前浏览器不支持语音合成 😢 建议使用 Chrome / Edge"); return; }
    stopSpeech();
    var p = PASSAGES[idx];
    setNow("整段播放中…");
    speechSynthesis.speak(utter(p.text));
  });

  document.getElementById("playSent").addEventListener("click", function () {
    if (!("speechSynthesis" in window)) { showToast("当前浏览器不支持语音合成 😢 建议使用 Chrome / Edge"); return; }
    stopSpeech();
    var sents = PASSAGES[idx].text.split(/(?<=[.!?])\s+/);
    sentIdx = 0;
    function playNext() {
      if (sentIdx >= sents.length) { nowBox.style.display = "none"; return; }
      setNow("第 " + (sentIdx + 1) + " / " + sents.length + " 句：" + sents[sentIdx]);
      speechSynthesis.speak(utter(sents[sentIdx], function () {
        sentIdx++;
        window._sentTimer = setTimeout(playNext, 350);
      }));
    }
    playNext();
  });

  document.getElementById("toggleScript").addEventListener("click", function () {
    var show = scriptBox.style.display === "none";
    scriptBox.style.display = show ? "block" : "none";
    showToast(show ? "已显示原文 📄" : "已隐藏原文（继续精听！）👂");
  });

  /* ---------- 理解自测 ---------- */
  var quiz = { qs: [], qi: 0, right: 0 };
  function resetQuiz() {
    quiz = { qs: [], qi: 0, right: 0 };
    var qp = document.getElementById("quizPanel");
    qp.style.display = "none";
    document.getElementById("quizZone").innerHTML = "";
  }
  function shuffleArr(a) { var b = a.slice(); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
  document.getElementById("gotoQuiz").addEventListener("click", function () {
    quiz.qs = shuffleArr(PASSAGES[idx].qs.map(function (q, i) { return { q: q, orig: i }; }));
    quiz.qi = 0; quiz.right = 0;
    var qp = document.getElementById("quizPanel");
    qp.style.display = "block";
    qp.scrollIntoView({ behavior: "smooth", block: "center" });
    renderQuizQ();
  });
  function renderQuizQ() {
    var zone = document.getElementById("quizZone");
    var cur = quiz.qs[quiz.qi];
    var letters = ["A", "B", "C", "D"];
    var html = "<div class='q-item' style='margin-top:0'><div class='q-title'>第 " + (quiz.qi + 1) + " / " + quiz.qs.length + " 题：" + cur.q.q + "</div>" +
      "<div class='opts'>";
    cur.q.opts.forEach(function (o, i) {
      html += "<button class='opt' data-i='" + i + "'><span class='ltr'>" + letters[i] + ".</span><span>" + o + "</span></button>";
    });
    html += "</div><div class='explain' id='qEx'></div></div>";
    html += "<div style='text-align:center;margin-top:16px'><button class='btn btn-primary' id='quizNextQ' style='display:none'>下一题 →</button></div>";
    zone.innerHTML = html;
    zone.querySelectorAll(".opt").forEach(function (b) {
      b.addEventListener("click", function () { answerQuizQ(b); });
    });
    var nb = document.getElementById("quizNextQ");
    nb.addEventListener("click", function () {
      quiz.qi++;
      if (quiz.qi < quiz.qs.length) renderQuizQ();
      else renderQuizDone();
    });
  }
  function answerQuizQ(btn) {
    var cur = quiz.qs[quiz.qi];
    var chosen = parseInt(btn.getAttribute("data-i"), 10);
    var opts = document.querySelectorAll("#quizZone .opt");
    opts.forEach(function (b) { b.disabled = true; });
    if (chosen === cur.q.ans) { quiz.right++; btn.classList.add("ok"); }
    else { btn.classList.add("bad"); opts[cur.q.ans].classList.add("ok"); }
    var ex = document.getElementById("qEx");
    ex.textContent = (chosen === cur.q.ans ? "✅ 回答正确。" : "❌ 正确答案是 " + "ABCD".charAt(cur.q.ans) + "。") + cur.q.ex;
    ex.classList.add("show");
    document.getElementById("quizNextQ").style.display = "inline-flex";
  }
  function renderQuizDone() {
    var zone = document.getElementById("quizZone");
    var total = quiz.qs.length, pct = Math.round(quiz.right / total * 100);
    var emoji = pct === 100 ? "🏆" : pct >= 66 ? "🎉" : "💪";
    zone.innerHTML = "<div style='text-align:center;padding:18px 0'><div style='font-size:50px'>" + emoji + "</div>" +
      "<h3>" + (pct === 100 ? "满分！听力高手！" : pct >= 66 ? "不错，继续保持！" : "建议回听原文再测一次") + "</h3>" +
      "<p class='muted'>本轮得分 " + quiz.right + " / " + total + "（" + pct + "%）</p>" +
      "<button class='btn btn-primary' id='replayQuiz'>🔁 再测一次</button></div>";
    document.getElementById("replayQuiz").addEventListener("click", function () {
      quiz.qs = shuffleArr(PASSAGES[idx].qs.map(function (q, i) { return { q: q, orig: i }; }));
      quiz.qi = 0; quiz.right = 0; renderQuizQ();
    });
  }

  /* ---------- 初始化 ---------- */
  showPassage();
})();