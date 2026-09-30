# 숏츠 하베스터 (ShortsHarvester)

웹 기반 올인원 쇼츠 발굴, AI 대본/TTS 자동화, CapCut 데스크톱 원클릭 프로젝트 주입 플랫폼입니다.

## 📚 상세 설계 문서
- 전체 시스템 아키텍처 및 구현 설계서: [docs/SHORTS_HARVESTER_SPEC.md](file:///d:/works/ShortsHarvester/docs/BANBAJI_STUDIO_ARCHITECTURE_SPEC.md)

## 📁 프로젝트 구조 (Monorepo)
```plaintext
ShortsHarvester/
├── docs/                     # 시스템 아키텍처 및 상세 구현 설계서
│   └── BANBAJI_STUDIO_ARCHITECTURE_SPEC.md
├── apps/
│   ├── web/                  # Vite + React + Tailwind CSS 대시보드 (포트 3000)
│   └── api/                  # Python FastAPI 백엔드 & 비동기 작업 큐 (포트 8000)
├── services/
│   ├── collector/            # yt-dlp 기반 쿼터 소모 0 쇼츠 수집기
│   ├── ai_pipeline/          # Gemini 2.5 Flash 3단계 잽 대본 생성기
│   ├── tts_engine/           # Edge-TTS 음성 합성 및 마이크로초 타임코드 매핑
│   ├── long_to_shorts/       # 롱폼 영상 -> 세로 쇼츠 9:16 하이라이트 분할기
│   ├── multiuse/             # YouTube, Instagram Reels, TikTok 메타데이터 패키저
│   └── capcut_packager/      # draft_content.json 생성 및 템플릿 빌더
└── local_agent/              # Windows/macOS 로컬 헬퍼 데몬 (CapCut 원클릭 주입, 포트 28765)
```

## 🚀 빠른 시작 가이드 (How to Run)
1. 윈도우 탐색기에서 [`start_all.bat`](file:///d:/works/ShortsHarvester/start_all.bat) 더블 클릭  
   또는 PowerShell에서 `.\start_all.ps1` 실행
2. 웹 브라우저에서 **http://localhost:3000** 접속
