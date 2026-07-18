/**
 * CredX — Centralized TypeScript model interfaces
 * All interfaces mirror the Spring Boot backend DTOs exactly.
 */

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface UserSummary {
  id: number;
  email: string;
  role: 'STUDENT' | 'RECRUITER';
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserSummary;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'STUDENT' | 'RECRUITER';
}

// ── Skills ────────────────────────────────────────────────────────────────────

export interface SkillDto {
  id: number;
  name: string;
  category?: string;  // present in taxonomy endpoint
}

// ── Profile ───────────────────────────────────────────────────────────────────

export type WorkAuthStatus =
  | 'CITIZEN'
  | 'PERMANENT_RESIDENT'
  | 'STUDENT_VISA'
  | 'NEEDS_SPONSORSHIP'
  | 'UNKNOWN';

export interface ProfileDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  gpa: number | null;
  workAuthStatus: WorkAuthStatus;
  experienceYears: number | null;
  desiredRole: string;
  preferredLocation: string;
  openToRemote: boolean;
  profileCompleted: boolean;
  skills: SkillDto[];
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  gpa?: number | null;
  workAuthStatus?: WorkAuthStatus;
  experienceYears?: number | null;
  desiredRole?: string;
  preferredLocation?: string;
  openToRemote?: boolean;
  skills?: string[];  // skill names — backend resolves via synonym map
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

export type RemoteMode     = 'ONSITE' | 'REMOTE' | 'HYBRID';
export type EmploymentType = 'FULL_TIME' | 'INTERNSHIP' | 'PART_TIME';
export type MatchBand      = 'STRONG' | 'GOOD' | 'FAIR';

export interface JobDto {
  id: number;
  title: string;
  description: string;
  company: string;
  roleType: string;
  employmentType: EmploymentType;
  location: string;
  remoteMode: RemoteMode;
  visaSponsorship: boolean;
  minGpa: number | null;
  minExperience: number;
  status: string;
  requiredSkills: SkillDto[];
}

// ── Matches ───────────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  hardPass: boolean;
  hardReason: string;
  score: number;
  band: MatchBand;
  factors: Record<string, number>;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface MatchItem {
  job: JobDto;
  matchScore: number;
  band: MatchBand;
  matchedSkills: string[];
  missingSkills: string[];
  applied: boolean;
}

export interface MatchListResponse {
  count: number;
  items: MatchItem[];
}

export interface ScoreResult {
  job: JobDto;
  breakdown: ScoreBreakdown;
}

export interface MatchFilters {
  search?: string;
  roleType?: string;
  location?: string;
  remoteMode?: RemoteMode | '';
  employmentType?: EmploymentType | '';
  visaSponsorship?: boolean;
}

export type SortMode = 'score' | 'recent' | 'title';

// ── Applications ──────────────────────────────────────────────────────────────

export interface ApplicationDto {
  id: number;
  jobId: number;
  jobTitle: string;
  company: string;
  appliedAt: string; // ISO-8601
  status: string;
}

// ── UI State ──────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;  // ms, default 3500
}
