import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { QueryJobsDto } from '../jobs/dto/query-jobs.dto';
import { JobSignal, ScoreBreakdown, StudentSignal, scoreMatch } from './scoring';

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private jobs: JobsService,
  ) {}

  private async loadStudentSignal(userId: number): Promise<StudentSignal & { exists: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { skills: { include: { skill: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      exists: true,
      gpa: user.gpa,
      workAuthStatus: user.workAuthStatus,
      experienceYears: user.experienceYears,
      openToRemote: user.openToRemote,
      preferredLocation: user.preferredLocation,
      skillNames: new Set(user.skills.map((s) => s.skill.name)),
    };
  }

  private toJobSignal(job: any): JobSignal {
    return {
      minGpa: job.minGpa,
      minExperience: job.minExperience,
      visaSponsorship: job.visaSponsorship,
      remoteMode: job.remoteMode,
      location: job.location,
      requiredSkills: (job.requiredSkills ?? []).map((r: any) => ({
        name: r.skill.name,
        weight: r.weight,
      })),
    };
  }

  /** Ranked matches for a student, honoring dashboard filters (F6). */
  async getMatches(userId: number, query: QueryJobsDto) {
    const student = await this.loadStudentSignal(userId);
    const where = this.jobs.buildWhere(query);

    const jobs = await this.prisma.jobPosting.findMany({
      where,
      include: { requiredSkills: { include: { skill: true } } },
    });

    const results = jobs
      .map((job) => ({ job, breakdown: scoreMatch(student, this.toJobSignal(job)) }))
      .filter((r) => r.breakdown.hardPass) // drop hard-constraint failures
      .sort((a, b) => b.breakdown.score - a.breakdown.score);

    // Persist/refresh the cache (upsert per student–job).
    await Promise.all(
      results.map((r) =>
        this.prisma.matchScore.upsert({
          where: { userId_jobId: { userId, jobId: r.job.id } },
          update: { score: r.breakdown.score, breakdown: JSON.stringify(r.breakdown) },
          create: {
            userId,
            jobId: r.job.id,
            score: r.breakdown.score,
            breakdown: JSON.stringify(r.breakdown),
          },
        }),
      ),
    );

    // Which of these has the student already applied to / saved?
    const [applications, saved] = await Promise.all([
      this.prisma.application.findMany({ where: { userId }, select: { jobId: true } }),
      this.prisma.savedJob.findMany({ where: { userId }, select: { jobId: true } }),
    ]);
    const appliedSet = new Set(applications.map((a) => a.jobId));
    const savedSet = new Set(saved.map((s) => s.jobId));

    return {
      count: results.length,
      items: results.map((r) => ({
        ...this.shapeJob(r.job),
        matchScore: r.breakdown.score,
        band: r.breakdown.band,
        matchedSkills: r.breakdown.matchedSkills,
        missingSkills: r.breakdown.missingSkills,
        applied: appliedSet.has(r.job.id),
        saved: savedSet.has(r.job.id),
      })),
    };
  }

  /** Single job score + full breakdown (F: explainability). */
  async scoreOne(userId: number, jobId: number) {
    const student = await this.loadStudentSignal(userId);
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: { requiredSkills: { include: { skill: true } } },
    });
    if (!job) throw new NotFoundException('Job not found');

    const breakdown: ScoreBreakdown = scoreMatch(student, this.toJobSignal(job));
    await this.prisma.matchScore.upsert({
      where: { userId_jobId: { userId, jobId } },
      update: { score: breakdown.score, breakdown: JSON.stringify(breakdown) },
      create: { userId, jobId, score: breakdown.score, breakdown: JSON.stringify(breakdown) },
    });

    return { ...this.shapeJob(job), breakdown };
  }

  private shapeJob(job: any) {
    return {
      id: job.id,
      title: job.title,
      company: job.company,
      roleType: job.roleType,
      employmentType: job.employmentType,
      location: job.location,
      remoteMode: job.remoteMode,
      visaSponsorship: job.visaSponsorship,
      minGpa: job.minGpa,
      minExperience: job.minExperience,
      description: job.description,
      requiredSkills: (job.requiredSkills ?? []).map((r: any) => ({
        id: r.skill.id,
        name: r.skill.name,
        weight: r.weight,
      })),
    };
  }
}
