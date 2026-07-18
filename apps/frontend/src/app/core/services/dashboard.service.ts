import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../services/auth.service';

// ── Backend-aligned types ─────────────────────────────────────────────────────

export interface SkillRef {
  id: number;
  name: string;
}

export interface JobDto {
  id: number;
  title: string;
  description: string;
  company: string;
  roleType: string;
  employmentType: string;   // FULL_TIME | INTERNSHIP | PART_TIME
  location: string;
  remoteMode: string;       // ONSITE | REMOTE | HYBRID
  visaSponsorship: boolean;
  minGpa: number | null;
  minExperience: number;
  status: string;
  requiredSkills: SkillRef[];
}

export interface MatchItem {
  job: JobDto;
  matchScore: number;
  band: string;             // STRONG | GOOD | FAIR
  matchedSkills: string[];
  missingSkills: string[];
  applied: boolean;
}

export interface MatchListResponse {
  count: number;
  items: MatchItem[];
}

export interface MatchFilters {
  search?: string;
  roleType?: string;
  location?: string;
  remoteMode?: string;
  employmentType?: string;
  visaSponsorship?: boolean;
}

export type SortMode = 'score' | 'recent' | 'title';

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  /** GET /matches — returns ranked matches with active filters */
  getMatches(filters: MatchFilters = {}): Observable<MatchListResponse> {
    let params = new HttpParams();
    if (filters.search)          params = params.set('search',          filters.search);
    if (filters.roleType)        params = params.set('roleType',        filters.roleType);
    if (filters.location)        params = params.set('location',        filters.location);
    if (filters.remoteMode)      params = params.set('remoteMode',      filters.remoteMode);
    if (filters.employmentType)  params = params.set('employmentType',  filters.employmentType);
    if (filters.visaSponsorship != null)
      params = params.set('visaSponsorship', String(filters.visaSponsorship));

    return this.http.get<MatchListResponse>(`${API_BASE}/matches`, { params });
  }

  /** POST /applications/{jobId} — apply to a job */
  apply(jobId: number): Observable<void> {
    return this.http.post<void>(`${API_BASE}/applications/${jobId}`, {});
  }

  /** DELETE /applications/{jobId} — withdraw application */
  withdraw(jobId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/applications/${jobId}`);
  }
}
