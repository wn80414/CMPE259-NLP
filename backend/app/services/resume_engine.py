import json
from app.db.supabase import supabase
from app.services.vector_search import retrieve_and_rerank
from app.services.text_processing import flatten_chunks_to_sentences
from app.services.llama_generator import generate_response

def detect_focus(query: str):
    query_lower = query.lower()
    sections = []
    if "experience" in query_lower:
        sections.append("experience")
    if "project" in query_lower:
        sections.append("project")
    if "skill" in query_lower:
        sections.append("skills")
    return sections

def resume_engine(resume_id: str, user_id: str, query: str, mode: str = "rewrite"):
    print("\n================ DEBUG: Resume Query ================")
    print("MODE:", mode)
    print("QUERY:", query)

    # Focus detection
    focus_sections = detect_focus(query)
    filter_type = focus_sections[0] if len(focus_sections) == 1 else None

    # Retrieve chunks (no LLM)
    chunks = retrieve_and_rerank(
        query=query,
        resume_id=resume_id,
        match_count=15,
        top_k=10,
        filter_metadata_type=filter_type
    )

    if len(focus_sections) > 1:
        chunks = [c for c in chunks if c.get("metadata", {}).get("type") in focus_sections]

    print(f"\nTotal chunks retrieved: {len(chunks)}\n")

    # Get Sections Available
    sections_available = list(set(c.get("metadata", {}).get("type") for c in chunks))
    
    
    sentences, paths = flatten_chunks_to_sentences(chunks)

    result = generate_response(
        sentences=sentences,
        paths=paths,
        mode=mode,
        sections_available=sections_available,
        job_context="",
    )

    return result