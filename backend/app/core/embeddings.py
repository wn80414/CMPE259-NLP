from fastembed import TextEmbedding

model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

def get_embedding(text: str):
    embedding = next(model.embed([text]))
    return embedding.tolist()