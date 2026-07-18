import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async apply(userId: number, jobId: number) {
    const job = await this.prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    const existing = await this.prisma.application.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    if (existing) throw new ConflictException('Already applied to this job');
    return this.prisma.application.create({ data: { userId, jobId } });
  }

  async withdraw(userId: number, jobId: number) {
    const existing = await this.prisma.application.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    if (!existing) throw new NotFoundException('Application not found');
    await this.prisma.application.delete({ where: { userId_jobId: { userId, jobId } } });
    return { withdrawn: true };
  }

  async list(userId: number) {
    const apps = await this.prisma.application.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { appliedAt: 'desc' },
    });
    return apps.map((a) => ({
      id: a.id,
      status: a.status,
      appliedAt: a.appliedAt,
      job: {
        id: a.job.id,
        title: a.job.title,
        company: a.job.company,
        location: a.job.location,
        remoteMode: a.job.remoteMode,
      },
    }));
  }
}
