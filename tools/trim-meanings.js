/* 释义精简：每词保留 1–2 个核心义项 */
"use strict";
const fs=require("fs"), path=require("path");
const ROOT=path.join(__dirname,"..");
const f=path.join(ROOT,"data/seed/words.json");
const words=JSON.parse(fs.readFileSync(f,"utf8"));
function trimM(m){
  const parts=String(m||"").split(/[；;]/).map(x=>x.trim()).filter(Boolean);
  if(!parts.length) return m||"";
  return parts.slice(0,2).join("；");
}
let before=0,after=0;
words.forEach(w=>{ before+=String(w.m||"").length; w.m=trimM(w.m); after+=String(w.m||"").length; });
fs.writeFileSync(f,JSON.stringify(words));
console.log("words:",words.length,"释义长度 avg",(before/words.length).toFixed(0),"->",(after/words.length).toFixed(0));
const sample=words.filter(w=>w.w==="abandon"||w.w==="ability"||w.w==="robust").map(w=>w.w+": "+w.m);
console.log(sample.join("\n"));