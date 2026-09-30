import json
import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

def generate_fallback_jab_script(video_title: str, top_comments: List[str]) -> Dict[str, Any]:
    """
    Fallback deterministic script generator when API key is not configured or offline.
    """
    clean_title = video_title.replace("[쇼츠]", "").replace("#shorts", "").strip()
    c1 = top_comments[0] if len(top_comments) > 0 else "이게 진짜 가능한 상황인가요?"
    c2 = top_comments[1] if len(top_comments) > 1 else "보자마자 뿜었습니다 ㅋㅋㅋ"

    return {
        "hook_titles": [
            f"도대체 왜 이럴까요? {clean_title}",
            f"댓글 난리난 역대급 장면 ({clean_title})",
            f"10명 중 9명이 공감한 바로 그 순간"
        ],
        "script_segments": [
            {
                "step": "HOOK",
                "text": f"잠깐만요, 여러분은 이 장면 보고 무슨 생각 드셨나요?",
                "est_duration": 3.0,
                "est_duration_us": 3000000
            },
            {
                "step": "SITUATION",
                "text": f"네티즌 반응도 난리 났는데요, '{c1}'라면서 다들 빵 터졌습니다. 진짜 레전드네요.",
                "est_duration": 8.0,
                "est_duration_us": 8000000
            },
            {
                "step": "PUNCHLINE",
                "text": f"여러분이라면 이 상황에서 어떻게 하셨을 것 같나요? 댓글로 의견 남겨주세요!",
                "est_duration": 4.0,
                "est_duration_us": 4000000
            }
        ]
    }

def _build_jab_prompt(video_title: str, top_comments: List[str]) -> str:
    comments_formatted = "\n".join(f"- {c}" for c in top_comments[:15])
    return f"""
당신은 1000만 조회수를 만드는 숏폼 바이럴 전문 디렉터입니다.
아래 영상 제목과 시청자들의 공감 베스트 댓글을 기반으로,
시청자의 이탈을 막고 참여를 유도하는 3단계 '잽(Jab)' 대본과 후킹 제목 3종을 작성하세요.

[영상 제목]: {video_title}
[상위 공감 댓글]:
{comments_formatted}

[작성 지침]:
1. 제목 3종은 (도발형, 호기심 유발형, 극단적 공감형)으로 작성.
2. 3단계 대본:
   - HOOK (1단계): 첫 3초 이탈 방지 강렬한 오프닝 질문.
   - SITUATION (2단계): 댓글 반응과 영상 상황을 위트 있게 요약하는 본론 (10초 내외).
   - PUNCHLINE (3단계): 반전 마무리 및 시청자의 댓글 작성을 유도하는 엔딩 (4초 내외).
3. 텍스트는 TTS로 읽었을 때 자연스러운 구어체로 작성할 것.
4. 반드시 아래 JSON 규격으로만 응답하세요 (그 외 텍스트 금지):
{{"hook_titles": ["제목1", "제목2", "제목3"], "script_segments": [{{"step": "HOOK", "text": "...", "est_duration": 3.0}}, {{"step": "SITUATION", "text": "...", "est_duration": 8.0}}, {{"step": "PUNCHLINE", "text": "...", "est_duration": 4.0}}]}}
"""


def _finalize_jab_data(res_data: Dict[str, Any]) -> Dict[str, Any]:
    for seg in res_data.get("script_segments", []):
        dur = seg.get("est_duration", 4.0)
        seg["est_duration_us"] = int(dur * 1_000_000)
    return res_data


def generate_jab_script(
    video_title: str,
    top_comments: List[str],
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate 3-step viral jab script and 3 hooking title candidates.
    Provider order: OpenAI-compatible LLM (LLM_BASE_URL) -> Google Gemini -> template fallback.
    """
    prompt = _build_jab_prompt(video_title, top_comments)

    from services.ai_pipeline.llm_client import chat_json
    llm_data = chat_json(prompt)
    if isinstance(llm_data, dict) and llm_data.get("hook_titles") and llm_data.get("script_segments"):
        return _finalize_jab_data(llm_data)

    gemini_key = api_key or os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        logger.info("No LLM endpoint or GEMINI_API_KEY. Using structured template generator.")
        return generate_fallback_jab_script(video_title, top_comments)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=gemini_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": "OBJECT",
                    "properties": {
                        "hook_titles": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "script_segments": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "step": {"type": "STRING", "enum": ["HOOK", "SITUATION", "PUNCHLINE"]},
                                    "text": {"type": "STRING"},
                                    "est_duration": {"type": "NUMBER"}
                                },
                                "required": ["step", "text", "est_duration"]
                            }
                        }
                    },
                    "required": ["hook_titles", "script_segments"]
                }
            )
        )
        return _finalize_jab_data(json.loads(response.text))
    except Exception as e:
        logger.error(f"Gemini generation error: {e}. Falling back to template.")
        return generate_fallback_jab_script(video_title, top_comments)
