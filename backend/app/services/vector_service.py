import openai
from supabase import create_client
from app.core.config import settings
from sentence_transformers import SentenceTransformer

class VectorService:
    def __init__(self):
        self.model = SentenceTransformer('BAAI/bge-small-en-v1.5')
        # Ensure settings.supabase_key is your SERVICE_ROLE_KEY for background ingestion
        self.supabase = create_client(settings.supabase_url, settings.supabase_key)

    def _get_embedding(self, text: str):
        embedding = self.model.encode(text)
        return embedding.tolist()

    def upsert_resume_embeddings(self, resume_id: str, user_id: str, resume_data: dict):
        """
        Takes the parsed resume JSON, chunks it, and saves it with both 
        resume_id and user_id for strict RAG isolation.
        """
        chunks = []
        
        # 1. Process Projects
        for proj in resume_data.get("projects", []):
            content = f"Project: {proj.get('name')}. Tech: {', '.join(proj.get('tech_stack', []))}. Details: {' '.join(proj.get('bullets', []))}"
            chunks.append({
                "resume_id": resume_id,
                "user_id": user_id,  # <--- CRITICAL UPDATE
                "content": content,
                "metadata": {"type": "project"},
                "embedding": self._get_embedding(content)
            })

        # 2. Process Experience
        for exp in resume_data.get("experience", []):
            content = f"Experience at {exp.get('company')} as {exp.get('role')}. Details: {' '.join(exp.get('bullets', []))}"
            chunks.append({
                "resume_id": resume_id,
                "user_id": user_id,  # <--- CRITICAL UPDATE
                "content": content,
                "metadata": {"type": "experience"},
                "embedding": self._get_embedding(content)
            })

        # 3. Process Skills (Optional but recommended for RAG)
        if "skills" in resume_data:
            skills_content = f"Technical Skills: {', '.join(resume_data.get('skills', []))}"
            chunks.append({
                "resume_id": resume_id,
                "user_id": user_id,
                "content": skills_content,
                "metadata": {"type": "skills"},
                "embedding": self._get_embedding(skills_content)
            })

        # --- DATABASE OPERATIONS ---
        
        # Clear old chunks specifically for this resume
        # RLS or Service Role will ensure this stays scoped
        self.supabase.table("resume_chunks") \
            .delete() \
            .eq("resume_id", resume_id) \
            .execute()

        # Batch insert new chunks
        if chunks:
            self.supabase.table("resume_chunks").insert(chunks).execute()

    def get_context(self, question: str, user_id: str, resume_id: str):
        """
        Retrieves relevant chunks using pgvector RPC
        """
        query_vector = self._get_embedding(question)
        
        rpc_params = {
            "query_embedding": query_vector,
            "match_threshold": 0.5,
            "match_count": 5,
            "target_user_id": user_id,   # <--- Match your new SQL function params
            "target_resume_id": resume_id
        }
        
        response = self.supabase.rpc("match_resume_chunks", rpc_params).execute()
        return "\n".join([row['content'] for row in response.data])