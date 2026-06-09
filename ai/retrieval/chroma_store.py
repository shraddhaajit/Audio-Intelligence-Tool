import chromadb
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

client = chromadb.PersistentClient(
    path=str(PROJECT_ROOT / "vectordb")
)

collection = client.get_or_create_collection(
    name="audio_chunks"
)

def build_chroma_index():
    chunks_dir = Path(__file__).resolve().parent.parent.parent / "chunks"
    
    if chunks_dir.exists():
        for session_dir in chunks_dir.iterdir():
            if session_dir.is_dir():
                chunk_file = session_dir / "chunks.json"
                if chunk_file.exists():
                    with open(chunk_file, "r", encoding="utf-8") as f:
                        chunks = json.load(f)
                    
                    for chunk in chunks:
                        collection.upsert(
                            ids=[f"{chunk['audio_id']}_{chunk['chunk_id']}"],
                            documents=[chunk["text"]],
                            metadatas=[{
                                "start": chunk["start"],
                                "end": chunk["end"],
                                "start_seconds": chunk["start_seconds"],
                                "end_seconds": chunk["end_seconds"],
                                "source": chunk["source"],
                                "audio_id": chunk["audio_id"]
                            }]
                        )

build_chroma_index()