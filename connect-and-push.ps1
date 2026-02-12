# UTF-8
$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$remoteUrl = "https://github.com/yeomjw0907/onemarketing_SaaS.git"

if (-not (Test-Path ".git")) {
    Write-Host "git init ..." -ForegroundColor Cyan
    git init
    git branch -M main
}

Write-Host "remote origin -> $remoteUrl" -ForegroundColor Cyan
git remote remove origin 2>$null
git remote add origin $remoteUrl

Write-Host "add, commit ..." -ForegroundColor Cyan
git add .
$status = git status --short
if ($status) {
    git commit -m "Initial commit: 원마케팅 SaaS"
}

Write-Host "push origin main ..." -ForegroundColor Cyan
git push -u origin main

Write-Host "Done." -ForegroundColor Green
