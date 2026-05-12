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

    print("🔵 JSEARCH RAW KEYS:", data.keys())

    raw_jobs = data.get("data", []) or []

    print(f"🔵 RAW JOB COUNT: {len(raw_jobs)}")

    jobs = []

    for i, job in enumerate(raw_jobs[:limit]):

        description = safe_str(job.get("job_description"))

        print(f"\n🟡 JOB {i}")
        print("TITLE:", job.get("job_title"))
        print("COMPANY:", job.get("employer_name"))
        print("HAS DESC:", bool(description))

        if not description:
            continue

        location_text = (
            f"{safe_str(job.get('job_city'))}, "
            f"{safe_str(job.get('job_country'))}"
        ).strip(", ")

        jobs.append({
            "title": safe_str(job.get("job_title")),
            "company": safe_str(job.get("employer_name")),
            "location": location_text,
            "description": description,
            "snippet": description[:300],
            "url": safe_str(job.get("job_apply_link"))
        })

    print(f"\n✅ FINAL CLEAN JOBS: {len(jobs)}")

    return jobs


def format_jobs_for_llm(jobs: list) -> str:

    if not jobs:
        return "No job data available."

    blocks = []

    for job in jobs:

        blocks.append(f"""
TITLE: {safe_str(job.get('title'))}
COMPANY: {safe_str(job.get('company'))}
LOCATION: {safe_str(job.get('location'))}

DESCRIPTION:
{safe_str(job.get('description'))[:600]}
""")

    return "\n\n".join(blocks)