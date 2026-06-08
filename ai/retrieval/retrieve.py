import chromadb
from retrieval.bm25_store import bm25_search

client = chromadb.PersistentClient(
    path="vectordb"
)

collection = client.get_collection(
    "audio_chunks"
)

def retrieve(query):

    vector_results = collection.query(
        query_texts=[query],
        n_results=5
    )

    bm25_scores = bm25_search(query)

    return vector_results