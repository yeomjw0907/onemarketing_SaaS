# GitHub 푸시 수정 스크립트 (node_modules, .next 제외 후 재커밋)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "1. 마지막 커밋 취소 (변경사항 유지)..." -ForegroundColor Cyan
git reset --soft HEAD~1

Write-Host "2. 스테이징 해제..." -ForegroundColor Cyan
git reset HEAD

Write-Host "3. .gitignore 적용하여 파일 추가 (node_modules, .next 제외)..." -ForegroundColor Cyan
git add .

Write-Host "4. 커밋..." -ForegroundColor Cyan
git commit -m "Initial commit: 원마케팅 SaaS (node_modules, .next 제외)"

Write-Host "5. GitHub에 푸시..." -ForegroundColor Cyan
git push -u origin main

Write-Host "완료." -ForegroundColor Green
