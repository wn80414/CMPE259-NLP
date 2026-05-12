from huggingface_hub import InferenceClient
from huggingface_hub.utils import HfHubHTTPError
import time
from app.core.config import settings

client = InferenceClient(
    model="BAAI/bge-small-en-v1.5",
    token=settings.hf_token,
    timeout=60,
)

def get_embedding(text: str, retries: int = 3):
    for attempt in range(retries):
        try:
            embedding = client.feature_extraction(text)
            return embedding.tolist()

        except HfHubHTTPError as e:
            print(f"HF error: {e}")

            if attempt == retries - 1:
                raise

            time.sleep(2 * (attempt + 1))