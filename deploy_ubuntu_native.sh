#!/bin/bash
set -e

# ==============================================================================
#  숏츠 하베스터 (ShortsHarvester) - Ubuntu 네이티브(Docker 미사용) 배포 스크립트
# ==============================================================================

echo "======================================================================"
echo "  🚀 ShortsHarvester Ubuntu 네이티브(Systemd) 배포를 시작합니다..."
echo "  (Ubuntu 22.04 LTS / 24.04 LTS 지원)"
echo "======================================================================"

# 1. 시스템 의존성 (Python3, venv, ffmpeg, nodejs, npm, nginx) 설치
echo "[1/5] 필수 패키지(Python3, venv, ffmpeg, Nginx, Node.js) 설치 중..."
sudo apt-get update -y
sudo apt-get install -y python3 python3-pip python3-venv ffmpeg nginx curl git

# Node.js 20 설치 (미설치 시)
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 2. Python 가상환경 생성 및 백엔드 종속성 설치
echo "[2/5] 파이썬 가상환경 생성 및 의존성 설치 중..."
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 3. 프론트엔드 프로덕션 빌드
echo "[3/5] 웹 프론트엔드 프로덕션 빌드 중..."
cd apps/web
npm install
npm run build
cd ../..

# 4. Nginx 웹서버 설정 (프론트엔드 정적 서빙 및 API 역방향 프록시)
echo "[4/5] Nginx 웹서버 설정 등록 중..."
APP_DIR=$(pwd)
sudo tee /etc/nginx/sites-available/shortsharvester > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    root ${APP_DIR}/apps/web/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /media/ {
        proxy_pass http://127.0.0.1:8000/media/;
        proxy_set_header Host \$host;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/shortsharvester /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 5. 백엔드 FastAPI Systemd 백그라운드 데몬 서비스 등록
echo "[5/5] 백엔드 systemd 서비스 등록 및 시작..."
sudo tee /etc/systemd/system/shortsharvester-api.service > /dev/null <<EOF
[Unit]
Description=ShortsHarvester FastAPI Service
After=network.target

[Service]
User=$USER
WorkingDirectory=${APP_DIR}
ExecStart=${APP_DIR}/.venv/bin/uvicorn apps.api.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable shortsharvester-api
sudo systemctl restart shortsharvester-api

SERVER_IP=$(curl -s https://api.ipify.org || hostname -I | awk '{print $1}')

echo "======================================================================"
echo "  🎉 ShortsHarvester 네이티브 배포가 완료되었습니다!"
echo "======================================================================"
echo "  • 웹 대시보드: http://${SERVER_IP}"
echo "  • API 문서:   http://${SERVER_IP}/api/health"
echo "  • 백엔드 서비스 상태: sudo systemctl status shortsharvester-api"
echo "  • 백엔드 실시간 로그: sudo journalctl -u shortsharvester-api -f"
echo "======================================================================"
