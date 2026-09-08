# 博浩英语 · CET-6 六级学习平台

> 📖 一套精良、免费、公开的大学英语六级（CET-6）备考网站
> 👨‍💻 **创始人：文博浩（Wen Bohao）**

## ✨ 功能模块

| 模块 | 说明 | 页面 |
| --- | --- | --- |
| 🏠 首页 | 品牌展示、考试倒计时、学习路径、创始人寄语 | `index.html` |
| 📖 词汇 | 10 单元核心词库（100 词 + 30 高频短语），翻卡记忆、语音朗读、释义自测、进度本地保存 | `vocabulary.html` |
| 🎧 听力 | 新闻 / 讲座真题风格语料，浏览器语音变速播放、逐句精听、理解自测 | `listening.html` |
| 📚 阅读 | 题型分值速查、长难句拆解、精读实战（3 题带解析） | `reading.html` |
| ✍️ 写作 | 四大体裁模板、万能句型库（一键复制）、范文精讲、自查清单 | `writing.html` |
| 🔄 翻译 | 汉译英六大技巧、高频主题词块、段落实战参考译文 | `translation.html` |
| 🗓️ 备考 | 倒计时、题型速查、个性化冲刺计划生成器、番茄钟 | `exam.html` |

技术栈：原生 HTML + CSS + JavaScript，无任何构建依赖，可离线打开，也可一键部署到任意静态托管。

## 🚀 如何公开部署（三选一）

### 方案 A：GitHub Pages（推荐，永久免费）
1. 在 GitHub 新建仓库（如 `bohao-cet6`），把本文件夹内所有文件推上去：
   ```bash
   git init
   git add .
   git commit -m "博浩英语 CET-6 学习平台 by 文博浩"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```
2. 打开仓库 **Settings → Pages**，将 Source 选为 `Deploy from a branch`，分支选 `main`，目录选 `/ (root)`，保存。
3. 等待 1–2 分钟后访问：`https://<你的用户名>.github.io/<仓库名>/`

### 方案 B：Netlify Drop（无需命令行，最省事）
1. 打开 https://app.netlify.com/drop
2. 把本文件夹直接拖进页面，几十秒后即可获得公开网址，之后可绑定自定义域名。

### 方案 C：Vercel
1. 打开 https://vercel.com/new ，导入本文件夹（或导入 GitHub 仓库）。
2. 框架选择 **Other**，构建命令留空，输出目录为根目录，部署即可。

## 🖥️ 本地预览
```bash
# 方式一：直接双击 index.html
# 方式二：起一个本地静态服务（推荐）
python -m http.server 8000
# 或
npx serve .
# 浏览器打开 http://localhost:8000
```

## 📝 自定义与扩充
- **扩充词汇**：编辑 `assets/js/cet6-words.js`，在对应单元 `words` 数组中追加
  `{w:"单词", f:"/音标/", p:"词性", m:"中文释义", ex:"英文例句", c:"例句翻译"}` 即可。
- **新增单元**：在 `CET6_UNITS` 数组末尾追加 `{id:"u11", name:"Unit 11 · 主题", words:[...]}`。
- **修改配色 / 品牌**：编辑 `assets/css/style.css` 顶部的 `:root` 变量；品牌名、创始人署名可全局搜索替换。
- **修改默认考试日**：`assets/js/exam.js` 中 `DEFAULT_DATE`，或直接在「备考」页选择日期并保存。

## 📄 版权说明
本站所有原创内容（文案、语料、范文）版权归创始人文博浩所有，允许个人学习使用；公开转载或商用请注明出处。真题相关内容请以官方发布为准。

© 2026 博浩英语 BohaoEnglish · 创始人：文博浩 · Made with ♥ for CET-6 fighters