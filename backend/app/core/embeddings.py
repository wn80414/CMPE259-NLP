from huggingface_hub import InferenceClient
from app.core.config import settings
client = InferenceClient(
    model="BAAI/bge-small-en-v1.5",
    token=settings.hf_token
)

def get_embedding(text: str):
    return client.feature_extraction(text)