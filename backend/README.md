# dataclue Backend

Python API backend for the dataclue statistical analysis platform.

## Tech Stack

- **FastAPI** — REST API framework
- **NumPy / Pandas / SciPy / statsmodels** — statistical computations
- **Pydantic** — request/response validation
- **MongoDB (PyMongo)** — blog storage
- **Uvicorn** — ASGI server

## Project Structure

```
backend/
├── app/
│   ├── api/v1/endpoints/   # API route handlers
│   ├── core/               # Config, exceptions
│   ├── schemas/            # Pydantic models
│   ├── services/           # Business logic & stats engines
│   └── utils/              # Helpers (CSV parsing, etc.)
├── tests/                  # Pytest test suite
├── requirements.txt
├── pyproject.toml
└── run.py                  # Dev server entry point
```

## Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
```

### MongoDB (required for blogs)

Install and start MongoDB locally, or set `MONGODB_URI` in `.env` to your Atlas connection string.

```bash
# Example local URI (default)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=dataclue
```

On first startup, the API seeds 6 sample blog posts if the collection is empty.

## Run

```bash
python run.py
```

API docs: http://localhost:8000/docs

Health check: http://localhost:8000/api/v1/health

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check |
| `/api/v1/tests` | GET | List all 40 statistical tests |
| `/api/v1/analyze` | POST | Run any test (`test_id` + `csv_data`) |
| `/api/v1/blogs` | GET | List published blogs |
| `/api/v1/blogs/{slug}` | GET | Get published blog by slug |
| `/api/v1/admin/login` | POST | Admin login (JWT) |
| `/api/v1/admin/blogs` | GET/POST | List/create blogs (auth) |
| `/api/v1/admin/blogs/{id}` | GET/PUT/DELETE | Read/update/delete blog (auth) |
| `/api/v1/survey/analyze` | POST | Survey analysis (`csv_data` + `options`) |

### Analyze example

```json
POST /api/v1/analyze
{
  "test_id": "independent-ttest",
  "csv_data": "Score,Group\n78,A\n85,A\n58,B\n64,B",
  "options": {}
}
```

## Tests

```bash
pytest
```
