import subprocess
import json
import logging
import os
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

def expand_keywords_with_llm(keyword: str, api_key: Optional[str] = None) -> List[Dict[str, str]]:
    """
    Expands base Korean keyword into viral search tags across multiple languages using Gemini or smart heuristic.
    Returns: [{"lang": "English", "tag": "#funnydogs"}, {"lang": "Japanese", "tag": "#犬のおもしろ動画"}, ...]
    """
    prompt = f"""
    키워드: '{keyword}'
    이 키워드와 관련된 유튜브 쇼츠에서 400만 뷰 이상을 달성할 수 있는 
    글로벌 바이럴 검색 키워드 및 해시태그를 영어, 일본어, 스페인어, 포르투갈어로 각각 2개씩 총 8개 생성해 주세요.
    반드시 다음 JSON 배열 규격으로만 응답하세요 (그 외 텍스트 금지):
    [
      {{"lang": "English", "tag": "funny dog moments", "hashtag": "#shorts #doglife"}},
      {{"lang": "Japanese", "tag": "犬 おもしろ ハプニング", "hashtag": "#犬のいる暮らし"}},
      {{"lang": "Spanish", "tag": "perros divertidos virales", "hashtag": "#perrosgraciosos"}}
    ]
    """

    from services.ai_pipeline.llm_client import chat_json
    llm_data = chat_json(prompt, timeout=60.0)
    if isinstance(llm_data, list) and llm_data:
        return llm_data

    gemini_key = api_key or os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=gemini_key)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            return json.loads(response.text)
        except Exception as e:
            logger.warning(f"Gemini keyword expansion failed: {e}")

    # Fallback high-quality heuristic multi-lingual mapping
    base_pool = {
        "강아지": [
            {"lang": "English", "tag": "funny dog shorts viral", "hashtag": "#dogshorts"},
            {"lang": "Japanese", "tag": "犬の可愛い瞬間 面白い", "hashtag": "#犬のいる暮らし"},
            {"lang": "Spanish", "tag": "perros graciosos virales", "hashtag": "#perrosdetiktok"},
            {"lang": "Global", "tag": "smart dog reaction", "hashtag": "#viralpuppy"}
        ],
        "고양이": [
            {"lang": "English", "tag": "funny cat fails shorts", "hashtag": "#catshorts"},
            {"lang": "Japanese", "tag": "猫のおもしろハプニング", "hashtag": "#猫動画"},
            {"lang": "Spanish", "tag": "gatos divertidos momentos", "hashtag": "#gatosgraciosos"},
            {"lang": "Global", "tag": "cute cat typing keyboard", "hashtag": "#funnycats"}
        ],
        "공감": [
            {"lang": "English", "tag": "relatable moments humor", "hashtag": "#relatable"},
            {"lang": "Japanese", "tag": "あるある 共感 面白い", "hashtag": "#あるある"},
            {"lang": "Spanish", "tag": "cosas que pasan comedia", "hashtag": "#humor"},
            {"lang": "Global", "tag": "people before after work", "hashtag": "#reallife"}
        ],
        "직장": [
            {"lang": "English", "tag": "office humor boss coworker", "hashtag": "#officelife"},
            {"lang": "Japanese", "tag": "仕事あるある 退勤", "hashtag": "#社会人"},
            {"lang": "Spanish", "tag": "vida en la oficina risas", "hashtag": "#trabajo"}
        ]
    }

    results = []
    for k, v in base_pool.items():
        if k in keyword:
            results.extend(v)
            break

    if not results:
        results = [
            {"lang": "English", "tag": f"viral {keyword} shorts", "hashtag": "#shorts"},
            {"lang": "English", "tag": f"best {keyword} moments", "hashtag": "#viral"},
            {"lang": "Japanese", "tag": f"{keyword} おもしろ動画", "hashtag": "#話題"},
            {"lang": "Spanish", "tag": f"{keyword} momentos divertidos", "hashtag": "#tendencia"}
        ]

    return results

def analyze_channel_profile(channel_url: str) -> Dict[str, Any]:
    """
    Quickly probes channel info: Title, Avatar, Subscriber estimation, and video count
    """
    clean_url = channel_url.rstrip("/")
    cmd = [
        "yt-dlp",
        "--dump-single-json",
        "--playlist-items", "1",
        f"{clean_url}/shorts"
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True, encoding="utf-8", errors="replace")
        data = json.loads(res.stdout)
        uploader = data.get("uploader") or data.get("channel") or clean_url.split("/")[-1]
        uploader_id = data.get("uploader_id") or data.get("channel_id") or clean_url.split("/")[-1]
        thumbnails = data.get("thumbnails", [])
        avatar = thumbnails[0]["url"] if thumbnails else ""
        return {
            "channel_title": uploader,
            "channel_id": uploader_id,
            "channel_url": clean_url,
            "avatar_url": avatar,
            "is_valid": True
        }
    except Exception as e:
        logger.warning(f"Channel probe failed for {channel_url}: {e}")
        name = clean_url.split("/")[-1].replace("@", "")
        return {
            "channel_title": name,
            "channel_id": name,
            "channel_url": clean_url,
            "avatar_url": f"https://api.dicebear.com/7.x/identicon/svg?seed={name}",
            "is_valid": True
        }

def extract_channel_shorts(
    channel_url: str,
    min_views: int = 4_000_000,
    max_duration: int = 40,
    sort_by: str = "views", # views or recent
    limit: int = 30
) -> Dict[str, Any]:
    """
    Collects shorts metadata from target channel and filters by views and duration.
    Returns parsed video items and summary statistics.
    """
    clean_url = channel_url.rstrip("/")
    target_url = clean_url if clean_url.endswith("/shorts") else f"{clean_url}/shorts"

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
        return {"items": [], "total_scanned": 0, "passed_count": 0}

    channel_title = data.get("channel") or data.get("uploader") or clean_url.split("/")[-1]
    channel_id = data.get("channel_id") or data.get("uploader_id") or clean_url.split("/")[-1]

    items = []
    entries = data.get("entries", [])
    total_scanned = len(entries)

    for entry in entries:
        if not entry:
            continue
        
        video_id = entry.get("id")
        title = entry.get("title", "Untitled")
        duration = entry.get("duration") or 0
        view_count = entry.get("view_count") or 0
        
        # Enforce filter criteria
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

    # Sort
    if sort_by == "views":
        items.sort(key=lambda x: x["view_count"], reverse=True)

    return {
        "channel_title": channel_title,
        "channel_id": channel_id,
        "total_scanned": total_scanned,
        "passed_count": len(items),
        "items": items
    }

def search_shorts_by_keyword(
    keyword: str,
    min_views: int = 4_000_000,
    max_duration: int = 40,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """
    Cross-searches YouTube Shorts using ytsearch without channel limitation.
    """
    search_query = f"ytsearch{limit}:{keyword} #shorts"
    cmd = [
        "yt-dlp",
        "--flat-playlist",
        "--dump-single-json",
        search_query
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, encoding="utf-8", errors="replace")
        data = json.loads(result.stdout)
        items = []
        for entry in data.get("entries", []):
            if not entry:
                continue
            dur = entry.get("duration") or 0
            views = entry.get("view_count") or 0
            if dur > 0 and dur > max_duration:
                continue
            if views > 0 and views < min_views:
                continue
            v_id = entry.get("id")
            thumbnails = entry.get("thumbnails", [])
            thumb = thumbnails[-1]["url"] if thumbnails else f"https://i.ytimg.com/vi/{v_id}/hqdefault.jpg"
            items.append({
                "youtube_video_id": v_id,
                "title": entry.get("title", "Untitled"),
                "channel_id": entry.get("uploader_id") or "unknown",
                "channel_title": entry.get("uploader") or entry.get("channel") or "YouTube Creator",
                "view_count": views,
                "duration": int(dur),
                "thumbnail_url": thumb,
                "video_url": f"https://www.youtube.com/shorts/{v_id}"
            })
        return items
    except Exception as e:
        logger.warning(f"Keyword search failed for '{keyword}': {e}")
        return []
