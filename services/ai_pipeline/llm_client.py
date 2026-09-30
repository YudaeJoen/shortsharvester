import json
import logging
import os
import re
from typing import Any, Optional

import httpx

logger = logging.getLogger(__name__)


def _get_config() -> Optional[dict]:
    base_url = os.environ.get("LLM_BASE_URL", "").strip().rstrip("/")
    model = os.environ.get("LLM_MODEL", "").strip()
    if not base_url or not model:
        return None
    return {
        "base_url": base_url,
        "api_key": os.environ.get("LLM_API_KEY", "").strip(),
        "model": model,
    }


def _extract_json(text: str) -> Any:
    text = text.strip()
    match = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if match:
        text = match.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    for open_ch, close_ch in (("[", "]"), ("{", "}")):
        start = text.find(open_ch)
        end = text.rfind(close_ch)
        if start != -1 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                continue
    raise json.JSONDecodeError("No JSON found in LLM response", text, 0)


def chat_json(prompt: str, timeout: float = 120.0, temperature: float = 0.8) -> Optional[Any]:
    """
    Call the OpenAI-compatible LLM endpoint (LLM_BASE_URL/LLM_API_KEY/LLM_MODEL) and parse JSON.
    Returns None when unconfigured or on any failure (caller handles fallback).
    """
    cfg = _get_config()
    if not cfg:
        return None
    headers = {"Content-Type": "application/json"}
    if cfg["api_key"]:
        headers["Authorization"] = f"Bearer {cfg['api_key']}"
    payload = {
        "model": cfg["model"],
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
    }
    try:
        resp = httpx.post(
            f"{cfg['base_url']}/chat/completions",
            json=payload,
            headers=headers,
            timeout=timeout,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        return _extract_json(content)
    except Exception as e:
        logger.warning(f"LLM endpoint call failed ({cfg['model']}): {e}")
        return None
