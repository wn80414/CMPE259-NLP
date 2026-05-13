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
  "sub_intent": "rewrite | critique",

  "job_context": "", e.g: "Software Engineer", "Cloud Engineer", "Quality Assurance Engineer"

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