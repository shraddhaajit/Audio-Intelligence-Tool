from generation.generator import generate_answer

evidence = """
Transformers were introduced in 2017 and revolutionized NLP.
"""

answer = generate_answer(
    "When were transformers introduced?",
    evidence
)

print(answer)