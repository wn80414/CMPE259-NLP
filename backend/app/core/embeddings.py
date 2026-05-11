from sentence_transformers import SentenceTransformer

# Load ONCE globally (important for performance)
model = SentenceTransformer("BAAI/bge-small-en-v1.5")

def get_embedding(text: str):
    return model.encode(text).tolist()