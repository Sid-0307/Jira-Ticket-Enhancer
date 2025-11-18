# Ticket Clarifier - Backend (FastAPI)

Run:

```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Optional: set GEMINI KEY in backend/.env or environment to enable real LLM calls.

Endpoints:

- POST /api/analyze (body: {title, description, acceptance_criteria})
- POST /api/create (body: {title, description, acceptance_criteria, refined})
- GET /api/tickets
