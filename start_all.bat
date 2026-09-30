@echo off
chcp 65001 > nul
echo ==========================================================
echo   🚀 숏츠 하베스터 (ShortsHarvester) 올인원 서비스를 실행합니다...
echo ==========================================================

:: 1. Start Backend API
start "ShortsHarvester API Server (Port 8000)" powershell -NoExit -Command ".\.venv\Scripts\python -m uvicorn apps.api.main:app --host 127.0.0.1 --port 8000 --reload"

:: 2. Start Local CapCut Bridge Agent
start "ShortsHarvester CapCut Bridge Agent (Port 28765)" powershell -NoExit -Command ".\.venv\Scripts\python local_agent\agent.py"

:: 3. Start Frontend Dashboard
start "ShortsHarvester Web Dashboard" powershell -NoExit -Command "cd apps\web; npm run dev -- --port 3000"

echo.
echo 모든 숏츠 하베스터 서비스 창이 실행되었습니다!
echo 웹 브라우저에서 http://localhost:3000 에 접속하세요.
pause
