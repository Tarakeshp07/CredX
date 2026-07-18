# Smart Job Matching Dashboard — Technical Implementation Analysis

**Problem Statement (Problem Statement 1 of CredX Hiring Hackathon 2.0):**
Students create a profile (skills, resume, GPA, work authorization status). The system matches them to relevant job/internship postings, with filters for role, location, remote/onsite, and visa sponsorship needed. Each listing displays a "Match Score" indicator.

---

## 1. Core Technical Requirements

- A profile-creation flow that captures structured (GPA, work-authorization status) and unstructured (resume, skills) student data.
- A resume ingestion pipeline that extracts structured signal (skills, education, experience) from an uploaded file.
- A job/internship posting store that recruiters or admins populate (title, role, location, work mode, sponsorship availability, required skills).
- A matching engine that scores each student–job pair and produces a normalized "Match Score."
- A filtering/search layer (role, location, remote/onsite, visa sponsorship) that narrows the candidate posting set before or alongside scoring.
- A dashboard that renders ranked, filterable postings with the match score visualized per listing.

**Major modules/components:**

| Module | Responsibility |
|---|---|
| Auth & Session Module | Signup/login, session/token issuance |
| Student Profile Module | CRUD for profile fields, GPA, work-auth status |
| Resume Upload & Parsing Module | File storage, text extraction, structured field extraction |
| Job Posting Module | CRUD for postings (recruiter/admin side) |
| Matching Engine Module | Computes Match Score per student–job pair |
| Filter & Search Module | Query construction, result narrowing |
| Dashboard Module | Aggregates matches + filters into a rendered feed |

---

## 2. System Architecture

**Pattern:** Layered service architecture — client SPA, a core REST API, a relational store, and a decoupled scoring component that can evolve from rule-based to ML-based without touching the core API contract.

| Layer | Responsibility |
|---|---|
| Frontend | Profile forms, resume upload UI, filter controls, match-score visualization, ranked listing feed |
| Backend (API) | AuthN/AuthZ, profile & job CRUD, orchestrating matching requests, filter query building, pagination |
| Database | Persistent storage for students, jobs, skills, applications, cached match scores |
| Matching/AI Service | Feature extraction, scoring logic, ranking output (can run in-process initially, extracted to its own service under load) |
| External Services | Resume parsing, file storage, notifications, optional geocoding |

Data generally flows: Client → API Gateway/Backend → (Database read for filter-eligible jobs) → Matching Service (scores candidates) → Backend (assembles response) → Client renders dashboard.

---

## 3. Functional Modules

### 3.1 Auth & Session Module
- **Purpose:** Identify and authenticate students securely.
- **Inputs:** Credentials or OAuth token.
- **Processing:** Credential verification, token issuance, session/refresh handling.
- **Outputs:** JWT access + refresh token.
- **Dependencies:** User store, token signing service.

### 3.2 Student Profile Module
- **Purpose:** Maintain the canonical student record used for matching.
- **Inputs:** Name, skills list, GPA, work-authorization status, contact info.
- **Processing:** Validation (GPA range, enum checks on work-auth status), normalization of free-text skills against a skill taxonomy.
- **Outputs:** Persisted, versioned profile record.
- **Dependencies:** Auth module, Skill taxonomy service.

### 3.3 Resume Upload & Parsing Module
- **Purpose:** Convert an unstructured resume file into structured matching signal.
- **Inputs:** PDF/DOC/DOCX file.
- **Processing:** File validation → text extraction → entity extraction (skills, education, experience, GPA if present) → mapping to taxonomy → merge/reconcile with manually entered profile fields.
- **Outputs:** Structured resume-derived attributes stored against the profile; raw file reference.
- **Dependencies:** File storage, parsing library/service, Skill taxonomy service.

### 3.4 Job Posting Module
- **Purpose:** Maintain the postings students are matched against.
- **Inputs:** Title, description, required skills, role type, location, remote/onsite flag, visa sponsorship flag, status (active/expired).
- **Processing:** Validation, taxonomy normalization of required skills, status lifecycle management.
- **Outputs:** Persisted posting record available to the matching engine.
- **Dependencies:** Skill taxonomy service, (recruiter/admin identity, out of scope here but implied).

### 3.5 Matching Engine Module
- **Purpose:** Compute a Match Score for a student against a candidate set of postings.
- **Inputs:** Student profile vector (skills, GPA, work-auth), job requirement vector.
- **Processing:** Pre-filter by hard constraints (visa/work-auth compatibility, location/remote mode) → compute weighted similarity across remaining soft attributes (skill overlap, GPA threshold, experience level) → normalize to a 0–100 score.
- **Outputs:** Ranked (job_id, score) pairs per student.
- **Dependencies:** Student Profile Module, Job Posting Module, Skill taxonomy service.

### 3.6 Filter & Search Module
- **Purpose:** Let students narrow results by role, location, remote/onsite, visa sponsorship.
- **Inputs:** Filter selections from the dashboard.
- **Processing:** Translate filters into indexed query predicates; apply before or after scoring depending on cost.
- **Outputs:** Filtered, paginated posting set.
- **Dependencies:** Job Posting Module, Matching Engine Module.

### 3.7 Dashboard Module
- **Purpose:** Present ranked, filtered postings with visual match-score indicators.
- **Inputs:** Matching Engine output + active filters.
- **Processing:** Pagination/sorting by score, indicator rendering (e.g., gauge/badge per listing).
- **Outputs:** Rendered listing feed.
- **Dependencies:** All prior modules via the backend API.

---

## 4. Data Flow

1. **User input:** Student completes profile fields and/or uploads a resume; separately, applies filters on the dashboard.
2. **Data processing:** Resume file is parsed into structured attributes; profile is validated and normalized against the skill taxonomy; filters are translated into query predicates.
3. **API communication:** Frontend calls the backend's job-matching endpoint with the student's ID and active filter parameters.
4. **Database interaction:** Backend fetches the student profile and a filtered candidate set of active job postings (hard constraints applied at the query level for efficiency).
5. **AI/matching processing:** The candidate set is scored against the profile; scores are normalized and ranked; results may be cached keyed by (student_id, filter_hash).
6. **Final response:** Backend returns a ranked, paginated list of postings with match scores; frontend renders the dashboard feed with score indicators.

---

## 5. Database Design

**Entities:** Student, Resume, JobPosting, Skill, StudentSkill (join), JobRequiredSkill (join), MatchScore (cache), Application (optional, for future tracking).

**Relationships:**
- Student 1—1 Resume (a student has one active resume; historical versions optional).
- Student M—N Skill (via StudentSkill).
- JobPosting M—N Skill (via JobRequiredSkill).
- Student 1—N MatchScore, JobPosting 1—N MatchScore (each row a student–job score).
- Student 1—N Application (optional, if applying is tracked).

**Key tables/fields:**

| Table | Important Fields |
|---|---|
| Student | id, name, email, gpa, work_auth_status, created_at |
| Resume | id, student_id (FK), file_ref, parsed_at, raw_text |
| Skill | id, name (canonical), synonyms |
| StudentSkill | student_id (FK), skill_id (FK), proficiency (optional) |
| JobPosting | id, title, description, role_type, location, remote_flag, visa_sponsorship, status, created_at |
| JobRequiredSkill | job_id (FK), skill_id (FK), weight (optional) |
| MatchScore | student_id (FK), job_id (FK), score, computed_at |

**Indexing considerations:**
- Composite index on `JobPosting(status, role_type, location, remote_flag, visa_sponsorship)` to support hard-constraint filtering before scoring.
- Index on `StudentSkill(student_id)` and `JobRequiredSkill(job_id)` for fast skill-overlap lookups.
- Unique composite index on `MatchScore(student_id, job_id)` to support upsert-on-recompute and avoid duplicate cached rows.
- Index on `Skill(name)` for taxonomy lookups during normalization.

---

## 6. API Requirements

| Endpoint | Purpose | Method | Input | Output |
|---|---|---|---|---|
| /auth/login | Authenticate student | POST | credentials | access + refresh token |
| /profile | Create/update student profile | POST/PUT | skills, gpa, work_auth_status | saved profile object |
| /profile/resume | Upload resume file | POST | multipart file | parsed attributes + file reference |
| /jobs | List/search job postings | GET | filters (role, location, remote, visa) | paginated posting list |
| /jobs/{id} | Get single posting detail | GET | job id | posting detail |
| /matches | Get ranked matches for current student | GET | filters (optional) | ranked list of (job, score) |
| /matches/{jobId}/score | Get/recompute score for one job | GET | job id | single match score + breakdown |
| /skills/taxonomy | Resolve/normalize a free-text skill | GET | raw skill string | canonical skill id/name |

---

## 7. AI/ML Components

**AI tasks:**
- Skill normalization (mapping free-text/resume-derived skill mentions to a canonical taxonomy).
- Resume information extraction (skills, education, experience segments from unstructured text).
- Match scoring (producing the 0–100 "Match Score" per student–job pair).

**Models required:**
- **Rule-based/weighted scorer (launch version):** hard-constraint filter (visa/work-auth, location/remote) + weighted linear combination of skill-overlap ratio, GPA-threshold satisfaction, and experience-level fit. No training required — appropriate given no historical interaction data exists at launch.
- **Semantic similarity layer (enhancement):** sentence-embedding model comparing resume/skill text against job description text (cosine similarity) to catch near-matches the taxonomy misses (e.g., "React" vs "Frontend development").
- **Learned re-ranker (later maturity):** a supervised model (e.g., gradient-boosted trees or logistic regression) trained on outcome labels (applied, shortlisted, hired) once enough interaction data accumulates.

**Training vs. inference:**
- Rule-based scorer: inference-only, no training loop.
- Embedding similarity: uses a pre-trained embedding model at inference; no fine-tuning needed initially.
- Learned re-ranker: requires a labeled training set built from real usage (cold-start problem — cannot exist at MVP stage).

**Feature engineering:** skill-overlap ratio (Jaccard/cosine over normalized skill sets), GPA-threshold satisfaction (boolean/scaled), work-authorization compatibility (boolean hard filter), location/remote compatibility (boolean/distance-based), resume–job-description semantic similarity score.

**Data preprocessing:** resume text extraction and cleaning, tokenization, skill-string normalization against the taxonomy (synonym resolution), embedding generation for semantic similarity.

**Model outputs:** a normalized Match Score (0–100%) per posting, and optionally a feature-level breakdown (why the score was produced) to support explainability on the dashboard.

---

## 8. Security Requirements

| Concern | Approach |
|---|---|
| Authentication | JWT access + refresh tokens |
| Authorization | Role checks distinguishing student vs. posting-management roles; students may only read/modify their own profile and resume |
| Encryption | TLS in transit; encryption at rest for resumes and PII fields (GPA, work-auth status) |
| Input validation | File type/size checks on resume upload; server-side validation of all profile/job fields (not just client-side) |
| API security | Rate limiting on auth and matching endpoints, CORS restricted to known origins, request schema validation (DTOs) to reject malformed payloads |
| Data protection | Work-authorization status and resumes are sensitive PII — apply least-privilege access, avoid exposing raw resume text in match-score API responses unless explicitly requested |

---

## 9. Scalability Considerations

- **Expected load pattern:** read-heavy on the matching/dashboard endpoint (every dashboard load can trigger a scoring pass), write-light on profile/job creation.
- **Performance bottleneck:** naive scoring is O(students × jobs); this must never run as a full cross-join at request time.
- **Mitigation:** apply hard-constraint filters (visa, location, remote) at the database query level first to shrink the candidate set before any scoring computation runs.
- **Caching:** cache `MatchScore` rows keyed by (student_id, job_id) with invalidation triggered on profile or job update; cache popular filter-query result sets briefly.
- **Horizontal scaling:** stateless backend API instances behind a load balancer; the matching/scoring logic can be extracted into its own service and scaled independently once load justifies it (e.g., async recompute via a queue rather than synchronous scoring on every dashboard load).
- **Database optimization:** composite indexes on filter fields (see Section 5), read replicas for dashboard-heavy read traffic, batched recomputation of match scores (e.g., nightly or event-triggered) rather than per-request computation at scale.

---

## 10. Third-Party Integrations

| Service | Why Needed |
|---|---|
| Resume parsing library/API (e.g., Affinda, pyresparser, or a self-hosted NLP pipeline) | Converts unstructured resume files into structured skills/education/experience data |
| Object storage (S3-compatible) | Stores uploaded resume files reliably outside the application server |
| Email/notification service (e.g., SendGrid) | Notifies students of new high-match postings |
| Geocoding API (optional) | Enables distance-based "near me" location filtering rather than exact-string location matching |
| OAuth provider (optional, e.g., Google) | Simplifies signup/login friction for students |

---

## 11. Edge Cases

| Scenario | Handling Approach |
|---|---|
| Corrupted/unsupported resume file | Reject at upload with clear error; do not silently fail parsing |
| Incomplete profile (missing GPA/skills) | Allow partial matching with a reduced-confidence score or explicit "incomplete profile" flag |
| No postings match given filters | Return empty state with suggestion to relax filters, not an error |
| Duplicate profile/registration attempts | Enforce uniqueness constraint on student email at the database layer |
| Conflicting/contradictory filters | Validate filter combinations server-side; return empty result set rather than erroring |
| Job posting expired mid-session | Exclude via `status = active` filter at query time regardless of cached scores |
| Network interruption during resume upload | Support resumable/retryable upload; do not persist partial files |
| Stale cached match score after profile/job edit | Invalidate relevant `MatchScore` rows on any update to the underlying profile or posting |
| Race condition: job updated while scoring in progress | Recompute scores as an idempotent operation keyed by (student_id, job_id), safe to overwrite |

---

## 12. Technical Challenges

- **Cold-start scoring:** there is no historical interaction data at launch, so the matching engine must be effective as a rule/heuristic system before any learned ranking model is viable.
- **Skill taxonomy normalization:** free-text skills (resume-derived or self-reported) arrive in inconsistent forms ("JS", "JavaScript", "ReactJS") and must be reliably mapped to a canonical set without losing legitimate distinctions.
- **Resume parsing accuracy:** resumes vary widely in layout and format; extraction quality directly determines matching quality, and errors here are hard to detect downstream.
- **Balancing hard constraints vs. soft ranking:** visa/work-authorization and location are typically non-negotiable (hard filters), while skill/experience fit should be ranked continuously — mixing these incorrectly produces either overly rigid or misleadingly ranked results.
- **Keeping scores fresh without recomputing everything:** as profiles and postings change continuously, the system needs a scoped invalidation/recompute strategy rather than full recomputation on every change.

---

## 13. Recommended Tech Stack

| Layer | Recommendation | Rationale |
|---|---|---|
| Frontend | Angular + TypeScript + Tailwind CSS | Matches the hackathon's stated preferred stack; Angular's structured module system suits a form-heavy (profile) + data-heavy (dashboard) application |
| Backend | Spring Boot (Java) with REST APIs, JWT auth | Stated as "highly preferred"; strong fit for a CRUD-heavy service layer with clear module boundaries |
| Database | MySQL (relational) | Stated as preferred; the domain (students, jobs, skills, scores) is inherently relational with clear join needs |
| AI/ML | Python microservice (resume parsing, embeddings, scoring) | Python's NLP/ML ecosystem is best suited to parsing and embedding work; can run as a separate service the Spring Boot backend calls over REST, keeping concerns decoupled |
| Storage | S3-compatible object storage | Purpose-built for durable file storage, keeps large binary resume files out of the relational database |
| Auth | JWT-based auth (Spring Security) | Consistent with the stated preferred stack; stateless tokens simplify horizontal scaling |
| DevOps | Containerized services (Docker), CI pipeline for build/test | Enables consistent deployment of the polyglot backend + AI service split |
| Cloud | Any managed platform supporting containers + managed MySQL | Keeps infrastructure operations minimal during a hackathon timeline |

---

## 14. Development Roadmap

**Phase 1 — MVP**
- Student profile CRUD (skills, GPA, work-auth status) without resume parsing (manual skill entry).
- Job posting CRUD (manually seeded/admin-entered data).
- Rule-based match scoring using hard filters + skill-overlap ratio.
- Basic dashboard listing ranked postings with a numeric match score.

**Phase 2**
- Resume upload + parsing pipeline integrated into profile creation.
- Skill taxonomy normalization service.
- Full filter set (role, location, remote/onsite, visa sponsorship) wired into query-level pre-filtering.
- Match-score caching layer.

**Phase 3**
- Semantic similarity layer (embeddings) supplementing rule-based scoring.
- Score explainability breakdown surfaced on the dashboard.
- Notification triggers for new high-match postings.

**Final Production**
- Extracted, independently scalable matching/scoring service.
- Learned re-ranking model once sufficient interaction data exists.
- Full monitoring, caching invalidation strategy, and read-replica database setup for scale.

---

## 15. Deliverables

- **UI:** Profile creation/edit form, resume upload interface, filter controls, ranked dashboard feed with match-score indicators.
- **Backend:** Auth service, Profile service, Job Posting service, Matching orchestration service, Filter/query layer.
- **Database:** Schema covering Student, Resume, Skill, StudentSkill, JobPosting, JobRequiredSkill, MatchScore.
- **APIs:** All endpoints listed in Section 6.
- **AI Models:** Rule-based scorer (MVP), embedding-based semantic similarity module (later phase), learned re-ranker (mature phase).
- **Admin/Recruiter-side posting management:** minimal CRUD interface for creating/updating job postings (required to populate the matching pool, even though the primary experience described is student-facing).
- **Integrations:** Resume parsing service, object storage, notification service.
