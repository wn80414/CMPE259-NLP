from app.services.resume_engine import resume_engine
from app.services.intent_router import classify_intent


def route_message(message, user_id, resume_id=None):

    intent_data = classify_intent(message)

    intent = intent_data.get("intent")
    sub_intent = intent_data.get("sub_intent")

    print(
        "Classified intent:",
        intent,
        "Sub-intent:",
        sub_intent
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
            mode=sub_intent or "rewrite"
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
        "message": "Unable to process request"
    }