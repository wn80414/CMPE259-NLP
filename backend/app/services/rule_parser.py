import re

KNOWN_SKILLS = [
    "python", "java", "c++", "javascript", "react",
    "fastapi", "django", "node", "aws", "docker",
    "sql", "mongodb", "git"
]


def extract_email(text: str):
    match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
    return match.group(0) if match else None


def extract_name(text: str):
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    return lines[0] if lines else None


def extract_skills(text: str):
    text_lower = text.lower()
    return [s for s in KNOWN_SKILLS if s in text_lower]


def extract_section(text: str, keyword: str):
    pattern = rf"{keyword}(.*?)(experience|education|skills|$)"
    match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
    return match.group(1).strip() if match else ""


def parse_resume(text: str):
    return {
        "name": extract_name(text),
        "email": extract_email(text),
        "skills": extract_skills(text),
        "experience": extract_section(text, "experience"),
        "education": extract_section(text, "education"),
    }