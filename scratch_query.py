import chromadb
from pathlib import Path
client = chromadb.PersistentClient(path="c:/Users/shrad/OneDrive/Desktop/audio/vectordb")
collection = client.get_collection("audio_chunks")
results = collection.query(query_texts=["when did kendall jenner last shoot for ad?"], n_results=5)
print(results["distances"])
