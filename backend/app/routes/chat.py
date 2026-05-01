from fastapi import APIRouter, Request
from app.services.chat_router import route_message

router = APIRouter()

@router.post("/")
async def chat(request: Request):
    print("Received chat request")
    body = await request.json()

    message = body.get("message", "")
    user_id = body.get("user_id", "")
    resume_text = body.get("resume_text")
    print("Received chat message:", message)
    print("Received user ID:", user_id)
    print("Received resume text:", resume_text)

    return route_message(message, user_id, resume_text)