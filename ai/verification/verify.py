# verification/verify.py

def verify(distances, evidence_count):

    if not distances:
        return "Unsupported", 0

    best_distance = min(distances)

    retrieval_confidence = max(
        0,
        min(
            100,
            round((2 - best_distance) / 2 * 100)
        )
    )

    evidence_bonus = min(
        evidence_count * 5,
        15
    )

    confidence = min(
        retrieval_confidence + evidence_bonus,
        100
    )

    if confidence >= 80:
        support = "High"

    elif confidence >= 60:
        support = "Medium"

    elif confidence >= 40:
        support = "Low"

    else:
        support = "Unsupported"

    return support, confidence