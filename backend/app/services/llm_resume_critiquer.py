import json
import re

from huggingface_hub import InferenceClient
from app.core.config import settings

client = InferenceClient(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    token=settings.hf_token
)


def critique_resume_with_edits(resume_text: str):
    prompt = f"""
You are an expert software engineering resume reviewer.

Analyze the resume and return ONLY valid JSON.

Format:

{{
  "type": "resume_suggestions",
  "summary": "short summary",
  "changes": [
    {{
      "id": "1",
      "old_text": "original phrase from resume",
      "new_text": "improved phrase",
      "reason": "why this should be changed",
      "category": "impact"
    }}
  ]
}}

Rules:
- Return 3 to 7 valuable edits
- Focus on bullet strength, metrics, ATS keywords, clarity
- Do NOT invent fake jobs or fake companies
- old_text MUST exist in the resume
- new_text should be stronger but realistic
- JSON only. No markdown.

Resume:

{resume_text}
"""

    try:
        response = client.chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": "You return only machine-readable JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=700,
            temperature=0.3
        )

        message = response.choices[0].message
        content = (
            message["content"]
            if isinstance(message, dict)
            else message.content
        )

        parsed = safe_json_parse(content)
        print(parsed)
        return parsed

    except Exception as e:
        return {
            "type": "resume_suggestions",
            "summary": f"AI generation failed: {str(e)}",
            "changes": []
        }


def safe_json_parse(text: str):
    """
    Handles model adding junk before/after JSON.
    """
    try:
        return json.loads(text)
    except:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except:
                pass

    return {
        "type": "resume_suggestions",
        "summary": "Could not parse model output.",
        "changes": []
    }