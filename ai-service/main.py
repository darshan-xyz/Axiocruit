"""
Axiocruit AI Microservice — CV Parsing & NLP Matching
=====================================================
FastAPI server that extracts text from PDF resumes, computes semantic
similarity with a job description using SentenceTransformers, and
extracts keyword overlap using spaCy.

Models are loaded GLOBALLY at startup for sub-30s response times.
PDF files are processed strictly in-memory (no disk writes).
"""

import io
import json
import logging
import os
import re
import string
import time
from contextlib import asynccontextmanager
from typing import List

import httpx
import pdfplumber
import spacy
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-service")

# ---------------------------------------------------------------------------
# Model Handles (loaded in async lifespan)
# ---------------------------------------------------------------------------
embedding_model: SentenceTransformer | None = None
nlp = None
http_client: httpx.AsyncClient | None = None

# Common NER labels that are never useful keywords
STOP_LABELS = {"DATE", "TIME", "PERCENT", "MONEY", "QUANTITY", "ORDINAL", "CARDINAL"}

# POS tags allowed when harvesting noun-chunks / tokens
ALLOWED_POS = {"PROPN", "NOUN"}

# Conversational / filler phrases that should never be keywords
NOISE_PHRASES = {
    "the ideal candidate", "this role", "ideal candidate", "the role",
    "cross-functional teams", "team player", "strong communication",
    "years of experience", "year of experience", "a plus",
    "fast-paced environment", "self-starter", "detail-oriented",
    "problem solver", "strong work ethic", "ability to",
    "responsible for", "looking for", "we are looking",
    "you will", "you", "we", "they", "our", "your",
}

# Generic JD nouns that spaCy tags as NOUN but carry zero technical signal
JD_STOPWORDS = {
    "candidate", "role", "team", "teams", "responsibilities", "responsibility",
    "experience", "hands", "key", "design", "development", "operations",
    "engineering", "monitor", "practices", "practice", "delivery",
    "reliability", "cost", "efficiency", "collaborate", "build",
    "system", "systems", "technologies", "technology", "environment",
    "environments", "solutions", "solution", "tools", "tool",
    "knowledge", "understanding", "skills", "skill", "ability",
    "proficiency", "work", "working", "position", "opportunity",
    "requirements", "requirement", "qualifications", "qualification",
    "company", "organization", "organisation", "client", "clients",
    "project", "projects", "service", "services", "support",
    "performance", "management", "process", "processes",
    "implementation", "integration", "deployment", "application",
    "applications", "infrastructure", "architecture", "platform",
    "stakeholders", "communication", "collaboration", "documentation",
    "standards", "standard", "strategy", "strategies",
    "level", "degree", "bachelor", "master", "certification",
    "minimum", "preferred", "required", "plus", "bonus",
    "job", "description", "title", "summary", "overview",
}

# Curated list of tech / professional keywords to boost extraction
TECH_KEYWORDS = {
    "python", "java", "javascript", "typescript", "react", "angular", "vue",
    "node", "nodejs", "node.js", "express", "django", "flask", "fastapi", "spring",
    "sql", "nosql", "mongodb", "postgresql", "mysql", "redis", "elasticsearch",
    "docker", "kubernetes", "k8s", "aws", "azure", "gcp", "git", "ci/cd", "cicd",
    "html", "css", "sass", "tailwind", "bootstrap", "figma",
    "graphql", "rest", "api", "microservices", "serverless",
    "tensorflow", "pytorch", "pandas", "numpy", "scikit-learn",
    "machine learning", "deep learning", "nlp", "computer vision",
    "agile", "scrum", "jira", "confluence",
    "linux", "bash", "shell", "powershell",
    "c++", "c#", "go", "rust", "swift", "kotlin", "php", "ruby",
    "firebase", "supabase", "prisma", "sequelize", "mongoose",
    "webpack", "vite", "next.js", "nextjs", "nuxt", "gatsby",
    "testing", "jest", "mocha", "cypress", "selenium",
    "devops", "terraform", "ansible", "jenkins", "github actions",
    "oauth", "jwt", "sso", "saml", "openid",
    "rabbitmq", "kafka", "celery", "airflow",
    "nginx", "apache", "load balancer",
    "s3", "ec2", "lambda", "ecs", "eks",
    "data engineering", "data science", "data analysis",
    "tableau", "power bi", "looker",
}

# ---------------------------------------------------------------------------
# FastAPI App & Async Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global embedding_model, nlp, http_client
    logger.info("Initializing models and HTTP client in lifespan...")
    try:
        embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("SentenceTransformer model loaded.")
    except Exception as e:
        logger.warning("SentenceTransformer could not be loaded: %s", e)

    try:
        nlp = spacy.load("en_core_web_sm")
        logger.info("spaCy model loaded.")
    except Exception as e:
        logger.warning("spaCy model could not be loaded: %s", e)

    http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(connect=10.0, read=60.0, write=10.0, pool=10.0)
    )
    yield
    if http_client:
        await http_client.aclose()
    logger.info("AI service shut down.")


app = FastAPI(title="Axiocruit AI Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Response Schema
# ---------------------------------------------------------------------------
class ParseCVResponse(BaseModel):
    suitability_score: float = 0.0
    matched_keywords: List[str] = []
    missing_keywords: List[str] = []
    parsed_text: str = ""
    skills: List[str] = []
    experience_years: float = 0.0
    domain: str = ""
    candidate_name: str = ""
    ai_summary: str = ""


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF using pdfplumber — strictly in-memory with MAX_PAGES ceiling."""
    MAX_PAGES = 30
    text_parts: list[str] = []
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for i, page in enumerate(pdf.pages):
                if i >= MAX_PAGES:
                    logger.info("Reached MAX_PAGES ceiling (%d) - stopping extraction", MAX_PAGES)
                    break
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
    except Exception as exc:
        logger.error("PDF extraction failed: %s", exc)
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted PDF file: {exc}")

    full_text = "\n".join(text_parts).strip()
    if not full_text:
        raise HTTPException(status_code=400, detail="Could not extract any text from the PDF. The file may be image-based or empty.")
    return full_text


def _normalise(token_text: str) -> str:
    """Lowercase and strip leading/trailing punctuation from a token."""
    return token_text.lower().strip(string.punctuation + " \t\n")


def _is_noise(phrase: str) -> bool:
    """Return True if phrase is a known filler / conversational noise."""
    return phrase in NOISE_PHRASES


def extract_keywords(text: str) -> set[str]:
    """
    Extract meaningful **technical / professional** keywords from text.

    Strategy
    --------
    1. spaCy noun-chunks — keep only PROPN/NOUN tokens, enforce max 2 words,
       and filter against JD_STOPWORDS + spaCy stop words.
    2. spaCy named entities — skip date/number labels, noise, and fluff.
    3. Individual PROPN / NOUN tokens (unigrams).
    4. Curated TECH_KEYWORDS substring lookup.

    All results are lowercased and punctuation-stripped before returning.
    """
    doc = nlp(text)
    keywords: set[str] = set()
    stop_words = nlp.Defaults.stop_words | JD_STOPWORDS

    # ── 1. Noun chunks (max 2 words, root must be NOUN/PROPN) ──────────
    for chunk in doc.noun_chunks:
        useful_tokens = [
            _normalise(tok.text)
            for tok in chunk
            if tok.pos_ in ALLOWED_POS
            and _normalise(tok.text) not in stop_words
            and len(_normalise(tok.text)) > 1
        ]
        if not useful_tokens:
            continue
        # Enforce max 2 words
        if len(useful_tokens) > 2:
            continue
        phrase = " ".join(useful_tokens)
        if _is_noise(phrase) or phrase.isnumeric():
            continue
        keywords.add(phrase)

    # ── 2. Named entities (skip numeric / date labels, noise) ─────────
    for ent in doc.ents:
        if ent.label_ in STOP_LABELS:
            continue
        normalised = _normalise(ent.text)
        if len(normalised) <= 1 or normalised in stop_words or _is_noise(normalised):
            continue
        if len(normalised.split()) > 2:
            continue
        keywords.add(normalised)

    # ── 3. Individual PROPN / NOUN tokens ─────────────────────────────
    for tok in doc:
        if tok.pos_ not in ALLOWED_POS:
            continue
        norm = _normalise(tok.text)
        if len(norm) > 1 and norm not in stop_words and not norm.isnumeric():
            keywords.add(norm)

    # ── 4. Curated tech keyword matching ──────────────────────────────
    text_lower = text.lower()
    for kw in TECH_KEYWORDS:
        if kw in text_lower:
            keywords.add(kw)

    # Final pass — remove noise phrases and JD stopwords
    keywords = {
        k for k in keywords
        if not _is_noise(k) and k not in JD_STOPWORDS
    }

    return keywords


def compute_semantic_score(cv_text: str, jd_text: str) -> float:
    """Compute cosine similarity between CV and JD embeddings (0-100)."""
    embeddings = embedding_model.encode([cv_text, jd_text])
    score = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    return max(0.0, min(float(score) * 100, 100.0))


def _remove_subset_phrases(
    matched: set[str], missing: set[str],
) -> set[str]:
    """
    Remove n-gram phrases from *missing* when every individual word in
    the phrase already appears inside *matched*.  This prevents double-
    penalisation (e.g. "aws cloudformation" missing even though "aws"
    and "cloudformation" are both matched individually).
    """
    # Build a flat set of all individual words present in matched keywords
    matched_words = set()
    for kw in matched:
        matched_words.update(kw.split())

    cleaned_missing: set[str] = set()
    for phrase in missing:
        words = phrase.split()
        if len(words) > 1 and all(w in matched_words for w in words):
            # All sub-words already matched — not truly missing
            continue
        cleaned_missing.add(phrase)
    return cleaned_missing


def compute_keyword_score(
    jd_keywords: set[str],
    matched_count: int,
) -> float:
    """
    Compute keyword overlap percentage (0-100) with an aggressive curve.

    If the candidate matches > 15 technical keywords the raw ratio is
    boosted so strong CVs are not anchored down by a large JD denominator.
    """
    if not jd_keywords:
        return 100.0

    raw_ratio = matched_count / len(jd_keywords)
    raw_score = raw_ratio * 100

    # Aggressive curve: reward high absolute match counts
    if matched_count >= 20:
        # Essentially a perfect keyword match at 20+ matches
        curved_score = max(raw_score, 95.0)
    elif matched_count >= 15:
        # Strong match — boost toward 90-95 range
        boost = (matched_count - 15) / 5  # 0.0 → 1.0
        curved_score = raw_score + (95.0 - raw_score) * boost * 0.7
    elif matched_count >= 10:
        # Good match — mild boost
        boost = (matched_count - 10) / 5  # 0.0 → 1.0
        curved_score = raw_score + (90.0 - raw_score) * boost * 0.3
    else:
        curved_score = raw_score

    return min(curved_score, 100.0)


def extract_candidate_metadata(cv_text: str, cv_keywords: set[str]) -> tuple[str, float, str, str]:
    """Extract candidate name, experience years, domain, and summary from CV text."""
    lines = [line.strip() for line in cv_text.splitlines() if line.strip()]
    candidate_name = ""
    for line in lines[:5]:
        if "@" in line or "http" in line or any(c.isdigit() for c in line):
            continue
        cleaned = re.sub(r'[^a-zA-Z\s]', '', line).strip()
        words = cleaned.split()
        if 1 <= len(words) <= 4 and len(cleaned) < 50:
            candidate_name = cleaned.title()
            break
    if not candidate_name and lines:
        candidate_name = lines[0][:40].strip()

    experience_years = 0.0
    exp_matches = re.findall(r'(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)?', cv_text, re.IGNORECASE)
    if exp_matches:
        try:
            candidates_exp = [float(m) for m in exp_matches if float(m) <= 40]
            if candidates_exp:
                experience_years = max(candidates_exp)
        except Exception:
            experience_years = 0.0

    skills_list = sorted(list(cv_keywords))
    domain = "Software Engineering"
    cv_lower = cv_text.lower()
    if any(k in cv_lower for k in ["ui/ux", "figma", "designer", "design system"]):
        domain = "Product Design"
    elif any(k in cv_lower for k in ["data science", "machine learning", "deep learning", "pandas", "pytorch"]):
        domain = "Data Science & AI"
    elif any(k in cv_lower for k in ["devops", "kubernetes", "docker", "terraform", "aws", "cloud"]):
        domain = "DevOps & Cloud"
    elif any(k in cv_lower for k in ["product manager", "scrum", "agile", "roadmaps"]):
        domain = "Product Management"

    name_display = candidate_name or "Candidate"
    skills_preview = ", ".join(skills_list[:5]) if skills_list else "core technical skills"
    ai_summary = f"{name_display} demonstrates domain expertise in {domain} with proficiency in {skills_preview}."

    return candidate_name, experience_years, domain, ai_summary


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------
@app.post("/api/ai/parse-cv", response_model=ParseCVResponse)
async def parse_cv(
    file: UploadFile = File(...),
    job_description: str = Form(default=""),
):
    """
    Parse a candidate's CV (PDF) and score it against a job description.

    - Extracts text from the uploaded PDF (in-memory only)
    - Computes semantic similarity via SentenceTransformers
    - Extracts and compares keywords via spaCy
    - Returns a combined suitability score (0-100) and structured candidate metadata
    """
    MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB limit

    try:
        # Validate file type
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

        # Read file into memory (enforce 15MB limit)
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 15MB.")

        logger.info("Processing CV: %s (%d bytes)", file.filename, len(file_bytes))

        # 1. Extract text from PDF
        cv_text = extract_text_from_pdf(file_bytes)
        logger.info("Extracted %d characters from CV.", len(cv_text))

        # 2. Extract CV keywords & candidate profile metadata
        cv_keywords = extract_keywords(cv_text)
        candidate_name, experience_years, domain, ai_summary = extract_candidate_metadata(cv_text, cv_keywords)

        clean_jd = (job_description or "").strip()
        if not clean_jd:
            logger.info("Empty job description provided — returning extracted CV metadata without scoring.")
            return ParseCVResponse(
                suitability_score=0.0,
                matched_keywords=[],
                missing_keywords=[],
                parsed_text=cv_text,
                skills=sorted(list(cv_keywords)),
                experience_years=experience_years,
                domain=domain,
                candidate_name=candidate_name,
                ai_summary=ai_summary,
            )

        # 3. Semantic similarity
        semantic_score = compute_semantic_score(cv_text, clean_jd)
        logger.info("Semantic score: %.2f", semantic_score)

        # 4. Keyword extraction & matching
        jd_keywords = extract_keywords(clean_jd)
        matched = cv_keywords & jd_keywords
        missing = jd_keywords - cv_keywords

        # 4b. Subset-matching — remove n-gram phrases whose individual
        #     words are already present in matched_keywords
        missing = _remove_subset_phrases(matched, missing)
        # Re-derive matched count after subset cleaning
        effective_matched = len(jd_keywords) - len(missing)

        keyword_score = compute_keyword_score(jd_keywords, effective_matched)
        logger.info(
            "Keyword score: %.2f  (matched=%d, missing=%d, jd_total=%d)",
            keyword_score, effective_matched, len(missing), len(jd_keywords),
        )

        # 5. Combined score — dynamically adjust weights
        #    Default: 60% semantic + 40% keyword
        #    If the JD yields fewer than 5 filterable keywords the keyword
        #    score becomes unreliable, so we shift weight toward semantic.
        if len(jd_keywords) < 5:
            semantic_weight = 0.85
            keyword_weight = 0.15
            logger.info(
                "JD keyword count (%d) < 5 — using semantic-heavy weights (%.0f/%.0f)",
                len(jd_keywords), semantic_weight * 100, keyword_weight * 100,
            )
        else:
            semantic_weight = 0.60
            keyword_weight = 0.40

        suitability_score = round(
            (semantic_score * semantic_weight) + (keyword_score * keyword_weight), 1,
        )

        return ParseCVResponse(
            suitability_score=suitability_score,
            matched_keywords=sorted(matched),
            missing_keywords=sorted(missing),
            parsed_text=cv_text,
            skills=sorted(list(cv_keywords)),
            experience_years=experience_years,
            domain=domain,
            candidate_name=candidate_name,
            ai_summary=ai_summary,
        )
    finally:
        await file.close()


# ---------------------------------------------------------------------------
# Interview Evaluation — Request / Response Schemas
# ---------------------------------------------------------------------------
class ProctoringEvent(BaseModel):
    type: str
    detail: str
    timestamp: str = ""


class InterviewEvalRequest(BaseModel):
    interviewId: str
    candidateCode: str = ""
    codingScore: int = 0
    codingTestConducted: bool = True
    proctorEvents: List[ProctoringEvent] = []
    interviewerNotes: str = ""


class InterviewEvalResponse(BaseModel):
    suitabilityScore: int
    strengths: List[str]
    weaknesses: List[str]
    redFlags: List[str]


# ---------------------------------------------------------------------------
# Ollama Configuration
# ---------------------------------------------------------------------------
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "phi3")  # Default: phi3 (3.8B, fast)

# Cache for the resolved model name (to avoid querying /api/tags on every request)
_resolved_model: str | None = None


async def _resolve_ollama_model() -> str:
    """
    Resolve the best available Ollama model.

    Priority:
      1. OLLAMA_MODEL env var (if explicitly set by operator)
      2. Auto-detected first model from GET /api/tags
      3. Fall back to OLLAMA_MODEL default if /api/tags is unreachable
    """
    global _resolved_model
    if _resolved_model is not None:
        return _resolved_model

    try:
        import httpx
        client = http_client if http_client and not http_client.is_closed else httpx.AsyncClient(timeout=5.0)
        try:
            resp = await client.get(f"{OLLAMA_URL}/api/tags")
            resp.raise_for_status()
            data = resp.json()
            models = data.get("models", [])
            if models:
                # Prefer the env-configured model if it's actually installed
                installed_names = [m["name"] for m in models]
                logger.info("[AI-Eval] 🗂️  Installed Ollama models: %s", installed_names)
                for m in models:
                    if m["name"].startswith(OLLAMA_MODEL.split(":")[0]):
                        _resolved_model = m["name"]
                        logger.info("[AI-Eval] ✅ Using configured model: %s", _resolved_model)
                        return _resolved_model
                # Configured model not found — use whatever is installed
                _resolved_model = models[0]["name"]
                logger.warning(
                    "[AI-Eval] ⚠️  Model '%s' not installed. Using first available: %s",
                    OLLAMA_MODEL, _resolved_model
                )
                return _resolved_model
        finally:
            if client is not http_client:
                await client.aclose()
    except Exception as e:
        logger.warning("[AI-Eval] ⚠️  Could not query Ollama model list: %s", e)

    # Final fallback
    _resolved_model = OLLAMA_MODEL
    return _resolved_model


def _build_red_flags(proctor_events: List[ProctoringEvent]) -> list[str]:
    """Generate red flags from proctoring events (used by both Ollama and fallback)."""
    red_flags: list[str] = []
    event_counts: dict[str, int] = {}
    for evt in proctor_events:
        event_counts[evt.type] = event_counts.get(evt.type, 0) + 1

    if event_counts.get("tab_switch", 0) > 0:
        count = event_counts["tab_switch"]
        red_flags.append(
            f"Candidate switched browser tabs {count} time(s) during the interview — "
            f"potential use of external resources."
        )
    if event_counts.get("copy", 0) > 0 or event_counts.get("paste", 0) > 0:
        c = event_counts.get("copy", 0)
        p = event_counts.get("paste", 0)
        red_flags.append(
            f"Clipboard activity detected: {c} copy and {p} paste event(s) — "
            f"may indicate code was sourced externally."
        )
    if event_counts.get("face_lost", 0) > 0:
        count = event_counts["face_lost"]
        red_flags.append(
            f"Candidate's face was not detected {count} time(s) — "
            f"possible presence of unauthorized assistance."
        )
    if event_counts.get("gaze", 0) > 0:
        count = event_counts["gaze"]
        red_flags.append(
            f"Suspicious gaze deviation detected {count} time(s) — "
            f"candidate may have been reading from another screen."
        )
    if event_counts.get("screenshot", 0) > 0:
        count = event_counts["screenshot"]
        red_flags.append(
            f"Screenshot attempt detected {count} time(s) — "
            f"candidate may have tried to capture interview content."
        )
    return red_flags


def _generate_fallback(payload: InterviewEvalRequest, red_flags: list[str]) -> InterviewEvalResponse:
    """Fallback mock evaluation when Ollama is unavailable."""
    strengths = [
        "Demonstrated strong problem-solving approach with clear logical thinking",
        "Code structure was clean and well-organized with meaningful variable names",
        "Good understanding of core data structures and their trade-offs",
        "Communicated thought process effectively while coding",
    ]
    weaknesses = [
        "Could improve time complexity analysis — did not discuss Big-O",
        "Limited error handling and input validation in submitted code",
        "Did not consider edge cases (empty inputs, negative values)",
        "Would benefit from writing unit tests alongside solutions",
    ]

    base_score = 72
    if payload.codingTestConducted:
        coding_influence = (payload.codingScore - 50) * 0.3
        base_score = int(base_score + coding_influence)
    else:
        weaknesses = [w for w in weaknesses if "time complexity" not in w.lower()]
        strengths.append("Interview was conducted as a behavioral/conversational assessment")

    flag_penalty = len(red_flags) * 5
    final_score = max(0, min(100, base_score - flag_penalty))

    return InterviewEvalResponse(
        suitabilityScore=final_score,
        strengths=strengths,
        weaknesses=weaknesses,
        redFlags=red_flags,
    )


# ---------------------------------------------------------------------------
# Interview Evaluation Endpoint (Ollama LLM with Mock Fallback)
# ---------------------------------------------------------------------------
@app.post("/api/ai/evaluate-interview", response_model=InterviewEvalResponse)
async def evaluate_interview(payload: InterviewEvalRequest):
    """
    AI-Powered Post-Interview Evaluation.

    Sends interview data to a local Ollama LLM for analysis.
    Falls back to a dynamic mock response if Ollama is unreachable.
    """
    logger.info("=" * 60)
    logger.info("[AI-Eval] 📥 Received evaluation request")
    logger.info("[AI-Eval]   Interview ID   : %s", payload.interviewId)
    logger.info("[AI-Eval]   Code length    : %d chars", len(payload.candidateCode))
    logger.info("[AI-Eval]   Coding score   : %d", payload.codingScore)
    logger.info("[AI-Eval]   Coding test run: %s", payload.codingTestConducted)
    logger.info("[AI-Eval]   Proctor events : %d", len(payload.proctorEvents))
    logger.info("[AI-Eval]   Notes length   : %d chars", len(payload.interviewerNotes))

    # ── Always compute red flags from proctoring events ──────────────────
    red_flags = _build_red_flags(payload.proctorEvents)
    logger.info("[AI-Eval]   Generated %d red flag(s) from proctoring", len(red_flags))

    # ── Try Ollama LLM ───────────────────────────────────────────────────
    try:
        import httpx

        start_time = time.time()
        active_model = await _resolve_ollama_model()
        logger.info("[AI-Eval] 🤖 Attempting Ollama LLM at %s (model: %s)", OLLAMA_URL, active_model)

        # Build the prompt
        proctor_summary = ""
        if payload.proctorEvents:
            event_counts: dict[str, int] = {}
            for evt in payload.proctorEvents:
                event_counts[evt.type] = event_counts.get(evt.type, 0) + 1
            proctor_summary = ", ".join(f"{k}: {v}" for k, v in event_counts.items())
        else:
            proctor_summary = "No proctoring events recorded."

        code_section = ""
        if payload.codingTestConducted and payload.candidateCode:
            # Limit code to first 2000 chars to avoid token overflow
            trimmed_code = payload.candidateCode[:2000]
            code_section = f"\nCandidate's Code (score: {payload.codingScore}%):\n```\n{trimmed_code}\n```"
        elif not payload.codingTestConducted:
            code_section = "\nNo coding test was conducted — this was a behavioral interview only."

        prompt = f"""You are an expert technical interviewer evaluating a candidate after a live interview.

Analyze the following data and respond with ONLY a valid JSON object (no markdown, no explanation, no code fences).

INTERVIEW DATA:
- Coding Test Conducted: {payload.codingTestConducted}
- Automated Coding Score: {payload.codingScore}%
- Proctoring Events: {proctor_summary}
- Interviewer's Notes: {payload.interviewerNotes or 'No notes provided'}
{code_section}

Respond with this exact JSON structure:
{{
  "suitabilityScore": <integer 0-100>,
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"]
}}

Rules:
- suitabilityScore must be 0-100 reflecting overall candidate suitability
- Provide exactly 3-5 strengths and 3-5 weaknesses
- Base your analysis on the code quality, proctoring behavior, and interviewer notes
- If no coding test, focus on behavioral assessment from the notes
- Respond with ONLY the JSON object, nothing else"""

        logger.info("[AI-Eval]   Prompt length: %d chars", len(prompt))

        client = http_client if http_client and not http_client.is_closed else httpx.AsyncClient(
            timeout=httpx.Timeout(connect=15.0, read=60.0, write=15.0, pool=15.0)
        )
        try:
            ollama_response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": active_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
                        "num_predict": 1024,
                    },
                },
                timeout=60.0,
            )
            ollama_response.raise_for_status()
        finally:
            if client is not http_client:
                await client.aclose()

        elapsed = time.time() - start_time
        logger.info("[AI-Eval]   ⏱️ Ollama responded in %.2f seconds", elapsed)

        result_data = ollama_response.json()
        raw_text = result_data.get("response", "")
        logger.info("[AI-Eval]   Raw LLM output length: %d chars", len(raw_text))
        logger.info("[AI-Eval]   Raw LLM output: %s", raw_text[:500])

        # Parse JSON from LLM response — try to extract even if wrapped in markdown
        json_match = re.search(r'\{[\s\S]*\}', raw_text)
        if not json_match:
            raise ValueError("No JSON object found in LLM response")

        parsed = json.loads(json_match.group())

        # Validate and clamp
        score = max(0, min(100, int(parsed.get("suitabilityScore", 50))))
        strengths = parsed.get("strengths", ["Analysis completed"])
        weaknesses = parsed.get("weaknesses", ["No specific weaknesses identified"])

        # Ensure they're lists of strings
        if not isinstance(strengths, list):
            strengths = [str(strengths)]
        if not isinstance(weaknesses, list):
            weaknesses = [str(weaknesses)]

        logger.info("[AI-Eval] ✅ Ollama evaluation parsed successfully")
        logger.info("[AI-Eval]   Suitability: %d | Strengths: %d | Weaknesses: %d",
                    score, len(strengths), len(weaknesses))
        logger.info("[AI-Eval]   Generation time: %.2fs", elapsed)
        logger.info("=" * 60)

        # Merge LLM analysis with proctoring red flags
        return InterviewEvalResponse(
            suitabilityScore=score,
            strengths=strengths,
            weaknesses=weaknesses,
            redFlags=red_flags,  # Always from proctoring, not LLM
        )

    except Exception as e:
        import traceback
        logger.warning("[AI-Eval] ⚠️ Ollama call failed: [%s] %s", type(e).__name__, repr(e))
        logger.warning("[AI-Eval]   Traceback: %s", traceback.format_exc())
        logger.info("[AI-Eval]   Falling back to dynamic mock evaluation")

        fallback = _generate_fallback(payload, red_flags)

        logger.info("[AI-Eval] 📤 Fallback suitability score: %d", fallback.suitabilityScore)
        logger.info("=" * 60)

        return fallback


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    models_ready = embedding_model is not None and nlp is not None
    return {
        "status": "ok" if models_ready else "degraded",
        "service": "ai-service",
        "models_loaded": models_ready,
    }


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8002)), reload=True)
