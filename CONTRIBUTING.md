# Contributing to ADX Bank

## Development Setup

**Prerequisites:** Python 3.12, Node 18, Docker, Git

```bash
git clone https://github.com/eshangoel-tech/adx-bank-platform.git
cd adx-bank-platform
cp .env.example .env   # fill in your keys
```

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload  # http://localhost:8000/docs
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev            # http://localhost:3000
```

**Full stack via Docker:**
```bash
docker-compose up --build
```

## Code Style

**Python** — `ruff check app/` must pass with zero errors. Key rules:
- Type hints on all function signatures
- `async`/`await` for every database operation
- Docstrings on public functions (one-line summary is enough)
- No bare `except:` — always catch specific exception types

**TypeScript** — `npm run lint` must pass. Key rules:
- Strict mode — no `any` types
- Functional components with hooks only
- All new CSS values use the design token CSS variables (e.g. `var(--accent)`)

## Running Tests

```bash
cd backend
pytest tests/ -v
```

All tests mock external dependencies (database, LLMs, vector store). Tests
should pass without Docker, PostgreSQL, or any API keys.

## Pull Request Process

1. Create a branch from `main`: `git checkout -b feat/your-feature`
2. Make focused changes — one concern per PR
3. Run `ruff check app/` and `pytest tests/ -v` locally before pushing
4. Run `npm run lint && npm run build` for frontend changes
5. Open a PR against `main` with a clear description of what and why
6. CI must pass before merge

## Project Conventions

- **No sentence-transformers** — embeddings use `chromadb.utils.embedding_functions.ONNXMiniLM_L6_V2` only
- **No new frontend dependencies** without discussion — bundle size matters
- **No direct LLM calls** — always use `call_llm()` from `app/services/ai/llm_utils.py`
- **Repository pattern** — database access goes through `app/repository/`, not direct queries in routes
- **Gold color** (`var(--gold)`) is reserved for balance amounts and transfer success only
