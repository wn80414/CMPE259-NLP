import re
import json
from huggingface_hub import InferenceClient
from app.core.config import settings

client = InferenceClient(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    token=settings.hf_token
)

def _call_llm(system_prompt: str, user_text: str, max_tokens=800, temperature=0.1) -> str:
    """Helper to make a single LLM call and return the raw text."""
    response = client.chat_completion(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ],
        max_tokens=max_tokens,
        temperature=temperature
    )
    return response.choices[0].message["content"]

def _extract_contact(text: str) -> dict:
    prompt = f"""Extract name, email, phone, LinkedIn, and GitHub from this resume.
Return ONLY valid JSON with these keys: name, email, phone, linkedin, github.
If missing, use empty string.

Resume:
{text}
"""
    raw = _call_llm("Return ONLY valid JSON. No markdown.", prompt)
    return safe_parse_llm(raw, expected_keys=["name", "email", "phone", "linkedin", "github"])

def _extract_education(text: str, contact: dict) -> list:
    prompt = f"""Extract education entries from this resume.
Return a JSON array of objects with: school, degree, location, graduation_date, gpa, coursework (array of strings).
If missing, return an empty array.

Contact info: {json.dumps(contact)}

Resume:
{text}
"""
    raw = _call_llm("Return ONLY valid JSON array.", prompt)
    result = safe_parse_llm(raw)
    return result if isinstance(result, list) else []

def _extract_experience(text: str, contact: dict, education: list) -> list:
    prompt = f"""Extract work experience entries from this resume.
Return a JSON array of objects with: company, role, location, start_date, end_date, bullets (array of strings).
If missing, return an empty array.

Contact: {json.dumps(contact)}
Education: {json.dumps(education)}

Resume:
{text}
"""
    raw = _call_llm("Return ONLY valid JSON array.", prompt, max_tokens=1200)
    result = safe_parse_llm(raw)
    return result if isinstance(result, list) else []

def _extract_projects(text: str, context: dict) -> list:
    prompt = f"""Extract technical projects from this resume.
Return a JSON array of objects with: name, tech_stack (array of strings), bullets (array of strings).
If missing, return an empty array.

Current data: {json.dumps(context)}

Resume:
{text}
"""
    raw = _call_llm("Return ONLY valid JSON array.", prompt, max_tokens=1000)
    result = safe_parse_llm(raw)
    return result if isinstance(result, list) else []

def _extract_skills(text: str, context: dict) -> dict:
    prompt = f"""Extract technical skills from this resume into categories: languages, cloud, ml_ai, tools.
Return a JSON object with those four keys, each an array of strings.
If missing, return empty arrays.

Current data: {json.dumps(context)}

Resume:
{text}
"""
    raw = _call_llm("Return ONLY valid JSON object.", prompt)
    result = safe_parse_llm(raw, expected_keys=["languages", "cloud", "ml_ai", "tools"])
    return result if isinstance(result, dict) else {"languages": [], "cloud": [], "ml_ai": [], "tools": []}

def _extract_awards(text: str, context: dict) -> list:
    prompt = f"""Extract awards/honors from this resume as an array of strings.
If missing, return an empty array.

Current data: {json.dumps(context)}

Resume:
{text}
"""
    raw = _call_llm("Return ONLY valid JSON array.", prompt)
    result = safe_parse_llm(raw)
    return result if isinstance(result, list) else []

def safe_parse_llm(text: str, expected_keys: list = None):
    """Parse JSON from LLM output, with fallback."""
    try:
        # Remove backtick fences
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            text = match.group(1)
        text = text.strip()
        parsed = json.loads(text)
        if expected_keys:
            # Ensure all expected keys exist
            for key in expected_keys:
                if key not in parsed:
                    parsed[key] = "" if isinstance({}.get(key), str) else []
        return parsed
    except json.JSONDecodeError:
        print(f"Failed to parse: {text[:200]}")
        return {} if not expected_keys else {k: "" for k in expected_keys}

def parse_resume(text: str) -> dict:
    """Main function – chains prompts sequentially."""
    print("Step 1/6: Extracting contact info...")
    contact = _extract_contact(text)
    
    print("Step 2/6: Extracting education...")
    education = _extract_education(text, contact)
    
    print("Step 3/6: Extracting experience...")
    experience = _extract_experience(text, contact, education)
    
    context = {**contact, "education": education, "experience": experience}
    
    print("Step 4/6: Extracting projects...")
    projects = _extract_projects(text, context)
    context["projects"] = projects
    
    print("Step 5/6: Extracting skills...")
    skills = _extract_skills(text, context)
    context["skills"] = skills
    
    print("Step 6/6: Extracting awards...")
    awards = _extract_awards(text, context)
    context["awards"] = awards
    
    # Build final output matching the original schema
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