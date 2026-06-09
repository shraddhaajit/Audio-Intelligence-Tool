import chromadb
client = chromadb.PersistentClient("c:/Users/shrad/OneDrive/Desktop/audio/vectordb")
collection = client.get_collection("audio_chunks")
print(collection.peek(1))
