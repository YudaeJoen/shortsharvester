from typing import Dict, Any, List

def generate_multiuse_packages(title: str, script_summary: str, tags: List[str] = None) -> Dict[str, Any]:
    """
    Generates tailored multi-platform metadata for YouTube Shorts, Instagram Reels, and TikTok.
    """
    clean_title = title.replace("[쇼츠]", "").replace("#shorts", "").strip()
    tag_list = tags or ["쇼츠", "유머", "공감", "레전드", "shorts", "viral"]

    # 1. YouTube Shorts Metadata
    yt_hashtags = " ".join([f"#{t}" for t in ["shorts", "쇼츠", "viral", "추천", *tag_list[:4]]])
    yt_description = f"""{clean_title}

{script_summary}

구독과 좋아요는 큰 힘이 됩니다! 🔔
더 많은 바이럴 쇼츠를 보고 싶다면 채널을 방문해 주세요.

{yt_hashtags}
"""
    yt_pinned_comment = f"여러분의 생각은 어떠신가요? 댓글로 자유롭게 남겨주세요! 👇"

    # 2. Instagram Reels Metadata
    ig_hashtags = " ".join([f"#{t}" for t in ["reels", "릴스", "reelsinstagram", "웃긴영상", "공감글", "짤방", "funnyreels", *tag_list]])
    ig_caption = f"""{clean_title} 🤣🔥

보자마자 뿜어서 가져왔습니다 ㅋㅋㅋ
친구 태그해서 같이 보세요! @친구이름

.
.
{ig_hashtags}
"""

    # 3. TikTok Metadata
    tt_hashtags = " ".join([f"#{t}" for t in ["fyp", "foryou", "추천", "틱톡", "viral", "funny", *tag_list[:3]]])
    tt_caption = f"""{clean_title} 끝까지 보면 소름 ㅋㅋㅋ {tt_hashtags}"""

    return {
        "youtube": {
            "title": f"{clean_title} #shorts",
            "description": yt_description.strip(),
            "hashtags": yt_hashtags,
            "pinned_comment": yt_pinned_comment
        },
        "instagram": {
            "caption": ig_caption.strip(),
            "hashtags": ig_hashtags
        },
        "tiktok": {
            "caption": tt_caption.strip(),
            "hashtags": tt_hashtags,
            "sound_recommendation": "트렌딩 오리지널 사운드 또는 박진감 있는 챌린지 BGM"
        }
    }
