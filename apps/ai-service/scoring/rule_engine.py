"""
Rule-based Match Scoring Engine
================================
Mirrors the Spring Boot ScoringService logic exactly, ensuring consistent
scores whether scoring runs in Java or Python. This is the fully-functional
implementation that the backend delegates to.

Scoring formula:
  HARD constraints → gate eligibility (visa/work-auth). Fail → excluded.
  SOFT factors     → weighted 0..1 signals combined into final score.

  score = 100 * (
      0.60 * skillOverlapRatio
    + 0.20 * gpaSatisfaction
    + 0.15 * experienceFit
    + 0.05 * remoteFit
  )
"""

from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from main import StudentProfile, JobRequirements, ScoreBreakdown


class RuleEngine:
    """Deterministic, explainable rule-based scorer."""

    W_SKILL = 0.60
    W_GPA = 0.20
    W_EXP = 0.15
    W_REMOTE = 0.05

    # ── helpers ───────────────────────────────────────────────

    @staticmethod
    def _needs_sponsorship(status: str) -> bool:
        return status in ("NEEDS_SPONSORSHIP", "STUDENT_VISA")

    @staticmethod
    def _band(score: int) -> str:
        if score >= 80:
            return "Strong"
        if score >= 60:
            return "Good"
        if score >= 40:
            return "Fair"
        return "Low"

    @staticmethod
    def _round2(v: float) -> float:
        return round(v, 2)

    # ── main scoring method ───────────────────────────────────

    def score(self, student, job) -> "ScoreBreakdown":
        # Avoid circular import at runtime
        from main import ScoreBreakdown

        student_skills = {s.strip().lower() for s in student.skills if s.strip()}
        required = [s.strip() for s in job.required_skills if s.strip()]
        required_lower = {s.lower() for s in required}

        # ── HARD: visa / work authorization ──
        if self._needs_sponsorship(student.work_auth_status) and not job.visa_sponsorship:
            return ScoreBreakdown(
                hard_pass=False,
                hard_reason="Requires visa sponsorship, which this role does not offer",
                score=0,
                band="Low",
                factors={"skillOverlap": 0.0, "gpa": 0.0, "experience": 0.0, "remoteFit": 0.0},
                matched_skills=[],
                missing_skills=required,
            )

        # ── SOFT: skill overlap ──
        matched: list[str] = []
        missing: list[str] = []
        for r in required:
            if r.lower() in student_skills:
                matched.append(r)
            else:
                missing.append(r)

        skill_overlap = len(matched) / len(required) if required else 0.5

        # ── SOFT: GPA threshold satisfaction ──
        if job.min_gpa is None:
            gpa = 1.0
        elif student.gpa is None:
            gpa = 0.5
        elif student.gpa >= job.min_gpa:
            gpa = 1.0
        else:
            gpa = max(0.0, 1.0 - (job.min_gpa - student.gpa) / 2.0)

        # ── SOFT: experience fit ──
        if student.experience_years is None:
            experience = 0.6
        elif student.experience_years >= job.min_experience:
            experience = 1.0
        else:
            experience = max(0.0, 1.0 - (job.min_experience - student.experience_years) / 3.0)

        # ── SOFT: remote / location fit ──
        mode = job.remote_mode
        if mode == "REMOTE":
            remote_fit = 1.0 if student.open_to_remote else 0.7
        elif mode == "HYBRID":
            remote_fit = 0.85
        else:
            loc = (student.preferred_location or "").strip().lower()
            job_loc = (job.location or "").strip().lower()
            remote_fit = 1.0 if (loc and job_loc and loc in job_loc) else 0.6

        # ── combine ──
        raw = (
            self.W_SKILL * skill_overlap
            + self.W_GPA * gpa
            + self.W_EXP * experience
            + self.W_REMOTE * remote_fit
        )
        final_score = round(raw * 100)

        factors = {
            "skillOverlap": self._round2(skill_overlap),
            "gpa": self._round2(gpa),
            "experience": self._round2(experience),
            "remoteFit": self._round2(remote_fit),
        }

        return ScoreBreakdown(
            hard_pass=True,
            hard_reason=None,
            score=final_score,
            band=self._band(final_score),
            factors=factors,
            matched_skills=matched,
            missing_skills=missing,
        )
