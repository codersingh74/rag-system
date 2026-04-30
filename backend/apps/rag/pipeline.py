"""
RAG Pipeline
1. PDF text extraction  (PyMuPDF)
2. Text chunking with overlap  (LangChain)
3. Embedding generation  (OpenAI or HuggingFace)
4. Vector store  (FAISS or ChromaDB)
5. Summary generation
6. Similarity search
"""
import os
from pathlib import Path
from typing import List, Dict, Any

import fitz  # PyMuPDF
from django.conf import settings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document as LCDocument

def get_embeddings():
    if settings.AI_PROVIDER == 'openai':
        from langchain_openai import OpenAIEmbeddings
        return OpenAIEmbeddings(openai_api_key=settings.OPENAI_API_KEY, model='text-embedding-3-small')
    else:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        return HuggingFaceEmbeddings(
            model_name=settings.HUGGINGFACE_MODEL,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )


def get_vector_store_path(user_id: int) -> Path:
    path = Path(settings.VECTOR_STORE_PATH) / f'user_{user_id}'
    path.mkdir(parents=True, exist_ok=True)
    return path


def load_or_create_vector_store(user_id: int, embeddings):
    store_path = get_vector_store_path(user_id)
    if settings.VECTOR_DB == 'faiss':
        index_file = store_path / 'faiss_index'
        if index_file.exists():
            from langchain_community.vectorstores import FAISS
            return FAISS.load_local(str(index_file), embeddings, allow_dangerous_deserialization=True)
        return None
    else:
        from langchain_community.vectorstores import Chroma
        return Chroma(
            persist_directory=str(store_path / 'chroma'),
            embedding_function=embeddings,
            collection_name=f'user_{user_id}'
        )


def save_vector_store(vector_store, user_id: int):
    if settings.VECTOR_DB == 'faiss':
        store_path = get_vector_store_path(user_id)
        vector_store.save_local(str(store_path / 'faiss_index'))


def extract_text_from_pdf(file_path: str) -> Dict[str, Any]:
    doc = fitz.open(file_path)
    pages = []
    for i in range(len(doc)):
        text = doc[i].get_text('text')
        if text.strip():
            pages.append(f'[Page {i+1}]\n{text}')
    count = len(doc)
    doc.close()
    return {'text': '\n\n'.join(pages), 'page_count': count, 'pages': pages}


def chunk_text(text: str, doc_id: int, doc_title: str) -> List[LCDocument]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, chunk_overlap=200,
        separators=['\n\n', '\n', '. ', ' ', ''], length_function=len
    )
    raw_chunks = splitter.split_text(text)
    return [
        LCDocument(page_content=chunk, metadata={
            'doc_id': doc_id, 'doc_title': doc_title,
            'chunk_index': i, 'total_chunks': len(raw_chunks)
        })
        for i, chunk in enumerate(raw_chunks)
    ]


def generate_summary(text: str) -> str:
    try:
        sample = text[:3000]
        if settings.AI_PROVIDER == 'openai':
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            resp = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': 'Summarize the document in 2-3 sentences.'},
                    {'role': 'user', 'content': f'Summarize:\n\n{sample}'}
                ],
                max_tokens=200, temperature=0.3
            )
            return resp.choices[0].message.content.strip()
        return 'Summary not available in local HuggingFace mode.'
    except Exception as e:
        return f'Summary generation failed: {str(e)}'


def process_document(doc) -> Dict[str, Any]:
    extraction = extract_text_from_pdf(doc.file.path)
    text = extraction['text']
    if not text.strip():
        raise ValueError('No extractable text found. PDF may be a scanned image.')

    chunks = chunk_text(text, doc.id, doc.title)
    if not chunks:
        raise ValueError('Document produced no text chunks.')

    embeddings = get_embeddings()
    existing = load_or_create_vector_store(doc.user.id, embeddings)

    if existing is not None:
        existing.add_documents(chunks)
        vector_store = existing
    else:
        if settings.VECTOR_DB == 'faiss':
            from langchain_community.vectorstores import FAISS
            vector_store = FAISS.from_documents(chunks, embeddings)
        else:
            from langchain_community.vectorstores import Chroma
            sp = get_vector_store_path(doc.user.id)
            vector_store = Chroma.from_documents(
                chunks, embeddings,
                persist_directory=str(sp / 'chroma'),
                collection_name=f'user_{doc.user.id}'
            )

    save_vector_store(vector_store, doc.user.id)
    summary = generate_summary(text)
    return {'page_count': extraction['page_count'], 'chunk_count': len(chunks), 'summary': summary}


def similarity_search(query: str, user_id: int, k: int = 5) -> List[LCDocument]:
    embeddings = get_embeddings()
    vs = load_or_create_vector_store(user_id, embeddings)
    if vs is None:
        raise ValueError('No documents found. Please upload a PDF first.')
    return vs.similarity_search(query, k=k)


def delete_document_vectors(doc_id: int, user_id: int):
    embeddings = get_embeddings()
    if settings.VECTOR_DB == 'chroma':
        from langchain_community.vectorstores import Chroma
        sp = get_vector_store_path(user_id)
        chroma = Chroma(persist_directory=str(sp / 'chroma'), embedding_function=embeddings, collection_name=f'user_{user_id}')
        results = chroma.get(where={'doc_id': doc_id})
        if results['ids']:
            chroma.delete(ids=results['ids'])


def build_context(docs: List[LCDocument]):
    parts, sources = [], []
    for i, doc in enumerate(docs, 1):
        title = doc.metadata.get('doc_title', 'Unknown')
        idx = doc.metadata.get('chunk_index', 0)
        parts.append(f'[Source {i} — {title}, chunk {idx}]\n{doc.page_content}')
        if title not in sources:
            sources.append(title)
    return '\n\n---\n\n'.join(parts), sources
