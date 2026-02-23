# OneDrive 밖으로 프로젝트 복사 (C:\MyProjects)
# 이 스크립트를 프로젝트 폴더(원마케팅SaaS)에서 실행하세요.
# 방법: PowerShell 열고 → cd "원마케팅SaaS 경로" → .\scripts\move-project-out-of-onedrive.ps1

$ErrorActionPreference = "Stop"
# 스크립트 위치: ...\원마케팅SaaS\scripts → 한 단계 위가 프로젝트 루트
$source = Split-Path -Parent $PSScriptRoot
$folderName = Split-Path -Leaf $source
$dest = "C:\MyProjects\$folderName"

Write-Host "소스: $source" -ForegroundColor Cyan
Write-Host "대상: $dest" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "C:\MyProjects")) {
    New-Item -ItemType Directory -Path "C:\MyProjects" -Force | Out-Null
    Write-Host "C:\MyProjects 폴더를 만들었습니다." -ForegroundColor Green
}

if (Test-Path $dest) {
    Write-Host "이미 대상 폴더가 있습니다: $dest" -ForegroundColor Yellow
    $overwrite = Read-Host "덮어쓸까요? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "종료합니다."
        exit 0
    }
}

Write-Host "복사 중... (node_modules, .next 제외)" -ForegroundColor Yellow
$robocopy = robocopy $source $dest /E /XD node_modules .next /NFL /NDL /NJH /NJS /NC /NS
# robocopy exit code 0-7 = success
if ($LASTEXITCODE -ge 8) {
    Write-Host "복사 실패. exit code: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "복사 완료: $dest" -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Cyan
Write-Host "  1. Cursor에서 현재 폴더를 닫고, File → Open Folder → $dest 열기"
Write-Host "  2. 새 폴더에서 터미널 열고: npm install"
Write-Host "  3. npm run dev 로 실행 확인"
Write-Host "  4. 문제없으면 기존 OneDrive 폴더는 삭제해도 됩니다."
Write-Host ""
