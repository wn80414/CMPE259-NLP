from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Header, BackgroundTasks
from supabase import create_client
from app.core.config import settings
from app.services.pdf_parser import extract_text_from_pdf
from app.services.llama_parser import parse_resume
from app.services.vector_service import VectorService # New Service

router = APIRouter()
supabase = create_client(settings.supabase_url, settings.supabase_key)
vector_service = VectorService()

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    try:
        # Note: Using get_user directly is safer for auth validation
        res = supabase.auth.get_user(token)
        return res.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/")
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    print(f"DEBUG: Processing upload for user {user_id}")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    file_bytes = await file.read()

    # 1. Extract and Parse
    raw_text = extract_text_from_pdf(file_bytes)
    structured_analysis = parse_resume(raw_text) 

    # 2. Persist Master Resume
    # Note: Upsert needs a unique constraint or an ID to actually 'update'.
    # If this is a new upload, it will just insert.
    payload = {
        "user_id": user_id,
        "resume_data": structured_analysis,
        "raw_content": raw_text 
    }
    
    res = supabase.table("resumes").upsert(payload).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Database save failed")

    resume_id = res.data[0]["id"]

    # 3. Trigger RAG Pipeline (Background Task)
    # ADDED: user_id=user_id here so the vector service can tag chunks correctly
    background_tasks.add_task(
        vector_service.upsert_resume_embeddings, 
        resume_id=resume_id, 
        user_id=user_id, # <--- Pass the user_id here
        resume_data=structured_analysis
    )

    return {
        "message": "Resume parsed and indexing started",
        "id": resume_id,
        "data": structured_analysis
    }