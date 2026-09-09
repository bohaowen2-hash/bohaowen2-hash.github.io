/* 博浩英语 CET-6 · 首页 */
"use strict";
BH.reg("home", async function (view) {
  var site = BH.site || await BH.api("/api/site");
  var s = BH.esc;
  var brand = (site.brand && site.brand.name) || "博浩英语";
  var founder = (site.founder && site.founder.name) || "wbh";
  var hero = site.hero || {};
  var days = BH.daysUntil(site.examDate || "2026-12-19");
  var counts = site.counts || {};

  var randomRows = [];
  try { randomRows = (await BH.api("/api/words/random", { method: "POST", body: { size: 1 } })).rows || []; } catch (e) {}
  var wod = randomRows[0];
  var wodHtml = wod ? "<div class='fc-word'>" + s(wod.w) + "</div><div class='fc-ipa'>" + s(wod.f || "") + " &nbsp;·&nbsp; " + s(wod.p || "") + "</div><div style='font-size:17px;font-weight:800;margin-top:10px'>" + s(wod.m) + "</div>" : "";

  view.innerHTML =
  '<section class="hero">' +
    '<div class="container hero-grid">' +
      '<div>' +
        '<span class="badge"><span class="dot"></span>CET-6 · 免费公开学习平台</span>' +
        '<h1>' + (hero.title ? s(hero.title).replace(/，|,/g, "，<br>") : "") + '</h1>' +
        '<p class="lead">' + s(hero.sub || "") + '</p>' +
        '<div class="hero-cta">' +
          '<a class="btn btn-primary btn-lg" href="#/vocab">📖 开始背词</a>' +
          '<a class="btn btn-ghost btn-lg" href="#/exam">🗓️ 冲刺计划</a>' +
          '<a class="btn btn-soft btn-lg" href="#/me">📊 我的数据</a>' +
        '</div>' +
        '<div class="hero-meta">' +
          '<span class="badge gold">⏳ 距最近六级笔试还有 <b style="font-size:16px;color:inherit">' + days + '</b> 天</span>' +
          '<span class="badge green">☁️ 学习记录云端同步</span>' +
          '<span class="badge plain">🔧 后台内容管理</span><span class="badge plain">📲 可安装为 App</span>' +
        '</div>' +
      '</div>' +
      '<div class="hero-art">' +
        '<div class="hero-card floaty">' +
          '<div class="hc-head"><div style="font-size:32px">📌</div><div><div style="font-weight:800;font-size:15px">博浩每日一词 · Word of the Day</div><div class="muted" style="font-size:12px">Day by day, word by word</div></div></div>' +
          '<div style="text-align:center;padding:24px 6px 8px">' + wodHtml + '<a class="btn btn-soft btn-sm" style="margin-top:18px" href="#/vocab">去背今天的词 →</a></div>' +
        '</div>' +
        '<div class="hero-mini m1"><span class="mini-ico" style="background:linear-gradient(135deg,#f59e0b,#f97316)">🔥</span> ' + counts.words + '+ 核心词汇</div>' +
        '<div class="hero-mini m2"><span class="mini-ico" style="background:linear-gradient(135deg,#0ea5e9,#6366f1)">🎧</span> ' + counts.phrases + '+ 高频搭配</div>' +
        '<div class="mascot-bubble">🦉 小博喊你：今天也要元气满满地学英语鸭！</div>' +
      '</div>' +
    '</div>' +
  '</section>' +

  '<section class="section tight">' +
    '<div class="container stat-strip">' +
      '<div class="stat-box"><div class="num">' + (counts.words || 0) + '+</div><div class="lbl">大纲核心词汇</div></div>' +
      '<div class="stat-box"><div class="num">' + (counts.phrases || 0) + '+</div><div class="lbl">词组搭配库</div></div>' +
      '<div class="stat-box"><div class="num">' + (counts.content || 0) + '</div><div class="lbl">篇高阶备考素材</div></div>' +
      '<div class="stat-box"><div class="num">100<span style="font-size:.55em">%</span></div><div class="lbl">免费 · 公开 · 无套路</div></div>' +
    '</div>' +
  '</section>' +

  '<section class="section">' +
    '<div class="container">' +
      '<div class="sec-head"><span class="eyebrow">Learning Modules</span><h2>七大模块，一站搞定六级</h2><p>从输入到输出，覆盖六级全部题型：词汇闯关、听力精听、阅读实战、写作模板、翻译秘籍、科学备考与个人数据中心。</p></div>' +
      '<div class="grid g-3">' +
        mod("#/vocab","📖","核心词汇闯关",(counts.words||0)+" 词 + "+ (counts.phrases||0) +" 搭配 · 翻卡/自测/错题","进入词汇模块") +
        mod("#/listening","🎧","听力精听训练","变速逐句精听 + 新闻/讲座理解自测","进入听力模块") +
        mod("#/reading","📚","阅读实战拆解","真题风格篇章精读 + 长难句分层解析","进入阅读模块") +
        mod("#/writing","✍️","写作高分模板","四大体裁框架 + 万能句型库 + 范文精讲","进入写作模块") +
        mod("#/translation","🔄","翻译实战秘籍","六大技巧 + 主题词块 + 段落实战","进入翻译模块") +
        mod("#/exam","🗓️","科学备考中心","倒计时 · 计划生成 · 番茄钟 · 锦囊","进入备考模块") +
      '</div>' +
    '</div>' +
  '</section>' +

  '<section class="section" style="background:var(--grad-soft)">' +
    '<div class="container">' +
      '<div class="sec-head"><span class="eyebrow">Dashboard</span><h2>学得明白，进步看得见</h2><p>每一次打卡、每一场自测、每一个错词都自动同步到云端，生成属于你的学习数据面板。</p></div>' +
      '<div class="grid g-4">' +
        '<div class="mini-card"><div style="font-size:28px">✅</div><h4>每日打卡</h4><p class="muted" style="font-size:13px">坚持即胜利，连续打卡自动记录，火苗不断。</p></div>' +
        '<div class="mini-card"><div style="font-size:28px">📊</div><h4>数据看板</h4><p class="muted" style="font-size:13px">掌握词数、自测正确率、学习时长一目了然。</p></div>' +
        '<div class="mini-card"><div style="font-size:28px">❌</div><h4>错题本</h4><p class="muted" style="font-size:13px">答错的词自动收进错题本，一键复习。</p></div>' +
        '<div class="mini-card"><div style="font-size:28px">☁️</div><h4>云端同步</h4><p class="muted" style="font-size:13px">注册账号后，换设备也能接着学。</p></div>' +
      '</div>' +
    '</div>' +
  '</section>' ;

  function mod(href, ico, title, desc, go) {
    return '<a class="card clickable" href="' + href + '"><div class="ico">' + ico + '</div><h3>' + title + '</h3><p>' + s(desc) + '</p><span class="go">' + go + ' →</span></a>';
  }
});