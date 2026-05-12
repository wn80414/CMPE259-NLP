from app.core.embeddings import get_embedding
from app.db.supabase import supabase


class VectorService:

    def upsert_resume_embeddings(self, resume_id: str, user_id: str, resume_data: dict):
        """
        Chunk resume and store embeddings in Supabase.
        """

        print("\n==============================")
        print("UPSERT RESUME EMBEDDINGS")
        print("==============================")
        print(f"resume_id: {resume_id}")
        print(f"user_id: {user_id}")

        chunks = []

        # =====================================================
        # PROJECTS
        # =====================================================
        print("\nProcessing projects...")

        for i, proj in enumerate(resume_data.get("projects", [])):
            content = (
                f"Project: {proj.get('name')}. "
                f"Tech: {', '.join(proj.get('tech_stack', []))}. "
                f"Details: {' '.join(proj.get('bullets', []))}"
            )

            print(f"\n[PROJECT {i}]")
            print(content[:300])

            embedding = get_embedding(content)

            print(f"Embedding length: {len(embedding)}")

            chunks.append({
                "resume_id": resume_id,
                "user_id": user_id,
                "content": content,
                "metadata": {"type": "project"},
                "embedding": embedding
            })

        # =====================================================
        # EXPERIENCE
        # =====================================================
        print("\nProcessing experience...")

        for i, exp in enumerate(resume_data.get("experience", [])):
            content = (
                f"Experience at {exp.get('company')} "
                f"as {exp.get('role')}. "
                f"Details: {' '.join(exp.get('bullets', []))}"
            )

            print(f"\n[EXPERIENCE {i}]")
            print(content[:300])

            embedding = get_embedding(content)

            print(f"Embedding length: {len(embedding)}")

            chunks.append({
                "resume_id": resume_id,
                "user_id": user_id,
                "content": content,
                "metadata": {"type": "experience"},
                "embedding": embedding
            })

        # =====================================================
        # SKILLS
        # =====================================================
        print("\nProcessing skills...")

        skills = resume_data.get("skills", {})

        if skills:
            skills_list = []

            for k, v in skills.items():
                if isinstance(v, list):
                    skills_list.extend(v)

            skills_content = f"Technical Skills: {', '.join(skills_list)}"

            print("\n[SKILLS]")
            print(skills_content[:300])

            embedding = get_embedding(skills_content)

            print(f"Embedding length: {len(embedding)}")

            chunks.append({
                "resume_id": resume_id,
                "user_id": user_id,
                "content": skills_content,
                "metadata": {"type": "skills"},
                "embedding": embedding
            })

        print("\n===================================")
        print(f"TOTAL CHUNKS CREATED: {len(chunks)}")
        print("===================================")

        # =====================================================
        # DELETE OLD CHUNKS
        # =====================================================
        print("\nDeleting existing chunks...")

        delete_response = (
            supabase.table("resume_chunks")
            .delete()
            .eq("resume_id", resume_id)
            .execute()
        )

        print("Delete complete.")
        print(delete_response)

        # =====================================================
        # INSERT NEW CHUNKS
        # =====================================================
        if chunks:
            print("\nInserting chunks into Supabase...")

            insert_response = (
                supabase.table("resume_chunks")
                .insert(chunks)
                .execute()
            )

            print("Insert complete.")
            print(insert_response)

        else:
            print("No chunks generated.")

    def get_context(self, question: str, user_id: str, resume_id: str):
        """
        Retrieve relevant chunks via pgvector RPC
        """

        print("\n==============================")
        print("VECTOR SEARCH")
        print("==============================")

        print(f"Question: {question}")
        print(f"user_id: {user_id}")
        print(f"resume_id: {resume_id}")

        print("\nGenerating query embedding...")

        query_vector = get_embedding(question)

        print(f"Query embedding length: {len(query_vector)}")
        print(f"First 5 dims: {query_vector[:5]}")

        rpc_params = {
            "query_embedding": query_vector,
            "match_threshold": 0.5,
            "match_count": 5,
            "target_user_id": user_id,
            "target_resume_id": resume_id
        }

        print("\nRPC PARAMS:")
        print(rpc_params)

        print("\nCalling match_resume_chunks RPC...")

        response = supabase.rpc(
            "match_resume_chunks",
            rpc_params
        ).execute()

        print("\nRPC RESPONSE:")
        print(response)

        rows = response.data or []

        print(f"\nRetrieved {len(rows)} chunks")

        for i, row in enumerate(rows):
            print(f"\n[MATCH {i}]")
            print(f"Similarity: {row.get('similarity')}")
            print(row.get("content", "")[:500])

        context = "\n".join(
            [row["content"] for row in rows]
        )

        print("\nFINAL CONTEXT:")
        print(context[:1000])

        return context