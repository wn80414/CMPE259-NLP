import fitz  # PyMuPDF
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Header
from supabase import create_client
from app.core.config import settings
from app.services.pdf_parser import extract_text_from_pdf
from app.services.llama_parser import analyze_resume

router = APIRouter()

supabase = create_client(settings.supabase_url, settings.supabase_key)


async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.split(" ")[1]

    try:
        user = supabase.auth.get_user(token)
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):

    # 1. Validate
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    file_bytes = await file.read()

    # 2. PDF → text (service)
    raw_text = extract_text_from_pdf(file_bytes)

    # 3. LLM analysis (service)
    analysis = analyze_resume(raw_text)

    # 4. Save to Supabase
    payload = {
        "user_id": user_id,
        "resume_data": {
            "raw_text": raw_text,
            "analysis": analysis
        }
    }

    res = supabase.table("resumes").insert(payload).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Insert failed")

    return {
        "message": "Resume processed successfully",
        "id": res.data[0]["id"],
        "analysis": analysis
    }