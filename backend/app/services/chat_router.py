from app.services.resume_engine import resume_engine
from app.services.intent_router import classify_intent
from app.services.serp_jobs import fetch_jobs


def route_message(message, user_id, resume_id=None):

    intent_data = classify_intent(message)
    intent = intent_data.get("intent")
    sub_intent = intent_data.get("sub_intent")

    print("Classified intent:", intent, "Sub-intent:", sub_intent)

    # ---------------- RESUME ENGINE ----------------
    if intent == "resume_engine":
        if not resume_id:
            return {"error": "resume_id required for resume operations"}

        return resume_engine(
            resume_id=resume_id,
            user_id=user_id,
            query=message,
            mode=sub_intent or "general"
        )
    # ---------------- GENERAL CHAT ----------------
    if intent == "general_chat":
        return "Ask a question or request assistance related to resumes, job searching, or career advice."

    # ---------------- FALLBACK ----------------
    return {
        "type": "error",
        "message": "Unable to process request"
    }