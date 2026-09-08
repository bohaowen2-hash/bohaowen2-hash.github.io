# 博浩英语 CET-6 · 动态学习平台 v2.0

> 📖 由 **文博浩（Wen Bohao）创立** 的大学英语六级（CET-6）学习平台
> ⚙️ 动态架构：Node.js 零依赖服务器 + 内置数据库 + 可视化后台，内容实时维护、学习记录云端同步

## ✨ 相比静态版的核心升级

| 能力 | 说明 |
| --- | --- |
| 🧠 海量词库 | **3995 个去重单词**（10 个博浩原创核心单元 + 26 组大纲词库，66% 带音标）+ **22224 条词组搭配**（含 30 条核心），数据后台可继续追加 |
| 📚 内容素材 | 阅读 4 篇 / 听力 4 篇 / 长难句 8 条 / 写作模板 4 套 / 万能句型 28 句 / 范文 2 篇 / 翻译技巧 6 条 / 主题词块 4 组 / 翻译练习 6 篇 / 冲刺锦囊 5 则（共 71 条），全部可在后台维护 |
| 🗄️ 后台管理 | `/admin` 可视化后台：站点文案、公告、考试日期、词库、短语、素材、用户——**无需改代码即可实时更新** |
| ☁️ 学习记录 | 已掌握词、错题本、打卡、练习记录全部云端保存；游客自动建档，注册账号后跨设备同步 |
| 📊 个人中心 | 连续打卡、84 天热力图、14 天学习时长、模块练习分布、错题复习 |
| 🎯 学习功能 | 翻卡背词（点击/空格翻面、朗读、乱序）、释义自测、错题重练、听力变速逐句精听、阅读实战解析、写作模板一键复制、番茄钟、冲刺计划生成器 |
| 🎨 视觉升级 | 明暗双主题、路由过渡动画、彩带庆祝、卡片/进度/图表可视化、全面响应式 |

## 🚀 快速开始（本地）

```bash
# 无需 npm install（零第三方依赖）
node server.js
# 浏览器打开 http://localhost:3000
```

- 首次启动自动从 `data/seed/*.json` 播种词库与素材。
- 管理员：用户名 `admin`，初始密码见**服务器启动日志**，同时写入 `data/admin.txt`（登录后请立即在「个人中心」修改，并删除该文件）。
- 覆盖端口：`PORT=8080 node server.js`（Windows PowerShell：`$env:PORT=8080; node server.js`）。

## ☁️ 部署公开（任选）

本项目是**带数据文件的 Node 服务**，需要“可持续磁盘”的托管平台（GitHub Pages 这类纯静态托管不支持，v1 静态版已归档在 `archive/static-v1/` 可另行部署）。

### 方案 A：Render（推荐，免费额度）
1. 把本项目推送到 GitHub 私有/公开仓库。
2. 在 [render.com](https://render.com) 新建 **Web Service**，连接该仓库。
3. Build Command 留空；Start Command 填 `node server.js`；Environment 添加 `BOHAO_ADMIN_PW=你自己设的管理员密码`。
4. 部署完成后即可通过 `https://xxx.onrender.com` 公开访问。Render 免费实例的磁盘会随实例休眠/重建而重置，重要数据请用「方案 C」定期备份或改用带持久磁盘的付费实例。

### 方案 B：Railway / Fly.io / VPS
Railway 提供持久卷（Volume），把 `data/` 挂载到持久卷即可长期保存数据；VPS（宝塔 / Docker / PM2）最稳妥。示例 Docker：

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY . .
ENV PORT=3000 BOHAO_ADMIN_PW=你的密码
EXPOSE 3000
CMD ["node","server.js"]
```

### 方案 C：数据备份（重要）
所有内容都保存在 `data/db.json`，请定期备份这一份文件即可完整迁移；把备份文件放回 `data/db.json` 后重启服务即恢复。

## 🛠️ 内容维护（后台 /admin）
- **站点文案**：品牌名、创始人姓名/头衔/寄语/签名、首页大标题/副标题、顶部公告、考试日期、联系邮箱、页脚说明——保存即全局生效（创始人文博浩署名体系完整保留并可在后台编辑）。
- **词库**：按单元浏览/检索/编辑/删除；支持**批量导入**（`单词|音标|词性|释义|例句|例句翻译`，每行一条）。
- **短语**：检索/编辑/删除；支持批量导入（`搭配|释义`，行首 `core:` 标记为核心）。
- **素材**：按分类（阅读/听力/长难句/写作模板/句型/范文/翻译技巧/主题词块/翻译练习/锦囊）新增、编辑（JSON 结构化内容，界面内附字段模板说明）、删除。
- **用户**：查看所有注册用户活跃度。

## 📁 目录结构
```
server.js              零依赖 Node 服务器（静态托管 + REST API + 认证 + 后台 CRUD）
package.json
index.html             SPA 入口
assets/css/            style.css（设计系统）+ ext.css（模块组件）
assets/js/             core/home/vocab/listening/reading/writing/translation/exam/dashboard/admin
data/seed/             词库与素材种子（words 3995 / phrases 22224 / units 36 / content 71）
data/seed/parts/       素材分块源文件（由合并脚本生成 content.json）
data/db.json           运行时数据库（git 忽略，自动生成，请定期备份）
tools/import-vocab.js  开放词库归一化导入工具（可重跑扩充）
archive/static-v1/     v1 纯静态版归档（GitHub Pages 可用，含原「发布到GitHub.ps1」）
```

## 📜 版权与署名
本站全部原创文案、语料、范文与界面版权归 **创始人文博浩** 所有，允许个人学习使用；公开转载或商用请注明“博浩英语 · 文博浩 创立”。词库主体来自开源六级词库并做了去重合并、音标补全与博浩原创例句增强（数据来源详见 `tools/import-vocab.js` 注释）；真题相关内容请以官方发布为准。

© 2026 博浩英语 BohaoEnglish · 创始人：文博浩 · Made with ♥ for CET-6 fighters