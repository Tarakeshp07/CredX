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

const MOCK_SKILLS: SkillDto[] = [
  { id: 1, name: "Node.js" },
  { id: 2, name: "SQL" },
  { id: 3, name: "REST APIs" },
  { id: 4, name: "Git" },
  { id: 5, name: "React" },
  { id: 6, name: "Next.js" },
  { id: 7, name: "TypeScript" },
  { id: 8, name: "HTML/CSS" },
  { id: 9, name: "Python" },
  { id: 10, name: "Pandas" },
  { id: 11, name: "Machine Learning" },
  { id: 12, name: "Java" },
  { id: 13, name: "Spring Boot" }
];

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private http: HttpClient) {}

  private isDemo(): boolean {
    return localStorage.getItem('credx_demo') === 'true';
  }

  private getMockProfile(): ProfileDto {
    const raw = localStorage.getItem('credx_demo_profile');
    if (raw) return JSON.parse(raw);

    const defaultProfile: ProfileDto = {
      id: 9999,
      email: 'student@credx.dev',
      firstName: 'Sam (Demo)',
      lastName: 'Student',
      phone: '123-456-7890',
      role: 'STUDENT',
      gpa: 7.6,
      workAuthStatus: 'CITIZEN',
      experienceYears: 1,
      desiredRole: 'Backend',
      preferredLocation: 'Remote',
      openToRemote: true,
      profileCompleted: true,
      skills: [{ id: 1, name: "Node.js" }, { id: 2, name: "SQL" }, { id: 4, name: "Git" }]
    };
    this.saveMockProfile(defaultProfile);
    return defaultProfile;
  }

  private saveMockProfile(profile: ProfileDto): void {
    localStorage.setItem('credx_demo_profile', JSON.stringify(profile));
  }

  /** GET /profile — returns the authenticated student's profile */
  getProfile(): Observable<ProfileDto> {
    if (this.isDemo()) {
      return new Observable<ProfileDto>((sub) => {
        sub.next(this.getMockProfile());
        sub.complete();
      });
    }
    return this.http.get<ProfileDto>(`${API_BASE}/profile`);
  }

  /** PUT /profile — updates the student's profile */
  updateProfile(req: UpdateProfileRequest): Observable<ProfileDto> {
    if (this.isDemo()) {
      return new Observable<ProfileDto>((sub) => {
        const current = this.getMockProfile();
        const updated: ProfileDto = {
          ...current,
          firstName: req.firstName !== undefined ? req.firstName : current.firstName,
          lastName: req.lastName !== undefined ? req.lastName : current.lastName,
          phone: req.phone !== undefined ? req.phone : current.phone,
          gpa: req.gpa !== undefined ? req.gpa : current.gpa,
          workAuthStatus: req.workAuthStatus !== undefined ? req.workAuthStatus : current.workAuthStatus,
          experienceYears: req.experienceYears !== undefined ? req.experienceYears : current.experienceYears,
          desiredRole: req.desiredRole !== undefined ? req.desiredRole : current.desiredRole,
          preferredLocation: req.preferredLocation !== undefined ? req.preferredLocation : current.preferredLocation,
          openToRemote: req.openToRemote !== undefined ? req.openToRemote : current.openToRemote,
          skills: req.skills !== undefined ? MOCK_SKILLS.filter(s => req.skills?.includes(s.name)) : current.skills,
          profileCompleted: true
        };
        this.saveMockProfile(updated);
        sub.next(updated);
        sub.complete();
      });
    }
    return this.http.put<ProfileDto>(`${API_BASE}/profile`, req);
  }

  /** GET /skills — returns the full skill taxonomy list */
  getSkillTaxonomy(): Observable<SkillDto[]> {
    if (this.isDemo()) {
      return new Observable<SkillDto[]>((sub) => {
        sub.next(MOCK_SKILLS);
        sub.complete();
      });
    }
    return this.http.get<SkillDto[]>(`${API_BASE}/skills`);
  }
}
