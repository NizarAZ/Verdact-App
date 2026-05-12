[README_Verdact.md](https://github.com/user-attachments/files/27652558/README_Verdact.md)
# Verdact

> **AI answers with evidence attached.**  
> Verifiable AI document intelligence powered by Shelby Protocol.

Verdact transforms raw documents into searchable, verifiable AI knowledge using decentralized hot storage and cryptographic proof infrastructure.

Built for teams, researchers, analysts, and AI-native workflows that require **persistent retrieval, fast querying, and proof-backed outputs**.

---

## Why Verdact?

Most AI tools generate answers.

Verdact generates answers **you can verify**.

Traditional AI workflows suffer from:

- Lost context between sessions
- Hallucinated outputs without evidence
- Centralized storage risk
- Slow retrieval pipelines
- No cryptographic proof of source integrity

Verdact solves this by combining:

- ⚡ Real-time decentralized storage
- 🧠 Retrieval-Augmented Generation (RAG)
- 🔐 Verifiable receipts
- 📂 AI-powered document indexing
- 🌐 Persistent AI memory infrastructure

---

# Core Concept

Upload documents → index content → query with AI → retrieve grounded answers with decentralized verification.

```txt
User
  │
  ▼
Verdact UI (Next.js)
  │
  ▼
API Layer
  │
  ├── Shelby Protocol
  │      ├── Blob Storage
  │      ├── Retrieval
  │      └── Verification Receipts
  │
  └── AI Processing
         ├── Chunking
         ├── Embeddings
         └── Context Retrieval
```

---

# Features

### 📄 Intelligent Document Upload
Upload:

- PDF
- TXT
- Markdown
- JSON
- CSV

Documents are parsed, chunked, indexed, and stored on Shelby Protocol.

---

### 🔎 AI Retrieval
Query uploaded knowledge naturally:

```txt
"What are the payment conditions in this contract?"
"Summarize this research paper."
"Find contradictions between these documents."
```

---

### ⚡ Decentralized Hot Storage
Powered by Shelby Protocol for:

- Fast retrieval
- Persistent storage
- Distributed availability
- AI-native infrastructure

Unlike cold archival systems, Verdact is optimized for active AI workloads.

---

### 🔐 Verifiable Evidence
Every interaction can be tied back to stored document data through Shelby verification primitives.

Designed for:

- Research
- Legal workflows
- AI agent memory
- Internal knowledge systems
- Proof-based AI pipelines

---

### 🧠 Persistent AI Context
Verdact enables long-term contextual memory for AI systems instead of disposable chat sessions.

---

# Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TailwindCSS |
| Backend | Next.js API Routes |
| Storage | Shelby Protocol SDK |
| Database | Supabase |
| Auth | Clerk |
| AI Pipeline | Gemini |
| Deployment | Vercel |
| Language | TypeScript |

---

# Architecture

```txt
Frontend (Next.js)
        │
        ▼
API Routes
        │
        ├── Shelby SDK
        │      ├── Upload blobs
        │      ├── Retrieve chunks
        │      └── Verification layer
        │
        ├── AI Processing
        │      ├── Parsing
        │      ├── Chunking
        │      └── Retrieval
        │
        └── Supabase
               └── Metadata & indexing
```

---

# Getting Started

## Clone

```bash
git clone https://github.com/NizarAZ/Verdact-App.git

cd Verdact-App
```

---

## Install

```bash
npm install
```

---

## Environment Variables

Create:

```txt
.env.local
```

Add:

```env
# Shelby
SHELBY_API_KEY=your_key

# Supabase
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_key

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/app
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/app

# AI
GEMINI_API_KEY=your_key
```

---

## Run Locally

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

# Project Structure

```txt
Verdact-App/
│
├── app/
│   ├── api/
│   │   ├── upload/
│   │   ├── query/
│   │   ├── verify/
│   │   └── documents/
│   │
│   ├── app/
│   └── sign-in/
│
├── components/
│
├── lib/
│   ├── shelby/
│   ├── ai/
│   ├── supabase/
│   └── document-processing/
│
├── public/
│
├── scripts/
│
└── middleware.ts
```

---

# Current Capabilities

- Document upload
- Shelby decentralized storage integration
- AI document retrieval
- User authentication
- Verification workflows
- Multi-document handling
- Production deployment on Vercel

---

# Roadmap

- Vector semantic search
- Multi-agent memory systems
- Collaborative workspaces
- Encrypted private knowledge vaults
- Source-linked AI citations
- AI workflow automation
- Team-level retrieval systems
- Real-time document syncing

---

# Vision

Verdact is building infrastructure for:

> AI systems that remember, retrieve, verify, and reason over persistent decentralized knowledge.

Not just another chatbot.  
A verifiable AI knowledge layer.

---

# Live Demo

https://verdact.vercel.app/

---

# License

MIT

---

Built on Shelby Protocol ⚡
