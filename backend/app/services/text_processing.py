import re

def split_into_sentences(text: str) -> list[str]:
    """Split text into sentences on periods."""
    if not text:
        return [""]
    parts = re.split(r'(?<=\.)\s+', text.strip())
    return [p.strip() for p in parts if p.strip()]

BULLET_PATH_PATTERN = re.compile(
    r'^(experience|projects)\.\d+\.bullets\.\d+$|^skills\.\w+$'
)

def flatten_chunks_to_sentences(chunks: list) -> tuple[list[str], list[str]]:
    sentences = []
    paths = []
    
   # print(f"\n[flatten_chunks_to_sentences] Received {len(chunks)} chunks")
    
    for i, chunk in enumerate(chunks):
        content = chunk.get("content", "")
        path = chunk.get("path", "")
        print(f"  Chunk {i}: path='{path}', content_len={len(content)}")
        
        if not content or not path:
            print(f"    -> SKIP (empty content or path)")
            continue
        
        if not BULLET_PATH_PATTERN.match(path):
            print(f"    -> SKIP (not a bullet/skill path)")
            continue
        
        sentences.append(content.strip())
        paths.append(path)
        print(f"    -> KEPT (now {len(sentences)} sentences total)")
    
    print(f"[flatten_chunks_to_sentences] Final: {len(sentences)} sentences, {len(paths)} paths\n")
    return sentences, paths