from app.services.resume_engine import resume_engine
from app.services.service_routers.intent_router import classify_intent


def route_message(message, user_id, resume_id=None):

    intent_data = classify_intent(message)

    intent = intent_data.get("intent")
    sub_intent = intent_data.get("sub_intent")
    job_context = intent_data.get("job_context")
    print(
        "Classified intent:",
        intent,
        "Sub-intent:",
        sub_intent,
        "Job Context:",
        job_context
    )
    
    # ==========================================
    # RESUME ENGINE
    # ==========================================

    if intent == "resume_engine":

        if not resume_id:
            return {
                "type": "error",
                "message": "resume_id required"
            }

        return resume_engine(
            resume_id=resume_id,
            user_id=user_id,
            query=message,
            mode=sub_intent or "rewrite",
            job_context=job_context
        )

    # ==========================================
    # GENERAL CHAT
    # ==========================================

    if intent == "general_chat":

        return {
            "type": "general_chat",
            "message": (
                "Ask a question related to resumes, "
                "ATS optimization, or tailoring."
            )
        }

    # ==========================================
    # FALLBACK
    # ==========================================

    return {
        "type": "error",
        "message": "Something went wrong. Please Try Again."
    }