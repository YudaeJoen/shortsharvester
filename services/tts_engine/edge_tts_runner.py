import asyncio
import os
import edge_tts
from typing import List, Dict, Any

SUPPORTED_VOICES = [
    {"id": "ko-KR-SunHiNeural", "name": "선희 (차분하고 또렷한 여성)", "gender": "Female"},
    {"id": "ko-KR-InJoonNeural", "name": "인준 (신뢰감 있는 남성)", "gender": "Male"},
    {"id": "ko-KR-HyunsuNeural", "name": "현수 (활기찬 젊은 남성)", "gender": "Male"}
]

async def generate_single_tts(text: str, output_path: str, voice: str = "ko-KR-SunHiNeural", rate: str = "+0%") -> str:
    """Generate audio file for a single text chunk"""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate)
    await communicate.save(output_path)
    return output_path

def estimate_audio_duration_us(text: str, speed_wpm: float = 250.0) -> int:
    """
    Fallback duration estimation in microseconds if file metadata probe is not available.
    Roughly 4-5 Korean characters per second (~250 chars/min).
    """
    char_count = len(text.replace(" ", ""))
    sec = max(1.2, char_count / 4.5)
    return int(sec * 1_000_000)

async def synthesize_script_segments(
    segments: List[Dict[str, Any]],
    output_dir: str,
    voice: str = "ko-KR-SunHiNeural"
) -> Dict[str, Any]:
    """
    Synthesizes each 3-step jab segment into distinct MP3 files and creates
    timeline mappings with microsecond offsets.
    """
    os.makedirs(output_dir, exist_ok=True)
    audio_records = []
    text_records = []
    
    current_time_us = 0

    for idx, seg in enumerate(segments):
        txt = seg.get("text", "")
        file_name = f"narration_seg_{idx+1}.mp3"
        file_path = os.path.join(output_dir, file_name)

        try:
            await generate_single_tts(txt, file_path, voice=voice)
        except Exception as e:
            # Fallback placeholder if offline/error
            pass

        # Estimate duration
        duration_us = seg.get("est_duration_us") or estimate_audio_duration_us(txt)

        audio_records.append({
            "id": f"audio_seg_{idx+1}",
            "file_path": file_path,
            "start_us": current_time_us,
            "duration_us": duration_us
        })

        text_records.append({
            "id": f"text_seg_{idx+1}",
            "text": txt,
            "start_us": current_time_us,
            "duration_us": duration_us
        })

        current_time_us += duration_us

    return {
        "total_duration_us": current_time_us,
        "audios": audio_records,
        "texts": text_records
    }
