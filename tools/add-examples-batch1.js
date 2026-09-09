/* 人工精写例句 第一批（只对释义清晰的词） */
"use strict";
const fs=require("fs"), path=require("path");
const ROOT=path.join(__dirname,"..");
const list=[
 ["abbreviation","WTO is the abbreviation for the World Trade Organization.","WTO 是 World Trade Organization 的缩写。"],
 ["abide","We must abide by the rules of the competition.","我们必须遵守比赛规则。"],
 ["abnormal","The doctor found the test results abnormal and ordered more checks.","医生发现检查结果异常，便要求再做检查。"],
 ["abolish","The new law abolished the outdated tax.","新法律废除了过时的税种。"],
 ["abrupt","His abrupt departure surprised everyone at the meeting.","他突然离去，令与会者都很惊讶。"],
 ["absence","She explained her absence from class yesterday.","她解释了昨天缺课的原因。"],
 ["absent","He was absent from school because of a fever.","他因发烧没有去上学。"],
 ["absorb","Plants absorb water through their roots.","植物通过根部吸收水分。"],
 ["abuse","We should never abuse the trust of our friends.","我们绝不应滥用朋友的信任。"],
 ["academic","The academic year begins in September.","学年从九月开始。"],
 ["access","Students have free access to the library database.","学生可以免费使用图书馆数据库。"],
 ["accident","He was injured in a traffic accident.","他在一次交通事故中受了伤。"],
 ["accommodation","The university provides accommodation for international students.","大学为留学生提供住宿。"],
 ["accompany","Children under ten must be accompanied by an adult.","十岁以下儿童须由成人陪同。"],
 ["accomplish","She accomplished the task ahead of schedule.","她提前完成了任务。"],
 ["accurate","The report gives an accurate description of the situation.","这份报告准确描述了情况。"],
 ["accuse","He was accused of breaking the window.","他被指责打破了窗户。"],
 ["accustomed","She is accustomed to getting up early.","她习惯早起。"],
 ["achieve","Hard work helped him achieve his goal.","努力帮助他实现了目标。"],
 ["achievement","Winning the prize was a great achievement for the team.","获奖是这支队伍的一大成就。"],
 ["acquaintance","He is an old acquaintance of my father.","他是我父亲的一位老熟人。"],
 ["acquire","Children acquire language skills through daily use.","儿童通过日常使用习得语言技能。"],
 ["activate","Press the button to activate the alarm.","按下按钮激活警报。"],
 ["acute","The city faces an acute shortage of housing.","该市面临严重的住房短缺。"],
 ["adapt","It took her a while to adapt to the new environment.","她花了一段时间才适应新环境。"],
 ["addition","In addition to English, she studies French.","除了英语，她还学习法语。"],
 ["additional","Please provide additional information if needed.","如需更多信息，请补充提供。"],
 ["address","The government must address the problem of air pollution.","政府必须解决空气污染问题。"],
 ["adjust","You can adjust the seat to make it more comfortable.","你可以调节座椅，让它更舒适。"],
 ["adhere","All members must adhere to the safety rules.","所有成员都必须遵守安全规定。"],
 ["adjacent","The hotel is adjacent to the railway station.","这家旅馆紧邻火车站。"],
 ["absorption","The absorption of new ideas takes time.","吸收新思想需要时间。"],
 ["abundance","The region has an abundance of natural resources.","该地区自然资源丰富。"],
 ["acceptance","The proposal won wide acceptance.","这一提议获得了广泛接受。"],
 ["accountable","Public officials should be accountable to the people.","公职人员应当对人民负责。"],
 ["accountant","She works as an accountant in a bank.","她在银行里当会计。"]
];
const f=path.join(ROOT,"data/seed/words.json");
const words=JSON.parse(fs.readFileSync(f,"utf8"));
let added=0, skipped=[];
const map=new Map(list.map(x=>[x[0],[x[1],x[2]]]));
words.forEach(w=>{
  const e=map.get(w.w);
  if(e && !w.ex){ w.ex=e[0]; w.c=e[1]; added++; }
  else if(e && w.ex) skipped.push(w.w);
});
fs.writeFileSync(f,JSON.stringify(words));
fs.copyFileSync(f,"C:/Users/86181/Desktop/bohao-ghpages/data/words.json");
console.log("added examples:",added,"skipped(existing):",skipped.length?skipped.join(","):"-");