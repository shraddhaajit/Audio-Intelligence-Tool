import ollama


def generate_answer(question, evidence):

    prompt = f"""
You are an evidence-based assistant.

Answer ONLY using the provided evidence.

Instructions:
1. Do not use outside knowledge.
2. The evidence is an audio transcript. The speaker often uses "I" or "my". You must figure out who the speaker is from the surrounding text or metadata.
3. The user may use abbreviations or slang in their question. Deduce what they mean based on the context of the evidence.
4. If the evidence contains the answer, write a complete, concise sentence.
5. If the evidence absolutely does not contain the answer, respond exactly with the word: "Unsupported".

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