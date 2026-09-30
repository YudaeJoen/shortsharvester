# 숏츠 하베스터 (ShortsHarvester) 배포 가이드

본 문서는 **숏츠 하베스터(ShortsHarvester)**를 클라우드 서버나 온프레미스 환경에 즉시 배포할 수 있는 공식 매뉴얼입니다.

---

## 🚀 1. Docker Compose 원클릭 배포 (가장 추천하는 방식)

리눅스 서버(AWS EC2, Lightsail, Vultr, Ubuntu 등)나 Docker가 설치된 환경에서 명령어 한 줄로 프론트엔드와 백엔드를 즉시 배포할 수 있습니다.

### 1단계: 프로젝트 클론 및 환경변수 설정
```bash
git clone <your-repo-url> ShortsHarvester
cd ShortsHarvester

# 환경변수 파일 복사 및 설정 (Gemini API 키 등록)
cp .env.example .env
nano .env
```

### 2단계: Docker Compose 컨테이너 빌드 및 실행
```bash
docker compose up -d --build
```

### 3단계: 접속 확인
- **웹 대시보드**: `http://<서버IP>:80`
- **백엔드 API Swagger 문서**: `http://<서버IP>:8000/docs`

---

## ☁️ 2. 클라우드 무료/저비용 PaaS 배포 (Vercel + Render / Railway)

### 백엔드 (FastAPI) 배포 (Render / Railway)
1. GitHub 저장소를 Render 또는 Railway에 연동합니다.
2. **Build Command**: `pip install -r requirements.txt`
3. **Start Command**: `uvicorn apps.api.main:app --host 0.0.0.0 --port $PORT`
4. 환경변수에 `GEMINI_API_KEY`를 설정합니다.

### 프론트엔드 (React) 배포 (Vercel / Netlify / Cloudflare Pages)
1. Root Directory를 `apps/web`으로 지정합니다.
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Environment Variables**:
   - `VITE_API_BASE`: `https://your-backend-url.onrender.com/api`

---

## 💻 3. 로컬 캡컷 연동 에이전트 배포 (사용자 PC용)

* **원리**: 사용자가 웹 SaaS에 접속하더라도, 자신의 PC 로컬에 설치된 캡컷(CapCut) 프로젝트 폴더에 직접 파일을 쓰려면 로컬 에이전트가 PC에서 실행 중이어야 합니다.
* **배포 방법**:
  1. `local_agent/build_agent_exe.bat`을 실행하여 `ShortsHarvester_Agent.exe` 단일 실행 파일 생성.
  2. 사용자에게 다운로드 링크를 제공하거나 백그라운드 트레이 앱으로 배포.
  3. 사용자가 프로그램을 켜두면, 웹에서 [CapCut으로 보내기] 클릭 시 1초 만에 로컬 캡컷에 프로젝트가 자동 생성됩니다.
  4. *(에이전트 미실행 시에도 웹에서 'Option A: .zip 다운로드'로 100% 사용 가능합니다)*
