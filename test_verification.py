import sys
import os
import json
import asyncio
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from services.capcut_packager.draft_builder import build_draft_content, build_draft_meta_info
from services.collector.channel_dissector import expand_keywords_multilingual
from services.ai_pipeline.jab_script_generator import generate_jab_script
from services.tts_engine.edge_tts_runner import synthesize_script_segments
from local_agent.agent import detect_capcut_draft_dir

async def run_verification():
    print("=== [1. CapCut Draft Builder 검증] ===")
    audios = [{"file_path": "narration_1.mp3", "start_us": 0, "duration_us": 3000000}]
    texts = [{"text": "이 영상이 대박인 이유", "start_us": 0, "duration_us": 3000000}]
    draft = build_draft_content(
        total_duration_us=3000000,
        video_path="source.mp4",
        video_duration_us=3000000,
        audio_segments=audios,
        text_segments=texts
    )
    meta = build_draft_meta_info("Test_Project", 3000000)
    assert len(draft["tracks"]) == 3, "트랙 3개 (비디오, 오디오, 텍스트) 생성 실패"
    assert draft["materials"]["texts"][0]["text_color"] == "#FFE600", "노빠꾸 옐로우 텍스트 스타일 검증 실패"
    print(f"-> Draft tracks count: {len(draft['tracks'])}, Meta Project: {meta['draft_name']} (OK)")

    print("\n=== [2. 다국어 키워드 확장 검증] ===")
    expanded = expand_keywords_multilingual("강아지 레전드")
    print(f"-> 확장된 다국어 키워드: {expanded}")
    assert len(expanded) > 1, "키워드 다국어 확장 실패"

    print("\n=== [3. 3단계 잽 대본 생성 검증] ===")
    script = generate_jab_script(
        video_title="문 열어달라고 초인종 누르는 강아지",
        top_comments=["진짜 사람 아니냐고 ㅋㅋㅋ", "우리 집 강아지는 문 부수던데"]
    )
    print(f"-> 후킹 제목 3종: {script['hook_titles']}")
    print(f"-> 3단계 세그먼트 개수: {len(script['script_segments'])}")
    assert len(script["script_segments"]) == 3, "3단계 세그먼트 생성 실패"

    print("\n=== [4. Edge-TTS 음성 합성 및 타임코드 검증] ===")
    out_dir = str(ROOT_DIR / "temp_test_media")
    tts_res = await synthesize_script_segments(script["script_segments"], output_dir=out_dir)
    print(f"-> 총 오디오 길이: {tts_res['total_duration_us'] / 1_000_000:.2f}초")
    print(f"-> 오디오 트랙 개수: {len(tts_res['audios'])}, 텍스트 트랙 개수: {len(tts_res['texts'])}")
    assert len(tts_res["audios"]) == 3, "TTS 오디오 트랙 개수 불일치"

    print("\n=== [5. 로컬 CapCut Draft 경로 탐색 검증] ===")
    draft_dir = detect_capcut_draft_dir()
    print(f"-> 탐지된 로컬 캡컷 디렉토리: {draft_dir}")
    assert draft_dir is not None, "CapCut 디렉토리 탐색 실패"

    print("\n==========================================")
    print(">>> 모든 핵심 백엔드 및 CapCut 연동 검증 통과! <<<")
    print("==========================================")

if __name__ == "__main__":
    asyncio.run(run_verification())
