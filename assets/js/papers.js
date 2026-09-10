/* 博浩英语 CET-6 · 历年真题库（独立板块） */
"use strict";
BH.reg("papers", async function (view) {
  var s = BH.esc, state = { list: [], year: "all", set: "all", page: 0, per: 15 };
  view.innerHTML =
    '<section class="section tight" style="padding-top:46px"><div class="container">' +
      '<div class="sec-head left"><span class="badge">📄 真题板块 · wbh</span>' +
      '<h2>历年六级真题库</h2><p>2012–2025 六级原卷 PDF + 对应答案解析 PDF。最新年份在前，可按年份与套数筛选。</p></div>' +
      '<div class="panel">' +
        '<div class="toolbar" style="margin-bottom:10px">' +
          '<label class="tag">年份</label><select id="ppYear"><option value="all">全部年份</option></select>' +
          '<label class="tag">套数</label><select id="ppSet"><option value="all">全部套</option><option value="1">第1套</option><option value="2">第2套</option><option value="3">第3套</option></select>' +
          '<span class="grow"></span><span class="tag" id="ppTotal"></span>' +
        '</div>' +
        '<div id="ppList" class="empty-note">加载真题索引…</div><div class="pager" id="ppPager" style="margin-top:12px"></div>' +
        '<p class="muted" style="font-size:12px;margin:12px 0 0">真题与答案解析均来自站主提供，仅供个人学习，请勿二次传播。个别套题若缺答案则不显示答案按钮。</p>' +
      '</div>' +
    '</div></section>';
  var list = [];
  try { list = await (await fetch("data/exams.json?v=20260911")).json(); } catch (e) { document.getElementById("ppList").innerHTML = "<div class='empty-note'>真题索引加载失败，请刷新重试</div>"; return; }
  list.sort(function (a, b) { return (b.year - a.year) || (b.month - a.month) || (b.set - a.set); });
  state.list = list;
  var ys = document.getElementById("ppYear"), years = {};
  list.forEach(function (e) { years[e.year] = 1; });
  ys.innerHTML = "<option value='all'>全部年份</option>" + Object.keys(years).sort(function(a,b){return b-a;}).map(function (y) { return "<option value='" + y + "'>" + y + "年</option>"; }).join("");
  ys.onchange = function () { state.year = ys.value; state.page = 0; draw(); };
  document.getElementById("ppSet").onchange = function () { state.set = this.value; state.page = 0; draw(); };
  function draw() {
    var rows = state.list.filter(function (e) { return (state.year === "all" || String(e.year) === state.year) && (state.set === "all" || String(e.set) === state.set); });
    var pages = Math.max(1, Math.ceil(rows.length / state.per));
    if (state.page >= pages) state.page = pages - 1;
    document.getElementById("ppTotal").textContent = "共 " + rows.length + " 套";
    var zone = document.getElementById("ppList");
    var slice = rows.slice(state.page * state.per, (state.page + 1) * state.per);
    zone.innerHTML = slice.length ? slice.map(function (e) {
      return "<div class='act-item'><span class='act-ico'>📄</span><div style='flex:1'><div style='font-weight:700'>" + e.year + "年" + e.month + "月 · 第" + e.set + "套</div><div class='muted' style='font-size:12px'>" + s(e.file) + "</div></div>" +
        "<a class='btn btn-soft btn-sm' target='_blank' rel='noopener' href='assets/exams/" + encodeURIComponent(e.file) + "'>📄 真题 PDF</a>" +
        (e.answer ? "<a class='btn btn-primary btn-sm' target='_blank' rel='noopener' href='assets/answers/" + encodeURIComponent(e.answer) + "'>✅ 答案解析</a>" : "") +
        "</div>";
    }).join("") : "<div class='empty-note'>没有匹配的真题，调整筛选条件试试</div>";
    var pg = document.getElementById("ppPager"); pg.innerHTML = "";
    var mk = function (label, p, on) { var b = document.createElement("button"); b.textContent = label; if (on) b.classList.add("on"); b.disabled = p === state.page; b.onclick = function () { state.page = p; draw(); }; pg.appendChild(b); };
    mk("‹", Math.max(0, state.page - 1));
    for (var i = 0; i < pages; i++) { if (pages > 15 && i > 3 && i < pages - 4 && Math.abs(i - state.page) > 3) continue; mk(String(i + 1), i, i === state.page); }
    mk("›", Math.min(pages - 1, state.page + 1));
  }
  draw();
});