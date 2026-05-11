import json
import re
from turtle import mode

from app.db.supabase import supabase
from app.core.embeddings import model
from app.services.jsearch_jobs import fetch_jobs, format_jobs_for_llm
from huggingface_hub import InferenceClient
from app.core.config import settings

client = InferenceClient(
    model="meta-llama/Meta-Llama-3-70B-Instruct",
    token=settings.hf_token
)


def resume_engine(resume_id: str, user_id: str, query: str, mode: str = "general"):
    # ---------------- 1. RAG: resume chunks ----------------
    query_embedding = model.encode(query).tolist()

    chunks = supabase.rpc(
        "match_resume_chunks",
        {
            "query_embedding": query_embedding,
            "match_count": 10,
            "filter_resume_id": resume_id
        }
    ).execute().data or []

    resume_context = "\n\n".join([c["content"] for c in chunks])

    # ---------------- 2. OPTIONAL: JOB CONTEXT ----------------
    job_context = ""

    if mode in ["job", "ats", "analyze_jobs", "tailor"]:
        jobs = fetch_jobs(query)
        job_context = format_jobs_for_llm(jobs[:5])
    print("JOB CONTEXT:", job_context)
    print("RESUME CONTEXT:", resume_context)
    # ---------------- 3. BUILD PROMPT ----------------
    prompt = f"""
You are an expert resume optimization AI.

MODE: {mode}

You are given:

[RESUME CONTEXT]
{resume_context}

[JOB CONTEXT]
{job_context}

TASK:
Depending on MODE:

- general → improve clarity, impact, structure
- job → tailor resume to job requirements
- ats → optimize keywords for ATS systems
- analyze_jobs → identify missing skills vs jobs

Rules:
- Return ONLY valid JSON
- 3–7 changes max
- old_text must exist in resume context
- no hallucinated experience
- "Do not try to edit headings, such as 'Experience', 'Technical Skills' 'Education'. Focus on bullet points and descriptions."
- "Do not remove skills or experience, only add or enhance. If something is not mentioned in the job or resume context, do not add it."
- List target job in summary if mode is job or ats.

FORMAT:
{{
  "mode": "{mode}",
  "summary": "...",
  "changes": [
    {{
      "old_text": "...",
      "new_text": "...",
      "reason": "...",
      "category": "impact|ats|clarity"
    }}
  ]
}}
"""

    # ---------------- 4. LLM CALL ----------------
    response = client.chat_completion(
        messages=[
            {"role": "system", "content": "Return ONLY valid JSON."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=900,
        temperature=0.3
    )

    content = response.choices[0].message["content"]
    print("Raw model output:", content)
    # ---------------- 5. SAFE PARSE ----------------
    raw = safe_json_parse(content)

    job_aware = mode in ["job", "ats", "analyze_jobs"]
    print("Normalized output:", normalize_resume_output(raw, job_aware=job_aware))
    return normalize_resume_output(raw, job_aware=job_aware)

def safe_json_parse(text: str):
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
        "mode": "error",
        "summary": "Failed to parse model output",
        "changes": []
    }
def normalize_resume_output(raw: dict, job_aware: bool = False):
    return {
        "type": "resume_engine",
        "mode": raw.get("mode", "general"),
        "data": {
            "summary": raw.get("summary", ""),
            "changes": raw.get("changes", [])
        },
        "meta": {
            "job_aware": job_aware
        }
    }
    