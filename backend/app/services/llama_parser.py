import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2"


def analyze_resume(raw_text: str) -> dict:
    prompt = f"""
You are an AI resume analyzer.

Return STRICT JSON with:
- skills (list)
- experience_summary (string)
- education_summary (string)
- ats_score (0-100)
- missing_skills (list)

Resume:
{raw_text}
"""

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False
        }
    )

    result = response.json()["response"]

    return {
        "raw_output": result  # later you can JSON-parse it properly
    }