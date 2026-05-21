from app.services.resume_engine import resume_engine
from app.services.service_routers.intent_router import classify_intent
from huggingface_hub import InferenceClient
from app.core.config import settings

# -------------------------------------------------------------------
# Guard client (Llama 3‑8B based safety checker)
# -------------------------------------------------------------------
guard_client = InferenceClient(
    model="meta-llama/Llama-Guard-4-12B",   # dedicated guard model
    token=settings.hf_token,
    timeout=30
)

# -------------------------------------------------------------------
# Safety check functions
# -------------------------------------------------------------------
def _guard_check(text: str) -> bool:
    """
    Returns False if the text is unsafe, True if safe.
    Uses a simple prompt to classify.
    """
    response = guard_client.chat_completion(
        messages=[
            {"role": "user", "content": f"Classify the following text as 'safe' or 'unsafe':\n\n{text}"}
        ],
        max_tokens=10,
        temperature=0.0
    )
    answer = response.choices[0].message["content"].strip().lower()
    # Accept only if the model explicitly says "safe"
    return answer == "safe"

def check_input_safety(message: str) -> bool:
    """Check user input before processing."""
    if not message.strip():
        return False
    return _guard_check(message)

def check_output_safety(response: dict) -> bool:
    """Check the response before sending back to user."""
    # Check the entire message string if present
    message_content = response.get("message", "")
    if not message_content:
        return True   # no message to check
    return _guard_check(message_content)

# -------------------------------------------------------------------
# Main router (with guards)
# -------------------------------------------------------------------
def route_message(message, user_id, resume_id=None):

    # ---- INPUT GUARD ----
    if not check_input_safety(message):
        return {
            "type": "error",
            "message": "I cannot process this request. Please rephrase in a respectful manner."
        }

    intent_data = classify_intent(message)

    intent = intent_data.get("intent")
    sub_intent = intent_data.get("sub_intent")
    job_context = intent_data.get("job_context")
    print(
        "Classified intent:", intent,
        "Sub-intent:", sub_intent,
        "Job Context:", job_context
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

        result = resume_engine(
            resume_id=resume_id,
            user_id=user_id,
            query=message,
            mode=sub_intent or "rewrite",
            job_context=job_context
        )

        # ---- OUTPUT GUARD ----
        if not check_output_safety(result):
            return {
                "type": "error",
                "message": "The generated response could not be delivered safely. Please try again."
            }
        return result

    # ==========================================
    # GENERAL CHAT
    # ==========================================
    if intent == "general_chat":
        response = {
            "type": "general_chat",
            "message": (
                "Ask a question related to resumes, "
                "ATS optimization, or tailoring."
            )
        }
        # ---- OUTPUT GUARD (optional, but consistent) ----
        if not check_output_safety(response):
            return {
                "type": "error",
                "message": "I'm unable to provide a safe response right now."
            }
        return response

    # ==========================================
    # FALLBACK
    # ==========================================
    return {
        "type": "error",
        "message": "Something went wrong. Please Try Again."
    }