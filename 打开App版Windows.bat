@echo off
chcp 65001 >nul
title 博浩英语 CET-6（Windows App 版）
echo 正在以“应用窗口”模式打开博浩英语…
set "URL=https://bohaowen2-hash.github.io/"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" (start "" "%EDGE%" --app=%URL%) else (start "" chrome --app=%URL%)
exit