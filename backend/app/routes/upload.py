from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Header
from supabase import create_client, Client
import json
from app.core.config import settings

router = APIRouter()

supabase: Client = create_client(settings.supabase_url, settings.supabase_key)

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
async def upload_resume(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    if not file.filename.lower().endswith('.json'):
        raise HTTPException(status_code=400, detail='Only JSON files are supported.')

    file_content = await file.read()
    try:
        resume_data = json.loads(file_content.decode('utf-8'))
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail='Invalid JSON file.')

    # Save to Supabase
    data = {
        "user_id": user_id,
        "resume_data": resume_data,
    }

    response = supabase.table("resumes").insert(data).execute()

    if response.status_code != 201:
        raise HTTPException(status_code=500, detail='Failed to save resume.')

    return {"message": "Resume uploaded successfully", "id": response.data[0]["id"]}