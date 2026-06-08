import ollama


def generate_answer(question, evidence):

    prompt = f"""
You are an evidence-based assistant.

Answer ONLY using the provided evidence.

Rules:
1. Do not use outside knowledge.
2. Give a complete sentence.
3. If evidence is insufficient, respond with:
   "Unsupported"
4. Be concise.

Question:
{question}

Evidence:
{evidence}
"""

    response = ollama.chat(
        model="qwen2.5:3b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response["message"]["content"].strip()