import re
from difflib import SequenceMatcher
from typing import List, Optional

from openai import OpenAI
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.prompt_builder import (
    build_resume_prompt,
    MODE_DESCRIPTIONS
)

# =========================================================
# OPENAI CLIENT
# =========================================================

client = OpenAI(
    api_key=settings.openai_api_key
)

# =========================================================
# VALID PATHS
# =========================================================

VALID_BULLET_PATH = re.compile(
    r'^(experience|projects)\.\d+\.bullets\.\d+$|^skills\.\w+$'
)

# =========================================================
# PYDANTIC MODELS
# =========================================================

class Change(BaseModel):
    old_text: str
    new_text: str
    path: Optional[str] = None


class Suggestion(BaseModel):
    old_text: str
    suggestion: str
    path: Optional[str] = None


class ResumeResponse(BaseModel):
    changes: List[Change] = Field(default_factory=list)
    suggestions: List[Suggestion] = Field(default_factory=list)

# =========================================================
# OPENAI CALL
# =========================================================

def call_llm(prompt: str) -> ResumeResponse:
    """
    Call OpenAI and return validated Pydantic object.
    """

    response = client.beta.chat.completions.parse(
        model="gpt-4.1-mini",
        temperature=0.2,
        max_tokens=1500,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        response_format=ResumeResponse
    )

    parsed = response.choices[0].message.parsed

    if parsed is None:
        print("[call_llm] Failed to parse structured output")

        return ResumeResponse()

    return parsed

# =========================================================
# FALLBACK PATH MATCHING
# =========================================================

def fallback_match(item, sentences, paths):
    """
    Match old_text back to original sentence list.
    Used only if path is missing or invalid.
    """

    old_text = item.old_text.strip()

    # Remove prefixes like:
    # bullet:
    # tools:
    # languages:
    old_text = re.sub(r'^\w+:\s*', '', old_text).strip()

    item.old_text = old_text

    if not old_text:
        item.path = None
        return

    # -----------------------------------------------------
    # Exact Match
    # -----------------------------------------------------

    try:
        idx = sentences.index(old_text)
        item.path = paths[idx]
        return

    except ValueError:
        pass

    # -----------------------------------------------------
    # Fuzzy Match
    # -----------------------------------------------------

    best_score = 0
    best_idx = None

    for i, sentence in enumerate(sentences):

        score = SequenceMatcher(
            None,
            old_text.lower(),
            sentence.lower()
        ).ratio()

        if score > best_score:
            best_score = score
            best_idx = i

    if best_idx is not None and best_score >= 0.85:
        item.old_text = sentences[best_idx]
        item.path = paths[best_idx]
    else:
        item.path = None

# =========================================================
# VALIDATE + INJECT PATHS
# =========================================================

def inject_paths(
    parsed: ResumeResponse,
    sentences: list,
    paths: list
) -> ResumeResponse:
    """
    Ensure every item has a valid path.
    """

    # =====================================================
    # CHANGES
    # =====================================================

    cleaned_changes = []

    for item in parsed.changes:

        item.old_text = re.sub(
            r'^\w+:\s*',
            '',
            item.old_text.strip()
        ).strip()

        # -------------------------------------------------
        # Invalid/missing path → fallback match
        # -------------------------------------------------

        if (
            not item.path or
            not VALID_BULLET_PATH.match(item.path)
        ):
            fallback_match(item, sentences, paths)

        # -------------------------------------------------
        # Remove unchanged rewrites
        # -------------------------------------------------

        if item.old_text.strip() != item.new_text.strip():
            cleaned_changes.append(item)

    # =====================================================
    # SUGGESTIONS
    # =====================================================

    cleaned_suggestions = []

    for item in parsed.suggestions:

        item.old_text = re.sub(
            r'^\w+:\s*',
            '',
            item.old_text.strip()
        ).strip()

        # -------------------------------------------------
        # Invalid/missing path → fallback match
        # -------------------------------------------------

        if (
            not item.path or
            not VALID_BULLET_PATH.match(item.path)
        ):
            fallback_match(item, sentences, paths)

        # -------------------------------------------------
        # Remove unchanged suggestions
        # -------------------------------------------------

        if item.old_text.strip() != item.suggestion.strip():
            cleaned_suggestions.append(item)

    parsed.changes = cleaned_changes
    parsed.suggestions = cleaned_suggestions

    return parsed

# =========================================================
# MAIN GENERATION FUNCTION
# =========================================================

def generate_response(
    sentences: list,
    paths: list,
    mode: str,
    sections_available: list,
    job_context: str = ""
) -> dict:
    """
    Build prompt, call OpenAI, validate paths,
    and return structured response.
    """

    # =====================================================
    # Build numbered resume items
    # =====================================================

    numbered_lines = [
        f"{i+1}. [path: {paths[i]}] {sentences[i]}"
        for i in range(len(sentences))
    ]

    numbered_items = "\n".join(numbered_lines)

    # =====================================================
    # Build prompt
    # =====================================================

    mode_desc = MODE_DESCRIPTIONS.get(
        mode,
        "critique"
    )

    prompt = build_resume_prompt(
        numbered_items=numbered_items,
        mode=mode,
        mode_desc=mode_desc,
        job_context=job_context,
        sections_available=sections_available
    )

    # =====================================================
    # Call OpenAI
    # =====================================================

    parsed = call_llm(prompt)

    print("\n============= OPENAI RESPONSE =============")
    print(parsed.model_dump_json(indent=2)[:1000])

    # =====================================================
    # Inject/fix paths
    # =====================================================

    parsed = inject_paths(
        parsed,
        sentences,
        paths
    )

    return {
        "mode": mode,
        "summary": "",
        "changes": [
            c.model_dump()
            for c in parsed.changes
        ],
        "suggestions": [
            s.model_dump()
            for s in parsed.suggestions
        ],
        "meta": {}
    }