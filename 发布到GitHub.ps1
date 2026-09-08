# ============================================================
#  博浩英语 CET-6 · 一键发布到 GitHub Pages
#  用法（在你注册并创建好 GitHub 仓库之后）：
#    PowerShell 中运行：  .\发布到GitHub.ps1 -Url https://github.com/你的用户名/仓库名.git
# ============================================================
param([string]$Url)

if ([string]::IsNullOrWhiteSpace($Url)) {
  $Url = Read-Host "请输入你的 GitHub 仓库地址（形如 https://github.com/用户名/仓库名.git）"
}
if ([string]::IsNullOrWhiteSpace($Url)) {
  Write-Host "未输入地址，已取消。" -ForegroundColor Yellow
  exit 1
}

$hasRemote = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
  git remote add origin $Url
  Write-Host "已添加远程仓库 origin：$Url" -ForegroundColor Cyan
} else {
  git remote set-url origin $Url
  Write-Host "已更新远程仓库 origin：$Url" -ForegroundColor Cyan
}

Write-Host "正在推送代码到 GitHub ..." -ForegroundColor Cyan
git push -u origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "推送失败。请检查：1) 是否已登录（首次推送浏览器会弹出 GitHub 登录窗口）；" -ForegroundColor Red
  Write-Host "2) 仓库地址是否正确；3) 仓库是否已创建。也可以直接告诉我仓库地址，我来帮你处理。" -ForegroundColor Red
  exit 1
}

$pageUrl = $Url -replace '^https://github\.com/','https://' -replace '\.git$',''
$pageUrl = $pageUrl -replace '^(https://[^/]+)/','$1'
Write-Host ""
Write-Host "✔ 代码已推送成功！" -ForegroundColor Green
Write-Host ""
Write-Host "最后一步（30 秒）：" -ForegroundColor Yellow
Write-Host "  打开仓库页面 → Settings → Pages → Source 选 'Deploy from a branch'"
Write-Host "  → Branch 选 main，目录选 / (root) → 点 Save"
Write-Host ""
Write-Host "约 1 分钟后访问：$pageUrl" -ForegroundColor Green