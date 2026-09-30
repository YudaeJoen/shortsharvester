#!/bin/bash
set -e

# ==============================================================================
#  숏츠 하베스터 (ShortsHarvester) - Ubuntu 22.04 / 24.04 원클릭 자동 배포 스크립트
# ==============================================================================

echo "======================================================================"
echo "  🚀 ShortsHarvester Ubuntu 배포를 시작합니다..."
echo "  (지원 OS: Ubuntu 22.04 LTS / Ubuntu 24.04 LTS)"
echo "======================================================================"

# 1. 패키지 인덱스 업데이트 및 기본 도구 설치
echo "[1/4] 시스템 패키지 업데이트 및 필수 도구 설치 중..."
sudo apt-get update -y
sudo apt-get install -y curl git ufw

# 2. Docker & Docker Compose 설치 확인 및 자동 설치
if ! command -v docker &> /dev/null; then
    echo "[2/4] Docker가 설치되어 있지 않습니다. 공식 Docker 엔진을 설치합니다..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER || true
    rm get-docker.sh
    echo "Docker 설치 완료."
else
    echo "[2/4] Docker가 이미 설치되어 있습니다."
fi

# 3. 환경변수 파일 설정 (.env)
if [ ! -f .env ]; then
    echo "[3/4] .env 파일 생성 (.env.example 기반)..."
    cp .env.example .env
    echo "-> Gemini API 키가 필요한 경우 'nano .env'로 등록하실 수 있습니다."
else
    echo "[3/4] 기존 .env 파일을 유지합니다."
fi

# 4. 방화벽 포트(80, 8000) 개방
if sudo ufw status | grep -q "Status: active"; then
    echo "UFW 방화벽 감지: 80번(웹) 및 8000번(API) 포트를 허용합니다..."
    sudo ufw allow 80/tcp
    sudo ufw allow 8000/tcp
    sudo ufw reload
fi

# 5. Docker Compose 빌드 및 백그라운드 구동
echo "[4/4] Docker Compose 컨테이너 빌드 및 프로덕션 서비스 구동 중..."
sudo docker compose down --remove-orphans || true
sudo docker compose up -d --build

SERVER_IP=$(curl -s https://api.ipify.org || hostname -I | awk '{print $1}')

echo "======================================================================"
echo "  🎉 ShortsHarvester 배포가 성공적으로 완료되었습니다!"
echo "======================================================================"
echo "  • 웹 대시보드 접속: http://${SERVER_IP}"
echo "  • 백엔드 API 문서: http://${SERVER_IP}:8000/docs"
echo "  • 컨테이너 상태 확인: sudo docker compose ps"
echo "  • 실시간 로그 확인:   sudo docker compose logs -f"
echo "======================================================================"
