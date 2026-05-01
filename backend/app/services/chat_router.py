from app.services.intent_router import classify_intent
from app.services.llama_parser import analyze_resume
import json


def route_message(message: str, user_id: str, resume_text: str = None):
    resume_text = resume_text.strip() if resume_text else None
    intent = classify_intent(message)
    print(intent)
    name = intent.get("intent")

    # ---------------- RESUME CRITIQUE ----------------
    if name == "resume_critique":
        if resume_text:
            analyzed = analyze_resume(resume_text)

            return {
                "type": "resume_critique",
                "data": analyzed,
                "feedback": [
                    "Add more measurable impact in experience bullets",
                    "Your projects are strong but lack system design depth",
                    "Consider adding deployment details (CI/CD, scaling)"
                ]
            }

        return {
            "type": "resume_critique",
            "error": "No resume found",
            "message": "Please upload a resume first."
        }


    # ---------------- WEB SEARCH (MOCK FOR NOW) ----------------
    if name == "web_search":
        return {
            "type": "web_search",
            "query": message,
            "results": [
                {
                    "title": "Mock Search Result 1",
                    "snippet": "This is a simulated web result for development.",
                    "url": "https://example.com"
                },
                {
                    "title": "Mock Search Result 2",
                    "snippet": "Another placeholder search result.",
                    "url": "https://example.com"
                }
            ]
        }


    # ---------------- HISTORY ----------------
    if name == "resume_history":
        return {
            "type": "resume_history",
            "resumes": [
                {
                    "id": "mock-1",
                    "name": "Latest Resume",
                    "updated": "2026-05-01"
                }
            ]
        }


    # ---------------- DEFAULT ----------------
    return {
        "type": "general_chat",
        "response": "I can help with resume critique, search, or history. What would you like?"
    }