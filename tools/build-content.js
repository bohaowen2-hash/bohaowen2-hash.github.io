/* 博浩英语 CET-6 · 内容库构建（parts + 批量题库 → content.json，可重复执行） */
"use strict";
const fs=require("fs"), path=require("path");
const ROOT=path.join(__dirname,"..");
const merged={};
["p1","p2","p3","p4"].forEach(function(f){
  const o=JSON.parse(fs.readFileSync(path.join(ROOT,"data/seed/parts/"+f+".json"),"utf8"));
  for(const k of Object.keys(o)) merged[k]=(merged[k]||[]).concat(o[k]);
});
const bulkPath=path.join(ROOT,"data/bulk/reading_listening.json");
if(fs.existsSync(bulkPath)){
  const b=JSON.parse(fs.readFileSync(bulkPath,"utf8"));
  if(b.reading) merged.reading=(merged.reading||[]).concat(b.reading);
  if(b.listening) merged.listening=(merged.listening||[]).concat(b.listening);
}
fs.writeFileSync(path.join(ROOT,"data/seed/content.json"), JSON.stringify(merged));
const total=Object.keys(merged).reduce((s,k)=>s+merged[k].length,0);
console.log("content.json rebuilt. cats:",Object.keys(merged).length," total:",total);
Object.keys(merged).forEach(k=>console.log(" ",k,merged[k].length));