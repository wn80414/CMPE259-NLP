from fastapi import APIRouter, Request
from app.services.chat_router import route_message

router = APIRouter()

@router.post("/")
async def chat(request: Request):
    body = await request.json()

    message = body.get("message", "")
    user_id = body.get("user_id", "")
    resume_id = body.get("resume_id") # Use the ID for pgvector RAG
    print("Received message:", message)
    print("Received resume_id:", resume_id)
    # We pass the JSON object directly to your routing/logic layer
    return route_message(
        message=message, 
        user_id=user_id,
        resume_id=resume_id,
    )