import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../services/auth.service';

// ── Backend-aligned types ────────────────────────────────────────────────────

export interface SkillDto {
  id: number;
  name: string;
}

export interface ProfileDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  gpa: number | null;
  workAuthStatus: string;
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
  workAuthStatus?: string;
  experienceYears?: number | null;
  desiredRole?: string;
  preferredLocation?: string;
  openToRemote?: boolean;
  skills?: string[];   // skill names — backend resolves via synonym map
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private http: HttpClient) {}

  /** GET /profile — returns the authenticated student's profile */
  getProfile(): Observable<ProfileDto> {
    return this.http.get<ProfileDto>(`${API_BASE}/profile`);
  }

  /** PUT /profile — updates the student's profile */
  updateProfile(req: UpdateProfileRequest): Observable<ProfileDto> {
    return this.http.put<ProfileDto>(`${API_BASE}/profile`, req);
  }

  /** GET /skills — returns the full skill taxonomy list */
  getSkillTaxonomy(): Observable<SkillDto[]> {
    return this.http.get<SkillDto[]>(`${API_BASE}/skills`);
  }
}
