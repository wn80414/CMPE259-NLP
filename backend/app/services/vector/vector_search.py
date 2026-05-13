import json
from app.db.supabase import supabase
from app.core.embeddings import get_embedding
from app.core.config import settings

# Optional: Cross-encoder for re-ranking
try:
    from sentence_transformers import CrossEncoder
    _CROSS_ENCODER_AVAILABLE = True
except ImportError:
    _CROSS_ENCODER_AVAILABLE = False


def retrieve_and_rerank(
    query: str,
    resume_id: str,
    match_count: int = 15,
    top_k: int = 10,
    filter_metadata_type: str = None
) -> list:
    """
    Retrieve resume chunks via vector similarity and optionally re-rank
    using a cross-encoder.

    Args:
        query: The user's search / tailoring query.
        resume_id: The ID of the resume to search within.
        match_count: Number of initial chunks to retrieve (default 15).
        top_k: Number of chunks to keep after re-ranking (default 10).
        filter_metadata_type: If provided, only return chunks of this section type.

    Returns:
        A list of chunk dicts (each with 'content', 'metadata', 'similarity', 'path'),
        ordered by relevance.
    """
    # 1. Embed the query
    query_embedding = get_embedding(query).tolist()
    print(f"Query embedding length: {len(query_embedding)}")

    # 2. Build RPC parameters
    rpc_params = {
        "query_embedding": query_embedding,
        "match_count": match_count,
        "filter_resume_id": resume_id,
    }
    if filter_metadata_type is not None:
        rpc_params["filter_metadata_type"] = filter_metadata_type

    # Vector search via Supabase RPC
    chunks = supabase.rpc(
        "match_resume_chunks",
        rpc_params
    ).execute().data or []
    print(f"Retrieved {len(chunks)} chunks")

    # 3. Guarantee path is present by fetching from the table
    if chunks:
        # Collect all chunk IDs from the RPC result
        chunk_ids = [c["id"] for c in chunks if "id" in c]
        if chunk_ids:
            # Fetch path for all these IDs in one query
            path_lookup = supabase.table("resume_chunks") \
                .select("id, path") \
                .in_("id", chunk_ids) \
                .execute()
            path_map = {row["id"]: row.get("path") for row in path_lookup.data if row.get("path")}

            # Inject path into chunks if not already present
            for chunk in chunks:
                if not chunk.get("path") and chunk["id"] in path_map:
                    chunk["path"] = path_map[chunk["id"]]
                elif not chunk.get("path"):
                    chunk["path"] = None  # fallback

    # 4. Cross-encoder re-ranking
    if _CROSS_ENCODER_AVAILABLE and len(chunks) > top_k:
        try:
            cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
            pairs = [(query, c["content"][:500]) for c in chunks]
            scores = cross_encoder.predict(pairs)
            ranked = sorted(zip(scores, chunks), key=lambda x: x[0], reverse=True)
            chunks = [c for _, c in ranked[:top_k]]
            print(f"Re-ranked chunks with cross-encoder (kept top {top_k})")
        except Exception as e:
            print(f"Re-ranking failed, using original order: {e}")

    return chunks