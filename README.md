# 🤖 RAG System — Intelligent Document Assistant

> Upload your documents. Ask questions. Get AI-powered answers — grounded only in your own data.

A full-stack **Retrieval-Augmented Generation (RAG)** application that lets users upload PDF documents and have context-aware conversations with an AI assistant that answers **strictly from the uploaded content** — no hallucinations, no outside knowledge.

---

## 📸 Screenshots

> Add screenshots here after deployment — Dashboard, Chat, and Document Upload pages.

---

## 🧠 What is RAG?

Most AI chatbots (like ChatGPT) are trained on public data and cannot access your private documents. RAG solves this by:

1. Taking your uploaded documents
2. Breaking them into chunks and converting them into vector embeddings
3. When you ask a question, finding the most relevant chunks using similarity search
4. Sending those chunks as context to the LLM to generate a grounded answer

```
User uploads PDF
      ↓
Text extracted (PyMuPDF)
      ↓
Split into chunks with overlap (LangChain RecursiveCharacterTextSplitter)
      ↓
Embeddings generated (OpenAI text-embedding-3-small)
      ↓
Stored in FAISS vector database (per user, isolated)
      ↓
User asks a question
      ↓
Top-5 similar chunks retrieved (cosine similarity)
      ↓
Chunks + conversation history sent to GPT-4o-mini
      ↓
Answer streamed back token-by-token (SSE)
```

---

## ✨ Features

- **📄 PDF Upload** — Upload multiple PDFs with automatic text extraction, chunking, and indexing
- **💬 AI Chat** — Ask natural language questions and get answers sourced from your documents
- **🔴 Streaming Responses** — Real-time token-by-token response streaming (like ChatGPT)
- **📚 Source Citations** — Every answer cites which document it came from
- **🗂️ Conversation History** — Full multi-turn conversation with context memory
- **👤 User Authentication** — JWT-based auth with email login and per-user isolated document storage
- **🔀 Dual AI Provider** — OpenAI API (primary) with HuggingFace sentence-transformers (fallback)
- **🗄️ Dual Vector DB** — FAISS (default) or ChromaDB configurable via `.env`
- **🚀 Production Ready** — Gunicorn, environment-based settings, Render + Vercel deployment

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Django 6.0 | Web framework and ORM |
| Django REST Framework | REST API |
| SimpleJWT | JWT authentication |
| django-cors-headers | CORS for React frontend |
| LangChain | RAG pipeline orchestration |
| langchain-text-splitters | Document chunking |
| langchain-community | Vector store integrations |
| langchain-openai | OpenAI embeddings |
| FAISS | Vector similarity search |
| PyMuPDF (fitz) | PDF text extraction |
| OpenAI API | GPT-4o-mini for answers + embeddings |
| HuggingFace Transformers | Local model fallback |
| sentence-transformers | Local embeddings |
| SQLite / PostgreSQL | Relational database |
| Gunicorn | Production WSGI server |
| python-dotenv | Environment config |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS v3 | Styling |
| React Router DOM v6 | Client-side routing |
| Axios | HTTP client |
| React Dropzone | Drag-and-drop file upload |
| Lucide React | Icon library |

### DevOps
| Technology | Purpose |
|---|---|
| Render | Backend deployment |
| Vercel | Frontend deployment |
| PostgreSQL | Production database |

---

## 📁 Project Structure

```
rag-system/
├── backend/
│   ├── core/
│   │   ├── settings.py          # Development settings
│   │   ├── settings_prod.py     # Production settings
│   │   ├── urls.py              # Root URL configuration
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── users/               # Custom user model (email-based auth)
│   │   │   ├── models.py        # CustomUser extends AbstractUser
│   │   │   ├── views.py         # Register, login, profile endpoints
│   │   │   └── urls.py
│   │   ├── documents/           # PDF upload and management
│   │   │   ├── models.py        # Document model (status, page_count, summary)
│   │   │   ├── views.py         # Upload, list, delete endpoints
│   │   │   └── urls.py
│   │   ├── rag/                 # Core RAG pipeline
│   │   │   └── pipeline.py      # Extract → Chunk → Embed → Store → Search
│   │   └── chat/                # Conversation system
│   │       ├── models.py        # Conversation + Message models
│   │       ├── views.py         # SSE streaming, sync endpoints
│   │       ├── llm.py           # OpenAI + HuggingFace integration
│   │       └── urls.py
│   ├── vector_store/            # FAISS indexes (per-user isolated)
│   ├── media/                   # Uploaded PDF files
│   ├── requirements.txt
│   ├── manage.py
│   ├── Procfile                 # Render deployment
│   └── .env                     # Environment variables
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Documents.jsx    # Upload and manage PDFs
    │   │   └── Chat.jsx         # AI chat interface
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── UploadZone.jsx   # Drag-and-drop upload
    │   │   └── ChatMessage.jsx  # Streaming message renderer
    │   ├── context/
    │   │   └── AuthContext.jsx  # Global auth state
    │   ├── services/
    │   │   ├── api.js           # Axios base config
    │   │   ├── auth.js          # Login/register calls
    │   │   ├── documents.js     # Document CRUD
    │   │   └── chat.js          # Chat + SSE streaming
    │   └── main.jsx
    ├── vite.config.js
    ├── tailwind.config.js
    └── vercel.json
```

---

## ⚙️ Local Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- OpenAI API key (get one at [platform.openai.com](https://platform.openai.com))

### 1. Clone the repository

```bash
git clone https://github.com/your-username/rag-system.git
cd rag-system
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Create `.env` file

Create a `.env` file inside the `backend/` folder:

```env
SECRET_KEY=your-super-secret-django-key-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=sqlite:///db.sqlite3

# AI Provider — openai or huggingface
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-key-here

# HuggingFace fallback
HUGGINGFACE_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Vector DB — faiss or chroma
VECTOR_DB=faiss

# File Storage
MEDIA_ROOT=media/
MAX_UPLOAD_SIZE_MB=50

CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### 4. Run migrations and start backend

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

### 5. Frontend setup

```bash
cd ../frontend

npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login, get JWT tokens |
| POST | `/api/auth/token/refresh/` | Refresh access token |

### Documents
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/documents/` | List all user documents |
| POST | `/api/documents/` | Upload a new PDF |
| GET | `/api/documents/{id}/` | Get document details |
| DELETE | `/api/documents/{id}/` | Delete document + vectors |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/chat/` | List all conversations |
| POST | `/api/chat/` | Create new conversation |
| GET | `/api/chat/{id}/` | Get conversation with messages |
| DELETE | `/api/chat/{id}/` | Delete conversation |
| POST | `/api/chat/{id}/message/` | Send message (SSE streaming) |
| POST | `/api/chat/{id}/message/sync/` | Send message (sync fallback) |

---

## 🚀 Deployment

### Backend on Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New Web Service → Connect your repo
3. Set the following:
   - **Build Command:** `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
   - **Start Command:** `gunicorn core.wsgi:application`
4. Add all environment variables from your `.env` file
5. Set `DJANGO_SETTINGS_MODULE=core.settings_prod`

### Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Connect your repo
2. Set the root directory to `frontend`
3. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`
4. Deploy

The `vercel.json` in the frontend folder handles SPA routing automatically.

---

## 🔧 Configuration Options

| Variable | Options | Default | Description |
|---|---|---|---|
| `AI_PROVIDER` | `openai`, `huggingface` | `openai` | Which AI model to use |
| `VECTOR_DB` | `faiss`, `chroma` | `faiss` | Vector database backend |
| `MAX_UPLOAD_SIZE_MB` | any integer | `50` | Max PDF size in MB |
| `OPENAI_API_KEY` | your key | — | Required for OpenAI mode |

---

## 🧩 Key Technical Challenges Solved

| Challenge | Solution |
|---|---|
| LangChain v0.1+ breaking changes | Migrated to `langchain-text-splitters`, `langchain-core`, `langchain-community` |
| Django QuerySet negative indexing | Converted QuerySet to list before slicing for chat history |
| JWT auth with SSE streaming | Set `Cache-Control: no-cache` and `X-Accel-Buffering: no` headers |
| Per-user vector isolation | Separate FAISS index directory per `user_id` |
| Vite + Tailwind CSS v3 on Windows | Downgraded to Tailwind v3, used `npx tailwindcss init -p` |
| CORS for React ↔ Django | `CorsMiddleware` as first middleware, `CORS_ALLOW_CREDENTIALS=True` |

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

MIT License — feel free to use this project for learning or as a base for your own applications.

---

## 👤 Author

Built by **Jaiva**

- LinkedIn: [your-linkedin](https://linkedin.com/in/your-profile)
- GitHub: [your-github](https://github.com/your-username)

---

> ⭐ If this project helped you, please give it a star on GitHub!
