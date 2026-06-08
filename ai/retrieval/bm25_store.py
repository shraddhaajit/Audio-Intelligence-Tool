import json
from pathlib import Path
from rank_bm25 import BM25Okapi

bm25 = None

def build_bm25_index():
    global bm25
    chunks = []
    chunks_dir = Path(__file__).resolve().parent.parent.parent / "chunks"
    
    if chunks_dir.exists():
        for session_dir in chunks_dir.iterdir():
            if session_dir.is_dir():
                chunk_file = session_dir / "chunks.json"
                if chunk_file.exists():
                    with open(chunk_file, "r", encoding="utf-8") as f:
                        session_chunks = json.load(f)
                        chunks.extend(session_chunks)
    
    if not chunks:
        bm25 = None
        return
        
    corpus = [chunk["text"].split() for chunk in chunks]
    bm25 = BM25Okapi(corpus)

# Build immediately on import
build_bm25_index()

def bm25_search(query):
    if bm25 is None:
        return []
    tokens = query.split()
    return bm25.get_scores(tokens)