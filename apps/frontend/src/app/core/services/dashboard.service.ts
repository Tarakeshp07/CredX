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

// ── Mock Jobs Data ───────────────────────────────────────────────────────────
const MOCK_MATCHES: MatchItem[] = [
  {
    job: {
      id: 1,
      title: "Backend Engineer Intern",
      description: "Build REST APIs with Node.js and SQL. Optimize backend query performance and design secure endpoints.",
      company: "Nimbus Labs",
      roleType: "Backend",
      employmentType: "INTERNSHIP",
      location: "Bengaluru",
      remoteMode: "HYBRID",
      visaSponsorship: false,
      minGpa: 7.0,
      minExperience: 0,
      status: "ACTIVE",
      requiredSkills: [{ id: 1, name: "Node.js" }, { id: 2, name: "SQL" }, { id: 3, name: "REST APIs" }, { id: 4, name: "Git" }]
    },
    matchScore: 85,
    band: "STRONG",
    matchedSkills: ["Node.js", "SQL", "Git"],
    missingSkills: ["REST APIs"],
    applied: false
  },
  {
    job: {
      id: 2,
      title: "Frontend Developer",
      description: "Build premium customer dashboard user interfaces with React, Tailwind, and Next.js.",
      company: "Pixelworks",
      roleType: "Frontend",
      employmentType: "FULL_TIME",
      location: "Remote",
      remoteMode: "REMOTE",
      visaSponsorship: true,
      minGpa: 6.5,
      minExperience: 1,
      status: "ACTIVE",
      requiredSkills: [{ id: 5, name: "React" }, { id: 6, name: "Next.js" }, { id: 7, name: "TypeScript" }, { id: 8, name: "HTML/CSS" }]
    },
    matchScore: 92,
    band: "STRONG",
    matchedSkills: ["React", "TypeScript", "HTML/CSS"],
    missingSkills: ["Next.js"],
    applied: false
  },
  {
    job: {
      id: 3,
      title: "Full-Stack Engineer",
      description: "Develop scalable features across Node.js backend and React frontend dashboards.",
      company: "Stackforge",
      roleType: "Full-Stack",
      employmentType: "FULL_TIME",
      location: "Hyderabad",
      remoteMode: "ONSITE",
      visaSponsorship: false,
      minGpa: 7.0,
      minExperience: 2,
      status: "ACTIVE",
      requiredSkills: [{ id: 5, name: "React" }, { id: 1, name: "Node.js" }, { id: 7, name: "TypeScript" }, { id: 2, name: "SQL" }, { id: 3, name: "REST APIs" }]
    },
    matchScore: 78,
    band: "GOOD",
    matchedSkills: ["React", "Node.js", "TypeScript", "SQL"],
    missingSkills: ["REST APIs"],
    applied: false
  },
  {
    job: {
      id: 4,
      title: "Data Science Intern",
      description: "Train machine learning models with Python, Pandas, and Scikit-Learn.",
      company: "Quantum Analytics",
      roleType: "Data",
      employmentType: "INTERNSHIP",
      location: "Remote",
      remoteMode: "REMOTE",
      visaSponsorship: false,
      minGpa: 8.0,
      minExperience: 0,
      status: "ACTIVE",
      requiredSkills: [{ id: 9, name: "Python" }, { id: 10, name: "Pandas" }, { id: 11, name: "Machine Learning" }]
    },
    matchScore: 40,
    band: "FAIR",
    matchedSkills: ["Python"],
    missingSkills: ["Pandas", "Machine Learning"],
    applied: false
  },
  {
    job: {
      id: 5,
      title: "Java Backend Developer",
      description: "Build resilient enterprise Spring Boot microservices and REST APIs.",
      company: "Enterprise Soft",
      roleType: "Backend",
      employmentType: "FULL_TIME",
      location: "Pune",
      remoteMode: "ONSITE",
      visaSponsorship: false,
      minGpa: 6.5,
      minExperience: 2,
      status: "ACTIVE",
      requiredSkills: [{ id: 12, name: "Java" }, { id: 13, name: "Spring Boot" }, { id: 2, name: "SQL" }, { id: 3, name: "REST APIs" }]
    },
    matchScore: 65,
    band: "GOOD",
    matchedSkills: ["SQL"],
    missingSkills: ["Java", "Spring Boot", "REST APIs"],
    applied: false
  }
];

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  private isDemo(): boolean {
    return localStorage.getItem('credx_demo') === 'true';
  }

  private getAppliedJobs(): number[] {
    const raw = localStorage.getItem('credx_applied_jobs');
    return raw ? JSON.parse(raw) : [];
  }

  private saveAppliedJobs(ids: number[]): void {
    localStorage.setItem('credx_applied_jobs', JSON.stringify(ids));
  }

  /** GET /matches — returns ranked matches with active filters */
  getMatches(filters: MatchFilters = {}): Observable<MatchListResponse> {
    if (this.isDemo()) {
      return new Observable<MatchListResponse>((sub) => {
        const applied = this.getAppliedJobs();
        let items = MOCK_MATCHES.map(item => ({
          ...item,
          applied: applied.includes(item.job.id)
        }));

        // Apply filters
        if (filters.search) {
          const s = filters.search.toLowerCase();
          items = items.filter(i => i.job.title.toLowerCase().includes(s) || i.job.company.toLowerCase().includes(s));
        }
        if (filters.roleType) {
          items = items.filter(i => i.job.roleType === filters.roleType);
        }
        if (filters.remoteMode) {
          items = items.filter(i => i.job.remoteMode === filters.remoteMode);
        }
        if (filters.employmentType) {
          items = items.filter(i => i.job.employmentType === filters.employmentType);
        }
        if (filters.visaSponsorship != null) {
          items = items.filter(i => i.job.visaSponsorship === filters.visaSponsorship);
        }

        sub.next({ count: items.length, items });
        sub.complete();
      });
    }

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
    if (this.isDemo()) {
      return new Observable<void>((sub) => {
        const applied = this.getAppliedJobs();
        if (!applied.includes(jobId)) {
          applied.push(jobId);
          this.saveAppliedJobs(applied);
        }
        sub.next();
        sub.complete();
      });
    }
    return this.http.post<void>(`${API_BASE}/applications/${jobId}`, {});
  }

  /** DELETE /applications/{jobId} — withdraw application */
  withdraw(jobId: number): Observable<void> {
    if (this.isDemo()) {
      return new Observable<void>((sub) => {
        const applied = this.getAppliedJobs();
        const updated = applied.filter(id => id !== jobId);
        this.saveAppliedJobs(updated);
        sub.next();
        sub.complete();
      });
    }
    return this.http.delete<void>(`${API_BASE}/applications/${jobId}`);
  }
}
