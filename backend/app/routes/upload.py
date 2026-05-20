from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Header
from supabase import create_client
from app.core.config import settings
from app.services.pdf_parser import extract_text_from_pdf
from app.services.llama_parser import parse_resume
from app.services.vector.vector_service import VectorService

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

@router.post("/")
async def upload_resume(
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
    payload = {
        "user_id": user_id,
        "resume_data": structured_analysis,
        "raw_content": raw_text 
    }
    
    res = supabase.table("resumes").upsert(payload).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Database save failed")

    resume_id = res.data[0]["id"]

    # 3. Vector Indexing (now blocking – waits for completion)
    try:
        vector_service.upsert_resume_embeddings(
            resume_id=resume_id,
            user_id=user_id,
            resume_data=structured_analysis
        )
    except Exception as e:
        print(f"Vector indexing failed: {e}")
        # Optionally still return success with a warning
        # raise HTTPException(status_code=500, detail=f"Vector indexing error: {str(e)}")

    return {
        "message": "Resume parsed and indexed",
        "id": resume_id,
        "data": structured_analysis
    }