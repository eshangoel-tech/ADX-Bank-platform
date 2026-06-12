# ADX Bank Platform — Project Instructions

## What This Is
ADX Bank is a full-stack digital banking platform with a 3-layer multi-agent AI assistant.
This is a MONOREPO containing both the frontend and backend. It was consolidated from two
separate repositories (adx-bank frontend + banking-platform backend).

## Architecture
```
adx-bank-platform/
├── frontend/                  ← Next.js 14 + TypeScript + Tailwind CSS
│   ├── src/app/              ← App Router pages (dashboard, transfer, loans, assistant, etc.)
│   ├── src/components/       ← Navbar, ProtectedRoute, Providers
│   ├── src/context/          ← AuthContext (JWT + sessionId)
│   └── src/services/api.ts   ← Axios instance with JWT interceptor
│
├── backend/                   ← Python 3.12 + FastAPI + SQLAlchemy + Celery
│   ├── app/ai_agents/        ← 3-layer multi-agent AI pipeline
│   │   ├── assistant/        ← Layer 1: Router — splits queries, assigns to specialists
│   │   ├── bank_manager/     ← Layer 2: Domain agent — account & financial advice
│   │   ├── loan_officer/     ← Layer 2: Domain agent — loan mechanics
│   │   ├── accountant/       ← Layer 2: Domain agent — transaction analysis
│   │   ├── support_staff/    ← Layer 2: Domain agent — RAG-powered policy Q&A
│   │   └── receptionist/     ← Layer 3: Combines all agent responses into final reply
│   ├── app/services/ai/      ← LLM utils (fallback chain), RAG, context fetching
│   ├── app/services/core/    ← Auth, transfer, loan, wallet, user services
│   ├── app/repository/       ← SQLAlchemy models + repository pattern
│   ├── app/api/              ← FastAPI route handlers
│   ├── app/config/           ← AI config, bank policies/rules JSON, Celery, Redis, DB
│   └── app/tasks/            ← Celery background tasks
│
├── docker-compose.yml         ← Unified: API + Celery + Postgres + Redis
├── .github/workflows/         ← CI/CD
├── docs/                      ← Architecture docs, screenshots
└── README.md                  ← Hero README with demo, screenshots, architecture diagram
```

## AI Pipeline (3-Layer Multi-Agent)
1. **Router** (assistant agent) — analyses user message, breaks into sub-queries, assigns each to a specialist agent with minimum required context
2. **Domain Agents** (run concurrently via asyncio.gather) — bank_manager, loan_officer, accountant, support_staff. Each gets its sub-query + pre-fetched context (DB data, RAG chunks)
3. **Receptionist** — combines all domain agent responses into one coherent reply, deduplicates redirect actions

## LLM Fallback Chain
`call_llm()` in `backend/app/services/ai/llm_utils.py` tries providers in priority order (default: Groq → OpenAI → Claude). If one fails, it automatically falls back to the next. All calls logged with latency, tokens, provider used.

## RAG System
- ChromaDB with ONNX MiniLM-L6-v2 embeddings (lightweight, no PyTorch)
- Two collections: `bank_rules` (numeric limits, fees) and `bank_policies` (process docs, FAQs)
- Initialized at server startup from JSON files in `backend/app/config/bank_policies/` and `bank_rules/`

## Key Technical Decisions
- **ONNX embeddings instead of sentence-transformers** — drops Docker image from ~3GB to ~500MB
- **Monorepo** — single star count, single README, unified CI/CD
- **Repository pattern** — clean separation of data access from business logic
- **Redis-cached session context** — user_context + chat_history loaded once at session start, updated per-turn
- **JWT auth with OTP** — every sensitive action (transfer, wallet, loan) requires OTP verification

## UI Design System
- Dark theme: `bg-[#050914]` base, slate-900 cards, blue-600 primary accent
- Tailwind CSS with custom component classes in `globals.css` (.card, .input, .btn-primary, etc.)
- Dashboard-first navigation — navbar has only logo + logout, all features via dashboard card grid
- Mobile responsive — all pages must work on mobile viewports

## Environment Variables (backend .env)
```
DATABASE_URL=postgresql+asyncpg://adx:password@postgres:5432/banking
REDIS_URL=redis://redis:6379/0
SECRET_KEY=<jwt-secret>
GROQ_API_KEY=<key>
OPENAI_API_KEY=<key>
ANTHROPIC_API_KEY=<key>
AI_PROVIDER_PRIORITY=groq,openai,claude
SMTP_HOST=<email-host>
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASSWORD=<password>
```

## Environment Variables (frontend .env.local)
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## Running Locally
```bash
# Everything via Docker:
docker-compose up --build

# Or separately:
# Terminal 1: Backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
# Terminal 2: Celery
cd backend && celery -A app.config.celery.celery_app worker --loglevel=info
# Terminal 3: Frontend
cd frontend && npm install && npm run dev
```

## Code Style
- Python: use type hints, async/await for all DB operations, docstrings on public functions
- TypeScript: strict mode, functional components with hooks, no `any` types
- Both: descriptive variable names, no abbreviations in public APIs
