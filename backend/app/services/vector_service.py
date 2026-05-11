from app.core.embeddings import get_embedding
from app.db.supabase import supabase


class VectorService:

    def upsert_resume_embeddings(self, resume_id: str, user_id: str, resume_data: dict):
        """
        Chunk resume and store embeddings in Supabase.
        """

        chunks = []

        # 1. Projects
        for proj in resume_data.get("projects", []):
            content = (
                f"Project: {proj.get('name')}. "
                f"Tech: {', '.join(proj.get('tech_stack', []))}. "
                f"Details: {' '.join(proj.get('bullets', []))}"
            )

            chunks.append({
                "resume_id": resume_id,
                "user_id": user_id,
                "content": content,
                "metadata": {"type": "project"},
                "embedding": get_embedding(content)
            })

        # 2. Experience
        for exp in resume_data.get("experience", []):
            content = (
                f"Experience at {exp.get('company')} "
                f"as {exp.get('role')}. "
                f"Details: {' '.join(exp.get('bullets', []))}"
            )

            chunks.append({
                "resume_id": resume_id,
                "user_id": user_id,
                "content": content,
                "metadata": {"type": "experience"},
                "embedding": get_embedding(content)
            })

        # 3. Skills
        skills = resume_data.get("skills", {})
        if skills:
            skills_list = []
            for k, v in skills.items():
                if isinstance(v, list):
                    skills_list.extend(v)

            skills_content = f"Technical Skills: {', '.join(skills_list)}"

            chunks.append({
                "resume_id": resume_id,
                "user_id": user_id,
                "content": skills_content,
                "metadata": {"type": "skills"},
                "embedding": get_embedding(skills_content)
            })

        # --- DB OPERATIONS ---

        supabase.table("resume_chunks") \
            .delete() \
            .eq("resume_id", resume_id) \
            .execute()

        if chunks:
            supabase.table("resume_chunks").insert(chunks).execute()

    def get_context(self, question: str, user_id: str, resume_id: str):
        """
        Retrieve relevant chunks via pgvector RPC
        """

        query_vector = get_embedding(question)

        rpc_params = {
            "query_embedding": query_vector,
            "match_threshold": 0.5,
            "match_count": 5,
            "target_user_id": user_id,
            "target_resume_id": resume_id
        }

        response = supabase.rpc(
            "match_resume_chunks",
            rpc_params
        ).execute()

        return "\n".join(
            [row["content"] for row in response.data or []]
        )