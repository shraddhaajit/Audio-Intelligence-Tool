import ollama

question = "when did kendall jenner last shoot for ad?"
evidence = '''"Hi, Vogue. It's Kendall Jenner, and today I'm going to show you on my closet. Come on. This is where I come every day to get dressed or to pack for a big trip or to do fittings with my stylist. I shot my house for architectural digest like six years ago, and they took a photo of this room. The photo haunts me to this day. I can't stand looking at it.'''

prompt = f"""
You are an expert evidence-based investigator.
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
print("Response from AI:", response["message"]["content"].strip())
