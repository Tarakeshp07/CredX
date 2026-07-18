# Smart Job Matching Dashboard — Research Report & Scope Analysis

> **Companion to:** [`Smart_Job_Matching_Dashboard_Technical_Analysis.md`](./Smart_Job_Matching_Dashboard_Technical_Analysis.md)
> **Context:** CredX Hiring Hackathon 2.0 — Problem Statement 1
> **Target:** Buildable MVP within **4 hours** on the existing `asset_management` stack (NestJS 11 + Prisma + PostgreSQL/pgvector + Next.js 16).
> **Date:** 2026-07-18

---

## 1. Executive Summary

The Smart Job Matching Dashboard is a **student-facing job/internship discovery tool** whose defining feature is a per-listing **Match Score (0–100)** computed from the student's profile against each posting's requirements. It is, at its core, a **filtered relational search + weighted scoring** problem, not a heavy ML problem — the launch version needs no trained model, only a deterministic rule-based scorer.

The single most important architectural insight for a 4-hour build: **the hard constraints (visa/work-auth, location, remote mode) belong in the SQL `WHERE` clause; the soft factors (skill overlap, GPA, experience) belong in the scoring function.** Getting that split right is 80% of the value and avoids the O(students × jobs) performance trap.

The existing `asset_management` codebase is a strong foundation — its NestJS module pattern, Prisma/Postgres store, code-driven RBAC, JWT auth, and (uniquely) a **pgvector** database image + `@xenova/transformers` embedding library already cover most of the plumbing, including the "later-phase" semantic-similarity infra.

---

## 2. Domain Research — How Job-Matching Systems Actually Work

**The two-stage retrieval-and-rank pattern** (used by LinkedIn, Indeed, Handshake, and most ATS products):

1. **Retrieval / hard filtering** — Cheaply reduce millions of postings to a candidate set using indexed, non-negotiable predicates: is the job active? Does the location/remote mode fit? Is visa sponsorship available if the student needs it? This is a database query, not a computation.
2. **Ranking / soft scoring** — Score the (much smaller) candidate set on continuous fit signals and sort. This is where the "Match Score" is produced.

**Why rule-based first (cold-start):** A brand-new platform has *zero* historical outcome data (who applied, who got hired). Supervised ML re-rankers need those labels, so they are impossible at launch. A transparent weighted formula is both the *only* viable option at MVP **and** the more explainable one — students can be shown *why* they scored 82%.

**The Match Score formula (recommended MVP):**

```
hardPass = visaCompatible AND locationCompatible AND status == 'active'
if not hardPass -> excluded (not scored)

score = 100 * (
    0.60 * skillOverlapRatio       // Jaccard: |matched skills| / |required skills|
  + 0.25 * gpaSatisfaction          // 1 if gpa >= threshold, else scaled
  + 0.15 * experienceFit            // level match, 0..1
)
```

Weights are tunable; skill overlap dominating (~60%) matches how real systems and students both reason about fit.

**The dominant hard problem across all such systems: skill taxonomy normalization.** "JS", "JavaScript", "ReactJS", "React.js" must resolve to canonical skills or overlap scoring silently fails. A **synonym map on a canonical `Skill` table** solves 90% of this cheaply; embeddings (cosine similarity) catch the long tail later.

---

## 3. Functionality Scope — INCLUSIVE (defined in the source md)

These are explicitly in the technical analysis and must be represented in the build.

### 3.1 Data fields (inclusive)

| Entity | Fields (from md §5) | Notes |
|---|---|---|
| **Student** | id, name, email, gpa, work_auth_status, created_at | `work_auth_status` is an enum + a hard filter |
| **Resume** | id, student_id, file_ref, parsed_at, raw_text | 1–1 with student |
| **Skill** | id, name (canonical), synonyms | taxonomy backbone |
| **StudentSkill** (join) | student_id, skill_id, proficiency? | M–N |
| **JobPosting** | id, title, description, role_type, location, remote_flag, visa_sponsorship, status, created_at | status drives active filtering |
| **JobRequiredSkill** (join) | job_id, skill_id, weight? | M–N |
| **MatchScore** (cache) | student_id, job_id, score, computed_at | unique (student_id, job_id) |

### 3.2 Functionalities (inclusive)

| # | Functionality | Source | MVP priority |
|---|---|---|---|
| F1 | Signup / login with JWT | §3.1, §6 | **Must** |
| F2 | Student profile CRUD (skills, GPA, work-auth) | §3.2 | **Must** |
| F3 | Resume upload + parsing → structured fields | §3.3 | Should (parsing can be stubbed) |
| F4 | Job posting CRUD (recruiter/admin) | §3.4 | **Must** (needed to populate pool) |
| F5 | Rule-based match scoring (0–100) | §3.5, §7 | **Must** |
| F6 | Filters: role, location, remote/onsite, visa | §3.6 | **Must** |
| F7 | Ranked dashboard with score indicators | §3.7 | **Must** |
| F8 | Skill taxonomy normalization | §3.2, §12 | Should (synonym map) |
| F9 | Match-score caching + invalidation | §9 | Could |
| F10 | Semantic similarity (embeddings) | §7 | Could (pgvector ready) |
| F11 | Explainability breakdown ("why 82%") | §7, §14 | Could (high demo value) |
| F12 | Notifications for high-match jobs | §10, §14 | Won't (out of 4h) |

### 3.3 Non-functional requirements (inclusive)

- JWT auth + role separation (student vs recruiter/admin) — §8
- Server-side DTO validation, file type/size checks — §8, §11
- Hard-constraint pre-filtering at query level (perf) — §9
- Composite/unique indexes per §5
- Edge-case handling: empty results, incomplete profile, duplicate email, expired jobs — §11

---

## 4. Functionality Scope — EXCLUSIVE (not in the md, worth considering)

Things the source document does **not** specify but that research says add real value. Split into "quick wins for the demo" vs "beyond scope."

### 4.1 Quick wins — add if time permits (extra fields/functions)

| Idea | New field(s) / function | Why it matters | Effort |
|---|---|---|---|
| **Application tracking** | `Application(student_id, job_id, status, applied_at)` | md lists it as "optional/future"; an "Apply" button makes the demo feel complete | Low |
| **Saved / bookmarked jobs** | `SavedJob(student_id, job_id)` | Standard job-board UX; trivial join table | Low |
| **Match-score band label** | derived: Strong / Good / Fair (≥80/≥60/<60) | Colour-coded badges read better than bare numbers on a dashboard | Trivial |
| **Missing-skills hint** | computed `missingSkills[]` in match response | "You match 4/6 skills; add Docker, AWS" — actionable + demo-friendly | Low |
| **Experience level on both sides** | `Student.experienceYears`, `JobPosting.minExperience` | md mentions "experience level fit" but never gives it a field | Low |
| **Job type (full-time/internship)** | `JobPosting.employmentType` enum | PS explicitly says "job/internship"; deserves its own filter | Trivial |
| **Posting deadline / expiry date** | `JobPosting.expiresAt` | md only has a `status` flag; a date enables auto-expiry | Trivial |
| **Sort controls** | sort by score / recency / relevance | dashboards need more than one sort | Trivial |
| **Empty & incomplete states** | UI-only | md §11 asks for them; cheap polish that judges notice | Low |

### 4.2 Beyond scope — acknowledge, don't build in 4h

| Idea | Why excluded from a 4-hour build |
|---|---|
| Learned re-ranker (ML model) | Cold-start: no interaction data exists; md itself defers this to "later maturity" |
| Real resume parsing (Affinda/NLP) | High-variance, slow to get right; stub with manual entry + raw-text store |
| Geocoding / "near me" distance filter | Needs external API; exact-string location match is enough for MVP |
| OAuth (Google) login | Nice friction reducer, but JWT email/password is faster to demo |
| Email/push notifications | Requires mail infra + scheduling; no demo payoff in 4h |
| Async scoring queue / horizontal scaling | Premature at hackathon scale; synchronous scoring on a filtered set is fine |
| Recruiter analytics dashboard | Not in PS; the student experience is the graded surface |
| Read replicas / caching layer | Perf hardening irrelevant at demo data volumes |

### 4.3 Recommended DELTA to the source schema

Adopt the md schema **plus** these small additions (all low-risk, high-demo-value):

```
+ Student.experienceYears        Int?
+ JobPosting.employmentType      enum(FULL_TIME, INTERNSHIP, PART_TIME)
+ JobPosting.minExperience       Int      @default(0)
+ JobPosting.expiresAt           DateTime?
+ Application(id, studentId, jobId, status, appliedAt)  @@unique([studentId, jobId])
+ SavedJob(studentId, jobId)                             @@id([studentId, jobId])
```

---

## 5. Mapping onto the Existing Codebase (reuse table)

| Need | Reuse from `asset_management` | New work |
|---|---|---|
| Auth + JWT | `auth/` module, `jwt.strategy.ts`, guards | Adjust roles |
| RBAC (student/recruiter/admin) | `common/rbac/role-permissions.ts` matrix | Redefine 3 roles |
| Response envelope | `TransformInterceptor` | — |
| Validation | Global `ValidationPipe` + DTO pattern | Write new DTOs |
| DB store | Prisma + Postgres 16 | New models + M–N joins |
| File storage (resume) | MinIO / Supabase deps already present | Wire upload endpoint |
| Embeddings (semantic layer) | **pgvector image + `@xenova/transformers`** | `vector` column + cosine query |
| Module pattern | `departments/`, `asset-categories/` as templates | `students`, `jobs`, `matches`, `skills` modules |

**Net-new domain logic:** M–N skill join tables, the `MatchScore` cache, the scoring service, and the resume-parse stub. Everything else is adaptation of existing patterns.

---

## 6. 4-Hour Build Plan

| Slot | Duration | Deliverable |
|---|---|---|
| **0:00–0:30** | 30m | Prisma schema (Student/Skill/StudentSkill/JobPosting/JobRequiredSkill/MatchScore + deltas). Migrate. Seed ~20 jobs + a skill taxonomy with synonyms. |
| **0:30–1:15** | 45m | Auth reuse + RBAC roles (STUDENT/RECRUITER/ADMIN). Student profile CRUD (F2) with DTO validation. |
| **1:15–1:45** | 30m | Job posting CRUD + seed (F4). Skill normalization via synonym map (F8). |
| **1:45–2:45** | 60m | **Matching engine** (F5): hard filter in Prisma `where` + weighted skill/GPA/experience scorer → `MatchScore` upsert. `/matches` + `/matches/{jobId}/score` endpoints. Include `missingSkills` + band label (quick wins). |
| **2:45–3:30** | 45m | Dashboard UI (F7): ranked feed, score badges (colour bands), filter controls (F6) wired to query params. |
| **3:30–3:50** | 20m | Edge cases (F: empty state, incomplete profile flag, duplicate email), Apply button (Application). |
| **3:50–4:00** | 10m | Seed demo data, smoke test the golden path, Swagger check. |

**Cut order if behind:** drop embeddings (F10) → notifications already out → real resume parse becomes manual entry (F3 stub) → caching invalidation simplified to always-upsert.

**Golden demo path:** login → fill profile with 5 skills + GPA + work-auth → open dashboard → see jobs ranked by match score with badges → apply a filter (remote + visa) → list re-ranks → open a job → see score breakdown + missing skills.

---

## 7. Risk & Mitigation (4h lens)

| Risk | Mitigation |
|---|---|
| Resume parsing eats the whole budget | Stub it: store file + let student confirm/enter skills manually; keep `raw_text` field for later |
| Skill matching returns 0% everywhere | Ship the synonym map + seed jobs using the *same* canonical skills as the profile form's picker |
| Scoring feels random to judges | Surface the breakdown (F11) — explainability turns a black box into a feature |
| Time lost to auth/boilerplate | Reuse `asset_management` auth module wholesale; don't rebuild |
| Over-engineering the AI | Rule-based scorer only; embeddings are a stretch goal, not the plan |

---

## 8. Conclusion

The problem is **90% disciplined CRUD + one well-designed scoring function**, and the source md's own roadmap agrees (Phase 1 = rule-based). Within 4 hours the achievable, demo-complete target is: **F1, F2, F4, F5, F6, F7 fully working, with F8 (synonym normalization) and the quick-win extras (Apply, score bands, missing-skills hint) as the polish that makes it stand out.** Resume parsing, embeddings, notifications, and any learned model are correctly deferred. Building on the existing `asset_management` stack removes most of the auth/DB/validation boilerplate, leaving the 4 hours free for the matching logic and dashboard — the parts that are actually graded.
