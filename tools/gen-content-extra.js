/* 博浩英语 CET-6 · 内容扩充生成器：翻译题库(300) / 作文话题归类 / 学习视频 */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");

/* ---------- 主题短语库（中文+英文一一对应） ---------- */
const THEMES = [
  { name: "教育", A: [["在线教育","online education"],["终身学习","lifelong learning"],["素质教育","quality-oriented education"],["职业教育","vocational education"],["校园阅读","campus reading"],["课外活动","extracurricular activities"],["自主学习","self-directed learning"],["大学生创业","college students' entrepreneurship"],["传统文化进校园","traditional culture on campus"],["数字课堂","digital classrooms"]] },
  { name: "科技", A: [["人工智能","artificial intelligence"],["移动支付","mobile payment"],["共享经济","the sharing economy"],["5G 网络","5G networks"],["大数据","big data"],["云计算","cloud computing"],["智慧城市","smart cities"],["无人驾驶","self-driving cars"],["网络购物","online shopping"],["短视频","short videos"]] },
  { name: "环境", A: [["垃圾分类","waste sorting"],["低碳生活","low-carbon lifestyle"],["可再生能源","renewable energy"],["新能源汽车","new-energy vehicles"],["植树造林","afforestation"],["节约用水","water conservation"],["绿色出行","green travel"],["空气污染治理","air pollution control"],["野生动物保护","wildlife protection"],["碳减排","carbon emission reduction"]] },
  { name: "文化", A: [["中国书法","Chinese calligraphy"],["传统节日","traditional festivals"],["非物质文化遗产","intangible cultural heritage"],["丝绸之路","the Silk Road"],["国学热","the craze for Chinese classics"],["汉服文化","hanfu culture"],["茶文化","tea culture"],["中国功夫","Chinese kung fu"],["博物馆热","the museum craze"],["国潮","China-chic trends"]] },
  { name: "社会", A: [["人口老龄化","population aging"],["乡村振兴","rural revitalization"],["医养结合","integrated medical and elderly care"],["体育健身","physical exercise"],["青年就业","youth employment"],["志愿服务","volunteer service"],["全民阅读","nationwide reading"],["文明旅游","civilized tourism"],["心理健康","mental health"],["社区养老","community-based elderly care"]] }
];
const TARGETS = [
  ["生活质量","the quality of life"],["经济发展","economic development"],["社会进步","social progress"],
  ["个人成长","personal growth"],["家庭幸福","family happiness"],["文化自信","cultural confidence"],
  ["环境保护","environmental protection"],["创新精神","the spirit of innovation"],["公共卫生","public health"],
  ["代际关系","intergenerational relations"],["城市发展","urban development"],["幸福指数","the happiness index"]
];

/* 句式模板（中文含占位 {A}/{B}） */
const FRAMES = [
  { cn: "如今，{A}已经成为人们日常生活中不可或缺的一部分。", en: "Nowadays, {A} has become an indispensable part of people's daily life.", tip: "不可或缺 = indispensable；句式：has become…" },
  { cn: "随着社会的发展，越来越多的人开始关注{A}。", en: "With the development of society, more and more people have begun to pay attention to {A}.", tip: "随着…用 With…；越来越多 = more and more" },
  { cn: "不可否认，{A}既带来了机遇，也带来了挑战。", en: "There is no denying that {A} brings both opportunities and challenges.", tip: "不可否认 = There is no denying that…；both…and…" },
  { cn: "我们应该采取有效措施，促进{A}的发展。", en: "We should take effective measures to promote the development of {A}.", tip: "采取有效措施 = take effective measures to…" },
  { cn: "{A}对{B}有着深远的影响。", en: "{A} has a profound impact on {B}.", tip: "对…有深远影响 = have a profound impact on…" },
  { cn: "只有共同努力，我们才能更好地应对{A}带来的挑战。", en: "Only through joint efforts can we better cope with the challenges brought by {A}.", tip: "只有…才…用倒装 Only through… can we…" }
];

const quiz = [];
let n = 0;
THEMES.forEach(theme => {
  // F1-F4：每个 A 各 1 条 → 4*10=40
  theme.A.forEach((pair, i) => {
    [0, 1, 2, 3].forEach(fi => {
      n++;
      quiz.push({ title: "模拟句 " + String(n).padStart(3, "0") + " · " + theme.name, data: {
        cn: FRAMES[fi].cn.replace("{A}", pair[0]),
        ref: FRAMES[fi].en.replace("{A}", pair[1]),
        tips: FRAMES[fi].tip, source: "sim" } });
    });
  });
  // F5-F6：A × 目标 各 10 条 → 2*10=20
  theme.A.forEach((pair, i) => {
    const t = TARGETS[(i * 5 + THEMES.indexOf(theme) * 3) % TARGETS.length];
    n++;
    quiz.push({ title: "模拟句 " + String(n).padStart(3, "0") + " · " + theme.name, data: {
      cn: FRAMES[4].cn.replace("{A}", pair[0]).replace("{B}", t[0]),
      ref: FRAMES[4].en.replace("{A}", pair[1]).replace("{B}", t[1]),
      tips: FRAMES[4].tip, source: "sim" } });
    n++;
    quiz.push({ title: "模拟句 " + String(n).padStart(3, "0") + " · " + theme.name, data: {
      cn: FRAMES[5].cn.replace("{A}", pair[0]),
      ref: FRAMES[5].en.replace("{A}", pair[1]),
      tips: FRAMES[5].tip, source: "sim" } });
  });
});

/* 近年六级作文话题归类（原创概括，非真题原文） */
const essayTheme = [
  { title: "🗣️ 现象/观点类（最高频）", data: { group: "现象观点", note: "历年真题最常考：给出现象，要求谈看法或利弊。", topics: [["大学生是否应做兼职","part-time jobs for college students"],["网络购物 vs 实体店","online shopping vs physical stores"],["是否支持“躺平”心态","the idea of lying flat"],["考研还是就业","postgraduate study or employment"],["大学生使用手机利弊","smartphones on campus"],["AI 对学习的影响","AI and learning"]] } },
  { title: "📊 图表/数据类", data: { group: "图表作文", note: "近年多次回归图表：先描述趋势，再分析原因与启示。", topics: [["大学生阅读量变化","changes in students' reading"],["短视频使用时长","time spent on short videos"],["外卖行业增长","the rise of food delivery"]] } },
  { title: "✉️ 应用/书信类", data: { group: "书信应用", note: "邀请信/建议信/感谢信等，注意格式与语气。", topics: [["邀请外教参加文化节","invite a foreign teacher"],["给学弟学妹的备考建议","study advice for juniors"],["感谢信：感谢同学帮助","thank-you letter"]] } },
  { title: "💬 引言/谚语类", data: { group: "引言谚语", note: "给出谚语/引言，先解释再论证。", topics: [["Practice makes perfect","熟能生巧"],["Where there is a will, there is a way","有志者事竟成"],["Actions speak louder than words","行动胜于言语"]] } }
];

/* 学习视频（可在后台改为具体视频链接） */
const video = [
  { title: "六级翻译真题精讲合集", data: { url: "https://search.bilibili.com/all?keyword=六级翻译真题精讲", why: "看真题怎么考、怎么答，建立翻译题感。" } },
  { title: "六级翻译六大技巧速成", data: { url: "https://search.bilibili.com/all?keyword=六级翻译技巧", why: "主谓宾定位、词性转换、语序调整一次讲清。" } },
  { title: "六级作文高分模板课", data: { url: "https://search.bilibili.com/all?keyword=六级作文模板高分", why: "背框架 + 学会替换，考场直接套用。" } },
  { title: "六级听力精听跟读训练", data: { url: "https://search.bilibili.com/all?keyword=六级听力精听", why: "用真题音频做逐句精听与跟读。" } },
  { title: "六级阅读长难句拆解", data: { url: "https://search.bilibili.com/all?keyword=六级阅读长难句", why: "每天拆两句，阅读速度翻倍。" } },
  { title: "六级全套真题讲解", data: { url: "https://search.bilibili.com/all?keyword=六级真题讲解", why: "完整刷一套并复盘错因。" } }
];

const out = path.join(ROOT, "data/seed/parts/p4.json");
const p4 = { translationQuiz: quiz, essayTheme: essayTheme, video: video };
fs.writeFileSync(out, JSON.stringify(p4));
console.log("translationQuiz:", quiz.length, "essayTheme:", essayTheme.length, "video:", video.length);