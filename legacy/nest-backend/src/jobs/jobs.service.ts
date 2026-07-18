import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SkillsService } from '../skills/skills.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private skills: SkillsService,
  ) {}

  /** Build the hard-constraint WHERE clause used by both /jobs and matching. */
  buildWhere(q: QueryJobsDto): Prisma.JobPostingWhereInput {
    const where: Prisma.JobPostingWhereInput = { status: 'ACTIVE' };
    if (q.roleType) where.roleType = q.roleType;
    if (q.remoteMode) where.remoteMode = q.remoteMode;
    if (q.employmentType) where.employmentType = q.employmentType;
    if (typeof q.visaSponsorship === 'boolean') where.visaSponsorship = q.visaSponsorship;
    if (q.location) where.location = { contains: q.location };
    if (q.search) {
      where.OR = [
        { title: { contains: q.search } },
        { company: { contains: q.search } },
        { description: { contains: q.search } },
      ];
    }
    return where;
  }

  async list(q: QueryJobsDto) {
    const where = this.buildWhere(q);
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const [total, jobs] = await Promise.all([
      this.prisma.jobPosting.count({ where }),
      this.prisma.jobPosting.findMany({
        where,
        include: { requiredSkills: { include: { skill: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { total, page, pageSize, items: jobs.map((j) => this.shape(j)) };
  }

  async findOne(id: number) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { id },
      include: { requiredSkills: { include: { skill: true } } },
    });
    if (!job) throw new NotFoundException('Job not found');
    return this.shape(job);
  }

  async create(dto: CreateJobDto, postedById: number) {
    const { skills, ...data } = dto;
    const job = await this.prisma.jobPosting.create({ data: { ...data, postedById } });
    await this.setSkills(job.id, skills);
    await this.invalidateMatches(job.id);
    return this.findOne(job.id);
  }

  async update(id: number, dto: UpdateJobDto) {
    await this.findOne(id);
    const { skills, ...data } = dto;
    await this.prisma.jobPosting.update({ where: { id }, data });
    if (skills) await this.setSkills(id, skills);
    await this.invalidateMatches(id);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.jobPosting.delete({ where: { id } });
    return { deleted: true };
  }

  private async setSkills(jobId: number, skills?: string[]) {
    if (!skills) return;
    const skillIds = await this.skills.resolveMany(skills);
    await this.prisma.jobRequiredSkill.deleteMany({ where: { jobId } });
    if (skillIds.length) {
      await this.prisma.jobRequiredSkill.createMany({
        data: skillIds.map((skillId) => ({ jobId, skillId, weight: 1 })),
      });
    }
  }

  private async invalidateMatches(jobId: number) {
    await this.prisma.matchScore.deleteMany({ where: { jobId } });
  }

  private shape(job: any) {
    return {
      id: job.id,
      title: job.title,
      description: job.description,
      company: job.company,
      roleType: job.roleType,
      employmentType: job.employmentType,
      location: job.location,
      remoteMode: job.remoteMode,
      visaSponsorship: job.visaSponsorship,
      minGpa: job.minGpa,
      minExperience: job.minExperience,
      status: job.status,
      createdAt: job.createdAt,
      requiredSkills: (job.requiredSkills ?? []).map((r: any) => ({
        id: r.skill.id,
        name: r.skill.name,
        weight: r.weight,
      })),
    };
  }
}
