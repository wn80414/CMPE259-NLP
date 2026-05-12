import json
import re

from app.db.supabase import supabase
from app.core.embeddings import get_embedding
from app.services.jsearch_jobs import fetch_jobs, format_jobs_for_llm
from huggingface_hub import InferenceClient
from app.core.config import settings


client = InferenceClient(
    model="meta-llama/Llama-3.3-70B-Instruct",
    token=settings.hf_token,
    timeout=60
)

# =========================================================
# SWE SKILL BASELINE
# =========================================================

SOFTWARE_ENGINEERING_SKILLS = {
    "python", "java", "javascript", "typescript",
    "react", "node", "sql", "aws", "docker",
    "kubernetes", "api", "backend", "frontend",
    "cloud", "microservices", "system design",
    "distributed systems", "testing", "ci/cd",
    "git", "linux", "rest", "graphql",
    "security", "algorithms", "data structures"
}


# =========================================================
# HELPERS
# =========================================================

def safe_str(value):
    return value or ""


def is_empty_change(change: dict):
    return not (change.get("old_text") or "").strip() and \
           not (change.get("new_text") or "").strip()


def is_relevant_skill(text: str):
    text = (text or "").lower()
    return any(skill in text for skill in SOFTWARE_ENGINEERING_SKILLS)


def convert_to_suggestion(change: dict):
    reason = change.get("reason", "")
    return {
        "type": "suggestion",
        "suggestion": reason,
        "reason": reason,
        "category": change.get("category", "skills")
    }


# =========================================================
# SENTENCE SPLITTER
# =========================================================

def split_into_sentences(text: str) -> list[str]:
    if not text:
        return [""]
    parts = re.split(r'(?<=\.)\s+', text.strip())
    return [p.strip() for p in parts if p.strip()]


# =========================================================
# EXACT MATCH & PATH (on full resume JSON)
# =========================================================

def find_exact_text_in_resume(resume_json, target_text):
    if isinstance(resume_json, str):
        return resume_json == target_text
    if isinstance(resume_json, list):
        return any(find_exact_text_in_resume(item, target_text) for item in resume_json)
    if isinstance(resume_json, dict):
        return any(find_exact_text_in_resume(value, target_text) for value in resume_json.values())
    return False


def find_text_path_in_resume(resume_json, target_text, current_path=""):
    if isinstance(resume_json, str):
        if resume_json == target_text:
            return current_path
        return None
    if isinstance(resume_json, list):
        for idx, item in enumerate(resume_json):
            path = f"{current_path}.{idx}" if current_path else str(idx)
            result = find_text_path_in_resume(item, target_text, path)
            if result:
                return result
        return None
    if isinstance(resume_json, dict):
        for key, value in resume_json.items():
            path = f"{current_path}.{key}" if current_path else key
            result = find_text_path_in_resume(value, target_text, path)
            if result:
                return result
        return None
    return None


# =========================================================
# JOB QUERY EXTRACTION
# =========================================================

def extract_job_query(user_query: str):
    query = user_query.lower()
    replacements = [
        "tailor my resume to",
        "tailor resume to",
        "rewrite my resume for",
        "optimize my resume for",
        "make my resume fit",
        "resume for",
        "job description for",
        "tailor to",
        "rewrite for"
    ]
    for phrase in replacements:
        query = query.replace(phrase, "")
    return re.sub(r"\s+", " ", query).strip()


# =========================================================
# NORMALIZER
# =========================================================

def normalize_resume_output(raw: dict, job_aware: bool = False, extra_suggestions: list = None):
    raw_changes = raw.get("changes", [])
    clean_changes = []
    suggestions = []

    for change in raw_changes:
        if is_empty_change(change):
            reason = (change.get("reason") or "").strip()
            if reason and is_relevant_skill(reason):
                suggestions.append(convert_to_suggestion(change))
            continue

        clean_changes.append({
            "old_text": safe_str(change.get("old_text")),
            "new_text": safe_str(change.get("new_text")),
            "reason": safe_str(change.get("reason")),
            "category": change.get("category", "general"),
            "path": change.get("path")
        })

    if extra_suggestions:
        suggestions.extend(extra_suggestions)

    return {
        "type": "resume_engine",
        "mode": raw.get("mode", "rewrite"),
        "data": {
            "summary": safe_str(raw.get("summary")),
            "changes": clean_changes,
            "suggestions": suggestions
        },
        "meta": {
            "job_aware": job_aware
        }
    }


# =========================================================
# MAIN ENGINE (rewritten with generation + self-correction)
# =========================================================

def resume_engine(resume_id: str, user_id: str, query: str, mode: str = "rewrite"):
    print("\n================ RESUME ENGINE ================")
    print("MODE:", mode)
    print("QUERY:", query)

    # ----------------------------------------------------
    # 0. Fetch full resume JSON (for path computation)
    # ----------------------------------------------------
    try:
        res = supabase.table("resumes").select("resume_data").eq("id", resume_id).single().execute()
        full_resume = res.data.get("resume_data", {}) if res.data else {}
    except Exception as e:
        print(f" Could not fetch full resume: {e}")
        full_resume = {}

    # ----------------------------------------------------
    # 1. RAG RETRIEVAL (vector chunks)
    # ----------------------------------------------------
    query_embedding = get_embedding(query)
    print(f"Retrieved query embedding (length {len(query_embedding)})")
    print("Fetching relevant resume chunks from vector store...")
    chunks = supabase.rpc(
        "match_resume_chunks",
        {
            "query_embedding": query_embedding,
            "match_count": 10,
            "filter_resume_id": resume_id
        }
    ).execute().data or []
    print(f"Retrieved {len(chunks)} relevant chunks from vector store")
    def extract_items_from_chunks(chunks):
        items = []
        for chunk in chunks:
            content = chunk.get("content", "")
            sentences = split_into_sentences(content)
            for s in sentences:
                if s.strip():
                    items.append(s.strip())
        return items

    resume_items = extract_items_from_chunks(chunks)
    numbered_items = "\n".join(f"{i+1}. {t}" for i, t in enumerate(resume_items))

    # ----------------------------------------------------
    # 2. JOB CONTEXT
    # ----------------------------------------------------
    job_context = ""
    job_modes = ["tailor", "ats"]

    if mode in job_modes:
        search_query = extract_job_query(query)
        print("\nSEARCH QUERY:", search_query)
        jobs = fetch_jobs(search_query)
        job_context = format_jobs_for_llm(jobs[:5])

    # ----------------------------------------------------
    # 3. GENERATION PROMPT (freeform, no strict formatting)
    # ----------------------------------------------------
    mode_descriptions = {
        "rewrite": "Rewrite resume content to be more impactful, concise, and ATS-friendly. Improve action verbs and highlight achievements.",
        "tailor": "Tailor the resume to match the specific job descriptions provided in [JOB CONTEXT]. Prioritize adding relevant skills and experience.",
        "ats": "Identify missing ATS keywords and buzzwords. Suggest specific skills or buzzwords to add that would improve ATS matching.",
        "critique": "Provide a critical review. Point out strengths, weaknesses, and specific suggestions for improvement.",
    }

    mode_desc = mode_descriptions.get(mode, "General resume improvement.")


    gen_prompt = f"""
    You are a resume optimizer. Mode: {mode}

    {mode_desc}

    Below is a numbered list of text items extracted from the most relevant sections of the resume. Each item is a single bullet point, sentence, or field value.

    [RESUME ITEMS]
    {numbered_items}

    [JOB CONTEXT]
    {job_context}

    Strict rules:
    - Output ONLY valid JSON. No markdown, no extra text.
    - Make 3–7 changes maximum.
    - old_text must be copied **exactly** from one of the numbered items above.
    - For modes "ats" and "critique", old_text can be EMPTY (for new skills or feedback).
    - new_text must be the **actual text to use** (e.g., "Experience with Kubernetes for container orchestration"). Do NOT write meta‑descriptions.
    - reason must be a short explanation (e.g., "Relevant to cloud roles").
    - Do NOT combine multiple items into one old_text. Each change corresponds to exactly one item.
    - If no good rewrite exists, skip that change entirely.

    Output exactly this JSON:
    {{
    "mode": "{mode}",
    "sub_intent": "rewrite | tailor | ats | critique | null",
    "summary": "...",
    "changes": [
        {{
        "old_text": "...",
        "new_text": "...",
        "reason": "...",
        "category": "impact|ats|clarity|skills"
        }}
    ]
    }}
    """

    # ----------------------------------------------------
    # 4. GENERATION LLM CALL
    # ----------------------------------------------------
    gen_response = client.chat_completion(
        messages=[
            {"role": "system", "content": "You are a helpful resume optimizer."},
            {"role": "user", "content": gen_prompt}
        ],
        max_tokens=1000,
        temperature=0.4
    )

    gen_content = gen_response.choices[0].message["content"]
    print("\n============= GENERATED SUGGESTIONS =============")
    print(gen_content)

    # ----------------------------------------------------
    # 5. SELF-CORRECTION PROMPT (convert to exact JSON)
    # ----------------------------------------------------
    correction_prompt = f"""
    Convert the following resume suggestions into the required JSON format.

    Strict Rules:
    - Each suggestion becomes one entry in the "changes" array.
    - **new_text must be the exact text to use** (e.g., "Experience with Kubernetes for container orchestration"). Do NOT put meta‑descriptions like "To increase visibility" in new_text.
    - **reason must be the explanation** (e.g., "Relevant to cloud roles").
    - old_text must be copied **exactly** from the numbered resume items below. If no exact match, leave old_text empty.
    - For modes "ats" and "critique", old_text can be empty. Put the suggested skill or feedback in new_text.
    - Do NOT combine multiple suggestions into one change.
    - Ensure the JSON is valid and complete.

    Resume items (use only these for old_text):
    {numbered_items}

    Job context:
    {job_context}

    Suggestions to convert:
    {gen_content}

    Output exactly this JSON:
    {{
    "mode": "{mode}",
    "sub_intent": "rewrite | tailor | ats | critique | null",
    "summary": "...",
    "changes": [
        {{
        "old_text": "...",
        "new_text": "...",
        "reason": "...",
        "category": "impact|ats|clarity|skills"
        }}
    ]
    }}
    """

    correction_response = client.chat_completion(
        messages=[
            {"role": "system", "content": "Return ONLY valid JSON. No markdown."},
            {"role": "user", "content": correction_prompt}
        ],
        max_tokens=1500,
        temperature=0.1
    )

    raw_content = correction_response.choices[0].message["content"]
    print("\n============= CORRECTED OUTPUT =============")
    print(raw_content)

    # ----------------------------------------------------
    # 6. PARSE
    # ----------------------------------------------------
    raw = safe_json_parse(raw_content)

    # ----------------------------------------------------
    # 7. VALIDATE & BUILD CHANGES WITH PATH
    # ----------------------------------------------------
    valid_changes = []
    extra_suggestions = []

    for change in raw.get("changes", []):
        old_text = change.get("old_text", "").strip()
        new_text = change.get("new_text", "").strip()
        reason = change.get("reason", "").strip()

        # CASE 1: empty old_text
        if not old_text:
            if mode in ["ats", "critique"]:
                suggestion_text = new_text if new_text else reason
                extra_suggestions.append({
                    "type": "suggestion",
                    "suggestion": suggestion_text,
                    "reason": reason,
                    "category": change.get("category", "skills"),
                    "old_text": "",
                    "new_text": new_text,
                })
                print(f" -- Added suggestion (empty old_text): '{suggestion_text}'")
            else:
                print(f"⏭ Skipping change with empty old_text (mode: {mode})")
            continue

        # CASE 2: non-empty old_text
        if find_exact_text_in_resume(full_resume, old_text):
            path = find_text_path_in_resume(full_resume, old_text)
            change["path"] = path
            valid_changes.append(change)
        else:
            if mode in ["critique", "ats", "tailor"]:
                extra_suggestions.append({
                    "type": "suggestion",
                    "suggestion": reason or new_text,
                    "reason": reason,
                    "category": change.get("category", "skills"),
                    "old_text": old_text,
                    "new_text": new_text,
                })
                print(f"💡 Added suggestion for unmatched change: '{old_text}'")
            else:
                print(f"⏭ Skipping hallucinated change – old_text not found: '{old_text}'")

    raw["changes"] = valid_changes

    # ----------------------------------------------------
    # 8. NORMALIZE
    # ----------------------------------------------------
    normalized = normalize_resume_output(
        raw,
        job_aware=(mode in job_modes),
        extra_suggestions=extra_suggestions
    )

    print("\n============= NORMALIZED =============")
    print(normalized)

    return normalized


# =========================================================
# SAFE JSON PARSER
# =========================================================

def safe_json_parse(text: str):
    try:
        return json.loads(text)
    except Exception:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass
    return {
        "mode": "error",
        "summary": "Failed to parse model output",
        "changes": []
    }