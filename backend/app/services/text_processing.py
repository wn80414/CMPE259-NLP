import re

def split_into_sentences(text: str) -> list[str]:
    """Split text into sentences on periods."""
    if not text:
        return [""]
    parts = re.split(r'(?<=\.)\s+', text.strip())
    return [p.strip() for p in parts if p.strip()]

def flatten_chunks_to_sentences(chunks: list) -> tuple[list[str], list[str]]:
    """
    Flatten all chunks into two parallel lists:
      - sentences:  every bullet/sentence from all chunks
      - paths:      corresponding path for that sentence

    Returns (sentences, paths)
    """
    sentences = []
    paths = []
    
    for chunk in chunks:
        content = chunk.get("content", "")
        path = chunk.get("path", "")
        if not content:
            continue
        for sent in split_into_sentences(content):
            sent = sent.strip()
            if sent:
                sentences.append(sent)
                paths.append(path)
    
    return sentences, paths