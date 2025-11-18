# Ticket Clarifier v1 - Hackathon-ready prototype

What you get:

- backend/ : FastAPI backend with optional OpenAI integration (use GEMINI_API_KEY)
- frontend/: React + TypeScript UI with real-time LLM-assisted ticket writing
- Real-time debounced analysis, question detection & removal, clarity score, rewrite preview, and create ticket.

Run backend:

```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

(Optional) enable OpenAI:

- set OPENAI_API_KEY in backend/.env or environment

Run frontend:

```
cd frontend
npm install
npm start
```

The frontend sends requests to http://localhost:8000
