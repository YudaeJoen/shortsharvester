import json
import uuid
import time
from typing import List, Dict, Any, Optional

def generate_capcut_id() -> str:
    """Generate 32-character hexadecimal UUID uppercase string"""
    return uuid.uuid4().hex.upper()

STYLE_PRESETS = {
    "NO_BACK_STYLE": {
        "name": "노빠꾸 옐로우 (시그니처)",
        "font_title": "Pretendard-Black",
        "text_color": "#FFE600",
        "border_color": "#000000",
        "border_width": 0.18,
        "font_size": 13,
        "pos_y": -0.65
    },
    "NEON_RED_STYLE": {
        "name": "네온 사이버 레드 (긴급/충격)",
        "font_title": "Pretendard-Bold",
        "text_color": "#FF3B30",
        "border_color": "#FFFFFF",
        "border_width": 0.15,
        "font_size": 13,
        "pos_y": -0.65
    },
    "INSTA_LETTERBOX": {
        "name": "인스타 상하단 바 템플릿",
        "font_title": "Pretendard-Bold",
        "text_color": "#FFFFFF",
        "border_color": "#000000",
        "border_width": 0.10,
        "font_size": 11,
        "pos_y": -0.75,
        "has_top_bar": True,
        "top_bar_title": "끝까지 보면 소름 돋는 순간 🔥"
    },
    "CLEAN_WHITE": {
        "name": "클린 화이트 & 섀도우",
        "font_title": "Pretendard-SemiBold",
        "text_color": "#FFFFFF",
        "border_color": "#111111",
        "border_width": 0.12,
        "font_size": 12,
        "pos_y": -0.68
    }
}

def create_text_material(
    text_id: str,
    content_text: str,
    font_size: int = 12,
    text_color: str = "#FFE600",
    stroke_color: str = "#000000",
    font_title: str = "Pretendard-Bold"
) -> Dict[str, Any]:
    """Create a text material with high-contrast styling"""
    styled_content = f"<size={font_size}><color={text_color}><stroke={stroke_color} size=3>{content_text}</stroke></color></size>"
    
    return {
        "id": text_id,
        "content": styled_content,
        "font_path": "",
        "font_title": font_title,
        "text_color": text_color,
        "border_color": stroke_color,
        "border_width": 0.15,
        "typesetting": 0,
        "type": "text"
    }

def create_video_material(video_id: str, file_path: str, duration_us: int, width: int = 1080, height: int = 1920) -> Dict[str, Any]:
    return {
        "id": video_id,
        "path": file_path.replace("\\", "/"),
        "duration": duration_us,
        "width": width,
        "height": height,
        "material_name": file_path.split("/")[-1].split("\\")[-1],
        "type": "video"
    }

def create_audio_material(audio_id: str, file_path: str, duration_us: int) -> Dict[str, Any]:
    return {
        "id": audio_id,
        "path": file_path.replace("\\", "/"),
        "duration": duration_us,
        "material_name": file_path.split("/")[-1].split("\\")[-1],
        "type": "audio"
    }

def build_draft_content(
    total_duration_us: int,
    video_path: str,
    video_duration_us: int,
    audio_segments: List[Dict[str, Any]],
    text_segments: List[Dict[str, Any]],
    style_key: str = "NO_BACK_STYLE",
    top_header_text: Optional[str] = None
) -> Dict[str, Any]:
    """
    Construct complete draft_content.json schema compatible with CapCut Desktop.
    Supports style presets and Insta letterbox top bar text.
    """
    preset = STYLE_PRESETS.get(style_key, STYLE_PRESETS["NO_BACK_STYLE"])
    font_size = preset["font_size"]
    text_color = preset["text_color"]
    stroke_color = preset["border_color"]
    font_title = preset["font_title"]
    pos_y = preset["pos_y"]

    speed_id = generate_capcut_id()
    main_video_id = generate_capcut_id()

    materials_videos = [
        create_video_material(main_video_id, video_path, video_duration_us)
    ]
    materials_audios = []
    materials_texts = []
    materials_speeds = [
        {
            "curve_speed": None,
            "id": speed_id,
            "mode": 0,
            "speed": 1.0,
            "type": "speed"
        }
    ]

    # 1. Main Video Track
    video_segments_list = [
        {
            "id": generate_capcut_id(),
            "material_id": main_video_id,
            "source_timerange": {"duration": min(video_duration_us, total_duration_us), "start": 0},
            "target_timerange": {"duration": min(video_duration_us, total_duration_us), "start": 0},
            "speed_id": speed_id,
            "volume": 0.4
        }
    ]

    # 2. Audio Tracks (TTS Narrations)
    audio_segments_list = []
    for aud in audio_segments:
        m_id = generate_capcut_id()
        materials_audios.append(
            create_audio_material(m_id, aud["file_path"], aud["duration_us"])
        )
        audio_segments_list.append({
            "id": generate_capcut_id(),
            "material_id": m_id,
            "source_timerange": {"duration": aud["duration_us"], "start": 0},
            "target_timerange": {"duration": aud["duration_us"], "start": aud["start_us"]},
            "speed_id": speed_id,
            "volume": 1.0
        })

    # 3. Subtitle Text Track
    text_segments_list = []
    for txt in text_segments:
        m_id = generate_capcut_id()
        materials_texts.append(
            create_text_material(m_id, txt["text"], font_size=font_size, text_color=text_color, stroke_color=stroke_color, font_title=font_title)
        )
        text_segments_list.append({
            "id": generate_capcut_id(),
            "material_id": m_id,
            "source_timerange": {"duration": txt["duration_us"], "start": 0},
            "target_timerange": {"duration": txt["duration_us"], "start": txt["start_us"]},
            "clip": {
                "scale": {"x": 1.0, "y": 1.0},
                "transform": {"x": 0.0, "y": pos_y}
            }
        })

    tracks = [
        {
            "id": generate_capcut_id(),
            "type": "video",
            "segments": video_segments_list
        },
        {
            "id": generate_capcut_id(),
            "type": "audio",
            "segments": audio_segments_list
        },
        {
            "id": generate_capcut_id(),
            "type": "text",
            "segments": text_segments_list
        }
    ]

    # 4. Optional Top Letterbox Bar Header Text
    header_text = top_header_text or preset.get("top_bar_title")
    if preset.get("has_top_bar") or top_header_text:
        top_mat_id = generate_capcut_id()
        materials_texts.append(
            create_text_material(top_mat_id, header_text, font_size=12, text_color="#FFE600", stroke_color="#000000")
        )
        tracks.append({
            "id": generate_capcut_id(),
            "type": "text",
            "segments": [
                {
                    "id": generate_capcut_id(),
                    "material_id": top_mat_id,
                    "source_timerange": {"duration": total_duration_us, "start": 0},
                    "target_timerange": {"duration": total_duration_us, "start": 0},
                    "clip": {
                        "scale": {"x": 1.0, "y": 1.0},
                        "transform": {"x": 0.0, "y": 0.78} # Top Letterbox bar position
                    }
                }
            ]
        })

    draft = {
        "canvas_config": {
            "height": 1920,
            "width": 1080,
            "ratio": "original"
        },
        "color_space": 0,
        "config": {
            "adjust_max_index": 1,
            "attachment_info": [],
            "combination_max_index": 1,
            "export_range": None,
            "extract_audio_last_index": 1,
            "lyrics_recognition_id": "",
            "lyrics_sync": True,
            "lyrics_taskinfo": [],
            "maintrack_adsorb": True,
            "material_save_mode": 0,
            "original_sound_last_index": 1,
            "record_audio_last_index": 1,
            "sticker_max_index": 1,
            "subtitle_keywords_config": None,
            "video_mute": False,
            "zoom_info_params": None
        },
        "duration": total_duration_us,
        "materials": {
            "videos": materials_videos,
            "audios": materials_audios,
            "texts": materials_texts,
            "speeds": materials_speeds
        },
        "tracks": tracks
    }
    return draft

def build_draft_meta_info(project_name: str, total_duration_us: int) -> Dict[str, Any]:
    project_id = str(uuid.uuid4()).upper()
    now_us = int(time.time() * 1_000_000)
    return {
        "draft_cloud_capcut_id": "",
        "draft_cloud_last_action_download": False,
        "draft_cloud_materials": [],
        "draft_cover": "draft_cover.jpg",
        "draft_fold_path": "",
        "draft_id": project_id,
        "draft_is_ai_shorts": True,
        "draft_is_invisible": False,
        "draft_materials": [],
        "draft_materials_copied_path": [],
        "draft_name": project_name,
        "draft_new_version": "",
        "draft_removable_storage_device": "",
        "draft_root_path": "",
        "draft_timeline_materials_size_": 0,
        "tm_draft_create": now_us,
        "tm_draft_modified": now_us,
        "tm_duration": total_duration_us
    }
