from app.core.embeddings import get_embedding
from app.db.supabase import supabase


class VectorService:

    def upsert_resume_embeddings(self, resume_id: str, user_id: str, resume_data: dict):
        """
        Chunk resume at the bullet level for projects/experience,
        and per category for skills.
        Path format follows JSON structure:
          - projects.0.2    → projects[0].bullets[2]
          - experience.1.0  → experience[1].bullets[0]
          - skills.languages → skills.languages
        """

        print("\n==============================")
        print("UPSERT RESUME EMBEDDINGS (JSON PATH ALIGNED)")
        print("==============================")
        print(f"resume_id: {resume_id}")
        print(f"user_id: {user_id}")

        chunks = []

        # =====================================================
        # PROJECTS (bullet level)
        # =====================================================
        print("\nProcessing projects (bullet level)...")

        for i, proj in enumerate(resume_data.get("projects", [])):
            if not isinstance(proj, dict):
                print(f"  ⚠️  Skipping non-dict project entry at index {i}")
                continue

            proj_name = proj.get("name", "Unnamed")
            tech_stack = ', '.join(proj.get('tech_stack', []))
            bullets = proj.get('bullets', [])

            for j, bullet in enumerate(bullets):
                content = (
                    f"project: {proj_name}. "
                    f"tech_stack: {tech_stack}. "
                    f"bullet: {bullet}"
                )

                print(f"\n[PROJECT {i}.{j}]")
                print(content[:300])

                embedding = get_embedding(content).tolist()

                chunks.append({
                    "resume_id": resume_id,
                    "user_id": user_id,
                    "content": content,
                    "metadata": {
                        "type": "project",
                        "project_name": proj_name,
                        "bullet_index": j,
                        "bullet_text": bullet
                    },
                    "embedding": embedding,
                    "path": f"projects.{i}.bullets.{j}"          # JSON: projects[i].bullets[j]
                })

        # =====================================================
        # EXPERIENCE (bullet level)
        # =====================================================
        print("\nProcessing experience (bullet level)...")

        for i, exp in enumerate(resume_data.get("experience", [])):
            company = exp.get("company", "Unknown")
            role = exp.get("role", "")
            bullets = exp.get("bullets", [])

            for j, bullet in enumerate(bullets):
                content = (
                    f"company: {company}. "
                    f"role: {role}. "
                    f"bullet: {bullet}"
                )

                print(f"\n[EXPERIENCE {i}.{j}]")
                print(content[:300])

                embedding = get_embedding(content).tolist()

                chunks.append({
                    "resume_id": resume_id,
                    "user_id": user_id,
                    "content": content,
                    "metadata": {
                        "type": "experience",
                        "company": company,
                        "bullet_index": j,
                        "bullet_text": bullet
                    },
                    "embedding": embedding,
                    "path": f"experience.{i}.bullets.{j}"        # JSON: experience[i].bullets[j]
                })

        # =====================================================
        # SKILLS (one chunk per category)
        # =====================================================
        print("\nProcessing skills (per category)...")

        skills = resume_data.get("skills", {})

        for category, items in skills.items():
            if not isinstance(items, list) or len(items) == 0:
                print(f"    Skipping empty/non-list category: '{category}'")
                continue

            # Content with category name for context
            content = f"{category}: " + ", ".join(items)
            print(f"\n[SKILLS.{category}]")
            print(content[:300])

            embedding = get_embedding(content).tolist()

            chunks.append({
                "resume_id": resume_id,
                "user_id": user_id,
                "content": content,
                "metadata": {
                    "type": "skills",
                    "category": category,
                    "skill_count": len(items)
                },
                "embedding": embedding,
                "path": f"skills.{category}"             # JSON: skills[category]
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
            print(f"\nInserting {len(chunks)} chunks into Supabase...")
            insert_response = (
                supabase.table("resume_chunks")
                .insert(chunks)
                .execute()
            )
        else:
            print("No chunks generated.")
