from huggingface_hub import InferenceClient
from app.core.config import settings
import json

client = InferenceClient(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    token=settings.hf_token
)

def analyze_resume(text: str):
    response = client.chat_completion(
        messages=[
            {"role": "system", "content": "Return JSON only for resume analysis."},
            {"role": "user", "content": text}
        ],
        max_tokens=800,
        temperature=0.2
    )

    return response.choices[0].message["content"]



def parse_resume(text: str):
    response = client.chat_completion(
        messages=[
            {
                "role": "system",
                "content": """
Return ONLY valid JSON.
No markdown.
No explanation.
Do not add extra keys.
Do not omit required fields.
Ensure output is complete and syntactically valid JSON.
Awards are sometimes not included in resumes, but if they are, extract them as an array of strings. If not present, return an empty array.
If missing data → empty string or empty array.

Return EXACTLY this schema:

{
  "name": "",
  "email": "",
  "phone": "",
  "linkedin": "",
  "github": "",
  "education": [
    {
      "school": "",
      "degree": "",
      "location": "",
      "graduation_date": "",
      "gpa": "",
      "coursework": []
    }
  ],
  "experience": [
    {
      "company": "",
      "role": "",
      "location": "",
      "start_date": "",
      "end_date": "",
      "bullets": []
    }
  ],
  "projects": [
    {
      "name": "",
      "tech_stack": [],
      "bullets": []
    }
  ],
  "skills": {
    "languages": [],
    "cloud": [],
    "ml_ai": [],
    "tools": []
  },
  "awards": [],
  "raw_summary": ""
}

Rules:
- If missing field → use empty string or empty list
- Do NOT hallucinate
- Do NOT add explanations
- Output ONLY valid JSON
"""
            },
            {"role": "user", "content": text}
        ],
        max_tokens=2000,
        temperature=0.1
    )

    content = response.choices[0].message["content"]
    print("LLM Output:", content)  # Debugging
    # Safe parse
    return safe_parse_llm(content)

def safe_parse_llm(text: str):
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # attempt cleanup
        text = text.strip()

        # sometimes models wrap in ```json
        if text.startswith("```"):
            text = text.strip("```json").strip("```")

        # retry
        return json.loads(text)