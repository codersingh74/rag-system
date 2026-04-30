"""LLM integration — OpenAI (streaming) + HuggingFace (local fallback)."""
from django.conf import settings

RAG_SYSTEM_PROMPT = """You are a precise document assistant. Answer questions based ONLY on the provided context.

STRICT RULES:
1. Answer ONLY from the provided context — never use outside knowledge.
2. If the answer is not in the context, say: "I couldn't find that information in the uploaded documents."
3. Cite which document your answer comes from.
4. Be concise and accurate. Do not hallucinate.

Context from uploaded documents:
{context}
"""

def answer_with_openai(query, context, history):
    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    messages = [{'role':'system','content':RAG_SYSTEM_PROMPT.format(context=context)}]
    messages.extend(history[-6:])
    messages.append({'role':'user','content':query})
    resp = client.chat.completions.create(model='gpt-4o-mini', messages=messages, max_tokens=1000, temperature=0.1)
    return resp.choices[0].message.content

def answer_with_openai_stream(query, context, history):
    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    messages = [{'role':'system','content':RAG_SYSTEM_PROMPT.format(context=context)}]
    messages.extend(history[-6:])
    messages.append({'role':'user','content':query})
    stream = client.chat.completions.create(model='gpt-4o-mini', messages=messages, max_tokens=1000, temperature=0.1, stream=True)
    for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content

def answer_with_huggingface(query, context):
    from transformers import pipeline as hf_pipeline
    prompt = f"Answer based ONLY on this context:\n{context}\n\nQuestion: {query}\n\nAnswer:"
    gen = hf_pipeline('text2text-generation', model='google/flan-t5-base', max_new_tokens=300)
    return gen(prompt)[0]['generated_text'].strip()

def get_rag_answer(query, user_id, conversation_history=None):
    from apps.rag.pipeline import similarity_search, build_context
    history = conversation_history or []
    try:
        docs = similarity_search(query, user_id, k=5)
    except ValueError as e:
        return {'answer': str(e), 'sources': []}
    context, sources = build_context(docs)
    if settings.AI_PROVIDER == 'openai':
        answer = answer_with_openai(query, context, history)
    else:
        answer = answer_with_huggingface(query, context)
    return {'answer': answer, 'sources': sources}
