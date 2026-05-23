from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import google.generativeai as genai
import os, uuid, json

load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
USE_GEMINI = bool(GEMINI_API_KEY)

app = FastAPI(title="Ticket Clarifier")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

    return {
        "questions": questions,
        "score": round(score, 1),
        "refined": {
            "summary": title,
            "description": description,
            "acceptance_criteria": acceptance,
            "developer_interpretation": description[:200],
            "missing": missing
        }
    }


# ----- GEMINI ANALYSIS -----
def gemini_analyze(title, description, acceptance):
    prompt = f"""You are an expert software engineer reviewing a JIRA ticket from a Product Owner. Your goal is to identify critical missing information that would block or slow down development.

**Ticket Details:**
Title: {title}
Description: {description}
Acceptance Criteria: {acceptance}

**Instructions:**
1. Analyze if the ticket provides enough context for a developer to implement it without back-and-forth.
2. Ask ONLY the most critical clarifying questions (maximum 5, but fewer is fine).
3. Focus on questions that would genuinely block development or lead to wrong implementation.
4. If the ticket is already clear and actionable, return an empty questions array.
5. Score the ticket from 0-10 based on clarity and completeness (10 = perfect, no questions needed).
6. Provide a developer-friendly rewrite that fills in reasonable assumptions where appropriate.

**Return ONLY valid JSON in this exact format:**
{{
  "questions": ["Question 1?", "Question 2?"],
  "score": 8,
  "refined": {{
    "summary": "Clear, concise one-line summary",
    "description": "Detailed technical description with context, current behavior, expected behavior",
    "acceptance_criteria": "Specific, testable criteria",
    "developer_interpretation": "How a developer would understand and approach this task",
    "missing": ["Critical missing item 1", "Critical missing item 2"]
  }}
}}

**Scoring Guidelines:**
- 9-10: Excellent, no questions or 1 minor clarification
- 7-8: Good, 1-2 important questions
- 5-6: Adequate, 3-4 critical questions
- 3-4: Poor, 5+ questions or major ambiguity
- 0-2: Very poor, cannot be implemented without major rework

Now analyze the ticket above."""

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        resp = model.generate_content(prompt)
        raw = resp.text.strip()

        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()

        start = raw.find("{")
        end = raw.rfind("}") + 1

        if start == -1 or end == 0:
            raise ValueError("No JSON found in response")

        result = json.loads(raw[start:end])

        if "questions" in result and len(result["questions"]) > 5:
            result["questions"] = result["questions"][:5]

        return result

    except Exception as e:
        print("Gemini error:", e)
        return {
            "questions": ["Unable to analyze ticket - please try again"],
            "score": 0,
            "refined": {
                "summary": title or "Untitled",
                "description": description or "No description provided",
                "acceptance_criteria": acceptance or "No acceptance criteria provided",
                "developer_interpretation": "Analysis failed - manual review required",
                "missing": ["AI analysis unavailable"]
            }
        }


# ----- ROUTES -----
@app.post("/api/analyze")
def analyze(req: AnalyzeRequest):
    if USE_GEMINI:
        return gemini_analyze(req.title, req.description, req.acceptance_criteria)
    return mock_llm_analyze(req.title, req.description, req.acceptance_criteria)


@app.post("/api/create")
def create(req: CreateRequest):
    return {
        "ok": True,
        "ticket": {
            "id": "CLARIFY-" + str(uuid.uuid4())[:8],
            "title": req.title,
            "description": req.description,
            "acceptance_criteria": req.acceptance_criteria,
            "refined": req.refined,
            "jira_url": f"https://mock-jira.local/browse/{uuid.uuid4().hex[:6].upper()}"
        }
    }
