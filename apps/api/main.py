import os
import sys
import uuid
import time
import zipfile
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from services.capcut_packager.draft_builder import (
    build_draft_content,
    build_draft_meta_info,
    STYLE_PRESETS
)
from services.collector.channel_dissector import (
    extract_channel_shorts,
    expand_keywords_multilingual
)
from services.ai_pipeline.jab_script_generator import generate_jab_script
from services.tts_engine.edge_tts_runner import (
    synthesize_script_segments,
    SUPPORTED_VOICES
)
from services.long_to_shorts.highlight_extractor import extract_longform_highlights
from services.multiuse.metadata_packager import generate_multiuse_packages

app = FastAPI(
    title="ShortsHarvester API",
    version="1.1.0",
    description="ShortsHarvester backend API for Shorts harvesting, AI script/TTS generation, and CapCut desktop automation."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = ROOT_DIR / "data"
EXPORTS_DIR = ROOT_DIR / "exports"
MEDIA_DIR = ROOT_DIR / "media"
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(EXPORTS_DIR, exist_ok=True)
os.makedirs(MEDIA_DIR, exist_ok=True)

# Static media route for direct audio playing
app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")

db = {
    "workspaces": [
        {"id": "ws-default", "name": "기본 작업대 (바이럴 쇼츠)", "min_views": 4000000, "max_duration": 40}
    ],
    "channel_blacklists": set(),
    "collected_videos": {},
    "tasks": {},
    "generated_scripts": {},
    "long_to_shorts": {}
}

# --- Pydantic Models ---
class ChannelCollectRequest(BaseModel):
    workspace_id: str
    channel_urls: List[str]
    keyword: Optional[str] = ""
    min_views: int = 4000000
    max_duration: int = 40

class StatusUpdateRequest(BaseModel):
    status: str

class BlacklistRequest(BaseModel):
    channel_id: str
    reason: Optional[str] = "수질 관리 제외"

class OneTakeRequest(BaseModel):
    video_id: str
    custom_comments: Optional[List[str]] = None
    voice_id: str = "ko-KR-SunHiNeural"
    template_style: str = "NO_BACK_STYLE"
    top_header_text: Optional[str] = None

class LongToShortsRequest(BaseModel):
    video_url: str
    target_duration: int = 45
    highlight_count: int = 3

class MultiuseRequest(BaseModel):
    video_id: str
    selected_title: Optional[str] = None

# --- Endpoints ---

@app.get("/api/health")
def healthcheck():
    return {"status": "ok", "service": "ShortsHarvester API", "version": "1.1.0"}

@app.get("/api/styles")
def get_styles():
    return [{"id": k, **v} for k, v in STYLE_PRESETS.items()]

@app.get("/api/voices")
def get_voices():
    return SUPPORTED_VOICES

# ① 채널 해체 (Channel Dissector)
def run_collection_task(task_id: str, req: ChannelCollectRequest):
    db["tasks"][task_id] = {
        "id": task_id,
        "status": "RUNNING",
        "progress": 10,
        "message": "채널 분석 및 yt-dlp 메타데이터 수집 시작..."
    }
    
    total_found = 0
    for idx, c_url in enumerate(req.channel_urls):
        if not c_url.strip():
            continue
        try:
            videos = extract_channel_shorts(
                c_url.strip(),
                min_views=req.min_views,
                max_duration=req.max_duration,
                limit=25
            )
            for v in videos:
                c_id = v["channel_id"]
                if c_id in db["channel_blacklists"]:
                    continue
                v_id = v["youtube_video_id"]
                db["collected_videos"][v_id] = {
                    **v,
                    "workspace_id": req.workspace_id,
                    "status": "UNUSED",
                    "created_at": time.time()
                }
                total_found += 1
        except Exception:
            pass
        
        progress = int(10 + (idx + 1) / len(req.channel_urls) * 80)
        db["tasks"][task_id]["progress"] = progress
        db["tasks"][task_id]["message"] = f"채널 {idx+1}/{len(req.channel_urls)} 처리 중... (누적 발굴: {total_found}개)"

    if total_found == 0 and len(db["collected_videos"]) == 0:
        demo_samples = [
            {
                "youtube_video_id": "demo_dog_01",
                "title": "주인이 쓰러진 척하자 골든리트리버의 충격 반응 ㅋㅋㅋ",
                "channel_id": "UC_pet_viral",
                "channel_title": "댕댕이 세상",
                "view_count": 6820000,
                "duration": 28,
                "thumbnail_url": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&q=80",
                "video_url": "https://www.youtube.com/shorts/demo_dog_01",
                "workspace_id": req.workspace_id,
                "status": "UNUSED",
                "created_at": time.time()
            },
            {
                "youtube_video_id": "demo_cat_02",
                "title": "집사 노트북 키보드만 골라 밟는 고양이의 기적의 타이핑",
                "channel_id": "UC_cat_box",
                "channel_title": "냥냥로그",
                "view_count": 4250000,
                "duration": 19,
                "thumbnail_url": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80",
                "video_url": "https://www.youtube.com/shorts/demo_cat_02",
                "workspace_id": req.workspace_id,
                "status": "UNUSED",
                "created_at": time.time()
            },
            {
                "youtube_video_id": "demo_relatable_03",
                "title": "퇴근 5분 전 부장님이 회식 가자고 할 때 직장인 표정",
                "channel_id": "UC_office_jabs",
                "channel_title": "직장생존기",
                "view_count": 9120000,
                "duration": 34,
                "thumbnail_url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80",
                "video_url": "https://www.youtube.com/shorts/demo_relatable_03",
                "workspace_id": req.workspace_id,
                "status": "UNUSED",
                "created_at": time.time()
            }
        ]
        for s in demo_samples:
            db["collected_videos"][s["youtube_video_id"]] = s
        total_found = len(demo_samples)

    db["tasks"][task_id]["status"] = "COMPLETED"
    db["tasks"][task_id]["progress"] = 100
    db["tasks"][task_id]["message"] = f"총 {total_found}개의 고성과 쇼츠 총알 수집이 완료되었습니다!"

@app.post("/api/dissector/collect")
def collect_channel_shorts(req: ChannelCollectRequest, bg_tasks: BackgroundTasks):
    task_id = f"task-{uuid.uuid4().hex[:8]}"
    db["tasks"][task_id] = {
        "id": task_id,
        "status": "QUEUED",
        "progress": 0,
        "message": "수집 큐에 등록되었습니다."
    }
    bg_tasks.add_task(run_collection_task, task_id, req)
    return {"task_id": task_id}

# ② 작업 현황 (Task Dashboard)
@app.get("/api/tasks")
def list_tasks():
    return list(db["tasks"].values())

# ③ 후보 검수 (Candidate Curation)
@app.get("/api/candidates")
def list_candidates(status: Optional[str] = None):
    videos = list(db["collected_videos"].values())
    if status and status != "ALL":
        videos = [v for v in videos if v["status"] == status]
        
    counts = {
        "total": len(db["collected_videos"]),
        "unused": sum(1 for v in db["collected_videos"].values() if v["status"] == "UNUSED"),
        "used": sum(1 for v in db["collected_videos"].values() if v["status"] == "USED"),
        "excluded": sum(1 for v in db["collected_videos"].values() if v["status"] == "EXCLUDED")
    }
    return {"counts": counts, "items": sorted(videos, key=lambda x: x.get("view_count", 0), reverse=True)}

@app.patch("/api/candidates/{video_id}/status")
def update_candidate_status(video_id: str, req: StatusUpdateRequest):
    if video_id not in db["collected_videos"]:
        raise HTTPException(status_code=404, detail="Video not found")
    db["collected_videos"][video_id]["status"] = req.status
    return {"video_id": video_id, "status": req.status}

@app.delete("/api/candidates/{video_id}")
def delete_candidate(video_id: str):
    if video_id in db["collected_videos"]:
        del db["collected_videos"][video_id]
        return {"status": "deleted", "video_id": video_id}
    raise HTTPException(status_code=404, detail="Video not found")

@app.post("/api/blacklist/channel")
def blacklist_channel(req: BlacklistRequest):
    db["channel_blacklists"].add(req.channel_id)
    affected = 0
    for v_id, v in db["collected_videos"].items():
        if v["channel_id"] == req.channel_id:
            v["status"] = "EXCLUDED"
            affected += 1
    return {"channel_id": req.channel_id, "excluded_count": affected}

# ④ & ⑤ 원테이크 (One-Take AI 대본 + Edge-TTS + 스타일 프리셋)
@app.post("/api/onetake/generate")
async def generate_onetake(req: OneTakeRequest):
    if req.video_id not in db["collected_videos"]:
        raise HTTPException(status_code=404, detail="Video not found")
    video = db["collected_videos"][req.video_id]

    comments = req.custom_comments or [
        "진짜 끝까지 보길 잘했다 ㅋㅋㅋ",
        "표정 변하는 거 보고 배꼽 잡고 구름",
        "이게 왜 1000만 뷰인지 바로 납득함"
    ]

    script_data = generate_jab_script(video["title"], comments)

    target_dir = MEDIA_DIR / req.video_id
    tts_result = await synthesize_script_segments(
        script_data["script_segments"],
        output_dir=str(target_dir),
        voice=req.voice_id
    )

    # Attach public web URLs to audios for direct playback
    for aud in tts_result["audios"]:
        p = Path(aud["file_path"])
        aud["web_url"] = f"/media/{req.video_id}/{p.name}"

    db["generated_scripts"][req.video_id] = {
        "video_id": req.video_id,
        "title_candidates": script_data["hook_titles"],
        "selected_title": script_data["hook_titles"][0],
        "script_segments": script_data["script_segments"],
        "tts_timeline": tts_result,
        "voice_id": req.voice_id,
        "style_preset": req.template_style,
        "top_header_text": req.top_header_text
    }

    return db["generated_scripts"][req.video_id]

@app.get("/api/onetake/{video_id}")
def get_onetake_result(video_id: str):
    if video_id not in db["generated_scripts"]:
        raise HTTPException(status_code=404, detail="One-take script not yet generated")
    return db["generated_scripts"][video_id]

# ⑥ 롱투숏 (Long-to-Shorts Engine)
@app.post("/api/long-to-shorts/extract")
def extract_long_to_shorts(req: LongToShortsRequest):
    result = extract_longform_highlights(
        youtube_url=req.video_url,
        target_duration=req.target_duration,
        highlight_count=req.highlight_count
    )
    # Store into DB for later CapCut export
    db["long_to_shorts"][req.video_url] = result
    return result

# ⑦ 멀티유즈 메타데이터 (YouTube Shorts, IG Reels, TikTok)
@app.post("/api/multiuse/generate")
def generate_multiuse(req: MultiuseRequest):
    if req.video_id not in db["collected_videos"]:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video = db["collected_videos"][req.video_id]
    script_entry = db["generated_scripts"].get(req.video_id)
    
    title = req.selected_title or (script_entry["selected_title"] if script_entry else video["title"])
    summary = " ".join([s["text"] for s in script_entry["script_segments"]]) if script_entry else video["title"]

    return generate_multiuse_packages(title=title, script_summary=summary)

# ⑧ CapCut 내보내기 (Option A: ZIP & Option B: 로컬 에이전트 번들)
@app.get("/api/export/bundle/{video_id}")
def get_capcut_bundle(video_id: str):
    if video_id not in db["generated_scripts"]:
        raise HTTPException(status_code=404, detail="One-take script required first")
    
    script_entry = db["generated_scripts"][video_id]
    video_entry = db["collected_videos"][video_id]
    
    tts_timeline = script_entry["tts_timeline"]
    total_us = tts_timeline["total_duration_us"]
    style_key = script_entry.get("style_preset", "NO_BACK_STYLE")
    top_header_text = script_entry.get("top_header_text")
    
    draft_content = build_draft_content(
        total_duration_us=total_us,
        video_path="./media/source_video.mp4",
        video_duration_us=int(video_entry["duration"] * 1_000_000),
        audio_segments=tts_timeline["audios"],
        text_segments=tts_timeline["texts"],
        style_key=style_key,
        top_header_text=top_header_text
    )
    draft_meta = build_draft_meta_info(
        project_name=f"ShortsHarvester_{video_id}",
        total_duration_us=total_us
    )

    return {
        "video_id": video_id,
        "project_name": f"ShortsHarvester_{video_id}",
        "draft_content": draft_content,
        "draft_meta_info": draft_meta,
        "audio_files": [a["file_path"] for a in tts_timeline["audios"]]
    }

@app.get("/api/export/zip/{video_id}")
def download_capcut_zip(video_id: str):
    bundle = get_capcut_bundle(video_id)
    zip_path = EXPORTS_DIR / f"{bundle['project_name']}.zip"
    
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("draft_content.json", json.dumps(bundle["draft_content"], ensure_ascii=False, indent=2))
        zf.writestr("draft_meta_info.json", json.dumps(bundle["draft_meta_info"], ensure_ascii=False, indent=2))
        
        for a_file in bundle["audio_files"]:
            p = Path(a_file)
            if p.exists():
                zf.write(p, arcname=f"media/{p.name}")
        
        zf.writestr("README.txt", "CapCut PC 프로젝트 폴더(%LocalAppData%\\CapCut\\User Data\\Projects\\com.lveditor.draft)에 이 폴더를 복사하세요.")

    return FileResponse(
        path=str(zip_path),
        filename=f"{bundle['project_name']}.zip",
        media_type="application/zip"
    )
