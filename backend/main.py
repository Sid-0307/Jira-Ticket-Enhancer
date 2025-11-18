from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from dotenv import load_dotenv
import google.generativeai as genai
import os, json, uuid, datetime, re

load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
USE_GEMINI = bool(GEMINI_API_KEY)

app = FastAPI(title="Ticket Clarifier - FastAPI Backend (Modern v2 Stack)")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File storage
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
TICKETS_FILE = os.path.join(DATA_DIR, "tickets.json")


def load_tickets():
    if not os.path.exists(TICKETS_FILE):
        with open(TICKETS_FILE, "w") as f:
            json.dump([], f)
    with open(TICKETS_FILE) as f:
        return json.load(f)


def save_tickets(data):
    with open(TICKETS_FILE, "w") as f:
        json.dump(data, f, indent=2)


# ----- MODELS -----
class AnalyzeRequest(BaseModel):
    title: str
    description: str
    acceptance_criteria: str = ""


class CreateRequest(BaseModel):
    title: str
    description: str
    acceptance_criteria: str
    refined: dict


# ----- MOCK LLM FALLBACK -----
def mock_llm_analyze(title, description, acceptance):
    text = f"{title}\n{description}\n{acceptance}".lower()

    questions = []
    missing = []
    score = 10.0

    if "expected" not in text:
        questions.append("What is the expected behavior?")
        missing.append("expected_behavior")
        score -= 2

    if any(w in text for w in ["error", "fail", "crash", "500"]):
        if "steps" not in text:
            questions.append("Steps to reproduce?")
            missing.append("steps")
            score -= 1.5

        if "log" not in text:
            questions.append("Do you have logs or screenshots?")
            missing.append("logs")
            score -= 1

    refined = {
        "summary": title,
        "description": description,
        "acceptance_criteria": acceptance,
        "developer_interpretation": description[:200],
        "missing": missing
    }

    return {"questions": questions, "score": round(score, 1), "refined": refined}


# ----- GEMINI ANALYSIS -----
def gemini_analyze(title, description, acceptance):
    prompt = f"""
You are an expert software engineer. Analyze the following JIRA ticket.

Return ONLY valid JSON:

{{
  "questions": [],
  "score": 0,
  "refined": {{
      "summary": "",
      "description": "",
      "acceptance_criteria": "",
      "developer_interpretation": "",
      "missing": []
  }}
}}

Title: {title}
Description: {description}
Acceptance criteria: {acceptance}
"""

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        resp = model.generate_content(prompt)
        raw = resp.text.strip()

        # Extract JSON block
        start = raw.find("{")
        end = raw.rfind("}") + 1
        json_str = raw[start:end]

        return json.loads(json_str)

    except Exception as e:
        print("Gemini error:", e)
        return mock_llm_analyze(title, description, acceptance)


# ----- ROUTES -----
@app.post("/api/analyze")
def analyze(req: AnalyzeRequest):
    if USE_GEMINI:
        return gemini_analyze(req.title, req.description, req.acceptance_criteria)
    return mock_llm_analyze(req.title, req.description, req.acceptance_criteria)


@app.post("/api/create")
def create(req: CreateRequest):
    tickets = load_tickets()

    new_ticket = {
        "id": "CLARIFY-" + str(uuid.uuid4())[:8],
        "title": req.title,
        "description": req.description,
        "acceptance_criteria": req.acceptance_criteria,
        "refined": req.refined,
        "created_at": datetime.datetime.utcnow().isoformat(),
        "jira_url": f"https://mock-jira.local/browse/{uuid.uuid4().hex[:6].upper()}"
    }

    tickets.append(new_ticket)
    save_tickets(tickets)

    return {"ok": True, "ticket": new_ticket}


@app.get("/api/tickets")
def list_tickets():
    return load_tickets()
