from huggingface_hub import InferenceClient
from app.core.config import settings
import json
import functools
import time

client = InferenceClient(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    token=settings.hf_token
)


@functools.lru_cache(maxsize=256)
def classify_intent(message: str) -> dict:
    """
    Classifies user message intent with LRU caching.
    Repeated messages return instantly from cache.
    """
    response = client.chat_completion(
        messages=[
            {
                "role": "system",
                "content": """
You are an intent classifier for a resume AI system.

Classify into ONLY ONE of:

1. resume_engine
   (resume feedback, rewrite, ATS optimization, tailoring, improvements)

2. general_chat
   (everything else)

Return ONLY valid JSON:

{
  "intent": "resume_engine | general_chat",
  "sub_intent": "rewrite | critique | tailor | domain_error",
  "job_context": "",   // e.g: "Software Engineer", "Cloud Engineer", "QA Engineer"
  "confidence": 0.0,
  "reason": "..."
}

Rules:
- If user mentions job role (SRE, QA, SWE, data engineer) → resume_engine + sub_intent = tailor
- If user asks improve resume → resume_engine + sub_intent = rewrite
- If user asks ATS keywords → resume_engine + sub_intent = rewrite
- No markdown. JSON only.
"""
            },
            {"role": "user", "content": message}
        ],
        max_tokens=200,
        temperature=0.01
    )

    content = response.choices[0].message["content"]

    try:
        return json.loads(content)
    except Exception:
        return {
            "intent": "general_chat",
            "sub_intent": "domain_error",
            "confidence": 0.5,
            "reason": "parse_failed_fallback"
        }


# ---------- Cache utilities for monitoring ----------

def get_cache_info():
    """Check cache stats (hits, misses, size)."""
    return classify_intent.cache_info()


def clear_cache():
    """Clear the LRU cache (useful for testing)."""
    classify_intent.cache_clear()
    print("Intent classifier cache cleared.")


# ---------- Timing comparison ----------

def compare_cached_vs_uncached(message: str):
    """Compare response time with and without cache."""
    # Warm up – ensure model is loaded
    classify_intent(message)
    classify_intent.cache_clear()

    # Uncached
    start = time.perf_counter()
    result_uncached = classify_intent(message)
    uncached_time = time.perf_counter() - start

    # Cached (second call)
    start = time.perf_counter()
    result_cached = classify_intent(message)
    cached_time = time.perf_counter() - start

    return {
        "uncached_time": round(uncached_time, 4),
        "cached_time": round(cached_time, 6),
        "speedup": round(uncached_time / cached_time, 1),
        "result": result_uncached
    }
