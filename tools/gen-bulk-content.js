/* 博浩英语 CET-6 · 批量内容引擎：500 长阅读 + 300 听力（真题风格·模拟生成） */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");

/* 主题词库 */
const THEMES = [
  { id: "edu", name: "教育", subjects: [["在线教育","online education"],["职业教育","vocational education"],["大学生创新创业教育","innovation and entrepreneurship education"],["终身学习","lifelong learning"],["校园阅读推广","campus reading promotion"],["数字课堂","digital classrooms"],["素质拓展","quality-oriented development"],["研学旅行","study tours"],["劳动教育","labor education"],["美育教育","aesthetic education"],["跨文化学习","cross-cultural learning"],["学习型社区","learning communities"],["人工智能进课堂","AI in the classroom"],["家校共育","family-school cooperation"],["同伴学习","peer learning"],["自控力训练","self-discipline training"],["通识教育","general education"],["师范生培养","teacher education"],["实验教学","experimental teaching"],["图书馆学习","library learning"]],
    bene: ["提升学习效率","拓宽知识视野","促进教育公平","培养自主学习能力","增强实践能力","激发学习兴趣","促进个性化发展","培养批判性思维"],
    conc: ["过度依赖技术","学习负担加重","资源分配不均","忽视情感交流","评价体系单一","同质化竞争严重","沉迷碎片化信息","忽视基本功训练"],
    ex: ["在远程课堂中，学生能按自己的节奏回顾难点。","许多院校把项目式学习引入课堂，学生收获明显。","社区图书馆定期举办共读活动，参与度很高。","一些学校通过实践活动帮助学生把知识用起来。"] },
  { id: "tech", name: "科技", subjects: [["人工智能助手","AI assistants"],["移动支付","mobile payment"],["智能家居","smart homes"],["自动驾驶","self-driving cars"],["5G 应用","5G applications"],["大数据治理","big-data governance"],["云计算服务","cloud computing services"],["物联网","the Internet of Things"],["可穿戴设备","wearable devices"],["无人机物流","drone delivery"],["数字孪生城市","digital twin cities"],["区块链应用","blockchain applications"],["智能制造","smart manufacturing"],["网络安全","cybersecurity"],["开源软件","open-source software"],["量子计算","quantum computing"],["机器人护理","care robots"],["虚拟现实学习","virtual reality learning"],["语音识别","speech recognition"],["智慧医疗","smart healthcare"]],
    bene: ["提升工作效率","让生活更加便利","促进服务升级","降低运营成本","优化资源调度","改善用户体验","推动产业创新","提高安全水平"],
    conc: ["隐私数据泄露风险","技术依赖加深","数字鸿沟扩大","就业结构调整带来的压力","算法歧视问题","过度自动化的隐患","成本高昂难以普及","监管滞后"],
    ex: ["在医院，语音录入让医生把更多时间留给病人。","工厂里，智能检测系统能及时发现产品缺陷。","居家场景中，智能设备能根据习惯自动调节环境。","出行平台上，算法帮助乘客更快匹配到车辆。"] },
  { id: "env", name: "环境", subjects: [["垃圾分类","waste sorting"],["低碳出行","low-carbon travel"],["可再生能源","renewable energy"],["新能源汽车","new-energy vehicles"],["城市绿化","urban greening"],["湿地保护","wetland conservation"],["节水行动","water conservation"],["塑料污染治理","plastic pollution control"],["碳足迹管理","carbon footprint management"],["生态农业","ecological agriculture"],["绿色建筑","green buildings"],["海洋生态修复","marine restoration"],["生物多样性保护","biodiversity protection"],["清洁能源技术","clean energy technology"],["垃圾分类积分制","recycling incentive schemes"],["公园城市建设","park-city construction"],["绿色消费","green consumption"],["环保志愿服务","environmental volunteering"],["雨水花园","rain gardens"],["生态旅游","ecotourism"]],
    bene: ["改善生态环境质量","减少资源浪费","降低碳排放","提升公众环保意识","节约能源消耗","保护生物多样性","美化人居环境","推动绿色产业发展"],
    conc: ["短期成本较高","配套措施不足","公众参与度有限","技术尚不成熟","监管执行不到位","收益周期较长","地区发展不平衡","存在形式主义"],
    ex: ["许多小区通过积分兑换鼓励居民正确分类。","校园里的雨水花园既能蓄水也能美化环境。","社区志愿者定期开展河道清理与宣传。","部分企业用屋顶光伏满足部分用电需求。"] },
  { id: "soc", name: "社会", subjects: [["社区养老服务","community elderly care"],["青年志愿服务","youth volunteering"],["全民健身","nationwide fitness"],["数字政务","digital government services"],["城市书房","urban reading rooms"],["外卖骑手权益","delivery riders' rights"],["共享出行","shared mobility"],["夜市经济","night-market economy"],["无障碍设施","accessible facilities"],["生育友好型社会","birth-friendly society"],["应急救护培训","first-aid training"],["基层调解","community mediation"],["青年夜校","youth evening schools"],["宠物友好社区","pet-friendly communities"],["二手交易平台","second-hand platforms"],["托育服务","childcare services"],["返乡创业","returning-home entrepreneurship"],["公共文化空间","public cultural spaces"],["社区食堂","community canteens"],["慢生活理念","slow living"]],
    bene: ["提升居民幸福感","增进社区凝聚力","便利日常生活","促进社会公平","丰富精神生活","缓解生活压力","增强社会信任","带动就业创业"],
    conc: ["资金投入不足","服务覆盖不均","专业人才短缺","管理难度大","居民参与不足","数字化门槛高","可持续性存疑","观念仍需转变"],
    ex: ["社区食堂为独居老人提供了实惠便利的就餐选择。","青年志愿者利用周末为孩子们开设兴趣课堂。","城市书房让居民在家门口就能安静阅读。","急救培训走进社区后，主动报名的人越来越多。"] },
  { id: "hea", name: "健康", subjects: [["规律运动","regular exercise"],["均衡膳食","a balanced diet"],["睡眠管理","sleep management"],["心理健康教育","mental-health education"],["健康体检","regular health checkups"],["课间户外活动","outdoor breaks"],["绿色骑行","cycling"],["中医养生","traditional Chinese wellness"],["情绪调节训练","emotional-regulation training"],["科学用眼","eye care"],["戒烟限酒","quitting smoking and limiting alcohol"],["社区健康小屋","community health stations"],["营养午餐计划","school meal programs"],["工间操","workplace exercise breaks"],["亲子运动","family sports"],["自然疗愈","nature therapy"],["体重管理","weight management"],["疫苗科普","vaccine education"],["急救技能","first-aid skills"],["运动处方","exercise prescriptions"]],
    bene: ["增强体质","改善睡眠质量","缓解焦虑情绪","提高学习工作效率","预防慢性疾病","促进身心平衡","培养良好习惯","增进亲子关系"],
    conc: ["缺乏专业指导","场地设施不足","坚持难度大","信息真假难辨","学业工作压力大","时间难以保障","运动损伤风险","心理支持缺位"],
    ex: ["每天二十分钟的慢跑让不少学生精力更充沛。","食堂推出的低油少盐窗口受到欢迎。","学校把课间操与趣味游戏结合，参与率明显提高。","社区组织的八段锦晨练吸引了许多上班族。"] },
  { id: "cul", name: "文化", subjects: [["传统手工艺","traditional crafts"],["非遗进校园","intangible heritage on campus"],["汉服文化","hanfu culture"],["地方戏曲","local opera"],["古籍保护","ancient-book preservation"],["博物馆夜游","museum night tours"],["国潮设计","China-chic design"],["方言保护","dialect preservation"],["红色文化研学","red-culture study tours"],["工匠精神","the spirit of craftsmanship"],["茶文化推广","tea culture promotion"],["城市记忆街区","urban heritage streets"],["少数民族文化","ethnic minority cultures"],["书法进课堂","calligraphy in classrooms"],["动漫里的中国故事","Chinese stories in animation"],["文创产品","cultural creative products"],["传统体育","traditional sports"],["古籍数字化","digitalization of ancient books"],["节日民俗体验","folk-custom experiences"],["山水文化","landscape culture"]],
    bene: ["增强文化自信","传承中华优秀传统文化","丰富精神文化生活","促进文旅融合","提升审美素养","激发创造力","增进民族认同","讲好中国故事"],
    conc: ["商业化过度","传承人青黄不接","年轻群体关注度不足","创新与守正难平衡","保护资金短缺","数字化程度不高","传播方式单一","原真性受损"],
    ex: ["非遗传承人走进校园，手把手教学生制作传统技艺。","博物馆夜场结合光影展览，年轻人预约火爆。","方言童谣被改编成动画片后重新走红。","文创冰箱贴让文物走进了日常生活。"] }
];

/* 随机工具（确定性，便于复现/去重） */
let seedBase = 20260909;
function rnd(n) { seedBase = (seedBase * 9301 + 49297) % 233280; return seedBase / 233280; }
function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
function pickN(arr, n) { const a = arr.slice(); const out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); return out; }

/* 生成阅读篇章 */
const READINGS = [];
let rid = 0;
const R_THEMES = THEMES;
const anglePhrases = {
  benefitLead: ["最值得关注的是其带来的益处。", "它之所以受到欢迎，一个重要原因是益处明显。", "从许多使用者的反馈看，积极影响是主要的。"],
  concernLead: ["当然，任何新生事物都不是完美的。", "与此同时，一些隐忧也逐渐浮现。", "然而，硬币还有另一面。"],
  solutionLead: ["面对这些问题，单靠个人难以解决。", "破解上述难题，需要多方协同。", "如何在享受便利的同时规避风险，成为新的课题。"]
};
for (const th of R_THEMES) {
  for (let si = 0; si < th.subjects.length; si++) {
    for (let ang = 0; ang < 10; ang++) {
      if (rid >= 500) break;
      const sub = th.subjects[si];
      const b0 = (si * 3 + ang) % th.bene.length, b1 = (b0 + 1) % th.bene.length, b2 = (b0 + 2) % th.bene.length;
      const bene = [th.bene[b0], th.bene[b1], th.bene[b2]];
      const conc = [th.conc[(si + ang) % th.conc.length], th.conc[(si + ang + 1) % th.conc.length]];
      const ex = [th.ex[(si + ang) % th.ex.length], th.ex[(si + ang + 1) % th.ex.length]];
      const p1 = "近年来，" + sub[0] + "（" + sub[1] + "）逐渐走进大众视野，成为" + th.name + "领域广受讨论的话题。越来越多的人开始把它看作推动生活与观念改变的重要力量。";
      const p2 = "从发展历程看，早期人们对" + sub[0] + "的认知比较有限，相关实践也多停留在尝试阶段。随着社会条件不断成熟，相关理念逐步落地，参与者也从少数先行者扩展到普通群体，形成了持续的讨论与行动。";
      const p3 = "支持者认为，" + sub[0] + "带来的积极变化有目共睹。首先，它有助于" + bene[0] + "；其次，能够在较大范围内" + bene[1] + "。" + anglePhrases.benefitLead[ang % 3];
      const p4 = "这种影响并不停留在抽象层面。以实际场景为例，" + ex[0] + "这些看似平常的变化，背后正是相关理念发挥作用的结果，也让人们对其价值有了更具体的感受。";
      const p5 = "不过，批评的声音同样值得倾听。有观点指出，" + sub[0] + "可能带来" + conc[0] + "等新问题；还有人担心它会" + conc[1] + "。" + anglePhrases.concernLead[ang % 3];
      const p6 = "如何扬长避短？专家建议，一方面要完善制度与标准，让实践有章可循；另一方面要重视人的因素，通过教育与引导提升参与者的判断力。" + ex[1] + "这些探索都在提醒我们：方法可以灵活，方向却必须清晰。";
      const p7 = "展望未来，" + sub[0] + "的发展将更多取决于能否在创新与规范之间找到平衡。可以预见，只要坚持问题导向、尊重客观规律，它就有望在" + bene[2] + "方面发挥更大作用，真正成为一项有益社会的实践。";
      const passage = [p1, p2, p3, p4, p5, p6, p7].join("\n\n");
      const facts = { sub: sub, bene: bene, conc: conc };
      const otherSubs = R_THEMES.reduce((acc, t) => acc.concat(t.subjects), []).filter(x => x[1] !== sub[1]);
      const d1 = pickN(otherSubs, 3).map(x => x[0] + "正在取代" + sub[0] + "成为主流");
      const q1opts = [sub[0] + "日益受到关注并引发广泛讨论"].concat(d1).sort(() => rnd() - .5);
      const q2opts = pickN(th.bene.filter(b => b !== bene[0]), 3).concat([bene[0]]).sort(() => rnd() - .5);
      const q3opts = pickN(th.conc.filter(c => c !== conc[0]), 3).concat([conc[0]]).sort(() => rnd() - .5);
      READINGS.push({
        title: "模拟阅读 " + String(rid + 1).padStart(3, "0") + " · " + th.name + " · " + sub[0],
        sub: "机器生成模拟题 · 主题 " + th.name + " · 博浩题库",
        data: {
          passage: passage,
          qs: [
            { q: "这篇文章主要讨论了什么？", opts: q1opts, ans: q1opts.indexOf(sub[0] + "日益受到关注并引发广泛讨论"), ex: "文章首段即指出" + sub[0] + "逐渐走进大众视野并成为讨论话题，故选“日益受到关注并引发广泛讨论”。" },
            { q: "根据文章，支持者认为" + sub[0] + "带来的积极影响包括什么？", opts: q2opts, ans: q2opts.indexOf(bene[0]), ex: "第三段明确指出它有助于“" + bene[0] + "”。" },
            { q: "文章中提到" + sub[0] + "可能带来的隐忧是什么？", opts: q3opts, ans: q3opts.indexOf(conc[0]), ex: "第五段提到它可能带来“" + conc[0] + "”等新问题。" },
            { q: "作者对" + sub[0] + "的整体态度是？", opts: ["理性看待、既肯定价值也正视问题", "完全否定、认为弊大于利", "盲目乐观、看不到任何风险", "事不关己、不予置评"].sort(() => rnd() - .5), ans: 0, ex: "全文既写益处又写隐忧并提出建议，整体是理性、辩证的态度。" },
            { q: "关于未来，作者最可能认同哪种观点？", opts: ["在创新与规范之间找到平衡是关键", sub[0] + "很快会被淘汰", "应停止一切相关探索", "只有政府能推动其发展"].sort(() => rnd() - .5), ans: 0, ex: "末段指出其发展取决于能否在创新与规范之间找到平衡。" }
          ]
        }
      });
      rid++;
    }
  }
}
READINGS.length = 500;


/* 生成听力（纯英文新闻） */
const LISTENINGS = [];
let lid = 0;
const L_BENE = ["improve the quality of people's lives", "encourage wider public participation", "raise public awareness of the issue", "bring long-term benefits to local communities"];
const L_CONC = ["a lack of careful planning", "limited public awareness", "insufficient supporting facilities", "the need for continued guidance"];
const L_EX = ["A local community recently launched a small pilot project and received positive feedback.", "Some schools have included the topic in their weekly activities with encouraging results.", "Several neighbourhoods reported that more residents joined the programme this month."];
for (const th of THEMES) {
  for (let sii = 0; sii < th.subjects.length; sii++) {
    for (let a = 0; a < 3; a++) {
      if (lid >= 300) break;
      const sub = th.subjects[sii];
      const bene = L_BENE[lid % L_BENE.length];
      const conc = L_CONC[(lid * 3) % L_CONC.length];
      const ex = L_EX[(lid * 5) % L_EX.length];
      const text = "Good morning. Here is today's news report. In recent years, " + sub[1] + " has become an increasingly popular topic in daily life. Many communities and schools are now trying to promote it step by step. Supporters believe that " + sub[1] + " can help " + bene + ". " + ex + " However, experts also point out that challenges remain, such as " + conc + ", and they call for better planning and stronger public awareness. That is the end of the news. Thank you for listening.";
      const others = THEMES.reduce((acc, t) => acc.concat(t.subjects), []).filter(function (x) { return x[1] !== sub[1]; });
      const ds = others.slice(0, 12).sort(function () { return rnd() - .5; }).slice(0, 3).map(function (x) { return x[1]; });
      const mainOpts = [sub[1]].concat(ds).sort(function () { return rnd() - .5; });
      const benOpts = L_BENE.slice().sort(function () { return rnd() - .5; });
      const concOpts = L_CONC.slice().sort(function () { return rnd() - .5; });
      LISTENINGS.push({
        title: "模拟听力 " + String(lid + 1).padStart(3, "0") + " · " + th.name + " · " + sub[0],
        sub: "机器生成模拟题 · News Report · 博浩题库",
        data: {
          type: "news",
          text: text,
          qs: [
            { q: "What is the news mainly about?", opts: mainOpts, ans: mainOpts.indexOf(sub[1]), ex: "The report opens with the growing popularity of " + sub[1] + "." },
            { q: "What benefit of the trend is mentioned in the report?", opts: benOpts, ans: benOpts.indexOf(bene), ex: "Supporters say it can help " + bene + "." },
            { q: "What challenge do the experts point out?", opts: concOpts, ans: concOpts.indexOf(conc), ex: "Experts mention challenges such as " + conc + "." }
          ]
        }
      });
      lid++;
    }
  }
}
LISTENINGS.length = 300;

const out = path.join(ROOT, "data/bulk", "reading_listening.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ reading: READINGS, listening: LISTENINGS }));
console.log("reading:", READINGS.length, "listening:", LISTENINGS.length);
console.log("sizeKB:", Math.round(fs.statSync(out).size / 1024));
// 抽检
const one = READINGS[120];
console.log("--- 阅读抽检 ---"); console.log(one.title); console.log(one.data.passage.slice(0, 260) + "…"); console.log("Q1:", one.data.qs[0].q, "| 答案:", one.data.qs[0].opts[one.data.qs[0].ans]);
const l1 = LISTENINGS[180];
console.log("--- 听力抽检 ---"); console.log(l1.title); console.log(l1.data.text.slice(0, 260) + "…");