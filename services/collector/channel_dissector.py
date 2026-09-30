import subprocess
import json
import logging
import re
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

def extract_channel_shorts(
    channel_url: str,
    min_views: int = 4_000_000,
    max_duration: int = 40,
    limit: int = 30
) -> List[Dict[str, Any]]:
    """
    Collect YouTube Shorts metadata using yt-dlp without consuming YouTube Data API quota.
    Filters by minimum view count and maximum duration.
    """
    clean_url = channel_url.rstrip("/")
    if not clean_url.endswith("/shorts"):
        target_url = f"{clean_url}/shorts"
    else:
        target_url = clean_url

    cmd = [
        "yt-dlp",
        "--flat-playlist",
        "--dump-single-json",
        "--playlist-items", f"1-{limit}",
        target_url
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True,
            encoding="utf-8",
            errors="replace"
        )
        data = json.loads(result.stdout)
    except Exception as e:
        logger.error(f"Error running yt-dlp on {target_url}: {e}")
        return []

    channel_title = data.get("channel") or data.get("uploader") or clean_url.split("/")[-1]
    channel_id = data.get("channel_id") or data.get("uploader_id") or clean_url.split("/")[-1]

    items = []
    for entry in data.get("entries", []):
        if not entry:
            continue
        
        video_id = entry.get("id")
        title = entry.get("title", "Untitled")
        duration = entry.get("duration") or 0
        view_count = entry.get("view_count") or 0
        
        # If view count is missing in flat-playlist, it can be estimated or fetched if needed
        # We enforce filter when available
        if duration > 0 and duration > max_duration:
            continue
        if view_count > 0 and view_count < min_views:
            continue

        thumbnails = entry.get("thumbnails", [])
        thumb_url = thumbnails[-1]["url"] if thumbnails else f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"

        items.append({
            "youtube_video_id": video_id,
            "title": title,
            "channel_id": channel_id,
            "channel_title": channel_title,
            "view_count": view_count,
            "duration": int(duration),
            "thumbnail_url": thumb_url,
            "video_url": f"https://www.youtube.com/shorts/{video_id}"
        })

    return items

def expand_keywords_multilingual(keyword: str) -> List[str]:
    """
    Expands base Korean keyword into viral search tags for global harvesting
    """
    # 기본 규칙 기반 확장 (LLM 연결 시 실시간 생성 가능)
    tag_mapping = {
        "강아지": ["funny dog shorts", "犬のおもしろ動画", "perros graciosos"],
        "고양이": ["funny cat shorts", "猫の可愛い動画", "gatos divertidos"],
        "공감": ["relatable shorts", "共感あるある", "cosas que pasan"],
        "직장": ["office life humor", "仕事あるある", "vida en la oficina"],
        "음식": ["korean street food", "韓国グルメ", "comida callejera"]
    }
    
    tags = [keyword]
    for k, v in tag_mapping.items():
        if k in keyword:
            tags.extend(v)
    return tags
