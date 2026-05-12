from huggingface_hub import InferenceClient
from app.core.config import settings
import json

client = InferenceClient(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    token=settings.hf_token
)


def classify_intent(message: str):
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
  "sub_intent": "rewrite | tailor | ats | critique | match | null",

  "needs_job_context": true,
  "job_query": "Google Software Engineer III",

  "confidence": 0.0,
  "reason": "..."
}

Rules:
- If user mentions job role (QA, SWE, data engineer) → resume_engine + sub_intent = tailor
- If user asks improve resume → resume_engine + sub_intent = rewrite
- If user asks ATS keywords → resume_engine + sub_intent = ats
- If user compares resume to jobs → job_search OR resume_engine + match (prefer resume_engine)
- No markdown. JSON only.
"""
            },
            {"role": "user", "content": message}
        ],
        max_tokens=200,
        temperature=0.1
    )

    content = response.choices[0].message["content"]

    try:
        return json.loads(content)
    except Exception:
        return {
            "intent": "general_chat",
            "sub_intent": None,
            "confidence": 0.5,
            "reason": "parse_failed_fallback"
        }