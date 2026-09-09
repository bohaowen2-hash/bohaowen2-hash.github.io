/* 博浩英语 CET-6 · 内容引擎 v2：500 英文阅读 + 300 英文听力（多领域 / 句式轮换 / 乱序混合） */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");

/* 10 大领域：subject[e,z]，bene/conc/ex 为英文短语 */
const D = [
  { n: "政治", subs: [["open government","政务公开"],["public hearings","公众听证"],["digital governance","数字治理"],["civic education","公民教育"],["transparent budgeting","透明预算"],["grassroots democracy","基层民主"],["policy consultation","政策咨询"],["election transparency","选举透明"]],
    bene: ["strengthen public trust", "make decision-making more transparent", "improve the quality of public services", "encourage citizens to take part"],
    conc: ["complex procedures that are hard to follow", "unequal access to information", "the risk of superficial participation"],
    ex: ["A city council recently opened its budget meetings online, and attendance doubled.", "Several regions now publish policy drafts for public comment before final approval."] },
  { n: "经济", subs: [["the digital economy","数字经济"],["green finance","绿色金融"],["e-commerce platforms","电商平台"],["small business innovation","小微企业创新"],["the sharing economy","共享经济"],["smart agriculture","智慧农业"],["cross-border trade","跨境电商"],["regional economic cooperation","区域经济合作"]],
    bene: ["create new jobs", "improve business efficiency", "lower the cost of daily services", "boost balanced regional growth"],
    conc: ["widening gaps between large and small firms", "rising pressure on traditional industries", "unfair competition in some markets"],
    ex: ["Local farmers now sell fresh produce online, reaching customers in distant cities.", "A pilot loan programme for small businesses helped dozens of firms expand."] },
  { n: "军事", subs: [["defence modernisation","国防现代化"],["military-civilian integration","军民融合"],["cyber defence","网络防御"],["emergency response forces","应急救援力量"],["defence education","国防教育"],["military logistics","后勤保障"],["peacekeeping missions","维和行动"],["frontier technology","前沿军事科技"]],
    bene: ["strengthen national security", "improve emergency response capacity", "promote technological progress", "safeguard regional stability"],
    conc: ["high costs that strain limited budgets", "the risk of an arms race", "growing dependence on complex technology"],
    ex: ["Universities and research institutes now cooperate closely with the defence sector on new materials.", "National defence education weeks are held in many schools every year."] },
  { n: "社会", subs: [["community elderly care","社区养老"],["youth volunteering","青年志愿服务"],["digital government services","数字政务"],["urban reading rooms","城市书房"],["the night-market economy","夜市经济"],["accessible facilities","无障碍设施"],["second-hand platforms","二手平台"],["slow living","慢生活理念"]],
    bene: ["raise the quality of community life", "strengthen social trust", "offer more convenient public services", "enrich people's spare time"],
    conc: ["limited funding and staffing", "uneven coverage across regions", "the digital divide among older people"],
    ex: ["Neighbourhood reading rooms now stay open in the evening, drawing many residents.", "Volunteer groups organise weekly activities for children in local communities."] },
  { n: "科技", subs: [["artificial intelligence","人工智能"],["autonomous driving","自动驾驶"],["cloud computing","云计算"],["the Internet of Things","物联网"],["smart healthcare","智慧医疗"],["voice assistants","语音助手"],["renewable-energy storage","储能技术"],["digital twins","数字孪生"]],
    bene: ["make daily life more convenient", "raise work efficiency", "improve safety and accuracy", "drive industrial innovation"],
    conc: ["concerns over data privacy", "growing dependence on technology", "the widening digital divide"],
    ex: ["Hospitals use intelligent scheduling to shorten patients' waiting time.", "Factories deploy smart sensors to detect faults before they cause failures."] },
  { n: "文化", subs: [["traditional crafts","传统手工艺"],["heritage on campus","非遗进校园"],["museum night tours","博物馆夜游"],["ancient-book preservation","古籍保护"],["dialect preservation","方言保护"],["local opera","地方戏曲"],["tea culture","茶文化"],["China-chic design","国潮设计"]],
    bene: ["preserve cultural memory", "boost cultural confidence", "enrich people's spiritual life", "connect tradition with young audiences"],
    conc: ["over-commercialisation", "a shortage of skilled inheritors", "the risk of losing authenticity"],
    ex: ["A museum recently opened night tours with light shows, attracting thousands of young visitors.", "Craftsmen now teach traditional skills in schools through weekly workshops."] },
  { n: "环境", subs: [["waste sorting","垃圾分类"],["low-carbon travel","低碳出行"],["renewable energy","可再生能源"],["urban greening","城市绿化"],["wetland conservation","湿地保护"],["plastic-pollution control","塑料污染治理"],["green buildings","绿色建筑"],["biodiversity protection","生物多样性保护"]],
    bene: ["improve environmental quality", "reduce waste and emissions", "protect biodiversity", "promote green industries"],
    conc: ["high initial costs", "insufficient supporting facilities", "weak public participation in some areas"],
    ex: ["Several cities have turned unused rooftops into green gardens.", "Community members take part in regular river-cleaning activities."] },
  { n: "健康", subs: [["regular exercise","规律运动"],["a balanced diet","均衡膳食"],["sleep management","睡眠管理"],["mental-health education","心理健康教育"],["outdoor breaks","户外活动"],["community fitness stations","社区健身站"],["eye care","科学用眼"],["first-aid training","急救培训"]],
    bene: ["strengthen physical fitness", "improve mental well-being", "prevent chronic diseases", "build healthier daily habits"],
    conc: ["a lack of professional guidance", "limited time under heavy schedules", "difficulty keeping long-term habits"],
    ex: ["Schools now arrange longer outdoor breaks, and students report feeling more energetic.", "Community fitness stations offer simple equipment for older residents."] },
  { n: "教育", subs: [["online learning platforms","在线学习平台"],["lifelong learning","终身学习"],["vocational training","职业技能培训"],["digital classrooms","数字课堂"],["campus reading campaigns","校园阅读推广"],["study tours","研学旅行"],["home-school cooperation","家校共育"],["general education","通识教育"]],
    bene: ["widen access to knowledge", "develop self-directed learning", "strengthen practical skills", "support personalised development"],
    conc: ["over-dependence on screens", "uneven quality across programmes", "pressure on students' time"],
    ex: ["Remote classes allow students in rural areas to follow top teachers.", "Project-based courses help students apply what they learn to real problems."] },
  { n: "体育", subs: [["school sports","校园体育"],["national fitness programmes","全民健身"],["the ice-and-snow economy","冰雪经济"],["esports","电子竞技"],["traditional sports","传统体育"],["community marathons","社区马拉松"],["sports for seniors","老年健身"],["sports tourism","体育旅游"]],
    bene: ["improve public health", "foster teamwork and discipline", "boost related industries", "enrich leisure life"],
    conc: ["a lack of facilities in some areas", "the risk of over-competition", "uneven enthusiasm across age groups"],
    ex: ["Weekly community runs have become a habit for thousands of residents.", "Schools now include traditional sports such as shuttlecock in PE classes."] }
];

const OPENERS = [
  "In recent years,", "Across the globe,", "In many countries,", "Over the past decade,",
  "From classrooms to workplaces,", "For a growing number of people,", "As society continues to evolve,",
  "Amid rapid social change,", "In both urban and rural areas,", "In an era of constant transformation,",
  "Beyond conventional wisdom,", "Looking at everyday life,"
];
const CONNECT_BODY = [
  "From a historical perspective,", "Looking at how it developed,", "Tracing its early days,",
  "Considering its background,", "Examining its evolution,"
];
const CONNECT_BEN = [
  "Supporters are quick to point out that", "Advocates emphasise that", "Many observers note that",
  "Those in favour argue that", "It is widely believed that", "Proponents maintain that"
];
const CONNECT_CON = [
  "However, not everyone is convinced.", "Yet concerns have also been raised.", "Still, some voices of caution remain.",
  "On the other hand, critics warn that", "Meanwhile, a number of risks deserve attention.",
  "That said, the picture is not entirely positive."
];
const CONNECT_SOL = [
  "To address these challenges,", "Finding the right balance is essential.", "Experts suggest a multi-pronged approach.",
  "Practical solutions are emerging.", "Responsible planning is the key to progress."
];
const CONNECT_CONC = [
  "Looking ahead,", "In the long run,", "As experience accumulates,",
  "With continued effort,", "In the coming years,", "Given these trends,"
];

let seed = 987654321;
function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
function shuffleArr(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; } return b; }

const readings = [], listenings = [];
let rid = 0, lid = 0;
for (let pass = 0; pass < 8; pass++) {
  for (const dom of D) {
    for (let si = 0; si < dom.subs.length; si++) {
      const sub = dom.subs[si];
      if (rid >= 500 && lid >= 300) break;
      if (rid < 500) {
        const b0 = (si + pass) % dom.bene.length, b1 = (b0 + 1) % dom.bene.length, b2 = (b0 + 2) % dom.bene.length;
        const c0 = (si + pass) % dom.conc.length, c1 = (c0 + 1) % dom.conc.length;
        const e0 = (si + pass) % dom.ex.length, e1 = (e0 + 1) % dom.ex.length;
        const op = OPENERS[(rid * 7 + si) % OPENERS.length];
        const p1 = op + " the topic of " + sub[0] + " has drawn growing attention, becoming a lively subject of discussion in the field of " + dom.n.toLowerCase() + ".";
        const p2 = CONNECT_BODY[(rid + si) % CONNECT_BODY.length] + " the practice was once limited to a handful of pioneers. Over time, better conditions and wider public interest helped it spread, and today it touches the daily routines of ordinary people.";
        const p3 = CONNECT_BEN[(rid + si) % CONNECT_BEN.length] + " " + sub[0] + " can " + dom.bene[b0] + ". Beyond that, it helps " + dom.bene[b1] + ", which explains much of its popularity.";
        const p4 = "The impact is not merely theoretical. For instance, " + dom.ex[e0] + " Such real-world cases give people a clearer sense of what the change actually means.";
        const p5 = CONNECT_CON[(rid + si) % CONNECT_CON.length] + " There are worries about " + dom.conc[c0] + " and " + dom.conc[c1] + ". These concerns remind us that enthusiasm alone is not enough.";
        const p6 = CONNECT_SOL[(rid + si) % CONNECT_SOL.length] + " Clear rules and patient guidance are essential. At the same time, " + dom.ex[e1] + " These efforts suggest that progress is possible when planning keeps pace with practice.";
        const p7 = CONNECT_CONC[(rid + si) % CONNECT_CONC.length] + " " + sub[0] + " is likely to keep evolving. Whether it succeeds will depend less on fashion and more on how well innovation is combined with responsibility.";
        const passage = [p1, p2, p3, p4, p5, p6, p7].join("\n\n");
        const others = D.reduce((a, x) => a.concat(x.subs), []).filter(x => x[1] !== sub[1]);
        const ds = shuffleArr(others).slice(0, 3).map(x => x[0] + " is replacing " + sub[0] + " everywhere");
        const q1 = [sub[0] + " is attracting growing attention across society"].concat(ds);
        const q1s = shuffleArr(q1);
        readings.push({
          title: "模拟阅读 " + String(rid + 1).padStart(3, "0") + " · " + dom.n + " · " + sub[1],
          sub: "英文原创模拟 · " + dom.n + " 领域 · 博浩题库",
          data: { area: dom.n, passage, qs: [
            { q: "What is the passage mainly about?", opts: q1s, ans: q1s.indexOf(sub[0] + " is attracting growing attention across society"), ex: "The opening sentence introduces the growing attention given to " + sub[0] + "." },
            { q: "What benefit is mentioned in support of " + sub[0] + "?", opts: shuffleArr([dom.bene[b0], dom.bene[(b0 + 3) % dom.bene.length], dom.bene[(b0 + 1) % dom.bene.length], dom.conc[c1]]), ans: 0, ex: "The passage says it can \u201c" + dom.bene[b0] + "\u201d." },
            { q: "What concern is raised in the passage?", opts: shuffleArr([dom.conc[c0], dom.bene[b2], dom.bene[(b1 + 1) % dom.bene.length], dom.ex[e1]]), ans: 0, ex: "Concerns include \u201c" + dom.conc[c0] + "\u201d and \u201c" + dom.conc[c1] + "\u201d." },
            { q: "What is the author's overall attitude?", opts: shuffleArr(["balanced and rational", "strongly against", "overly optimistic", "indifferent"]), ans: 0, ex: "Both benefits and risks are discussed, so the attitude is balanced." },
            { q: "What does the author suggest about the future?", opts: shuffleArr(["innovation should be combined with responsibility", sub[0] + " will soon disappear", "no further discussion is needed", "only the government should decide"]), ans: 0, ex: "The final paragraph stresses combining innovation with responsibility." }
          ] }
        });
        rid++;
      }
      if (lid < 300) {
        const L_OP = ["Good morning, and welcome to the news.", "Welcome to today's news bulletin.", "Good afternoon. Here is the latest report.", "You are listening to our midday news update.", "Hello and thanks for tuning in.", "Good evening. Time for the evening headlines.", "Here is the news you need to know today.", "This is your daily news summary.", "Welcome back to our regular news hour.", "Good morning. Let us begin with the day's stories."];
        const L_END = ["That is all for today. Thank you for listening.", "Thank you for staying with us. Goodbye.", "That wraps up our report. See you next time.", "We hope you found the report useful. Goodbye.", "That brings us to the end of this edition.", "Stay tuned for more updates later today."];
        const op2 = L_OP[(lid * 3 + si) % L_OP.length];
        const bene2 = dom.bene[(si + lid) % dom.bene.length];
        const conc2 = dom.conc[(si + lid + 1) % dom.conc.length];
        const ex2 = dom.ex[(si + lid) % dom.ex.length];
        const text = op2 + " This week, growing attention has turned to " + sub[0] + ". Local authorities and schools are taking steps to support the practice, saying that it can help " + bene2 + ". " + ex2 + " Meanwhile, some experts warn about " + conc2 + ", and they call for careful planning and wider public involvement. " + L_END[(lid + si) % L_END.length];
        const others = D.reduce((a, x) => a.concat(x.subs), []).filter(x => x[1] !== sub[1]);
        const mainOpts = shuffleArr([sub[0]].concat(shuffleArr(others).slice(0, 3).map(x => x[0])));
        const benOpts = shuffleArr(dom.bene.slice());
        const conOpts = shuffleArr(dom.conc.slice());
        listenings.push({
          title: "模拟听力 " + String(lid + 1).padStart(3, "0") + " · " + dom.n + " · " + sub[1],
          sub: "英文原创模拟 · News Report · 博浩题库",
          data: { type: "news", text, qs: [
            { q: "What is the report mainly about?", opts: mainOpts, ans: mainOpts.indexOf(sub[0]), ex: "The report opens with the growing attention paid to " + sub[0] + "." },
            { q: "What benefit of " + sub[0] + " is mentioned?", opts: benOpts, ans: benOpts.indexOf(bene2), ex: "It says the practice can help \u201c" + bene2 + "\u201d." },
            { q: "What warning do the experts give?", opts: conOpts, ans: conOpts.indexOf(conc2), ex: "Experts warn about \u201c" + conc2 + "\u201d." }
          ] }
        });
        lid++;
      }
    }
  }
}
/* 乱序混合 */
const shufR = shuffleArr(readings).slice(0, 500);
const shufL = shuffleArr(listenings).slice(0, 300);
const out = path.join(ROOT, "data/bulk/reading_listening.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ reading: shufR, listening: shufL }));
console.log("reading:", shufR.length, "listening:", shufL.length, "sizeKB:", Math.round(fs.statSync(out).size / 1024));
console.log("-- 开头多样性抽查（阅读）--");
[0, 1, 2, 3].forEach(i => { const p = shufR[i].data.passage.split("\n")[0]; console.log("R" + (i + 1), shufR[i].title, "|", p.slice(0, 90) + "…"); });
console.log("-- 听力开头抽查 --");
[0, 1, 2].forEach(i => console.log("L" + (i + 1), shufL[i].title, "|", shufL[i].data.text.slice(0, 110) + "…"));