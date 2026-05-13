from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Header, BackgroundTasks
from supabase import create_client
from app.core.config import settings
from app.services.pdf_parser import extract_text_from_pdf
from app.services.llama_parser import parse_resume
from app.services.vector.vector_service import VectorService # New Service

router = APIRouter(prefix="/resume", tags=["Resumes"])
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

# This is the endpoint your React frontend will call: /api/resume/{uuid}
@router.get("/{resume_id}")
async def get_resume_by_id(
    resume_id: str, 
    user_id: str = Depends(get_current_user)
):
    # Fetch the specific resume but only if it belongs to the logged-in user
    res = supabase.table("resumes") \
        .select("*") \
        .eq("id", resume_id) \
        .eq("user_id", user_id) \
        .single() \
        .execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Resume not found or access denied")

    return res.data

@router.get("/{resume_id}/suggestions")
async def get_resume_suggestions(
    resume_id: str,
    user_id: str = Depends(get_current_user)
):
    # 1. Get relevant context from pgvector using the ID from the URL
    # We query for 'improvement' to get the most critical chunks
    context = vector_service.get_context("areas for improvement and missing skills", user_id, resume_id)
    
    if not context:
        return {"suggestions": [], "message": "No index found. Try re-uploading the resume."}

    # 2. This is where you'd call Llama or OpenAI
    # For now, let's return a structural confirmation
    return {
        "resume_id": resume_id,
        "context_found": len(context) > 0,
        "suggestions": [
            {"title": "Strengthen Impact", "desc": "Use more metrics in your experience section."},
            {"title": "Keyword Optimization", "desc": "Align your skills chunk with industry standards."}
        ]
    }