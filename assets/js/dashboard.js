/* 博浩英语 CET-6 · 个人数据中心（打卡 / 统计 / 错题 / 账号） */
"use strict";
BH.reg("me", async function (view) {
  var s = BH.esc;
  await BH.ensureGuest();
  var [me, stats] = await Promise.all([
    BH.authed("/api/me"),
    BH.authed("/api/me/stats")
  ]);
  var user = me.user || BH.user;
  var st = me.state || { known: [], wrong: [], checkins: [] };
  var isGuest = user && user.guest;
  var TYPE_ICON = { "词汇自测": "📖", "听力自测": "🎧", "阅读实战": "📚", "专注番茄": "🍅", "其他": "📝" };

  view.innerHTML =
    '<section class="section tight" style="padding-top:46px"><div class="container">' +
      '<div class="sec-head left"><span class="badge">📊 个人数据中心</span>' +
      '<h2>' + s(user ? (user.name || user.username) : "我的") + '，继续加油！</h2>' +
      '<p>' + (BH.STATIC ? (isGuest ? "当前为游客模式，学习记录保存在本机浏览器。注册后会**自动**把游客记录迁移到新账号；请勿清理浏览器数据。" : "学习记录保存在本机浏览器；请勿清理浏览器数据。") : (isGuest ? "当前为游客模式，学习记录已云端保存。注册后游客数据将自动迁移到新账号。" : "学习记录已云端同步，换设备登录同一账号即可继续。")) + '</p>' +
      '<div class="toolbar" style="margin-top:6px">' +
        '<button class="btn btn-primary" id="checkinBtn">✅ ' + (stats.checkedToday ? "今日已打卡" : "今日打卡") + '</button>' +
        '<button class="btn btn-soft" id="posterBtn">🖼️ 打卡海报</button>' +
        (isGuest ? '<button class="btn btn-soft" id="openAuth">🔐 注册 / 登录账号</button>' : '<button class="btn btn-ghost" id="changePw">🔑 修改密码</button>') +
        '<button class="btn btn-ghost" id="logoutBtn">🚪 退出登录</button>' +
      '</div></div>' +

      '<div class="dash-grid">' +
        '<div class="dash-card"><span class="dc-ico">🧠</span><div class="dc-num" style="color:var(--green)">' + stats.knownCount + '</div><div class="dc-lbl">已掌握词汇</div></div>' +
        '<div class="dash-card"><span class="dc-ico">❌</span><div class="dc-num" style="color:var(--red)">' + stats.wrongCount + '</div><div class="dc-lbl">错题本</div></div>' +
        '<div class="dash-card"><span class="dc-ico">🔥</span><div class="dc-num">' + stats.streak + '<span style="font-size:.5em"> 天</span></div><div class="dc-lbl">连续打卡 · 累计 ' + stats.checkinCount + ' 天</div></div>' +
        '<div class="dash-card"><span class="dc-ico">🎯</span><div class="dc-num">' + stats.accuracy + '<span style="font-size:.5em">%</span></div><div class="dc-lbl">自测正确率 · ' + stats.activityCount + ' 次练习</div></div>' +
      '</div>' +
      '<div id="dueWrap" style="margin-top:14px"></div>' +
      '<div id="clsWrap" style="margin-top:14px"></div>' +
    '</div></section>' +

    '<section class="section tight" style="padding-top:26px"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Memory Curve</span><h2>🧠 艾宾浩斯记忆曲线</h2><p>按 1 · 2 · 4 · 7 · 15 · 30 天间隔科学安排复习，把“刚记住”变成“忘不掉”。</p></div>' +
      '<div class="mem-grid">' +
        '<div class="panel"><h3>⏰ 今日待复习</h3><div id="memToday" style="margin-top:6px"></div></div>' +
        '<div class="panel"><h3>📅 未来两周复习量</h3><div class="mini-bars" id="memBars" style="margin-top:14px"></div><p class="muted" style="font-size:12px;margin:10px 0 0">柱越高 = 那天要复习的词越多，建议当天清完。</p></div>' +
        '<div class="panel mem-curve-panel"><h3>📉 遗忘曲线与复习点</h3><div id="memCurve" style="margin-top:6px"></div></div>' +
      '</div>' +
      '<div id="dueWrap" style="margin-top:14px"></div>' +
    '</div></section>' +

    '<section class="section tight" style="padding-top:26px"><div class="container">' +
      '<div class="two-col">' +
        '<div><div class="panel"><h3>🗓️ 学习热力图（近 84 天）</h3><div id="heatBox" style="margin-top:8px"></div><p class="muted" style="font-size:12px;margin-top:10px">深色 = 已打卡。坚持每天点亮一格，火苗就不会断。</p></div>' +
        '<div class="panel"><h3>📈 近 14 天学习时长（分钟）</h3><div class="mini-bars" id="dayBars" style="margin-top:12px"></div></div></div>' +
        '<div><div class="panel"><h3>🕒 最近动态</h3><div id="actList"></div></div>' +
        '<div class="panel"><h3>📖 模块练习分布</h3><div id="typeBars"></div></div></div>' +
      '</div>' +
      '<div id="dueWrap" style="margin-top:14px"></div>' +
    '</div></section>' +

    '<section class="section tight" style="padding-top:26px"><div class="container">' +
      '<div class="sec-head left"><span class="eyebrow">Wrong Book</span><h2>错题本（' + stats.wrongCount + '）</h2><p>答错的单词都在这里，可一键移除或去复习。</p></div>' +
      '<div class="panel"><div id="wrongBox"></div></div>' +
    '</div></section>';

  /* 今日待复习提醒 */
  var dueWrap = document.getElementById("dueWrap");
  if (dueWrap && stats.memory) {
    var dn = stats.memory.due || 0;
    dueWrap.innerHTML = dn > 0 ? "<div class='callout warn' style='margin:0;display:flex;align-items:center;gap:12px;flex-wrap:wrap'><span style='flex:1'>⏰ 今日待复习 <b>" + dn + "</b> 个单词（记忆曲线已帮你排好）</span><a class='btn btn-primary btn-sm' href='#/vocab?mode=review'>去复习 →</a></div>" : "<div class='callout good' style='margin:0'>🎉 今日待复习 0 词，全部完成，继续保持！</div>";
  }
  /* 打卡海报 */
  var posterBtn = document.getElementById("posterBtn");
  if (posterBtn) posterBtn.onclick = async function () {
    BH.toast("正在生成海报…");
    var url = await BH.buildShare({ title: [{ text: "连续打卡 " + stats.streak + " 天", color: "#db2777" }], lines: [ { text: "已掌握 " + stats.knownCount + " 词", font: "800 32px sans-serif" }, { text: "累计打卡 " + stats.checkinCount + " 天 · 正确率 " + stats.accuracy + "%", color: "#6d28d9", font: "600 26px sans-serif" }, { text: "一起学六级，每天进步一点点 ✨", color: "#7c3aed", font: "600 24px sans-serif" } ], footer: "wbh · 博浩英语 CET-6" });
    BH.modal("<h3>🖼️ 我的打卡海报</h3><div style='text-align:center'><img src='" + url + "' style='max-width:100%;max-height:70vh;border-radius:16px'></div><div class='btn-row' style='justify-content:center;margin-top:12px'><a class='btn btn-primary' download='bohao-checkin.png' href='" + url + "'>⬇️ 下载图片</a><button class='btn btn-ghost' data-close>关闭</button></div><p class='muted' style='text-align:center;font-size:12px'>手机可长按图片保存，直接发朋友圈/小红书</p>");
  };
    /* 打卡 */
  document.getElementById("checkinBtn").onclick = async function () {
    try {
      await BH.authed("/api/me/checkin", { method: "POST", body: {} });
      var b = document.getElementById("checkinBtn");
      b.textContent = "✅ 今日已打卡";
      b.classList.add("btn-soft"); b.classList.remove("btn-primary");
      BH.celebrate();
      BH.toast("打卡成功，继续保持 🔥");
      setTimeout(function(){ BH.refresh(); }, 1000);
    } catch (e) { BH.toast(e.message); }
  };
  document.getElementById("logoutBtn").onclick = function () {
    if (!confirm("确定退出当前账号吗？")) return;
    BH.clearSession();
    BH.toast("已退出，期待你回来 👋");
    BH.navTo("#/");
  };
  if (isGuest) {
    document.getElementById("openAuth").onclick = openAuth;
  } else {
    document.getElementById("changePw").onclick = openChangePw;
  }

  /* 热力图：84 天，7 行 × 12 周 */
  var heat = stats.heat || [];
  var todayIdx = heat.length - 1;
  var grid = "";
  var dayNames = ["一", "二", "三", "四", "五", "六", "日"];
  // 计算首日星期（0=周日）
  var first = heat.length ? new Date(heat[0].date + "T00:00:00") : new Date();
  var lead = (first.getDay() + 6) % 7; // 周一为 0
  var cells = [];
  for (var i = 0; i < lead; i++) cells.push("<span class='h-cell' style='opacity:0'></span>");
  heat.forEach(function (h, i) {
    cells.push("<span class='h-cell" + (h.on ? " on" : "") + (i === todayIdx ? " today" : "") + "' title='" + BH.fmtDateCN(h.date) + (h.on ? " ✓" : "") + "'></span>");
  });
  var weeks = Math.ceil(cells.length / 7);
  var htmlRows = "";
  for (var r = 0; r < 7; r++) {
    var row = "";
    for (var w = 0; w < weeks; w++) {
      var ci = w * 7 + r;
      row += ci < cells.length ? cells[ci] : "<span style='width:15px'></span>";
    }
    htmlRows += "<div style='display:flex;gap:5px;align-items:center'><span class='heat-month' style='width:16px'>" + (r === 0 ? "一" : r === 1 ? "三" : r === 2 ? "五" : r === 3 ? "日" : "") + "</span>" + row + "</div>";
  }
  document.getElementById("heatBox").innerHTML = "<div style='display:flex;flex-direction:column;gap:5px'>" + htmlRows + "</div>";

  /* 近 14 天柱状 */
  var mx = 1;
  (stats.last14 || []).forEach(function (d) { if (d.minutes > mx) mx = d.minutes; });
  document.getElementById("dayBars").innerHTML = (stats.last14 || []).map(function (d) {
    var h = Math.max(3, Math.round(d.minutes / mx * 100));
    return "<i style='height:" + h + "%' title='" + BH.fmtDateCN(d.date) + " " + d.minutes + " 分钟'><b>" + (d.minutes || "") + "</b></i>";
  }).join("");

  /* 模块分布 */
  var byType = stats.byType || {};
  var typeMap = { "词汇自测": "词汇", "听力自测": "听力", "阅读实战": "阅读", "专注番茄": "专注" };
  var labels = Object.keys(byType);
  var maxT = 1; labels.forEach(function (k) { if (byType[k] > maxT) maxT = byType[k]; });
  document.getElementById("typeBars").innerHTML = labels.length ? labels.map(function (k) {
    return "<div class='bar-row'><span>" + (typeMap[k] || k) + "</span><div class='bar'><i style='width:" + Math.round(byType[k] / maxT * 100) + "%'></i></div><b>" + byType[k] + " 次</b></div>";
  }).join("") : "<div class='empty-note'>还没有练习记录，去词汇/听力/阅读里测一测吧</div>";

  /* 艾宾浩斯记忆曲线 */
  var mem = stats.memory || { due: 0, plan: [] };
  var memToday = document.getElementById("memToday");
  if (memToday) {
    memToday.innerHTML =
      "<div style='display:flex;align-items:center;gap:18px;flex-wrap:wrap'>" +
        "<div style='text-align:center;padding:4px 10px 4px 0'><div style='font-size:36px;font-weight:900;color:var(--brand);line-height:1'>" + (mem.due || 0) + "</div><div class='muted' style='font-size:12.5px;margin-top:6px'>词待复习</div></div>" +
        "<div style='flex:1;min-width:190px'><a class='btn btn-primary btn-sm' href='#/vocab?mode=review'>🧠 开始今日复习</a>" +
        "<p class='muted' style='font-size:12.5px;margin-top:9px'>背词时点“认识/忘记”即自动排期；答对的词按 1·2·4·7·15·30 天进入下一轮。</p></div>" +
      "</div>";
  }
  var memPlan = (mem.plan || []).slice(0, 14);
  var memMx = 1; memPlan.forEach(function (p) { if (p.count > memMx) memMx = p.count; });
  var mb = document.getElementById("memBars");
  if (mb) mb.innerHTML = memPlan.length ? memPlan.map(function (p) {
    var h = Math.max(3, Math.round(p.count / memMx * 100));
    var d = new Date(p.date + "T00:00:00");
    var lbl = (d.getMonth() + 1) + "/" + d.getDate();
    return "<i style='height:" + h + "%' title='" + BH.fmtDateCN(p.date) + "：" + p.count + " 词'><b>" + (p.count || "") + "</b><em>" + lbl + "</em></i>";
  }).join("") : "<div class='empty-note'>还没有复习排期——去词汇页背词并标记“认识”，系统就会自动生成记忆曲线复习计划。</div>";
  var mc = document.getElementById("memCurve");
  if (mc) {
    var W = 360, H = 168, padL = 36, padB = 26, padT = 12, padR = 10;
    var X = function (t) { return padL + t / 30 * (W - padL - padR); };
    var Y = function (r) { return padT + (1 - r) * (H - padT - padB); };
    var pts = [];
    for (var t = 0; t <= 30; t += 0.5) { var r = Math.exp(-t / 6.2); pts.push(X(t).toFixed(1) + "," + Y(r).toFixed(1)); }
    var svg = "<svg viewBox='0 0 " + W + " " + H + "' style='width:100%;height:auto;display:block' role='img' aria-label='艾宾浩斯遗忘曲线'>";
    [1, .75, .5, .25, 0].forEach(function (gr) { svg += "<line x1='" + padL + "' y1='" + Y(gr).toFixed(1) + "' x2='" + (W - padR) + "' y2='" + Y(gr).toFixed(1) + "' style='stroke:var(--line)' stroke-width='1'/>"; });
    [0, 1, 2, 4, 7, 15, 30].forEach(function (t) { svg += "<text x='" + X(t).toFixed(1) + "' y='" + (H - 8) + "' font-size='8.5' style='fill:var(--muted)' text-anchor='middle'>" + (t || 0) + "</text>"; });
    svg += "<text x='8' y='14' font-size='8.5' style='fill:var(--muted)'>100%</text>";
    svg += "<text x='18' y='" + (H - 8) + "' font-size='8.5' style='fill:var(--muted)'>学习后天数 →</text>";
    svg += "<path d='M" + pts.join(" L") + "' fill='none' style='stroke:var(--brand)' stroke-width='2' stroke-linecap='round' opacity='.8'/>";
    [1, 2, 4, 7, 15, 30].forEach(function (t) { var rr = Math.exp(-t / 6.2); svg += "<circle cx='" + X(t).toFixed(1) + "' cy='" + Y(rr).toFixed(1) + "' r='4' fill='#fff' style='stroke:#f59e0b' stroke-width='2'/>"; });
    svg += "<text x='" + (W - padR) + "' y='14' font-size='8.5' style='fill:var(--muted)' text-anchor='end'>橙点 = 复习日</text></svg>";
    svg += "<p class='muted' style='font-size:12px;margin:8px 0 0'>不复习的话，记忆 5 天后约剩 45%；在橙点按时复习，遗忘会明显变慢。</p>";
    mc.innerHTML = svg;
  }

  /* 最近动态 */
  var acts = stats.recent || [];
  document.getElementById("actList").innerHTML = acts.length ? acts.map(function (a) {
    var d = new Date(a.at);
    var hm = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    var pct = a.total ? Math.round(a.correct / a.total * 100) : 0;
    return "<div class='act-item'><span class='act-ico'>" + (TYPE_ICON[a.type] || "📝") + "</span><div style='flex:1'><div style='font-weight:700'>" + s(a.type || "练习") + (a.meta ? " · " + s(a.meta) : "") + "</div><div class='muted' style='font-size:12px'>" + BH.fmtDateCN(a.at) + " " + hm + (a.total ? " · 得分 " + pct + "%" : "") + "</div></div></div>";
  }).join("") : "<div class='empty-note'>暂无动态，先完成一次练习吧</div>";

  /* 错题本 */
  var wrongBox = document.getElementById("wrongBox");
  (async function () {
    if (!st.wrong.length) { wrongBox.innerHTML = "<div class='empty-note'>🎉 错题本是空的，说明你掌握得很好！</div>"; return; }
    var rows = (await BH.api("/api/words/random", { method: "POST", body: { size: 80, onlyWrong: true, wrong: st.wrong } })).rows;
    var map = {};
    rows.forEach(function (r) { map[r.w.toLowerCase()] = r; });
    var list = st.wrong.map(function (w) { return map[w.toLowerCase()] ? map[w.toLowerCase()] : { w: w, m: "", f: "" }; });
    wrongBox.innerHTML = "<div class='word-tiles'>" + list.map(function (w) {
      return "<div class='word-tile' data-w='" + s(w.w) + "' title='点击移除'><span class='wt-en'>" + s(w.w) + "</span> <span class='wt-ipa muted'>" + s(w.f || "") + "</span><div class='wt-m'>" + s(w.m || "") + "</div><span class='wt-state'>✗</span></div>";
    }).join("") + "</div><p class='muted' style='font-size:12px;margin-top:10px'>点击单词可从错题本移除；掌握后系统也会自动移出。</p>";
    wrongBox.querySelectorAll(".word-tile").forEach(function (tile) {
      tile.onclick = async function () {
        var w = tile.getAttribute("data-w");
        try {
          await BH.authed("/api/me/wrong/" + encodeURIComponent(w), { method: "DELETE" });
          BH.toast("已从错题本移除：" + w);
          BH.refresh();
        } catch (e) { BH.toast(e.message); }
      };
    });
  })();

  /* 账号弹窗 */
  function openAuth() {
    BH.modal(
      '<h3>🔐 注册 / 登录博浩账号</h3><p class="muted" style="font-size:13px">' + (BH.STATIC ? "本机模拟账号仅保存于当前浏览器；注册会自动迁移游客记录。" : "注册后学习记录可跨设备同步，游客数据将自动迁移到新账号。") + '</p>' +
      '<div class="field"><label class="f-label">用户名（3-20 位字母/数字/下划线）</label><input type="text" id="auUser" placeholder="如 wbh"></div>' +
      '<div class="field"><label class="f-label">昵称（可选）</label><input type="text" id="auName" placeholder="你的名字"></div>' +
      '<div class="field"><label class="f-label">密码（至少 6 位）</label><input type="password" id="auPass" placeholder="••••••"></div>' +
      '<div class="btn-row"><button class="btn btn-primary" id="auReg">注册新账号</button><button class="btn btn-ghost" id="auLogin">登录已有账号</button></div>' +
      '<p class="muted" style="font-size:12px;margin:10px 0 0">注册后将自动迁移你的游客记录 ✅</p>'
    );
    document.getElementById("auReg").onclick = function () { doAuth("/api/auth/register"); };
    document.getElementById("auLogin").onclick = function () { doAuth("/api/auth/login"); };
    async function doAuth(path) {
      var u = document.getElementById("auUser").value.trim().toLowerCase();
      var p = document.getElementById("auPass").value;
      var n = document.getElementById("auName") ? document.getElementById("auName").value.trim() : "";
      if (!u || !p) { BH.toast("请填写用户名和密码"); return; }
      try {
        var d = await BH.api(path, { method: "POST", body: path.indexOf("register") > -1 ? { username: u, password: p, name: n } : { username: u, password: p } });
        BH.setSession(d.token, d.user);
        BH.closeModal();
        BH.toast("欢迎，" + (d.user.name || d.user.username) + "！");
        BH.refresh();
      } catch (e) { BH.toast(e.message); }
    }
  }
  function openChangePw() {
    BH.modal(
      '<h3>🔑 修改密码</h3>' +
      '<div class="field"><label class="f-label">原密码</label><input type="password" id="pwOld"></div>' +
      '<div class="field"><label class="f-label">新密码（至少 6 位）</label><input type="password" id="pwNew"></div>' +
      '<div class="btn-row"><button class="btn btn-primary" id="pwGo">确认修改</button></div>'
    );
    document.getElementById("pwGo").onclick = async function () {
      try {
        await BH.authed("/api/me/password", { method: "POST", body: { old: document.getElementById("pwOld").value, new: document.getElementById("pwNew").value } });
        BH.closeModal(); BH.toast("密码已更新 ✓");
      } catch (e) { BH.toast(e.message); }
    };
  }
  renderClass();
  async function renderClass() {
    var wrap = document.getElementById("clsWrap"); if (!wrap) return;
    if (BH.STATIC) { wrap.innerHTML = "<div class='panel'><h3>🏫 班级 / 组队</h3><p class='muted' style='margin:0'>班级组队需要“真账号”（动态版）功能：请打开动态版注册后使用，可让老师建班、学生加入、查看学情。</p></div>"; return; }
    try {
      var info = await BH.authed("/api/me/class");
      if (!info.joined) {
        wrap.innerHTML = "<div class='panel'><h3>🏫 班级 / 组队</h3><p class='muted' style='margin:0 0 10px'>老师可创建班级生成“班级码”，学生输入班级码加入，老师可查看成员学习概况。</p>" +
          "<div class='toolbar'><input type='text' id='clsCode' placeholder='输入班级码，如 BHXXXX' maxlength='8' style='max-width:210px'><button class='btn btn-primary btn-sm' id='clsJoin'>加入班级</button></div>" +
          "<div class='hr-grad' style='margin:14px 0'></div>" +
          "<div class='toolbar'><input type='text' id='clsName' placeholder='新班级名称（可选）' style='max-width:210px'><button class='btn btn-soft btn-sm' id='clsCreate'>✚ 创建班级</button></div>" +
          "<p class='muted' style='font-size:12px;margin:8px 0 0'>创建后你就是班级老师，可查看成员概览。</p></div>";
        document.getElementById("clsJoin").onclick = async function () { var code = document.getElementById("clsCode").value.trim(); if (!code) { BH.toast("请输入班级码"); return; } try { await BH.authed("/api/me/class/join", { method: "POST", body: { code: code } }); BH.toast("已加入班级 ✅"); renderClass(); } catch (e) { BH.toast(e.message); } };
        document.getElementById("clsCreate").onclick = async function () { var name = document.getElementById("clsName").value.trim(); try { var r = await BH.authed("/api/me/class/create", { method: "POST", body: { name: name } }); BH.toast("班级已创建，班级码：" + r.code); renderClass(); } catch (e) { BH.toast(e.message); } };
      } else {
        var j = info.joined;
        wrap.innerHTML = "<div class='panel'><h3>🏫 我的班级</h3><p style='margin:0 0 6px'><b>" + s(j.name) + "</b> <span class='tag'>班级码：" + s(j.code) + "</span> " + (j.isTeacher ? "<span class='badge green'>我是老师</span>" : "<span class='tag'>我是学生</span>") + "</p>" +
          (j.isTeacher ? "<div class='btn-row'><button class='btn btn-soft btn-sm' id='clsMembers'>👥 查看成员学情</button></div><div id='clsMemberList'></div>" : "<p class='muted' style='font-size:12px;margin:0'>努力打卡、认真学习，让老师看到你的进步吧！</p>") + "</div>";
        var mb = document.getElementById("clsMembers");
        if (mb) mb.onclick = async function () { try { var m = await BH.authed("/api/me/class/members"); var box = document.getElementById("clsMemberList"); box.innerHTML = "<div class='table-wrap' style='margin-top:10px'><table><thead><tr><th>成员</th><th>打卡</th><th>掌握词</th></tr></thead><tbody>" + m.rows.map(function (r) { return "<tr><td>" + s(r.name) + "</td><td>" + r.checkins + "</td><td>" + r.known + "</td></tr>"; }).join("") + "</tbody></table></div>"; } catch (e) { BH.toast(e.message); } };
      }
    } catch (e) { wrap.innerHTML = "<div class='panel'><h3>🏫 班级 / 组队</h3><p class='muted' style='margin:0'>加载失败：" + s(e.message) + "</p></div>"; }
  }

});