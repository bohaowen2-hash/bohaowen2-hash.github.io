/* ============================================================
   博浩英语 · 全站 AI 老师（多模型 / 多模态 / 记忆 / 站内检索 / 联网 / 深度思考）
   Key 仅保存在本机浏览器（localStorage），不上传我们服务器。
   ============================================================ */
(function () {
  "use strict";
  var CFG_KEY = "bh-ai-cfg", HIST_PREFIX = "bh-ai-hist-";
  var PRESETS = {
    openrouter: { name: "OpenRouter（推荐·多模型+联网）", base: "https://openrouter.ai/api/v1", model: "openai/gpt-4o-mini" },
    openai: { name: "OpenAI 官方", base: "https://api.openai.com/v1", model: "gpt-4o-mini" },
    deepseek: { name: "DeepSeek 官方（深度思考）", base: "https://api.deepseek.com/v1", model: "deepseek-reasoner" },
    custom: { name: "自定义 OpenAI 兼容接口", base: "", model: "" }
  };
  var cfg = { preset: "openrouter", base: PRESETS.openrouter.base, model: PRESETS.openrouter.model, key: "", deep: true, web: false, site: true };
  try { var saved = JSON.parse(localStorage.getItem(CFG_KEY) || "null"); if (saved) cfg = Object.assign(cfg, saved); } catch (e) {}
  var st = { mode: "general", busy: false, atts: [], dataCache: {} };

  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) {} }
  function hist() { try { return JSON.parse(localStorage.getItem(HIST_PREFIX + st.mode) || "[]"); } catch (e) { return []; } }
  function setHist(a) { try { localStorage.setItem(HIST_PREFIX + st.mode, JSON.stringify(a.slice(-60))); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function mdLite(s) {
    return esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  /* ---------- 站内检索（RAG） ---------- */
  async function loadData(name) {
    if (st.dataCache[name]) return st.dataCache[name];
    try { var r = await fetch("data/" + name + ".json"); st.dataCache[name] = r.ok ? await r.json() : null; } catch (e) { st.dataCache[name] = null; }
    return st.dataCache[name];
  }
  function tokens(q) {
    var out = [], m = String(q).toLowerCase().match(/[a-z]{2,}|[\u4e00-\u9fa5]{2,}/g) || [];
    m.forEach(function (t) { if (t.length > 2 && /^[a-z]+$/.test(t)) out.push(t); else if (/[\u4e00-\u9fa5]/.test(t)) { for (var i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2)); } });
    return out.slice(0, 12);
  }
  async function siteContext(q) {
    if (!cfg.site) return "";
    var toks = tokens(q), picked = [];
    var words = await loadData("words");
    if (words && toks.length) {
      var hit = 0;
      for (var i = 0; i < words.length && hit < 6 && i < words.length; i++) {
        var w = words[i], hay = (w.w + " " + w.m).toLowerCase();
        if (toks.some(function (t) { return hay.indexOf(t) > -1; })) { picked.push("【词汇】" + w.w + " " + (w.f || "") + " " + (w.p || "") + " " + w.m + (w.ex ? " 例：" + w.ex : "")); hit++; }
      }
    }
    var content = await loadData("content");
    if (content && toks.length) {
      var cats = Object.keys(content), c = 0;
      for (var ci = 0; ci < cats.length && c < 6; ci++) {
        var arr = content[cats[ci]] || [];
        for (var j = 0; j < arr.length && j < 80 && c < 6; j++) {
          var it = arr[j], hay2 = ((it.title || "") + " " + JSON.stringify(it.data || {})).toLowerCase();
          if (toks.some(function (t) { return hay2.indexOf(t) > -1; })) { picked.push("【素材·" + cats[ci] + "】" + (it.title || "") + "：" + JSON.stringify(it.data || {}).slice(0, 400)); c++; }
        }
      }
    }
    var exams = await loadData("exams");
    if (exams && /真题|真题库|历年|套题/.test(q)) picked.push("【真题库】站内收录 83 套 2012–2025 六级真题 PDF，可在“备考→真题库”查看全文/题干/分题。");
    return picked.length ? "以下是本站可调用的资料（供参考，可自行决定是否使用）：\n" + picked.slice(0, 10).join("\n") : "";
  }

  /* ---------- UI ---------- */
  var el = {};
  function mountUI() {
    var fab = document.createElement("button");
    fab.className = "ai-fab"; fab.id = "aiFab"; fab.textContent = "🤖 AI 老师";
    document.body.appendChild(fab);
    var d = document.createElement("aside");
    d.className = "ai-drawer"; d.id = "aiDrawer";
    d.innerHTML =
      '<div class="ai-head"><span style="font-size:20px">🤖</span><h3>AI 老师</h3><span class="sp"></span>' +
      '<button class="icon-btn" id="aiCfgBtn" title="设置模型">⚙️</button><button class="icon-btn" id="aiClose" title="关闭">✕</button></div>' +
      '<div class="ai-mode" id="aiMode"></div>' +
      '<div class="ai-set" id="aiSet">' +
        '<div class="row"><label>服务商</label><select id="aiPreset"></select></div>' +
        '<div class="row"><label>接口地址</label><input type="text" id="aiBase" placeholder="https://.../v1"></div>' +
        '<div class="row"><label>模型名</label><input type="text" id="aiModel" placeholder="例如 openai/gpt-4o-mini"></div>' +
        '<div class="row"><label>API Key</label><input type="password" id="aiKey" placeholder="sk-...（仅存本机）"></div>' +
        '<p class="ai-note">🔐 Key 只保存在你自己的浏览器（localStorage），请求直接发给你选择的模型服务商；请使用限额 Key。<br>💡 模型是否支持图片/文件/联网取决于你选的服务商与模型（OpenRouter 支持联网后缀 :online）。</p>' +
        '<div class="btn-row"><button class="btn btn-soft btn-sm" id="aiSave">保存设置</button><button class="btn btn-ghost btn-sm" id="aiClearMem">🧹 清空本模式记忆</button></div>' +
      '</div>' +
      '<div class="ai-chat" id="aiChat"></div>' +
      '<div class="ai-foot"><div class="ai-chips" id="aiChips"></div>' +
        '<div class="ai-tools">' +
          '<label><input type="checkbox" id="aiDeep"> 🧠 深度思考</label>' +
          '<label><input type="checkbox" id="aiWeb"> 🌐 联网搜索</label>' +
          '<label><input type="checkbox" id="aiSite"> 📚 站内资料</label>' +
          '<label style="cursor:pointer">📷 拍照<input type="file" id="aiCam" accept="image/*" capture="environment" style="display:none"></label>' +
          '<label style="cursor:pointer">🖼️ 相册<input type="file" id="aiImg" accept="image/*" multiple style="display:none"></label>' +
          '<label style="cursor:pointer">📎 文件<input type="file" id="aiFile" accept=".txt,.md,.csv,.json,.html,.js,.css" multiple style="display:none"></label>' +
        '</div>' +
        '<div class="ai-input"><textarea id="aiText" placeholder="输入问题…（Enter 发送，Shift+Enter 换行）"></textarea><button class="btn btn-primary ai-send" id="aiSend">发送</button></div></div>';
    document.body.appendChild(d);
    el = { fab: fab, drawer: d, chat: d.querySelector("#aiChat"), text: d.querySelector("#aiText"), chips: d.querySelector("#aiChips") };
    fab.onclick = function () { open(guessMode()); };
    d.querySelector("#aiClose").onclick = function () { d.classList.remove("open"); };
    d.querySelector("#aiCfgBtn").onclick = function () { d.querySelector("#aiSet").classList.toggle("show"); };
    d.querySelector("#aiSave").onclick = function () { readCfg(); saveCfg(); BH.toast("AI 设置已保存 ✓"); };
    d.querySelector("#aiClearMem").onclick = function () { setHist([]); render(); BH.toast("已清空本模式记忆"); };
    el.text.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });
    d.querySelector("#aiSend").onclick = send;
    bindAttach("#aiCam", "image"); bindAttach("#aiImg", "image"); bindAttach("#aiFile", "file");
    var p = d.querySelector("#aiPreset");
    p.innerHTML = Object.keys(PRESETS).map(function (k) { return "<option value='" + k + "'>" + PRESETS[k].name + "</option>"; }).join("");
    p.onchange = function () { var pr = PRESETS[p.value]; if (pr && p.value !== "custom") { d.querySelector("#aiBase").value = pr.base; d.querySelector("#aiModel").value = pr.model; } };
    ["aiDeep", "aiWeb", "aiSite"].forEach(function (id) { d.querySelector("#" + id).onchange = function () { readCfg(); saveCfg(); }; });
    fillCfg(); render();
  }
  function fillCfg() {
    var d = el.drawer; if (!d) return;
    d.querySelector("#aiPreset").value = cfg.preset; d.querySelector("#aiBase").value = cfg.base; d.querySelector("#aiModel").value = cfg.model; d.querySelector("#aiKey").value = cfg.key;
    d.querySelector("#aiDeep").checked = !!cfg.deep; d.querySelector("#aiWeb").checked = !!cfg.web; d.querySelector("#aiSite").checked = !!cfg.site;
  }
  function readCfg() {
    var d = el.drawer;
    cfg.preset = d.querySelector("#aiPreset").value; cfg.base = d.querySelector("#aiBase").value.trim().replace(/\/+$/, ""); cfg.model = d.querySelector("#aiModel").value.trim(); cfg.key = d.querySelector("#aiKey").value.trim();
    cfg.deep = d.querySelector("#aiDeep").checked; cfg.web = d.querySelector("#aiWeb").checked; cfg.site = d.querySelector("#aiSite").checked;
  }
  function bindAttach(sel, kind) {
    var inp = el.drawer.querySelector(sel);
    inp.onchange = function () {
      Array.prototype.forEach.call(inp.files || [], function (f) {
        if (kind === "image") { var r = new FileReader(); r.onload = function () { st.atts.push({ type: "image", name: f.name, data: r.result }); renderChips(); }; r.readAsDataURL(f); }
        else { var r2 = new FileReader(); r2.onload = function () { st.atts.push({ type: "text", name: f.name, data: String(r2.result).slice(0, 8000) }); renderChips(); }; r2.readAsText(f); }
      });
      inp.value = "";
    };
  }
  function renderChips() {
    el.chips.innerHTML = st.atts.map(function (a, i) { return "<span class='ai-chip'>" + (a.type === "image" ? "🖼️ " : "📎 ") + esc(a.name) + "<button data-i='" + i + "'>✕</button></span>"; }).join("");
    el.chips.querySelectorAll("button").forEach(function (b) { b.onclick = function () { st.atts.splice(parseInt(b.getAttribute("data-i"), 10), 1); renderChips(); }; });
  }
  function guessMode() { var h = location.hash || ""; if (/writing/.test(h)) return "writing"; if (/translation/.test(h)) return "translation"; return "general"; }
  var MODES = { general: "通用辅导", writing: "作文批改", translation: "翻译批改" };
  function modeButtons() {
    var box = el.drawer.querySelector("#aiMode");
    box.innerHTML = Object.keys(MODES).map(function (k) { return "<button data-m='" + k + "' class='" + (st.mode === k ? "on" : "") + "'>" + MODES[k] + "</button>"; }).join("");
    box.querySelectorAll("button").forEach(function (b) { b.onclick = function () { st.mode = b.getAttribute("data-m"); setHist(hist()); render(); modeButtons(); }; });
  }
  function render() {
    modeButtons();
    var h = hist(); var box = el.chat;
    box.innerHTML = h.length ? "" : "<div class='ai-msg sys'>我是你的 AI 英语老师：可批改作文/翻译、讲解词汇长难句、搜索站内资料与联网（按你的设置）。Key 是你自己的，能力取决于所选模型。</div>";
    h.forEach(function (m) { box.appendChild(msgEl(m)); });
    box.scrollTop = box.scrollHeight;
  }
  function msgEl(m) {
    var d = document.createElement("div");
    d.className = "ai-msg " + (m.role === "user" ? "user" : m.role === "system" ? "sys" : "ai");
    var html = "";
    if (m.think) html += "<details class='ai-think'><summary>🧠 思考过程</summary>" + esc(m.think) + "</details>";
    if (m.images && m.images.length) html += m.images.map(function (u) { return "<img src='" + u + "'>"; }).join("");
    html += mdLite(m.content || "");
    d.innerHTML = html;
    return d;
  }
  function open(mode) { if (!document.getElementById("aiDrawer")) mountUI(); st.mode = mode || guessMode(); render(); el.drawer.classList.add("open"); }

  /* ---------- 发送 ---------- */
  async function send() {
    if (st.busy) return;
    readCfg(); saveCfg();
    var text = el.text.value.trim();
    if (!text && !st.atts.length) { BH.toast("请输入内容或添加图片/文件"); return; }
    if (!cfg.key) { el.drawer.querySelector("#aiSet").classList.add("show"); BH.toast("请先在 ⚙️ 里填写你的 API Key"); return; }
    var images = st.atts.filter(function (a) { return a.type === "image"; }).map(function (a) { return a.data; });
    var fileTexts = st.atts.filter(function (a) { return a.type === "text"; }).map(function (a) { return "【文件：" + a.name + "】\n" + a.data; }).join("\n\n");
    var h = hist();
    h.push({ role: "user", content: text, images: images });
    setHist(h); render(); el.text.value = ""; st.atts = []; renderChips();
    var box = el.chat; var typing = document.createElement("div"); typing.className = "ai-msg ai"; typing.innerHTML = "<span class='ai-typing'></span>"; box.appendChild(typing); box.scrollTop = box.scrollHeight;
    st.busy = true;
    try {
      var sys = "你是博浩英语(wbh)的 AI 英语老师。保持专业、直接、可用；默认中文解释、英文示例。" + (st.mode === "writing" ? "当前任务：批改作文，给出分项评分、逐句修改建议与高分改写。" : st.mode === "translation" ? "当前任务：批改翻译，指出错误、给出更地道的译文与讲评。" : "");
      var ctx = await siteContext(text);
      if (ctx) sys += "\n\n" + ctx;
      var messages = [{ role: "system", content: sys }];
      h.slice(-20).forEach(function (m) {
        if (m.role === "user" && m.images && m.images.length) {
          var parts = [{ type: "text", text: m.content || "" }];
          m.images.forEach(function (u) { parts.push({ type: "image_url", image_url: { url: u } }); });
          messages.push({ role: "user", content: parts });
        } else if (m.role === "user" || m.role === "assistant") {
          messages.push({ role: m.role, content: m.content || "" });
        }
      });
      if (fileTexts) messages.push({ role: "user", content: "以下是用户上传的文件内容，请在回答时参考：\n" + fileTexts });
      var model = cfg.model;
      var body = { model: cfg.web && /openrouter\.ai/.test(cfg.base) && model.indexOf(":online") < 0 ? model + ":online" : model, messages: messages, stream: true };
      if (cfg.deep && /openrouter\.ai/.test(cfg.base)) body.reasoning = { effort: "high" };
      if (cfg.deep && /api\.openai\.com/.test(cfg.base) && /^(o\d|gpt-5)/.test(model)) body.reasoning_effort = "high";
      var res = await fetch(cfg.base + "/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfg.key },
        body: JSON.stringify(body)
      });
      if (!res.ok) { var errTxt = await res.text(); throw new Error("HTTP " + res.status + "：" + errTxt.slice(0, 300)); }
      var answer = { role: "assistant", content: "", think: "" };
      var holder = msgEl(answer); box.replaceChild(holder, typing); box.scrollTop = box.scrollHeight;
      var reader = res.body.getReader(), dec = new TextDecoder(), buf = "";
      while (true) {
        var rd = await reader.read(); if (rd.done) break;
        buf += dec.decode(rd.value, { stream: true });
        var parts = buf.split("\n"); buf = parts.pop();
        parts.forEach(function (line) {
          line = line.trim(); if (!line.indexOf("data:")) line = line.slice(5).trim();
          if (!line || line === "[DONE]") return;
          try {
            var j = JSON.parse(line), dl = (j.choices && j.choices[0] && j.choices[0].delta) || {};
            if (dl.reasoning_content || dl.reasoning) answer.think += (dl.reasoning_content || dl.reasoning);
            if (dl.content) answer.content += dl.content;
          } catch (e) {}
        });
        holder.innerHTML = (answer.think ? "<details class='ai-think'><summary>🧠 思考过程</summary>" + esc(answer.think) + "</details>" : "") + mdLite(answer.content);
        box.scrollTop = box.scrollHeight;
      }
      h.push({ role: "assistant", content: answer.content, think: answer.think });
      setHist(h);
    } catch (e) {
      if (typing.parentNode) typing.remove();
      var hint = /Failed to fetch|NetworkError|CORS/i.test(e.message) ? "（可能是服务商不允许浏览器直连/CORS 或网络不通：可换 OpenRouter，或把接口换成支持浏览器调用的服务商）" : "";
      BH.toast("AI 请求失败：" + e.message.slice(0, 120) + hint, 6000);
    }
    st.busy = false;
  }

  /* 自动挂载 & 页面按钮注入 */
  function boot() {
    if (!document.getElementById("aiDrawer")) mountUI();
    var h = location.hash || "#/";
    if (/writing/.test(h)) {
      var box = document.querySelector("#view .sec-head.left");
      if (box && !document.getElementById("aiOpenWriting")) { var b = document.createElement("button"); b.id = "aiOpenWriting"; b.className = "btn btn-primary"; b.style.marginTop = "10px"; b.textContent = "🤖 打开 AI 老师批改作文"; b.onclick = function () { open("writing"); }; box.parentNode.insertBefore(b, box.nextSibling); }
    }
    if (/translation/.test(h)) {
      var box2 = document.querySelector("#view .sec-head.left");
      if (box2 && !document.getElementById("aiOpenTrans")) { var b2 = document.createElement("button"); b2.id = "aiOpenTrans"; b2.className = "btn btn-primary"; b2.style.marginTop = "10px"; b2.textContent = "🤖 打开 AI 老师批改翻译"; b2.onclick = function () { open("translation"); }; box2.parentNode.insertBefore(b2, box2.nextSibling); }
    }
  }
  window.addEventListener("hashchange", function () { setTimeout(boot, 300); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  setInterval(boot, 1500);
  window.BH = window.BH || {}; BH.aiUI = { open: open, boot: boot };
})();