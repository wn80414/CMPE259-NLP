def build_resume_prompt(
    numbered_items: str,
    mode: str,
    mode_desc: str,
    job_context: str = "",
    sections_available: list = None
) -> str:
    sections_text = ""
    if sections_available:
        sections_text = f"\nSections present for review: {', '.join(sections_available)}"

    if mode == "critique":
        # ---------- CRITIQUE MODE: suggestions only ----------
        return f"""
You are a resume advisor. Mode: critique

{mode_desc}

Below is a numbered list of complete resume sections (each item is one project, experience, or skill block).

[RESUME ITEMS]
{numbered_items}
{sections_text}

[JOB CONTEXT]
{job_context}

- Strict Rules:
- Do NOT rewrite the text. Only provide specific suggestions for improvement.
- Each suggestion must be actionable and tied to the job context if given.
- Use concise language.
- Suggestions are optional if no meaningful suggestions then DO NOT give one.
- Limit to 0 to 5 critiques.
- Critiques are OPTIONAL.

Output ONLY valid JSON with the following structure:
{{
  "mode": "critique",
  "summary": "...",
  "suggestions": [
    {{
      "old_text": "...",
      "suggestion": "...",
      "reason": "...",
      "category": "impact|ats|clarity|skills",
      "path": null
    }}
  ]
}}

- Each suggestion must reference the `old_text` **exactly** as it appears in one numbered item.
- Copy the `path` from the [path: ...] tag.
- No markdown, no extra text.
- Do NOT output any rewritten text (new_text).
"""
    else:
        # ---------- REWRITE / TAILOR / OTHER MODES ----------
        return f"""
You are a resume optimizer. Mode: {mode}

{mode_desc}

Below is a numbered list of complete resume sections (each item is one project, experience, or skill block).

[RESUME ITEMS]
{numbered_items}
{sections_text}

[JOB CONTEXT]
{job_context}

- Strict Rules:
- Make meaningful changes that are concise and readable.
- No need to make trivial changes to sections (Experience, Technical Skills, Projects).
- Changes are optional. DO NOT MAKE CHANGES IF IT IS STRONG.
- For skills section, do NOT prepend any category name (like "Tools:", "Development tools:", "Languages:", "Cloud:", "ML/AI:") to the new_text. The output must be a plain comma‑separated list of skills, without any label.
- For skills seciton, only ADD or REMOVE skills. NO SENTENCES.
- For skills section, ONLY MAKE MEANINGFUL CHANGES. NO NEED TO SUGGEST CHANGE BECAUSE OF THE CATEGORY NAME.
- Limit to 0-6 changes.
Output ONLY valid JSON with the following structure:
{{
  "mode": "{mode}",
  "summary": "...",
  "changes": [
    {{
      "old_text": "...",
      "new_text": "...",
      "reason": "...",
      "category": "Impact|ATS|Clarity|Skills",
      "path": null
    }}
  ]
}}

- Each change must use old_text **exactly** as it appears in one of the numbered items.
- The "path" field must be copied from the [path: ...] tag in the numbered item.
- No markdown, no extra text.
- Do NOT output any score, grade, rating, or numerical evaluation.
"""
# Mode descriptions
MODE_DESCRIPTIONS = {
    "rewrite": "Rewrite resume content to be more impactful, concise, and ATS-friendly. Improve action verbs and highlight achievements.",
    "tailor": "Tailor the resume to match the specific job descriptions provided. Prioritize adding relevant skills and experience.",
    "critique": "Provide a critical review with specific suggestions for improvement. Do not rewrite; only suggest actionable changes.",
}