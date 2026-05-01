from huggingface_hub import InferenceClient
from app.core.config import settings
import json

client = InferenceClient(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    token=settings.hf_token
)


INTENT_SCHEMA = {
    "intent": "",
    "confidence": 0.0,
    "reason": ""
}


def classify_intent(message: str):
    response = client.chat_completion(
        messages=[
            {
                "role": "system",
                "content": """
You are an intent classifier for a resume AI system.

Classify the user message into ONE of:

- resume_critique (user wants resume feedback or improvement)
- web_search (user asks for external info or lookup)
- resume_history (user asks about past uploads or stored resumes)
- general_chat (anything else)

Return ONLY valid JSON in this format:

{
  "intent": "...",
  "confidence": 0.0,
  "reason": "short explanation"
}

No markdown. No extra text.
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
        # fallback safe default
        return {
            "intent": "general_chat",
            "confidence": 0.5,
            "reason": "parse_failed_fallback"
        }