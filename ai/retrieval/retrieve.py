import chromadb
from pathlib import Path
from retrieval.bm25_store import bm25_search

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

client = chromadb.PersistentClient(
    path=str(PROJECT_ROOT / "vectordb")
)

collection = client.get_or_create_collection(
    "audio_chunks"
)

def retrieve(query):

    vector_results = collection.query(
        query_texts=[query],
        n_results=5
    )

    bm25_scores = bm25_search(query)

    return vector_results