from fastapi import APIRouter, Depends, HTTPException, Header, BackgroundTasks, Request
from supabase import create_client
from app.core.config import settings
from app.services.vector_service import VectorService

router = APIRouter()
supabase = create_client(settings.supabase_url, settings.supabase_key)
vector_service = VectorService()


async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.split(" ")[1]
    try:
        res = supabase.auth.get_user(token)
        return res.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.put("/")
async def upload_resume(
    request: Request,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
):
    structured_analysis = await request.json()

    if not structured_analysis:
        raise HTTPException(status_code=400, detail="No resume data provided")

    # Persist resume
    payload = {
        "user_id": user_id,
        "resume_data": structured_analysis,
    }

    res = supabase.table("resumes").upsert(payload).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Database save failed")

    resume_id = res.data[0]["id"]

    # Trigger RAG indexing
    background_tasks.add_task(
        vector_service.upsert_resume_embeddings,
        resume_id=resume_id,
        user_id=user_id,
        resume_data=structured_analysis
    )

    return {
        "message": "Resume saved and indexing started",
        "id": resume_id,
        "data": structured_analysis
    }