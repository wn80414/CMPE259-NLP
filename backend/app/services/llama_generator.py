import json
import re
from difflib import SequenceMatcher
from typing import List, Optional

from huggingface_hub import InferenceClient
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.prompt_builder import (
    build_resume_prompt,
    MODE_DESCRIPTIONS
)
client = InferenceClient(
    model="meta-llama/Llama-3.1-70B-Instruct",
    token=settings.hf_token,
    timeout=60
)

# Regex to validate bullet-level paths (e.g., "experience.0.2", "projects.1.0")
VALID_BULLET_PATH = re.compile(
    r'^(experience|projects)\.\d+\.bullets\.\d+$|^skills\.\w+$'
)

# Pydantic models
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

def call_llm(prompt: str) -> str:
    """Make the API call and return raw text."""
    response = client.chat_completion(
        messages=[
            {"role": "system", "content": "You are a helpful resume optimizer."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=1500,
        temperature=0.2
    )
    return response.choices[0].message["content"]

def inject_paths_from_model(
    validated: ResumeResponse,
    sentences: list,
    paths: list
) -> ResumeResponse:
    """
    Inject bullet-level paths into validated changes/suggestions.
    Returns the same model instance with paths updated.
    """
    def fallback_match(item, sentences, paths, item_type):
        """Fuzzy/exact match to find path if missing/invalid."""
        old_text = re.sub(r'^\w+:\s*', '', item.old_text.strip())
        # Persist cleaned old_text
        item.old_text = old_text

        if not old_text:
            print(f"  [{item_type}] empty old_text – skipping path injection")
            return

        # Try exact match
        try:
            idx = sentences.index(old_text)
            item.path = paths[idx]
            return
        except ValueError:
            pass

        # Fuzzy fallback
        best_score, best_idx = 0, None
        for i, sent in enumerate(sentences):
            score = SequenceMatcher(None, old_text.lower(), sent.lower()).ratio()
            if score > best_score:
                best_score, best_idx = score, i

        if best_idx is not None and best_score >= 0.85:
            item.old_text = sentences[best_idx]  # use the exact match
            item.path = paths[best_idx]
            print(f"     Fuzzy match (score={best_score:.4f}) -> path '{item.path}'")
        else:
            item.path = None
            print(f"     No match found (best={best_score:.4f})")

    # Process changes
    for change in validated.changes:
        path = change.path
        if path and VALID_BULLET_PATH.match(path):
            continue  # trust the valid path
        # Fallback
        print(f"  [change] Missing/invalid path – falling back to text matching")
        fallback_match(change, sentences, paths, "change")

    # Process suggestions
    for sug in validated.suggestions:
        path = sug.path
        if path and VALID_BULLET_PATH.match(path):
            continue
        print(f"  [suggestion] Missing/invalid path – falling back to text matching")
        fallback_match(sug, sentences, paths, "suggestion")

    # Remove no‑op edits
    validated.changes = [
        c for c in validated.changes
        if c.old_text.strip() != c.new_text.strip()
    ]
    validated.suggestions = [
        s for s in validated.suggestions
        if s.old_text.strip() != s.suggestion.strip()
    ]

    return validated


def generate_response(
    sentences: list,
    paths: list,
    mode: str,
    sections_available: list,
    job_context: str = ""
) -> dict:
    """
    Build prompt, call LLM, validate with Pydantic, inject paths.
    Returns a dict with mode, changes, suggestions for compatibility.
    """
    # Build numbered list
    numbered_lines = [
        f"{i+1}. [path: {paths[i]}] {sentences[i]}"
        for i in range(len(sentences))
    ]
    numbered_items = "\n".join(numbered_lines)

    # Build prompt
    mode_desc = MODE_DESCRIPTIONS.get(mode, "critique")
    prompt = build_resume_prompt(
        numbered_items=numbered_items,
        mode=mode,
        mode_desc=mode_desc,
        job_context=job_context,
        sections_available=sections_available
    )

    # Call LLM
    raw_output = call_llm(prompt)

    # Validate JSON with Pydantic
    try:
        parsed_json = json.loads(raw_output)
        validated = ResumeResponse.model_validate(parsed_json)
    except (json.JSONDecodeError, ValidationError) as e:
        print(f"Validation error: {e}")
        return {"mode": "error", "changes": [], "suggestions": []}

    # Inject paths using the original sentences/paths
    validated = inject_paths_from_model(validated, sentences, paths)

    # Return dict (or you could return the Pydantic model directly)
    return {
        "mode": mode,
        "changes": [c.dict() for c in validated.changes],
        "suggestions": [s.dict() for s in validated.suggestions],
    }