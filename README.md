# dataclue

Statistical analysis platform — run professional tests in your browser.

## Structure

- `frontend/` — Next.js app
- `backend/` — FastAPI API (MongoDB for blogs)

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python run.py
```

API: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

App: http://localhost:3000
