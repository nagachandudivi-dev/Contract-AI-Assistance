# GenAI Document Intelligence Assistant

A production-quality full-stack application that allows Admin and User accounts to upload, manage, and query documents using AI-powered Retrieval-Augmented Generation (RAG).

## Features

### Admin Portal
- Upload PDF, DOCX, and CSV documents (up to 50 MB)
- View document list, details, and extracted chunks
- AI Assistant chat with RAG (answers only from uploaded documents)
- Compare documents side-by-side across key fields
- Question/Answer history
- Analytics dashboard with charts

### User Portal
- AI Assistant chat
- Compare Documents
- Question History
- Citation Viewer

### AI Behavior
- Answers ONLY from uploaded document content — never hallucinations
- If information is unavailable: _"Sorry, I don't have enough information in the uploaded documents to answer this question."_
- Hybrid search: keyword matching + embedding cosine similarity
- Confidence levels: High (≥0.75), Medium (≥0.50), Low (<0.50)
- Full citations with source document, section, page, and row

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Material UI, Axios, React Router |
| Backend | .NET 8 Web API, C#, Entity Framework Core, Swagger |
| Database | SQLite |
| AI | OpenAI gpt-4o-mini + text-embedding-3-small |
| PDF | UglyToad.PdfPig |
| DOCX | Open XML SDK (DocumentFormat.OpenXml) |
| CSV | CsvHelper |
| Cloud | Azure App Service + Azure Static Web Apps |

---

## Getting Started

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- OpenAI API key (optional — app runs without it, AI features degraded)

### 1. Clone the repository
```bash
git clone <repo-url>
cd document-intelligence-assistant
```

### 2. Configure OpenAI API Key

**Option A — Environment variable (recommended):**
```bash
# Windows PowerShell
$env:OPENAI_API_KEY="sk-..."

# Linux/Mac
export OPENAI_API_KEY="sk-..."
```

**Option B — .NET User Secrets:**
```bash
cd backend/DocumentIntelligenceAPI
dotnet user-secrets set "OpenAI:ApiKey" "sk-..."
```

### 3. Run the Backend
```bash
cd backend/DocumentIntelligenceAPI
dotnet run
```

Backend runs at: `http://localhost:5000`  
Swagger UI: `http://localhost:5000/swagger`

### 4. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## Default Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| User | `user` | `user123` |

---

## Environment Variables

### Backend
| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key for embeddings and chat |
| `ASPNETCORE_ENVIRONMENT` | `Development` or `Production` |

### Frontend
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (default: `http://localhost:5000`) |

---

## Project Structure

```
.
├── backend/
│   └── DocumentIntelligenceAPI/
│       ├── Controllers/       # API endpoints
│       ├── Data/              # EF Core DbContext + seeder
│       ├── DTOs/              # Request/response models
│       ├── Models/            # EF Core entities
│       ├── Services/          # Business logic
│       ├── uploads/           # Uploaded documents (gitignored)
│       ├── Program.cs         # App configuration
│       └── appsettings.json
├── frontend/
│   └── src/
│       ├── components/        # Shared UI components
│       ├── contexts/          # React context (Auth)
│       ├── layouts/           # AdminLayout, UserLayout
│       ├── pages/             # Route pages
│       ├── services/          # API client (Axios)
│       ├── types/             # TypeScript interfaces
│       ├── theme.ts           # MUI theme
│       └── App.tsx            # Router + route guards
├── README.md
├── azure-deploy.md
└── .gitignore
```

---

## RAG Pipeline

```
Document Upload
     ↓
Text Extraction (PdfPig / OpenXML / CsvHelper)
     ↓
Section-aware Chunking
     ↓
Embedding Generation (text-embedding-3-small)
     ↓
Storage in SQLite
     ↓
User Question
     ↓
Hybrid Search (keyword + cosine similarity)
     ↓
Top 3 Chunks Retrieved
     ↓
GPT-4o-mini with context-only prompt
     ↓
Answer + Citations returned
```

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/documents/upload` | Upload document |
| GET | `/api/documents` | List all documents |
| GET | `/api/documents/{id}` | Get document details |
| GET | `/api/documents/{id}/chunks` | Get extracted chunks |
| DELETE | `/api/documents/{id}` | Delete document |
| POST | `/api/ai/ask` | Ask a question (RAG) |
| POST | `/api/ai/compare` | Compare documents |
| GET | `/api/history/questions` | Question history |
| GET | `/api/analytics/summary` | Analytics summary |

---

## Security Notes

- Passwords are hashed with BCrypt
- File validation: extension, content type, magic bytes
- Safe filenames (GUIDs) to prevent path traversal
- No JWT in this version — uses localStorage session
- Code is structured for JWT to be added later (controllers have `[Authorize]` ready)
- API keys loaded from environment variables only — never hardcoded

---

## License

MIT
