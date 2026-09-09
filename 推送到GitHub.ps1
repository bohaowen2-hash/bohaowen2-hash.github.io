# ============================================================
#  博浩英语 CET-6 · 一键推送到 GitHub（公开仓库）
#  用法：在 GitHub 网页新建空仓库(Public, 不要初始化 README)后，
#        运行： .\推送到GitHub.ps1 -Url https://github.com/你的用户名/bohao-cet6.git
#  首次推送会弹出浏览器/GitHub 登录窗口，请本人登录授权。
# ============================================================
param([string]$Url)

if ([string]::IsNullOrWhiteSpace($Url)) {
  $Url = Read-Host "请输入 GitHub 仓库地址（形如 https://github.com/用户名/bohao-cet6.git）"
}
if ([string]::IsNullOrWhiteSpace($Url) -or $Url -notmatch '^https://github\.com/') {
  Write-Host "地址格式不正确，已取消。" -ForegroundColor Yellow
  exit 1
}

# 设置提交者署名（文博浩）
git config user.name "文博浩"
git config user.email "wenbohao@users.noreply.github.com"

$exists = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
  git remote add origin $Url
  Write-Host "已添加远程仓库 origin：$Url" -ForegroundColor Cyan
} else {
  git remote set-url origin $Url
  Write-Host "已更新远程仓库 origin：$Url" -ForegroundColor Cyan
}

Write-Host "正在推送代码到 GitHub（首次会弹出登录窗口，请授权）..." -ForegroundColor Cyan
git push -u origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "推送失败，请检查：1) 是否登录成功 2) 仓库地址是否正确 3) 仓库是否已创建(Public)。" -ForegroundColor Red
  Write-Host "也可以直接把仓库地址发给我，我来帮你继续处理。" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "✔ 代码已成功公开到 GitHub！" -ForegroundColor Green
Write-Host "仓库地址：$Url"
Write-Host ""
Write-Host "要让网站真正在线可访问，还需要部署（二选一，把结果发我即可继续）：" -ForegroundColor Yellow
Write-Host "  A. Render 在线部署（推荐，保留全部动态功能）→ 打开 https://render.com 用 GitHub 登录后新建 Web Service 连接此仓库，Start Command 填 node server.js"
Write-Host "  B. GitHub Pages 静态版（我帮你把 v2 数据打包成纯静态，可完全免费托管在 Pages）"