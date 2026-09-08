# ============================================================
#  博浩英语 CET-6 · 一键公开分享（本地服务器 + Cloudflare 隧道）
#  用法：右键 → 使用 PowerShell 运行；或在本目录执行  .\启动公网分享.ps1
#  看到 https://xxx.trycloudflare.com 即为公网链接，保持窗口开启即可。
# ============================================================
param([int]$Port = 3000)
$ErrorActionPreference = "Continue"
$root = $PSScriptRoot
$cf = Join-Path $root "tools\bin\cloudflared.exe"

if (-not (Test-Path -LiteralPath $cf)) {
  Write-Host "缺少 tools\bin\cloudflared.exe，请先下载 Cloudflare 隧道程序放到该位置。" -ForegroundColor Red
  Write-Host "下载：https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -ForegroundColor Yellow
  exit 1
}

# 1) 确保本地服务器已启动
$status = 0
try { $status = (Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/site" -UseBasicParsing -TimeoutSec 4).StatusCode } catch { $status = 0 }
if ($status -ne 200) {
  Write-Host "启动本地服务器 (node server.js) ..." -ForegroundColor Cyan
  $node = (Get-Command node).Source
  Start-Process -FilePath $node -ArgumentList "server.js" -WorkingDirectory $root -WindowStyle Hidden
  Start-Sleep -Seconds 3
}

# 2) 开启公网隧道（此窗口需保持开启）
Write-Host ""
Write-Host "正在连接 Cloudflare 公网隧道，请稍候 ..." -ForegroundColor Cyan
& $cf tunnel --no-autoupdate --url "http://localhost:$Port"