from retrieval.retrieve import retrieve
from generation.generator import generate_answer
from verification.verify import verify


def query_audio(question):

    results = retrieve(question)

    docs = results["documents"][0]
    metadata = results["metadatas"][0]

    evidence_text = ""

    evidence_list = []

    for doc, meta in zip(docs, metadata):

        evidence_text += doc + "\n\n"

        evidence_list.append({
            "text": doc,
            "timestamp": meta["start"]
        })

    answer = generate_answer(
        question,
        evidence_text
    )

    support, confidence = verify(
        len(evidence_list)
    )

    return {
        "answer": answer,
        "support": support,
        "confidence": confidence,
        "evidence": evidence_list
    }


if __name__ == "__main__":

    result = query_audio(
        "When were transformers introduced?"
    )

    print("\nANSWER")
    print(result["answer"])

    print("\nSUPPORT")
    print(result["support"])

    print("\nCONFIDENCE")
    print(f"{result['confidence']}%")

    print("\nEVIDENCE")

    for item in result["evidence"]:
        print(f"[{item['timestamp']}]")
        print(item["text"])
        print()