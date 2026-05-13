import requests
from app.core.config import settings


def safe_str(value):
    return value or ""


def fetch_jobs(query: str, location: str = "US", limit: int = 5):
    url = "https://jsearch.p.rapidapi.com/search"

    headers = {
        "X-RapidAPI-Key": settings.jsearch_api_key,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
    }

    params = {
        "query": query,
        "page": "1",
        "num_pages": "1",
        "country": location
    }

    response = requests.get(url, headers=headers, params=params)
    data = response.json()
    raw_jobs = data.get("data", []) or []

    jobs = []

    for i, job in enumerate(raw_jobs[:limit]):

        # Extract skills (list)
        raw_skills = job.get("job_required_skills") or []
        skills = ", ".join(raw_skills) if raw_skills else "Not specified"

        # Employment type
        employment_type = safe_str(job.get("job_employment_type")) or "Not specified"

        location_text = (
            f"{safe_str(job.get('job_city'))}, "
            f"{safe_str(job.get('job_country'))}"
        ).strip(", ")

        jobs.append({
            "title": safe_str(job.get("job_title")),
            "company": safe_str(job.get("employer_name")),
            "location": location_text,
            "skills": skills,
            "employment_type": employment_type,
            "url": safe_str(job.get("job_apply_link"))
        })

    return jobs

def format_jobs_for_llm(jobs: list) -> str:
    if not jobs:
        return "No job data available."

    blocks = []

    for job in jobs:
        block = f"""
TITLE: {safe_str(job.get('title'))}
COMPANY: {safe_str(job.get('company'))}
LOCATION: {safe_str(job.get('location'))}
SKILLS: {safe_str(job.get('skills'))}
EMPLOYMENT TYPE: {safe_str(job.get('employment_type'))}
"""
        blocks.append(block)

    return "\n\n".join(blocks)