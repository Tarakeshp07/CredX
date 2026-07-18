// Rule-based Match Score (0..100). No ML, no training — deterministic and
// explainable, which is exactly right for a cold-start system with no
// historical interaction data.
//
// Split (per the technical analysis):
//   HARD constraints  -> gate eligibility (visa/work-auth). Fail => excluded.
//   SOFT factors      -> weighted 0..1 signals, combined into the score.

export interface StudentSignal {
  gpa: number | null;
  workAuthStatus: string;
  experienceYears: number | null;
  openToRemote: boolean;
  preferredLocation: string;
  skillNames: Set<string>; // canonical skill names the student has
}

export interface JobSignal {
  minGpa: number | null;
  minExperience: number;
  visaSponsorship: boolean;
  remoteMode: string; // ONSITE | REMOTE | HYBRID
  location: string;
  requiredSkills: { name: string; weight: number }[];
}

export interface ScoreBreakdown {
  hardPass: boolean;
  hardReason?: string;
  score: number; // 0..100
  band: 'Strong' | 'Good' | 'Fair' | 'Low';
  factors: {
    skillOverlap: number;
    gpa: number;
    experience: number;
    remoteFit: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
}

const WEIGHTS = { skillOverlap: 0.6, gpa: 0.2, experience: 0.15, remoteFit: 0.05 };

function needsSponsorship(status: string): boolean {
  return status === 'NEEDS_SPONSORSHIP' || status === 'STUDENT_VISA';
}

function band(score: number): ScoreBreakdown['band'] {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Low';
}

export function scoreMatch(student: StudentSignal, job: JobSignal): ScoreBreakdown {
  // ---- HARD constraint: visa / work authorization ----
  if (needsSponsorship(student.workAuthStatus) && !job.visaSponsorship) {
    return {
      hardPass: false,
      hardReason: 'Requires visa sponsorship, which this role does not offer',
      score: 0,
      band: 'Low',
      factors: { skillOverlap: 0, gpa: 0, experience: 0, remoteFit: 0 },
      matchedSkills: [],
      missingSkills: job.requiredSkills.map((s) => s.name),
    };
  }

  // ---- SOFT factor: skill overlap (weighted) ----
  const matched: string[] = [];
  const missing: string[] = [];
  let matchedWeight = 0;
  let totalWeight = 0;
  for (const rs of job.requiredSkills) {
    totalWeight += rs.weight;
    if (student.skillNames.has(rs.name)) {
      matched.push(rs.name);
      matchedWeight += rs.weight;
    } else {
      missing.push(rs.name);
    }
  }
  const skillOverlap = totalWeight > 0 ? matchedWeight / totalWeight : 0.5;

  // ---- SOFT factor: GPA threshold satisfaction ----
  let gpa: number;
  if (job.minGpa == null) gpa = 1;
  else if (student.gpa == null) gpa = 0.5;
  else if (student.gpa >= job.minGpa) gpa = 1;
  else gpa = Math.max(0, 1 - (job.minGpa - student.gpa) / 2);

  // ---- SOFT factor: experience fit ----
  let experience: number;
  if (student.experienceYears == null) experience = 0.6;
  else if (student.experienceYears >= job.minExperience) experience = 1;
  else experience = Math.max(0, 1 - (job.minExperience - student.experienceYears) / 3);

  // ---- SOFT factor: remote / location fit ----
  let remoteFit: number;
  if (job.remoteMode === 'REMOTE') remoteFit = student.openToRemote ? 1 : 0.7;
  else if (job.remoteMode === 'HYBRID') remoteFit = 0.85;
  else {
    const loc = student.preferredLocation.trim().toLowerCase();
    const jobLoc = job.location.trim().toLowerCase();
    remoteFit = loc && jobLoc && jobLoc.includes(loc) ? 1 : 0.6;
  }

  const raw =
    WEIGHTS.skillOverlap * skillOverlap +
    WEIGHTS.gpa * gpa +
    WEIGHTS.experience * experience +
    WEIGHTS.remoteFit * remoteFit;
  const score = Math.round(raw * 100);

  return {
    hardPass: true,
    score,
    band: band(score),
    factors: {
      skillOverlap: round2(skillOverlap),
      gpa: round2(gpa),
      experience: round2(experience),
      remoteFit: round2(remoteFit),
    },
    matchedSkills: matched,
    missingSkills: missing,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
