@echo off
chcp 65001 > nul
echo ==========================================================
echo   ShortsHarvester 로컬 에이전트 (.exe) 패키징을 시작합니다...
echo ==========================================================

cd ..
.\.venv\Scripts\python -m pip install pyinstaller

echo.
echo PyInstaller로 ShortsHarvester_Agent.exe 빌드 중...
.\.venv\Scripts\pyinstaller --noconfirm --onedir --windowed --name "ShortsHarvester_Agent" --clean "local_agent/agent.py"

echo.
echo 빌드 완료! dist\ShortsHarvester_Agent 폴더에서 실행 파일을 확인하세요.
pause
