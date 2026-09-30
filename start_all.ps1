# ShortsHarvester - 숏츠 하베스터 All-in-One Launcher
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "  🚀 숏츠 하베스터 (ShortsHarvester) 서비스를 시작합니다..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Yellow

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Backend FastAPI Server (Port 8000)
Write-Host "[1/3] 백엔드 FastAPI 서버 실행 중 (Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir'; .\.venv\Scripts\python -m uvicorn apps.api.main:app --host 127.0.0.1 --port 8000 --reload"

# 2. Start CapCut Local Bridge Agent (Port 28765)
Write-Host "[2/3] 로컬 CapCut 브릿지 에이전트 데몬 실행 중 (Port 28765)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir'; .\.venv\Scripts\python local_agent\agent.py"

# 3. Start Frontend Dashboard (Vite)
Write-Host "[3/3] 웹 대시보드 프론트엔드 실행 중 (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\apps\web'; npm run dev -- --port 3000"

Write-Host "모든 숏츠 하베스터 서비스가 성공적으로 구동되었습니다!" -ForegroundColor Yellow
Write-Host "웹 대시보드 접속 주소: http://localhost:3000" -ForegroundColor Cyan
