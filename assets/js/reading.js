/* ============ 博浩英语 CET-6 · 阅读实战脚本 ============ */
(function () {
  "use strict";
  var QUESTIONS = [
    {
      q: "1. What does the author mean by calling the modern economy \u201can economy of attention\u201d?",
      opts: [
        "Companies mainly compete for consumers' limited time and mental focus.",
        "Attention is the only product that technology companies sell.",
        "Consumers are paying more money to protect their attention.",
        "Modern workers are more focused than those in the past."
      ],
      ans: 0,
      ex: "首段说公司不仅为金钱竞争，也为消费者有限的时间与注意力竞争，因此选 A（竞争消费者的时间与注意力）。"
    },
    {
      q: "2. What troubles researchers most according to Paragraph 2?",
      opts: [
        "People remember less when they listen to music.",
        "Users have lost control over where they direct their attention.",
        "Notifications are too difficult to design.",
        "Employees make more errors at work than students."
      ],
      ans: 1,
      ex: "第二段明确说“most troubling ... many users no longer decide for themselves when to pay attention; the device decides for them”，即用户失去了对注意力的自主控制。"
    },
    {
      q: "3. What is the author's suggestion about using technology?",
      opts: [
        "People should stop using smartphones completely.",
        "Governments should ban unnecessary notifications.",
        "People should use technology deliberately and cut unnecessary alerts.",
        "Reading books is the only way to restore attention."
      ],
      ans: 2,
      ex: "末段提出“digital minimalism”与“use it with intention”，即有意地减少应用与提醒、有目的地使用科技，故选 C。注意 A 是绝对化干扰项。"
    }
  ];

  var zone = document.getElementById("readingQuiz");
  if (!zone) return;
  var state = { qi: 0, right: 0 };
  var letters = ["A", "B", "C", "D"];

  function render() {
    var q = QUESTIONS[state.qi];
    var html = "<div class='q-item' style='margin-top:16px'><div class='q-title'>" + q.q + "</div><div class='opts'>";
    q.opts.forEach(function (o, i) {
      html += "<button class='opt' data-i='" + i + "'><span class='ltr'>" + letters[i] + ".</span><span>" + o + "</span></button>";
    });
    html += "</div><div class='explain' id='rdEx'></div></div>";
    html += "<div style='text-align:center;margin-top:16px'><button class='btn btn-primary' id='rdNext' style='display:none'>下一题 →</button></div>";
    zone.innerHTML = html;
    zone.querySelectorAll(".opt").forEach(function (b) {
      b.addEventListener("click", function () { answer(b); });
    });
    document.getElementById("rdNext").addEventListener("click", function () {
      state.qi++;
      if (state.qi < QUESTIONS.length) render();
      else renderDone();
    });
    document.getElementById("readingQuiz").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function answer(btn) {
    var q = QUESTIONS[state.qi];
    var chosen = parseInt(btn.getAttribute("data-i"), 10);
    var opts = zone.querySelectorAll(".opt");
    opts.forEach(function (b) { b.disabled = true; });
    if (chosen === q.ans) { state.right++; btn.classList.add("ok"); }
    else { btn.classList.add("bad"); opts[q.ans].classList.add("ok"); }
    var ex = document.getElementById("rdEx");
    ex.textContent = (chosen === q.ans ? "✅ 回答正确。" : "❌ 正确答案是 " + letters[q.ans] + "。") + q.ex;
    ex.classList.add("show");
    document.getElementById("rdNext").style.display = "inline-flex";
  }

  function renderDone() {
    var total = QUESTIONS.length, pct = Math.round(state.right / total * 100);
    zone.innerHTML = "<div class='panel' style='text-align:center;margin-top:18px'><div style='font-size:48px'>" + (pct === 100 ? "🏆" : pct >= 66 ? "🎉" : "📖") + "</div>" +
      "<h3>" + (pct === 100 ? "满分通过！" : pct >= 66 ? "掌握得不错！" : "回到原文再精读一遍吧") + "</h3>" +
      "<p class='muted'>精读实战得分：" + state.right + " / " + total + "（" + pct + "%）</p>" +
      "<button class='btn btn-primary' id='rdAgain'>🔁 重新挑战</button></div>";
    document.getElementById("rdAgain").addEventListener("click", function () {
      state.qi = 0; state.right = 0; render();
      window.scrollTo({ top: document.getElementById("readPassage").offsetTop - 90, behavior: "smooth" });
    });
  }

  render();
})();