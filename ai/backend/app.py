from fastapi import FastAPI
from pydantic import BaseModel

from retrieval.retrieve import retrieve
from generation.generator import generate_answer
from verification.verify import verify

app = FastAPI(
    title="Audio Intelligence API",
    version="1.0.0"
)


class QuestionRequest(BaseModel):
    question: str


@app.get("/")
def home():

    return {
        "message": "Audio Intelligence API Running"
    }


@app.post("/query")
def query(request: QuestionRequest):

    question = request.question

    results = retrieve(question)

    docs = results["documents"][0]
    metadata = results["metadatas"][0]

    distances = results["distances"][0]

    evidence_text = ""

    evidence_list = []

    for doc, meta in zip(docs, metadata):

        evidence_text += doc + "\n\n"

        evidence_list.append({
    "text": doc,
    "timestamp": meta["start"],
    "end_timestamp": meta["end"],
    "source": meta["source"],
    "audio_id": meta["audio_id"]
})

    answer = generate_answer(
        question,
        evidence_text
    )
    support, confidence = verify(
    distances,
    len(evidence_list)
)

    return {
        "question": question,
        "answer": answer,
        "support": support,
        "confidence": confidence,
        "evidence": evidence_list
    }