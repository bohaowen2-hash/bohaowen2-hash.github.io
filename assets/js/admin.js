/* 博浩英语 CET-6 · 后台管理 */
"use strict";
BH.reg("admin", async function (view) {
  var s = BH.esc;
  var CATS = ["reading", "listening", "longSentence", "writingTemplate", "sentenceBank", "essay", "translationTip", "themeWords", "translationExercise", "examTips"];
  var CAT_CN = { reading: "📚 阅读篇章", listening: "🎧 听力语料", longSentence: "🧩 长难句", writingTemplate: "✍️ 写作模板", sentenceBank: "💬 万能句型", essay: "📝 范文", translationTip: "🔄 翻译技巧", themeWords: "🏷️ 主题词块", translationExercise: "✏️ 翻译练习", examTips: "💡 冲刺锦囊" };
  var FIELD_HINT = {
    reading: '{"passage":"正文（空行分段）","qs":[{"q":"题干","opts":["A","B","C","D"],"ans":0,"ex":"解析"}]}',
    listening: '{"type":"news|lecture","text":"正文","qs":[{"q":"题干","opts":["A","B","C","D"],"ans":0,"ex":"解析"}]}',
    longSentence: '{"en":"英文原句","zh":"译文","points":["拆解点1","拆解点2"]}',
    writingTemplate: '{"genre":"体裁","structure":["步骤1"],"skeleton":"模板正文","tips":["提示1"]}',
    sentenceBank: '{"cat":"开头引入|阐述观点|论证举例|让步转折|结尾建议|图表描述|书信应用","en":"英文句","zh":"中文译"}',
    essay: '{"topic":"题目","paras":["段落1","段落2"],"comments":["点评1"]}',
    translationTip: '{"points":["要点"],"examples":[{"cn":"中文","en":"英文","note":"说明"}]}',
    themeWords: '{"group":"分组","words":[{"en":"英文","zh":"中文"}]}',
    translationExercise: '{"cn":"中文原文","ref":"参考译文","tips":"点拨"}',
    examTips: '{"body":["要点1","要点2"]}'
  };

  var isAdmin = BH.user && BH.user.role === "admin";
  var tab = "overview";

  function shell(inner) {
    view.innerHTML =
      '<section class="section tight" style="padding-top:42px"><div class="container">' +
        '<div class="sec-head left"><span class="badge red">⚙️ 后台管理 · 仅站长可用</span>' +
        '<h2>博浩英语内容管理系统</h2><p>无需修改代码：词库、短语、素材、文案、公告全部在此维护，保存即时生效。</p></div>' +
        '<div class="admin-shell">' +
          '<div class="admin-side" id="admSide">' +
            sideBtn("overview", "📊 总览") + sideBtn("settings", "⚙️ 站点文案") + sideBtn("words", "📖 词库管理") + sideBtn("phrases", "🔗 短语管理") + sideBtn("content", "🧩 素材管理") + sideBtn("users", "👥 用户总览") +
          '</div>' +
          '<div class="admin-main" id="admMain">' + inner + '</div>' +
        '</div>' +
      '</div></section>';
    document.querySelectorAll("#admSide button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-tab") === tab);
      b.onclick = function () { tab = b.getAttribute("data-tab"); loadTab(); };
    });
  }
  function sideBtn(t, label) { return "<button data-tab='" + t + "' class='" + (t === tab ? "on" : "") + "'>" + label + "</button>"; }
  function loadTab() {
    var m = document.getElementById("admMain");
    if (tab === "overview") loadOverview(m);
    else if (tab === "settings") loadSettings(m);
    else if (tab === "words") loadWords(m);
    else if (tab === "phrases") loadPhrases(m);
    else if (tab === "content") loadContent(m);
    else loadUsers(m);
  }

  /* ------- 非管理员 ------- */
  if (!isAdmin) {
    view.innerHTML =
      '<section class="section"><div class="container" style="max-width:520px">' +
        '<div class="panel"><h3>🔒 需要管理员权限</h3><p class="muted" style="font-size:14px">请使用管理员账号登录（初始账号密码见服务器启动日志或 data/admin.txt）。</p>' +
        '<div class="field"><label class="f-label">管理员用户名</label><input type="text" id="auUser" value="admin"></div>' +
        '<div class="field"><label class="f-label">密码</label><input type="password" id="auPass"></div>' +
        '<button class="btn btn-primary btn-block" id="admLogin">登录管理后台</button></div>' +
      '</div></section>';
    document.getElementById("admLogin").onclick = async function () {
      try {
        var d = await BH.api("/api/auth/login", { method: "POST", body: { username: document.getElementById("auUser").value.trim().toLowerCase(), password: document.getElementById("auPass").value } });
        if (d.user.role !== "admin") { BH.toast("该账号不是管理员"); return; }
        BH.setSession(d.token, d.user);
        BH.toast("管理员登录成功");
        BH.refresh();
      } catch (e) { BH.toast(e.message); }
    };
    return;
  }

  shell("<div class='empty-hint'><span class='spin'></span> 加载中…</div>");
  loadTab();

  async function loadOverview(m) {
    var d = await BH.api("/api/admin/overview");
    var html = "<div class='ov-grid'>" +
      ov(d.counts.words, "词库单词", "📖") + ov(d.counts.phrases, "词组搭配", "🔗") + ov(d.counts.content, "备考素材", "🧩") +
      ov(d.counts.units, "学习单元", "🗂️") + ov(d.counts.users, "注册用户", "👥") + ov(d.activityTotal, "累计练习", "🏃") + ov(d.knownTotal, "云端掌握标记", "🧠") +
      ov((d.analytics && d.analytics.views) || 0, "累计访问", "📈") +
      ov((d.analytics && d.analytics.todayViews) || 0, "今日访问", "🔥") +
      "</div><div class='panel' style='margin-top:18px'><h3>素材分布</h3><div class='chip-group'>" +
      Object.keys(d.byCat || {}).map(function (c) { return "<span class='tag'>" + s(CAT_CN[c] || c) + "：" + d.byCat[c] + "</span>"; }).join("") +
      "</div>" +
      (d.analytics && Object.keys(d.analytics.modules || {}).length ? "<div class='chip-group' style='margin-top:8px'>模块访问：" + Object.keys(d.analytics.modules).sort(function (x, y) { return d.analytics.modules[y] - d.analytics.modules[x]; }).slice(0, 6).map(function (k) { return "<span class='tag'>" + k + "：" + d.analytics.modules[k] + "</span>"; }).join("") + "</div>" : "") +
      "<p class='muted' style='font-size:12.5px;margin-top:10px'>提示：统计为匿名页级数据（无 Cookie、不含个人信息）。服务器首次启动自动播种；改动保存在 data/db.json，请定期备份。</p></div>";
    m.innerHTML = html;
    function ov(n, t, ic) { return "<div class='ov-card'><span style='font-size:20px'>" + ic + "</span><span class='n'>" + n + "</span><span class='t'>" + t + "</span></div>"; }
  }

  /* ------- 站点文案 ------- */
  async function loadSettings(m) {
    var st = await BH.api("/api/admin/settings");
    function f(id, label, val, ph) { return "<div class='field'><label class='f-label'>" + label + "</label><input type='text' id='" + id + "' value='" + s(val) + "' placeholder='" + s(ph || "") + "'></div>"; }
    function ta(id, label, val) { return "<div class='field'><label class='f-label'>" + label + "</label><textarea id='" + id + "' rows='3'>" + s(val) + "</textarea></div>"; }
    m.innerHTML =
      "<div class='panel'><h3>🏷️ 品牌与创始人</h3><div class='form-grid'>" +
        f("s_bn", "品牌名", st.brand.name) + f("s_be", "品牌英文", st.brand.en) + f("s_bt", "品牌标语", st.brand.tagline) +
        f("s_fn", "创始人中文名", st.founder.name) + f("s_fe", "创始人英文名", st.founder.en) + f("s_fa", "头像字", st.founder.avatarText) +
        ta("s_ft", "创始人头衔", st.founder.title) + ta("s_fb", "创始人寄语", st.founder.bio) + f("s_fs", "签名", st.founder.sign) +
      "</div></div>" +
      "<div class='panel'><h3>📣 首页文案与公告</h3>" +
        ta("s_ht", "首页大标题", st.hero.title) + ta("s_hs", "首页副标题", st.hero.sub) +
        ta("s_an", "顶部公告（空则隐藏）", st.announcement) +
      "</div>" +
      "<div class='panel'><h3>📅 考试与联系</h3><div class='form-grid'>" +
        f("s_ed", "默认考试日期", st.examDate, "YYYY-MM-DD") + f("s_ct", "联系邮箱", st.contact) + ta("s_fn2", "页脚说明", st.footerNote) +
      "</div></div>" +
      "<div class='btn-row'><button class='btn btn-primary' id='saveSet'>💾 保存全部文案</button><span class='muted' style='font-size:12px'>保存后刷新页面即时生效</span></div>";
    document.getElementById("saveSet").onclick = async function () {
      function gv(id) { var e = document.getElementById(id); return e ? e.value : ""; }
      var patch = {
        brand: { name: gv("s_bn"), en: gv("s_be"), tagline: gv("s_bt") },
        founder: { name: gv("s_fn"), en: gv("s_fe"), avatarText: gv("s_fa"), title: gv("s_ft"), bio: gv("s_fb"), sign: gv("s_fs") },
        hero: { title: gv("s_ht"), sub: gv("s_hs") },
        announcement: gv("s_an"), examDate: gv("s_ed"), contact: gv("s_ct"), footerNote: gv("s_fn2")
      };
      try {
        await BH.api("/api/admin/settings", { method: "PUT", body: patch });
        BH.toast("文案已保存 ✓");
        BH.reloadSite().then(function () { BH.navTo("#/"); });
      } catch (e) { BH.toast(e.message); }
    };
  }

  /* ------- 词库管理 ------- */
  async function loadWords(m) {
    var units = await BH.api("/api/units");
    var W = { unit: units[0] ? units[0].id : "", q: "", page: 0, per: 40 };
    m.innerHTML =
      "<div class='panel'><h3>批量导入单词（粘贴到当前单元）</h3><p class='muted' style='font-size:12.5px'>每行一个单词，格式：<code>单词|音标|词性|释义|例句|例句翻译</code>（音标等可留空，用 | 分隔即可）</p>" +
      "<div class='toolbar'><select id='impUnit'></select><button class='btn btn-primary btn-sm' id='impGo'>⬆️ 导入</button></div>" +
      "<textarea id='impText' rows='6' placeholder='abandon|/əˈbændən/|vt.|放弃；抛弃|They abandoned the plan.|他们放弃了计划。'></textarea></div>" +
      "<div class='panel' style='margin-top:16px'><h3>单词检索与编辑</h3>" +
      "<div class='toolbar'><select id='wUnit'></select><input type='text' id='wQ' placeholder='搜单词' style='max-width:220px'><button class='btn btn-soft btn-sm' id='wSearch'>搜索</button><span class='grow'></span><span class='tag' id='wTotal'></span></div>" +
      "<div class='table-wrap' style='margin-top:10px'><table><thead><tr><th>ID</th><th>单词</th><th>音标</th><th>词性</th><th>释义</th><th style='width:150px'>操作</th></tr></thead><tbody id='wBody'></tbody></table></div>" +
      "<div class='pager' id='wPager'></div></div>";
    var fillSel = function (selId, val) {
      var el = document.getElementById(selId);
      el.innerHTML = units.map(function (u) { return "<option value='" + u.id + "'>" + s(u.name) + "</option>"; }).join("");
      el.value = val; return el;
    };
    fillSel("impUnit", W.unit); fillSel("wUnit", W.unit);
    document.getElementById("impUnit").onchange = function () { W.unit = this.value; document.getElementById("wUnit").value = W.unit; };
    document.getElementById("wUnit").onchange = function () { W.unit = this.value; W.page = 0; fetchW(); };
    document.getElementById("wSearch").onclick = function () { W.q = document.getElementById("wQ").value.trim(); W.page = 0; fetchW(); };
    document.getElementById("wQ").onkeydown = function (e) { if (e.key === "Enter") { W.q = this.value.trim(); W.page = 0; fetchW(); } };
    document.getElementById("impGo").onclick = doImport;
    await fetchW();

    async function fetchW() {
      var url = "/api/admin/rows/words?offset=" + (W.page * W.per) + "&limit=" + W.per + "&q=" + encodeURIComponent(W.q);
      if (W.unit) url += "&unit=" + encodeURIComponent(W.unit);
      var d = await BH.api(url);
      document.getElementById("wTotal").textContent = "当前范围 " + d.total + " 条（单元内）";
      var tb = document.getElementById("wBody");
      tb.innerHTML = d.rows.map(function (w) {
        return "<tr><td>" + w.id + "</td><td><b>" + s(w.w) + "</b></td><td class='ipa'>" + s(w.f || "") + "</td><td><span class='pos'>" + s(w.p || "") + "</span></td><td style='max-width:260px'>" + s(w.m) + "</td>" +
          "<td><div class='row-actions'><button data-edit='" + w.id + "'>编辑</button><button class='del' data-del='" + w.id + "'>删除</button></div></td></tr>";
      }).join("") || "<tr><td colspan='6' style='text-align:center;padding:20px'>无数据</td></tr>";
      bindActions(d.rows);
      var pages = Math.max(1, Math.ceil(d.total / W.per));
      var pg = document.getElementById("wPager"); pg.innerHTML = "";
      for (var i = 0; i < Math.min(pages, 40); i++) {
        var b = document.createElement("button");
        b.textContent = i + 1; if (i === W.page) b.classList.add("on");
        b.disabled = i === W.page;
        b.onclick = (function (pg2) { return function () { W.page = pg2; fetchW(); }; })(i);
        pg.appendChild(b);
      }
    }
    function bindActions(rows) {
      document.querySelectorAll("#wBody [data-edit]").forEach(function (b) {
        b.onclick = function () { var row = rows.find(function (r) { return String(r.id) === String(b.getAttribute("data-edit")); }); if (row) editRow(row); };
      });
      document.querySelectorAll("#wBody [data-del]").forEach(function (b) {
        b.onclick = async function () {
          if (!confirm("确认删除该单词？")) return;
          await BH.api("/api/admin/rows/words/" + b.getAttribute("data-del"), { method: "DELETE" });
          BH.toast("已删除"); fetchW();
        };
      });
    }
    async function editRow(row) {
      BH.modal("<h3>编辑单词：" + s(row.w) + "</h3>" +
        "<div class='field'><label class='f-label'>单词</label><input type='text' id='ew' value='" + s(row.w) + "'></div>" +
        "<div class='field'><label class='f-label'>音标</label><input type='text' id='ef' value='" + s(row.f || "") + "'></div>" +
        "<div class='field'><label class='f-label'>词性</label><input type='text' id='ep' value='" + s(row.p || "") + "'></div>" +
        "<div class='field'><label class='f-label'>释义</label><textarea id='em' rows='2'>" + s(row.m || "") + "</textarea></div>" +
        "<div class='field'><label class='f-label'>例句</label><textarea id='eex' rows='2'>" + s(row.ex || "") + "</textarea></div>" +
        "<div class='field'><label class='f-label'>例句翻译</label><textarea id='ec' rows='2'>" + s(row.c || "") + "</textarea></div>" +
        "<div class='btn-row'><button class='btn btn-primary' id='ewGo'>保存</button></div>", true);
      document.querySelector(".modal").classList.add("wide");
      document.getElementById("ewGo").onclick = async function () {
        var body = { w: document.getElementById("ew").value.trim(), f: document.getElementById("ef").value.trim(), p: document.getElementById("ep").value.trim(), m: document.getElementById("em").value, ex: document.getElementById("eex").value, c: document.getElementById("ec").value };
        if (!body.w) { BH.toast("单词不能为空"); return; }
        await BH.api("/api/admin/rows/words/" + row.id, { method: "PUT", body: body });
        BH.closeModal(); BH.toast("已保存 ✓"); fetchW();
      };
    }
    async function doImport() {
      var unit = document.getElementById("impUnit").value;
      var text = document.getElementById("impText").value.trim();
      if (!text) { BH.toast("请先粘贴词条"); return; }
      var rows = [], bad = 0;
      text.split(/\r?\n/).forEach(function (line) {
        line = line.trim(); if (!line) return;
        var p = line.split("|").map(function (x) { return x.trim(); });
        if (!p[0]) { bad++; return; }
        rows.push({ unit: unit, w: p[0], f: p[1] || "", p: p[2] || "", m: p[3] || "", ex: p[4] || "", c: p[5] || "", src: "admin" });
      });
      if (!rows.length) { BH.toast("没有可导入的词条"); return; }
      try {
        var d = await BH.api("/api/admin/rows/words", { method: "POST", body: rows });
        BH.toast("成功导入 " + d.count + " 条 ✓");
        document.getElementById("impText").value = "";
        fetchW();
      } catch (e) { BH.toast("导入失败：" + e.message); }
    }
  }

  /* ------- 短语管理 ------- */
  async function loadPhrases(m) {
    var P = { q: "", page: 0, per: 50 };
    m.innerHTML =
      "<div class='panel'><h3>批量导入搭配</h3><p class='muted' style='font-size:12.5px'>每行一个：<code>英文搭配|中文释义</code>；行首加 <code>core:</code> 标记为核心搭配，如 <code>core:account for|解释；说明</code></p>" +
      "<textarea id='impPh' rows='5'></textarea><div class='btn-row' style='margin-top:8px'><button class='btn btn-primary btn-sm' id='impPhGo'>⬆️ 导入</button></div></div>" +
      "<div class='panel' style='margin-top:16px'><h3>短语检索</h3><div class='toolbar'><input type='text' id='pQ' placeholder='搜搭配' style='max-width:240px'><button class='btn btn-soft btn-sm' id='pSearch'>搜索</button><span class='grow'></span><span class='tag' id='pTotal'></span></div>" +
      "<div class='table-wrap' style='margin-top:10px'><table><thead><tr><th>ID</th><th>搭配</th><th>释义</th><th>类型</th><th>操作</th></tr></thead><tbody id='pBody'></tbody></table></div><div class='pager' id='pPager'></div></div>";
    document.getElementById("pSearch").onclick = function () { P.q = document.getElementById("pQ").value.trim(); P.page = 0; fetchP(); };
    document.getElementById("pQ").onkeydown = function (e) { if (e.key === "Enter") { P.q = this.value.trim(); P.page = 0; fetchP(); } };
    document.getElementById("impPhGo").onclick = async function () {
      var text = document.getElementById("impPh").value.trim();
      if (!text) { BH.toast("请粘贴内容"); return; }
      var rows = [];
      text.split(/\r?\n/).forEach(function (line) {
        line = line.trim(); if (!line) return;
        var core = line.indexOf("core:") === 0;
        if (core) line = line.slice(5);
        var p = line.split("|").map(function (x) { return x.trim(); });
        if (!p[0]) return;
        rows.push({ en: p[0], zh: p[1] || "", core: core, src: "admin" });
      });
      var d = await BH.api("/api/admin/rows/phrases", { method: "POST", body: rows });
      BH.toast("成功导入 " + d.count + " 条 ✓");
      document.getElementById("impPh").value = ""; fetchP();
    };
    await fetchP();
    async function fetchP() {
      var url = "/api/admin/rows/phrases?offset=" + (P.page * P.per) + "&limit=" + P.per + "&q=" + encodeURIComponent(P.q);
      var d = await BH.api(url);
      document.getElementById("pTotal").textContent = "共 " + d.total + " 条";
      document.getElementById("pBody").innerHTML = d.rows.map(function (p) {
        return "<tr><td>" + p.id + "</td><td><b>" + s(p.en) + "</b></td><td>" + s(p.zh || "") + "</td><td>" + (p.core ? "核心" : "大纲") + "</td>" +
          "<td><div class='row-actions'><button data-edit='" + p.id + "'>编辑</button><button class='del' data-del='" + p.id + "'>删除</button></div></td></tr>";
      }).join("") || "<tr><td colspan='5' style='text-align:center;padding:20px'>无数据</td></tr>";
      var pg = document.getElementById("pPager"); pg.innerHTML = "";
      var pages = Math.max(1, Math.ceil(d.total / P.per));
      for (var i = 0; i < Math.min(pages, 60); i++) {
        var b = document.createElement("button");
        b.textContent = i + 1; if (i === P.page) b.classList.add("on");
        b.disabled = i === P.page;
        b.onclick = (function (p2) { return function () { P.page = p2; fetchP(); }; })(i);
        pg.appendChild(b);
      }
      document.querySelectorAll("#pBody [data-edit]").forEach(function (b) {
        b.onclick = function () { editPh(b.getAttribute("data-edit"), d.rows); };
      });
      document.querySelectorAll("#pBody [data-del]").forEach(function (b) {
        b.onclick = async function () {
          if (!confirm("确认删除？")) return;
          await BH.api("/api/admin/rows/phrases/" + b.getAttribute("data-del"), { method: "DELETE" });
          BH.toast("已删除"); fetchP();
        };
      });
    }
    async function editPh(id, rows) {
      var row = rows.find(function (r) { return String(r.id) === String(id); });
      if (!row) return;
      BH.modal("<h3>编辑搭配</h3>" +
        "<div class='field'><label class='f-label'>搭配</label><input type='text' id='pe' value='" + s(row.en) + "'></div>" +
        "<div class='field'><label class='f-label'>释义</label><textarea id='pz' rows='2'>" + s(row.zh || "") + "</textarea></div>" +
        "<div class='field'><label class='f-label'>核心</label><select id='pc'><option value='1'" + (row.core ? " selected" : "") + ">核心搭配</option><option value='0'" + (!row.core ? " selected" : "") + ">大纲搭配</option></select></div>" +
        "<div class='btn-row'><button class='btn btn-primary' id='pGo'>保存</button></div>");
      document.getElementById("pGo").onclick = async function () {
        await BH.api("/api/admin/rows/phrases/" + row.id, { method: "PUT", body: { en: document.getElementById("pe").value.trim(), zh: document.getElementById("pz").value, core: document.getElementById("pc").value === "1" } });
        BH.closeModal(); BH.toast("已保存 ✓"); fetchP();
      };
    }
  }

  /* ------- 素材管理 ------- */
  async function loadContent(m) {
    var cat = CATS[0];
    m.innerHTML =
      "<div class='panel'><div class='toolbar'>" + CATS.map(function (c) {
        return "<button class='btn btn-sm " + (c === cat ? "btn-primary" : "btn-ghost") + "' data-cat='" + c + "'>" + s(CAT_CN[c]) + "</button>";
      }).join("") + "</div></div>" +
      "<div class='panel' style='margin-top:14px'><div class='toolbar'><h3 style='margin:0' id='catTitle'></h3><span class='grow'></span><button class='btn btn-soft btn-sm' id='cAdd'>➕ 新增一条</button></div>" +
      "<div class='table-wrap' style='margin-top:12px'><table><thead><tr><th>ID</th><th>标题</th><th>排序</th><th style='width:150px'>操作</th></tr></thead><tbody id='cBody'></tbody></table></div></div>";
    var curCatEls = m.querySelectorAll("[data-cat]");
    function setCat(c) {
      cat = c;
      curCatEls.forEach(function (b) {
        var on = b.getAttribute("data-cat") === c;
        b.classList.toggle("btn-primary", on); b.classList.toggle("btn-ghost", !on);
      });
      fetchC();
    }
    curCatEls.forEach(function (b) { b.onclick = function () { setCat(b.getAttribute("data-cat")); }; });
    document.getElementById("cAdd").onclick = function () { addC(); };
    await fetchC();
    async function fetchC() {
      var d = await BH.api("/api/content?cat=" + cat);
      document.getElementById("catTitle").textContent = CAT_CN[cat] + "（" + d.length + "）";
      document.getElementById("cBody").innerHTML = d.map(function (r) {
        return "<tr><td>" + s(r.id) + "</td><td><b>" + s(r.title) + "</b>" + (r.sub ? "<div class='muted' style='font-size:12px'>" + s(r.sub) + "</div>" : "") + "</td><td>" + r.sort + "</td>" +
          "<td><div class='row-actions'><button data-edit='" + s(r.id) + "'>编辑</button><button class='del' data-del='" + s(r.id) + "'>删除</button></div></td></tr>";
      }).join("") || "<tr><td colspan='4' style='text-align:center;padding:20px'>该分类暂无内容</td></tr>";
      document.querySelectorAll("#cBody [data-edit]").forEach(function (b) { b.onclick = function () { editC(b.getAttribute("data-edit"), d); }; });
      document.querySelectorAll("#cBody [data-del]").forEach(function (b) {
        b.onclick = async function () {
          if (!confirm("确认删除该素材？")) return;
          await BH.api("/api/admin/rows/content/" + encodeURIComponent(b.getAttribute("data-del")), { method: "DELETE" });
          BH.toast("已删除"); fetchC();
        };
      });
    }
    function contentForm(row) {
      var title = row ? row.title : "";
      var data = row ? JSON.stringify(row.data || {}, null, 2) : FIELD_HINT[cat] || "{}";
      var html = "<h3>" + (row ? "编辑：" + s(title) : "新增素材") + "</h3>" +
        "<div class='field'><label class='f-label'>标题</label><input type='text' id='ct' value='" + s(title) + "'></div>" +
        "<div class='field'><label class='f-label'>副标题（可选）</label><input type='text' id='cs' value='" + s(row && row.sub || "") + "'></div>" +
        "<div class='field'><label class='f-label'>JSON 内容（data 字段）</label><textarea id='cd' rows='12' class='mono'>" + s(data) + "</textarea></div>" +
        "<details class='acc'><summary>📖 字段说明（本分类） <span class='chev'>▾</span></summary><div class='acc-body'><code class='json-pre'>" + s(FIELD_HINT[cat] || "{}") + "</code><p class='muted' style='font-size:12px'>请严格按 JSON 格式编辑；数组用 [ ]，对象用 { }，字符串用英文双引号。内容会实时展示在对应学习页面。</p></div></details>" +
        "<div class='btn-row' style='margin-top:10px'><button class='btn btn-primary' id='cSave'>💾 保存</button></div>";
      BH.modal(html, true);
      document.querySelector(".modal").classList.add("wide");
    }
    function editC(id, rows) {
      var row = rows.find(function (r) { return String(r.id) === String(id); });
      if (!row) return;
      contentForm(row);
      document.getElementById("cSave").onclick = async function () {
        var title = document.getElementById("ct").value.trim();
        var sub = document.getElementById("cs").value.trim();
        var dataRaw = document.getElementById("cd").value.trim();
        var data;
        try { data = JSON.parse(dataRaw); } catch (e) { BH.toast("JSON 格式错误：" + e.message); return; }
        if (!title) { BH.toast("标题不能为空"); return; }
        await BH.api("/api/admin/rows/content/" + encodeURIComponent(row.id), { method: "PUT", body: { title: title, sub: sub, data: data } });
        BH.closeModal(); BH.toast("已保存 ✓"); fetchC();
      };
    }
    function addC() {
      contentForm(null);
      document.getElementById("cSave").onclick = async function () {
        var title = document.getElementById("ct").value.trim();
        var sub = document.getElementById("cs").value.trim();
        var data;
        try { data = JSON.parse(document.getElementById("cd").value.trim() || "{}"); } catch (e) { BH.toast("JSON 格式错误：" + e.message); return; }
        if (!title) { BH.toast("标题不能为空"); return; }
        await BH.api("/api/admin/rows/content", { method: "POST", body: { cat: cat, title: title, sub: sub, data: data } });
        BH.closeModal(); BH.toast("已新增 ✓"); fetchC();
      };
    }
  }

  /* ------- 用户总览 ------- */
  async function loadUsers(m) {
    var d = await BH.api("/api/admin/users");
    m.innerHTML = "<div class='panel'><h3>👥 注册用户（按活跃度排序）</h3><div class='table-wrap'><table><thead><tr><th>用户名</th><th>昵称</th><th>类型</th><th>掌握词</th><th>错词</th><th>打卡</th><th>练习</th><th>注册时间</th></tr></thead><tbody>" +
      (d.rows || []).map(function (u) {
        return "<tr><td><b>" + s(u.username) + "</b></td><td>" + s(u.name) + "</td><td>" + (u.role === "admin" ? "站长" : u.guest ? "游客" : "用户") + "</td><td>" + u.known + "</td><td>" + u.wrong + "</td><td>" + u.checkins + "</td><td>" + u.activities + "</td><td class='muted'>" + s(String(u.createdAt || "").slice(0, 10)) + "</td></tr>";
      }).join("") +
      "</tbody></table></div></div>";
  }
});