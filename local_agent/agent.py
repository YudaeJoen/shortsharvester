import os
import sys
import json
import shutil
import subprocess
import uvicorn
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

agent_app = FastAPI(
    title="ShortsHarvester CapCut Bridge Local Agent",
    version="1.0.0",
    description="ShortsHarvester background helper daemon for 1-click CapCut Desktop project injection."
)

agent_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def detect_capcut_draft_dir() -> Optional[Path]:
    """Detect local CapCut Desktop Draft storage path"""
    # 1. Windows default path
    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        p1 = Path(local_app_data) / "CapCut" / "User Data" / "Projects" / "com.lveditor.draft"
        if p1.exists():
            return p1

    # 2. JianYing (Chinese CapCut variant) path
    if local_app_data:
        p2 = Path(local_app_data) / "JianyingPro" / "User Data" / "Projects" / "com.lveditor.draft"
        if p2.exists():
            return p2

    # 3. macOS path
    home = Path.home()
    p3 = home / "Movies" / "CapCut" / "User Data" / "Projects" / "com.lveditor.draft"
    if p3.exists():
        return p3

    # Fallback sandbox path for development/demonstration
    fallback_dir = Path.home() / ".shortsharvester_capcut_drafts"
    os.makedirs(fallback_dir, exist_ok=True)
    return fallback_dir

class InjectDraftRequest(BaseModel):
    project_name: str
    draft_content: Dict[str, Any]
    draft_meta_info: Dict[str, Any]
    audio_files: Optional[list] = []
    auto_open: bool = True

@agent_app.get("/healthcheck")
def healthcheck():
    draft_dir = detect_capcut_draft_dir()
    return {
        "status": "online",
        "agent": "ShortsHarvester Local Bridge Daemon",
        "port": 28765,
        "draft_dir": str(draft_dir) if draft_dir else None,
        "is_capcut_ready": draft_dir is not None
    }

@agent_app.post("/api/inject-draft")
def inject_draft(req: InjectDraftRequest):
    draft_root = detect_capcut_draft_dir()
    if not draft_root:
        raise HTTPException(status_code=500, detail="CapCut Draft directory not detected on this system")

    # Create distinct project directory
    clean_name = "".join(c for c in req.project_name if c.isalnum() or c in ("_", "-"))
    project_dir = draft_root / clean_name
    media_dir = project_dir / "media"
    os.makedirs(media_dir, exist_ok=True)

    # Copy audio files if locally available
    local_audio_paths = []
    for a_path_str in req.audio_files or []:
        src = Path(a_path_str)
        if src.exists():
            dest = media_dir / src.name
            shutil.copy2(src, dest)
            local_audio_paths.append(str(dest).replace("\\", "/"))

    # Update draft_content paths with local absolute paths
    draft_content = req.draft_content
    materials = draft_content.get("materials", {})
    for idx, aud_mat in enumerate(materials.get("audios", [])):
        if idx < len(local_audio_paths):
            aud_mat["path"] = local_audio_paths[idx]

    # Write draft_content.json and draft_meta_info.json
    content_file = project_dir / "draft_content.json"
    meta_file = project_dir / "draft_meta_info.json"

    with open(content_file, "w", encoding="utf-8") as f:
        json.dump(draft_content, f, ensure_ascii=False, indent=2)

    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(req.draft_meta_info, f, ensure_ascii=False, indent=2)

    opened = False
    if req.auto_open and sys.platform == "win32":
        try:
            # Try launching CapCut
            local_app = os.environ.get("LOCALAPPDATA")
            possible_exes = [
                Path(local_app) / "CapCut" / "CapCut.exe" if local_app else None,
                Path("C:/Program Files/CapCut/CapCut.exe"),
                Path("C:/Program Files (x86)/CapCut/CapCut.exe")
            ]
            for exe in possible_exes:
                if exe and exe.exists():
                    subprocess.Popen([str(exe)])
                    opened = True
                    break
        except Exception:
            pass

    return {
        "status": "success",
        "project_dir": str(project_dir),
        "opened_capcut": opened,
        "message": f"'{req.project_name}' 프로젝트가 캡컷에 성공적으로 생성 및 주입되었습니다!"
    }

if __name__ == "__main__":
    print("[ShortsHarvester Local Agent] Starting daemon on http://127.0.0.1:28765 ...")
    uvicorn.run(agent_app, host="127.0.0.1", port=28765)
