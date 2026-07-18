import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SkillsService } from '../skills/skills.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private skills: SkillsService,
  ) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { skills: { include: { skill: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.shape(user);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    // Update scalar fields.
    const { skills, ...scalars } = dto;
    await this.prisma.user.update({ where: { id: userId }, data: scalars });

    // Replace skill set if provided.
    if (skills) {
      const skillIds = await this.skills.resolveMany(skills);
      await this.prisma.studentSkill.deleteMany({ where: { userId } });
      if (skillIds.length) {
        await this.prisma.studentSkill.createMany({
          data: skillIds.map((skillId) => ({ userId, skillId })),
        });
      }
    }

    // Mark completeness + invalidate cached match scores (profile changed).
    const fresh = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { skills: true },
    });
    const completed =
      !!fresh &&
      fresh.gpa != null &&
      fresh.workAuthStatus !== 'UNKNOWN' &&
      fresh.skills.length > 0;
    await this.prisma.user.update({
      where: { id: userId },
      data: { profileCompleted: completed },
    });
    await this.prisma.matchScore.deleteMany({ where: { userId } });

    return this.getProfile(userId);
  }

  private shape(user: any) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      roleId: user.roleId,
      gpa: user.gpa,
      workAuthStatus: user.workAuthStatus,
      experienceYears: user.experienceYears,
      desiredRole: user.desiredRole,
      preferredLocation: user.preferredLocation,
      openToRemote: user.openToRemote,
      profileCompleted: user.profileCompleted,
      skills: (user.skills ?? []).map((s: any) => ({
        id: s.skill.id,
        name: s.skill.name,
        proficiency: s.proficiency,
      })),
    };
  }
}
