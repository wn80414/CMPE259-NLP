import re
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from huggingface_hub import InferenceClient
from app.core.config import settings

client = InferenceClient(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    token=settings.hf_token
)

# ---------- helpers ----------
def _call_llm(system_prompt: str, user_text: str, max_tokens=800, temperature=0.1) -> str:
    response = client.chat_completion(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ],
        max_tokens=max_tokens,
        temperature=temperature
    )
    return response.choices[0].message["content"]

def safe_parse_llm(text: str, expected_keys: list = None):
    try:
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            text = match.group(1)
        text = text.strip()
        parsed = json.loads(text)
        if expected_keys:
            for key in expected_keys:
                if key not in parsed:
                    parsed[key] = "" if isinstance({}.get(key), str) else []
        return parsed
    except json.JSONDecodeError:
        print(f"Failed to parse: {text[:200]}")
        return {} if not expected_keys else {k: "" for k in expected_keys}

# ---------- Independent extraction functions (no context) ----------
def _extract_contact(text: str) -> dict:
    prompt = f"""Extract name, email, phone, LinkedIn, and GitHub from this resume.
Return ONLY valid JSON with these keys: name, email, phone, linkedin, github.
If missing, use empty string.

Resume:
{text}
"""
    raw = _call_llm("Return ONLY valid JSON. No markdown.", prompt)
    return safe_parse_llm(raw, expected_keys=["name", "email", "phone", "linkedin", "github"])


def _extract_education(text: str) -> list:
    prompt = f"""Extract education entries from this resume.
Return a JSON array of objects with: school, degree, location, graduation_date, gpa, coursework (array of strings).
If missing, return an empty array.

Resume:
{text}
"""
    raw = _call_llm("Return ONLY valid JSON array.", prompt)
    result = safe_parse_llm(raw)
    return result if isinstance(result, list) else []


def _extract_experience(text: str) -> list:
    prompt = f"""Extract work experience entries from this resume.
Return a JSON array of objects with: company, role, location, start_date, end_date, bullets (array of strings).
If missing, return an empty array.

Resume:
{text}
"""
    raw = _call_llm("Return ONLY valid JSON array.", prompt, max_tokens=1200)
    result = safe_parse_llm(raw)
    return result if isinstance(result, list) else []


def _extract_projects(text: str) -> list:
    prompt = f"""Extract technical projects from this resume.
Return a JSON array of objects with: name, tech_stack (array of strings), bullets (array of strings).
If missing, return an empty array.

Resume:
{text}
"""
    raw = _call_llm("Return ONLY valid JSON array.", prompt, max_tokens=1000)
    result = safe_parse_llm(raw)
    return result if isinstance(result, list) else []


def _extract_skills(text: str) -> dict:
    prompt = f"""Extract technical skills from this resume into categories: languages, cloud, ml_ai, tools.
Return a JSON object with those four keys, each an array of strings.
If missing, return empty arrays.

Resume:
{text}
"""
    raw = _call_llm("Return ONLY valid JSON object.", prompt)
    result = safe_parse_llm(raw, expected_keys=["languages", "cloud", "ml_ai", "tools"])
    return result if isinstance(result, dict) else {"languages": [], "cloud": [], "ml_ai": [], "tools": []}


def _extract_awards(text: str) -> list:
    prompt = f"""Extract awards/honors from this resume as an array of strings.
If missing, return an empty array.

Resume:
{text}
"""
    raw = _call_llm("Return ONLY valid JSON array.", prompt)
    result = safe_parse_llm(raw)
    return result if isinstance(result, list) else []


# ---------- Main parallel parser ----------
def parse_resume(text: str) -> dict:
    """
    Extract all sections in parallel using independent prompts.
    Returns full resume dictionary matching original schema.
    """
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {
            executor.submit(_extract_contact, text): "contact",
            executor.submit(_extract_education, text): "education",
            executor.submit(_extract_experience, text): "experience",
            executor.submit(_extract_projects, text): "projects",
            executor.submit(_extract_skills, text): "skills",
            executor.submit(_extract_awards, text): "awards",
        }
        results = {}
        for future in as_completed(futures):
            key = futures[future]
            try:
                results[key] = future.result()
            except Exception as e:
                print(f"Error extracting {key}: {e}")
                results[key] = None

    contact = results.get("contact", {})
    education = results.get("education", []) or []
    experience = results.get("experience", []) or []
    projects = results.get("projects", []) or []
    skills = results.get("skills", {}) or {}
    awards = results.get("awards", []) or []

    return {
        "name": contact.get("name", ""),
        "email": contact.get("email", ""),
        "phone": contact.get("phone", ""),
        "linkedin": contact.get("linkedin", ""),
        "github": contact.get("github", ""),
        "education": education,
        "experience": experience,
        "projects": projects,
        "skills": skills,
        "awards": awards,
        "raw_summary": text[:500]
    }