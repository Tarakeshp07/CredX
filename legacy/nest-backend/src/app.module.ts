import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SkillsModule } from './skills/skills.module';
import { StudentsModule } from './students/students.module';
import { JobsModule } from './jobs/jobs.module';
import { MatchesModule } from './matches/matches.module';
import { ApplicationsModule } from './applications/applications.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    SkillsModule,
    StudentsModule,
    JobsModule,
    MatchesModule,
    ApplicationsModule,
    HealthModule,
  ],
})
export class AppModule {}
