# DocRAG — Full-Stack RAG System

## ⚡ Quick Start

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows PowerShell)
venv\Scripts\activate

# Install dependencies
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers python-dotenv
pip install langchain langchain-openai langchain-community faiss-cpu pymupdf openai tiktoken

# ⚠️  Open backend/.env and add your OpenAI key:
# OPENAI_API_KEY=sk-your-actual-key-here

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Start server
python manage.py runserver
```

### Frontend Setup (new terminal)
```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm start
```

### Open Browser
👉 http://localhost:3000

## Usage
1. Register at http://localhost:3000/register
2. Go to Documents → Upload a PDF
3. Go to Chat → Ask questions!

## Switch AI Provider
In backend/.env:
- OpenAI (default): AI_PROVIDER=openai  + OPENAI_API_KEY=sk-...
- Local (free):     AI_PROVIDER=huggingface  (no key needed)
