import json
from difflib import SequenceMatcher
import re
from huggingface_hub import InferenceClient
from app.core.config import settings
from app.core.prompt_builder import build_resume_prompt, MODE_DESCRIPTIONS

client = InferenceClient(
    model="meta-llama/Llama-3.1-70B-Instruct",
    token=settings.hf_token,
    timeout=60
)

# Regex to validate bullet-level paths (e.g., "experience.0.2", "projects.1.0")
VALID_BULLET_PATH = re.compile(
    r'^(experience|projects)\.\d+\.bullets\.\d+$|^skills\.\w+$'
)

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


def inject_paths(raw_output: str, sentences: list, paths: list) -> dict:
    """
    Parse JSON output and inject path by matching old_text to sentence index.

    Only use matching as a fallback if the path is missing or invalid.
    """
    try:
        #print(f"\n[inject_paths] Raw output (first 2000 chars):\n{raw_output[:2000]}\n")
        parsed = json.loads(raw_output)
    except json.JSONDecodeError:
        print("[inject_paths] [ERROR] Failed to parse LLM output (invalid JSON)")
        return {"mode": "error", "changes": [], "suggestions": []}

    #print(f"\n[inject_paths] Processing {len(parsed.get('changes', []))} changes + {len(parsed.get('suggestions', []))} suggestions")

    # Helper to fallback match 
    def fallback_match(item, list_name, item_idx):
        old_text = item.get("old_text", "").strip()
        # Sanitize: remove leading "word:" prefixes (e.g., "bullet:", "tools:", etc.)
        old_text = re.sub(r'^\w+:\s*', '', old_text).strip()
        item["old_text"] = old_text   # persist cleaned version

        print("OLD TEXT:", old_text)
        if not old_text:
            print(f"  [{list_name}#{item_idx}] [FAIL]  'old_text' is empty – skipping")
            return

        # Exact match
        try:
            idx = sentences.index(old_text)
            item["path"] = paths[idx]
            return
        except ValueError:
            print(f"    [FAIL] Exact match failed")

        # Fuzzy match
        best_score = 0
        best_idx = None
        for i, sent in enumerate(sentences):
            score = SequenceMatcher(None, old_text.lower(), sent.lower()).ratio()
            if score > best_score:
                best_score = score
                best_idx = i

        if best_idx is not None and best_score >= 0.85:
            item["old_text"] = sentences[best_idx]   # already clean
            item["path"] = paths[best_idx]
            print(f"     Fuzzy match (score={best_score:.4f}) → index {best_idx}, path='{paths[best_idx]}'")
        else:
            item["path"] = None
            print(f"     No match found (best score={best_score:.4f}, threshold=0.85)")

    # Process both lists
    for list_name in ("changes", "suggestions"):
        items = parsed.get(list_name, [])
        #print(f"\n[inject_paths] Processing '{list_name}' list ({len(items)} items)")
        for i, item in enumerate(items):
            # --- New: sanitize old_text for every item ---
            old_text = item.get("old_text", "").strip()
            # Remove leading "word:" prefix (e.g., "bullet:", "tools:", "languages:", etc.)
            old_text = re.sub(r'^\w+:\s*', '', old_text).strip()
            item["old_text"] = old_text   # save cleaned version
            # --- End sanitization ---

            path = item.get("path")

            # If path is present and valid, trust it
            if path and VALID_BULLET_PATH.match(path):
                #print(f"  [{list_name}#{i}] [VALID] Using LLM-provided path: '{path}'")
                continue

            # If path is missing or invalid, fall back to matching
            if not path:
                print(f"  [{list_name}#{i}] !!!! Missing path → fallback matching")
            else:
                print(f"  [{list_name}#{i}] !!!! Invalid path '{path}' → fallback matching")

            fallback_match(item, list_name, i)


    parsed["changes"] = [
    c for c in parsed.get("changes", [])
    if c.get("old_text", "").strip() != c.get("new_text", "").strip()
]
    parsed["suggestions"] = [
        s for s in parsed.get("suggestions", [])
        if s.get("old_text", "").strip() != s.get("suggestion", "").strip()
    ]


    print("[inject_paths]  Done\n")
    #print(parsed)
    return parsed


def generate_response(
    sentences: list,
    paths: list,
    mode: str,
    sections_available: list,
    job_context: str = ""
) -> dict:
    """
    Build prompt, call LLM, inject paths.
    Numbered list is built automatically from sentences + paths.
    
    Note: 'paths' should now be bullet-level paths (e.g., "experience.0.2").
    The LLM receives them in [path: ...] tags and is expected to copy them exactly.
    """
    # Build numbered items inside (no external step needed)
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
    print("\n============= RAW LLM OUTPUT =============")
    print(raw_output[:500])
    
    # Inject paths using sentences index
    return inject_paths(raw_output, sentences, paths)