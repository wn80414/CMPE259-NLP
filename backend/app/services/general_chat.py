# app/services/general_chat.py

from huggingface_hub import InferenceClient
from app.core.config import settings

client = InferenceClient(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    token=settings.hf_token
)


def chat_with_llama(message: str) -> str:
    messages = [
        {
            "role": "system",
            "content": (
                "You are a helpful AI career assistant focused on resumes, "
                "interviews, internships, and software engineering."
            )
        },
        {
            "role": "user",
            "content": message
        }
    ]

    response = client.chat_completion(
        messages=messages,
        max_tokens=300,
        temperature=0.7
    )

    return response.choices[0].message["content"].strip()