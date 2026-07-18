"""
CredX Smart Job Matching — AI Scoring Microservice
===================================================
A fully-functional scoring engine that the Spring Boot backend delegates to.

Endpoints:
  GET  /health           → Health check
  POST /score            → Score a single student–job pair
  POST /score/batch      → Score a student against multiple jobs
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import uvicorn

from scoring.rule_engine import RuleEngine

app = FastAPI(
    title="CredX AI Scoring Service",
    version="1.0.0",
    description="Rule-based match scoring engine for student–job matching",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = RuleEngine()


# ────────────────────────── Request / Response Models ──────────────────────────

class StudentProfile(BaseModel):
    skills: list[str] = Field(default_factory=list)
    gpa: Optional[float] = None
    work_auth_status: str = "UNKNOWN"  # CITIZEN | PERMANENT_RESIDENT | NEEDS_SPONSORSHIP | STUDENT_VISA | UNKNOWN
    experience_years: Optional[int] = None
    preferred_location: str = ""
    open_to_remote: bool = True


class JobRequirements(BaseModel):
    job_id: int
    title: str = ""
    required_skills: list[str] = Field(default_factory=list)
    min_gpa: Optional[float] = None
    min_experience: int = 0
    location: str = ""
    remote_mode: str = "ONSITE"  # ONSITE | REMOTE | HYBRID
    visa_sponsorship: bool = False


class ScoreRequest(BaseModel):
    student: StudentProfile
    job: JobRequirements


class BatchScoreRequest(BaseModel):
    student: StudentProfile
    jobs: list[JobRequirements]


class ScoreBreakdown(BaseModel):
    hard_pass: bool
    hard_reason: Optional[str] = None
    score: int
    band: str
    factors: dict[str, float]
    matched_skills: list[str]
    missing_skills: list[str]


class ScoreResponse(BaseModel):
    job_id: int
    breakdown: ScoreBreakdown


class BatchScoreResponse(BaseModel):
    count: int
    results: list[ScoreResponse]


# ────────────────────────── Endpoints ──────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "credx-ai-scoring", "version": "1.0.0"}


@app.post("/score", response_model=ScoreResponse)
def score_single(req: ScoreRequest):
    """Score a single student–job pair."""
    breakdown = engine.score(req.student, req.job)
    return ScoreResponse(job_id=req.job.job_id, breakdown=breakdown)


@app.post("/score/batch", response_model=BatchScoreResponse)
def score_batch(req: BatchScoreRequest):
    """Score a student against multiple jobs. Returns results sorted by score descending."""
    results: list[ScoreResponse] = []
    for job in req.jobs:
        breakdown = engine.score(req.student, job)
        results.append(ScoreResponse(job_id=job.job_id, breakdown=breakdown))

    # Sort by score descending, hard-pass items first
    results.sort(key=lambda r: (r.breakdown.hard_pass, r.breakdown.score), reverse=True)
    return BatchScoreResponse(count=len(results), results=results)


# ────────────────────────── Run ──────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
