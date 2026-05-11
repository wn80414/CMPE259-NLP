from serpapi import GoogleSearch
from app.core.config import settings


from serpapi import GoogleSearch
from app.core.config import settings



def fetch_jobs(query: str, location: str = "United States", limit: int = 5):
    params = {
        "engine": "google_jobs",
        "q": query,
        "hl": "en",
        "location": location,
        "api_key": settings.serpapi_key
    }

    search = GoogleSearch(params)
    results = search.get_dict()

    print("🔵 SERPAPI RAW KEYS:", results.keys())

    raw_jobs = results.get("jobs_results") or []

    print(f"🔵 RAW JOB COUNT: {len(raw_jobs)}")

    jobs = []

    for i, job in enumerate(raw_jobs):
        description = job.get("description") or ""
        title = job.get("title") or ""

        print(f"\n🟡 JOB {i}")
        print("TITLE:", title)
        print("COMPANY:", job.get("company_name"))
        print("HAS DESC:", bool(description))

        if not description:
            continue

        signals = extract_job_signals(title, description)

        jobs.append({
            "title": title,
            "company": job.get("company_name", ""),
            "location": job.get("location", ""),
            "description": description,
            "snippet": description[:300],
            "signals": signals   # 👈 ADD THIS
        })

        if len(jobs) >= limit:
            break

    print(f"\n✅ FINAL CLEAN JOBS: {len(jobs)}")
    return jobs

def format_jobs_response(query: str, jobs: list):
    return {
        "type": "job_search",
        "query": query,
        "results": jobs,
        "meta": {
            "count": len(jobs),
            "source": "serpapi"
        }
    }
    
def format_jobs_for_llm(jobs: list) -> str:
    if not jobs:
        return "No job data available."

    blocks = []

    for job in jobs:
        title = job.get("title", "")
        company = job.get("company", "")
        location = job.get("location", "")
        description = job.get("description", "")

        # SAFE skill extraction (no crash)
        skills = []

        signals = job.get("signals", {})
        if isinstance(signals, dict):
            skills = signals.get("skills", []) or []

        skill_text = ", ".join(skills) if skills else "N/A"

        blocks.append(f"""
TITLE: {title}
COMPANY: {company}
LOCATION: {location}

KEY SKILLS: {skill_text}

DESCRIPTION:
{description[:500]}
""")

    return "\n\n".join(blocks)
import re


def extract_job_signals(title: str, description: str):
    text = (title + " " + description).lower()

    # simple heuristic extraction (you can upgrade later to LLM)
    skills = []

    skill_keywords = [
        "python", "java", "javascript", "react", "aws",
        "docker", "kubernetes", "sql", "nosql", "mongodb",
        "microservices", "rest", "fastapi", "spring"
    ]

    for skill in skill_keywords:
        if skill in text:
            skills.append(skill)

    return {
        "skills": skills,
        "is_backend": any(x in text for x in ["backend", "server", "api"]),
        "is_frontend": any(x in text for x in ["frontend", "react", "ui"]),
        "is_ml": any(x in text for x in ["machine learning", "ai", "llm"]),
    }